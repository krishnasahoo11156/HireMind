import { FormEvent, useState } from 'react';
import { BrainCircuit, LogIn, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Card } from '../components/ui';

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

  return <AuthFrame mode="login" onSubmit={submit} error={error} email={email} setEmail={setEmail} password={password} setPassword={setPassword} />;
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
      <input className="hm-input w-full" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
      <select className="hm-input w-full" value={role} onChange={(event) => setRole(event.target.value)}>
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
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 dark:bg-darkbg">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white dark:bg-darkaccent dark:text-darkbg">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-primary dark:text-darktext">HireMind</h1>
          <p className="mt-1 text-sm text-secondary dark:text-darkmuted">AI-Powered Explainable Hiring Intelligence Platform</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          {children}
          <input className="hm-input w-full" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="hm-input w-full" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{error}</p> : null}
          <Button className="w-full" type="submit">
            {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-secondary dark:text-darkmuted">
          {mode === 'login' ? 'Need an account?' : 'Already have an account?'}{' '}
          <Link className="font-medium text-accent dark:text-darkaccent" to={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? 'Register' : 'Log in'}
          </Link>
        </p>
      </Card>
    </div>
  );
}
