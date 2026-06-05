import { col, snapshotToArray } from '../admin.js';
import admin from 'firebase-admin';

export interface FirestoreFeedback {
  id: string;
  candidateId: string;
  jobId: string;
  recruiterId?: string;
  aiDecision?: string;
  recruiterDecision: string;
  reason: string;
  createdAt?: admin.firestore.Timestamp;
}

export const feedbackService = {
  async findAll(filters?: Partial<{ candidateId: string }>): Promise<FirestoreFeedback[]> {
    let q: admin.firestore.Query = col('feedback');
    if (filters?.candidateId) q = q.where('candidateId', '==', filters.candidateId);
    const snap = await q.get();
    return snapshotToArray<FirestoreFeedback>(snap);
  },

  async create(data: Omit<FirestoreFeedback, 'id'>): Promise<FirestoreFeedback> {
    const payload = { ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const ref = await col('feedback').add(payload);
    return { id: ref.id, ...data };
  },

  async countOverrides(): Promise<number> {
    const [overrideSelect, overrideReject] = await Promise.all([
      col('feedback').where('recruiterDecision', '==', 'override_select').count().get(),
      col('feedback').where('recruiterDecision', '==', 'override_reject').count().get()
    ]);
    return overrideSelect.data().count + overrideReject.data().count;
  },

  async countTotal(): Promise<number> {
    const snap = await col('feedback').count().get();
    return snap.data().count;
  }
};
