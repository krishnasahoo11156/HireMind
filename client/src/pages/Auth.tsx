import { FormEvent, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../firebase/AuthContext';
import { Button, Card, DisplayTitle, BodyText } from '../components/ui';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Google setup states
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [tempGoogleData, setTempGoogleData] = useState<{ idToken: string; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [setupName, setSetupName] = useState('');

  async function handleGoogleSignIn(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      setError('Please enter your account password to verify your identity.');
      return;
    }
    setError('');
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken(true);

      const apiBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001').replace(/\/api$/, '');
      const resp = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, password })
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error ?? 'Backend authentication failed');
      }

      const data = await resp.json();

      if (data.requiresProfileSetup) {
        setTempGoogleData({ idToken, name: cred.user.displayName ?? '' });
        setSetupName(cred.user.displayName ?? '');
        setShowSetupModal(true);
        setLoadingGoogle(false);
        return;
      }

      // Existing user: sign in with Google provider context helper
      const user = await loginWithGoogle(undefined, undefined, password);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in with Google');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleCompleteSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!tempGoogleData) return;
    try {
      setLoadingGoogle(true);
      const user = await loginWithGoogle(selectedRole, setupName, password);
      setShowSetupModal(false);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete profile setup');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function directSignIn(selectedEmail: string) {
    try {
      const user = await login(selectedEmail, 'password');
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 dark:bg-darkbg">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/8 blur-3xl dark:bg-darkaccent/8" />
        <div className="absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-yellow-400/6 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary dark:text-darkmuted dark:hover:text-darktext transition-colors"
        >
          &larr; Back to home
        </Link>
        <Card className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-yellow-600 shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <DisplayTitle className="mt-4 !text-2xl">HireMind</DisplayTitle>
            <BodyText variant="default" color="secondary" className="mt-1">
              Sign in with Google credentials
            </BodyText>
          </div>

          <form className="space-y-4" onSubmit={handleGoogleSignIn}>
            <div>
              <label className="text-xs font-semibold text-primary dark:text-darktext mb-1.5 block">Enter Password</label>
              <input
                className="hm-input w-full"
                placeholder="Account Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="accent"
              className="w-full flex items-center justify-center gap-2"
              disabled={loadingGoogle}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#FFFFFF"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FFFFFF"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loadingGoogle ? 'Signing in...' : 'Sign in with Google'}</span>
            </Button>
          </form>

          {/* Demo credentials shortcuts */}
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-border bg-background px-4 py-3 dark:border-darkborder dark:bg-darkbg">
              <p className="text-xs font-semibold text-secondary dark:text-darkmuted mb-1">Demo Quick Sign-In</p>
              <p className="text-xs text-secondary dark:text-darkmuted font-mono mb-1">
                recruiter@hiremind.ai / password
              </p>
              <p className="text-xs text-secondary dark:text-darkmuted font-mono">
                candidate@hiremind.ai / password
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 text-xs"
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => directSignIn('recruiter@hiremind.ai')}
              >
                Demo Recruiter
              </Button>
              <Button
                className="flex-1 text-xs"
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => directSignIn('candidate@hiremind.ai')}
              >
                Demo Candidate
              </Button>
            </div>
          </div>

          <BodyText variant="default" color="secondary" className="mt-6 text-center">
            Don't have an account?{' '}
            <Link className="font-semibold text-accent hover:underline dark:text-darkaccent" to="/register">
              Register
            </Link>
          </BodyText>
        </Card>
      </motion.div>

      {/* Setup Role Modal for New Google Users */}
      <AnimatePresence>
        {showSetupModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <Card className="w-full max-w-md p-6 shadow-2xl border border-border dark:border-darkborder bg-surface dark:bg-darksurface">
                <h3 className="text-xl font-bold text-primary dark:text-darktext mb-2">Complete Profile Setup</h3>
                <p className="text-sm text-secondary dark:text-darkmuted mb-4">
                  Welcome! Verify your name and choose your account role to complete registration.
                </p>
                <form onSubmit={handleCompleteSetup} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-primary dark:text-darktext mb-1.5 block">Full Name</label>
                    <input
                      className="hm-input w-full"
                      placeholder="Full name"
                      required
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-primary dark:text-darktext mb-1.5 block">I want to register as a</label>
                    <select
                      className="hm-input w-full"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'candidate' | 'recruiter')}
                    >
                      <option value="candidate">Candidate (Job Seeker)</option>
                      <option value="recruiter">Recruiter (Hiring Manager)</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full mt-2" variant="accent" disabled={loadingGoogle}>
                    {loadingGoogle ? 'Completing Setup...' : 'Complete Profile Setup'}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('recruiter');
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function handleGoogleSignUp(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name first.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password to secure your account.');
      return;
    }
    setError('');
    setLoadingGoogle(true);
    try {
      const user = await loginWithGoogle(role as 'candidate' | 'recruiter', name, password);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register with Google');
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 dark:bg-darkbg">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/8 blur-3xl dark:bg-darkaccent/8" />
        <div className="absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-yellow-400/6 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary dark:text-darkmuted dark:hover:text-darktext transition-colors"
        >
          &larr; Back to home
        </Link>
        <Card className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-yellow-600 shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <DisplayTitle className="mt-4 !text-2xl">HireMind</DisplayTitle>
            <BodyText variant="default" color="secondary" className="mt-1">
              Create your Google-linked account
            </BodyText>
          </div>

          <form className="space-y-4" onSubmit={handleGoogleSignUp}>
            <div>
              <label className="text-xs font-semibold text-primary dark:text-darktext mb-1.5 block">Full Name</label>
              <input
                className="hm-input w-full"
                placeholder="Your Full Name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary dark:text-darktext mb-1.5 block">Create Password</label>
              <input
                className="hm-input w-full"
                placeholder="Enter a secure password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-primary dark:text-darktext mb-1.5 block">Register As</label>
              <select
                className="hm-input w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="recruiter">Recruiter / Hiring Manager</option>
                <option value="candidate">Candidate (Job Seeker)</option>
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="accent"
              className="w-full flex items-center justify-center gap-2 mt-2"
              disabled={loadingGoogle}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#FFFFFF"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FFFFFF"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loadingGoogle ? 'Registering...' : 'Register with Google'}</span>
            </Button>
          </form>

          <BodyText variant="default" color="secondary" className="mt-6 text-center">
            Already have an account?{' '}
            <Link className="font-semibold text-accent hover:underline dark:text-darkaccent" to="/login">
              Sign in
            </Link>
          </BodyText>
        </Card>
      </motion.div>
    </div>
  );
}
