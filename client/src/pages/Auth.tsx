import { FormEvent, useState } from 'react';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../firebase/AuthContext';
import { Button, Card, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../components/ui';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('recruiter@hiremind.ai');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  
  // Google setup states
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [tempGoogleData, setTempGoogleData] = useState<{ idToken: string; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [setupName, setSetupName] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const user = await login(email, password);
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
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

  async function handleGoogleSignIn() {
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
        body: JSON.stringify({ idToken })
      });

      if (!resp.ok) {
        throw new Error('Backend login failed');
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
      const user = await loginWithGoogle();
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
      const user = await loginWithGoogle(selectedRole, setupName);
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

  return (
    <>
      <AuthFrame
        mode="login"
        onSubmit={submit}
        error={error}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onDirectSignIn={directSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        loadingGoogle={loadingGoogle}
      />

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
                  It looks like this is your first time logging in with this Google account. Please verify your name and select your role to continue.
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
                    <label className="text-xs font-semibold text-primary dark:text-darktext mb-1.5 block">Account Role</label>
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
    </>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('recruiter');
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const user = await register({ name, email, password, role });
      if (user.role === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register');
    }
  }

  async function handleGoogleSignUp() {
    if (!name.trim()) {
      setError('Please enter your full name first to register with Google.');
      return;
    }
    setError('');
    setLoadingGoogle(true);
    try {
      const user = await loginWithGoogle(role as 'candidate' | 'recruiter', name);
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
    <AuthFrame
      mode="register"
      onSubmit={submit}
      error={error}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      onGoogleSignIn={handleGoogleSignUp}
      loadingGoogle={loadingGoogle}
    >
      <input className="hm-input w-full" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="hm-input w-full" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="recruiter">Recruiter</option>
        <option value="hiring_manager">Hiring Manager</option>
        <option value="admin">Admin</option>
        <option value="candidate">Candidate</option>
      </select>
    </AuthFrame>
  );
}

function AuthFrame({
  mode,
  onSubmit,
  error,
  email,
  setEmail,
  password,
  setPassword,
  onDirectSignIn,
  onGoogleSignIn,
  loadingGoogle,
  children
}: {
  mode: 'login' | 'register';
  onSubmit: (event: FormEvent) => void;
  error: string;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onDirectSignIn?: (email: string) => void;
  onGoogleSignIn?: () => void;
  loadingGoogle?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 dark:bg-darkbg">
      {/* Background decoration */}
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
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-yellow-600 shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <DisplayTitle className="mt-4 !text-2xl">
              HireMind
            </DisplayTitle>
            <BodyText variant="default" color="secondary" className="mt-1">
              {mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
            </BodyText>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            {children}
            <input
              className="hm-input w-full"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="hm-input w-full"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}
            <Button className="mt-2 w-full" size="lg" type="submit" variant="accent" disabled={loadingGoogle}>
              {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          {onGoogleSignIn && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border dark:border-darkborder" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-3 text-secondary dark:bg-darksurface dark:text-darkmuted">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full flex items-center justify-center gap-2 border border-border dark:border-darkborder"
                onClick={onGoogleSignIn}
                disabled={loadingGoogle}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
              </Button>
            </>
          )}

          {mode === 'login' && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border bg-background px-4 py-3 dark:border-darkborder dark:bg-darkbg">
                <p className="text-xs font-semibold text-secondary dark:text-darkmuted mb-1">Demo credentials</p>
                <p className="text-xs text-secondary dark:text-darkmuted font-mono mb-1">
                  recruiter@hiremind.ai / <span className="text-primary dark:text-darktext font-semibold">password</span>
                </p>
                <p className="text-xs text-secondary dark:text-darkmuted font-mono">
                  candidate@hiremind.ai / <span className="text-primary dark:text-darktext font-semibold">password</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 text-xs"
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => onDirectSignIn?.('recruiter@hiremind.ai')}
                >
                  Sign in Recruiter
                </Button>
                <Button
                  className="flex-1 text-xs"
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => onDirectSignIn?.('candidate@hiremind.ai')}
                >
                  Sign in Candidate
                </Button>
              </div>
            </div>
          )}

          <BodyText variant="default" color="secondary" className="mt-6 text-center">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <Link
              className="font-semibold text-accent hover:underline dark:text-darkaccent font-sans"
              to={mode === 'login' ? '/register' : '/login'}
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </Link>
          </BodyText>
        </Card>
      </motion.div>
    </div>
  );
}
