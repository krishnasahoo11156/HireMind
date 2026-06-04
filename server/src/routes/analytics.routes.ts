import express from 'express';
import { candidates, feedback, resumes } from '../data.js';
import { auth } from '../middleware/auth.js';

export const analyticsRouter = express.Router();

analyticsRouter.get('/dashboard', auth, (_req, res) => {
  const total = candidates.length;
  const overrides = feedback.filter((item) => item.recruiterDecision.startsWith('override')).length;
  const selected = candidates.filter((candidate) => candidate.recruiterDecision === 'override_select' || candidate.recommendation === 'Strong Hire' || candidate.recommendation === 'Hire').length;
  res.json({
    metrics: {
      resumesReviewed: resumes.length,
      candidatesSelected: selected,
      timeSaved: Number(((resumes.length * 15) / 60).toFixed(2)),
      decisionAccuracy: total ? Math.round(((total - overrides) / total) * 100) : 100,
      recruiterOverrides: overrides,
      averageScreeningTime: 3
    },
    funnel: { applied: resumes.length, screened: total, interviewed: 3, offered: 2, hired: 1 },
    activity: Array.from({ length: 30 }, (_, index) => ({ day: `${index + 1}`, resumes: index % 5 === 0 ? 4 : Math.max(1, Math.round(Math.sin(index / 4) * 2 + 2)) })),
    aiPerformance: [
      { name: 'Agreed', value: Math.max(total - overrides, 0) },
      { name: 'Overridden', value: overrides }
    ],
    overrideReasons: feedback.length ? feedback.map((item) => ({ reason: item.reason.slice(0, 24), count: 1 })) : [{ reason: 'Transferable skills', count: 1 }]
  });
});

analyticsRouter.get('/funnel', auth, (_req, res) => {
  res.json({ funnel: { applied: resumes.length, screened: candidates.length, interviewed: 3, offered: 2, hired: 1 } });
});

analyticsRouter.get('/accuracy', auth, (_req, res) => {
  const overrides = feedback.filter((item) => item.recruiterDecision.startsWith('override')).length;
  res.json({ agreed: Math.max(candidates.length - overrides, 0), overridden: overrides, accuracy: candidates.length ? Math.round(((candidates.length - overrides) / candidates.length) * 100) : 100 });
});
