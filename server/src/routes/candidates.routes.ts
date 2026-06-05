import express from 'express';
import { z } from 'zod';
import { candidates, feedback, jobs, resumes } from '../data.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { getLeetCodeProfile } from '../services/external.js';
import { getGitHubProfile } from '../services/github.service.js';
import { scoreCandidate } from '../services/ai.service.js';
import type { Candidate, Feedback } from '../types.js';

export const candidatesRouter = express.Router();

candidatesRouter.post('/analyze', auth, async (req, res) => {
  const body = z.object({ jobId: z.string(), resumeId: z.string(), githubUsername: z.string().optional(), leetcodeUsername: z.string().optional() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Invalid analysis payload' });
    return;
  }
  const resume = resumes.find((item) => item._id === body.data.resumeId);
  const job = jobs.find((item) => item._id === body.data.jobId);
  if (!resume || !job) {
    res.status(404).json({ error: 'Job or resume not found' });
    return;
  }
  const existing = candidates.find((candidate) => candidate.resumeId === resume._id && candidate.jobId === job._id);
  if (existing) {
    res.json({ candidate: existing });
    return;
  }

  const githubAnalysis = await getGitHubProfile(body.data.githubUsername ?? 'uploaded-dev');
  const leetcodeAnalysis = getLeetCodeProfile(body.data.leetcodeUsername ?? 'uploaded-dev') as Candidate['leetcodeAnalysis'];

  let aiScore = 50;
  let matchPercentage = 50;
  let recommendation: Candidate['recommendation'] = 'Maybe';
  let skillGap: Candidate['skillGap'] = [];
  let explanation: string[] = [];

  try {
    const scored = await scoreCandidate(job.extractedData, resume.parsedData, githubAnalysis, leetcodeAnalysis);
    aiScore = scored.aiScore ?? 50;
    matchPercentage = scored.matchPercentage ?? 50;
    recommendation = scored.recommendation ?? 'Maybe';
    skillGap = scored.skillGap ?? [];
    explanation = scored.explanation ?? [];
  } catch (error) {
    console.error('[candidates] AI scoring failed, falling back to basic scoring:', error);
    const required = job.extractedData.skills;
    const matched = required.filter((skill) => resume.parsedData.skills.some((candidateSkill) => candidateSkill.toLowerCase().includes(skill.toLowerCase())));
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

  const candidate: Candidate = {
    _id: `candidate_${Date.now()}`,
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
    recruiterReason: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  candidates.push(candidate);
  res.status(201).json({ candidate });
});

candidatesRouter.get('/', auth, (req, res) => {
  res.json({ candidates });
});

candidatesRouter.get('/job/:jobId', auth, (req, res) => {
  res.json({ candidates: candidates.filter((candidate) => candidate.jobId === req.params.jobId).sort((a, b) => b.aiScore - a.aiScore) });
});

candidatesRouter.get('/:id', auth, (req, res) => {
  const candidate = candidates.find((item) => item._id === req.params.id);
  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }
  const resume = resumes.find((item) => item._id === candidate.resumeId);
  const job = jobs.find((item) => item._id === candidate.jobId);
  const history = feedback.filter((item) => item.candidateId === candidate._id);
  res.json({ candidate, resume, job, feedback: history });
});

candidatesRouter.post('/:id/feedback', auth, (req: AuthedRequest, res) => {
  const body = z.object({ decision: z.enum(['override_select', 'override_reject', 'agree']), reason: z.string().min(10) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Feedback reason must be at least 10 characters' });
    return;
  }
  const candidate = candidates.find((item) => item._id === req.params.id);
  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }
  candidate.recruiterDecision = body.data.decision;
  candidate.recruiterReason = body.data.reason;
  candidate.feedbackAt = new Date().toISOString();
  candidate.updatedAt = new Date().toISOString();
  const item: Feedback = {
    _id: `feedback_${Date.now()}`,
    candidateId: candidate._id,
    jobId: candidate.jobId,
    recruiterId: req.userId ?? 'user_demo',
    aiDecision: candidate.recommendation,
    recruiterDecision: body.data.decision,
    reason: body.data.reason,
    createdAt: new Date().toISOString()
  };
  feedback.unshift(item);
  res.status(201).json({ candidate, feedback: item });
});
