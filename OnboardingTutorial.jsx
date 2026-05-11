import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    step: 1,
    title: 'Welcome to Cash Clash',
    desc: 'Track your money, battle friends, and level up your finances. This guide covers the key features in under a minute.',
    action: null,
  },
  {
    step: 2,
    title: 'Log Transactions',
    desc: 'Go to Budget and tap "Add Transaction". Enter an amount, pick a category (Food, Bills, Fun...), and mark it as income or expense. Every entry updates your savings score.',
    action: { label: 'Go to Budget', to: '/Budget' },
  },
  {
    step: 3,
    title: 'Set Spending Limits',
    desc: 'In Budget, set a cap per category. The app tracks spending vs. your limit each month and shows when you are over.',
    action: { label: 'Open Budget', to: '/Budget' },
  },
  {
    step: 4,
    title: 'Set Goals',
    desc: 'Go to Goals to create savings targets. The app tracks your progress automatically as you log transactions.',
    action: { label: 'Open Goals', to: '/Goals' },
  },
  {
    step: 5,
    title: 'Set Up Your Profile',
    desc: 'Go to Settings to pick a username, display name, and avatar. Your username is how friends find and challenge you.',
    action: { label: 'Open Settings', to: '/Settings' },
  },
  {
    step: 6,
    title: 'Add Friends',
    desc: 'Go to Friends and search by username. Once they accept your request, you can see each other on the Leaderboard and send clash invites.',
    action: { label: 'Find Friends', to: '/Friends' },
  },
  {
    step: 7,
    title: 'Start a 1v1 Clash',
    desc: 'Go to Challenges, tap "New Clash", enter a friend\'s username and set a savings goal. They\'ll get a notification to accept.',
    action: { label: 'Challenges', to: '/Challenges' },
  },
  {
    step: 8,
    title: 'Open Card Packs',
    desc: 'Earn coins by logging transactions and leveling up. Spend them in the Pack Opener to collect cards of different rarities.',
    action: { label: 'Pack Opener', to: '/packs' },
  },
  {
    step: 9,
    title: 'Earn Badges',
    desc: 'Badges unlock automatically when you hit milestones — first transaction, savings goals, streaks, clash wins, and more.',
    action: { label: 'View Badges', to: '/Badges' },
  },
  {
    step: 10,
    title: 'You are ready',
    desc: 'Your Dashboard shows your stats, active clashes, streak, and quick-add. The more you track, the higher you rank.',
    action: null,
    final: true,
  },
];

const STORAGE_KEY = 'cashclash_tutorial_dismissed';

export default function OnboardingTutorial() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [step, setStep] = useState(0);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="bg-sidebar border border-sidebar-border rounded-2xl overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-sidebar-accent">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {current.step} / {STEPS.length}
            </span>
            <button onClick={dismiss} className="text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="font-bold text-sidebar-foreground text-sm mb-1">{current.title}</h3>
              <p className="text-xs text-sidebar-foreground/70 leading-relaxed">{current.desc}</p>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex items-center gap-1 mt-3">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-200 ${i === step ? 'w-4 h-1.5 bg-primary' : i < step ? 'w-1.5 h-1.5 bg-primary/40' : 'w-1.5 h-1.5 bg-sidebar-accent'}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3">
            <div>
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1 text-sidebar-foreground/60 text-xs px-2">
                  <ChevronLeft className="w-3 h-3" /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {current.action && (
                <Link to={current.action.to}>
                  <Button variant="outline" size="sm" className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent text-xs px-2">
                    {current.action.label}
                  </Button>
                </Link>
              )}
              {current.final ? (
                <Button size="sm" onClick={dismiss} className="gap-1 text-xs px-3">
                  <CheckCircle className="w-3 h-3" /> Done
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStep(s => s + 1)} className="gap-1 text-xs px-3">
                  Next <ChevronRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
