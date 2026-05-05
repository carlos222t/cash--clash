import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    step: 1,
    emoji: '👋',
    title: 'Welcome to Cash Clash!',
    desc: 'Cash Clash turns budgeting into a game. Track your money, level up, battle friends, and become a savings champion. Let\'s get you started in 10 quick steps.',
    action: null,
  },
  {
    step: 2,
    emoji: '💰',
    title: 'Track Your Money',
    desc: 'Head to Budget → click "Add Transaction" → enter the amount, pick a category (Food, Bills, Fun…), and mark it as income or expense. Every dollar you log helps calculate your savings score.',
    action: { label: 'Go to Budget', to: '/Budget' },
  },
  {
    step: 3,
    emoji: '📊',
    title: 'Build Your Budget',
    desc: 'In Budget, set spending limits per category. Green means you\'re on track — red means you\'re over. The app auto-tracks how much you\'ve spent vs. your cap each month.',
    action: { label: 'Set Budget', to: '/Budget' },
  },
  {
    step: 4,
    emoji: '🏅',
    title: 'Earn Badges',
    desc: 'Badges are awarded automatically when you hit milestones: log your first transaction, save $100, maintain a 7-day streak, win a clash, and more. Visit Badges to see all 20+ achievements.',
    action: { label: 'See Badges', to: '/Badges' },
  },
  {
    step: 5,
    emoji: '✏️',
    title: 'Customize Your Profile',
    desc: 'Go to Settings to set your @username, display name, and avatar. Your username is how friends find you for clashes — make it memorable!',
    action: { label: 'Open Settings', to: '/Settings' },
  },
  {
    step: 6,
    emoji: '👥',
    title: 'Add Friends',
    desc: 'Go to Friends and search for people by their @username. Send a friend request — once they accept, you\'ll see each other on the Leaderboard and can send clash invites.',
    action: { label: 'Find Friends', to: '/Friends' },
  },
  {
    step: 7,
    emoji: '⚔️',
    title: 'Start a 1v1 Clash',
    desc: 'Go to 1v1 Clash → click "New Clash" → enter your opponent\'s @username and set a weekly savings goal. They\'ll get an inbox notification to accept.',
    action: { label: 'Start a Clash', to: '/Challenges' },
  },
  {
    step: 8,
    emoji: '📈',
    title: 'Watch the Progress Bar',
    desc: 'Once both players accept, a live progress bar tracks who\'s saving more in real-time. Log transactions daily to keep your score updated — the leader is shown with a 👑.',
    action: { label: 'View Clashes', to: '/Challenges' },
  },
  {
    step: 9,
    emoji: '🏆',
    title: 'Win & Level Up',
    desc: 'At week\'s end, whoever saved more wins the clash and earns bonus XP. XP fills your level bar — level up to climb from "Broke Beginner" to "Money Legend" and unlock new rank titles.',
    action: null,
  },
  {
    step: 10,
    emoji: '🚀',
    title: 'You\'re Ready!',
    desc: 'Dashboard is your home base — check stats, quick-track transactions, see active clashes, and monitor your streak. The more you use Cash Clash, the higher you\'ll rank. Good luck!',
    action: null,
    final: true,
  },
];

const STORAGE_KEY = 'cashclash_tutorial_dismissed';

export default function OnboardingTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState([]);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

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

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Step {current.step} of {STEPS.length}
              </span>
              <span className="text-xs text-sidebar-foreground/40">Quick Start Guide</span>
            </div>
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
              className="space-y-3"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">{current.emoji}</span>
                <div>
                  <h3 className="font-heading font-bold text-sidebar-foreground text-base">{current.title}</h3>
                  <p className="text-sm text-sidebar-foreground/70 mt-1 leading-relaxed">{current.desc}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex items-center gap-1 mt-4">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-200 ${i === step ? 'w-4 h-1.5 bg-primary' : i < step ? 'w-1.5 h-1.5 bg-primary/40' : 'w-1.5 h-1.5 bg-sidebar-accent'}`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1 text-sidebar-foreground/60">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {current.action && (
                <Link to={current.action.to}>
                  <Button variant="outline" size="sm" className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent text-xs">
                    {current.action.label}
                  </Button>
                </Link>
              )}
              {current.final ? (
                <Button size="sm" onClick={dismiss} className="gap-1">
                  <CheckCircle className="w-4 h-4" /> Let's go!
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStep(s => s + 1)} className="gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
