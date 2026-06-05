import { FormEvent, useState } from 'react';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { Button, Card, DisplayTitle, SectionTitle, CardTitle, BodyText, Caption } from '../components/ui';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('recruiter@hiremind.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await api.login(email, password);
      localStorage.setItem(api.tokenKey, response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    }
  }

  return (
    <AuthFrame mode="login" onSubmit={submit} error={error} email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
  );
}

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('recruiter');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await api.register({ name, email, password, role });
      localStorage.setItem(api.tokenKey, response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register');
    }
  }

  return (
    <AuthFrame mode="register" onSubmit={submit} error={error} email={email} setEmail={setEmail} password={password} setPassword={setPassword}>
      <input className="hm-input w-full" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="hm-input w-full" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="recruiter">Recruiter</option>
        <option value="hiring_manager">Hiring Manager</option>
        <option value="admin">Admin</option>
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
  children
}: {
  mode: 'login' | 'register';
  onSubmit: (event: FormEvent) => void;
  error: string;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
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
            <Button className="mt-2 w-full" size="lg" type="submit" variant="accent">
              {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

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
