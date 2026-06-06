import express, { type Response } from 'express';
import { z } from 'zod';
import { applicationService } from '../firebase/services/applicationService.js';
import { userService } from '../firebase/services/userService.js';
import { resumeService, type FirestoreResume } from '../firebase/services/resumeService.js';
import { col, docToObject } from '../firebase/admin.js';
import { candidateService } from '../firebase/services/candidateService.js';
import { jobService } from '../firebase/services/jobService.js';
import { rankingService } from '../firebase/services/rankingService.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadResumeToStorage } from '../firebase/storageService.js';
import { extractResumeData, minimalFallback, scoreCandidate } from '../services/ai.service.js';
import { extractText } from '../services/documentParser.js';
import { getLeetCodeProfile } from '../services/external.js';
import { getGitHubProfile } from '../services/github.service.js';
import { getSocketServer } from '../socket.js';
import { normalizeSkills, matchSkills } from '../services/skillMatcher.js';
import { mapCandidate, mapJob, mapApplication } from '../utils/mappers.js';

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
    rawText: rawText || ''
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
      recruiterId: job.createdBy || '',
      candidateEmail: user.email,
      status: 'Applied',
      resumeUrl,
      githubUrl: githubUrl || '',
      linkedinUrl: linkedinUrl || '',
      portfolioUrl: portfolioUrl || '',
      leetcodeUsername: leetcodeUsername || '',
      candidateName: name || user.name,
      whyApplying: whyApplying || '',
      analysisStatus: 'pending',
      progress: 10
    });

    // Link application to job
    await jobService.addApplicant(jobId, user.id);

    // Increment applications count on the job
    await jobService.incrementApplicationsCount(jobId);

    // Update candidate profile metadata in 'users' collection on Firestore using admin privilege
    await userService.update(user.id, {
      githubUrl: githubUrl || user.githubUrl || '',
      linkedinUrl: linkedinUrl || user.linkedinUrl || '',
      portfolioUrl: portfolioUrl || user.portfolioUrl || '',
      leetcodeUsername: leetcodeUsername || user.leetcodeUsername || ''
    });

    console.log("Application Created", application);

    const io = getSocketServer();
    io.to(`recruiter-${job.createdBy}`).emit('new_application', {
      candidateId: user.id,
      candidateName: name || user.name,
      jobId,
      jobTitle: job.title
    });

    res.status(201).json({ application: mapApplication(application) });

    // Run the asynchronous evaluation pipeline in the background
    void (async () => {
      const socket = getSocketServer();
      const candidateRoom = `candidate:${user.id}`;
      const appId = application.id;

      const updateProgress = async (
        status: string,
        analysisStatus: 'pending' | 'parsing' | 'analyzing' | 'completed' | 'failed',
        progress: number,
        errorMessage?: string
      ) => {
        console.log(`[pipeline] Progress update: appId=${appId}, status=${status}, analysisStatus=${analysisStatus}, progress=${progress}%`);
        try {
          await applicationService.update(appId, {
            status,
            analysisStatus,
            progress,
            errorMessage: errorMessage || null
          });
          const updatedApp = await applicationService.findById(appId);
          if (updatedApp) {
            socket.to(`job:${jobId}`).emit('application_status_updated', mapApplication(updatedApp));
          }
          socket.to(candidateRoom).emit('tracker:update', {
            applicationId: appId,
            status,
            analysisStatus,
            progress,
            errorMessage,
            updatedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error(`[pipeline] Failed to write progress for ${appId}:`, dbErr);
        }
      };

      try {
        socket.emit('application:new', { application, candidateName: user.name });
        socket.emit('notification:new', {
          message: `New candidate ${user.name} applied for "${job.title}".`,
          type: 'recruiter'
        });

        // ─── STAGE 1: Applied (Delay 1.5s) ───
        console.log("Application Created");
        await new Promise((r) => setTimeout(r, 1500));
        await updateProgress('Applied', 'pending', 10);

        // ─── STAGE 2: Resume Parsed (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));
        console.log("Resume Found");

        let parsedResume;
        try {
          if (req.file) {
            const parsedObj = await parseResumeBuffer(req.file, user.id);
            parsedResume = await resumeService.create(parsedObj);
          } else {
            parsedResume = await resumeService.create({
              fileName: 'uploaded_resume.pdf',
              fileUrl: resumeUrl || '',
              fileType: 'pdf',
              userId: user.id,
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
        } catch (parserErr: any) {
          console.error('[pipeline] Resume parsing failed:', parserErr);
          throw new Error(`Resume parsing failed: ${parserErr.message}`);
        }

        if (!parsedResume || !parsedResume.id || !parsedResume.fileUrl) {
          throw new Error('No resume found');
        }

        console.log("Resume Parsed");
        await updateProgress('Resume Parsed', 'parsing', 25);

        // ─── STAGE 3: AI Analysis (Delay 2s) ───
        await new Promise((r) => setTimeout(r, 2000));
        console.log("Skills Extracted");
        await updateProgress('AI Analysis', 'analyzing', 50);

        console.log("AI Request Started");
        let scoredResult;
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Analysis Timeout')), 60000)
          );

          const scoringPromise = (async () => {
            const githubProfile = user.githubUrl ? await getGitHubProfile(user.githubUrl.split('/').pop() || '') : null;
            const leetcodeProfile = user.leetcodeUsername ? await getLeetCodeProfile(user.leetcodeUsername) : null;
            
            console.log("AI Request inputs:", {
              jobTitle: job.title,
              candidateName: user.name,
              skillsCount: parsedResume.parsedData.skills.length,
              github: !!githubProfile,
              leetcode: !!leetcodeProfile
            });

            const scored = await scoreCandidate(job.extractedData, parsedResume.parsedData, githubProfile || undefined, leetcodeProfile || undefined);
            console.log("AI Response payload received:", scored);
            return { scored, githubProfile, leetcodeProfile };
          })();

          const result = await Promise.race([scoringPromise, timeoutPromise]) as any;
          if (!result || !result.scored) {
            throw new Error('AI scoring service returned null or invalid response');
          }
          scoredResult = result;
        } catch (aiErr: any) {
          console.error('[pipeline] AI Scoring failed or timed out:', aiErr);
          throw new Error(`AI analysis failed: ${aiErr.message}`);
        }

        console.log("AI Response Received");
        await updateProgress('AI Analysis', 'analyzing', 75);

        const { scored, githubProfile, leetcodeProfile } = scoredResult;
        const matchResult = matchSkills(job.requiredSkills || [], parsedResume.parsedData);
        const matchPercentage = matchResult.matchPercentage;
        const skillGap = matchResult.skillGap;
        
        const aiScore = scored.aiScore ?? 70;
        const recommendation = scored.recommendation ?? 'Maybe';
        const explanation = scored.explanation ?? [];

        const candidateRecord = await candidateService.create({
          resumeId: parsedResume.id,
          jobId,
          applicationId: appId,
          name: name || user.name,
          email: user.email,
          username: user.leetcodeUsername || (user.githubUrl ? user.githubUrl.split('/').pop() : '') || user.email.split('@')[0],
          blindId: `Candidate-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          isBlindMode: false,
          aiScore,
          matchPercentage,
          recommendation,
          githubAnalysis: githubProfile ?? {},
          leetcodeAnalysis: leetcodeProfile ?? {},
          skillGap,
          explanation,
          recruiterDecision: 'pending',
          recruiterReason: '',
          whyApplying: whyApplying || ''
        });

        console.log("Candidate Saved");
        await resumeService.update(parsedResume.id, { userId: candidateRecord.id });

        // Trigger Ranking generation
        const ranked = await candidateService.findAll({ jobId });
        await rankingService.create({
          jobId,
          candidates: ranked.map((cand, idx) => ({
            candidateId: cand.id,
            rank: idx + 1,
            score: cand.aiScore ?? 0,
            matchPercentage: cand.matchPercentage ?? 0,
            recommendation: cand.recommendation ?? 'Maybe'
          }))
        });
        console.log("Ranking Updated");

        // ─── STAGE 4: Under Review (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));
        await updateProgress('Under Review', 'completed', 100);

        socket.emit('application:status', {
          applicationId: appId,
          status: 'Under Review',
          candidate: mapCandidate(candidateRecord)
        });

        // Emit candidate_scored and ranking_updated to recruiter job room
        socket.to(`job:${jobId}`).emit('candidate_scored', {
          jobId,
          candidate: mapCandidate(candidateRecord)
        });
        socket.to(`job:${jobId}`).emit('ranking_updated', {
          jobId,
          candidates: ranked.map(mapCandidate)
        });

      } catch (pipelineErr: any) {
        console.error('[applications] Error in async pipeline:', pipelineErr);
        const errMsg = pipelineErr.message || 'Unknown error occurred during analysis';
        try {
          await applicationService.update(appId, {
            status: 'Applied',
            analysisStatus: 'failed',
            progress: 100,
            errorMessage: errMsg
          });
          const updatedApp = await applicationService.findById(appId);
          if (updatedApp) {
            socket.to(`job:${jobId}`).emit('application_status_updated', mapApplication(updatedApp));
          }
          socket.to(candidateRoom).emit('tracker:update', {
            applicationId: appId,
            status: 'Applied',
            analysisStatus: 'failed',
            progress: 100,
            errorMessage: errMsg,
            updatedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error('[applications] Failed to save failure state in outer catch:', dbErr);
        }
      }
    })();

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/applications/analyze — Trigger resume text extraction & AI scoring for a pre-created application ID
applicationsRouter.post('/analyze', auth, upload.single('file'), async (req: AuthedRequest, res: Response) => {
  const { applicationId, jobId, name, whyApplying } = req.body;
  const file = req.file;

  if (!applicationId || !jobId) {
    res.status(400).json({ error: 'Application ID and Job ID are required' });
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

    let resumeUrl = '';
    let parsedResume = null;
    let rawText = '';

    if (file) {
      try {
        resumeUrl = await uploadResumeToStorage(file.buffer, file.originalname, file.mimetype, user.id);
      } catch (err) {
        console.warn('[applications] Resume upload to Firebase Storage failed:', err);
      }

      try {
        rawText = await extractText(file);
      } catch (err) {
        console.warn(`[applications] Text extraction failed for "${file.originalname}":`, err);
      }

      let parsedData = minimalFallback(file.originalname);
      let parseStatus: 'parsed' | 'manual_review' = 'manual_review';
      if (rawText) {
        try {
          parsedData = await extractResumeData(rawText);
          parseStatus = 'parsed';
        } catch (err) {
          console.warn(`[applications] AI extraction failed for "${file.originalname}":`, err);
        }
      }

      parsedResume = await resumeService.create({
        fileName: file.originalname,
        fileUrl: resumeUrl,
        fileType: file.originalname.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
        parsedData,
        parseStatus,
        rawText: rawText || '',
        userId: user.id
      });
    } else {
      // Try to find an existing resume document for this user in the database
      const resumeSnap = await col('resumes').where('userId', '==', user.id).limit(1).get();
      if (!resumeSnap.empty) {
        parsedResume = docToObject<FirestoreResume>(resumeSnap.docs[0]);
      } else {
        const existingApp = await applicationService.findById(applicationId);
        const url = existingApp?.resumeUrl || '';
        if (url) {
          parsedResume = await resumeService.create({
            fileName: url.split('/').pop() || 'resume.pdf',
            fileUrl: url,
            fileType: url.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf',
            userId: user.id,
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
      }
    }

    // Update application to pending status first
    await applicationService.update(applicationId, {
      analysisStatus: 'pending',
      progress: 10,
      errorMessage: null
    });

    res.status(200).json({ success: true, message: 'AI Analysis started' });

    // Run the background evaluation pipeline asynchronously
    void (async () => {
      const socket = getSocketServer();
      const candidateRoom = `candidate:${user.id}`;

      const updateProgress = async (
        status: string,
        analysisStatus: 'pending' | 'parsing' | 'analyzing' | 'completed' | 'failed',
        progress: number,
        errorMessage?: string
      ) => {
        console.log(`[pipeline-analyze] Progress update: appId=${applicationId}, status=${status}, analysisStatus=${analysisStatus}, progress=${progress}%`);
        try {
          await applicationService.update(applicationId, {
            status,
            analysisStatus,
            progress,
            errorMessage: errorMessage || null
          });
          const updatedApp = await applicationService.findById(applicationId);
          if (updatedApp) {
            socket.to(`job:${jobId}`).emit('application_status_updated', mapApplication(updatedApp));
          }
          socket.to(candidateRoom).emit('tracker:update', {
            applicationId,
            status,
            analysisStatus,
            progress,
            errorMessage,
            updatedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error(`[pipeline-analyze] Failed to write progress for ${applicationId}:`, dbErr);
        }
      };

      try {
        // ─── STAGE 1: Applied (Delay 1.5s) ───
        console.log("Application Created");
        await new Promise((r) => setTimeout(r, 1500));
        await updateProgress('Applied', 'pending', 10);

        // ─── STAGE 2: Resume Parsed (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));
        console.log("Resume Found");

        if (!parsedResume || !parsedResume.id || !parsedResume.fileUrl) {
          throw new Error('No resume found');
        }

        console.log("Resume Parsed");
        await updateProgress('Resume Parsed', 'parsing', 25);

        // ─── STAGE 3: AI Analysis (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));
        console.log("Skills Extracted");
        await updateProgress('AI Analysis', 'analyzing', 50);

        console.log("AI Request Started");
        let scoredResult;
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Analysis Timeout')), 60000)
          );

          const scoringPromise = (async () => {
            const githubProfile = user.githubUrl ? await getGitHubProfile(user.githubUrl.split('/').pop() || '') : null;
            const leetcodeProfile = user.leetcodeUsername ? await getLeetCodeProfile(user.leetcodeUsername) : null;
            
            console.log("AI Request inputs:", {
              jobTitle: job.title,
              candidateName: user.name,
              skillsCount: parsedResume.parsedData.skills.length,
              github: !!githubProfile,
              leetcode: !!leetcodeProfile
            });

            const scored = await scoreCandidate(job.extractedData, parsedResume.parsedData, githubProfile || undefined, leetcodeProfile || undefined);
            console.log("AI Response payload received:", scored);
            return { scored, githubProfile, leetcodeProfile };
          })();

          const result = await Promise.race([scoringPromise, timeoutPromise]) as any;
          if (!result || !result.scored) {
            throw new Error('AI scoring service returned null or invalid response');
          }
          scoredResult = result;
        } catch (aiErr: any) {
          console.error('[pipeline-analyze] AI Scoring failed or timed out:', aiErr);
          throw new Error(`AI analysis failed: ${aiErr.message}`);
        }

        console.log("AI Response Received");
        await updateProgress('AI Analysis', 'analyzing', 75);

        const { scored, githubProfile, leetcodeProfile } = scoredResult;
        const matchResult = matchSkills(job.requiredSkills || [], parsedResume.parsedData);
        const matchPercentage = matchResult.matchPercentage;
        const skillGap = matchResult.skillGap;
        
        const aiScore = scored.aiScore ?? 70;
        const recommendation = scored.recommendation ?? 'Maybe';
        const explanation = scored.explanation ?? [];

        const candidateRecord = await candidateService.create({
          resumeId: parsedResume.id,
          jobId,
          applicationId,
          name: name || user.name,
          email: user.email,
          username: user.leetcodeUsername || (user.githubUrl ? user.githubUrl.split('/').pop() : '') || user.email.split('@')[0],
          blindId: `Candidate-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          isBlindMode: false,
          aiScore,
          matchPercentage,
          recommendation,
          githubAnalysis: githubProfile ?? {},
          leetcodeAnalysis: leetcodeProfile ?? {},
          skillGap,
          explanation,
          recruiterDecision: 'pending',
          recruiterReason: '',
          whyApplying: whyApplying || ''
        });

        console.log("Candidate Saved");
        await resumeService.update(parsedResume.id, { userId: candidateRecord.id });

        // Trigger Ranking generation
        const ranked = await candidateService.findAll({ jobId });
        await rankingService.create({
          jobId,
          candidates: ranked.map((cand, idx) => ({
            candidateId: cand.id,
            rank: idx + 1,
            score: cand.aiScore ?? 0,
            matchPercentage: cand.matchPercentage ?? 0,
            recommendation: cand.recommendation ?? 'Maybe'
          }))
        });
        console.log("Ranking Updated");

        // ─── STAGE 4: Under Review (Delay 1.5s) ───
        await new Promise((r) => setTimeout(r, 1500));
        await updateProgress('Under Review', 'completed', 100);

        // Emit candidate_scored and ranking_updated to recruiter job room
        socket.to(`job:${jobId}`).emit('candidate_scored', {
          jobId,
          candidate: mapCandidate(candidateRecord)
        });
        socket.to(`job:${jobId}`).emit('ranking_updated', {
          jobId,
          candidates: ranked.map(mapCandidate)
        });

      } catch (pipelineErr: any) {
        console.error('[applications] Error in async pipeline:', pipelineErr);
        const errMsg = pipelineErr.message || 'Unknown error occurred during analysis';
        try {
          await applicationService.update(applicationId, {
            status: 'Applied',
            analysisStatus: 'failed',
            progress: 100,
            errorMessage: errMsg
          });
          const updatedApp = await applicationService.findById(applicationId);
          if (updatedApp) {
            socket.to(`job:${jobId}`).emit('application_status_updated', mapApplication(updatedApp));
          }
          socket.to(candidateRoom).emit('tracker:update', {
            applicationId,
            status: 'Applied',
            analysisStatus: 'failed',
            progress: 100,
            errorMessage: errMsg,
            updatedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.error('[applications] Failed to save failure state in outer catch:', dbErr);
        }
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
    res.json({ applications: list.map(mapApplication) });
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
    res.json({ application: mapApplication(app), job: job ? mapJob(job) : null });
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
    res.json({ application: mapApplication(updatedApp) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
