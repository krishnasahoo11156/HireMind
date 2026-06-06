import express, { type Response } from 'express';
import { auth, type AuthedRequest } from '../middleware/auth.js';
import { getLeetCodeProfile } from '../services/external.js';
import { getGitHubProfile } from '../services/github.service.js';

export const externalRouter = express.Router();

externalRouter.get('/github/:username', auth, async (req: AuthedRequest, res: Response) => {
  try {
    const profile = await getGitHubProfile(req.params.username);
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

externalRouter.get('/leetcode/:username', auth, (req: AuthedRequest, res: Response) => {
  res.json({ profile: getLeetCodeProfile(req.params.username) });
});
