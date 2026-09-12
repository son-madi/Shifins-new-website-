import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Activity,
  LogOut,
  LogIn,
  ShieldAlert,
  ArrowLeftRight,
  Menu,
  X,
  User as UserIcon,
  Sliders,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Moon,
  Sun,
  Sparkles,
  Palette,
} from 'lucide-react';
import { GlobalStats, PublicPlatformStats, User } from '../types';
import { NinimoIcon } from './NinimoIcon';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  stats: GlobalStats;
  publicStats?: PublicPlatformStats | null;
  isStreamConnected: boolean;
  currentUser: User | null;
  globalBotLimit?: number;
  showingAdminPage?: boolean;
  isImpersonating?: boolean;
  onOpenAdmin?: () => void;
  onExitImpersonation?: () => void;
  onAddNewBot: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenNetherCalc?: () => void;
  onOpenDefaults?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  publicStats,
  isStreamConnected,
  currentUser,
  globalBotLimit = 1,
  showingAdminPage = false,
  isImpersonating = false,
  onOpenAdmin,
  onExitImpersonation,
  onAddNewBot,
  onOpenAuth,
  onLogout,
  onOpenNetherCalc,
  onOpenDefaults,
}) => {
  const { theme, toggleTheme, setTheme, toggleColourUI, isColourUI } = useTheme();
  const isDark = theme === 'dark' || theme === 'classic-green';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <header
        className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-6 lg:px-8 py-3 w-full transition-colors ${
          isColourUI
            ? 'bg-[#060a16]/95 border-indigo-500/25 text-slate-100 shadow-[0_4px_25px_rgba(99,102,241,0.08)]'
            : isDark
            ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100'
            : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-0">
          {/* Left: Clean Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <NinimoIcon size="md" />
            <div className="flex flex-col justify-center">
              <span
                className={`text-lg font-black tracking-tight leading-none ${
                  isColourUI
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'
                    : isDark ? 'text-white' : 'text-zinc-950'
                }`}
              >
                Ninimo
              </span>
              <span
                className={`text-[11px] font-medium mt-0.5 leading-none ${
                  isColourUI ? 'text-slate-400' : isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                Minecraft Bot Commander
              </span>
            </div>
          </div>

          {/* Right Action Controls: Clean & Uncluttered */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Add Bot (when logged in and space allows) */}
            {currentUser && !showingAdminPage && (
              <motion.button
                id="btn-nav-add-bot"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddNewBot}
                className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                    : 'bg-white hover:bg-zinc-50 text-zinc-950 border-zinc-300'
                }`}
                title="Add Minecraft Bot"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bot</span>
              </motion.button>
            )}

            {/* If actively viewing Admin Page, offer a quick toggle button */}
            {currentUser?.isAdmin && showingAdminPage && onOpenAdmin && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenAdmin}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-zinc-100 text-zinc-950 border-white hover:bg-white'
                    : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </motion.button>
            )}

            {/* Dedicated Colour UI Button */}
            <motion.button
              id="btn-nav-colour-ui"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={toggleColourUI}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                isColourUI
                  ? 'bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-purple-500/20 text-sky-200 border-sky-400/50 ring-1 ring-sky-400/40 shadow-sm shadow-sky-500/20'
                  : isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                  : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-300'
              }`}
              title={isColourUI ? 'Colour UI Active (Click to switch to Dark)' : 'Switch to Colour UI'}
            >
              <Palette className={`w-3.5 h-3.5 ${isColourUI ? 'text-pink-400 animate-spin-slow' : 'text-purple-400'}`} />
              <span className={isColourUI ? 'bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-black' : ''}>
                Colour UI
              </span>
              {isColourUI && (
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
              )}
            </motion.button>

            {/* Theme Toggle Button (Dark / White) */}
            <ThemeToggle />

            {/* Animated 3-Line Hamburger Menu Button with Micro-interactions */}
            <motion.button
              id="btn-navbar-menu"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              onClick={() => setIsDrawerOpen(true)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs flex flex-col items-center justify-center gap-1 w-9 h-9 ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
                  : 'bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 border-zinc-300'
              }`}
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <motion.span
                animate={{ width: isDrawerOpen ? 16 : 14 }}
                className={`h-0.5 rounded-full transition-colors ${
                  isDark ? 'bg-zinc-200' : 'bg-zinc-800'
                }`}
              />
              <motion.span
                animate={{ width: isDrawerOpen ? 12 : 16 }}
                className={`h-0.5 rounded-full transition-colors ${
                  isDark ? 'bg-zinc-200' : 'bg-zinc-800'
                }`}
              />
              <motion.span
                animate={{ width: isDrawerOpen ? 16 : 11 }}
                className={`h-0.5 rounded-full transition-colors ${
                  isDark ? 'bg-zinc-200' : 'bg-zinc-800'
                }`}
              />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Slide Drawer (Side Sheet) with Physics Springs & Staggered Transitions */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop Overlay with Smooth Blur Transition */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeInOut' }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer Content Panel with Refined Spring Physics */}
            <motion.div
              initial={{ x: '100%', opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.6 }}
              transition={{ type: 'spring', damping: 27, stiffness: 290, mass: 0.7 }}
              className={`relative z-10 w-full max-w-sm h-full flex flex-col shadow-2xl border-l transition-colors overflow-y-auto transform-gpu will-change-transform ${
                isColourUI
                  ? 'bg-[#090e1f] border-indigo-500/30 text-slate-100 shadow-[0_0_50px_rgba(99,102,241,0.25)]'
                  : isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                  : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              {/* Drawer Header */}
              <div
                className={`flex items-center justify-between p-4 border-b ${
                  isColourUI
                    ? 'border-indigo-500/20 bg-[#090e1f]/90'
                    : isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <NinimoIcon size="sm" />
                  <span
                    className={`font-black text-base tracking-tight ${
                      isColourUI ? 'text-white' : isDark ? 'text-white' : 'text-zinc-950'
                    }`}
                  >
                    Ninimo Menu
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={closeDrawer}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isColourUI
                      ? 'bg-indigo-950/60 hover:bg-indigo-900/80 text-slate-300 hover:text-white border-indigo-500/30'
                      : isDark
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                      : 'bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 border-zinc-300 shadow-xs'
                  }`}
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Drawer Body with Staggered Elements */}
              <div className="p-4 flex-1 space-y-4">
                {/* Account Section Card */}
                {currentUser ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04, duration: 0.2 }}
                    className={`p-4 rounded-2xl border transition-colors space-y-3 ${
                      isColourUI
                        ? 'bg-indigo-950/40 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                        : isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black uppercase border shrink-0 ${
                        isColourUI
                          ? 'bg-indigo-900/60 text-sky-200 border-indigo-500/40 shadow-xs'
                          : 'bg-zinc-800 text-zinc-100 border-zinc-700'
                      }`}>
                        {currentUser.username.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-bold text-sm truncate ${
                              isColourUI ? 'text-white' : isDark ? 'text-white' : 'text-zinc-950'
                            }`}
                          >
                            {currentUser.username}
                          </span>
                          {currentUser.isAdmin ? (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1 ${
                              isColourUI
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                            }`}>
                              <ShieldCheck className={`w-2.5 h-2.5 ${isColourUI ? 'text-emerald-400' : ''}`} />
                              Admin
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-200 text-zinc-800 font-mono font-bold uppercase tracking-wider">
                              User
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs truncate ${
                            isColourUI ? 'text-slate-400' : isDark ? 'text-zinc-400' : 'text-zinc-500'
                          }`}
                        >
                          {currentUser.email || 'Private Account'}
                        </p>
                      </div>
                    </div>

                    {/* Impersonation Banner if active */}
                    {isImpersonating && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-500">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span className="font-semibold">Impersonating</span>
                        </div>
                        <button
                          onClick={() => {
                            onExitImpersonation?.();
                            closeDrawer();
                          }}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Exit
                        </button>
                      </div>
                    )}

                    {/* Bot Limit & Active Stats */}
                    <div
                      className={`grid grid-cols-2 gap-2 pt-2 border-t text-xs ${
                        isColourUI
                          ? 'border-indigo-500/20 text-slate-400'
                          : isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-zinc-200 text-zinc-600'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                          Active Bots
                        </span>
                        <p className={`font-mono font-bold ${isColourUI ? 'text-emerald-400' : isDark ? 'text-white' : 'text-zinc-950'}`}>
                          {stats.activeBots} Online
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                          Account Slots
                        </span>
                        <p className={`font-mono font-bold ${isColourUI ? 'text-sky-300' : isDark ? 'text-white' : 'text-zinc-950'}`}>
                          {stats.totalBots} / {globalBotLimit}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04, duration: 0.2 }}
                    className={`p-4 rounded-2xl border text-center space-y-3 ${
                      isColourUI
                        ? 'bg-indigo-950/40 border-indigo-500/30'
                        : isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                      isColourUI ? 'bg-indigo-900/60 text-sky-300 border border-indigo-500/40' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-sm font-bold ${isColourUI ? 'text-white' : isDark ? 'text-white' : 'text-zinc-950'}`}>
                        Guest Account
                      </h4>
                      <p className={`text-xs ${isColourUI ? 'text-slate-400' : isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Sign in to manage and configure your 24/7 background Minecraft bots.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onOpenAuth();
                        closeDrawer();
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                        isColourUI
                          ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white border-sky-400/50 shadow-md shadow-indigo-500/30 hover:brightness-110'
                          : isDark
                          ? 'bg-zinc-100 hover:bg-white text-zinc-950 border-white'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-zinc-900/20'
                      }`}
                    >
                      Sign In / Register
                    </button>
                  </motion.div>
                )}

                {/* Primary Navigation & Control Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.22 }}
                  className="space-y-1.5"
                >
                  <div
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 pt-2 ${
                      isColourUI ? 'text-slate-400' : isDark ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    Management & Tools
                  </div>

                  {/* Admin Panel Link (Only visible if Admin) */}
                  {currentUser?.isAdmin && onOpenAdmin && (
                    <button
                      id="drawer-admin-btn"
                      onClick={() => {
                        onOpenAdmin();
                        closeDrawer();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        showingAdminPage
                          ? isColourUI
                            ? 'bg-indigo-900/60 border-indigo-400/60 text-white'
                            : isDark
                            ? 'bg-zinc-800 border-zinc-700 text-white'
                            : 'bg-zinc-200 border-zinc-300 text-zinc-950'
                          : isColourUI
                          ? 'bg-indigo-950/30 hover:bg-indigo-900/40 border-indigo-500/30 text-slate-200'
                          : isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200'
                          : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className={`w-4 h-4 ${isColourUI ? 'text-amber-400' : 'text-zinc-400'}`} />
                        <span>{showingAdminPage ? 'Return to Dashboard' : 'Admin Panel'}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isColourUI ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}>
                        ADMIN
                      </span>
                    </button>
                  )}

                  {/* Add New Bot */}
                  {currentUser && (
                    <button
                      onClick={() => {
                        onAddNewBot();
                        closeDrawer();
                      }}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isColourUI
                          ? 'bg-indigo-950/30 hover:bg-indigo-900/40 border-indigo-500/30 text-slate-200'
                          : isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200'
                          : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800'
                      }`}
                    >
                      <Plus className={`w-4 h-4 ${isColourUI ? 'text-sky-400' : 'text-zinc-400'}`} />
                      <span>Add New Bot Profile</span>
                    </button>
                  )}

                  {/* Presets & Quick Messages */}
                  {onOpenDefaults && (
                    <button
                      onClick={() => {
                        onOpenDefaults();
                        closeDrawer();
                      }}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isColourUI
                          ? 'bg-indigo-950/30 hover:bg-indigo-900/40 border-indigo-500/30 text-slate-200'
                          : isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200'
                          : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800'
                      }`}
                    >
                      <Sliders className={`w-4 h-4 ${isColourUI ? 'text-cyan-400' : 'text-zinc-400'}`} />
                      <span>Bot Presets & Settings</span>
                    </button>
                  )}

                  {/* Nether Portal Calculator */}
                  {onOpenNetherCalc && (
                    <button
                      onClick={() => {
                        onOpenNetherCalc();
                        closeDrawer();
                      }}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isColourUI
                          ? 'bg-indigo-950/30 hover:bg-indigo-900/40 border-indigo-500/30 text-slate-200'
                          : isDark
                          ? 'bg-zinc-900 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200'
                          : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800'
                      }`}
                    >
                      <Compass className={`w-4 h-4 ${isColourUI ? 'text-purple-400' : 'text-zinc-400'}`} />
                      <span>Nether Portal Calculator</span>
                    </button>
                  )}

                  {/* Dedicated Colour UI Button in Sidebar */}
                  <motion.button
                    id="btn-sidebar-colour-ui"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleColourUI}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isColourUI
                        ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-sky-500/15 text-sky-200 border-purple-500/40 shadow-sm shadow-purple-500/20 ring-1 ring-purple-400/30'
                        : isDark
                        ? 'bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-300 border-zinc-800'
                        : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        isColourUI
                          ? 'bg-gradient-to-br from-pink-500/30 to-purple-500/30 border-purple-400/50 shadow-xs'
                          : 'bg-pink-500/10 border-pink-500/20'
                      }`}>
                        <Palette className="w-4 h-4 text-pink-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-extrabold flex items-center gap-1.5">
                          <span className={isColourUI ? 'bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent' : ''}>
                            Colour UI
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 font-mono font-bold border border-pink-500/30">
                            VIBRANT
                          </span>
                        </div>
                        <div className="text-[10px] font-normal opacity-80">
                          Chromatic icons, matching glowing pills & dynamic themes
                        </div>
                      </div>
                    </div>
                    {isColourUI ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xs">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                        Apply
                      </span>
                    )}
                  </motion.button>

                  {/* Theme Mode Selector Row (Dark & White) */}
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-2 ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span>Theme: <strong className="capitalize">{theme === 'classic-green' ? 'Classic Green' : isDark ? 'Dark Mode' : 'White Mode'}</strong></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        id="btn-sidebar-theme-dark"
                        onClick={() => setTheme('dark')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          theme === 'dark'
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                            : isDark ? 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 border-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark</span>
                      </button>
                      <button
                        id="btn-sidebar-theme-white"
                        onClick={() => setTheme('light')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          theme === 'light'
                            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                            : isDark ? 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 border-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-300'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>White</span>
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Connection Status Card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.22 }}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    isDark ? 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-zinc-400" />
                      Platform Sync
                    </span>
                    <span className={isStreamConnected ? (isDark ? 'text-zinc-200 font-bold' : 'text-zinc-800 font-bold') : 'text-zinc-500'}>
                      {isStreamConnected ? 'Connected' : 'Syncing...'}
                    </span>
                  </div>
                  {publicStats && (
                    <div className="text-[11px] flex justify-between">
                      <span>Network Bots</span>
                      <span className={`font-mono font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                        {publicStats.activeBotsOnline} active
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Drawer Footer (Sign In / Sign Out) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className={`p-4 border-t mt-auto ${
                  isColourUI
                    ? 'border-indigo-500/20 bg-[#060a16]/90'
                    : isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                {currentUser ? (
                  <button
                    onClick={() => {
                      onLogout();
                      closeDrawer();
                    }}
                    className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isColourUI
                        ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border-rose-500/30 shadow-xs'
                        : isDark
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
                        : 'bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border-zinc-300 shadow-xs'
                    }`}
                  >
                    <LogOut className={`w-4 h-4 ${isColourUI ? 'text-rose-400' : ''}`} />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onOpenAuth();
                      closeDrawer();
                    }}
                    className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
                      isColourUI
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 border-emerald-400/50 shadow-md shadow-emerald-500/25 font-black hover:brightness-110'
                        : isDark
                        ? 'bg-zinc-100 hover:bg-white text-zinc-950 border-white'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900 shadow-zinc-900/20'
                    }`}
                  >
                    <LogIn className={`w-4 h-4 ${isColourUI ? 'text-zinc-950' : ''}`} />
                    <span>Sign In</span>
                  </button>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
