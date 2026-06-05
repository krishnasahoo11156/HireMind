import express from 'express';
import { JobModel, ResumeModel, CandidateModel, ApplicationModel } from '../models/schemas.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractJobData } from '../services/extraction.js';
import { analyzeJobDescription } from '../services/ai.service.js';

export const jobsRouter = express.Router();

jobsRouter.post('/', auth, upload.single('file'), async (req: AuthedRequest, res) => {
  try {
    const title = String(req.body.title ?? 'Frontend Developer');
    const description = String(req.body.description ?? req.body.rawText ?? 'We are looking for a Frontend Developer with strong React ecosystem experience.');
    const department = req.body.department ? String(req.body.department) : 'Engineering';
    const weights = req.body.weights ? (typeof req.body.weights === 'string' ? JSON.parse(req.body.weights) : req.body.weights) : { github: 50, leetcode: 30, education: 20 };
    
    const location = req.body.location ? String(req.body.location) : 'Remote';
    const salary = req.body.salary ? String(req.body.salary) : 'Competitive';
    const company = req.body.company ? String(req.body.company) : 'HireMind Inc';

    let extractedData;
    try {
      extractedData = await analyzeJobDescription(description);
    } catch (error) {
      console.error('[jobs] AI JD analysis failed, falling back to basic extraction:', error);
      extractedData = {
        ...extractJobData(description),
        nice_to_have: [],
        red_flags: [],
        clarity_score: 70,
        ambiguous_areas: []
      };
    }

    extractedData.weights = weights;

    const job = await JobModel.create({
      title,
      description,
      rawText: req.file?.originalname ? `${description}\nUploaded JD: ${req.file.originalname}` : description,
      status: 'active',
      createdBy: req.userId,
      department,
      location,
      salary,
      company,
      extractedData
    });

    res.status(201).json({ job });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

jobsRouter.post('/:id/upload-jd', auth, upload.single('file'), async (req, res) => {
  try {
    const job = await JobModel.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    const rawText = String(req.body.description ?? job.description);
    job.rawText = `${rawText}\nUploaded JD: ${req.file?.originalname ?? 'pasted-description'}`;
    
    try {
      job.extractedData = await analyzeJobDescription(rawText) as any;
    } catch (error) {
      console.error('[jobs] AI JD analysis failed on update, falling back to basic:', error);
      job.extractedData = {
        ...extractJobData(rawText),
        nice_to_have: [],
        red_flags: [],
        clarity_score: 70,
        ambiguous_areas: [],
        weights: job.extractedData?.weights ?? { github: 50, leetcode: 30, education: 20 }
      } as any;
    }
    
    await job.save();
    res.json({ job, extractedData: job.extractedData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

jobsRouter.get('/', auth, async (_req, res) => {
  try {
    const list = await JobModel.find({});
    const jobsWithCount = await Promise.all(list.map(async (job) => {
      const candidateCount = await ApplicationModel.countDocuments({ jobId: job._id });
      return { ...job.toObject(), candidateCount };
    }));
    res.json({ jobs: jobsWithCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

jobsRouter.get('/:id', auth, async (req, res) => {
  try {
    const job = await JobModel.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    const resumes = await ResumeModel.find({});
    const candidates = await CandidateModel.find({ jobId: job._id });
    res.json({ job, resumes, candidates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

jobsRouter.get('/:id/applicants', auth, async (req: AuthedRequest, res) => {
  try {
    const job = await JobModel.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    // Verify owner check
    if (job.createdBy && job.createdBy.toString() !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }
    const applicants = await ApplicationModel.find({ jobId: req.params.id });
    res.json({ applicants });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

jobsRouter.put('/:id', auth, async (req: AuthedRequest, res) => {
  try {
    const job = await JobModel.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    // Verify owner
    if (job.createdBy && job.createdBy.toString() !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }
    Object.assign(job, req.body);
    await job.save();
    res.json({ job });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

jobsRouter.delete('/:id', auth, async (req: AuthedRequest, res) => {
  try {
    const job = await JobModel.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    // Verify owner
    if (job.createdBy && job.createdBy.toString() !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }
    await JobModel.findByIdAndDelete(req.params.id);
    res.json({ job });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
