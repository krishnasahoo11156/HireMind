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
      className="hm-button border border-border bg-white text-primary hover:bg-gray-50 dark:border-darkborder dark:bg-darksurface dark:text-darktext"
    >
      <EyeOff className="h-4 w-4" />
      Blind
      <span className={`relative h-6 w-11 rounded-full p-1 transition ${blindMode ? 'bg-accent dark:bg-darkaccent' : 'bg-gray-200 dark:bg-darkborder'}`}>
        <motion.span layout className="block h-4 w-4 rounded-full bg-white shadow" style={{ x: blindMode ? 20 : 0 }} />
      </span>
    </button>
  );
}
