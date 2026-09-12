import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface NinimoIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotate: number;
  shape: 'square' | 'circle' | 'spark';
}

export const NinimoIcon: React.FC<NinimoIconProps> = ({ className = '', size = 'md', onClick }) => {
  const { isDark, isColourUI } = useTheme();
  const [isWinking, setIsWinking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [clickWave, setClickWave] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13',
    xl: 'w-16 h-16',
  }[size];

  // Dynamic colors based on theme
  const accentColor = isColourUI ? '#10b981' : isDark ? '#f4f4f5' : '#18181b';
  const secondaryAccent = isColourUI ? '#34d399' : isDark ? '#a1a1aa' : '#3f3f46';
  const eyeLight = isColourUI ? '#a7f3d0' : isDark ? '#ffffff' : '#71717a';
  const eyeDark = isColourUI ? '#064e3b' : isDark ? '#18181b' : '#09090b';

  // Palette for burst particles
  const particleColors = isColourUI
    ? ['#10b981', '#34d399', '#38bdf8', '#818cf8', '#a7f3d0', '#fbbf24', '#f43f5e']
    : isDark
    ? ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a', '#38bdf8', '#facc15']
    : ['#18181b', '#27272a', '#52525b', '#71717a', '#0284c7', '#d97706'];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger happy face / wink animation & wave
    setIsWinking(true);
    setClickWave(true);
    setTimeout(() => setIsWinking(false), 850);
    setTimeout(() => setClickWave(false), 600);

    // Generate burst particles around the icon
    const count = size === 'sm' ? 10 : 16;
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
      const distance = 26 + Math.random() * (size === 'xl' ? 44 : 32);
      return {
        id: Date.now() + i + Math.random(),
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: Math.random() > 0.6 ? 5 : Math.random() > 0.3 ? 3.5 : 2.5,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        rotate: Math.random() * 360,
        shape: Math.random() > 0.5 ? 'square' : Math.random() > 0.3 ? 'spark' : 'circle',
      };
    });

    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
    }, 700);

    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }}
      whileTap={{ scale: 0.88, rotate: -4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      onClick={handleClick}
      className={`relative ${sizeClasses} ${className} select-none cursor-pointer shrink-0 group`}
      title="Click to activate bot!"
    >
      {/* Shockwave expanding ring on click */}
      <AnimatePresence>
        {clickWave && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0.9 }}
            animate={{ scale: 2.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={`absolute inset-0 rounded-xl pointer-events-none border-2 ${
              isColourUI
                ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]'
                : isDark
                ? 'border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                : 'border-zinc-900/60 shadow-[0_0_10px_rgba(24,24,27,0.3)]'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Burst Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.2, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [1, 0.95, 0],
              scale: [0.3, 1.25, 0],
              rotate: p.rotate + 220,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.shape === 'spark' ? 'transparent' : p.color,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '1px' : '0px',
              boxShadow: isColourUI || isDark ? `0 0 6px ${p.color}` : undefined,
            }}
          >
            {p.shape === 'spark' && (
              <svg viewBox="0 0 10 10" className="w-full h-full" style={{ fill: p.color }}>
                <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" />
              </svg>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Outer ambient aura glow */}
      <div
        className={`absolute -inset-1.5 rounded-xl blur-md transition-all duration-300 ${
          isColourUI
            ? 'bg-gradient-to-tr from-emerald-500/30 via-teal-400/35 to-indigo-500/25 opacity-70 group-hover:opacity-100 group-hover:scale-105'
            : isDark
            ? 'bg-gradient-to-tr from-zinc-600/30 via-zinc-500/25 to-zinc-400/20 opacity-50 group-hover:opacity-85 group-hover:scale-105'
            : 'bg-gradient-to-tr from-zinc-300/50 via-zinc-200/60 to-zinc-400/40 opacity-40 group-hover:opacity-80 group-hover:scale-105'
        }`}
      />

      {/* Main Beveled Container */}
      <div
        className={`relative w-full h-full rounded-xl p-[1.5px] shadow-md border overflow-hidden flex items-center justify-center transition-all duration-200 ${
          isColourUI
            ? 'bg-gradient-to-b from-[#111c35] via-[#0b1325] to-[#060a15] border-cyan-500/40 shadow-cyan-950/40 group-hover:border-emerald-400/60'
            : isDark
            ? 'bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border-zinc-700 shadow-zinc-950/50 group-hover:border-zinc-500'
            : 'bg-gradient-to-b from-white via-zinc-50 to-zinc-100 border-zinc-300 shadow-zinc-300/40 group-hover:border-zinc-400'
        }`}
      >
        {/* Subtle matrix dot pattern background */}
        <div
          className={`absolute inset-0 [background-size:5px_5px] ${
            isColourUI
              ? 'bg-[radial-gradient(#38bdf8_1px,transparent_1px)] opacity-25'
              : isDark
              ? 'bg-[radial-gradient(#71717a_1px,transparent_1px)] opacity-25'
              : 'bg-[radial-gradient(#a1a1aa_1px,transparent_1px)] opacity-30'
          }`}
        />

        {/* Custom High-Fidelity Minecraft Bot SVG Face */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1 relative z-10 drop-shadow-sm"
        >
          {/* Signal Antenna */}
          <rect x="18" y="2" width="4" height="4" rx="0.5" fill={accentColor} />
          <circle cx="20" cy="4" r="1.3" fill={secondaryAccent} />
          <rect x="19" y="6" width="2" height="3" fill={isDark ? '#71717a' : '#a1a1aa'} />
          
          {/* Antenna Pulse Ring */}
          <circle
            cx="20"
            cy="4"
            r="3"
            stroke={secondaryAccent}
            strokeWidth="0.8"
            strokeOpacity="0.8"
            className="animate-ping origin-center"
          />

          {/* Left & Right Ear Bolt Pods */}
          <rect x="3" y="15" width="3" height="8" rx="0.5" fill={isDark ? '#3f3f46' : '#71717a'} />
          <rect x="3.5" y="17" width="2" height="4" rx="0.5" fill={accentColor} />

          <rect x="34" y="15" width="3" height="8" rx="0.5" fill={isDark ? '#3f3f46' : '#71717a'} />
          <rect x="34.5" y="17" width="2" height="4" rx="0.5" fill={accentColor} />

          {/* Main Bot Helmet Chassis */}
          <rect
            x="6"
            y="8"
            width="28"
            height="26"
            rx="2"
            fill={isDark ? '#18181b' : '#ffffff'}
            stroke={isDark ? '#3f3f46' : '#e2e8f0'}
            strokeWidth="1.5"
          />

          {/* Top Helmet Armor Plate */}
          <rect
            x="8"
            y="9.5"
            width="24"
            height="3"
            rx="0.5"
            fill={isDark ? '#27272a' : '#f1f5f9'}
            fillOpacity="0.7"
          />

          {/* High-Tech Visor Glass Area */}
          <rect
            x="8.5"
            y="14"
            width="23"
            height="11"
            rx="1.5"
            fill={isDark ? '#09090b' : '#0f172a'}
            stroke={isDark ? '#27272a' : '#1e293b'}
            strokeWidth="1"
          />

          {/* Visor Glossy Specular Reflection Line */}
          <line
            x1="10"
            y1="15.5"
            x2="30"
            y2="15.5"
            stroke={secondaryAccent}
            strokeWidth="0.8"
            strokeOpacity={isDark ? '0.4' : '0.6'}
            strokeLinecap="round"
          />

          {/* Dynamic Interactive Eyes */}
          {isWinking ? (
            /* Happy / Overjoyed Arch Eyes (^ ^) when clicked */
            <g className="animate-pulse">
              <path
                d="M12 20 Q14.25 16.5 16.5 20"
                stroke={isColourUI ? '#34d399' : isDark ? '#ffffff' : '#e2e8f0'}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M23.5 20 Q25.75 16.5 28 20"
                stroke={isColourUI ? '#34d399' : isDark ? '#ffffff' : '#e2e8f0'}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : (
            /* Standard Focused Glowing Pixel Eyes */
            <>
              {/* Left Eye */}
              <g>
                <rect x="11.5" y="16.5" width="5.5" height="5.5" rx="0.5" fill={secondaryAccent}>
                  <animate attributeName="opacity" values="1;0.85;1" dur="2.5s" repeatCount="indefinite" />
                </rect>
                <rect x="12.5" y="17.5" width="2.2" height="2.2" rx="0" fill={eyeDark} />
                <rect x="15" y="17.5" width="1.2" height="1.2" rx="0" fill={eyeLight} />
              </g>

              {/* Right Eye */}
              <g>
                <rect x="23" y="16.5" width="5.5" height="5.5" rx="0.5" fill={secondaryAccent}>
                  <animate attributeName="opacity" values="1;0.85;1" dur="2.5s" repeatCount="indefinite" />
                </rect>
                <rect x="24" y="17.5" width="2.2" height="2.2" rx="0" fill={eyeDark} />
                <rect x="26.5" y="17.5" width="1.2" height="1.2" rx="0" fill={eyeLight} />
              </g>
            </>
          )}

          {/* Speaker / Mouth Voxel Grille */}
          <rect x="13.5" y="27.5" width="3.5" height="2" rx="0" fill={isDark ? '#71717a' : '#94a3b8'} />
          <rect
            x="18.25"
            y="27.5"
            width="3.5"
            height="2"
            rx="0"
            fill={isWinking ? secondaryAccent : accentColor}
          />
          <rect x="23" y="27.5" width="3.5" height="2" rx="0" fill={isDark ? '#71717a' : '#94a3b8'} />
        </svg>

        {/* Live Active Power Dot */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full transition-all duration-300 ${
            isWinking
              ? 'scale-125 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)] ring-2 ring-white'
              : isColourUI
              ? 'bg-emerald-400 ring-2 ring-emerald-950 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
              : isDark
              ? 'bg-zinc-100 ring-2 ring-zinc-950 shadow-xs animate-pulse'
              : 'bg-zinc-900 ring-2 ring-zinc-300 shadow-xs animate-pulse'
          }`}
        />
      </div>
    </motion.div>
  );
};
