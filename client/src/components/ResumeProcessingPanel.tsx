import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import type { ParsedItem, ResumeSocketState } from '../hooks/useResumeSocket';

interface Props {
  state: ResumeSocketState;
}

// Status icon for each file row
function FileStatusIcon({ status }: { status: ParsedItem['status'] }) {
  if (status === 'parsed') {
    return <CheckCircle2 className="h-4 w-4 flex-none text-success" />;
  }
  if (status === 'manual_review') {
    return <AlertCircle className="h-4 w-4 flex-none text-warning" />;
  }
  if (status === 'error') {
    return <AlertCircle className="h-4 w-4 flex-none text-danger" />;
  }
  // queued
  return <Circle className="h-4 w-4 flex-none text-secondary dark:text-darkmuted" />;
}

// Connection status pill
function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        className={`h-2 w-2 rounded-full ${connected ? 'bg-success' : 'bg-warning'}`}
        animate={connected ? { scale: [1, 1.3, 1] } : { opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: connected ? 2 : 1.2 }}
      />
      <span className="text-xs font-medium text-secondary dark:text-darkmuted">
        {connected ? 'Live' : 'Reconnecting…'}
      </span>
    </div>
  );
}

export function ResumeProcessingPanel({ state }: Props) {
  const { connected, total, parsed, items } = state;

  // Only show panel once we've received at least the upload_started signal
  if (total === 0 && items.length === 0) return null;

  const pct = total > 0 ? Math.round((parsed / total) * 100) : 0;
  const allDone = total > 0 && parsed >= total;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm dark:border-darkborder dark:bg-darksurface"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5 dark:border-darkborder">
        <div className="flex items-center gap-2">
          {!allDone ? (
            <Loader2 className="h-4 w-4 animate-spin text-accent dark:text-darkaccent" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )}
          <span className="text-sm font-semibold text-primary dark:text-darktext">
            Resume Processing
          </span>
        </div>
        <ConnectionBadge connected={connected} />
      </div>

      {/* Progress bar */}
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-secondary dark:text-darkmuted">
            {allDone ? 'All resumes parsed' : 'Parsing resumes…'}
          </span>
          <span className="font-heading text-sm font-bold tabular-nums text-primary dark:text-darktext">
            {parsed}/{total} Parsed
          </span>
        </div>

        {/* Track */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-darkborder">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${
              allDone
                ? 'bg-success'
                : 'bg-gradient-to-r from-accent to-accent/70 dark:from-darkaccent dark:to-darkaccent/70'
            }`}
            initial={{ width: '0%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Shimmer while not done */}
          {!allDone && (
            <motion.div
              className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-64px', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
          )}
        </div>
      </div>

      {/* File list */}
      {items.length > 0 && (
        <div className="divide-y divide-border px-5 dark:divide-darkborder">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.resumeId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileStatusIcon status={item.status} />
                  <span className="truncate text-sm font-medium text-primary dark:text-darktext">
                    {item.fileName}
                  </span>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {item.candidateName ? (
                    <span className="text-xs text-secondary dark:text-darkmuted">
                      {item.candidateName}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-secondary dark:text-darkmuted">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Parsing…
                    </span>
                  )}
                  {item.status === 'manual_review' && (
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      Review
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-border px-5 py-3 dark:border-darkborder"
        >
          <p className="text-xs text-success font-medium">
            ✓ Processing complete — rankings are being generated
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
