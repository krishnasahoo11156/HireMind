import { adminStorage } from './admin.js';

const BUCKET = process.env.FIREBASE_STORAGE_BUCKET ?? `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;

/**
 * Upload a file buffer to Firebase Storage and return its public download URL.
 */
export async function uploadResumeToStorage(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  userId?: string
): Promise<string> {
  const bucket = adminStorage.bucket(BUCKET);
  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destPath = `resumes/${userId ?? 'anonymous'}/${timestamp}-${safeName}`;

  const file = bucket.file(destPath);
  await file.save(buffer, {
    metadata: { contentType: mimeType },
    resumable: false
  });

  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${BUCKET}/${destPath}`;
  return publicUrl;
}
