import express from 'express';
import path from 'path';
import { z } from 'zod';
import { applications, users, resumes, candidates, jobs } from '../data.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractResumeData, minimalFallback, scoreCandidate } from '../services/ai.service.js';
import { extractText } from '../services/documentParser.js';
import { getGithubProfile, getLeetCodeProfile } from '../services/external.js';
import { getSocketServer } from '../socket.js';
import type { Application, Resume, Candidate } from '../types.js';

export const applicationsRouter = express.Router();

// Helper to parse file and get Resume record
async function parseResumeFile(file: Express.Multer.File, index = 0): Promise<Resume> {
  const fileName = file.originalname;
  const publicBase = process.env.PUBLIC_FILE_BASE_URL ?? 'http://localhost:5001/uploads';
  const fileUrl = `${publicBase}/${path.basename(file.filename ?? fileName)}`;
  const fileType: 'pdf' | 'docx' = fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';
  const resumeId = `resume_${Date.now()}_${index}`;

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
        _id: resumeId,
        fileName,
        fileUrl,
        fileType,
        parsedData,
        parseStatus: 'parsed',
        uploadedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn(`[applications] AI extraction failed for "${fileName}":`, err);
    }
  }

  return {
    _id: resumeId,
    fileName,
    fileUrl,
    fileType,
    parsedData: minimalFallback(fileName),
    parseStatus: 'manual_review',
    rawText: rawText || undefined,
    uploadedAt: new Date().toISOString()
  };
}

// POST /api/applications - Apply for a job
applicationsRouter.post('/', auth, upload.single('file'), async (req: AuthedRequest, res) => {
  const { jobId, githubUrl, linkedinUrl, portfolioUrl, leetcodeUsername } = req.body;
  
  if (!jobId) {
    res.status(400).json({ error: 'Job ID is required' });
    return;
  }

  const job = jobs.find((j) => j._id === jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const user = users.find((u) => u._id === req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Create base application
  const applicationId = `app_${Date.now()}`;
  const nowStr = new Date().toISOString();
  
  let resumeUrl = '';
  if (req.file) {
    const publicBase = process.env.PUBLIC_FILE_BASE_URL ?? 'http://localhost:5001/uploads';
    resumeUrl = `${publicBase}/${path.basename(req.file.filename ?? req.file.originalname)}`;
  }

  const application: Application = {
    _id: applicationId,
    candidateId: user._id,
    jobId,
    status: 'Applied',
    appliedAt: nowStr,
    updatedAt: nowStr,
    resumeUrl,
    githubUrl: githubUrl || undefined,
    linkedinUrl: linkedinUrl || undefined,
    portfolioUrl: portfolioUrl || undefined,
    leetcodeUsername: leetcodeUsername || undefined
  };

  applications.push(application);

  // Return the newly created application immediately
  res.status(201).json({ application });

  // Run the asynchronous evaluation pipeline in background
  void (async () => {
    try {
      const socket = getSocketServer();
      const candidateRoom = `candidate:${user._id}`;

      // Notify recruiters that a new application has arrived
      socket.emit('application:new', { application, candidateName: user.name });
      socket.emit('notification:new', {
        message: `New candidate ${user.name} applied for "${job.title}".`,
        type: 'recruiter'
      });

      // ─── STAGE 1: Applied (Delay 1.5s) ───
      await new Promise((r) => setTimeout(r, 1500));
      socket.to(candidateRoom).emit('tracker:update', {
        applicationId,
        status: 'Applied',
        updatedAt: new Date().toISOString()
      });

      // ─── STAGE 2: Resume Parsed (Delay 1.5s) ───
      await new Promise((r) => setTimeout(r, 1500));
      
      let parsedResume: Resume;
      if (req.file) {
        parsedResume = await parseResumeFile(req.file);
        resumes.push(parsedResume);
      } else {
        // Fallback demo resume
        parsedResume = {
          _id: `resume_mock_${Date.now()}`,
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
          },
          uploadedAt: new Date().toISOString()
        };
        resumes.push(parsedResume);
      }

      application.status = 'Resume Parsed';
      application.updatedAt = new Date().toISOString();

      socket.to(candidateRoom).emit('tracker:update', {
        applicationId,
        status: 'Resume Parsed',
        updatedAt: application.updatedAt
      });

      // ─── STAGE 3: AI Analysis (Delay 2s) ───
      await new Promise((r) => setTimeout(r, 2000));
      application.status = 'AI Analysis';
      application.updatedAt = new Date().toISOString();

      socket.to(candidateRoom).emit('tracker:update', {
        applicationId,
        status: 'AI Analysis',
        updatedAt: application.updatedAt
      });

      // Fetch profiles
      const ghUsername = leetcodeUsername || user.name.toLowerCase().replace(/\s/g, '');
      const githubAnalysis = getGithubProfile(ghUsername) as Candidate['githubAnalysis'];
      const leetcodeAnalysis = getLeetCodeProfile(ghUsername) as Candidate['leetcodeAnalysis'];

      // Perform AI scoring
      let aiScore = 70;
      let matchPercentage = 70;
      let recommendation: Candidate['recommendation'] = 'Maybe';
      let skillGap: Candidate['skillGap'] = [];
      let explanation: string[] = [];

      try {
        const scored = await scoreCandidate(job.extractedData, parsedResume.parsedData, githubAnalysis, leetcodeAnalysis);
        aiScore = scored.aiScore ?? 70;
        matchPercentage = scored.matchPercentage ?? 70;
        recommendation = scored.recommendation ?? 'Maybe';
        skillGap = scored.skillGap ?? [];
        explanation = scored.explanation ?? [];
      } catch (err) {
        console.error('[applications] Async scoring failed:', err);
      }

      // Create a recruiter-visible Candidate profile
      const candidateRecord: Candidate = {
        _id: `candidate_${Date.now()}`,
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
        recruiterReason: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      candidates.push(candidateRecord);

      // ─── STAGE 4: Under Review (Delay 1.5s) ───
      await new Promise((r) => setTimeout(r, 1500));
      
      application.status = 'Under Review';
      application.aiScore = aiScore;
      application.recommendation = recommendation;
      application.updatedAt = new Date().toISOString();

      socket.to(candidateRoom).emit('tracker:update', {
        applicationId,
        status: 'Under Review',
        aiScore,
        recommendation,
        updatedAt: application.updatedAt
      });

      socket.emit('application:status', { applicationId, status: 'Under Review', candidate: candidateRecord });

    } catch (pipelineErr) {
      console.error('[applications] Error in async pipeline:', pipelineErr);
    }
  })();
});

// GET /api/applications/my - Retrieve candidate's applications
applicationsRouter.get('/my', auth, (req: AuthedRequest, res) => {
  const list = applications.filter((app) => app.candidateId === req.userId);
  res.json({ applications: list });
});

// GET /api/applications/:id - Retrieve specific application detail
applicationsRouter.get('/:id', auth, (req, res) => {
  const app = applications.find((a) => a._id === req.params.id);
  if (!app) {
    res.status(404).json({ error: 'Application not found' });
    return;
  }
  const job = jobs.find((j) => j._id === app.jobId);
  res.json({ application: app, job });
});

// PATCH /api/applications/:id/status - Update stage (Recruiter Action)
applicationsRouter.patch('/:id/status', auth, async (req: AuthedRequest, res) => {
  const app = applications.find((a) => a._id === req.params.id);
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
  app.updatedAt = new Date().toISOString();

  // Find corresponding candidate profile and update recruiterDecision if shortlisted/selected/rejected
  const candidate = candidates.find((c) => c.email === users.find(u => u._id === app.candidateId)?.email && c.jobId === app.jobId);
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
    candidate.updatedAt = new Date().toISOString();
  }

  // Trigger sockets
  const socket = getSocketServer();
  socket.to(`candidate:${app.candidateId}`).emit('tracker:update', {
    applicationId: app._id,
    status: newStatus,
    updatedAt: app.updatedAt
  });

  socket.emit('application:status', { applicationId: app._id, status: newStatus });

  // Notify the candidate
  socket.to(`candidate:${app.candidateId}`).emit('notification:new', {
    message: `Your application to "${jobs.find(j => j._id === app.jobId)?.title}" has been updated to "${newStatus}".`,
    type: 'candidate'
  });

  res.json({ application: app });
});
