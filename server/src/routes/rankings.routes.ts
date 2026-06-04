import express from 'express';
import { candidates, rankings } from '../data.js';
import { auth } from '../middleware/auth.js';

export const rankingsRouter = express.Router();

rankingsRouter.post('/generate/:jobId', auth, (req, res) => {
  const ranked = candidates.filter((candidate) => candidate.jobId === req.params.jobId).sort((a, b) => b.aiScore - a.aiScore);
  const ranking = {
    _id: `ranking_${Date.now()}`,
    jobId: req.params.jobId,
    candidates: ranked.map((candidate, index) => ({ candidateId: candidate._id, rank: index + 1, score: candidate.aiScore, matchPercentage: candidate.matchPercentage, recommendation: candidate.recommendation })),
    generatedAt: new Date().toISOString()
  };
  rankings.unshift(ranking);
  res.status(201).json({ ranking, candidates: ranked });
});

rankingsRouter.get('/:jobId', auth, (req, res) => {
  const ranking = rankings.find((item) => item.jobId === req.params.jobId);
  res.json({ ranking, candidates: candidates.filter((candidate) => candidate.jobId === req.params.jobId).sort((a, b) => b.aiScore - a.aiScore) });
});
