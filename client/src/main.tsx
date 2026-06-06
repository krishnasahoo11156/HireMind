import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { useAppStore } from './store/appStore';
import { AuthProvider } from './firebase/AuthContext';
import { isFirebaseConfigValid } from './firebase/config';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 15_000
    }
  }
});

function ThemeController() {
  const theme = useAppStore((state) => state.theme);
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark));
  }, [theme]);
  return null;
}

if (!isFirebaseConfigValid) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0b0d',
        color: '#f3f4f6',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '560px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            marginBottom: '24px',
            fontSize: '32px'
          }}>
            ⚠️
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '12px',
            color: '#ffffff',
            letterSpacing: '-0.025em'
          }}>
            Firebase Configuration Missing
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#9ca3af',
            lineHeight: '1.6',
            marginBottom: '28px'
          }}>
            HireMind relies on Firebase for Authentication, Firestore, and Storage. One or more environment variables are missing in your deployment or local <code style={{color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '14px'}}>.env</code> file.
          </p>
          
          <div style={{
            textAlign: 'left',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '28px',
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#d1d5db'
          }}>
            <div style={{fontWeight: 'bold', color: '#10b981', marginBottom: '8px'}}>Required Variables:</div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px'}}>
              <div>VITE_FIREBASE_API_KEY</div>
              <div style={{color: import.meta.env.VITE_FIREBASE_API_KEY ? '#10b981' : '#ef4444'}}>{import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Found' : '✗ Missing'}</div>
              <div>VITE_FIREBASE_AUTH_DOMAIN</div>
              <div style={{color: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '#10b981' : '#ef4444'}}>{import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Found' : '✗ Missing'}</div>
              <div>VITE_FIREBASE_PROJECT_ID</div>
              <div style={{color: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '#10b981' : '#ef4444'}}>{import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓ Found' : '✗ Missing'}</div>
              <div>VITE_FIREBASE_STORAGE_BUCKET</div>
              <div style={{color: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '#10b981' : '#ef4444'}}>{import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓ Found' : '✗ Missing'}</div>
              <div>VITE_FIREBASE_MESSAGING_SENDER_ID</div>
              <div style={{color: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '#10b981' : '#ef4444'}}>{import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✓ Found' : '✗ Missing'}</div>
              <div>VITE_FIREBASE_APP_ID</div>
              <div style={{color: import.meta.env.VITE_FIREBASE_APP_ID ? '#10b981' : '#ef4444'}}>{import.meta.env.VITE_FIREBASE_APP_ID ? '✓ Found' : '✗ Missing'}</div>
            </div>
          </div>

          <div style={{
            fontSize: '13px',
            color: '#6b7280',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '20px'
          }}>
            Please configure these in your system environment (Render, Vercel, or local <code style={{color: '#9ca3af'}}>.env</code> file) and restart the application.
          </div>
        </div>
      </div>
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ThemeController />
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
