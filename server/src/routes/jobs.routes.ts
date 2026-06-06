import express, { type Response } from 'express';
import { jobService } from '../firebase/services/jobService.js';
import { applicationService } from '../firebase/services/applicationService.js';
import { candidateService } from '../firebase/services/candidateService.js';
import { resumeService } from '../firebase/services/resumeService.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractJobData } from '../services/extraction.js';
import { analyzeJobDescription } from '../services/ai.service.js';
import { userService } from '../firebase/services/userService.js';
import { mapJob, mapCandidate } from '../utils/mappers.js';

export const jobsRouter = express.Router();

// POST / — Create a new job
jobsRouter.post('/', auth, upload.single('file'), async (req: AuthedRequest, res: Response) => {
  try {
    const title = String(req.body.title ?? 'Frontend Developer');
    const description = String(req.body.description ?? req.body.rawText ?? 'We are looking for a Frontend Developer with strong React ecosystem experience.');
    const department = req.body.department ? String(req.body.department) : 'Engineering';
    const weights = req.body.weights
      ? (typeof req.body.weights === 'string' ? JSON.parse(req.body.weights) : req.body.weights)
      : { github: 50, leetcode: 30, education: 20 };
    const location = req.body.location ? String(req.body.location) : 'Remote';
    const salary = req.body.salary ? String(req.body.salary) : 'Competitive';
    const company = req.body.company ? String(req.body.company) : 'HireMind Inc';

    const requiredSkills = req.body.requiredSkills
      ? (Array.isArray(req.body.requiredSkills) ? req.body.requiredSkills : JSON.parse(req.body.requiredSkills))
      : [];

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

    // Set recruiter requiredSkills as source of truth
    extractedData.skills = requiredSkills;
    extractedData.weights = weights;

    const job = await jobService.create({
      title,
      description,
      rawText: req.file?.originalname ? `${description}\nUploaded JD: ${req.file.originalname}` : description,
      status: 'active',
      createdBy: req.userId,
      department,
      location,
      salary,
      company,
      requiredSkills,
      extractedData
    });

    res.status(201).json({ job: mapJob(job) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/upload-jd — Re-analyze JD for an existing job
jobsRouter.post('/:id/upload-jd', auth, upload.single('file'), async (req: AuthedRequest, res: Response) => {
  try {
    const job = await jobService.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const rawText = String(req.body.description ?? job.description);
    const newRawText = `${rawText}\nUploaded JD: ${req.file?.originalname ?? 'pasted-description'}`;

    let extractedData;
    try {
      extractedData = await analyzeJobDescription(rawText) as any;
    } catch (error) {
      console.error('[jobs] AI JD analysis failed on update, falling back to basic:', error);
      extractedData = {
        ...extractJobData(rawText),
        nice_to_have: [],
        red_flags: [],
        clarity_score: 70,
        ambiguous_areas: [],
        weights: job.extractedData?.weights ?? { github: 50, leetcode: 30, education: 20 }
      };
    }

    // Preserve the recruiter's chosen required skills
    extractedData.skills = job.requiredSkills || [];

    await jobService.update(req.params.id, { rawText: newRawText, extractedData });
    const updated = await jobService.findById(req.params.id);
    res.json({ job: mapJob(updated), extractedData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET / — List all jobs with applicant counts
jobsRouter.get('/', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const list = await jobService.findAll();
    
    // Filter list: Candidate / Admin see all jobs; Recruiter only sees their own
    const filteredList = req.userRole === 'candidate' || req.userRole === 'admin'
      ? list
      : list.filter(job => job.createdBy === req.userId);

    const jobsWithCount = await Promise.all(
      filteredList.map(async (job) => {
        const applications = await applicationService.findAll({ jobId: job.id });
        
        let creatorName = 'Recruiter';
        if (job.createdBy) {
          const creator = await userService.findById(job.createdBy);
          if (creator) creatorName = creator.name;
        }

        return { ...job, candidateCount: applications.length, creatorName };
      })
    );
    res.json({ jobs: jobsWithCount.map(mapJob) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id — Get a single job
jobsRouter.get('/:id', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const job = await jobService.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (req.userRole !== 'candidate' && req.userRole !== 'admin' && job.createdBy && job.createdBy !== req.userId) {
      res.status(403).json({ error: 'Access denied: job owner only' });
      return;
    }

    let creatorName = 'Recruiter';
    if (job.createdBy) {
      const creator = await userService.findById(job.createdBy);
      if (creator) creatorName = creator.name;
    }

    let candidates: any[] = [];
    let resumes: any[] = [];
    if (req.userRole !== 'candidate') {
      const dbCandidates = await candidateService.findAll({ jobId: req.params.id });
      candidates = dbCandidates.map(mapCandidate);

      const dbResumes = await Promise.all(
        dbCandidates
          .filter((c) => c.resumeId)
          .map((c) => resumeService.findById(c.resumeId))
      );
      resumes = dbResumes.filter((r) => r !== null);
    }

    res.json({
      job: mapJob({ ...job, creatorName }),
      resumes,
      candidates
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id/applicants — Get applicants for a job (recruiter only)
jobsRouter.get('/:id/applicants', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const job = await jobService.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (job.createdBy && job.createdBy !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }
    const applicants = await applicationService.findAll({ jobId: req.params.id });
    res.json({ applicants });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id — Update a job
jobsRouter.put('/:id', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const job = await jobService.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (job.createdBy && job.createdBy !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }
    const updatePayload = { ...req.body };
    if (updatePayload.requiredSkills !== undefined) {
      const parsedSkills = Array.isArray(updatePayload.requiredSkills)
        ? updatePayload.requiredSkills
        : JSON.parse(updatePayload.requiredSkills);
      updatePayload.requiredSkills = parsedSkills;
      
      const currentExtracted = job.extractedData || {};
      updatePayload.extractedData = {
        ...currentExtracted,
        skills: parsedSkills
      };
    }

    await jobService.update(req.params.id, updatePayload);
    const updated = await jobService.findById(req.params.id);
    res.json({ job: mapJob(updated) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id — Delete a job
jobsRouter.delete('/:id', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const job = await jobService.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (job.createdBy && job.createdBy !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ error: 'Access denied: recruiter owner only' });
      return;
    }
    await jobService.delete(req.params.id);
    res.json({ job: mapJob(job) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
