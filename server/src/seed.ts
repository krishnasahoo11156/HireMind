import { candidates, jobs, resumes, users } from './data.js';

console.log(JSON.stringify({
  users: users.length,
  jobs: jobs.length,
  resumes: resumes.length,
  candidates: candidates.length,
  demoLogin: {
    email: 'recruiter@hiremind.ai',
    password: 'password123'
  }
}, null, 2));
