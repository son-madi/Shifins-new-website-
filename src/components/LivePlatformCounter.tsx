import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  CheckCircle2,
  Zap,
  Globe,
  ArrowRight,
  UserPlus,
  LogIn,
  Sparkles,
  Bot,
  Shield,
  Lock,
  Terminal,
  Cpu,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Check,
} from 'lucide-react';
import { PublicPlatformStats, User } from '../types';
import { NinimoIcon } from './NinimoIcon';
import { getDeviceFingerprint } from '../lib/fingerprint';
import { useTheme } from '../context/ThemeContext';

interface LivePlatformCounterProps {
  publicStats: PublicPlatformStats | null;
  onSignUp: () => void;
  onSignIn: () => void;
  onAuthSuccess?: (user: User, token: string) => void;
}

export const LivePlatformCounter: React.FC<LivePlatformCounterProps> = ({
  publicStats,
  onSignUp,
  onSignIn,
  onAuthSuccess,
}) => {
  const { theme, isDark, isColourUI } = useTheme();

  const [pulseKey, setPulseKey] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Quick-Auth state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Simulated live terminal events
  const [simulatedLogs, setSimulatedLogs] = useState([
    { id: 1, time: '12:00:01', tag: 'SYSTEM', text: 'Ninimo 24/7 engine initialized. Cloud container ready.', color: isDark ? 'text-zinc-400' : 'text-zinc-600' },
    { id: 2, time: '12:00:03', tag: 'CONNECT', text: 'Minecraft bot socket handshake to aternos.me:31892', color: isDark ? 'text-zinc-200' : 'text-zinc-800' },
    { id: 3, time: '12:00:04', tag: 'AUTH', text: 'Executed On-Join command: /login *******', color: 'text-amber-400' },
    { id: 4, time: '12:00:08', tag: 'ANTI-AFK', text: 'Movement routine: Strafe (0.4 blocks) + 360° head yaw rotation', color: isDark ? 'text-zinc-300' : 'text-zinc-700' },
    { id: 5, time: '12:00:15', tag: 'HEALTH', text: 'Heartbeat OK. Position: X:142.5 Y:69.0 Z:-280.4', color: 'text-sky-400' },
  ]);

  const onlineBots = publicStats !== null ? publicStats.activeBotsOnline : 1;

  useEffect(() => {
    setPulseKey((k) => k + 1);
  }, [publicStats?.activeBotsOnline]);

  useEffect(() => {
    const logInterval = setInterval(() => {
      const actions = [
        { tag: 'ANTI-AFK', text: 'Anti-AFK cycle: Sneak crouch & arm swing triggered', color: isDark ? 'text-zinc-300' : 'text-zinc-700' },
        { tag: 'KEEPALIVE', text: 'Aternos / Minehut ping confirmed. Server idle timer reset.', color: isDark ? 'text-zinc-400' : 'text-zinc-600' },
        { tag: 'TELEMETRY', text: 'Bot status: Healthy (Health 20/20, Food 20/20, 0 ms lag)', color: isDark ? 'text-zinc-200' : 'text-zinc-800' },
        { tag: 'CHAT', text: '<Server> Automatic daily save completed successfully.', color: 'text-amber-400' },
        { tag: 'ANTI-AFK', text: 'Movement routine: Micro-jump and strafe right', color: isDark ? 'text-zinc-300' : 'text-zinc-700' },
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      setSimulatedLogs((prev) => [
        ...prev.slice(1),
        { id: Date.now(), time: timeStr, tag: randomAction.tag, text: randomAction.text, color: randomAction.color },
      ]);
    }, 4000);

    return () => clearInterval(logInterval);
  }, [isDark]);

  const handleEmbeddedAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body =
        authMode === 'login'
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

      if (onAuthSuccess) {
        onAuthSuccess(data.user, data.token);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How does Ninimo keep Aternos or Minehut servers online 24/7?',
      a: 'Free Minecraft hosts like Aternos and Minehut automatically shut down when no players are detected. Ninimo hosts an isolated 24/7 cloud bot that connects directly to your server. With intelligent Anti-AFK patterns (strafing, sneaking, head movements), the host sees an active player and stays online around the clock.',
    },
    {
      q: 'Do I need to leave my computer or phone turned on?',
      a: 'No! Ninimo runs entirely on cloud servers. Once you click "Start Bot" and close your browser or turn off your PC, your bot continues running in the background 24/7.',
    },
    {
      q: 'What happens if my Minecraft server restarts or crashes?',
      a: 'Ninimo features an automated smart-reconnect loop. If the connection drops or the server reboots, Ninimo waits for the server to come back online, reconnects automatically, and re-executes your on-join authentication commands.',
    },
    {
      q: 'How do I set up auto-login for servers with passwords (/login)?',
      a: 'In your bot settings, simply type your login command (e.g. /login yourpassword) into the "On-Join Command" box. Ninimo will automatically send the command right after joining the server.',
    },
    {
      q: 'Is Ninimo free to use?',
      a: 'Yes, Ninimo provides 100% free 24/7 bot hosting for your Minecraft servers.',
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 w-full max-w-7xl mx-auto overflow-hidden">
      {/* 1. TOP NOTICE & HERO SECTION WITH PROMINENT FAST-LOGIN PORTAL */}
      <section className={`relative overflow-hidden border rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl transition-colors ${
        isDark
          ? 'bg-zinc-950 border-zinc-800'
          : 'bg-white border-zinc-200'
      }`}>
        <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
          {/* Top Notice Pill */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}
          >
            <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-300" />
              </span>
              <span className="font-bold tracking-wide">24/7 MINECRAFT CLOUD BOT</span>
              <span className="text-zinc-500">&bull;</span>
              <span className="font-mono text-[11px] font-semibold">READY FOR DEPLOYMENT</span>
            </div>

            <div className={`flex items-center gap-2 border px-3.5 py-1.5 rounded-2xl text-xs shadow-sm ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span className="text-zinc-500">Status:</span>
              <span className="font-bold font-mono">100% Free 24/7 Hosting</span>
            </div>
          </motion.div>

          {/* Main Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            {/* Prominent Fast-Login / Sign-Up Portal */}
            <div className="lg:col-span-5 lg:order-2 relative">
              <div className={`border-2 rounded-3xl p-5 sm:p-6 shadow-2xl transition-colors ${
                isDark ? 'bg-zinc-900/90 border-zinc-700' : 'bg-zinc-50 border-zinc-300'
              }`}>
                {/* Header */}
                <div className={`flex items-center justify-between pb-3.5 border-b ${
                  isDark ? 'border-zinc-800' : 'border-zinc-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <NinimoIcon size="sm" />
                    <div>
                      <h3 className={`font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5 ${
                        isDark ? 'text-white' : 'text-zinc-950'
                      }`}>
                        <span>Sign In to Launch Bot</span>
                      </h3>
                      <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Manage your private 24/7 cloud bot
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold border shrink-0 ${
                    isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
                  }`}>
                    Instant Access
                  </span>
                </div>

                {/* Instant Tab Switcher */}
                <div className={`mt-4 grid grid-cols-2 p-1 border rounded-xl relative ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors duration-100 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                      authMode === 'login'
                        ? isDark
                          ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
                          : 'bg-zinc-900 text-white shadow-sm'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthError(null);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors duration-100 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                      authMode === 'signup'
                        ? isDark
                          ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
                          : 'bg-zinc-900 text-white shadow-sm'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>
                </div>

                {/* Direct Form */}
                <form onSubmit={handleEmbeddedAuthSubmit} className="mt-4 space-y-3">
                  {authError && (
                    <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-medium shadow-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* Username */}
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}>
                      {authMode === 'login' ? 'Username or Email' : 'Choose Username'}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={authMode === 'login' ? 'e.g. player1 or player@example.com' : 'e.g. MinecraftPro99'}
                      required
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors ${
                        isDark
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                          : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>

                  {/* Email */}
                  {authMode === 'signup' && (
                    <div>
                      <label className={`block text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-zinc-300' : 'text-zinc-700'
                      }`}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required={authMode === 'signup'}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors ${
                          isDark
                            ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                            : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                        }`}
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${
                      isDark ? 'text-zinc-300' : 'text-zinc-700'
                    }`}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={`w-full border rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors ${
                          isDark
                            ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500'
                            : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer p-0.5"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className={`w-full py-3 active:scale-[0.99] rounded-xl text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 cursor-pointer mt-2 border ${
                      isDark
                        ? 'bg-zinc-100 hover:bg-white text-zinc-950 border-white shadow-zinc-950/40'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-zinc-900/20'
                    }`}
                  >
                    {authLoading ? (
                      <span className={`inline-block w-4 h-4 border-2 rounded-full animate-spin ${
                        isDark ? 'border-zinc-900/30 border-t-zinc-900' : 'border-white/30 border-t-white'
                      }`} />
                    ) : (
                      <>
                        <span>{authMode === 'login' ? 'Sign In & Launch Bot' : 'Create Free Account & Launch'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer hint */}
                <div className={`mt-3.5 pt-3 border-t text-center ${
                  isDark ? 'border-zinc-800' : 'border-zinc-200'
                }`}>
                  <span className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5 text-zinc-400" />
                    Encrypted session storage. Private per-user bot fleet.
                  </span>
                </div>
              </div>
            </div>

            {/* Left Hero Content */}
            <div className="lg:col-span-7 lg:order-1 space-y-6">
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-lg border ${
                  isDark ? 'text-zinc-200 bg-zinc-900 border-zinc-800' : 'text-zinc-800 bg-zinc-100 border-zinc-300'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  Automated Server Keep-Alive
                </div>

                <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] ${
                  isDark ? 'text-white' : 'text-zinc-950'
                }`}>
                  Keep Your Minecraft Server <br />
                  <span className="text-zinc-400">
                    Online 24/7 With Zero Sleep
                  </span>
                </h1>

                <p className={`text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-zinc-300' : 'text-zinc-600'
                }`}>
                  Deploy high-speed Minecraft bots to prevent <strong>Aternos</strong>, <strong>Minehut</strong>, and private SMPs from going to sleep. Sign in to manage your bots instantly.
                </p>
              </div>

              {/* Real-time Fleet Counter Mini Card */}
              <div
                key={`online-card-${pulseKey}`}
                className={`border rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg transition-colors ${
                  isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-200 border-zinc-300 text-zinc-800'
                  }`}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-baseline gap-2 ${
                      isDark ? 'text-white' : 'text-zinc-950'
                    }`}>
                      <span>{onlineBots}</span>
                      <span className="text-xs sm:text-sm font-sans font-bold text-zinc-400">
                        {onlineBots === 1 ? 'Bot Active Now' : 'Bots Active Now'}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Cloud fleet keeping Minecraft worlds online
                    </div>
                  </div>
                </div>

                <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                  isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-zinc-300" />
                  Live Sync
                </span>
              </div>

              {/* Feature Checklist Chips */}
              <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs pt-1 ${
                isDark ? 'text-zinc-300' : 'text-zinc-700'
              }`}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  <span>No PC Kept On</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  <span>Anti-AFK Movement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  <span>Auto-Auth /login</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  <span>100% Free Forever</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE IN-GAME BOT SIMULATOR & CONSOLE PREVIEW */}
      <section className={`border rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl space-y-6 transition-colors ${
        isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="space-y-1">
            <div className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold ${
              isDark ? 'text-zinc-300' : 'text-zinc-700'
            }`}>
              <Terminal className="w-4 h-4" />
              <span>LIVE CLOUD BOT SIMULATION</span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-zinc-950'
            }`}>
              Watch What Happens When Ninimo Connects
            </h2>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Your bot performs realistic player interactions to keep servers active 24/7 without manual intervention.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full border text-xs font-mono font-bold flex items-center gap-1.5 ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <span className="w-2 h-2 rounded-full bg-zinc-300" />
              Console Active
            </span>
          </div>
        </div>

        {/* Live Terminal & HUD Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulated In-Game HUD Card */}
          <div className={`lg:col-span-4 border rounded-2xl p-5 space-y-4 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-zinc-400" />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>Bot Status: Online</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
              }`}>
                24/7 AFK
              </span>
            </div>

            {/* Health & Food bars */}
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Health</span>
                  <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>20 / 20 HP</span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden border ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-200 border-zinc-300'
                }`}>
                  <div className="h-full bg-rose-500 rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Hunger / Food</span>
                  <span className="text-amber-400 font-bold">20 / 20</span>
                </div>
                <div className={`h-2 w-full rounded-full overflow-hidden border ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-200 border-zinc-300'
                }`}>
                  <div className="h-full bg-amber-500 rounded-full w-full" />
                </div>
              </div>
            </div>

            {/* Telemetry info */}
            <div className={`grid grid-cols-2 gap-2 pt-2 border-t text-[11px] font-mono ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}>
              <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
                <div className="text-zinc-500 text-[9px] uppercase">Coordinates</div>
                <div className={`font-bold mt-0.5 ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>X: 142 Y: 69 Z: -280</div>
              </div>
              <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
                <div className="text-zinc-500 text-[9px] uppercase">Ping Latency</div>
                <div className={`font-bold mt-0.5 ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>14 ms</div>
              </div>
            </div>

            {/* Anti-AFK state */}
            <div className={`p-2.5 border rounded-xl text-xs flex items-center gap-2 ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
            }`}>
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Anti-AFK Movement: <strong>Active (Strafe & Look)</strong></span>
            </div>
          </div>

          {/* Simulated Terminal Box */}
          <div className={`lg:col-span-8 border rounded-2xl p-4 font-mono text-xs overflow-hidden flex flex-col justify-between ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-3 text-zinc-500 text-[11px] ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                <span className={`ml-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>ninimo-bot-telemetry.log</span>
              </div>
              <span>UTF-8</span>
            </div>

            <div className="space-y-2">
              {simulatedLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 text-[11px] leading-relaxed"
                >
                  <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                  <span className={`px-1.5 py-0.2 border rounded text-[10px] font-bold shrink-0 ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
                  }`}>
                    {log.tag}
                  </span>
                  <span className={`${log.color} truncate`}>{log.text}</span>
                </div>
              ))}
            </div>

            <div className={`mt-4 pt-3 border-t flex items-center gap-2 text-[11px] text-zinc-500 ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}>
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span>Streaming events continuously in isolated background containers...</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 6 CORE SUPERPOWERS */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
            isDark ? 'text-zinc-300 bg-zinc-900 border-zinc-800' : 'text-zinc-700 bg-zinc-100 border-zinc-300'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            Engine Architecture
          </div>
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-zinc-950'
          }`}>
            Built Specifically For 24/7 Minecraft Servers
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Everything you need to keep your SMP, Aternos server, and farms operating without ever stopping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className={`border rounded-2xl p-6 space-y-3 shadow-lg transition-all duration-300 ${
            isColourUI
              ? 'bg-zinc-900/90 border-sky-500/30 hover:border-sky-500/60 shadow-sky-500/5'
              : isDark ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-400'
          }`}>
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 ${
              isColourUI
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-sm shadow-sky-500/20'
                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <Globe className={`w-5 h-5 ${isColourUI ? 'text-sky-400' : ''}`} />
            </div>
            <h3 className={`text-base font-bold ${isColourUI ? 'text-sky-100' : isDark ? 'text-white' : 'text-zinc-950'}`}>24/7 Cloud Persistence</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Bots execute continuously in isolated server processes. Your bots stay active even if you close the browser, turn off your PC, or disconnect your phone.
            </p>
          </div>

          {/* Card 2 */}
          <div className={`border rounded-2xl p-6 space-y-3 shadow-lg transition-all duration-300 ${
            isColourUI
              ? 'bg-zinc-900/90 border-amber-500/30 hover:border-amber-500/60 shadow-amber-500/5'
              : isDark ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-400'
          }`}>
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 ${
              isColourUI
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20'
                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className={`text-base font-bold ${isColourUI ? 'text-amber-100' : isDark ? 'text-white' : 'text-zinc-950'}`}>Intelligent Anti-AFK Engine</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Multi-pattern movement randomizer including strafing, sneaking, jumping, swinging arms, and rotating 360° head yaw to defeat AFK kick plugins.
            </p>
          </div>

          {/* Card 3 */}
          <div className={`border rounded-2xl p-6 space-y-3 shadow-lg transition-all duration-300 ${
            isColourUI
              ? 'bg-zinc-900/90 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/5'
              : isDark ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-400'
          }`}>
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 ${
              isColourUI
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <Lock className={`w-5 h-5 ${isColourUI ? 'text-emerald-400' : ''}`} />
            </div>
            <h3 className={`text-base font-bold ${isColourUI ? 'text-emerald-100' : isDark ? 'text-white' : 'text-zinc-950'}`}>Automated On-Join Commands</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Automatically sends <code className="font-mono">/login password</code> or server hub navigation commands after joining to prevent server auth timeouts.
            </p>
          </div>

          {/* Card 4 */}
          <div className={`border rounded-2xl p-6 space-y-3 shadow-lg transition-all duration-300 ${
            isColourUI
              ? 'bg-zinc-900/90 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/5'
              : isDark ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-400'
          }`}>
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 ${
              isColourUI
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-sm shadow-purple-500/20'
                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <Terminal className={`w-5 h-5 ${isColourUI ? 'text-purple-400' : ''}`} />
            </div>
            <h3 className={`text-base font-bold ${isColourUI ? 'text-purple-100' : isDark ? 'text-white' : 'text-zinc-950'}`}>Live In-Game Chat Console</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Read real-time Minecraft server chat and send messages or admin commands directly from the web panel into the Minecraft world.
            </p>
          </div>

          {/* Card 5 */}
          <div className={`border rounded-2xl p-6 space-y-3 shadow-lg transition-all duration-300 ${
            isColourUI
              ? 'bg-zinc-900/90 border-rose-500/30 hover:border-rose-500/60 shadow-rose-500/5'
              : isDark ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-400'
          }`}>
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 ${
              isColourUI
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/20'
                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <Shield className={`w-5 h-5 ${isColourUI ? 'text-rose-400' : ''}`} />
            </div>
            <h3 className={`text-base font-bold ${isColourUI ? 'text-rose-100' : isDark ? 'text-white' : 'text-zinc-950'}`}>Multi-Account Isolation</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Every user receives an isolated, password-protected account with persistent configuration storage and independent bot profiles.
            </p>
          </div>

          {/* Card 6 */}
          <div className={`border rounded-2xl p-6 space-y-3 shadow-lg transition-all duration-300 ${
            isColourUI
              ? 'bg-zinc-900/90 border-pink-500/30 hover:border-pink-500/60 shadow-pink-500/5'
              : isDark ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-400'
          }`}>
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 ${
              isColourUI
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-sm shadow-pink-500/20'
                : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              <Sparkles className={`w-5 h-5 ${isColourUI ? 'text-pink-400' : ''}`} />
            </div>
            <h3 className={`text-base font-bold ${isColourUI ? 'text-pink-100' : isDark ? 'text-white' : 'text-zinc-950'}`}>AI Server Assistant</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Interactive AI helper to answer questions about Minecraft servers, anti-AFK best practices, and troubleshooting connection drops.
            </p>
          </div>
        </div>
      </section>

      {/* 4. 3-STEP QUICK LAUNCH ROADMAP */}
      <section className={`border rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 transition-colors ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="text-center space-y-2">
          <span className={`text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
            isDark ? 'text-zinc-300 bg-zinc-950 border-zinc-800' : 'text-zinc-700 bg-zinc-100 border-zinc-300'
          }`}>
            Simple 3-Step Setup
          </span>
          <h2 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>
            How To Start Your 24/7 Bot
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className={`w-10 h-10 rounded-xl font-mono font-black text-base flex items-center justify-center border ${
              isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}>
              01
            </div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>Create Your Profile</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Sign up in 10 seconds with a username and password. No payment or credit card required.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className={`w-10 h-10 rounded-xl font-mono font-black text-base flex items-center justify-center border ${
              isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}>
              02
            </div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>Enter Server IP & Port</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Enter your server address (e.g. <code className="font-mono">node.aternos.me</code>), bot name, and version.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className={`w-10 h-10 rounded-xl font-mono font-black text-base flex items-center justify-center border ${
              isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
            }`}>
              03
            </div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>Activate 24/7 Mode</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Click "Start Bot". Your bot will connect immediately, authenticate, and keep the server online 24/7.
            </p>
          </div>
        </div>
      </section>

      {/* 5. VERIFIED COMPATIBILITY BADGES */}
      <section className={`border rounded-2xl p-6 text-center space-y-4 transition-colors ${
        isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
      }`}>
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          Works seamlessly across all Minecraft servers & hosts
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['Aternos (Free)', 'Minehut', 'FalixNodes', 'PloudOS', 'Server.pro', 'PaperMC', 'Purpur', 'Spigot', 'Fabric', 'Forge'].map((badge) => (
            <span
              key={badge}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-sm ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-700'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-zinc-400" />
              <span>{badge}</span>
            </span>
          ))}
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
            isDark ? 'text-zinc-300 bg-zinc-900 border-zinc-800' : 'text-zinc-700 bg-zinc-100 border-zinc-300'
          }`}>
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>
            Got Questions? We Have Answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className={`border rounded-2xl overflow-hidden transition-colors ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className={`w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm cursor-pointer ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-zinc-200' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className={`p-5 pt-0 text-xs leading-relaxed border-t ${
                        isDark ? 'text-zinc-400 border-zinc-800' : 'text-zinc-600 border-zinc-200'
                      }`}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION CARD */}
      <section className={`border rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6 transition-colors ${
        isDark
          ? 'bg-zinc-900 border-zinc-800'
          : 'bg-zinc-50 border-zinc-300'
      }`}>
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-zinc-950'
          }`}>
            Ready To Keep Your Server Online 24/7?
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}>
            Join Minecraft players maintaining active Aternos & SMP servers with zero sleep.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onSignUp}
              className="px-7 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 border border-zinc-300 rounded-2xl text-xs sm:text-sm font-bold tracking-wide shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onSignIn}
              className={`px-6 py-3.5 border rounded-2xl text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer shadow-sm flex items-center gap-2 ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                  : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
