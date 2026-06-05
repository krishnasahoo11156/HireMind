import { col, docToObject, snapshotToArray } from '../admin.js';
import admin from 'firebase-admin';

export interface FirestoreNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: admin.firestore.Timestamp | admin.firestore.FieldValue;
}

export const notificationService = {
  async create(data: Omit<FirestoreNotification, 'id' | 'createdAt'>): Promise<FirestoreNotification> {
    const payload = {
      ...data,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await col('notifications').add(payload);
    return { id: docRef.id, ...payload };
  },

  async findAllForUser(userId: string): Promise<FirestoreNotification[]> {
    const snap = await col('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshotToArray<FirestoreNotification>(snap);
  },

  async markAsRead(id: string): Promise<void> {
    await col('notifications').doc(id).update({ read: true });
  }
};
