import express from 'express';
import path from 'path';
import { resumes } from '../data.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractResumeData, minimalFallback } from '../services/ai.service.js';
import { extractText } from '../services/documentParser.js';
import { getSocketServer } from '../socket.js';
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
  const jobId = (req.query.jobId as string | undefined) ?? req.body?.jobId ?? 'unknown';

  // Typed emit helpers — gracefully no-op when socket server isn't ready
  function emitUploadStarted(payload: { jobId: string; total: number }) {
    try { getSocketServer().to(`job:${jobId}`).emit('resume_upload_started', payload); } catch { /* no-op */ }
  }
  function emitResumeParsed(payload: Parameters<import('../socket.js').ServerToClientEvents['resume_parsed']>[0]) {
    try { getSocketServer().to(`job:${jobId}`).emit('resume_parsed', payload); } catch { /* no-op */ }
  }

  // If no files were sent, fall back to demo seed names (original behaviour)
  if (files.length === 0) {
    const demoNames = [
      'sarah-chen-resume.pdf',
      'alex-rodriguez-resume.pdf',
      'rahul-patel-resume.pdf',
      'emma-wilson-resume.pdf',
      'jordan-smith-resume.pdf'
    ];

    emitUploadStarted({ jobId, total: demoNames.length });

    const created: Resume[] = [];
    for (let i = 0; i < demoNames.length; i++) {
      const name = demoNames[i];
      const hit = resumes.find((r) => r.fileName === name);
      let r: Resume;
      if (hit) {
        r = hit;
      } else {
        r = {
          _id: `resume_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          fileName: name,
          fileUrl: `/uploads/${name}`,
          fileType: 'pdf',
          parsedData: minimalFallback(name),
          parseStatus: 'manual_review',
          uploadedAt: new Date().toISOString()
        };
        resumes.push(r);
      }
      created.push(r);

      // Stagger demo emit slightly so UI shows progressive updates
      await new Promise((resolve) => setTimeout(resolve, 250));
      emitResumeParsed({
        jobId,
        resumeId: r._id,
        fileName: r.fileName,
        candidateName: r.parsedData.name,
        status: r.parseStatus ?? 'manual_review',
        index: i,
        total: demoNames.length
      });
    }

    res.status(201).json({
      resumes: created,
      progress: created.map((r) => ({ resumeId: r._id, status: r.parseStatus, progress: 100 }))
    });
    return;
  }

  // Real files: emit start, then parse sequentially to emit per-file events
  emitUploadStarted({ jobId, total: files.length });

  const created: Resume[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const existing = resumes.find((r) => r.fileName === file.originalname);
    let resume: Resume;
    if (existing) {
      resume = existing;
    } else {
      try {
        resume = await buildResume(file, i);
      } catch {
        continue;
      }
      if (!resumes.find((r) => r._id === resume._id)) {
        resumes.push(resume);
      }
    }
    created.push(resume);

    emitResumeParsed({
      jobId,
      resumeId: resume._id,
      fileName: resume.fileName,
      candidateName: resume.parsedData.name,
      status: resume.parseStatus ?? 'parsed',
      index: i,
      total: files.length
    });
  }

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
