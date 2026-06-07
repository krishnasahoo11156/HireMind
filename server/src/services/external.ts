/**
 * external.ts (legacy shim)
 * The old `getGithubProfile` / `getLeetCodeProfile` synchronous functions used by
 * candidates.routes.ts are preserved here for backward compatibility.
 *
 * The new async `getGitHubProfile` lives in github.service.ts.
 */

import * as db from '../data.js';

const githubCache = new Map<string, any>();
const leetcodeCache = new Map<string, any>();

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
  const match = db.candidates.find((candidate) => candidate.leetcodeAnalysis?.username === username);
  if (match?.leetcodeAnalysis) {
    return match.leetcodeAnalysis;
  }
  
  const problemsSolved = Math.floor(Math.random() * (450 - 50 + 1)) + 50;
  const easy = Math.floor(problemsSolved * 0.4);
  const medium = Math.floor(problemsSolved * 0.5);
  const hard = problemsSolved - easy - medium;
  const contestRating = Math.floor(Math.random() * (2200 - 1200 + 1)) + 1200;
  const globalRanking = Math.floor(Math.random() * (200000 - 10000 + 1)) + 10000;
  const percentile = (100 - (globalRanking / 400000 * 100)).toFixed(1);

  const profile = {
    username,
    problemsSolved,
    easy,
    medium,
    hard,
    contestRating,
    globalRanking,
    percentile: `Top ${percentile}%`,
    activityLevel: contestRating > 1800 ? 'High' : 'Moderate',
    aiSummary: contestRating > 1800 
      ? 'Strong problem-solving capability under timed contest environments.'
      : 'Adequate problem-solving practice for software engineering roles.'
  };
  leetcodeCache.set(username, profile);
  return profile;
}
