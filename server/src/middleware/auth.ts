import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { users } from '../data.js';

export interface AuthedRequest extends Request {
  userId?: string;
}

export function auth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    req.userId = 'user_demo';
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'hiremind-demo-secret') as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    req.userId = users[0]._id;
    next();
  }
}
