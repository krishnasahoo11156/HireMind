import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
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

export function useApplyJob(options?: { onSuccess?: () => void; onError?: (err: any) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.applyJob(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
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
