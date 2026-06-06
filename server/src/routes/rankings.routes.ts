import express, { type Response } from 'express';
import { candidateService } from '../firebase/services/candidateService.js';
import { rankingService } from '../firebase/services/rankingService.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { getSocketServer } from '../socket.js';
import { mapCandidate } from '../utils/mappers.js';

export const rankingsRouter = express.Router();

rankingsRouter.post('/generate/:jobId', auth, async (req: AuthedRequest, res: Response) => {
  const jobId = req.params.jobId;
  try {
    const ranked = await candidateService.findAll({ jobId }); // already sorted by aiScore desc

    const ranking = await rankingService.create({
      jobId,
      candidates: ranked.map((candidate, index) => ({
        candidateId: candidate.id,
        rank: index + 1,
        score: candidate.aiScore ?? 0,
        matchPercentage: candidate.matchPercentage ?? 0,
        recommendation: candidate.recommendation ?? 'Maybe'
      }))
    });

    try {
      const io = getSocketServer();
      for (const candidate of ranked) {
        io.to(`job:${jobId}`).emit('candidate_scored', { jobId, candidate: mapCandidate(candidate) });
      }
      io.to(`job:${jobId}`).emit('ranking_updated', { jobId, candidates: ranked.map(mapCandidate) });
    } catch {
      // Socket not initialized — no-op
    }

    res.status(201).json({ ranking, candidates: ranked.map(mapCandidate) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

rankingsRouter.get('/:jobId', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const [ranking, candidates] = await Promise.all([
      rankingService.findByJobId(req.params.jobId),
      candidateService.findAll({ jobId: req.params.jobId })
    ]);
    res.json({ ranking, candidates: candidates.map(mapCandidate) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
