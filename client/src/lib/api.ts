const tokenKey = 'hiremind_token';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem(tokenKey);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(path, { ...options, headers });
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
  uploadBatch: () => request('/api/resumes/batch-upload', { method: 'POST', body: new FormData() }),
  analyze: (jobId: string, resumeId: string) => request('/api/candidates/analyze', { method: 'POST', body: JSON.stringify({ jobId, resumeId }) }),
  candidates: (jobId: string) => request(`/api/candidates/job/${jobId}`),
  candidate: (id: string) => request(`/api/candidates/${id}`),
  ranking: (jobId: string) => request(`/api/rankings/${jobId}`),
  generateRanking: (jobId: string) => request(`/api/rankings/generate/${jobId}`, { method: 'POST' }),
  feedback: (id: string, payload: unknown) => request(`/api/candidates/${id}/feedback`, { method: 'POST', body: JSON.stringify(payload) }),
  analytics: () => request('/api/analytics/dashboard')
};
