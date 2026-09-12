import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark' || theme === 'classic-green';

  return (
    <motion.button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className={`relative inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 select-none ${
        isDark
          ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 text-zinc-200 hover:text-white shadow-sm'
          : 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800 hover:text-zinc-950 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light (White) Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark/light theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="text-emerald-400"
            >
              <Moon className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="text-amber-500"
            >
              <Sun className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="text-xs font-bold select-none hidden sm:inline">
        {isDark ? 'Dark' : 'White'}
      </span>
    </motion.button>
  );
};
