import express from 'express';
import path from 'path';
import { resumes } from '../data.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { parseResumeFile } from '../services/extraction.js';
import type { Resume } from '../types.js';

export const resumesRouter = express.Router();

resumesRouter.post('/upload', auth, upload.single('file'), (req, res) => {
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

resumesRouter.post('/batch-upload', auth, upload.array('files', 20), (req, res) => {
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

resumesRouter.get('/:id', auth, (req, res) => {
  const resume = resumes.find((item) => item._id === req.params.id);
  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }
  res.json({ resume });
});

resumesRouter.delete('/:id', auth, (req, res) => {
  const index = resumes.findIndex((item) => item._id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }
  const [resume] = resumes.splice(index, 1);
  res.json({ resume });
});
