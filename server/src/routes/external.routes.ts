import express from 'express';
import { auth } from '../middleware/auth.js';
import { getGithubProfile, getLeetCodeProfile } from '../services/external.js';

export const externalRouter = express.Router();

externalRouter.get('/github/:username', auth, (req, res) => {
  res.json({ profile: getGithubProfile(req.params.username) });
});

externalRouter.get('/leetcode/:username', auth, (req, res) => {
  res.json({ profile: getLeetCodeProfile(req.params.username) });
});
