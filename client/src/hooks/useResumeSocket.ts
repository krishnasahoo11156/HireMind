import { useEffect, useRef, useState } from 'react';
import { io as connectSocket, Socket } from 'socket.io-client';
import type { Candidate } from '../types';

// ---------------------------------------------------------------------------
// Types mirroring server event payloads
// ---------------------------------------------------------------------------

export interface ParsedItem {
  resumeId: string;
  fileName: string;
  candidateName: string;
  status: 'parsed' | 'manual_review' | 'error' | 'queued';
}

export interface ResumeSocketState {
  connected: boolean;
  total: number;
  parsed: number;           // how many files have emitted resume_parsed
  items: ParsedItem[];      // ordered list of file statuses
  liveCandidates: Candidate[];
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5001');

export function useResumeSocket(jobId: string): ResumeSocketState {
  const [state, setState] = useState<ResumeSocketState>({
    connected: false,
    total: 0,
    parsed: 0,
    items: [],
    liveCandidates: []
  });

  // Keep stable socket ref across renders
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = connectSocket(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity
    });

    socketRef.current = socket;

    // ── Connection lifecycle ──────────────────────────────────────────────
    socket.on('connect', () => {
      socket.emit('join_job', jobId);
      setState((prev) => ({ ...prev, connected: true }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    socket.on('connect_error', () => {
      setState((prev) => ({ ...prev, connected: false }));
    });

    // Re-join room after reconnect
    socket.io.on('reconnect', () => {
      socket.emit('join_job', jobId);
    });

    // ── Resume events ─────────────────────────────────────────────────────
    socket.on('resume_upload_started', ({ total }) => {
      setState((prev) => ({
        ...prev,
        total,
        parsed: 0,
        items: [],
        liveCandidates: []
      }));
    });

    socket.on('resume_parsed', ({ resumeId, fileName, candidateName, status, index, total }) => {
      setState((prev) => {
        const items = [...prev.items];
        const existing = items.findIndex((i) => i.resumeId === resumeId);
        const item: ParsedItem = { resumeId, fileName, candidateName, status };
        if (existing >= 0) {
          items[existing] = item;
        } else {
          // Insert at correct position
          items[index] = item;
        }
        return {
          ...prev,
          total,
          parsed: prev.parsed + (existing >= 0 ? 0 : 1),
          items
        };
      });
    });

    socket.on('candidate_scored', ({ candidate }) => {
      setState((prev) => {
        // Upsert
        const existing = prev.liveCandidates.findIndex((c) => c._id === candidate._id);
        const next = [...prev.liveCandidates];
        if (existing >= 0) {
          next[existing] = candidate;
        } else {
          next.push(candidate);
        }
        return {
          ...prev,
          liveCandidates: next.sort((a, b) => b.aiScore - a.aiScore)
        };
      });
    });

    socket.on('ranking_updated', ({ candidates }) => {
      setState((prev) => ({ ...prev, liveCandidates: candidates }));
    });

    return () => {
      socket.emit('leave_job', jobId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [jobId]);

  return state;
}
