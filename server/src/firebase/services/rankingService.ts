import { col, docToObject, snapshotToArray } from '../admin.js';
import admin from 'firebase-admin';

export interface FirestoreRanking {
  id: string;
  jobId: string;
  candidates: Array<{
    candidateId: string;
    rank: number;
    score: number;
    matchPercentage: number;
    recommendation: string;
  }>;
  generatedAt?: admin.firestore.Timestamp;
}

export const rankingService = {
  async findByJobId(jobId: string): Promise<FirestoreRanking | null> {
    const snap = await col('rankings')
      .where('jobId', '==', jobId)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return docToObject<FirestoreRanking>(d);
  },

  async findAll(): Promise<FirestoreRanking[]> {
    const snap = await col('rankings').get();
    return snapshotToArray<FirestoreRanking>(snap);
  },

  async create(data: Omit<FirestoreRanking, 'id'>): Promise<FirestoreRanking> {
    const payload = { ...data, generatedAt: admin.firestore.FieldValue.serverTimestamp() };
    const ref = await col('rankings').add(payload);
    return { id: ref.id, ...data };
  }
};
