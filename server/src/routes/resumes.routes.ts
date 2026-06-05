import express from 'express';
import path from 'path';
import { ResumeModel } from '../models/schemas.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractResumeData, minimalFallback } from '../services/ai.service.js';
import { extractText } from '../services/documentParser.js';
import { getSocketServer } from '../socket.js';

export const resumesRouter = express.Router();

// Helper: parse one uploaded file and return a Resume record object (uncommitted)
async function buildResume(file: Express.Multer.File): Promise<any> {
  const fileName = file.originalname;
  const publicBase = process.env.PUBLIC_FILE_BASE_URL ?? 'http://localhost:5001/uploads';
  const fileUrl = `${publicBase}/${path.basename(file.filename ?? fileName)}`;
  const fileType: 'pdf' | 'docx' = fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';

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
        fileName,
        fileUrl,
        fileType,
        parsedData,
        parseStatus: 'parsed',
        rawText
      };
    } catch (aiErr) {
      console.warn(`[resumes] AI extraction failed for "${fileName}":`, aiErr);
    }
  }

  // 3. Fallback — store raw text and mark for manual review
  return {
    fileName,
    fileUrl,
    fileType,
    parsedData: minimalFallback(fileName),
    parseStatus: 'manual_review',
    rawText: rawText || undefined
  };
}

// POST /upload — single resume
resumesRouter.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    // Skip duplicates already in the DB
    const existing = await ResumeModel.findOne({ fileName: req.file.originalname });
    if (existing) {
      res.status(200).json({ resume: existing, status: existing.parseStatus ?? 'parsed' });
      return;
    }

    const resumeObj = await buildResume(req.file);
    const resume = await ResumeModel.create(resumeObj);
    res.status(201).json({ resume, status: resume.parseStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /batch-upload — up to 20 resumes
resumesRouter.post('/batch-upload', auth, upload.array('files', 20), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const jobId = (req.query.jobId as string | undefined) ?? req.body?.jobId ?? 'unknown';

  // Typed emit helpers — gracefully no-op when socket server isn't ready
  function emitUploadStarted(payload: { jobId: string; total: number }) {
    try { getSocketServer().to(`job:${jobId}`).emit('resume_upload_started', payload); } catch { /* no-op */ }
  }
  function emitResumeParsed(payload: any) {
    try { getSocketServer().to(`job:${jobId}`).emit('resume_parsed', payload); } catch { /* no-op */ }
  }

  try {
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

      const created: any[] = [];
      for (let i = 0; i < demoNames.length; i++) {
        const name = demoNames[i];
        const hit = await ResumeModel.findOne({ fileName: name });
        let r;
        if (hit) {
          r = hit;
        } else {
          r = await ResumeModel.create({
            fileName: name,
            fileUrl: `/uploads/${name}`,
            fileType: 'pdf',
            parsedData: minimalFallback(name),
            parseStatus: 'manual_review'
          });
        }
        created.push(r);

        // Stagger demo emit slightly so UI shows progressive updates
        await new Promise((resolve) => setTimeout(resolve, 250));
        emitResumeParsed({
          jobId,
          resumeId: r._id.toString(),
          fileName: r.fileName,
          candidateName: r.parsedData?.name ?? 'Unknown',
          status: r.parseStatus ?? 'manual_review',
          index: i,
          total: demoNames.length
        });
      }

      res.status(201).json({
        resumes: created,
        progress: created.map((r) => ({ resumeId: r._id.toString(), status: r.parseStatus, progress: 100 }))
      });
      return;
    }

    // Real files: emit start, then parse sequentially to emit per-file events
    emitUploadStarted({ jobId, total: files.length });

    const created: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const existing = await ResumeModel.findOne({ fileName: file.originalname });
      let resume;
      if (existing) {
        resume = existing;
      } else {
        try {
          const resumeObj = await buildResume(file);
          resume = await ResumeModel.create(resumeObj);
        } catch {
          continue;
        }
      }
      created.push(resume);

      emitResumeParsed({
        jobId,
        resumeId: resume._id.toString(),
        fileName: resume.fileName,
        candidateName: resume.parsedData?.name ?? 'Unknown',
        status: resume.parseStatus ?? 'parsed',
        index: i,
        total: files.length
      });
    }

    res.status(201).json({
      resumes: created,
      progress: created.map((r) => ({ resumeId: r._id.toString(), status: r.parseStatus, progress: 100 }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id
resumesRouter.get('/:id', auth, async (req, res) => {
  try {
    const resume = await ResumeModel.findById(req.params.id);
    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }
    res.json({ resume });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id
resumesRouter.delete('/:id', auth, async (req, res) => {
  try {
    const resume = await ResumeModel.findById(req.params.id);
    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }
    await ResumeModel.findByIdAndDelete(req.params.id);
    res.json({ resume });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
