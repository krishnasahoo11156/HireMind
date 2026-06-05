import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
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
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        error: "Database unavailable"
      });
      return;
    }
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
  console.log('[Login Debug] Received login request');
  
  try {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    }).safeParse(req.body);

    if (!body.success) {
      console.warn('[Login Debug] Invalid payload format:', body.error.flatten());
      res.status(400).json({ error: 'Invalid login payload' });
      return;
    }

    const { email, password } = body.data;
    console.log(`[Login Debug] Incoming email: ${email}`);

    if (mongoose.connection.readyState !== 1) {
      console.error('[Login Debug] Database connection is not ready. Status state:', mongoose.connection.readyState);
      res.status(503).json({
        error: "Database unavailable"
      });
      return;
    }

    console.log('[Login Debug] Verification: Executing UserModel.findOne...');
    let user;
    try {
      user = await UserModel.findOne({ email });
      console.log(`[Login Debug] UserModel.findOne success. User found: ${!!user}`);
    } catch (dbErr: any) {
      console.error('[Login Debug] Failure Point: UserModel.findOne threw an error:', dbErr);
      throw new Error(`Database findOne failed: ${dbErr.message}`);
    }

    if (!user) {
      console.warn(`[Login Debug] User not found for email: ${email}`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('[Login Debug] Verification: Executing bcrypt.compare...');
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log(`[Login Debug] bcrypt.compare success. Result: ${isMatch}`);
    } catch (bcryptErr: any) {
      console.error('[Login Debug] Failure Point: bcrypt.compare threw an error:', bcryptErr);
      throw new Error(`Password comparison failed: ${bcryptErr.message}`);
    }

    if (!isMatch) {
      console.warn(`[Login Debug] Password mismatch for user: ${email}`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('[Login Debug] Verification: Checking JWT_SECRET presence...');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Login Debug] Failure Point: JWT_SECRET environment variable is missing');
      throw new Error('JWT_SECRET is missing in environment variables');
    }
    console.log('[Login Debug] JWT_SECRET is present.');

    console.log('[Login Debug] Verification: Executing jwt.sign...');
    let token;
    try {
      token = tokenFor(user._id.toString(), user.role);
      console.log('[Login Debug] jwt.sign success. JWT generated.');
    } catch (jwtErr: any) {
      console.error('[Login Debug] Failure Point: jwt.sign threw an error:', jwtErr);
      throw new Error(`JWT generation failed: ${jwtErr.message}`);
    }

    const responsePayload = { user: publicUser(user), token };
    console.log('[Login Debug] Final response: success. Sending token.');
    res.json(responsePayload);

  } catch (error: any) {
    console.error('[Login Debug] Login controller caught exception:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
