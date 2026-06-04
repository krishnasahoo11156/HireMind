export type Role = 'recruiter' | 'hiring_manager' | 'admin';
export type JobStatus = 'draft' | 'active' | 'closed' | 'archived';
export type Recommendation = 'Strong Hire' | 'Hire' | 'Maybe' | 'Reject';
export type RecruiterDecision = 'pending' | 'override_select' | 'override_reject' | 'agree';
export type CandidateHas = 'match' | 'partial' | 'missing';

export interface User {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  rawText: string;
  status: JobStatus;
  createdBy: string;
  extractedData: {
    skills: string[];
    experience: string;
    education: string;
    certifications: string[];
    keywords: string[];
  };
  createdAt: string;
  updatedAt: string;
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
    links: {
      github?: string;
      linkedin?: string;
      portfolio?: string;
      leetcode?: string;
    };
  };
  uploadedAt: string;
}

export interface Candidate {
  _id: string;
  resumeId: string;
  jobId: string;
  name: string;
  email: string;
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
  skillGap: Array<{
    skill: string;
    isRequired: boolean;
    candidateHas: CandidateHas;
    evidence: string;
  }>;
  explanation: string[];
  recruiterDecision: RecruiterDecision;
  recruiterReason: string;
  feedbackAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ranking {
  _id: string;
  jobId: string;
  candidates: Array<{
    candidateId: string;
    rank: number;
    score: number;
    matchPercentage: number;
    recommendation: Recommendation;
  }>;
  generatedAt: string;
}

export interface Feedback {
  _id: string;
  candidateId: string;
  jobId: string;
  recruiterId: string;
  aiDecision: string;
  recruiterDecision: string;
  reason: string;
  createdAt: string;
}
