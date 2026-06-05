import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/schemas.js';

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Lenient auth middleware that falls back to a default recruiter from DB if token is missing
export async function auth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  
  if (!token) {
    // Find first recruiter in DB to fallback safely
    try {
      const defaultUser = await UserModel.findOne({ role: 'recruiter' });
      if (defaultUser) {
        req.userId = defaultUser._id.toString();
        req.userRole = defaultUser.role;
      }
    } catch {
      // Ignore
    }
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'hiremind-demo-secret') as { sub: string; role?: string };
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    next();
  } catch {
    try {
      const defaultUser = await UserModel.findOne({ role: 'recruiter' });
      if (defaultUser) {
        req.userId = defaultUser._id.toString();
        req.userRole = defaultUser.role;
      }
    } catch {
      // Ignore
    }
    next();
  }
}

// Strict auth middleware requiring valid JWT token
export async function protect(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'hiremind-demo-secret') as { sub: string; role?: string };
    const user = await UserModel.findById(decoded.sub);
    if (!user) {
      res.status(401).json({ error: 'Not authorized, user not found' });
      return;
    }
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, invalid token' });
  }
}
