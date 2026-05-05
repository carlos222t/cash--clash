import React from 'react';
import { getLevelFromXP, getXPProgress, getRankTitle, getRankColor } from './GameUtils';

export default function LevelBadge({ xp, size = 'md' }) {
  const level = getLevelFromXP(xp);
  const progress = getXPProgress(xp);
  const rank = getRankTitle(level);
  const gradient = getRankColor(level);

  const sizes = {
    sm: { outer: 'w-10 h-10', text: 'text-sm', ring: 36, stroke: 3 },
    md: { outer: 'w-14 h-14', text: 'text-lg', ring: 52, stroke: 3.5 },
    lg: { outer: 'w-20 h-20', text: 'text-2xl', ring: 76, stroke: 4 },
  };
  const s = sizes[size];
  const radius = (s.ring - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${s.outer} flex items-center justify-center`}>
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${s.ring} ${s.ring}`}>
          <circle cx={s.ring/2} cy={s.ring/2} r={radius} fill="none"
            stroke="hsl(var(--muted))" strokeWidth={s.stroke} />
          <circle cx={s.ring/2} cy={s.ring/2} r={radius} fill="none"
            stroke="hsl(var(--primary))" strokeWidth={s.stroke}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className={`bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center w-3/4 h-3/4`}>
          <span className={`${s.text} font-heading font-bold text-white`}>{level}</span>
        </div>
      </div>
      {size !== 'sm' && <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{rank}</span>}
    </div>
  );
}