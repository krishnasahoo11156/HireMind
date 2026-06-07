/**
 * github.service.ts
 * Fetches real GitHub profile data using the public API.
 * Endpoints used:
 *   GET /users/:username
 *   GET /users/:username/repos
 *   GET /users/:username/events
 *
 * Returns a GitHubProfile shape that matches Candidate['githubAnalysis'].
 * Caches results for 10 minutes. Falls back to mock data on any API error.
 */

export interface GitHubRepo {
  name: string;
  stars: number;
  language: string;
}

export interface GitHubProfile {
  username: string;
  publicRepos: number;
  totalCommits: number;
  topLanguages: string[];
  languageBreakdown: Array<{ language: string; value: number }>;
  stars: number;
  contributions: number;
  recentActivity: string;
  aiSummary: string;
  repos: GitHubRepo[];
  activitySeries: Array<{ day: string; commits: number }>;
  /** true when data came from GitHub API, false when mock fallback was used */
  isLive: boolean;
}

// ─── Cache ───────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1_000; // 10 minutes

interface CacheEntry {
  data: GitHubProfile;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function fromCache(username: string): GitHubProfile | null {
  const entry = cache.get(username.toLowerCase());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(username.toLowerCase());
    return null;
  }
  return entry.data;
}

function toCache(username: string, data: GitHubProfile): void {
  cache.set(username.toLowerCase(), { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Mock fallback ────────────────────────────────────────────────────────────
function mockProfile(username: string): GitHubProfile {
  const contributions = Math.floor(Math.random() * (80 - 15 + 1)) + 15;
  const publicRepos = Math.floor(Math.random() * (35 - 5 + 1)) + 5;
  const totalCommits = Math.floor(Math.random() * (800 - 100 + 1)) + 100;
  const stars = Math.floor(Math.random() * (120 - 5 + 1)) + 5;

  const activitySeries = [
    { day: 'D-6', commits: Math.floor(Math.random() * 8) },
    { day: 'D-5', commits: Math.floor(Math.random() * 8) },
    { day: 'D-4', commits: Math.floor(Math.random() * 8) },
    { day: 'D-3', commits: Math.floor(Math.random() * 8) },
    { day: 'D-2', commits: Math.floor(Math.random() * 8) },
    { day: 'D-1', commits: Math.floor(Math.random() * 8) },
    { day: 'Today', commits: Math.floor(Math.random() * 8) },
  ];

  const tsValue = Math.floor(Math.random() * (80 - 45 + 1)) + 45;
  const jsValue = 100 - tsValue;

  return {
    username,
    publicRepos,
    totalCommits,
    topLanguages: ['TypeScript', 'JavaScript'],
    languageBreakdown: [
      { language: 'TypeScript', value: tsValue },
      { language: 'JavaScript', value: jsValue },
    ],
    stars,
    contributions,
    recentActivity: `${contributions} commits in last 30 days`,
    aiSummary:
      `Moderate public engineering signal with frontend-oriented repositories. Primary focus on TypeScript.`,
    repos: [{ name: 'frontend-dashboard', stars: Math.floor(Math.random() * 25), language: 'TypeScript' }],
    activitySeries,
    isLive: false,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
type GHHeaders = Record<string, string>;

function buildHeaders(): GHHeaders {
  const headers: GHHeaders = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function ghFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub API ${url} returned ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

interface GHUser {
  login: string;
  public_repos: number;
}

interface GHRepo {
  name: string;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  size: number;
}

interface GHEvent {
  type: string;
  created_at: string;
  payload?: {
    commits?: Array<{ sha: string }>;
    size?: number;
  };
}

// ─── Core extraction ──────────────────────────────────────────────────────────

/**
 * Build activitySeries (last 7 days) from push events.
 */
function buildActivitySeries(events: GHEvent[]): Array<{ day: string; commits: number }> {
  const pushEvents = events.filter((e) => e.type === 'PushEvent');
  const now = Date.now();
  const dayMs = 86_400_000;

  const buckets: Record<number, number> = {};
  for (let i = 6; i >= 0; i--) buckets[i] = 0;

  for (const event of pushEvents) {
    const age = Math.floor((now - new Date(event.created_at).getTime()) / dayMs);
    if (age >= 0 && age <= 6) {
      const commits = event.payload?.commits?.length ?? event.payload?.size ?? 1;
      buckets[age] += commits;
    }
  }

  return [6, 5, 4, 3, 2, 1, 0].map((i) => ({
    day: i === 0 ? 'Today' : `D-${i}`,
    commits: buckets[i],
  }));
}

/**
 * Aggregate language bytes across repos.
 */
function buildLanguageBreakdown(
  repos: GHRepo[]
): { topLanguages: string[]; languageBreakdown: Array<{ language: string; value: number }> } {
  const counts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) counts[repo.language] = (counts[repo.language] ?? 0) + 1;
  }
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
  const languageBreakdown = sorted.map(([language, count]) => ({
    language,
    value: Math.round((count / total) * 100),
  }));
  const topLanguages = sorted.map(([lang]) => lang);
  return { topLanguages, languageBreakdown };
}

/**
 * Estimate total commits from push-event history (last 300 events max).
 * Events API gives ≤300 events across 10 pages. We use count × scaling.
 */
function estimateTotalCommits(events: GHEvent[], publicRepos: number): number {
  const pushEvents = events.filter((e) => e.type === 'PushEvent');
  const recentCommits = pushEvents.reduce(
    (s, e) => s + (e.payload?.commits?.length ?? e.payload?.size ?? 1),
    0
  );
  // Each repo averages some commits; events only cover ~90 days at best
  // Use a conservative multiplier
  const perRepo = publicRepos > 0 ? Math.max(recentCommits, 30) : recentCommits;
  return recentCommits > 0 ? Math.round(recentCommits * Math.max(1, publicRepos / 3)) : perRepo;
}

/**
 * Count push-events in the last 30 days.
 */
function recentContributions(events: GHEvent[]): number {
  const cutoff = Date.now() - 30 * 86_400_000;
  return events
    .filter((e) => e.type === 'PushEvent' && new Date(e.created_at).getTime() >= cutoff)
    .reduce((s, e) => s + (e.payload?.commits?.length ?? e.payload?.size ?? 1), 0);
}

/**
 * Build a plain-English AI summary based on the extracted data.
 * (No external AI call — this runs on the server synchronously.)
 */
function buildSummary(profile: Omit<GitHubProfile, 'aiSummary' | 'isLive'>): string {
  const { topLanguages, publicRepos, stars, contributions, repos } = profile;
  const topLang = topLanguages[0] ?? 'various languages';
  const starNote =
    stars > 200
      ? 'Strong open-source recognition with 200+ stars.'
      : stars > 50
        ? 'Good open-source signal.'
        : '';
  const activityNote =
    contributions >= 40
      ? 'Highly active coder in the last 30 days.'
      : contributions >= 15
        ? 'Moderately active contributor.'
        : 'Limited recent activity.';
  const topRepo = repos.sort((a, b) => b.stars - a.stars)[0];
  const repoNote = topRepo
    ? `Top repository is "${topRepo.name}" (${topRepo.stars} ★, ${topRepo.language ?? 'unknown'}).`
    : '';
  return [
    `Primary stack: ${topLanguages.slice(0, 3).join(', ')}.`,
    `${publicRepos} public repos with primary focus on ${topLang}.`,
    activityNote,
    starNote,
    repoNote,
  ]
    .filter(Boolean)
    .join(' ');
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch and return a structured GitHubProfile.
 * Uses 10-min in-memory cache. Falls back to mock data if the API fails.
 */
export async function getGitHubProfile(username: string): Promise<GitHubProfile> {
  const cached = fromCache(username);
  if (cached) return cached;

  try {
    const baseUrl = 'https://api.github.com';

    // 1. User info
    const user = await ghFetch<GHUser>(`${baseUrl}/users/${username}`);

    // 2. Repos (up to 100, sorted by stars)
    const rawRepos = await ghFetch<GHRepo[]>(
      `${baseUrl}/users/${username}/repos?per_page=100&sort=updated`
    );
    const ownRepos = rawRepos.filter((r) => !r.fork);

    const repos: GitHubRepo[] = ownRepos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10)
      .map((r) => ({
        name: r.name,
        stars: r.stargazers_count,
        language: r.language ?? 'Unknown',
      }));

    const stars = ownRepos.reduce((s, r) => s + r.stargazers_count, 0);

    // 3. Events (last 100)
    const events = await ghFetch<GHEvent[]>(`${baseUrl}/users/${username}/events?per_page=100`);

    const activitySeries = buildActivitySeries(events);
    const { topLanguages, languageBreakdown } = buildLanguageBreakdown(ownRepos);
    const contributions = recentContributions(events);
    const totalCommits = estimateTotalCommits(events, user.public_repos);

    const partial: Omit<GitHubProfile, 'aiSummary' | 'isLive'> = {
      username: user.login,
      publicRepos: user.public_repos,
      totalCommits,
      topLanguages,
      languageBreakdown,
      stars,
      contributions,
      recentActivity: `${contributions} commits in last 30 days`,
      repos,
      activitySeries,
    };

    const profile: GitHubProfile = {
      ...partial,
      aiSummary: buildSummary(partial),
      isLive: true,
    };

    toCache(username, profile);
    return profile;
  } catch (err: any) {
    console.warn(`[github.service] Failed to fetch live data for "${username}": ${err.message}. Using mock.`);
    const mock = mockProfile(username);
    // Cache mock for a shorter time (2 min) to retry sooner
    cache.set(username.toLowerCase(), { data: mock, expiresAt: Date.now() + 2 * 60_000 });
    return mock;
  }
}

/**
 * Invalidate the cache for a specific username (useful in tests / forced refresh).
 */
export function invalidateGitHubCache(username: string): void {
  cache.delete(username.toLowerCase());
}
