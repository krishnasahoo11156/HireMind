import express, { type Response } from 'express';
import { z } from 'zod';
import { applicationService } from '../firebase/services/applicationService.js';
import { userService } from '../firebase/services/userService.js';
import { resumeService } from '../firebase/services/resumeService.js';
import { candidateService } from '../firebase/services/candidateService.js';
import { jobService } from '../firebase/services/jobService.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadResumeToStorage } from '../firebase/storageService.js';
import { extractResumeData, minimalFallback, scoreCandidate } from '../services/ai.service.js';
import { extractText } from '../services/documentParser.js';
import { getLeetCodeProfile } from '../services/external.js';
import { getGitHubProfile } from '../services/github.service.js';
import { getSocketServer } from '../socket.js';
import { normalizeSkills, matchSkills } from '../services/skillMatcher.js';
import { mapCandidate, mapJob } from '../utils/mappers.js';

export const applicationsRouter = express.Router();

// Helper: parse uploaded file buffer and produce a resume record object
async function parseResumeBuffer(file: Express.Multer.File, userId?: string): Promise<any> {
  const fileName = file.originalname;
  const fileType: 'pdf' | 'docx' = fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';

  // Upload to Firebase Storage
  let fileUrl = '';
  try {
    fileUrl = await uploadResumeToStorage(file.buffer, fileName, file.mimetype, userId);
  } catch (err) {
    console.warn('[applications] Firebase Storage upload failed:', err);
  }

  let rawText = '';
  try {
    rawText = await extractText(file);
  } catch (err) {
    console.warn(`[applications] Text extraction failed for "${fileName}":`, err);
  }

  if (rawText) {
    try {
      const parsedData = await extractResumeData(rawText);
      parsedData.skills = normalizeSkills(parsedData.skills || []);
      return { fileName, fileUrl, fileType, parsedData, parseStatus: 'parsed', rawText };
    } catch (err) {
      console.warn(`[applications] AI extraction failed for "${fileName}":`, err);
    }
  }

  return {
    fileName,
    fileUrl,
    fileType,
    parsedData: minimalFallback(fileName),
    parseStatus: 'manual_review',
    rawText: rawText || undefined
  };
}

// POST /api/applications — Apply for a job
applicationsRouter.post('/', auth, upload.single('file'), async (req: AuthedRequest, res: Response) => {
  const { jobId, githubUrl, linkedinUrl, portfolioUrl, leetcodeUsername, name, whyApplying } = req.body;

  if (!jobId) {
    res.status(400).json({ error: 'Job ID is required' });
    return;
  }

  try {
    const job = await jobService.findById(jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const user = await userService.findById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent duplicate applications
    const existingApp = await applicationService.findOne({ candidateId: user.id, jobId });
    if (existingApp) {
      res.status(400).json({ error: 'You have already applied to this job' });
      return;
    }

    let resumeUrl = '';
    if (req.file) {
      try {
        resumeUrl = await uploadResumeToStorage(req.file.buffer, req.file.originalname, req.file.mimetype, user.id);
      } catch (err) {
        console.warn('[applications] Resume upload to Firebase Storage failed:', err);
      }
    }

    const application = await applicationService.create({
      candidateId: user.id,
      jobId,
      status: 'Applied',
      resumeUrl,
      githubUrl: githubUrl || undefined,
      linkedinUrl: linkedinUrl || undefined,
      portfolioUrl: portfolioUrl || undefined,
      leetcodeUsername: leetcodeUsername || undefined,
      candidateName: name || user.name,
      whyApplying: whyApplying || undefined
    });

    // Increment applications count on the job
    await jobService.incrementApplicationsCount(jobId);

    res.status(201).json({ application });

    // Run the asynchronous evaluation pipeline in the background
    void (async () => {
      try {
        const socket = getSocketServer();
        const candidateRoom = `candidate:${user.id}`;
        const appId = application.id;

        socket.emit('application:new', { application, candidateName: user.name });
        socket.emit('notification:new', {
          message: `New candidate ${user.name} applied for "${job.title}".`,
          type: 'recruiter'
        });

        // ─── STAGE 1: Applied (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));
        socket.to(candidateRoom).emit('tracker:update', {
          applicationId: appId,
          status: 'Applied',
          updatedAt: new Date().toISOString()
        });

        // ─── STAGE 2: Resume Parsed (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));

        let parsedResume;
        if (req.file) {
          const parsedObj = await parseResumeBuffer(req.file, user.id);
          parsedResume = await resumeService.create(parsedObj);
        } else {
          parsedResume = await resumeService.create({
            fileName: 'uploaded_resume.pdf',
            fileUrl: '',
            fileType: 'pdf',
            parsedData: {
              name: user.name,
              email: user.email,
              skills: ['React', 'TypeScript', 'TailwindCSS'],
              experience: [],
              projects: [],
              education: [],
              certifications: [],
              links: {}
            }
          });
        }

        await applicationService.update(appId, { status: 'Resume Parsed' });

        socket.to(candidateRoom).emit('tracker:update', {
          applicationId: appId,
          status: 'Resume Parsed',
          updatedAt: new Date().toISOString()
        });

        // ─── STAGE 3: AI Analysis (Delay 2s) ───
        await new Promise((r) => setTimeout(r, 2000));
        await applicationService.update(appId, { status: 'AI Analysis' });

        socket.to(candidateRoom).emit('tracker:update', {
          applicationId: appId,
          status: 'AI Analysis',
          updatedAt: new Date().toISOString()
        });

        // Fetch profiles
        let ghUsername = '';
        if (githubUrl) {
          const clean = githubUrl.trim().replace(/\/$/, '');
          const parts = clean.split('/');
          ghUsername = parts[parts.length - 1];
        }
        if (!ghUsername) {
          ghUsername = leetcodeUsername || user.name.toLowerCase().replace(/\s/g, '');
        }
        const githubAnalysis = await getGitHubProfile(ghUsername);
        const leetcodeAnalysis = getLeetCodeProfile(ghUsername);

        const matchResult = matchSkills(job.requiredSkills || [], parsedResume.parsedData);
        const matchPercentage = matchResult.matchPercentage;
        const skillGap = matchResult.skillGap;
        let aiScore = 70;
        let recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject' = 'Maybe';
        let explanation: string[] = [];

        try {
          const scored = await scoreCandidate(job.extractedData, parsedResume.parsedData, githubAnalysis, leetcodeAnalysis);
          const experienceMatch = scored.experienceMatch ?? 70;
          const githubScore = scored.githubScore ?? (githubAnalysis?.totalCommits ? 70 : 0);
          const leetcodeScore = scored.leetcodeScore ?? (leetcodeAnalysis?.problemsSolved ? 70 : 0);
          
          aiScore = Math.round(
            (matchPercentage * 0.6) +
            (experienceMatch * 0.2) +
            (githubScore * 0.1) +
            (leetcodeScore * 0.1)
          );
          recommendation = scored.recommendation ?? 'Maybe';
          explanation = scored.explanation ?? [];
        } catch (err) {
          console.error('[applications] Async scoring failed:', err);
          const experienceMatch = 70;
          const githubScore = githubAnalysis?.totalCommits ? 70 : 0;
          const leetcodeScore = leetcodeAnalysis?.problemsSolved ? 70 : 0;
          aiScore = Math.round(
            (matchPercentage * 0.6) +
            (experienceMatch * 0.2) +
            (githubScore * 0.1) +
            (leetcodeScore * 0.1)
          );
          recommendation = aiScore >= 90 ? 'Strong Hire' : aiScore >= 75 ? 'Hire' : aiScore >= 60 ? 'Maybe' : 'Reject';
          explanation = ['AI scoring service was unavailable. Basic rule-based analysis used instead.'];
        }

        const candidateRecord = await candidateService.create({
          resumeId: parsedResume.id,
          jobId,
          name: name || user.name,
          email: user.email,
          username: user.leetcodeUsername || (user.githubUrl ? user.githubUrl.split('/').pop() : '') || user.email.split('@')[0],
          blindId: `Candidate-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          isBlindMode: false,
          aiScore,
          matchPercentage,
          recommendation,
          githubAnalysis,
          leetcodeAnalysis,
          skillGap,
          explanation,
          recruiterDecision: 'pending',
          recruiterReason: '',
          whyApplying: whyApplying || ''
        });

        // ─── STAGE 4: Under Review (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));

        await applicationService.update(appId, {
          status: 'Under Review',
          aiScore,
          recommendation
        });

        socket.to(candidateRoom).emit('tracker:update', {
          applicationId: appId,
          status: 'Under Review',
          aiScore,
          recommendation,
          updatedAt: new Date().toISOString()
        });

        socket.emit('application:status', {
          applicationId: appId,
          status: 'Under Review',
          candidate: mapCandidate(candidateRecord)
        });

      } catch (pipelineErr) {
        console.error('[applications] Error in async pipeline:', pipelineErr);
      }
    })();

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/my — Candidate's own applications
applicationsRouter.get('/my', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const list = await applicationService.findAll({ candidateId: req.userId });
    res.json({ applications: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/:id — Single application detail
applicationsRouter.get('/:id', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const app = await applicationService.findById(req.params.id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (req.userRole === 'candidate' && app.candidateId !== req.userId) {
      res.status(403).json({ error: 'Access denied: not your application' });
      return;
    }

    if (req.userRole === 'recruiter') {
      const job = await jobService.findById(app.jobId);
      if (job && job.createdBy !== req.userId) {
        res.status(403).json({ error: 'Access denied: job owner only' });
        return;
      }
    }

    const job = await jobService.findById(app.jobId);
    res.json({ application: app, job: job ? mapJob(job) : null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/applications/:id/status — Update stage (Recruiter Action)
applicationsRouter.patch('/:id/status', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const app = await applicationService.findById(req.params.id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (req.userRole !== 'admin') {
      const job = await jobService.findById(app.jobId);
      if (!job || job.createdBy !== req.userId) {
        res.status(403).json({ error: 'Access denied: job owner only' });
        return;
      }
    }

    const body = z.object({
      status: z.enum([
        'Applied', 'Resume Parsed', 'AI Analysis', 'Under Review',
        'Shortlisted', 'Interview', 'Selected', 'Rejected'
      ])
    }).safeParse(req.body);

    if (!body.success) {
      res.status(400).json({ error: 'Invalid status stage value' });
      return;
    }

    const newStatus = body.data.status;
    await applicationService.update(app.id, { status: newStatus });

    // Find corresponding candidate profile and update recruiterDecision
    const candidateUser = await userService.findById(app.candidateId);
    if (candidateUser) {
      const candidate = await candidateService.findOne({ email: candidateUser.email, jobId: app.jobId });
      if (candidate) {
        let recruiterDecision = candidate.recruiterDecision;
        let recruiterReason = candidate.recruiterReason;
        if (newStatus === 'Shortlisted') {
          recruiterDecision = 'override_select';
          recruiterReason = 'Shortlisted via application pipeline';
        } else if (newStatus === 'Selected') {
          recruiterDecision = 'agree';
          recruiterReason = 'Final selection approved';
        } else if (newStatus === 'Rejected') {
          recruiterDecision = 'override_reject';
          recruiterReason = 'Rejected in screening';
        }
        await candidateService.update(candidate.id, { recruiterDecision, recruiterReason });
      }
    }

    // Trigger sockets
    const socket = getSocketServer();
    socket.to(`candidate:${app.candidateId}`).emit('tracker:update', {
      applicationId: app.id,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    socket.emit('application:status', { applicationId: app.id, status: newStatus });

    const job = await jobService.findById(app.jobId);
    socket.to(`candidate:${app.candidateId}`).emit('notification:new', {
      message: `Your application to "${job?.title || 'Job'}" has been updated to "${newStatus}".`,
      type: 'candidate'
    });

    const updatedApp = await applicationService.findById(app.id);
    res.json({ application: updatedApp });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
