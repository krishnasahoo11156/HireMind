import express from 'express';
import { auth } from '../middleware/auth.js';
import { getLeetCodeProfile } from '../services/external.js';
import { getGitHubProfile } from '../services/github.service.js';

export const externalRouter = express.Router();

externalRouter.get('/github/:username', auth, async (req, res) => {
  try {
    const profile = await getGitHubProfile(req.params.username);
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

externalRouter.get('/leetcode/:username', auth, (req, res) => {
  res.json({ profile: getLeetCodeProfile(req.params.username) });
});
