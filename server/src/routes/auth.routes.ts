import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { users } from '../data.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';

export const authRouter = express.Router();

const publicUser = (user: (typeof users)[number]) => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

function tokenFor(userId: string, role: string) {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET ?? 'hiremind-demo-secret', { expiresIn: '7d' });
}

authRouter.post('/register', async (req, res) => {
  const body = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(['recruiter', 'hiring_manager', 'admin', 'candidate']) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Invalid registration payload', details: body.error.flatten() });
    return;
  }
  if (users.some((user) => user.email === body.data.email)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const now = new Date().toISOString();
  const user = { _id: `user_${Date.now()}`, email: body.data.email, password: await bcrypt.hash(body.data.password, 10), name: body.data.name, role: body.data.role as any, createdAt: now, updatedAt: now };
  users.push(user);
  res.status(201).json({ user: publicUser(user), token: tokenFor(user._id, user.role) });
});

authRouter.post('/login', async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: 'Invalid login payload' });
    return;
  }
  const user = users.find((item) => item.email === body.data.email);
  if (!user || !(await bcrypt.compare(body.data.password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({ user: publicUser(user), token: tokenFor(user._id, user.role) });
});

authRouter.get('/me', auth, (req: AuthedRequest, res) => {
  const user = users.find((item) => item._id === req.userId) ?? users[0];
  res.json({ user: publicUser(user) });
});
