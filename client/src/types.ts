export type Recommendation = 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject';
export type CandidateHas = 'match' | 'partial' | 'missing';
export type RecruiterDecision = 'pending' | 'override_select' | 'override_reject' | 'agree';

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
  repos: Array<{ name: string; stars: number; language: string }>;
  activitySeries: Array<{ day: string; commits: number }>;
  isLive: boolean;
}


export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'recruiter' | 'hiring_manager' | 'admin' | 'candidate';
  avatar?: string;
}

export interface Application {
  _id: string;
  candidateId: string;
  jobId: string;
  recruiterId?: string;
  status:
    | 'Applied'
    | 'Resume Parsed'
    | 'AI Analysis'
    | 'Under Review'
    | 'Shortlisted'
    | 'Interview'
    | 'Selected'
    | 'Rejected';
  appliedAt: string;
  updatedAt: string;
  aiScore?: number;
  recommendation?: string;
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  leetcodeUsername?: string;
  candidateName?: string;
  whyApplying?: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  rawText: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  createdBy: string;
  department?: string;
  location?: string;
  salary?: string;
  company?: string;
  creatorName?: string;
  applicationsCount?: number;
  extractedData: {
    skills: string[];
    experience: string;
    education: string;
    certifications: string[];
    keywords: string[];
    nice_to_have?: string[];
    red_flags?: string[];
    clarity_score?: number;
    ambiguous_areas?: string[];
    weights?: {
      github: number;
      leetcode: number;
      education: number;
    };
  };
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
}

export interface Resume {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx';
  parsedData: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: Array<{ title: string; company: string; duration: string; description: string }>;
    projects: Array<{ name: string; description: string; technologies: string[] }>;
    education: Array<{ degree: string; institution: string; year: string }>;
    certifications: string[];
    links: { github?: string; linkedin?: string; portfolio?: string; leetcode?: string };
  };
  uploadedAt: string;
}

export interface Candidate {
  _id: string;
  resumeId: string;
  jobId: string;
  name: string;
  email: string;
  username?: string;
  blindId: string;
  isBlindMode: boolean;
  aiScore: number;
  matchPercentage: number;
  recommendation: Recommendation;
  githubAnalysis: {
    username: string;
    publicRepos: number;
    totalCommits: number;
    topLanguages: string[];
    languageBreakdown: Array<{ language: string; value: number }>;
    stars: number;
    contributions: number;
    recentActivity: string;
    aiSummary: string;
    repos: Array<{ name: string; stars: number; language: string }>;
    activitySeries: Array<{ day: string; commits: number }>;
  };
  leetcodeAnalysis: {
    username: string;
    problemsSolved: number;
    easy: number;
    medium: number;
    hard: number;
    contestRating: number;
    globalRanking: number;
    percentile: string;
    activityLevel: string;
    aiSummary: string;
  };
  skillGap: Array<{ skill: string; isRequired: boolean; candidateHas: CandidateHas; evidence: string }>;
  explanation: string[];
  recruiterDecision: RecruiterDecision;
  recruiterReason: string;
  whyApplying?: string;
  feedbackAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAnalytics {
  metrics: {
    resumesReviewed: number;
    candidatesSelected: number;
    timeSaved: number;
    decisionAccuracy: number;
    recruiterOverrides: number;
    averageScreeningTime: number;
  };
  funnel: { applied: number; screened: number; interviewed: number; offered: number; hired: number };
  activity: Array<{ day: string; resumes: number }>;
  aiPerformance: Array<{ name: string; value: number }>;
  overrideReasons: Array<{ reason: string; count: number }>;
}
