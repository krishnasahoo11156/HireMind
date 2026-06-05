import type { Candidate, Feedback, Job, Ranking, Resume, User, Application } from './types.js';

const now = new Date().toISOString();
// Pre-hashed 'password123' with bcrypt salt rounds 10 - demo only
const password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

export const users: User[] = [
  {
    _id: 'user_demo',
    email: 'recruiter@hiremind.ai',
    password,
    name: 'Maya Kapoor',
    role: 'recruiter',
    avatar: 'MK',
    createdAt: now,
    updatedAt: now
  },
  {
    _id: 'user_candidate_demo',
    email: 'candidate@hiremind.ai',
    password,
    name: 'Sarah Chen',
    role: 'candidate',
    avatar: 'SC',
    createdAt: now,
    updatedAt: now
  }
];

export const jobs: Job[] = [
  {
    _id: 'job_frontend',
    title: 'Frontend Developer',
    description: 'We are looking for a Frontend Developer with strong React ecosystem experience, TypeScript fluency, Redux state management, Next.js delivery experience, and production TailwindCSS practice.',
    rawText: 'We are looking for a Frontend Developer with strong React ecosystem experience...',
    status: 'active',
    createdBy: 'user_demo',
    extractedData: {
      skills: ['React', 'TypeScript', 'Redux', 'Next.js', 'TailwindCSS'],
      experience: '3-5 Years',
      education: 'Computer Science or equivalent practical experience',
      certifications: ['Frontend performance or accessibility certification preferred'],
      keywords: ['React ecosystem', 'component architecture', 'state management', 'responsive UI', 'accessibility']
    },
    createdAt: now,
    updatedAt: now
  }
];

function resume(id: string, name: string, email: string, fileName: string, skills: string[], years: string, github: string, leetcode: string, educationInstitution: string): Resume {
  return {
    _id: id,
    fileName,
    fileUrl: `/uploads/${fileName}`,
    fileType: 'pdf',
    parsedData: {
      name,
      email,
      phone: '+1 555 0142',
      skills,
      experience: [
        {
          title: skills.includes('React') ? 'Frontend Engineer' : 'Software Engineer',
          company: 'Nimbus Labs',
          duration: years,
          description: `Built production applications using ${skills.slice(0, 4).join(', ')} with measurable delivery impact.`
        }
      ],
      projects: [
        {
          name: `${name.split(' ')[0]} Portfolio System`,
          description: 'Delivered a recruiter-facing dashboard with structured workflows and measurable performance gains.',
          technologies: skills.slice(0, 5)
        }
      ],
      education: [{ degree: 'B.S. Computer Science', institution: educationInstitution, year: '2020' }],
      certifications: skills.includes('TailwindCSS') ? ['Responsive UI Systems'] : [],
      links: {
        github: `https://github.com/${github}`,
        linkedin: `https://linkedin.com/in/${name.toLowerCase().replaceAll(' ', '-')}`,
        portfolio: `https://${github}.dev`,
        leetcode: `https://leetcode.com/${leetcode}`
      }
    },
    uploadedAt: now
  };
}

export const resumes: Resume[] = [
  resume('resume_sarah', 'Sarah Chen', 'sarah.chen@example.com', 'sarah-chen-resume.pdf', ['React', 'TypeScript', 'Redux', 'Next.js', 'TailwindCSS', 'Accessibility'], '4 years', 'sarahchen-dev', 'sarahc', 'Stanford University'),
  resume('resume_alex', 'Alex Rodriguez', 'alex.rodriguez@example.com', 'alex-rodriguez-resume.pdf', ['React', 'TypeScript', 'Next.js', 'Node.js', 'GraphQL'], '3 years', 'alexrod', 'alexrod', 'University of Texas'),
  resume('resume_rahul', 'Rahul Patel', 'rahul.patel@example.com', 'rahul-patel-resume.pdf', ['React', 'TailwindCSS', 'JavaScript', 'HTML', 'CSS'], '2 years', 'rahulp', 'rahulp', 'Pune Institute of Technology'),
  resume('resume_emma', 'Emma Wilson', 'emma.wilson@example.com', 'emma-wilson-resume.pdf', ['Vue', 'JavaScript', 'Python', 'Django', 'PostgreSQL'], '5 years', 'emmaw', 'emmaw', 'University of Michigan'),
  resume('resume_jordan', 'Jordan Smith', 'jordan.smith@example.com', 'jordan-smith-resume.pdf', ['HTML', 'CSS', 'React basics', 'JavaScript'], '1 year', 'jordans', 'jordans', 'General Assembly')
];

function gap(skill: string, candidateHas: 'match' | 'partial' | 'missing', evidence: string) {
  return { skill, isRequired: true, candidateHas, evidence };
}

const activitySeries = [
  { day: 'D-6', commits: 3 },
  { day: 'D-5', commits: 7 },
  { day: 'D-4', commits: 5 },
  { day: 'D-3', commits: 10 },
  { day: 'D-2', commits: 6 },
  { day: 'D-1', commits: 8 },
  { day: 'Today', commits: 11 }
];

function candidate(
  id: string,
  resumeId: string,
  name: string,
  score: number,
  match: number,
  recommendation: Candidate['recommendation'],
  github: Candidate['githubAnalysis'],
  leetcode: Candidate['leetcodeAnalysis'],
  skillGap: Candidate['skillGap'],
  explanation: string[]
): Candidate {
  return {
    _id: id,
    resumeId,
    jobId: 'job_frontend',
    name,
    email: resumes.find((item) => item._id === resumeId)?.parsedData.email ?? '',
    blindId: `Candidate-${id.split('_')[1].slice(0, 4).toUpperCase()}`,
    isBlindMode: false,
    aiScore: score,
    matchPercentage: match,
    recommendation,
    githubAnalysis: github,
    leetcodeAnalysis: leetcode,
    skillGap,
    explanation,
    recruiterDecision: 'pending',
    recruiterReason: '',
    createdAt: now,
    updatedAt: now
  };
}

export const candidates: Candidate[] = [
  candidate(
    'candidate_sarah',
    'resume_sarah',
    'Sarah Chen',
    91,
    94,
    'Strong Hire',
    {
      username: 'sarahchen-dev',
      publicRepos: 12,
      totalCommits: 1284,
      topLanguages: ['TypeScript', 'JavaScript', 'CSS'],
      languageBreakdown: [{ language: 'TypeScript', value: 62 }, { language: 'JavaScript', value: 23 }, { language: 'CSS', value: 15 }],
      stars: 180,
      contributions: 47,
      recentActivity: '47 commits in last 30 days',
      aiSummary: 'Strong React ecosystem signal with recent TypeScript-heavy work. Repository quality suggests production-level frontend maturity.',
      repos: [{ name: 'react-candidate-os', stars: 82, language: 'TypeScript' }, { name: 'tailwind-systems', stars: 56, language: 'CSS' }, { name: 'redux-patterns', stars: 42, language: 'TypeScript' }],
      activitySeries
    },
    {
      username: 'sarahc',
      problemsSolved: 342,
      easy: 112,
      medium: 176,
      hard: 54,
      contestRating: 1820,
      globalRanking: 42000,
      percentile: 'Top 12%',
      activityLevel: 'High',
      aiSummary: 'Consistent medium and hard problem practice supports strong algorithmic reasoning for frontend architecture decisions.'
    },
    [gap('React', 'match', '4 years of production React work'), gap('TypeScript', 'match', 'Recent repos are TypeScript dominant'), gap('Redux', 'partial', 'Redux projects present but not most recent'), gap('Next.js', 'missing', 'Only one side project mentions Next.js'), gap('TailwindCSS', 'match', 'Built reusable Tailwind design systems')],
    ['Ranked #1 because React experience exceeds the JD requirements.', 'GitHub activity is strong with 47 commits in the last 30 days.', 'LeetCode rating of 1820 shows dependable problem solving.', 'Portfolio projects align directly with state management and UI system needs.', 'Compared with the pool, Sarah has the best balance of skill match, recency, and delivery signal.']
  ),
  candidate(
    'candidate_alex',
    'resume_alex',
    'Alex Rodriguez',
    85,
    89,
    'Hire',
    {
      username: 'alexrod',
      publicRepos: 8,
      totalCommits: 746,
      topLanguages: ['TypeScript', 'JavaScript', 'GraphQL'],
      languageBreakdown: [{ language: 'TypeScript', value: 48 }, { language: 'JavaScript', value: 32 }, { language: 'GraphQL', value: 20 }],
      stars: 95,
      contributions: 23,
      recentActivity: '23 commits in last 30 days',
      aiSummary: 'Healthy full-stack profile with meaningful React and Next.js exposure. Redux is the main missing production signal.',
      repos: [{ name: 'next-commerce', stars: 45, language: 'TypeScript' }, { name: 'graphql-ui-kit', stars: 28, language: 'TypeScript' }, { name: 'node-dashboard', stars: 22, language: 'JavaScript' }],
      activitySeries: activitySeries.map((item) => ({ ...item, commits: Math.max(1, Math.round(item.commits / 2)) }))
    },
    {
      username: 'alexrod',
      problemsSolved: 210,
      easy: 86,
      medium: 103,
      hard: 21,
      contestRating: 1650,
      globalRanking: 88000,
      percentile: 'Top 25%',
      activityLevel: 'Moderate',
      aiSummary: 'Solid contest history and practical problem solving. Depth is sufficient for mid-level frontend work.'
    },
    [gap('React', 'match', 'React used across product dashboard work'), gap('TypeScript', 'match', 'Several TypeScript projects'), gap('Redux', 'missing', 'No clear Redux evidence'), gap('Next.js', 'match', 'Built a Next.js commerce app'), gap('TailwindCSS', 'partial', 'Used utility CSS in one project')],
    ['Ranked #2 because React and TypeScript match strongly.', 'Next.js experience is above the role baseline.', 'GitHub activity is steady but less recent than Sarah.', 'Redux is missing, which prevents a Strong Hire decision.', 'Full-stack exposure is useful but slightly less targeted to the JD.']
  ),
  candidate(
    'candidate_rahul',
    'resume_rahul',
    'Rahul Patel',
    79,
    82,
    'Maybe',
    {
      username: 'rahulp',
      publicRepos: 5,
      totalCommits: 318,
      topLanguages: ['JavaScript', 'CSS', 'HTML'],
      languageBreakdown: [{ language: 'JavaScript', value: 45 }, { language: 'CSS', value: 35 }, { language: 'HTML', value: 20 }],
      stars: 30,
      contributions: 12,
      recentActivity: '12 commits in last 30 days',
      aiSummary: 'Promising frontend signal but currently junior for a 3-5 year requirement. Needs TypeScript and state management depth.',
      repos: [{ name: 'react-kanban', stars: 14, language: 'JavaScript' }, { name: 'tailwind-portfolio', stars: 10, language: 'CSS' }, { name: 'weather-ui', stars: 6, language: 'JavaScript' }],
      activitySeries: activitySeries.map((item) => ({ ...item, commits: Math.max(1, Math.round(item.commits / 4)) }))
    },
    {
      username: 'rahulp',
      problemsSolved: 120,
      easy: 72,
      medium: 43,
      hard: 5,
      contestRating: 1450,
      globalRanking: 160000,
      percentile: 'Top 40%',
      activityLevel: 'Moderate',
      aiSummary: 'Enough practice for junior roles, but advanced problem-solving depth remains limited.'
    },
    [gap('React', 'match', 'React projects are present'), gap('TypeScript', 'missing', 'No TypeScript evidence'), gap('Redux', 'missing', 'No Redux usage'), gap('Next.js', 'missing', 'No Next.js usage'), gap('TailwindCSS', 'match', 'Portfolio built with TailwindCSS')],
    ['Ranked #3 due to partial frontend alignment and positive growth signal.', 'React and TailwindCSS are present, but TypeScript and Redux are missing.', 'Experience level is below the 3-5 year requirement.', 'GitHub activity is active enough to show learning momentum.', 'Best suited for a supervised mid-level track or junior-plus role.']
  ),
  candidate(
    'candidate_emma',
    'resume_emma',
    'Emma Wilson',
    68,
    65,
    'Maybe',
    {
      username: 'emmaw',
      publicRepos: 20,
      totalCommits: 1920,
      topLanguages: ['Python', 'JavaScript', 'Vue'],
      languageBreakdown: [{ language: 'Python', value: 52 }, { language: 'JavaScript', value: 25 }, { language: 'Vue', value: 23 }],
      stars: 400,
      contributions: 60,
      recentActivity: '60 commits in last 30 days',
      aiSummary: 'Excellent engineering signal and open-source strength, but most evidence is backend and Vue rather than React.',
      repos: [{ name: 'django-observability', stars: 210, language: 'Python' }, { name: 'vue-admin-kit', stars: 122, language: 'Vue' }, { name: 'api-tooling', stars: 68, language: 'Python' }],
      activitySeries: activitySeries.map((item) => ({ ...item, commits: item.commits + 2 }))
    },
    {
      username: 'emmaw',
      problemsSolved: 500,
      easy: 142,
      medium: 250,
      hard: 108,
      contestRating: 2100,
      globalRanking: 12000,
      percentile: 'Top 5%',
      activityLevel: 'Very High',
      aiSummary: 'Exceptional algorithmic signal. Coding strength is high, though role-specific frontend alignment is weaker.'
    },
    [gap('React', 'missing', 'Vue experience instead of React'), gap('TypeScript', 'missing', 'No TypeScript evidence'), gap('Redux', 'missing', 'No Redux evidence'), gap('Next.js', 'missing', 'No Next.js evidence'), gap('TailwindCSS', 'partial', 'Utility CSS patterns in Vue work')],
    ['Ranked #4 because the role-specific frontend skill match is weak.', 'GitHub activity and stars are excellent, but mostly Python and Vue.', 'LeetCode performance is the strongest in the pool.', 'Backend skills are transferable, but React ecosystem risk remains.', 'Recruiter review is recommended for teams valuing broad engineering depth.']
  ),
  candidate(
    'candidate_jordan',
    'resume_jordan',
    'Jordan Smith',
    52,
    45,
    'Reject',
    {
      username: 'jordans',
      publicRepos: 3,
      totalCommits: 84,
      topLanguages: ['HTML', 'CSS', 'JavaScript'],
      languageBreakdown: [{ language: 'HTML', value: 35 }, { language: 'CSS', value: 35 }, { language: 'JavaScript', value: 30 }],
      stars: 8,
      contributions: 5,
      recentActivity: '5 commits in last 30 days',
      aiSummary: 'Early-career frontend foundation but not enough depth for the target role. Needs production React and TypeScript experience.',
      repos: [{ name: 'bootcamp-final', stars: 5, language: 'JavaScript' }, { name: 'css-layouts', stars: 2, language: 'CSS' }, { name: 'html-practice', stars: 1, language: 'HTML' }],
      activitySeries: activitySeries.map((item) => ({ ...item, commits: item.commits > 8 ? 1 : 0 }))
    },
    {
      username: 'jordans',
      problemsSolved: 50,
      easy: 43,
      medium: 7,
      hard: 0,
      contestRating: 1200,
      globalRanking: 380000,
      percentile: 'Unranked',
      activityLevel: 'Low',
      aiSummary: 'Basic practice profile. Not enough evidence for complex frontend problem solving yet.'
    },
    [gap('React', 'partial', 'Basic React exposure'), gap('TypeScript', 'missing', 'No TypeScript evidence'), gap('Redux', 'missing', 'No Redux evidence'), gap('Next.js', 'missing', 'No Next.js evidence'), gap('TailwindCSS', 'missing', 'No TailwindCSS evidence')],
    ['Ranked #5 because the required React ecosystem depth is not present.', 'Experience is below the target range.', 'GitHub activity is limited and mostly bootcamp-level.', 'LeetCode profile does not offset the skill gaps.', 'Recommended for a junior pipeline rather than this opening.']
  )
];

export const rankings: Ranking[] = [
  {
    _id: 'ranking_frontend_latest',
    jobId: 'job_frontend',
    candidates: candidates
      .slice()
      .sort((a, b) => b.aiScore - a.aiScore)
      .map((item, index) => ({
        candidateId: item._id,
        rank: index + 1,
        score: item.aiScore,
        matchPercentage: item.matchPercentage,
        recommendation: item.recommendation
      })),
    generatedAt: now
  }
];

export const feedback: Feedback[] = [];

export const applications: Application[] = [
  {
    _id: 'app_sarah',
    candidateId: 'user_candidate_demo',
    jobId: 'job_frontend',
    status: 'Under Review',
    appliedAt: now,
    updatedAt: now,
    aiScore: 91,
    recommendation: 'Strong Hire',
    resumeUrl: '/uploads/sarah-chen-resume.pdf',
    githubUrl: 'https://github.com/sarahchen-dev',
    linkedinUrl: 'https://linkedin.com/in/sarah-chen',
    portfolioUrl: 'https://sarahchen-dev.dev',
    leetcodeUsername: 'sarahc'
  }
];

export function resetDemoData() {
  candidates.forEach((item) => {
    item.recruiterDecision = 'pending';
    item.recruiterReason = '';
    item.feedbackAt = undefined;
  });
  feedback.splice(0, feedback.length);
  applications.splice(0, applications.length);
  applications.push({
    _id: 'app_sarah',
    candidateId: 'user_candidate_demo',
    jobId: 'job_frontend',
    status: 'Under Review',
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aiScore: 91,
    recommendation: 'Strong Hire',
    resumeUrl: '/uploads/sarah-chen-resume.pdf',
    githubUrl: 'https://github.com/sarahchen-dev',
    linkedinUrl: 'https://linkedin.com/in/sarah-chen',
    portfolioUrl: 'https://sarahchen-dev.dev',
    leetcodeUsername: 'sarahc'
  });
}
