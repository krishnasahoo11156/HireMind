import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const TOKEN_KEY = 'hiremind_token';
const USER_KEY = 'hiremind_user';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'admin';
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  leetcodeUsername?: string;
}

export interface AuthContextValue {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (payload: { name: string; email: string; password: string; role: string }) => Promise<AppUser>;
  loginWithGoogle: (role?: 'candidate' | 'recruiter' | 'admin', name?: string, password?: string) => Promise<AppUser>;
  updateProfile: (payload: { name?: string; githubUrl?: string; linkedinUrl?: string; portfolioUrl?: string; leetcodeUsername?: string }) => Promise<AppUser>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
export const RecruiterAuthContext = createContext<AuthContextValue | null>(null);
export const CandidateAuthContext = createContext<AuthContextValue | null>(null);
export const AdminAuthContext = createContext<AuthContextValue | null>(null);

async function fetchAppUser(uid: string, idToken?: string): Promise<AppUser | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: uid,
        name: data.name ?? 'User',
        email: data.email ?? '',
        role: data.role ?? 'recruiter',
        githubUrl: data.githubUrl,
        linkedinUrl: data.linkedinUrl,
        portfolioUrl: data.portfolioUrl,
        leetcodeUsername: data.leetcodeUsername
      };
    }
  } catch (err: any) {
    console.warn('[AuthContext] Direct Firestore profile fetch failed/permission denied, falling back to API:', err.message || err);
  }

  if (idToken) {
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/api$/, '');
      const resp = await fetch(`${apiBase}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.user) {
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            githubUrl: data.user.githubUrl,
            linkedinUrl: data.user.linkedinUrl,
            portfolioUrl: data.user.portfolioUrl,
            leetcodeUsername: data.user.leetcodeUsername
          };
        }
      }
    } catch (apiErr: any) {
      console.error('[AuthContext] API profile fetch fallback failed:', apiErr.message || apiErr);
    }
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken(false);
          localStorage.setItem(TOKEN_KEY, idToken);

          // Read profile from Firestore directly (falls back to API if permission issue occurs)
          const appUser = await fetchAppUser(fbUser.uid, idToken);
          if (appUser) {
            setUser(appUser);
            localStorage.setItem(USER_KEY, JSON.stringify(appUser));
          } else {
            // Document doesn't exist yet (e.g. registration in progress or new Google user needing setup)
            setUser(null);
            localStorage.removeItem(USER_KEY);
          }
        } catch (err) {
          console.warn('[AuthContext] Auth state listener failed:', err);
        }
      } else {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Proactively refresh token before expiry (Firebase tokens last 1 hour)
  useEffect(() => {
    if (!firebaseUser) return;
    const interval = setInterval(async () => {
      try {
        const token = await firebaseUser.getIdToken(true);
        localStorage.setItem(TOKEN_KEY, token);
      } catch { /* ignore */ }
    }, 50 * 60 * 1000); // refresh every 50 minutes
    return () => clearInterval(interval);
  }, [firebaseUser]);

  const login = async (email: string, password: string): Promise<AppUser> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken(true);
    localStorage.setItem(TOKEN_KEY, idToken);

    // Read directly from Firestore (falls back to API if permission issue occurs)
    const appUser = await fetchAppUser(cred.user.uid, idToken);
    if (!appUser) {
      throw new Error('User profile not found in Firestore');
    }

    setUser(appUser);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    return appUser;
  };

  const register = async (payload: { name: string; email: string; password: string; role: string }): Promise<AppUser> => {
    const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/api$/, '');

    // Backend creates the Firebase Auth user and returns a customToken
    const resp = await fetch(`${apiBase}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error ?? 'Registration failed');
    }
    const data = await resp.json();

    // Sign in with the custom token received from the backend
    const cred = await signInWithCustomToken(auth, data.customToken);

    // Force-refresh to pick up custom claims set by backend
    const idToken = await cred.user.getIdToken(true);
    localStorage.setItem(TOKEN_KEY, idToken);

    // Read directly from Firestore (falls back to API if permission issue occurs)
    const appUser = await fetchAppUser(cred.user.uid, idToken);
    if (!appUser) {
      throw new Error('User profile was not initialized in Firestore by the backend.');
    }

    setUser(appUser);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    return appUser;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const loginWithGoogle = async (role?: 'candidate' | 'recruiter' | 'admin', name?: string, password?: string): Promise<AppUser> => {
    let idToken = '';
    let uid = '';

    if (auth.currentUser) {
      idToken = await auth.currentUser.getIdToken(true);
      uid = auth.currentUser.uid;
    } else {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      idToken = await cred.user.getIdToken(true);
      uid = cred.user.uid;
    }

    localStorage.setItem(TOKEN_KEY, idToken);

    const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/api$/, '');
    const resp = await fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, role, name, password })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Google authentication failed' }));
      throw new Error(err.error ?? 'Google authentication failed');
    }
    const data = await resp.json();

    if (data.requiresProfileSetup) {
      // Return a partial user to let the auth setup complete
      return {
        id: uid,
        name: name || auth.currentUser?.displayName || 'User',
        email: auth.currentUser?.email || '',
        role: role || 'recruiter'
      };
    }

    // Force refresh token to pickup backend set custom claims if setup occurred
    if (role) {
      if (auth.currentUser) {
        idToken = await auth.currentUser.getIdToken(true);
        localStorage.setItem(TOKEN_KEY, idToken);
      }
    }

    // Read directly from Firestore (falls back to API if permission issue occurs)
    const appUser = await fetchAppUser(uid, idToken);
    if (!appUser) {
      throw new Error('User profile not found in Firestore');
    }

    setUser(appUser);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    return appUser;
  };

  const updateProfile = async (payload: { name?: string; githubUrl?: string; linkedinUrl?: string; portfolioUrl?: string; leetcodeUsername?: string }): Promise<AppUser> => {
    if (!firebaseUser) throw new Error('No authenticated user found');

    const idToken = localStorage.getItem(TOKEN_KEY);
    if (!idToken) throw new Error('No authentication token found');

    const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/api$/, '');
    const resp = await fetch(`${apiBase}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Profile update failed' }));
      throw new Error(err.error ?? 'Profile update failed');
    }

    // Update directly in Firestore local document as well
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userDocRef, payload);

    // Read directly from Firestore (falls back to API if permission issue occurs)
    const appUser = await fetchAppUser(firebaseUser.uid, idToken);
    if (!appUser) {
      throw new Error('User profile not found in Firestore');
    }

    setUser(appUser);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    return appUser;
  };

  const refreshToken = async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    const token = await firebaseUser.getIdToken(true);
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  };

  const baseValue: AuthContextValue = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    loginWithGoogle,
    updateProfile,
    logout,
    refreshToken
  };

  const recruiterValue: AuthContextValue = {
    ...baseValue,
    user: user && user.role === 'recruiter' ? user : null
  };

  const candidateValue: AuthContextValue = {
    ...baseValue,
    user: user && user.role === 'candidate' ? user : null
  };

  const adminValue: AuthContextValue = {
    ...baseValue,
    user: user && user.role === 'admin' ? user : null
  };

  return (
    <AuthContext.Provider value={baseValue}>
      <RecruiterAuthContext.Provider value={recruiterValue}>
        <CandidateAuthContext.Provider value={candidateValue}>
          <AdminAuthContext.Provider value={adminValue}>
            {children}
          </AdminAuthContext.Provider>
        </CandidateAuthContext.Provider>
      </RecruiterAuthContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function useRecruiterAuth(): AuthContextValue {
  const ctx = useContext(RecruiterAuthContext);
  if (!ctx) throw new Error('useRecruiterAuth must be used inside <AuthProvider>');
  return ctx;
}

export function useCandidateAuth(): AuthContextValue {
  const ctx = useContext(CandidateAuthContext);
  if (!ctx) throw new Error('useCandidateAuth must be used inside <AuthProvider>');
  return ctx;
}

export function useAdminAuth(): AuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AuthProvider>');
  return ctx;
}
