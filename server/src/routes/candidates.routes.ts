import express from 'express';
import { z } from 'zod';
import { candidates, feedback, jobs, resumes } from '../data.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { getGithubProfile, getLeetCodeProfile } from '../services/external.js';
import type { Candidate, Feedback } from '../types.js';

export const candidatesRouter = express.Router();

candidatesRouter.post('/analyze', auth, (req, res) => {
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

  const required = job.extractedData.skills;
  const matched = required.filter((skill) => resume.parsedData.skills.some((candidateSkill) => candidateSkill.toLowerCase().includes(skill.toLowerCase())));
  const matchPercentage = Math.round((matched.length / Math.max(required.length, 1)) * 100);
  const score = Math.min(100, Math.max(0, matchPercentage + (body.data.githubUsername ? 8 : 0) + (body.data.leetcodeUsername ? 5 : 0) - (required.length - matched.length) * 5));
  const recommendation = score >= 90 ? 'Strong Hire' : score >= 75 ? 'Hire' : score >= 60 ? 'Maybe' : 'Reject';
  const candidate: Candidate = {
    _id: `candidate_${Date.now()}`,
    resumeId: resume._id,
    jobId: job._id,
    name: resume.parsedData.name,
    email: resume.parsedData.email,
    blindId: `Candidate-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    isBlindMode: false,
    aiScore: score,
    matchPercentage,
    recommendation,
    githubAnalysis: getGithubProfile(body.data.githubUsername ?? 'uploaded-dev') as Candidate['githubAnalysis'],
    leetcodeAnalysis: getLeetCodeProfile(body.data.leetcodeUsername ?? 'uploaded-dev') as Candidate['leetcodeAnalysis'],
    skillGap: required.map((skill) => ({ skill, isRequired: true, candidateHas: matched.includes(skill) ? 'match' : 'missing', evidence: matched.includes(skill) ? 'Found in parsed resume skills' : 'No direct evidence in resume' })),
    explanation: [`Ranked from ${matched.length} direct skill matches out of ${required.length}.`, 'GitHub and LeetCode signals were included where provided.', 'Recommendation follows the mock Featherless scoring thresholds.', 'Manual recruiter feedback can override this AI decision.'],
    recruiterDecision: 'pending',
    recruiterReason: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  candidates.push(candidate);
  res.status(201).json({ candidate });
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
