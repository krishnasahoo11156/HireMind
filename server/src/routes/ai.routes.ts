import express, { type Response } from 'express';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { candidateService } from '../firebase/services/candidateService.js';
import { jobService } from '../firebase/services/jobService.js';
import { resumeService } from '../firebase/services/resumeService.js';
import { generateExplanationStream } from '../services/ai.service.js';

export const aiRouter = express.Router();

aiRouter.post('/explain', auth, async (req: AuthedRequest, res: Response) => {
  const { candidateId } = req.body;
  if (!candidateId) {
    res.status(400).json({ error: 'candidateId is required' });
    return;
  }

  try {
    const candidate = await candidateService.findById(candidateId);
    if (!candidate) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }

    const job = await jobService.findById(candidate.jobId);
    const resume = await resumeService.findById(candidate.resumeId);

    if (!job || !resume) {
      res.status(404).json({ error: 'Job or Resume not found' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Encoding', 'none');

    const stream = await generateExplanationStream(job.extractedData, resume.parsedData);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('[aiRouter] SSE stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Stream processing error' })}\n\n`);
    res.end();
  }
});

export default aiRouter;
