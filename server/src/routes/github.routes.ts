import express from 'express';
import { auth } from '../middleware/auth.js';
import { getGitHubProfile, invalidateGitHubCache } from '../services/github.service.js';

export const githubRouter = express.Router();

/**
 * GET /api/github/:username
 * Returns a structured GitHub profile (live or mock fallback).
 * Results are cached for 10 minutes.
 */
githubRouter.get('/:username', auth, async (req, res) => {
  const { username } = req.params;
  if (!username || username.length < 1) {
    res.status(400).json({ error: 'GitHub username is required' });
    return;
  }

  try {
    const profile = await getGitHubProfile(username);
    res.json({ profile, cached: !profile.isLive ? false : undefined });
  } catch (err: any) {
    console.error(`[githubRouter] Unexpected error for "${username}":`, err);
    res.status(500).json({ error: 'Failed to fetch GitHub profile' });
  }
});

/**
 * DELETE /api/github/:username/cache
 * Invalidates the cached profile so the next GET fetches fresh data.
 */
githubRouter.delete('/:username/cache', auth, (req, res) => {
  invalidateGitHubCache(req.params.username);
  res.json({ ok: true, message: `Cache invalidated for ${req.params.username}` });
});
