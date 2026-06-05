import express from 'express';
import { z } from 'zod';
import { CandidateModel, FeedbackModel, JobModel, ResumeModel } from '../models/schemas.js';
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
    const resume = await ResumeModel.findById(body.data.resumeId);
    const job = await JobModel.findById(body.data.jobId);
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

    const existing = await CandidateModel.findOne({ resumeId: resume._id, jobId: job._id });
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
      const required = job.extractedData.skills;
      const candidateSkills = resume.parsedData.skills || [];
      const matched = required.filter((skill) => candidateSkills.some((candidateSkill) => candidateSkill.toLowerCase().includes(skill.toLowerCase())));
      matchPercentage = Math.round((matched.length / Math.max(required.length, 1)) * 100);
      aiScore = Math.min(100, Math.max(0, matchPercentage + (body.data.githubUsername ? 8 : 0) + (body.data.leetcodeUsername ? 5 : 0) - (required.length - matched.length) * 5));
      recommendation = aiScore >= 90 ? 'Strong Hire' : aiScore >= 75 ? 'Hire' : aiScore >= 60 ? 'Maybe' : 'Reject';
      skillGap = required.map((skill) => ({
        skill,
        isRequired: true,
        candidateHas: matched.includes(skill) ? 'match' : 'missing',
        evidence: matched.includes(skill) ? 'Found in parsed resume skills' : 'No direct evidence in resume'
      }));
      explanation = ['AI scoring service was unavailable. Basic rule-based analysis used instead.'];
    }

    const candidate = await CandidateModel.create({
      resumeId: resume._id,
      jobId: job._id,
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

candidatesRouter.get('/', auth, async (_req, res) => {
  try {
    const list = await CandidateModel.find({});
    res.json({ candidates: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.get('/job/:jobId', auth, async (req, res) => {
  try {
    const list = await CandidateModel.find({ jobId: req.params.jobId }).sort({ aiScore: -1 });
    res.json({ candidates: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

candidatesRouter.get('/:id', auth, async (req, res) => {
  try {
    const candidate = await CandidateModel.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    const resume = await ResumeModel.findById(candidate.resumeId);
    const job = await JobModel.findById(candidate.jobId);
    const history = await FeedbackModel.find({ candidateId: candidate._id });
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
    const candidate = await CandidateModel.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    candidate.recruiterDecision = body.data.decision;
    candidate.recruiterReason = body.data.reason;
    candidate.feedbackAt = new Date();
    await candidate.save();

    const item = await FeedbackModel.create({
      candidateId: candidate._id,
      jobId: candidate.jobId,
      recruiterId: req.userId,
      aiDecision: candidate.recommendation,
      recruiterDecision: body.data.decision,
      reason: body.data.reason
    });

    res.status(201).json({ candidate, feedback: item });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
