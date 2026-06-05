const tokenKey = 'hiremind_token';
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/api$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem(tokenKey);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error ?? 'Request failed');
  }
  return response.json() as Promise<T>;
}

export const api = {
  tokenKey,
  login: (email: string, password: string) => request<{ token: string; user: unknown }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: unknown) => request<{ token: string; user: unknown }>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/api/auth/me'),
  jobs: () => request('/api/jobs'),
  job: (id: string) => request(`/api/jobs/${id}`),
  createJob: (payload: unknown) => request('/api/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  uploadBatch: (files?: File[], jobId?: string) => {
    const form = new FormData();
    if (files) files.forEach((file) => form.append('files', file));
    const qs = jobId ? `?jobId=${encodeURIComponent(jobId)}` : '';
    return request(`/api/resumes/batch-upload${qs}`, { method: 'POST', body: form });
  },
  analyze: (jobId: string, resumeId: string, githubUsername?: string, leetcodeUsername?: string) => request('/api/candidates/analyze', { method: 'POST', body: JSON.stringify({ jobId, resumeId, githubUsername, leetcodeUsername }) }),
  candidates: (jobId: string) => request(`/api/candidates/job/${jobId}`),
  allCandidates: () => request<{ candidates: import('../types').Candidate[] }>('/api/candidates'),
  candidate: (id: string) => request(`/api/candidates/${id}`),
  ranking: (jobId: string) => request(`/api/rankings/${jobId}`),
  generateRanking: (jobId: string) => request(`/api/rankings/generate/${jobId}`, { method: 'POST' }),
  feedback: (id: string, payload: unknown) => request(`/api/candidates/${id}/feedback`, { method: 'POST', body: JSON.stringify(payload) }),
  analytics: () => request('/api/analytics/dashboard'),
  githubProfile: (username: string) =>
    request<{ profile: import('../types').GitHubProfile }>(`/api/github/${username}`),
  refreshGithubCache: (username: string) =>
    request(`/api/github/${username}/cache`, { method: 'DELETE' }),
  applyJob: (form: FormData) =>
    request<{ application: import('../types').Application }>('/api/applications', { method: 'POST', body: form }),
  myApplications: () =>
    request<{ applications: import('../types').Application[] }>('/api/applications/my'),
  application: (id: string) =>
    request<{ application: import('../types').Application; job: import('../types').Job }>(`/api/applications/${id}`),
  updateApplicationStatus: (id: string, status: string) =>
    request<{ application: import('../types').Application }>(`/api/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
};
