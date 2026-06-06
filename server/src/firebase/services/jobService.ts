import { col, docToObject, snapshotToArray } from '../admin.js';
import admin from 'firebase-admin';

export interface FirestoreJob {
  id: string;
  title: string;
  description: string;
  rawText?: string;
  status: string;
  createdBy?: string;
  recruiterId?: string;
  department?: string;
  location?: string;
  salary?: string;
  company?: string;
  applicationsCount?: number;
  requiredSkills?: string[];
  applicants?: string[];
  extractedData?: any;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

export const jobService = {
  async findById(id: string): Promise<FirestoreJob | null> {
    const snap = await col('jobs').doc(id).get();
    return docToObject<FirestoreJob>(snap);
  },

  async findAll(): Promise<FirestoreJob[]> {
    const snap = await col('jobs').orderBy('createdAt', 'desc').get();
    return snapshotToArray<FirestoreJob>(snap);
  },

  async create(data: Omit<FirestoreJob, 'id'>): Promise<FirestoreJob> {
    const payload = {
      ...data,
      applicationsCount: data.applicationsCount ?? 0,
      recruiterId: data.recruiterId ?? data.createdBy ?? '',
      applicants: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const ref = await col('jobs').add(payload);
    return { id: ref.id, ...data, recruiterId: data.recruiterId ?? data.createdBy ?? '', applicants: [] };
  },

  async update(id: string, data: Partial<FirestoreJob>): Promise<void> {
    await col('jobs').doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    } as admin.firestore.UpdateData<FirestoreJob>);
  },

  async delete(id: string): Promise<void> {
    await col('jobs').doc(id).delete();
  },

  async incrementApplicationsCount(id: string): Promise<void> {
    await col('jobs').doc(id).update({
      applicationsCount: admin.firestore.FieldValue.increment(1)
    });
  },

  async addApplicant(jobId: string, candidateId: string): Promise<void> {
    await col('jobs').doc(jobId).update({
      applicants: admin.firestore.FieldValue.arrayUnion(candidateId)
    });
  }
};
