import express, { type Response } from 'express';
import { resumeService } from '../firebase/services/resumeService.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadResumeToStorage } from '../firebase/storageService.js';
import { extractResumeData, minimalFallback } from '../services/ai.service.js';
import { extractText } from '../services/documentParser.js';
import { getSocketServer } from '../socket.js';
import type { AuthedRequest } from '../middleware/auth.js';

export const resumesRouter = express.Router();

// Helper: build a resume record from an in-memory file buffer
async function buildResume(file: Express.Multer.File, userId?: string): Promise<any> {
  const fileName = file.originalname;
  const fileType: 'pdf' | 'docx' = fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';

  // Upload to Firebase Storage and get public URL
  let fileUrl = '';
  try {
    fileUrl = await uploadResumeToStorage(file.buffer, fileName, file.mimetype, userId);
  } catch (storageErr) {
    console.warn(`[resumes] Firebase Storage upload failed for "${fileName}":`, storageErr);
  }

  let rawText = '';
  try {
    rawText = await extractText(file);
  } catch (parseErr) {
    console.warn(`[resumes] Text extraction failed for "${fileName}":`, parseErr);
  }

  if (rawText) {
    try {
      const parsedData = await extractResumeData(rawText);
      return { fileName, fileUrl, fileType, parsedData, parseStatus: 'parsed', rawText };
    } catch (aiErr) {
      console.warn(`[resumes] AI extraction failed for "${fileName}":`, aiErr);
    }
  }

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
resumesRouter.post('/upload', auth, upload.single('file'), async (req: AuthedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const existing = await resumeService.findOne({ fileName: req.file.originalname });
    if (existing) {
      res.status(200).json({ resume: existing, status: existing.parseStatus ?? 'parsed' });
      return;
    }

    const resumeObj = await buildResume(req.file, req.userId);
    const resume = await resumeService.create(resumeObj);
    res.status(201).json({ resume, status: resume.parseStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /batch-upload — up to 20 resumes
resumesRouter.post('/batch-upload', auth, upload.array('files', 20), async (req: AuthedRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const jobId = (req.query.jobId as string | undefined) ?? req.body?.jobId ?? 'unknown';

  function emitUploadStarted(payload: { jobId: string; total: number }) {
    try { getSocketServer().to(`job:${jobId}`).emit('resume_upload_started', payload); } catch { /* no-op */ }
  }
  function emitResumeParsed(payload: any) {
    try { getSocketServer().to(`job:${jobId}`).emit('resume_parsed', payload); } catch { /* no-op */ }
  }

  try {
    // No files — fall back to demo seed names
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
        let r = await resumeService.findOne({ fileName: name });
        if (!r) {
          r = await resumeService.create({
            fileName: name,
            fileUrl: '',
            fileType: 'pdf',
            parsedData: minimalFallback(name),
            parseStatus: 'manual_review'
          });
        }
        created.push(r);

        await new Promise((resolve) => setTimeout(resolve, 250));
        emitResumeParsed({
          jobId,
          resumeId: r.id,
          fileName: r.fileName,
          candidateName: r.parsedData?.name ?? 'Unknown',
          status: r.parseStatus ?? 'manual_review',
          index: i,
          total: demoNames.length
        });
      }

      res.status(201).json({
        resumes: created,
        progress: created.map((r) => ({ resumeId: r.id, status: r.parseStatus, progress: 100 }))
      });
      return;
    }

    // Real files: parse + upload sequentially
    emitUploadStarted({ jobId, total: files.length });

    const created: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let resume = await resumeService.findOne({ fileName: file.originalname });
      if (!resume) {
        try {
          const resumeObj = await buildResume(file, req.userId);
          resume = await resumeService.create(resumeObj);
        } catch {
          continue;
        }
      }
      created.push(resume);

      emitResumeParsed({
        jobId,
        resumeId: resume.id,
        fileName: resume.fileName,
        candidateName: resume.parsedData?.name ?? 'Unknown',
        status: resume.parseStatus ?? 'parsed',
        index: i,
        total: files.length
      });
    }

    res.status(201).json({
      resumes: created,
      progress: created.map((r) => ({ resumeId: r.id, status: r.parseStatus, progress: 100 }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id
resumesRouter.get('/:id', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const resume = await resumeService.findById(req.params.id);
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
resumesRouter.delete('/:id', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const resume = await resumeService.findById(req.params.id);
    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }
    await resumeService.delete(req.params.id);
    res.json({ resume });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
