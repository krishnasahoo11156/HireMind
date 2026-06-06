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

export function useApplyJob(options?: { onSuccess?: () => void; onError?: (err: any) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const jobId = formData.get('jobId') as string;
      const file = formData.get('file') as File | null;
      const name = formData.get('name') as string;
      const whyApplying = formData.get('whyApplying') as string;
      const githubUrl = formData.get('githubUrl') as string;
      const linkedinUrl = formData.get('linkedinUrl') as string;
      const portfolioUrl = formData.get('portfolioUrl') as string;
      const leetcodeUsername = formData.get('leetcodeUsername') as string;

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to apply.');
      }

      // 1. Verify job exists in Firestore
      const jobDocRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobDocRef);
      if (!jobSnap.exists()) {
        throw new Error('Job does not exist.');
      }
      const jobData = jobSnap.data();
      const recruiterId = jobData.createdBy || '';

      // 2. Verify candidate exists in users collection
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        throw new Error('User profile not found.');
      }

      // 3. Verify candidate has not already applied
      const appsQuery = query(
        collection(db, 'applications'),
        where('jobId', '==', jobId),
        where('candidateId', '==', currentUser.uid)
      );
      const appsSnap = await getDocs(appsQuery);
      if (!appsSnap.empty) {
        throw new Error('You have already applied.');
      }

      // Upload file to Firebase Storage if present
      let resumeUrl = '';
      if (file) {
        const storageRef = ref(storage, `resumes/${currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        resumeUrl = await getDownloadURL(uploadResult.ref);
      }

      // 4. Create Application document
      const appRef = await addDoc(collection(db, 'applications'), {
        jobId,
        recruiterId,
        candidateId: currentUser.uid,
        candidateName: name || currentUser.displayName || 'Anonymous',
        candidateEmail: currentUser.email || '',
        resumeUrl,
        status: 'applied',
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        aiAnalyzed: false
      });
      
      const applicationId = appRef.id;
      // Store the applicationId within the doc
      await updateDoc(appRef, { applicationId });

      // 5. Update Job document (applicants array, applicationsCount)
      const currentApplicants = jobData.applicants || [];
      if (!currentApplicants.includes(currentUser.uid)) {
        currentApplicants.push(currentUser.uid);
      }
      await updateDoc(jobDocRef, {
        applicants: currentApplicants,
        applicationsCount: (jobData.applicationsCount || 0) + 1
      });

      // 6. Update Candidate profile in 'users' collection
      await updateDoc(userDocRef, {
        githubUrl: githubUrl || '',
        linkedinUrl: linkedinUrl || '',
        portfolioUrl: portfolioUrl || '',
        leetcodeUsername: leetcodeUsername || '',
        whyApplying: whyApplying || '',
        applicationId
      });

      // 7. Trigger backend AI background analysis
      const backgroundFormData = new FormData();
      backgroundFormData.append('applicationId', applicationId);
      backgroundFormData.append('jobId', jobId);
      backgroundFormData.append('name', name);
      backgroundFormData.append('whyApplying', whyApplying);
      if (file) {
        backgroundFormData.append('file', file);
      }

      try {
        await api.analyzeApplication(backgroundFormData);
      } catch (err) {
        console.warn('[queries] Failed to trigger backend AI analyze background task:', err);
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

export function useMyApplications() {
  return useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api.myApplications() as Promise<{ applications: Application[] }>
  });
}
