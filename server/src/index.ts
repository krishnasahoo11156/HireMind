import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import path from 'path';
import bcrypt from 'bcryptjs';
import router from './routes/index.js';
import { initSocket } from './socket.js';
import { connectDB } from './config/db.js';
import { UserModel } from './models/schemas.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 5001);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve('server/uploads')));
app.use('/api', router);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  res.status(500).json({ error: message });
});

async function seedDefaultUsers() {
  console.log('[Startup Auto-Seed] Checking for default users...');
  const recruiterEmail = 'recruiter@hiremind.ai';
  const candidateEmail = 'candidate@hiremind.ai';

  try {
    const recruiterExists = await UserModel.findOne({ email: recruiterEmail });
    if (!recruiterExists) {
      console.log(`[Startup Auto-Seed] Recruiter '${recruiterEmail}' is missing. Seeding...`);
      const hashedPassword = await bcrypt.hash('password', 10);
      await UserModel.create({
        email: recruiterEmail,
        password: hashedPassword,
        name: 'Default Recruiter',
        role: 'recruiter',
        avatar: 'DR'
      });
      console.log(`[Startup Auto-Seed] Successfully seeded '${recruiterEmail}'`);
    } else {
      console.log(`[Startup Auto-Seed] Recruiter '${recruiterEmail}' already exists.`);
    }

    const candidateExists = await UserModel.findOne({ email: candidateEmail });
    if (!candidateExists) {
      console.log(`[Startup Auto-Seed] Candidate '${candidateEmail}' is missing. Seeding...`);
      const hashedPassword = await bcrypt.hash('password', 10);
      await UserModel.create({
        email: candidateEmail,
        password: hashedPassword,
        name: 'Default Candidate',
        role: 'candidate',
        avatar: 'DC'
      });
      console.log(`[Startup Auto-Seed] Successfully seeded '${candidateEmail}'`);
    } else {
      console.log(`[Startup Auto-Seed] Candidate '${candidateEmail}' already exists.`);
    }
  } catch (error: any) {
    console.error('[Startup Auto-Seed] Error checking or seeding default users:', error?.message || error);
  }
}

async function start() {
  // Verify required environment variables
  if (!process.env.MONGODB_URI) {
    throw new Error("Environment variable MONGODB_URI is missing");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("Environment variable JWT_SECRET is missing");
  }

  // Connect to database before starting the server
  try {
    await connectDB();
    // Auto-seed default users if they don't exist
    await seedDefaultUsers();
  } catch (error: any) {
    console.error("Database connection failed:", error?.message || error);
    process.exit(1);
  }

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(port, () => {
    console.log('=== Startup Logs ===');
    console.log(`PORT: ${port}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`MongoDB Connection Status: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
    console.log('====================');
    console.log(`HireMind API listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Server startup error:", error?.message || error);
  process.exit(1);
});
