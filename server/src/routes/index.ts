import express from 'express';
import { db } from '../firebase/admin.js';
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
import { debugRouter } from './debug.routes.js';

const router = express.Router();

// Health endpoint — checks Firebase Firestore connectivity
router.get('/health', async (_req, res) => {
  try {
    await db.collection('_health_ping').limit(1).get();
    res.json({ status: 'ok', firebase: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', firebase: 'disconnected' });
  }
});

router.post('/seed/reset', (_req, res) => {
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
router.use('/debug', debugRouter);
router.use(externalRouter);

export default router;
