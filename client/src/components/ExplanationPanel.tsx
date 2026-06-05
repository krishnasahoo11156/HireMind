import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, AlertCircle } from 'lucide-react';
import { Button } from './ui';

interface ExplanationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
}

export function ExplanationPanel({ isOpen, onClose, candidateId, candidateName }: ExplanationPanelProps) {
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !candidateId) return;

    setLoading(true);
    setError(null);
    setStreamingText('');

    const token = localStorage.getItem('hiremind_token');
    const controller = new AbortController();

    const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
    fetch(`${API_BASE_URL}/api/ai/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ candidateId }),
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Stream initiation failed' }));
          throw new Error(err.error || 'Failed to initialize explanation stream');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No readable stream available');
        }

        setLoading(false);
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                setStreamingText((prev) => prev + parsed.text);
              }
            } catch (err) {
              console.error('Failed to parse stream token:', err);
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Explanation streaming error:', err);
        setError(err.message || 'Error loading explanation');
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [isOpen, candidateId]);

  function formatMarkdown(text: string) {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="mt-4 mb-2 text-sm font-bold text-primary dark:text-darktext flex items-center gap-1.5 border-b border-border pb-1 dark:border-darkborder">
            {trimmed.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('-')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-secondary dark:text-darkmuted mb-1">
            {trimmed.replace(/^-\s*/, '')}
          </li>
        );
      }
      if (trimmed.match(/^\d+\./)) {
        return (
          <h4 key={idx} className="mt-4 mb-2 text-sm font-bold text-accent dark:text-darkaccent flex items-center gap-1.5">
            {trimmed}
          </h4>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-secondary dark:text-darkmuted mb-1.5">
          {line}
        </p>
      );
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg border-l border-border bg-surface shadow-2xl dark:border-darkborder dark:bg-darksurface flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-darkborder">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-accent/15 p-2 dark:bg-darkaccent/15">
                  <BrainCircuit className="h-5 w-5 text-accent dark:text-darkaccent" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary dark:text-darktext">
                    Why {candidateName}?
                  </h3>
                  <p className="text-xs text-secondary dark:text-darkmuted">
                    AI-powered match rationale & analysis
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-darkborder text-secondary dark:text-darkmuted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent dark:border-darkborder dark:border-t-darkaccent" />
                  <p className="text-sm text-secondary dark:text-darkmuted">Consulting Gemini intelligence…</p>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-950/30 dark:bg-red-950/10 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-danger mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-danger">Failed to Load Explanation</h4>
                    <p className="text-xs text-secondary dark:text-darkmuted mt-1">{error}</p>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => onClose()}>
                      Close Panel
                    </Button>
                  </div>
                </div>
              )}

              {!loading && !error && (
                <div className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert">
                    {formatMarkdown(streamingText)}
                  </div>
                  {/* Blinking cursor if still streaming */}
                  {streamingText && !streamingText.endsWith('[DONE]') && (
                    <span className="inline-block h-4 w-1 animate-pulse bg-accent dark:bg-darkaccent ml-1" />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
