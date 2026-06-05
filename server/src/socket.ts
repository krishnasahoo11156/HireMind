import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Candidate } from './types.js';

// ---------------------------------------------------------------------------
// Typed Socket.io event maps
// ---------------------------------------------------------------------------

export interface ServerToClientEvents {
  resume_upload_started: (payload: { jobId: string; total: number }) => void;
  resume_parsed: (payload: {
    jobId: string;
    resumeId: string;
    fileName: string;
    candidateName: string;
    status: 'parsed' | 'manual_review' | 'error';
    index: number;
    total: number;
  }) => void;
  candidate_scored: (payload: { jobId: string; candidate: Candidate }) => void;
  ranking_updated: (payload: { jobId: string; candidates: Candidate[] }) => void;
}

export interface ClientToServerEvents {
  join_job: (jobId: string) => void;
  leave_job: (jobId: string) => void;
}

export type AppSocket = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let io: AppSocket | null = null;

export function initSocket(httpServer: HttpServer): AppSocket {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.on('join_job', (jobId) => {
      void socket.join(`job:${jobId}`);
      console.log(`[socket] ${socket.id} joined room job:${jobId}`);
    });

    socket.on('leave_job', (jobId) => {
      void socket.leave(`job:${jobId}`);
      console.log(`[socket] ${socket.id} left room job:${jobId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getSocketServer(): AppSocket {
  if (!io) throw new Error('[socket] Socket.io not initialized. Call initSocket() first.');
  return io;
}
