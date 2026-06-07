import { motion } from 'framer-motion';
import { EyeOff } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function BlindToggle() {
  const blindMode = useAppStore((state) => state.blindMode);
  const toggleBlindMode = useAppStore((state) => state.toggleBlindMode);

  return (
    <button
      aria-label="Toggle blind screening"
      onClick={toggleBlindMode}
      className="inline-flex items-center gap-3 h-10 px-3.5 rounded-xl border border-border bg-white text-[13px] font-semibold text-primary hover:bg-neutral-50 dark:border-darkborder dark:bg-darksurface dark:text-darktext shadow-sm transition-all"
    >
      <EyeOff className="h-4 w-4 text-secondary dark:text-darkmuted" />
      <span>Blind Screening</span>
      <span className={`relative flex items-center h-5 w-9 rounded-full p-0.5 transition-colors duration-150 ${blindMode ? 'bg-accent dark:bg-darkaccent' : 'bg-neutral-200 dark:bg-darkborder'}`}>
        <motion.span layout className="block h-4 w-4 rounded-full bg-white shadow-sm" style={{ x: blindMode ? 16 : 0 }} />
      </span>
    </button>
  );
}
