import type { Candidate } from '../types.js';

export function mapCandidate(doc: any): Candidate {
  if (!doc) {
    throw new Error('Cannot map null or undefined candidate document');
  }
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    _id: obj._id?.toString() ?? '',
    resumeId: obj.resumeId?.toString() ?? '',
    jobId: obj.jobId?.toString() ?? '',
    name: obj.name ?? '',
    email: obj.email ?? '',
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
    feedbackAt: obj.feedbackAt ? new Date(obj.feedbackAt).toISOString() : undefined,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : new Date().toISOString()
  };
}
