import { col, docToObject, snapshotToArray } from '../admin.js';
import admin from 'firebase-admin';

export interface FirestoreCandidate {
  id: string;
  resumeId: string;
  jobId: string;
  name?: string;
  email?: string;
  username?: string;
  blindId?: string;
  isBlindMode?: boolean;
  aiScore?: number;
  matchPercentage?: number;
  recommendation?: string;
  githubAnalysis?: any;
  leetcodeAnalysis?: any;
  skillGap?: any[];
  explanation?: string[];
  recruiterDecision?: string;
  recruiterReason?: string;
  feedbackAt?: admin.firestore.Timestamp;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

export const candidateService = {
  async findById(id: string): Promise<FirestoreCandidate | null> {
    const snap = await col('candidates').doc(id).get();
    return docToObject<FirestoreCandidate>(snap);
  },

  async findOne(filters: Partial<{ resumeId: string; jobId: string; email: string }>): Promise<FirestoreCandidate | null> {
    let q: admin.firestore.Query = col('candidates');
    if (filters.resumeId) q = q.where('resumeId', '==', filters.resumeId);
    if (filters.jobId) q = q.where('jobId', '==', filters.jobId);
    if (filters.email) q = q.where('email', '==', filters.email);
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return docToObject<FirestoreCandidate>(d);
  },

  async findAll(filters?: Partial<{ jobId: string }>): Promise<FirestoreCandidate[]> {
    let q: admin.firestore.Query = col('candidates');
    if (filters?.jobId) q = q.where('jobId', '==', filters.jobId);
    q = q.orderBy('aiScore', 'desc');
    const snap = await q.get();
    return snapshotToArray<FirestoreCandidate>(snap);
  },

  async create(data: Omit<FirestoreCandidate, 'id'>): Promise<FirestoreCandidate> {
    const payload = {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const ref = await col('candidates').add(payload);
    return { id: ref.id, ...data };
  },

  async update(id: string, data: Partial<FirestoreCandidate>): Promise<void> {
    await col('candidates').doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    } as admin.firestore.UpdateData<FirestoreCandidate>);
  },

  async count(filters?: Partial<{ recruiterDecision: string }>): Promise<number> {
    let q: admin.firestore.Query = col('candidates');
    if (filters?.recruiterDecision) q = q.where('recruiterDecision', '==', filters.recruiterDecision);
    const snap = await q.count().get();
    return snap.data().count;
  },

  async countTotal(): Promise<number> {
    const snap = await col('candidates').count().get();
    return snap.data().count;
  },

  async countSelected(): Promise<number> {
    const [overrideSelect, strongHire, hire] = await Promise.all([
      col('candidates').where('recruiterDecision', '==', 'override_select').count().get(),
      col('candidates').where('recommendation', '==', 'Strong Hire').count().get(),
      col('candidates').where('recommendation', '==', 'Hire').count().get()
    ]);
    // These may overlap but give a reasonable approximation
    return overrideSelect.data().count + strongHire.data().count + hire.data().count;
  }
};
