import { col, docToObject, snapshotToArray } from '../admin.js';
import admin from 'firebase-admin';

export interface FirestoreApplication {
  id: string;
  candidateId: string;
  jobId: string;
  recruiterId?: string;
  status: string;
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  leetcodeUsername?: string;
  candidateName?: string;
  whyApplying?: string;
  aiScore?: number;
  recommendation?: string;
  appliedAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

export const applicationService = {
  async findById(id: string): Promise<FirestoreApplication | null> {
    const snap = await col('applications').doc(id).get();
    return docToObject<FirestoreApplication>(snap);
  },

  async findOne(filters: Partial<{ candidateId: string; jobId: string }>): Promise<FirestoreApplication | null> {
    let q: admin.firestore.Query = col('applications');
    if (filters.candidateId) q = q.where('candidateId', '==', filters.candidateId);
    if (filters.jobId) q = q.where('jobId', '==', filters.jobId);
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return docToObject<FirestoreApplication>(d);
  },

  async findAll(filters?: Partial<{ candidateId: string; jobId: string }>): Promise<FirestoreApplication[]> {
    let q: admin.firestore.Query = col('applications');
    if (filters?.candidateId) q = q.where('candidateId', '==', filters.candidateId);
    if (filters?.jobId) q = q.where('jobId', '==', filters.jobId);
    const snap = await q.get();
    return snapshotToArray<FirestoreApplication>(snap);
  },

  async create(data: Omit<FirestoreApplication, 'id'>): Promise<FirestoreApplication> {
    const payload = {
      ...data,
      appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const ref = await col('applications').add(payload);
    return { id: ref.id, ...data };
  },

  async update(id: string, data: Partial<FirestoreApplication>): Promise<void> {
    await col('applications').doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    } as admin.firestore.UpdateData<FirestoreApplication>);
  }
};
