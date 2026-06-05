import express from 'express';
import { CandidateModel, RankingModel } from '../models/schemas.js';
import { auth } from '../middleware/auth.js';
import { getSocketServer } from '../socket.js';
import { mapCandidate } from '../utils/mappers.js';

export const rankingsRouter = express.Router();

rankingsRouter.post('/generate/:jobId', auth, async (req, res) => {
  const jobId = req.params.jobId;
  try {
    const ranked = await CandidateModel.find({ jobId }).sort({ aiScore: -1 });

    const ranking = await RankingModel.create({
      jobId,
      candidates: ranked.map((candidate, index) => ({
        candidateId: candidate._id,
        rank: index + 1,
        score: candidate.aiScore,
        matchPercentage: candidate.matchPercentage,
        recommendation: candidate.recommendation
      }))
    });

    // Emit per-candidate scored events
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

rankingsRouter.get('/:jobId', auth, async (req, res) => {
  try {
    const ranking = await RankingModel.findOne({ jobId: req.params.jobId }).sort({ generatedAt: -1 });
    const candidates = await CandidateModel.find({ jobId: req.params.jobId }).sort({ aiScore: -1 });
    res.json({ ranking, candidates: candidates.map(mapCandidate) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
