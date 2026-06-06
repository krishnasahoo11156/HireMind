import admin from 'firebase-admin';

// Initialize only once (guard against hot-reload double-init in tsx watch)
const existingApp = admin.apps.length > 0 ? admin.apps[0]! : null;

const hasCredentials = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

const app = existingApp ?? (
  hasCredentials
    ? admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        } as admin.ServiceAccount)
      })
    : null
);

export const adminAuth = app ? admin.auth(app) : null as any;
export const db = app ? admin.firestore(app) : null as any;
if (db) {
  db.settings({ ignoreUndefinedProperties: true });
}
export const adminStorage = app ? admin.storage(app) : null as any;

// Typed helper — get a typed Firestore collection reference
export const col = (name: string) => {
  if (!db) {
    throw new Error('Firebase Admin SDK is not initialized. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your server .env file.');
  }
  return db.collection(name);
};

// Helper: convert Firestore DocumentSnapshot to a plain object with `id`
export function docToObject<T>(snap: admin.firestore.DocumentSnapshot): (T & { id: string }) | null {
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as T) };
}

// Helper: convert QuerySnapshot to array of plain objects with `id`
export function snapshotToArray<T>(snap: admin.firestore.QuerySnapshot): (T & { id: string })[] {
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}
