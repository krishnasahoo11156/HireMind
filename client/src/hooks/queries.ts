import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { api } from '../lib/api';
import { db, storage, auth } from '../firebase/config';
import type { Job, Application } from '../types';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs() as Promise<{ jobs: Job[] }>
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => api.job(id) as Promise<{ job: Job }>
  });
}

interface CreateJobPayload {
  title: string;
  description: string;
  department: string;
  requiredSkills: string[];
  weights: {
    github: number;
    leetcode: number;
    education: number;
  };
}

export function useCreateJob(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJobPayload) => api.createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      options?.onSuccess?.();
    }
  });
}

export function useDeleteJob(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      options?.onSuccess?.();
    }
  });
}

export function useApplyJob(options?: { onSuccess?: () => void; onError?: (err: any) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to apply.');
      }

      // Submit application to backend via multipart REST API endpoint.
      // This handles resume upload, applications mapping, database edits, and user profile updates under admin privilege safely.
      const result = await api.applyJob(formData);
      const application = result.application;
      const applicationId = application._id;

      if (!applicationId) {
        throw new Error('Failed to submit application to the server.');
      }

      return { id: applicationId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      options?.onSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
    }
  });
}

export function useRetryAnalysis(options?: { onSuccess?: () => void; onError?: (err: any) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return api.analyzeApplication(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      options?.onSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
    }
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api.myApplications() as Promise<{ applications: Application[] }>
  });
}
