import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import router from './routes/index.js';
import { initSocket } from './socket.js';

// Validate required Firebase env vars at startup
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`[Startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Importing this module initializes Firebase Admin SDK
import('./firebase/admin.js').catch((err) => {
  console.error('[Startup] Failed to initialize Firebase Admin SDK:', err);
  process.exit(1);
});

const app = express();
const port = Number(process.env.PORT ?? 5001);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api', router);

// Global error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  res.status(500).json({ error: message });
});

async function seedDefaultUsers() {
  const { adminAuth, db } = await import('./firebase/admin.js');
  const { userService } = await import('./firebase/services/userService.js');

  const defaultUsers = [
    { email: 'recruiter@hiremind.ai', name: 'Default Recruiter', role: 'recruiter', password: 'password' },
    { email: 'candidate@hiremind.ai', name: 'Default Candidate', role: 'candidate', password: 'password' }
  ];

  for (const userData of defaultUsers) {
    try {
      // Check if user already exists in Firestore
      const existing = await userService.findOne({ email: userData.email });
      if (existing) {
        console.log(`[Startup] User '${userData.email}' already exists in Firestore.`);
        continue;
      }

      // Create in Firebase Auth
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(userData.email);
        console.log(`[Startup] Firebase Auth user '${userData.email}' already exists.`);
      } catch {
        userRecord = await adminAuth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name
        });
        console.log(`[Startup] Created Firebase Auth user '${userData.email}'.`);
      }

      // Set custom claims
      await adminAuth.setCustomUserClaims(userRecord.uid, { role: userData.role });

      // Create Firestore profile
      await userService.create(userRecord.uid, {
        uid: userRecord.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role
      });
      console.log(`[Startup] Seeded user '${userData.email}' (${userData.role}).`);
    } catch (err: any) {
      console.error(`[Startup] Failed to seed user '${userData.email}':`, err.message);
    }
  }
}

async function start() {
  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(port, async () => {
    console.log('=== HireMind Server Startup ===');
    console.log(`PORT:     ${port}`);
    console.log(`ENV:      ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`Firebase: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log('================================');
    console.log(`HireMind API listening on http://localhost:${port}`);

    // Seed default users after server is up (non-blocking)
    await seedDefaultUsers().catch((err) => {
      console.warn('[Startup] Seed warning:', err.message);
    });
  });
}

start().catch((error) => {
  console.error('Server startup error:', error?.message || error);
  process.exit(1);
});
