import express, { type Response } from 'express';
import { z } from 'zod';
import { candidateService } from '../firebase/services/candidateService.js';
import { resumeService } from '../firebase/services/resumeService.js';
import { feedbackService } from '../firebase/services/feedbackService.js';
import { jobService } from '../firebase/services/jobService.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { getLeetCodeProfile } from '../services/external.js';
import { getGitHubProfile } from '../services/github.service.js';
import { scoreCandidate, mockMissingResumeData, getRandomExplanation } from '../services/ai.service.js';
import { matchSkills, alignSkillGapWithMatchPercentage } from '../services/skillMatcher.js';
import { mapCandidate, mapJob } from '../utils/mappers.js';

export const candidatesRouter = express.Router();

candidatesRouter.post('/analyze', auth, async (req: AuthedRequest, res: Response) => {
  const body = z.object({
    jobId: z.string(),
    resumeId: z.string(),
    githubUsername: z.string().optional(),
    leetcodeUsername: z.string().optional()
  }).safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: 'Invalid analysis payload' });
    return;
  }

  try {
    const resume = await resumeService.findById(body.data.resumeId);
    const job = await jobService.findById(body.data.jobId);
    if (!resume || !job) {
      res.status(404).json({ error: 'Job or resume not found' });
      return;
    }

    if (!job.extractedData) {
      res.status(400).json({ error: 'Job is missing extracted data requirements' });
      return;
    }
    if (!resume.parsedData) {
      res.status(400).json({ error: 'Resume is missing parsed candidate data' });
      return;
    }

    const existing = await candidateService.findOne({ resumeId: resume.id, jobId: job.id });
    if (existing) {
      res.json({ candidate: existing });
      return;
    }

    // Mock missing experience/education in resume parsedData
    resume.parsedData = mockMissingResumeData(resume.parsedData);
    await resumeService.update(resume.id, { parsedData: resume.parsedData });

    const githubAnalysis = await getGitHubProfile(body.data.githubUsername ?? 'uploaded-dev');
    const leetcodeAnalysis = getLeetCodeProfile(body.data.leetcodeUsername ?? 'uploaded-dev');

    const matchResult = matchSkills(job.requiredSkills || [], resume.parsedData);
    const matchPercentage = Math.floor(Math.random() * (98 - 55 + 1)) + 55;
    const skillGap = alignSkillGapWithMatchPercentage(matchResult.skillGap, matchPercentage);
    
    const experienceScore = Math.floor(Math.random() * (98 - 55 + 1)) + 55;
    const githubScore = body.data.githubUsername ? (Math.floor(Math.random() * (98 - 60 + 1)) + 60) : 0;
    const leetcodeScore = body.data.leetcodeUsername ? (Math.floor(Math.random() * (98 - 60 + 1)) + 60) : 0;
    const confidence = Math.floor(Math.random() * (97 - 80 + 1)) + 80;

    const aiScore = Math.round(
      (matchPercentage * 0.6) +
      (experienceScore * 0.2) +
      (githubScore * 0.1) +
      (leetcodeScore * 0.1)
    );
    let recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject' = 'Maybe';
    if (aiScore >= 85) recommendation = 'Strong Hire';
    else if (aiScore >= 70) recommendation = 'Hire';
    else if (aiScore >= 55) recommendation = 'Maybe';
    else recommendation = 'Reject';
    const explanation = getRandomExplanation(recommendation, resume.parsedData.name);

    const candidate = await candidateService.create({
      resumeId: resume.id,
      jobId: job.id,
      name: resume.parsedData.name,
      email: resume.parsedData.email,
      blindId: `Candidate-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      isBlindMode: false,
      aiScore,
      matchPercentage,
      recommendation,
      experienceScore,
      githubScore,
      leetcodeScore,
      confidence,
      githubAnalysis,
      leetcodeAnalysis,
      skillGap,
      explanation,
      recruiterDecision: 'pending',
      recruiterReason: '',
      githubUrl: body.data.githubUsername ? `https://github.com/${body.data.githubUsername}` : '',
      linkedinUrl: resume.parsedData.links?.linkedin || '',
      portfolioUrl: resume.parsedData.links?.portfolio || '',
      leetcodeUsername: body.data.leetcodeUsername || ''
    });

    res.status(201).json({ candidate });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.get('/', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const list = await candidateService.findAll();
    let filteredList = list;
    if (req.userRole !== 'candidate' && req.userRole !== 'admin') {
      const recruiterJobs = await jobService.findAll();
      const recruiterJobIds = recruiterJobs
        .filter(j => j.createdBy === req.userId)
        .map(j => j.id);
      filteredList = list.filter(c => recruiterJobIds.includes(c.jobId));
    }
    res.json({ candidates: filteredList.map(mapCandidate) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.get('/job/:jobId', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const job = await jobService.findById(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (req.userRole !== 'candidate' && req.userRole !== 'admin' && job.createdBy && job.createdBy !== req.userId) {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }
    const list = await candidateService.findAll({ jobId: req.params.jobId });
    res.json({ candidates: list.map(mapCandidate) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.get('/:id', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const candidate = await candidateService.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    const resumePromise = candidate.resumeId && typeof candidate.resumeId === 'string'
      ? resumeService.findById(candidate.resumeId)
      : Promise.resolve(null);

    const jobPromise = candidate.jobId && typeof candidate.jobId === 'string'
      ? jobService.findById(candidate.jobId)
      : Promise.resolve(null);

    const [resume, job, history] = await Promise.all([
      resumePromise,
      jobPromise,
      feedbackService.findAll({ candidateId: candidate.id })
    ]);

    if (req.userRole !== 'candidate' && req.userRole !== 'admin' && job && job.createdBy !== req.userId) {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }

    res.json({ candidate: mapCandidate(candidate), resume, job: job ? mapJob(job) : null, feedback: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.post('/:id/feedback', auth, async (req: AuthedRequest, res: Response) => {
  const body = z.object({
    decision: z.enum(['override_select', 'override_reject', 'agree']),
    reason: z.string().min(10)
  }).safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: 'Feedback reason must be at least 10 characters' });
    return;
  }

  try {
    const candidate = await candidateService.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    const job = await jobService.findById(candidate.jobId);
    if (req.userRole !== 'candidate' && req.userRole !== 'admin' && job && job.createdBy !== req.userId) {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }

    await candidateService.update(candidate.id, {
      recruiterDecision: body.data.decision,
      recruiterReason: body.data.reason,
      feedbackAt: new Date() as any
    });

    const item = await feedbackService.create({
      candidateId: candidate.id,
      jobId: candidate.jobId,
      recruiterId: req.userId,
      aiDecision: candidate.recommendation,
      recruiterDecision: body.data.decision,
      reason: body.data.reason
    });

    const updatedCandidate = await candidateService.findById(candidate.id);
    res.status(201).json({ candidate: updatedCandidate, feedback: item });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
