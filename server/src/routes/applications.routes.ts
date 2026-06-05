import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ApplicationModel, UserModel, ResumeModel, CandidateModel, JobModel } from '../models/schemas.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractResumeData, minimalFallback, scoreCandidate } from '../services/ai.service.js';
import { extractText } from '../services/documentParser.js';
import { getLeetCodeProfile } from '../services/external.js';
import { getGitHubProfile } from '../services/github.service.js';
import { getSocketServer } from '../socket.js';
import { mapCandidate } from '../utils/mappers.js';

export const applicationsRouter = express.Router();

// Helper to parse file and get Resume record
async function parseResumeFile(file: Express.Multer.File): Promise<any> {
  const fileName = file.originalname;
  const publicBase = process.env.PUBLIC_FILE_BASE_URL ?? 'http://localhost:5001/uploads';
  const fileUrl = `${publicBase}/${path.basename(file.filename ?? fileName)}`;
  const fileType: 'pdf' | 'docx' = fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';

  let rawText = '';
  try {
    rawText = await extractText(file);
  } catch (err) {
    console.warn(`[applications] Text extraction failed for "${fileName}":`, err);
  }

  if (rawText) {
    try {
      const parsedData = await extractResumeData(rawText);
      return {
        fileName,
        fileUrl,
        fileType,
        parsedData,
        parseStatus: 'parsed',
        rawText
      };
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

// POST /api/applications - Apply for a job
applicationsRouter.post('/', auth, upload.single('file'), async (req: AuthedRequest, res) => {
  const { jobId, githubUrl, linkedinUrl, portfolioUrl, leetcodeUsername } = req.body;
  
  if (!jobId) {
    res.status(400).json({ error: 'Job ID is required' });
    return;
  }

  try {
    const job = await JobModel.findById(jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const user = await UserModel.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent duplicate applications
    const existingApp = await ApplicationModel.findOne({ candidateId: user._id, jobId });
    if (existingApp) {
      res.status(400).json({ error: 'You have already applied to this job' });
      return;
    }

    let resumeUrl = '';
    if (req.file) {
      const publicBase = process.env.PUBLIC_FILE_BASE_URL ?? 'http://localhost:5001/uploads';
      resumeUrl = `${publicBase}/${path.basename(req.file.filename ?? req.file.originalname)}`;
    }

    // Create the application in DB
    const application = await ApplicationModel.create({
      candidateId: user._id,
      jobId,
      status: 'Applied',
      resumeUrl,
      githubUrl: githubUrl || undefined,
      linkedinUrl: linkedinUrl || undefined,
      portfolioUrl: portfolioUrl || undefined,
      leetcodeUsername: leetcodeUsername || undefined
    });

    // Increment applications count on the job
    await JobModel.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

    res.status(201).json({ application });

    // Run the asynchronous evaluation pipeline in background
    void (async () => {
      try {
        const socket = getSocketServer();
        const candidateRoom = `candidate:${user._id}`;
        const appId = application._id.toString();

        // Notify recruiters that a new application has arrived
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
          const parsedObj = await parseResumeFile(req.file);
          parsedResume = await ResumeModel.create(parsedObj);
        } else {
          // Fallback demo resume
          parsedResume = await ResumeModel.create({
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

        application.status = 'Resume Parsed';
        application.updatedAt = new Date();
        await application.save();

        socket.to(candidateRoom).emit('tracker:update', {
          applicationId: appId,
          status: 'Resume Parsed',
          updatedAt: application.updatedAt.toISOString()
        });

        // ─── STAGE 3: AI Analysis (Delay 2s) ───
        await new Promise((r) => setTimeout(r, 2000));
        application.status = 'AI Analysis';
        application.updatedAt = new Date();
        await application.save();

        socket.to(candidateRoom).emit('tracker:update', {
          applicationId: appId,
          status: 'AI Analysis',
          updatedAt: application.updatedAt.toISOString()
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

        // Perform AI scoring
        let aiScore = 70;
        let matchPercentage = 70;
        let recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject' = 'Maybe';
        let skillGap: any[] = [];
        let explanation: string[] = [];

        try {
          const scored = await scoreCandidate(job.extractedData, parsedResume.parsedData, githubAnalysis, leetcodeAnalysis);
          aiScore = scored.aiScore ?? 70;
          matchPercentage = scored.matchPercentage ?? 70;
          recommendation = (scored.recommendation as any) ?? 'Maybe';
          skillGap = scored.skillGap ?? [];
          explanation = scored.explanation ?? [];
        } catch (err) {
          console.error('[applications] Async scoring failed:', err);
        }

        // Create a recruiter-visible Candidate profile
        const candidateRecord = await CandidateModel.create({
          resumeId: parsedResume._id,
          jobId,
          name: user.name,
          email: user.email,
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
          recruiterReason: ''
        });

        // ─── STAGE 4: Under Review (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));
        
        application.status = 'Under Review';
        application.aiScore = aiScore;
        application.recommendation = recommendation;
        application.updatedAt = new Date();
        await application.save();

        socket.to(candidateRoom).emit('tracker:update', {
          applicationId: appId,
          status: 'Under Review',
          aiScore,
          recommendation,
          updatedAt: application.updatedAt.toISOString()
        });

        socket.emit('application:status', { applicationId: appId, status: 'Under Review', candidate: mapCandidate(candidateRecord) });

      } catch (pipelineErr) {
        console.error('[applications] Error in async pipeline:', pipelineErr);
      }
    })();

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/my - Retrieve candidate's applications
applicationsRouter.get('/my', auth, async (req: AuthedRequest, res) => {
  try {
    const list = await ApplicationModel.find({ candidateId: req.userId });
    res.json({ applications: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/:id - Retrieve specific application detail
applicationsRouter.get('/:id', auth, async (req, res) => {
  try {
    const app = await ApplicationModel.findById(req.params.id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }
    const job = await JobModel.findById(app.jobId);
    res.json({ application: app, job });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/applications/:id/status - Update stage (Recruiter Action)
applicationsRouter.patch('/:id/status', auth, async (req: AuthedRequest, res) => {
  try {
    const app = await ApplicationModel.findById(req.params.id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const body = z.object({
      status: z.enum([
        'Applied',
        'Resume Parsed',
        'AI Analysis',
        'Under Review',
        'Shortlisted',
        'Interview',
        'Selected',
        'Rejected'
      ])
    }).safeParse(req.body);

    if (!body.success) {
      res.status(400).json({ error: 'Invalid status stage value' });
      return;
    }

    const newStatus = body.data.status;
    app.status = newStatus;
    app.updatedAt = new Date();
    await app.save();

    // Find corresponding candidate profile and update recruiterDecision if shortlisted/selected/rejected
    const candidateUser = await UserModel.findById(app.candidateId);
    if (candidateUser) {
      const candidate = await CandidateModel.findOne({ email: candidateUser.email, jobId: app.jobId });
      if (candidate) {
        if (newStatus === 'Shortlisted') {
          candidate.recruiterDecision = 'override_select';
          candidate.recruiterReason = 'Shortlisted via application pipeline';
        } else if (newStatus === 'Selected') {
          candidate.recruiterDecision = 'agree';
          candidate.recruiterReason = 'Final selection approved';
        } else if (newStatus === 'Rejected') {
          candidate.recruiterDecision = 'override_reject';
          candidate.recruiterReason = 'Rejected in screening';
        }
        await candidate.save();
      }
    }

    // Trigger sockets
    const socket = getSocketServer();
    socket.to(`candidate:${app.candidateId}`).emit('tracker:update', {
      applicationId: app._id.toString(),
      status: newStatus,
      updatedAt: app.updatedAt.toISOString()
    });

    socket.emit('application:status', { applicationId: app._id.toString(), status: newStatus });

    // Notify the candidate
    const job = await JobModel.findById(app.jobId);
    socket.to(`candidate:${app.candidateId}`).emit('notification:new', {
      message: `Your application to "${job?.title || 'Job'}" has been updated to "${newStatus}".`,
      type: 'candidate'
    });

    res.json({ application: app });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
