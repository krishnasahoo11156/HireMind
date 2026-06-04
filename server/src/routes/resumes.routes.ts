import express from 'express';
import path from 'path';
import { resumes } from '../data.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractResumeData, minimalFallback } from '../services/ai.service.js';
import { extractText } from '../services/documentParser.js';
import type { Resume } from '../types.js';

export const resumesRouter = express.Router();

// ---------------------------------------------------------------------------
// Helper: parse one uploaded file and return a Resume record
// ---------------------------------------------------------------------------
async function buildResume(file: Express.Multer.File, index = 0): Promise<Resume> {
  const fileName = file.originalname;
  const publicBase = process.env.PUBLIC_FILE_BASE_URL ?? 'http://localhost:5001/uploads';
  const fileUrl = `${publicBase}/${path.basename(file.filename ?? fileName)}`;
  const fileType: 'pdf' | 'docx' = fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';
  const resumeId = `resume_${Date.now()}_${index}`;

  // 1. Extract raw text from the uploaded file
  let rawText = '';
  try {
    rawText = await extractText(file);
  } catch (parseErr) {
    console.warn(`[resumes] Text extraction failed for "${fileName}":`, parseErr);
  }

  // 2. Send text to AI for structured extraction
  if (rawText) {
    try {
      const parsedData = await extractResumeData(rawText);
      return {
        _id: resumeId,
        fileName,
        fileUrl,
        fileType,
        parsedData,
        parseStatus: 'parsed',
        uploadedAt: new Date().toISOString()
      };
    } catch (aiErr) {
      console.warn(`[resumes] AI extraction failed for "${fileName}":`, aiErr);
    }
  }

  // 3. Fallback — store raw text and mark for manual review
  return {
    _id: resumeId,
    fileName,
    fileUrl,
    fileType,
    parsedData: minimalFallback(fileName),
    parseStatus: 'manual_review',
    rawText: rawText || undefined,
    uploadedAt: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// POST /upload — single resume
// ---------------------------------------------------------------------------
resumesRouter.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  // Skip duplicates already in the in-memory store
  const existing = resumes.find((r) => r.fileName === req.file!.originalname);
  if (existing) {
    res.status(200).json({ resume: existing, status: existing.parseStatus ?? 'parsed' });
    return;
  }

  const resume = await buildResume(req.file);
  resumes.unshift(resume);
  res.status(201).json({ resume, status: resume.parseStatus });
});

// ---------------------------------------------------------------------------
// POST /batch-upload — up to 20 resumes
// ---------------------------------------------------------------------------
resumesRouter.post('/batch-upload', auth, upload.array('files', 20), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  // If no files were sent, fall back to demo seed names (original behaviour)
  if (files.length === 0) {
    const demoNames = [
      'sarah-chen-resume.pdf',
      'alex-rodriguez-resume.pdf',
      'rahul-patel-resume.pdf',
      'emma-wilson-resume.pdf',
      'jordan-smith-resume.pdf'
    ];
    const created = demoNames.map((name) => {
      const hit = resumes.find((r) => r.fileName === name);
      if (hit) return hit;
      const r: Resume = {
        _id: `resume_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        fileName: name,
        fileUrl: `/uploads/${name}`,
        fileType: 'pdf',
        parsedData: minimalFallback(name),
        parseStatus: 'manual_review',
        uploadedAt: new Date().toISOString()
      };
      resumes.push(r);
      return r;
    });
    res.status(201).json({
      resumes: created,
      progress: created.map((r) => ({ resumeId: r._id, status: r.parseStatus, progress: 100 }))
    });
    return;
  }

  // Parse all uploaded files concurrently
  const results = await Promise.allSettled(
    files.map((file, i) => {
      const existing = resumes.find((r) => r.fileName === file.originalname);
      if (existing) return Promise.resolve(existing);
      return buildResume(file, i);
    })
  );

  const created: Resume[] = [];
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const resume = result.value;
      if (!resumes.find((r) => r._id === resume._id)) {
        resumes.push(resume);
      }
      created.push(resume);
    }
  });

  res.status(201).json({
    resumes: created,
    progress: created.map((r) => ({ resumeId: r._id, status: r.parseStatus, progress: 100 }))
  });
});

// ---------------------------------------------------------------------------
// GET /:id
// ---------------------------------------------------------------------------
resumesRouter.get('/:id', auth, (req, res) => {
  const resume = resumes.find((item) => item._id === req.params.id);
  if (!resume) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }
  res.json({ resume });
});

// ---------------------------------------------------------------------------
// DELETE /:id
// ---------------------------------------------------------------------------
resumesRouter.delete('/:id', auth, (req, res) => {
  const index = resumes.findIndex((item) => item._id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Resume not found' });
    return;
  }
  const [resume] = resumes.splice(index, 1);
  res.json({ resume });
});
