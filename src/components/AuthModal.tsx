import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { getDeviceFingerprint } from '../lib/fingerprint';
import { User } from '../types';
import { NinimoIcon } from './NinimoIcon';
import { useTheme } from '../context/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: User, token: string) => void;
  canDismiss?: boolean;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  canDismiss = true,
  initialMode = 'login',
}) => {
  const { theme, isDark } = useTheme();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body =
        mode === 'login'
          ? { usernameOrEmail: username || email, password }
          : { username, email, password };

      const deviceId = getDeviceFingerprint();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
          'X-Device-Fingerprint': deviceId,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('ninimo_token', data.token);
      try {
        localStorage.setItem('ninimo_user_profile', JSON.stringify(data.user));
      } catch {}
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <motion.div
        id="auth-modal-card"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`border rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative my-auto transition-colors will-change-transform transform-gpu ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-6 pb-3 sm:pb-4 flex items-center justify-between relative border-b ${
          isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <NinimoIcon size="md" />
            <div>
              <h3 className={`font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}>
                Ninimo
                <span className={`font-bold text-[9px] sm:text-[10px] border px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                  isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
                }`}>
                  24/7 Platform
                </span>
              </h3>
              <p className={`text-[11px] sm:text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                High-Performance Minecraft Bot Fleet
              </p>
            </div>
          </div>

          {canDismiss && onClose && (
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Tab switchers */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5">
          <div className={`grid grid-cols-2 p-1 border rounded-xl relative ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 sm:py-2.5 text-xs font-bold rounded-lg transition-all duration-150 relative z-10 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                mode === 'login'
                  ? isDark
                    ? 'bg-zinc-800 text-white font-extrabold shadow-xs'
                    : 'bg-white text-zinc-950 font-extrabold shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Lock className={`w-3.5 h-3.5 ${mode === 'login' ? (isDark ? 'text-white' : 'text-zinc-950') : 'text-zinc-400'}`} />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 sm:py-2.5 text-xs font-bold rounded-lg transition-all duration-150 relative z-10 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                mode === 'signup'
                  ? isDark
                    ? 'bg-zinc-800 text-white font-extrabold shadow-xs'
                    : 'bg-white text-zinc-950 font-extrabold shadow-xs'
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${mode === 'signup' ? (isDark ? 'text-white' : 'text-zinc-950') : 'text-zinc-400'}`} />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {error && (
            <div className="p-2.5 sm:p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className={`block text-xs font-semibold mb-1 flex items-center justify-between ${
              isDark ? 'text-zinc-300' : 'text-zinc-700'
            }`}>
              <span>{mode === 'login' ? 'Username or Email' : 'Choose Username'}</span>
              <span className="text-[10px] text-zinc-500 font-mono font-normal">
                {mode === 'signup' ? '3-16 characters' : ''}
              </span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'player1 or player@example.com' : 'e.g. MinecraftPro99'}
                required
                className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                }`}
              />
            </div>
          </div>

          {/* Email (Signup only) */}
          {mode === 'signup' && (
            <div className="animate-in fade-in duration-150">
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required={mode === 'signup'}
                  className={`w-full border rounded-xl pl-10 pr-3.5 py-2.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors ${
                    isDark
                      ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Password
              </label>
              {mode === 'signup' && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  Min 6 characters
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 sm:py-3 font-extrabold rounded-xl text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer mt-1 sm:mt-2 border ${
              isDark
                ? 'bg-zinc-100 hover:bg-white text-zinc-950 border-white shadow-zinc-950/40'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-zinc-900/20'
            }`}
          >
            {isLoading ? (
              <span className={`inline-block w-4 h-4 border-2 rounded-full animate-spin ${
                isDark ? 'border-zinc-900/30 border-t-zinc-900' : 'border-white/30 border-t-white'
              }`} />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Ninimo' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          {/* Guarantee banner */}
          <div className="pt-1 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Session stored securely. Bots auto-resume on server updates.</span>
            </span>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
