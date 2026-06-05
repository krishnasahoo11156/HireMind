import type { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../firebase/admin.js';
import { userService } from '../firebase/services/userService.js';

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * Lenient auth middleware — tries to verify Firebase token.
 * On failure (no token / invalid token) falls back to the first recruiter in Firestore.
 */
export async function auth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    // Fallback: find first recruiter in Firestore
    try {
      const defaultUser = await userService.findOne({ role: 'recruiter' });
      if (defaultUser) {
        req.userId = defaultUser.id;
        req.userRole = defaultUser.role;
      }
    } catch {
      // Ignore — let the request proceed unauthenticated
    }
    next();
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.userId = decoded.uid;
    req.userRole = (decoded as any).role ?? decoded['role'];
    next();
  } catch {
    // Token invalid — fallback to first recruiter
    try {
      const defaultUser = await userService.findOne({ role: 'recruiter' });
      if (defaultUser) {
        req.userId = defaultUser.id;
        req.userRole = defaultUser.role;
      }
    } catch {
      // Ignore
    }
    next();
  }
}

/**
 * Strict auth middleware — requires a valid Firebase ID token.
 * Returns 401 on any failure.
 */
export async function protect(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.userId = decoded.uid;
    req.userRole = (decoded as any).role ?? decoded['role'];
    next();
  } catch {
    res.status(401).json({ error: 'Not authorized, invalid token' });
  }
}
