import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import path from 'path';
import router from './routes/index.js';
import { initSocket } from './socket.js';
import { connectDB } from './config/db.js';

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
