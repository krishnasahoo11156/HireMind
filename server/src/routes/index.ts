import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { candidates, feedback, jobs, rankings, resetDemoData, resumes, users } from '../data.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { extractJobData, parseResumeFile } from '../services/extraction.js';
import { getGithubProfile, getLeetCodeProfile } from '../services/external.js';
import type { Candidate, Feedback, Job, Resume } from '../types.js';

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: 'server/uploads',
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype) || /\.(pdf|docx)$/i.test(file.originalname));
  }
});

const publicUser = (user: (typeof users)[number]) => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

function tokenFor(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'hiremind-demo-secret', { expiresIn: '7d' });
}

router.get('/health', (_req, res) => {
  res.json({ ok: true, mode: process.env.MONGODB_URI ? 'mongo-ready' : 'mock-memory' });
});

router.post('/seed/reset', (_req, res) => {
  resetDemoData();
  res.json({ ok: true });
});

router.post('/auth/register', async (req, res) => {
  const body = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(['recruiter', 'hiring_manager', 'admin']) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid registration payload', details: body.error.flatten() });
  if (users.some((user) => user.email === body.data.email)) return res.status(409).json({ error: 'Email already registered' });
  const now = new Date().toISOString();
  const user = { _id: `user_${Date.now()}`, email: body.data.email, password: await bcrypt.hash(body.data.password, 10), name: body.data.name, role: body.data.role, createdAt: now, updatedAt: now };
  users.push(user);
  res.status(201).json({ user: publicUser(user), token: tokenFor(user._id) });
});

router.post('/auth/login', async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid login payload' });
  const user = users.find((item) => item.email === body.data.email);
  if (!user || !(await bcrypt.compare(body.data.password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ user: publicUser(user), token: tokenFor(user._id) });
});

router.get('/auth/me', auth, (req: AuthedRequest, res) => {
  const user = users.find((item) => item._id === req.userId) ?? users[0];
  res.json({ user: publicUser(user) });
});

router.post('/jobs', auth, upload.single('file'), (req: AuthedRequest, res) => {
  const title = String(req.body.title ?? 'Frontend Developer');
  const description = String(req.body.description ?? req.body.rawText ?? 'We are looking for a Frontend Developer with strong React ecosystem experience.');
  const now = new Date().toISOString();
  const job: Job = {
    _id: `job_${Date.now()}`,
    title,
    description,
    rawText: req.file?.originalname ? `${description}\nUploaded JD: ${req.file.originalname}` : description,
    status: 'active',
    createdBy: req.userId ?? 'user_demo',
    extractedData: extractJobData(description),
    createdAt: now,
    updatedAt: now
  };
  jobs.unshift(job);
  res.status(201).json({ job });
});

router.post('/jobs/:id/upload-jd', auth, upload.single('file'), (req, res) => {
  const job = jobs.find((item) => item._id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const rawText = String(req.body.description ?? job.description);
  job.rawText = `${rawText}\nUploaded JD: ${req.file?.originalname ?? 'pasted-description'}`;
  job.extractedData = extractJobData(rawText);
  job.updatedAt = new Date().toISOString();
  res.json({ job, extractedData: job.extractedData });
});

router.get('/jobs', auth, (_req, res) => {
  res.json({ jobs: jobs.map((job) => ({ ...job, candidateCount: candidates.filter((candidate) => candidate.jobId === job._id).length })) });
});

router.get('/jobs/:id', auth, (req, res) => {
  const job = jobs.find((item) => item._id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ job, resumes, candidates: candidates.filter((candidate) => candidate.jobId === job._id) });
});

router.put('/jobs/:id', auth, (req, res) => {
  const job = jobs.find((item) => item._id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  Object.assign(job, req.body, { updatedAt: new Date().toISOString() });
  res.json({ job });
});

router.delete('/jobs/:id', auth, (req, res) => {
  const index = jobs.findIndex((item) => item._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Job not found' });
  const [job] = jobs.splice(index, 1);
  res.json({ job });
});

router.post('/resumes/upload', auth, upload.single('file'), (req, res) => {
  const fileName = req.file?.originalname ?? 'uploaded-resume.pdf';
  const resume: Resume = {
    _id: `resume_${Date.now()}`,
    fileName,
    fileUrl: `${process.env.PUBLIC_FILE_BASE_URL ?? 'http://localhost:5001/uploads'}/${path.basename(req.file?.filename ?? fileName)}`,
    fileType: fileName.endsWith('.docx') ? 'docx' : 'pdf',
    parsedData: parseResumeFile(fileName),
    uploadedAt: new Date().toISOString()
  };
  resumes.unshift(resume);
  res.status(201).json({ resume, status: 'parsed' });
});

router.post('/resumes/batch-upload', auth, upload.array('files', 20), (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const created = (files.length ? files : ['sarah-chen-resume.pdf', 'alex-rodriguez-resume.pdf', 'rahul-patel-resume.pdf', 'emma-wilson-resume.pdf', 'jordan-smith-resume.pdf']).map((file, index) => {
    const fileName = typeof file === 'string' ? file : file.originalname;
    const existing = resumes.find((resume) => resume.fileName === fileName);
    if (existing) return existing;
    const resume: Resume = {
      _id: `resume_uploaded_${Date.now()}_${index}`,
      fileName,
      fileUrl: `/uploads/${fileName}`,
      fileType: fileName.endsWith('.docx') ? 'docx' : 'pdf',
      parsedData: parseResumeFile(fileName),
      uploadedAt: new Date().toISOString()
    };
    resumes.push(resume);
    return resume;
  });
  res.status(201).json({ resumes: created, progress: created.map((resume) => ({ resumeId: resume._id, status: 'parsed', progress: 100 })) });
});

router.get('/resumes/:id', auth, (req, res) => {
  const resume = resumes.find((item) => item._id === req.params.id);
  if (!resume) return res.status(404).json({ error: 'Resume not found' });
  res.json({ resume });
});

router.delete('/resumes/:id', auth, (req, res) => {
  const index = resumes.findIndex((item) => item._id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Resume not found' });
  const [resume] = resumes.splice(index, 1);
  res.json({ resume });
});

router.post('/candidates/analyze', auth, (req, res) => {
  const body = z.object({ jobId: z.string(), resumeId: z.string(), githubUsername: z.string().optional(), leetcodeUsername: z.string().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid analysis payload' });
  const resume = resumes.find((item) => item._id === body.data.resumeId);
  const job = jobs.find((item) => item._id === body.data.jobId);
  if (!resume || !job) return res.status(404).json({ error: 'Job or resume not found' });
  const existing = candidates.find((candidate) => candidate.resumeId === resume._id && candidate.jobId === job._id);
  if (existing) return res.json({ candidate: existing });

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
    skillGap: required.map((skill) => ({ skill, required: true, candidateHas: matched.includes(skill) ? 'match' : 'missing', evidence: matched.includes(skill) ? 'Found in parsed resume skills' : 'No direct evidence in resume' })),
    explanation: [`Ranked from ${matched.length} direct skill matches out of ${required.length}.`, 'GitHub and LeetCode signals were included where provided.', 'Recommendation follows the mock Featherless scoring thresholds.', 'Manual recruiter feedback can override this AI decision.'],
    recruiterDecision: 'pending',
    recruiterReason: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  candidates.push(candidate);
  res.status(201).json({ candidate });
});

router.get('/candidates/job/:jobId', auth, (req, res) => {
  res.json({ candidates: candidates.filter((candidate) => candidate.jobId === req.params.jobId).sort((a, b) => b.aiScore - a.aiScore) });
});

router.get('/candidates/:id', auth, (req, res) => {
  const candidate = candidates.find((item) => item._id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  const resume = resumes.find((item) => item._id === candidate.resumeId);
  const job = jobs.find((item) => item._id === candidate.jobId);
  const history = feedback.filter((item) => item.candidateId === candidate._id);
  res.json({ candidate, resume, job, feedback: history });
});

router.post('/candidates/:id/feedback', auth, (req: AuthedRequest, res) => {
  const body = z.object({ decision: z.enum(['override_select', 'override_reject', 'agree']), reason: z.string().min(10) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Feedback reason must be at least 10 characters' });
  const candidate = candidates.find((item) => item._id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
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

router.post('/rankings/generate/:jobId', auth, (req, res) => {
  const ranked = candidates.filter((candidate) => candidate.jobId === req.params.jobId).sort((a, b) => b.aiScore - a.aiScore);
  const ranking = {
    _id: `ranking_${Date.now()}`,
    jobId: req.params.jobId,
    candidates: ranked.map((candidate, index) => ({ candidateId: candidate._id, rank: index + 1, score: candidate.aiScore, matchPercentage: candidate.matchPercentage, recommendation: candidate.recommendation })),
    generatedAt: new Date().toISOString()
  };
  rankings.unshift(ranking);
  res.status(201).json({ ranking, candidates: ranked });
});

router.get('/rankings/:jobId', auth, (req, res) => {
  const ranking = rankings.find((item) => item.jobId === req.params.jobId);
  res.json({ ranking, candidates: candidates.filter((candidate) => candidate.jobId === req.params.jobId).sort((a, b) => b.aiScore - a.aiScore) });
});

router.get('/analytics/dashboard', auth, (_req, res) => {
  const total = candidates.length;
  const overrides = feedback.filter((item) => item.recruiterDecision.startsWith('override')).length;
  const selected = candidates.filter((candidate) => candidate.recruiterDecision === 'override_select' || candidate.recommendation === 'Strong Hire' || candidate.recommendation === 'Hire').length;
  res.json({
    metrics: {
      resumesReviewed: resumes.length,
      candidatesSelected: selected,
      timeSaved: Number(((resumes.length * 15) / 60).toFixed(2)),
      decisionAccuracy: total ? Math.round(((total - overrides) / total) * 100) : 100,
      recruiterOverrides: overrides,
      averageScreeningTime: 3
    },
    funnel: { applied: resumes.length, screened: total, interviewed: 3, offered: 2, hired: 1 },
    activity: Array.from({ length: 30 }, (_, index) => ({ day: `${index + 1}`, resumes: index % 5 === 0 ? 4 : Math.max(1, Math.round(Math.sin(index / 4) * 2 + 2)) })),
    aiPerformance: [
      { name: 'Agreed', value: Math.max(total - overrides, 0) },
      { name: 'Overridden', value: overrides }
    ],
    overrideReasons: feedback.length ? feedback.map((item) => ({ reason: item.reason.slice(0, 24), count: 1 })) : [{ reason: 'Transferable skills', count: 1 }]
  });
});

router.get('/analytics/funnel', auth, (_req, res) => {
  res.json({ funnel: { applied: resumes.length, screened: candidates.length, interviewed: 3, offered: 2, hired: 1 } });
});

router.get('/analytics/accuracy', auth, (_req, res) => {
  const overrides = feedback.filter((item) => item.recruiterDecision.startsWith('override')).length;
  res.json({ agreed: Math.max(candidates.length - overrides, 0), overridden: overrides, accuracy: candidates.length ? Math.round(((candidates.length - overrides) / candidates.length) * 100) : 100 });
});

router.get('/github/:username', auth, (req, res) => {
  res.json({ profile: getGithubProfile(req.params.username) });
});

router.get('/leetcode/:username', auth, (req, res) => {
  res.json({ profile: getLeetCodeProfile(req.params.username) });
});

export default router;
