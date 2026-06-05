import express from 'express';
import { adminAuth, db } from '../firebase/admin.js';
import { userService } from '../firebase/services/userService.js';
import type { AuthedRequest } from '../middleware/auth.js';

export const authRouter = express.Router();

// ─── POST /api/auth/register ───────────────────────────────────────────────
// Creates a user in Firebase Auth + Firestore and sets custom role claim.
authRouter.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email and password are required' });
    return;
  }

  const validRole = role === 'candidate' ? 'candidate' : 'recruiter';

  try {
    // 1. Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name
    });

    // 2. Set custom role claim so tokens carry the role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: validRole });

    // 3. Persist profile in Firestore
    await userService.create(userRecord.uid, {
      uid: userRecord.uid,
      name,
      email,
      role: validRole
    });

    // 4. Create a custom token so the client can sign in immediately
    const customToken = await adminAuth.createCustomToken(userRecord.uid, { role: validRole });

    res.status(201).json({
      success: true,
      customToken,
      user: { id: userRecord.uid, name, email, role: validRole }
    });
  } catch (error: any) {
    console.error('[auth] register error:', error);
    if (error.code === 'auth/email-already-exists') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    res.status(500).json({
      error: error.message ?? 'Registration failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────
// Accepts a Firebase ID token (obtained by client-side signInWithEmailAndPassword),
// verifies it, and returns the enriched user profile.
authRouter.post('/login', async (req, res) => {
  const { idToken, role, name, password } = req.body;

  if (!idToken) {
    res.status(400).json({ error: 'Firebase ID token is required.' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // Load profile from Firestore
    let user = await userService.findById(uid);

    // If Firestore profile is missing and no role is provided, notify client to prompt for profile setup
    if (!user && !role) {
      const firebaseUser = await adminAuth.getUser(uid);
      res.json({
        success: true,
        requiresProfileSetup: true,
        uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName ?? ''
      });
      return;
    }

    // Verify password if user exists
    if (user && user.password && password && user.password !== password) {
      res.status(401).json({ error: 'Incorrect password for this Google account.' });
      return;
    }

    // Create or update Firestore profile if missing or setup requested
    if (!user || role || name || (password && !user.password)) {
      const firebaseUser = await adminAuth.getUser(uid);
      const targetRole = role ?? (decoded as any).role ?? 'recruiter';
      const targetName = name ?? firebaseUser.displayName ?? firebaseUser.email ?? 'User';

      if (role) {
        await adminAuth.setCustomUserClaims(uid, { role: targetRole });
      }

      if (!user) {
        await userService.create(uid, {
          uid,
          name: targetName,
          email: firebaseUser.email ?? '',
          role: targetRole,
          password: password
        });
      } else {
        const updatePayload: any = {
          name: targetName,
          role: targetRole
        };
        if (password) {
          updatePayload.password = password;
        }
        await userService.update(uid, updatePayload);
      }
      user = await userService.findById(uid);
    }

    res.json({
      success: true,
      user: {
        id: uid,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        githubUrl: user?.githubUrl,
        linkedinUrl: user?.linkedinUrl,
        portfolioUrl: user?.portfolioUrl,
        leetcodeUsername: user?.leetcodeUsername
      }
    });
  } catch (error: any) {
    console.error('[auth] login error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired Firebase token',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
authRouter.get('/me', async (req: AuthedRequest, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    let user = await userService.findById(uid);
    if (!user) {
      // Firestore profile missing — create it from Firebase Auth record
      const firebaseUser = await adminAuth.getUser(uid);
      const role = (decoded as any).role ?? 'recruiter';
      await userService.create(uid, {
        uid,
        name: firebaseUser.displayName ?? firebaseUser.email ?? 'User',
        email: firebaseUser.email ?? '',
        role
      });
      user = await userService.findById(uid);
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: uid,
        name: user.name,
        email: user.email,
        role: user.role,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        portfolioUrl: user.portfolioUrl,
        leetcodeUsername: user.leetcodeUsername
      }
    });
  } catch (error: any) {
    console.error('[auth] /me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────
authRouter.patch('/me', async (req: AuthedRequest, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { name, githubUrl, linkedinUrl, portfolioUrl, leetcodeUsername } = req.body;

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name;
    if (githubUrl !== undefined) updatePayload.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) updatePayload.linkedinUrl = linkedinUrl;
    if (portfolioUrl !== undefined) updatePayload.portfolioUrl = portfolioUrl;
    if (leetcodeUsername !== undefined) updatePayload.leetcodeUsername = leetcodeUsername;

    await userService.update(uid, updatePayload);

    const user = await userService.findById(uid);
    res.json({
      success: true,
      user: {
        id: uid,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        githubUrl: user?.githubUrl,
        linkedinUrl: user?.linkedinUrl,
        portfolioUrl: user?.portfolioUrl,
        leetcodeUsername: user?.leetcodeUsername
      }
    });
  } catch (error: any) {
    console.error('[auth] patch /me error:', error);
    res.status(401).json({ error: 'Invalid token or update failed' });
  }
});

// ─── GET /api/health ──────────────────────────────────────────────────────
// Returns Firestore connectivity status
authRouter.get('/health', async (_req, res) => {
  try {
    await db.collection('_health_ping').limit(1).get();
    res.json({ status: 'ok', firebase: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', firebase: 'disconnected' });
  }
});
