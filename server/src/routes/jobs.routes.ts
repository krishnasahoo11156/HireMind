import express from 'express';
import { candidates, jobs, resumes } from '../data.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractJobData } from '../services/extraction.js';
import type { Job } from '../types.js';

export const jobsRouter = express.Router();

jobsRouter.post('/', auth, upload.single('file'), (req: AuthedRequest, res) => {
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

jobsRouter.post('/:id/upload-jd', auth, upload.single('file'), (req, res) => {
  const job = jobs.find((item) => item._id === req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  const rawText = String(req.body.description ?? job.description);
  job.rawText = `${rawText}\nUploaded JD: ${req.file?.originalname ?? 'pasted-description'}`;
  job.extractedData = extractJobData(rawText);
  job.updatedAt = new Date().toISOString();
  res.json({ job, extractedData: job.extractedData });
});

jobsRouter.get('/', auth, (_req, res) => {
  res.json({ jobs: jobs.map((job) => ({ ...job, candidateCount: candidates.filter((candidate) => candidate.jobId === job._id).length })) });
});

jobsRouter.get('/:id', auth, (req, res) => {
  const job = jobs.find((item) => item._id === req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json({ job, resumes, candidates: candidates.filter((candidate) => candidate.jobId === job._id) });
});

jobsRouter.put('/:id', auth, (req, res) => {
  const job = jobs.find((item) => item._id === req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  Object.assign(job, req.body, { updatedAt: new Date().toISOString() });
  res.json({ job });
});

jobsRouter.delete('/:id', auth, (req, res) => {
  const index = jobs.findIndex((item) => item._id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  const [job] = jobs.splice(index, 1);
  res.json({ job });
});
