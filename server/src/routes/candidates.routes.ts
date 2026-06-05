import express from 'express';
import { z } from 'zod';
import { candidateService } from '../firebase/services/candidateService.js';
import { resumeService } from '../firebase/services/resumeService.js';
import { feedbackService } from '../firebase/services/feedbackService.js';
import { jobService } from '../firebase/services/jobService.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { getLeetCodeProfile } from '../services/external.js';
import { getGitHubProfile } from '../services/github.service.js';
import { scoreCandidate } from '../services/ai.service.js';

export const candidatesRouter = express.Router();

candidatesRouter.post('/analyze', auth, async (req, res) => {
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

    const githubAnalysis = await getGitHubProfile(body.data.githubUsername ?? 'uploaded-dev');
    const leetcodeAnalysis = getLeetCodeProfile(body.data.leetcodeUsername ?? 'uploaded-dev');

    let aiScore = 50;
    let matchPercentage = 50;
    let recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject' = 'Maybe';
    let skillGap: any[] = [];
    let explanation: string[] = [];

    try {
      const scored = await scoreCandidate(job.extractedData, resume.parsedData, githubAnalysis, leetcodeAnalysis);
      aiScore = scored.aiScore ?? 50;
      matchPercentage = scored.matchPercentage ?? 50;
      recommendation = (scored.recommendation as any) ?? 'Maybe';
      skillGap = scored.skillGap ?? [];
      explanation = scored.explanation ?? [];
    } catch (error) {
      console.error('[candidates] AI scoring failed, falling back to basic scoring:', error);
      const required = job.extractedData.skills ?? [];
      const candidateSkills = resume.parsedData.skills || [];
      const matched = required.filter((skill: string) =>
        candidateSkills.some((cs: string) => cs.toLowerCase().includes(skill.toLowerCase()))
      );
      matchPercentage = Math.round((matched.length / Math.max(required.length, 1)) * 100);
      aiScore = Math.min(100, Math.max(0, matchPercentage + (body.data.githubUsername ? 8 : 0) + (body.data.leetcodeUsername ? 5 : 0) - (required.length - matched.length) * 5));
      recommendation = aiScore >= 90 ? 'Strong Hire' : aiScore >= 75 ? 'Hire' : aiScore >= 60 ? 'Maybe' : 'Reject';
      skillGap = required.map((skill: string) => ({
        skill,
        isRequired: true,
        candidateHas: matched.includes(skill) ? 'match' : 'missing',
        evidence: matched.includes(skill) ? 'Found in parsed resume skills' : 'No direct evidence in resume'
      }));
      explanation = ['AI scoring service was unavailable. Basic rule-based analysis used instead.'];
    }

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
      githubAnalysis,
      leetcodeAnalysis,
      skillGap,
      explanation,
      recruiterDecision: 'pending',
      recruiterReason: ''
    });

    res.status(201).json({ candidate });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.get('/', auth, async (req: AuthedRequest, res) => {
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
    res.json({ candidates: filteredList });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.get('/job/:jobId', auth, async (req: AuthedRequest, res) => {
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
    res.json({ candidates: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.get('/:id', auth, async (req: AuthedRequest, res) => {
  try {
    const candidate = await candidateService.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    const [resume, job, history] = await Promise.all([
      resumeService.findById(candidate.resumeId),
      jobService.findById(candidate.jobId),
      feedbackService.findAll({ candidateId: candidate.id })
    ]);

    if (req.userRole !== 'candidate' && req.userRole !== 'admin' && job && job.createdBy !== req.userId) {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }

    res.json({ candidate, resume, job, feedback: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.post('/:id/feedback', auth, async (req: AuthedRequest, res) => {
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
