import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TutorialContext = createContext(null);

// Each step: which element to highlight (data-tutorial attr), tooltip text, arrow direction, and which route to be on
export const TUTORIAL_STEPS = [
  {
    id: 'dashboard',
    route: '/Dashboard',
    target: 'nav-dashboard',
    title: 'Welcome to Cash Clash!',
    desc: 'Budget your money, battle friends, and level up. This guide covers the key features in under a minute.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'track-money',
    route: '/Budget',
    target: 'btn-add-transaction',
    title: 'Log Your First Transactions',
    desc: 'When adding transactions, tap "Add Transaction". Enter an amount, pick a category (Food, Bills, Fun...), and mark it as income or expense. Every entry updates your budget progress',
    arrow: 'down',
    tooltipSide: 'bottom',
  },
  {
    id: 'budget-nav',
    route: '/Budget',
    target: 'nav-budget',
    title: 'Find & Set Budgets',
    desc: 'In the Budgeting section, enter your current predicted earnings. We will generate a basic budgeting plan for you. You can customize it by adjusting category limits. The app tracks your spending against these budgets in real-time.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'clash-nav',
    route: '/Challenges',
    target: 'nav-clash',
    title: 'Clash with Friends',
    desc: 'Challenge your friends by inviting them to a clash. Complete objectives / Save money to win! You can have multiple clashes active at once, and track them all from your Dashboard.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'new-clash',
    route: '/Badges',
    target: 'btn-new-clash',
    title: 'Unlock Badges',
    desc: 'Badges unlock automatically when you hit milestones: first transaction, savings goals, streaks, clash wins, and more.',
    arrow: 'down',
    tooltipSide: 'bottom',
  },
  {
    id: 'friends-nav',
    route: '/packs',
    target: 'nav-friends',
    title:  'Pack Card',
    desc: 'You earn coins by logging transactions and leveling up. Spend them in the Pack Opener to collect cards of different rarities.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'badges-nav',
    route: '/Badges',
    target: 'nav-badges',
    title: 'Customize Your Profile',
    desc: 'Go to your customize page to pick a username, display name, avatar, and your Banner.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'leaderboard-nav',
    route: '/inbox',
    target: 'nav-leaderboard',
    title: 'Inbox',
    desc: 'Check your inbox for Invitations and Notifications.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'settings-nav',
    route: '/Settings',
    target: 'nav-settings',
    title: 'Settings & More',
    desc: 'SExplore additional features and customize your experience & information.',
    arrow: 'right',
    tooltipSide: 'right',
    tooltipAnchor: 'top',
  },
  {
    id: 'inbox-nav',
    route: '/Inbox',
    target: 'nav-inbox',
    title:  'Now Youre Ready to Clash!',
    desc: 'Your Dashboard shows your stats, active clashes, streak, and quick-add. The more you track, the higher you rank',
    arrow: 'right',
    tooltipSide: 'right',
    final: true,
  },
];

export function TutorialProvider({ children }) {
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const start = useCallback(() => {
    setStepIdx(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setStepIdx(0);
  }, []);

  const next = useCallback(() => {
    setStepIdx(i => {
      const next = i + 1;
      if (next >= TUTORIAL_STEPS.length) {
        setActive(false);
        return 0;
      }
      return next;
    });
  }, []);

  const prev = useCallback(() => {
    setStepIdx(i => Math.max(0, i - 1));
  }, []);

  const currentStep = TUTORIAL_STEPS[stepIdx];

  return (
    <TutorialContext.Provider value={{ active, start, stop, next, prev, stepIdx, currentStep, totalSteps: TUTORIAL_STEPS.length }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used inside TutorialProvider');
  return ctx;
}