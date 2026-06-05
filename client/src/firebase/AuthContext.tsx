import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from './config';

const TOKEN_KEY = 'hiremind_token';
const USER_KEY = 'hiremind_user';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter';
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  leetcodeUsername?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (payload: { name: string; email: string; password: string; role: string }) => Promise<AppUser>;
  loginWithGoogle: (role?: 'candidate' | 'recruiter', name?: string, password?: string) => Promise<AppUser>;
  updateProfile: (payload: { name?: string; githubUrl?: string; linkedinUrl?: string; portfolioUrl?: string; leetcodeUsername?: string }) => Promise<AppUser>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
          // Always refresh the ID token and store it
          const idToken = await fbUser.getIdToken(false);
          localStorage.setItem(TOKEN_KEY, idToken);

          // Load user profile from backend if not cached
          if (!user || user.id !== fbUser.uid) {
            const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/api$/, '');
            const resp = await fetch(`${apiBase}/api/auth/me`, {
              headers: { Authorization: `Bearer ${idToken}` }
            });
            if (resp.ok) {
              const data = await resp.json();
              const appUser: AppUser = {
                id: fbUser.uid,
                name: data.user?.name ?? fbUser.displayName ?? 'User',
                email: fbUser.email ?? '',
                role: data.user?.role ?? 'recruiter',
                githubUrl: data.user?.githubUrl,
                linkedinUrl: data.user?.linkedinUrl,
                portfolioUrl: data.user?.portfolioUrl,
                leetcodeUsername: data.user?.leetcodeUsername
              };
              setUser(appUser);
              localStorage.setItem(USER_KEY, JSON.stringify(appUser));
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Token refresh failed:', err);
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
    const idToken = await cred.user.getIdToken(true); // force refresh to get latest custom claims
    localStorage.setItem(TOKEN_KEY, idToken);

    const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/api$/, '');
    const resp = await fetch(`${apiBase}/api/auth/me`, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (!resp.ok) throw new Error('Failed to load user profile');

    const data = await resp.json();
    const appUser: AppUser = {
      id: cred.user.uid,
      name: data.user?.name ?? cred.user.displayName ?? 'User',
      email: cred.user.email ?? '',
      role: data.user?.role ?? 'recruiter',
      githubUrl: data.user?.githubUrl,
      linkedinUrl: data.user?.linkedinUrl,
      portfolioUrl: data.user?.portfolioUrl,
      leetcodeUsername: data.user?.leetcodeUsername
    };
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

    const appUser: AppUser = {
      id: cred.user.uid,
      name: data.user?.name ?? payload.name,
      email: cred.user.email ?? payload.email,
      role: data.user?.role ?? payload.role ?? 'recruiter',
      githubUrl: data.user?.githubUrl,
      linkedinUrl: data.user?.linkedinUrl,
      portfolioUrl: data.user?.portfolioUrl,
      leetcodeUsername: data.user?.leetcodeUsername
    };
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

  const loginWithGoogle = async (role?: 'candidate' | 'recruiter', name?: string, password?: string): Promise<AppUser> => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    let idToken = await cred.user.getIdToken(true);

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

    if (role) {
      idToken = await cred.user.getIdToken(true);
    }
    localStorage.setItem(TOKEN_KEY, idToken);

    const appUser: AppUser = {
      id: cred.user.uid,
      name: data.user?.name ?? cred.user.displayName ?? name ?? 'User',
      email: cred.user.email ?? '',
      role: data.user?.role ?? role ?? 'recruiter',
      githubUrl: data.user?.githubUrl,
      linkedinUrl: data.user?.linkedinUrl,
      portfolioUrl: data.user?.portfolioUrl,
      leetcodeUsername: data.user?.leetcodeUsername
    };
    setUser(appUser);
    localStorage.setItem(USER_KEY, JSON.stringify(appUser));
    return appUser;
  };

  const updateProfile = async (payload: { name?: string; githubUrl?: string; linkedinUrl?: string; portfolioUrl?: string; leetcodeUsername?: string }): Promise<AppUser> => {
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
    const data = await resp.json();

    const appUser: AppUser = {
      id: user?.id ?? '',
      name: data.user?.name ?? payload.name ?? user?.name ?? 'User',
      email: data.user?.email ?? user?.email ?? '',
      role: data.user?.role ?? user?.role ?? 'recruiter',
      githubUrl: data.user?.githubUrl ?? payload.githubUrl ?? user?.githubUrl,
      linkedinUrl: data.user?.linkedinUrl ?? payload.linkedinUrl ?? user?.linkedinUrl,
      portfolioUrl: data.user?.portfolioUrl ?? payload.portfolioUrl ?? user?.portfolioUrl,
      leetcodeUsername: data.user?.leetcodeUsername ?? payload.leetcodeUsername ?? user?.leetcodeUsername
    };
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

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login,
        register,
        loginWithGoogle,
        updateProfile,
        logout,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
