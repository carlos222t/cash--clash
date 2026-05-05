import React from 'react';
import { getXPForCurrentLevel, getXPToNextLevel, getXPProgress } from './GameUtils';
import { motion } from 'framer-motion';

export default function XPBar({ xp }) {
  const current = getXPForCurrentLevel(xp);
  const needed  = getXPToNextLevel(xp);
  const progress = getXPProgress(xp);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{current} XP</span>
        <span>{needed} XP</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
