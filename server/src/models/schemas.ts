import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['recruiter', 'hiring_manager', 'admin', 'candidate'], required: true },
    avatar: String
  },
  { timestamps: true }
);

const jobSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    rawText: String,
    status: { type: String, enum: ['draft', 'active', 'closed', 'archived'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    department: String,
    extractedData: {
      skills: [String],
      experience: String,
      education: String,
      certifications: [String],
      keywords: [String],
      nice_to_have: [String],
      red_flags: [String],
      clarity_score: Number,
      ambiguous_areas: [String],
      weights: {
        github: { type: Number, default: 50 },
        leetcode: { type: Number, default: 30 },
        education: { type: Number, default: 20 }
      }
    }
  },
  { timestamps: true }
);

const resumeSchema = new Schema({
  fileName: String,
  fileUrl: String,
  fileType: { type: String, enum: ['pdf', 'docx'] },
  parsedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: [{ title: String, company: String, duration: String, description: String }],
    projects: [{ name: String, description: String, technologies: [String] }],
    education: [{ degree: String, institution: String, year: String }],
    certifications: [String],
    links: {
      github: String,
      linkedin: String,
      portfolio: String,
      leetcode: String
    }
  },
  /** 'parsed' = AI succeeded; 'manual_review' = fallback, human review needed */
  parseStatus: { type: String, enum: ['parsed', 'manual_review'], default: 'parsed' },
  /** Raw extracted text stored when AI parsing fails */
  rawText: String,
  uploadedAt: { type: Date, default: Date.now }
});

const candidateSchema = new Schema(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume' },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    name: String,
    email: String,
    blindId: String,
    isBlindMode: { type: Boolean, default: false },
    aiScore: { type: Number, min: 0, max: 100 },
    matchPercentage: { type: Number, min: 0, max: 100 },
    recommendation: { type: String, enum: ['Strong Hire', 'Hire', 'Maybe', 'Reject'] },
    githubAnalysis: Schema.Types.Mixed,
    leetcodeAnalysis: Schema.Types.Mixed,
    skillGap: [{
      skill: String,
      isRequired: { type: Boolean, default: true },
      candidateHas: { type: String, enum: ['match', 'partial', 'missing'] },
      evidence: String
    }],
    explanation: [String],
    recruiterDecision: { type: String, enum: ['pending', 'override_select', 'override_reject', 'agree'], default: 'pending' },
    recruiterReason: String,
    feedbackAt: Date
  },
  { timestamps: true }
);

const rankingSchema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  candidates: [{ candidateId: Schema.Types.ObjectId, rank: Number, score: Number, matchPercentage: Number, recommendation: String }],
  generatedAt: { type: Date, default: Date.now }
});

const feedbackSchema = new Schema({
  candidateId: Schema.Types.ObjectId,
  jobId: Schema.Types.ObjectId,
  recruiterId: Schema.Types.ObjectId,
  aiDecision: String,
  recruiterDecision: String,
  reason: String,
  createdAt: { type: Date, default: Date.now }
});

const analyticsSchema = new Schema({
  userId: Schema.Types.ObjectId,
  period: String,
  metrics: {
    resumesReviewed: Number,
    candidatesSelected: Number,
    timeSaved: Number,
    decisionAccuracy: Number,
    recruiterOverrides: Number,
    averageScreeningTime: Number
  },
  funnel: {
    applied: Number,
    screened: Number,
    interviewed: Number,
    offered: Number,
    hired: Number
  },
  createdAt: { type: Date, default: Date.now }
});

const applicationSchema = new Schema(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    recruiterId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: [
        'Applied',
        'Resume Parsed',
        'AI Analysis',
        'Under Review',
        'Shortlisted',
        'Interview',
        'Selected',
        'Rejected'
      ],
      default: 'Applied'
    },
    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    aiScore: Number,
    recommendation: String,
    resumeUrl: String,
    githubUrl: String,
    linkedinUrl: String,
    portfolioUrl: String,
    leetcodeUsername: String
  },
  { timestamps: true }
);

export const UserModel = mongoose.model('User', userSchema);
export const JobModel = mongoose.model('Job', jobSchema);
export const ResumeModel = mongoose.model('Resume', resumeSchema);
export const CandidateModel = mongoose.model('Candidate', candidateSchema);
export const RankingModel = mongoose.model('Ranking', rankingSchema);
export const FeedbackModel = mongoose.model('Feedback', feedbackSchema);
export const AnalyticsModel = mongoose.model('Analytics', analyticsSchema);
export const ApplicationModel = mongoose.model('Application', applicationSchema);
