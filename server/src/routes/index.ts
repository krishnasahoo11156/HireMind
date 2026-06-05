import express from 'express';
import { authRouter } from './auth.routes.js';
import { jobsRouter } from './jobs.routes.js';
import { resumesRouter } from './resumes.routes.js';
import { candidatesRouter } from './candidates.routes.js';
import { rankingsRouter } from './rankings.routes.js';
import { analyticsRouter } from './analytics.routes.js';
import { externalRouter } from './external.routes.js';
import { aiRouter } from './ai.routes.js';
import { githubRouter } from './github.routes.js';
import { applicationsRouter } from './applications.routes.js';

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, mode: 'mongo-ready' });
});

router.post('/seed/reset', (_req, res) => {
  // import resetDemoData from '../data.js' if you need this in production
  res.json({ ok: true });
});

router.use('/auth', authRouter);
router.use('/jobs', jobsRouter);
router.use('/resumes', resumesRouter);
router.use('/candidates', candidatesRouter);
router.use('/rankings', rankingsRouter);
router.use('/analytics', analyticsRouter);
router.use('/ai', aiRouter);
router.use('/github', githubRouter);
router.use('/applications', applicationsRouter);
router.use(externalRouter);

export default router;
