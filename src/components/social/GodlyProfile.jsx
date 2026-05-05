import React from 'react';
import { motion } from 'framer-motion';

const SPARKLES = [
  { x: '-18%', y: '-18%', delay: 0,    size: 13 },
  { x: '108%', y: '-14%', delay: 0.35, size: 10 },
  { x: '112%', y: '68%',  delay: 0.65, size: 15 },
  { x: '-20%', y: '72%',  delay: 0.95, size: 11 },
  { x: '46%',  y: '-22%', delay: 0.18, size: 8  },
  { x: '68%',  y: '108%', delay: 0.72, size: 13 },
  { x: '22%',  y: '110%', delay: 1.1,  size: 9  },
  { x: '80%',  y: '36%',  delay: 0.42, size: 8  },
];

function Sparkle({ x, y, delay, size }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 20 }}
      animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4], rotate: [0, 180, 360] }}
      transition={{ duration: 1.9, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"
          fill="#FFD700" stroke="#FFA500" strokeWidth="0.5" />
      </svg>
    </motion.div>
  );
}

export default function GodlyWrapper({ active, children, className = '' }) {
  if (!active) return <div className={className}>{children}</div>;

  return (
    <div className={`relative ${className}`} style={{ isolation: 'isolate' }}>
      {/* Animated glow ring — pure box-shadow, no overlay on avatar */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          inset: -3,
          borderRadius: 'inherit',
          zIndex: 0,
        }}
        animate={{
          boxShadow: [
            '0 0 0 2.5px #FFD700, 0 0 14px 4px rgba(255,215,0,0.5), 0 0 32px 8px rgba(255,165,0,0.25)',
            '0 0 0 2.5px #FFA500, 0 0 22px 8px rgba(255,215,0,0.75), 0 0 52px 18px rgba(255,165,0,0.4)',
            '0 0 0 2.5px #FFEC6E, 0 0 14px 4px rgba(255,215,0,0.5), 0 0 32px 8px rgba(255,165,0,0.25)',
          ],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Sparkles outside the avatar */}
      {SPARKLES.map((s, i) => <Sparkle key={i} {...s} />)}

      {/* Content — z-index keeps avatar fully visible on top */}
      <div className="relative" style={{ zIndex: 10 }}>{children}</div>
    </div>
  );
}

export function GodlyBadgePill() {
  return (
    <motion.span
      className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
      style={{
        background: 'linear-gradient(90deg, #FFD700, #FFA500, #FFD700)',
        backgroundSize: '200% 100%',
        color: '#7A4900',
        letterSpacing: '0.05em',
      }}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    >
      ✨ GODLY
    </motion.span>
  );
}
