import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '../data.js';

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function auth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    req.userId = 'user_demo';
    req.userRole = 'recruiter';
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'hiremind-demo-secret') as { sub: string; role?: string };
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    next();
  } catch {
    const defaultUser = users.find(u => u._id === 'user_demo') || users[0];
    req.userId = defaultUser._id;
    req.userRole = defaultUser.role;
    next();
  }
}
