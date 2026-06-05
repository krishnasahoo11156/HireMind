import express from 'express';
import { CandidateModel, FeedbackModel, ResumeModel } from '../models/schemas.js';
import { auth } from '../middleware/auth.js';

export const analyticsRouter = express.Router();

analyticsRouter.get('/dashboard', auth, async (_req, res) => {
  try {
    const total = await CandidateModel.countDocuments({});
    const resumesReviewed = await ResumeModel.countDocuments({});
    const overrides = await FeedbackModel.countDocuments({ recruiterDecision: { $regex: /^override/ } });
    
    const selected = await CandidateModel.countDocuments({
      $or: [
        { recruiterDecision: 'override_select' },
        { recommendation: { $in: ['Strong Hire', 'Hire'] } }
      ]
    });

    const feedbackList = await FeedbackModel.find({});

    res.json({
      metrics: {
        resumesReviewed,
        candidatesSelected: selected,
        timeSaved: Number(((resumesReviewed * 15) / 60).toFixed(2)),
        decisionAccuracy: total ? Math.round(((total - overrides) / total) * 100) : 100,
        recruiterOverrides: overrides,
        averageScreeningTime: 3
      },
      funnel: { applied: resumesReviewed, screened: total, interviewed: 3, offered: 2, hired: 1 },
      activity: Array.from({ length: 30 }, (_, index) => ({ day: `${index + 1}`, resumes: index % 5 === 0 ? 4 : Math.max(1, Math.round(Math.sin(index / 4) * 2 + 2)) })),
      aiPerformance: [
        { name: 'Agreed', value: Math.max(total - overrides, 0) },
        { name: 'Overridden', value: overrides }
      ],
      overrideReasons: feedbackList.length 
        ? feedbackList.map((item) => ({ reason: (item.reason ?? '').slice(0, 24), count: 1 })) 
        : [{ reason: 'Transferable skills', count: 1 }]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

analyticsRouter.get('/funnel', auth, async (_req, res) => {
  try {
    const applied = await ResumeModel.countDocuments({});
    const screened = await CandidateModel.countDocuments({});
    res.json({ funnel: { applied, screened, interviewed: 3, offered: 2, hired: 1 } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

analyticsRouter.get('/accuracy', auth, async (_req, res) => {
  try {
    const total = await CandidateModel.countDocuments({});
    const overrides = await FeedbackModel.countDocuments({ recruiterDecision: { $regex: /^override/ } });
    res.json({ 
      agreed: Math.max(total - overrides, 0), 
      overridden: overrides, 
      accuracy: total ? Math.round(((total - overrides) / total) * 100) : 100 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
