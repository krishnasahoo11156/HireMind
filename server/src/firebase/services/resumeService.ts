import { col, docToObject, snapshotToArray } from '../admin.js';
import admin from 'firebase-admin';

export interface FirestoreResume {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx';
  userId?: string;
  parsedData?: any;
  parseStatus?: 'parsed' | 'manual_review';
  rawText?: string;
  uploadedAt?: admin.firestore.Timestamp;
}

export const resumeService = {
  async findById(id: string): Promise<FirestoreResume | null> {
    const snap = await col('resumes').doc(id).get();
    return docToObject<FirestoreResume>(snap);
  },

  async findOne(filters: Partial<{ fileName: string }>): Promise<FirestoreResume | null> {
    let q: admin.firestore.Query = col('resumes');
    if (filters.fileName) q = q.where('fileName', '==', filters.fileName);
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return docToObject<FirestoreResume>(d);
  },

  async findAll(): Promise<FirestoreResume[]> {
    const snap = await col('resumes').get();
    return snapshotToArray<FirestoreResume>(snap);
  },

  async create(data: Omit<FirestoreResume, 'id'>): Promise<FirestoreResume> {
    const payload = { ...data, uploadedAt: admin.firestore.FieldValue.serverTimestamp() };
    const ref = await col('resumes').add(payload);
    return { id: ref.id, ...data };
  },

  async delete(id: string): Promise<void> {
    await col('resumes').doc(id).delete();
  },

  async update(id: string, data: Partial<FirestoreResume>): Promise<void> {
    await col('resumes').doc(id).update(data);
  },

  async count(): Promise<number> {
    const snap = await col('resumes').count().get();
    return snap.data().count;
  }
};
