/**
 * external.ts (legacy shim)
 * The old `getGithubProfile` / `getLeetCodeProfile` synchronous functions used by
 * candidates.routes.ts are preserved here for backward compatibility.
 *
 * The new async `getGitHubProfile` lives in github.service.ts.
 */

import * as db from '../data.js';

const githubCache = new Map<string, unknown>();
const leetcodeCache = new Map<string, unknown>();

export function getGithubProfile(username: string) {
  if (githubCache.has(username)) return githubCache.get(username);
  const match = db.candidates.find((candidate) => candidate.githubAnalysis.username === username);
  const profile = match?.githubAnalysis ?? {
    username,
    publicRepos: 6,
    totalCommits: 320,
    topLanguages: ['TypeScript', 'JavaScript'],
    languageBreakdown: [{ language: 'TypeScript', value: 55 }, { language: 'JavaScript', value: 45 }],
    stars: 42,
    contributions: 18,
    recentActivity: '18 commits in last 30 days',
    aiSummary: 'Moderate public engineering signal with frontend-oriented repositories.',
    repos: [{ name: 'frontend-dashboard', stars: 18, language: 'TypeScript' }],
    activitySeries: [{ day: 'D-1', commits: 3 }, { day: 'Today', commits: 4 }]
  };
  githubCache.set(username, profile);
  return profile;
}

export function getLeetCodeProfile(username: string) {
  if (leetcodeCache.has(username)) return leetcodeCache.get(username);
  const match = db.candidates.find((candidate) => candidate.leetcodeAnalysis.username === username);
  const profile = match?.leetcodeAnalysis ?? {
    username,
    problemsSolved: 140,
    easy: 80,
    medium: 52,
    hard: 8,
    contestRating: 1500,
    globalRanking: 140000,
    percentile: 'Top 45%',
    activityLevel: 'Moderate',
    aiSummary: 'Adequate problem-solving practice for mid-level interviews.'
  };
  leetcodeCache.set(username, profile);
  return profile;
}
