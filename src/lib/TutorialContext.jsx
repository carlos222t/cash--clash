import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TutorialContext = createContext(null);

// Each step: which element to highlight (data-tutorial attr), tooltip text, arrow direction, and which route to be on
export const TUTORIAL_STEPS = [
  {
    id: 'dashboard',
    route: '/Dashboard',
    target: 'nav-dashboard',
    title: '🏠 Your Dashboard',
    desc: 'This is your home base. Everything starts here — your stats, active clashes, and recent activity all live on the Dashboard.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'track-money',
    route: '/Budget',
    target: 'btn-add-transaction',
    title: '💰 Track Your Money',
    desc: 'Click "Add Transaction" to log income or expenses. Pick a category, enter the amount, and hit save. Every dollar logged counts toward your savings score.',
    arrow: 'down',
    tooltipSide: 'bottom',
  },
  {
    id: 'budget-nav',
    route: '/Budget',
    target: 'nav-budget',
    title: '📊 Budget Page',
    desc: 'This is where you track all your spending and income. Set monthly limits per category and watch your progress in real-time.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'clash-nav',
    route: '/Challenges',
    target: 'nav-clash',
    title: '⚔️ 1v1 Clash',
    desc: 'Clashes are the heart of Cash Clash. Challenge a friend to a weekly savings battle — whoever saves more by Sunday wins XP!',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'new-clash',
    route: '/Challenges',
    target: 'btn-new-clash',
    title: '➕ Start a Clash',
    desc: 'Click "New Clash" to challenge a friend. Enter their @username and set a shared savings goal. They\'ll get a notification to accept.',
    arrow: 'down',
    tooltipSide: 'bottom',
  },
  {
    id: 'friends-nav',
    route: '/Friends',
    target: 'nav-friends',
    title: '👥 Add Friends',
    desc: 'Search for friends by their @username and send a friend request. You need friends to start clashes and appear on each other\'s leaderboard.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'badges-nav',
    route: '/Badges',
    target: 'nav-badges',
    title: '🏅 Earn Badges',
    desc: 'Badges are unlocked automatically when you hit milestones — first transaction, saving $100, winning a clash, and 20+ more achievements.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'leaderboard-nav',
    route: '/Leaderboard',
    target: 'nav-leaderboard',
    title: '🏆 Leaderboard',
    desc: 'See how you rank against friends based on XP. The more you save and win clashes, the higher you climb — from Broke Beginner to Money Legend.',
    arrow: 'right',
    tooltipSide: 'right',
  },
  {
    id: 'settings-nav',
    route: '/Settings',
    target: 'nav-settings',
    title: '⚙️ Your Profile',
    desc: 'Set your @username here — it\'s how friends find you for clashes. Add a display name and customize your profile so you stand out on the leaderboard.',
    arrow: 'right',
    tooltipSide: 'right',
    tooltipAnchor: 'top',
  },
  {
    id: 'inbox-nav',
    route: '/Inbox',
    target: 'nav-inbox',
    title: '🔔 Inbox',
    desc: 'All clash invites, friend requests, and notifications land here. Accept clash invites from this page to jump into a battle!',
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