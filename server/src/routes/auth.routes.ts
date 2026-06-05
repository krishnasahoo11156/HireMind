import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel } from '../models/schemas.js';
import { auth, type AuthedRequest } from '../middleware/auth.js';

export const authRouter = express.Router();

const publicUser = (user: any) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  return userObj;
};

function tokenFor(userId: string, role: string) {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET ?? 'hiremind-demo-secret', { expiresIn: '7d' });
}

authRouter.post('/register', async (req, res) => {
  const body = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['recruiter', 'hiring_manager', 'admin', 'candidate'])
  }).safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: 'Invalid registration payload', details: body.error.flatten() });
    return;
  }

  try {
    const existing = await UserModel.findOne({ email: body.data.email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(body.data.password, 10);
    const user = await UserModel.create({
      name: body.data.name,
      email: body.data.email,
      password: hashedPassword,
      role: body.data.role,
      avatar: body.data.name.slice(0, 2).toUpperCase()
    });

    res.status(201).json({ user: publicUser(user), token: tokenFor(user._id.toString(), user.role) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

authRouter.post('/login', async (req, res) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }).safeParse(req.body);

  if (!body.success) {
    res.status(400).json({ error: 'Invalid login payload' });
    return;
  }

  try {
    const user = await UserModel.findOne({ email: body.data.email });
    if (!user || !(await bcrypt.compare(body.data.password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    res.json({ user: publicUser(user), token: tokenFor(user._id.toString(), user.role) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

authRouter.get('/me', auth, async (req: AuthedRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await UserModel.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: publicUser(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
