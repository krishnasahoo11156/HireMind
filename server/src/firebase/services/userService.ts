import { col, docToObject, snapshotToArray } from '../admin.js';
import admin from 'firebase-admin';

export interface FirestoreUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: admin.firestore.Timestamp;
}

export const userService = {
  async findById(id: string): Promise<FirestoreUser | null> {
    const snap = await col('users').doc(id).get();
    return docToObject<FirestoreUser>(snap);
  },

  async findOne(filters: Partial<{ email: string; role: string }>): Promise<FirestoreUser | null> {
    let q: admin.firestore.Query = col('users');
    if (filters.email) q = q.where('email', '==', filters.email);
    if (filters.role) q = q.where('role', '==', filters.role);
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return docToObject<FirestoreUser>(d);
  },

  async findAll(filters?: Partial<{ role: string }>): Promise<FirestoreUser[]> {
    let q: admin.firestore.Query = col('users');
    if (filters?.role) q = q.where('role', '==', filters.role);
    const snap = await q.get();
    return snapshotToArray<FirestoreUser>(snap);
  },

  async create(id: string, data: Omit<FirestoreUser, 'id'>): Promise<FirestoreUser> {
    const payload = { ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    await col('users').doc(id).set(payload);
    return { id, ...data };
  },

  async update(id: string, data: Partial<FirestoreUser>): Promise<void> {
    await col('users').doc(id).update(data as admin.firestore.UpdateData<FirestoreUser>);
  }
};
