import type { Candidate, Job } from '../types.js';

export function mapCandidate(doc: any): Candidate {
  if (!doc) {
    throw new Error('Cannot map null or undefined candidate document');
  }
  // Support both Firestore plain objects (with `id` field) and legacy Mongoose docs (with `_id`)
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const id = obj.id ?? obj._id?.toString() ?? '';
  return {
    _id: id,
    resumeId: obj.resumeId?.toString() ?? '',
    jobId: obj.jobId?.toString() ?? '',
    name: obj.name ?? '',
    email: obj.email ?? '',
    username: obj.username ?? '',
    blindId: obj.blindId ?? '',
    isBlindMode: !!obj.isBlindMode,
    aiScore: obj.aiScore ?? 0,
    matchPercentage: obj.matchPercentage ?? 0,
    recommendation: obj.recommendation ?? 'Maybe',
    githubAnalysis: obj.githubAnalysis ?? {},
    leetcodeAnalysis: obj.leetcodeAnalysis ?? {},
    skillGap: obj.skillGap ?? [],
    explanation: obj.explanation ?? [],
    recruiterDecision: obj.recruiterDecision ?? 'pending',
    recruiterReason: obj.recruiterReason ?? '',
    whyApplying: obj.whyApplying ?? '',
    feedbackAt: obj.feedbackAt ? new Date(obj.feedbackAt).toISOString() : undefined,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString()
  };
}

export function mapJob(doc: any): Job {
  if (!doc) {
    throw new Error('Cannot map null or undefined job document');
  }
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const id = obj.id ?? obj._id?.toString() ?? '';
  return {
    _id: id,
    title: obj.title ?? '',
    description: obj.description ?? '',
    rawText: obj.rawText ?? '',
    status: obj.status ?? 'active',
    createdBy: obj.createdBy?.toString() ?? '',
    department: obj.department ?? '',
    location: obj.location ?? '',
    salary: obj.salary ?? '',
    company: obj.company ?? '',
    creatorName: obj.creatorName ?? '',
    applicationsCount: obj.applicationsCount ?? 0,
    candidateCount: obj.candidateCount ?? obj.applicationsCount ?? 0,
    extractedData: obj.extractedData ?? {
      skills: [],
      experience: '',
      education: '',
      certifications: [],
      keywords: []
    },
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString()
  };
}
