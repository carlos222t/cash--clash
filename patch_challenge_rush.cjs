const fs = require('fs');

// ─────────────────────────────────────────────────────────────────────
// PATCH 1 — src/pages/Challenges.jsx
// Adds "Challenge Rush" game mode alongside the existing Savings Battle
// ─────────────────────────────────────────────────────────────────────

const challenges = `import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { auth, entities, profilesApi, notificationsApi, friendsApi, supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Swords, Plus, Trophy, Clock, CheckCircle, Target, AtSign, Info, Users, Zap, ChevronDown, ChevronUp, CheckCircle2, Circle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

// ── CHALLENGE POOL (50 tasks, 2 picked per category = 10 total) ─────
const CHALLENGE_POOL = {
  financial: [
    { id: 'f1',  text: 'Log every transaction for 7 days straight without missing a day.' },
    { id: 'f2',  text: 'Categorize all expenses into at least 5 different categories this week.' },
    { id: 'f3',  text: 'Add a detailed note to every expense logged this week.' },
    { id: 'f4',  text: 'Log three different sources of income this week.' },
    { id: 'f5',  text: 'Log your previous month\\'s total spending as a "Reference" transaction.' },
    { id: 'f6',  text: 'Check the app and view your Dashboard every morning for 7 days.' },
    { id: 'f7',  text: 'Log a transaction within 1 hour of a purchase taking place.' },
    { id: 'f8',  text: 'Update your budget allocation percentages to total exactly 100%.' },
    { id: 'f9',  text: 'Identify and log one "Subscription" expense you forgot you had.' },
    { id: 'f10', text: 'Log a "Need" expense and a "Want" expense on the same day.' },
  ],
  savings: [
    { id: 's1',  text: 'Save a total of $10 by the end of the week.' },
    { id: 's2',  text: 'Save a total of $25 by the end of the week.' },
    { id: 's3',  text: 'Save a total of $50 by the end of the week.' },
    { id: 's4',  text: 'Put aside 10% of your weekly income into your savings goal.' },
    { id: 's5',  text: 'Put aside 20% of your weekly income into your savings goal.' },
    { id: 's6',  text: 'Have a day where you log at least $5 in savings income.' },
    { id: 's7',  text: 'Log a savings deposit two days in a row.' },
    { id: 's8',  text: 'Reach 50% of your current Savings Goal milestone.' },
    { id: 's9',  text: 'Transfer $5 into savings immediately after logging a "Want" purchase.' },
    { id: 's10', text: 'Increase your total lifetime saved amount by at least 5% this week.' },
  ],
  spending: [
    { id: 'c1',  text: 'Spend $0 on Entertainment for the entire week.' },
    { id: 'c2',  text: 'Spend $0 on Fast Food or Dining Out for the entire week.' },
    { id: 'c3',  text: 'Reduce your Transport costs by 10% compared to your last week.' },
    { id: 'c4',  text: 'Log a Groceries expense instead of Dining Out to show you meal-prepped.' },
    { id: 'c5',  text: 'Find a student discount and log the saved amount as income.' },
    { id: 'c6',  text: 'Limit Misc/Other spending to under $15 for the week.' },
    { id: 'c7',  text: 'Go 3 days without logging any Entertainment expense.' },
    { id: 'c8',  text: 'Cancel or pause one unused subscription and log the saved amount.' },
    { id: 'c9',  text: 'Buy a generic brand item instead of name brand and log the difference.' },
    { id: 'c10', text: 'Walk or bike instead of paying for transport and log $0 for that trip.' },
  ],
  social: [
    { id: 'so1',  text: 'Send a friend request to a new user.' },
    { id: 'so2',  text: 'Visit 3 different friends\\' profiles from the Leaderboard.' },
    { id: 'so3',  text: 'Send a Clash Invite to a player ranked higher than you.' },
    { id: 'so4',  text: 'React to a friend who just leveled up by visiting their profile.' },
    { id: 'so5',  text: 'View the global Leaderboard and identify the person 1 rank above you.' },
    { id: 'so6',  text: 'Accept a pending friend request within 24 hours.' },
    { id: 'so7',  text: 'Check your XP progress on the Dashboard and note your rank title.' },
    { id: 'so8',  text: 'Compare your Savings Rate with your opponent\\'s rate mid-week.' },
    { id: 'so9',  text: 'Invite a classmate who isn\\'t on the app yet to join.' },
    { id: 'so10', text: 'Check your Inbox and clear all unread notifications.' },
  ],
  growth: [
    { id: 'g1',  text: 'Read the Daily Financial Tip on the Dashboard for 5 days.' },
    { id: 'g2',  text: 'Update your Profile Bio to include your current financial goal.' },
    { id: 'g3',  text: 'Change your Avatar once you level up this week.' },
    { id: 'g4',  text: 'Earn at least 1 new Badge this week.' },
    { id: 'g5',  text: 'Gain enough XP to move up exactly one Level.' },
    { id: 'g6',  text: 'Submit a Budget Proposal to a teacher or mentor.' },
    { id: 'g7',  text: 'Receive an "Approved" status on a pending Budget Proposal.' },
    { id: 'g8',  text: 'Log a transaction in a category you haven\\'t used in over a month.' },
    { id: 'g9',  text: 'Reach a 7-day login streak.' },
    { id: 'g10', text: 'Earn a total of 250 XP from any combination of activities this week.' },
  ],
};

const CATEGORY_LABELS = {
  financial: { label: 'Financial Discipline', emoji: '📊' },
  savings:   { label: 'Savings Milestones',   emoji: '💰' },
  spending:  { label: 'Spending Reduction',    emoji: '✂️' },
  social:    { label: 'Social & Competitive',  emoji: '👥' },
  growth:    { label: 'Growth & Education',    emoji: '📈' },
};

function pickTwoFrom(arr) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

function generateRushTasks() {
  return Object.entries(CHALLENGE_POOL).flatMap(([cat, tasks]) =>
    pickTwoFrom(tasks).map(t => ({ ...t, category: cat, completed_by: [] }))
  );
}

// ── HOW IT WORKS ────────────────────────────────────────────────────
function HowItWorks({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="bg-sidebar border border-sidebar-border rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sidebar-foreground flex items-center gap-2">
              <Swords className="w-4 h-4 text-accent" /> How Clashes Work
            </h3>
            <button onClick={onClose} className="text-sidebar-foreground/40 hover:text-sidebar-foreground text-xs">✕ Close</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '⚔️', title: 'Savings Battle', desc: 'Log income & expenses all week. Whoever saves more money wins.' },
              { icon: '🏃', title: 'Challenge Rush', desc: '10 random tasks are assigned. Finish all 10 first — or the most by the deadline.' },
              { icon: '✅', title: 'Mark Tasks Done', desc: 'In Challenge Rush, tap each task when you complete it. Self-reported, honour system.' },
              { icon: '🏆', title: 'Winner Takes XP', desc: 'Win a clash to earn +100 XP. Completing any clash gives +50 XP.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-3 p-3 bg-sidebar-accent/50 rounded-xl">
                <span className="text-2xl flex-shrink-0">{s.icon}</span>
                <div>
                  <p className="text-xs font-bold text-sidebar-foreground">{s.title}</p>
                  <p className="text-[11px] text-sidebar-foreground/60 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex gap-2">
            <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-primary font-medium">Tip: In Challenge Rush, the first player to complete all 10 tasks wins instantly — no need to wait for the deadline!</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── SAVINGS PROGRESS BAR ─────────────────────────────────────────────
function ClashProgressBar({ mySavings, opponentSavings, goal, myUsername, opponentUsername }) {
  const total = (mySavings || 0) + (opponentSavings || 0);
  const myPct = total > 0 ? Math.round(((mySavings || 0) / total) * 100) : 50;
  const oppPct = 100 - myPct;
  const goalPct = goal ? Math.min(100, Math.round(((mySavings || 0) / goal) * 100)) : null;
  const winning = (mySavings || 0) > (opponentSavings || 0);
  const tied = (mySavings || 0) === (opponentSavings || 0);

  return (
    <div className="space-y-2">
      <div className="relative h-4 rounded-full overflow-hidden bg-muted flex">
        <motion.div initial={{ width: '50%' }} animate={{ width: \`\${myPct}%\` }} transition={{ duration: 0.6, ease: 'easeOut' }} className="h-full bg-primary rounded-l-full" />
        <motion.div initial={{ width: '50%' }} animate={{ width: \`\${oppPct}%\` }} transition={{ duration: 0.6, ease: 'easeOut' }} className="h-full bg-muted-foreground/30 rounded-r-full" />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-background transform -translate-x-1/2" />
      </div>
      <div className="flex justify-between text-xs">
        <span className={\`font-bold \${winning && !tied ? 'text-primary' : 'text-muted-foreground'}\`}>{winning && !tied ? '👑 ' : ''}You \${(mySavings || 0).toFixed(0)}</span>
        <span className={\`font-bold \${!winning && !tied ? 'text-foreground' : 'text-muted-foreground'}\`}>@{opponentUsername} \${(opponentSavings || 0).toFixed(0)}{!winning && !tied ? ' 👑' : ''}</span>
      </div>
      {goal && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Your goal progress</span>
            <span>{goalPct}% of \${goal}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: \`\${goalPct}%\` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-accent rounded-full" />
          </div>
        </div>
      )}
      <p className="text-[10px] text-center text-muted-foreground">
        {tied ? "🤝 It's tied! Log a transaction to pull ahead." : winning ? \`🔥 You're leading by \$\${((mySavings || 0) - (opponentSavings || 0)).toFixed(0)}!\` : \`📈 You're \$\${((opponentSavings || 0) - (mySavings || 0)).toFixed(0)} behind!\`}
      </p>
    </div>
  );
}

// ── CHALLENGE RUSH TASK LIST ─────────────────────────────────────────
function RushTaskList({ tasks, myId, challengeId, isActive, onTaskToggle }) {
  const myCompleted = tasks.filter(t => (t.completed_by || []).includes(myId)).length;
  const total = tasks.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground">Your progress</span>
        <span className="text-xs font-bold text-primary">{myCompleted}/{total} done</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: \`\${(myCompleted / total) * 100}%\` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-primary rounded-full"
        />
      </div>
      <div className="space-y-1.5">
        {tasks.map((task, i) => {
          const iDoneIt = (task.completed_by || []).includes(myId);
          const catInfo = CATEGORY_LABELS[task.category] || { emoji: '📌', label: task.category };
          return (
            <div key={task.id || i}
              className={\`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all \${iDoneIt ? 'bg-primary/5 border-primary/20' : 'bg-muted/40 border-transparent'}\`}>
              <button
                disabled={!isActive}
                onClick={() => onTaskToggle(task, i)}
                className={\`flex-shrink-0 mt-0.5 transition-colors \${isActive ? 'cursor-pointer' : 'cursor-default opacity-60'}\`}
              >
                {iDoneIt
                  ? <CheckCircle2 className="w-4 h-4 text-primary" />
                  : <Circle className="w-4 h-4 text-muted-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={\`text-xs leading-relaxed \${iDoneIt ? 'line-through text-muted-foreground' : 'text-foreground'}\`}>{task.text}</p>
                <span className="text-[10px] text-muted-foreground">{catInfo.emoji} {catInfo.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AVATAR MAP ───────────────────────────────────────────────────────
const AVATAR_PRESETS = {
  avatar1:'🦁', avatar2:'🐯', avatar3:'🦊', avatar4:'🐺', avatar5:'🦅',
  avatar6:'🐉', avatar7:'🦄', avatar8:'🐻', avatar9:'🦈', avatar10:'🍆',
  avatar11:'🐸', avatar12:'🦉',
};

// ── MAIN PAGE ────────────────────────────────────────────────────────
export default function Challenges() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [gameMode, setGameMode] = useState('savings'); // 'savings' | 'rush'
  const [form, setForm] = useState({ title: '', opponent_username: '', savings_goal: '' });
  const [searching, setSearching] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      profilesApi.getByUserId(u.id).then(setMyProfile).catch(() => {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.prefillUsername) {
      setForm(f => ({ ...f, opponent_username: location.state.prefillUsername }));
      setDialogOpen(true);
    }
  }, [location.state]);

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => entities.Challenge.list('-created_date', 50),
    enabled: !!user,
    initialData: [],
  });

  const { data: myFriends = [] } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: () => friendsApi.getMyFriends(user?.id),
    enabled: !!user?.id,
  });

  const { data: friendProfiles = [] } = useQuery({
    queryKey: ['friend-profiles-challenge', myFriends.map(f => f.id)],
    queryFn: async () => {
      if (!myFriends.length) return [];
      const otherIds = myFriends.map(f => f.requester_id === user.id ? f.recipient_id : f.requester_id);
      const { data } = await supabase.from('user_profiles').select('*').in('created_by', otherIds);
      return data || [];
    },
    enabled: myFriends.length > 0,
  });

  const myChallenges = challenges.filter(c => c.challenger_id === user?.id || c.opponent_id === user?.id);
  const active  = myChallenges.filter(c => c.status === 'active');
  const pending = myChallenges.filter(c => c.status === 'pending');
  const completed = myChallenges.filter(c => c.status === 'completed');

  const handleCreate = async () => {
    if (!form.title || !form.opponent_username) { toast.error('Please fill in all fields'); return; }
    if (gameMode === 'savings' && !form.savings_goal) { toast.error('Please set a savings goal'); return; }
    setSearching(true);
    try {
      const opponent = await profilesApi.getByUsername(form.opponent_username.toLowerCase().replace('@', ''));
      if (!opponent) { toast.error('Username not found.'); return; }
      if (opponent.created_by === user.id) { toast.error("You can't challenge yourself!"); return; }

      const weekStart = new Date();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const rushTasks = gameMode === 'rush' ? generateRushTasks() : null;

      await entities.Challenge.create({
        title: form.title,
        savings_goal: gameMode === 'savings' ? parseFloat(form.savings_goal) : null,
        game_mode: gameMode,
        rush_tasks: rushTasks,
        challenger_id: user.id,
        challenger_username: myProfile?.username || '',
        challenger_email: user.email,
        challenger_name: myProfile?.display_name || user.email,
        opponent_id: opponent.created_by,
        opponent_username: opponent.username,
        opponent_email: opponent.email || '',
        opponent_name: opponent.display_name,
        week_start: format(weekStart, 'yyyy-MM-dd'),
        week_end: format(weekEnd, 'yyyy-MM-dd'),
        challenger_savings: 0,
        opponent_savings: 0,
        status: 'pending',
      });

      await notificationsApi.send({
        recipient_id: opponent.created_by,
        sender_id: user.id,
        sender_username: myProfile?.username || 'Someone',
        type: 'clash_invite',
        title: '⚔️ Clash Invite!',
        body: \`@\${myProfile?.username || 'Someone'} challenged you to "\${form.title}" (\${gameMode === 'rush' ? 'Challenge Rush' : 'Savings Battle'})!\`,
        read: false,
      });

      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setDialogOpen(false);
      setForm({ title: '', opponent_username: '', savings_goal: '' });
      setGameMode('savings');
      toast.success(\`Clash sent to @\${opponent.username}!\`);
    } catch (err) {
      toast.error(err.message || 'Failed to create challenge');
    } finally {
      setSearching(false);
    }
  };

  const handleAccept = async (challenge) => {
    await entities.Challenge.update(challenge.id, { status: 'active' });
    await notificationsApi.send({
      recipient_id: challenge.challenger_id,
      sender_id: user.id,
      sender_username: myProfile?.username,
      type: 'clash_invite',
      title: '⚔️ Clash Accepted!',
      body: \`@\${myProfile?.username} accepted your clash "\${challenge.title}"!\`,
      read: false,
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    toast.success('Challenge accepted! Game on! ⚔️');
  };

  const handleTaskToggle = async (challenge, task, taskIndex) => {
    const tasks = challenge.rush_tasks ? [...challenge.rush_tasks] : [];
    const t = { ...tasks[taskIndex] };
    const alreadyDone = (t.completed_by || []).includes(user.id);

    if (alreadyDone) {
      t.completed_by = t.completed_by.filter(id => id !== user.id);
    } else {
      t.completed_by = [...(t.completed_by || []), user.id];
    }
    tasks[taskIndex] = t;

    // Check if this player just completed all tasks → instant win
    const myDoneCount = tasks.filter(tk => (tk.completed_by || []).includes(user.id)).length;
    const isWinner = myDoneCount === tasks.length;

    const updateObj = { rush_tasks: tasks };
    if (isWinner) {
      updateObj.status = 'completed';
      updateObj.winner_email = user.email;
    }

    await entities.Challenge.update(challenge.id, updateObj);
    queryClient.invalidateQueries({ queryKey: ['challenges'] });

    if (isWinner) {
      toast.success('🏆 You finished all 10 tasks — you win the Rush!');
    } else if (!alreadyDone) {
      toast.success(\`Task marked complete! \${myDoneCount}/\${tasks.length} done\`);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending:   'bg-chart-3/10 text-chart-3 border-chart-3/20',
      active:    'bg-primary/10 text-primary border-primary/20',
      completed: 'bg-accent/10 text-accent border-accent/20',
    };
    return <Badge variant="outline" className={styles[status]}>{status}</Badge>;
  };

  const getDaysLeft = (weekEnd) => {
    if (!weekEnd) return null;
    const days = differenceInDays(new Date(weekEnd), new Date());
    if (days < 0) return 'Ended';
    if (days === 0) return 'Last day!';
    return \`\${days}d left\`;
  };

  const ClashCard = ({ challenge, i }) => {
    const isChallenger = challenge.challenger_id === user?.id;
    const opponentUsername = isChallenger ? challenge.opponent_username : challenge.challenger_username;
    const mySavings = isChallenger ? challenge.challenger_savings : challenge.opponent_savings;
    const opponentSavings = isChallenger ? challenge.opponent_savings : challenge.challenger_savings;
    const myUsername = isChallenger ? challenge.challenger_username : challenge.opponent_username;
    const isPendingForMe = challenge.status === 'pending' && !isChallenger;
    const daysLeft = getDaysLeft(challenge.week_end);
    const isRush = challenge.game_mode === 'rush';
    const tasks = challenge.rush_tasks || [];
    const myDone = tasks.filter(t => (t.completed_by || []).includes(user?.id)).length;
    const oppDone = tasks.filter(t => {
      const oppId = isChallenger ? challenge.opponent_id : challenge.challenger_id;
      return (t.completed_by || []).includes(oppId);
    }).length;

    return (
      <motion.div key={challenge.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
        <Card className="hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base leading-tight">{challenge.title}</CardTitle>
                <div className="flex items-center gap-1.5 mt-1">
                  {isRush
                    ? <Badge variant="secondary" className="text-[10px] gap-1"><Flame className="w-2.5 h-2.5" /> Challenge Rush</Badge>
                    : <Badge variant="secondary" className="text-[10px] gap-1"><Swords className="w-2.5 h-2.5" /> Savings Battle</Badge>
                  }
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {daysLeft && challenge.status === 'active' && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {daysLeft}
                  </span>
                )}
                {getStatusBadge(challenge.status)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              vs <span className="font-medium text-foreground">@{opponentUsername}</span>
              {challenge.week_start && \` · \${format(new Date(challenge.week_start), 'MMM d')} – \${format(new Date(challenge.week_end), 'MMM d')}\`}
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* ── RUSH MODE ── */}
            {isRush && challenge.status === 'active' && (
              <>
                {/* Score bar */}
                <div className="flex items-center gap-3 text-sm mb-1">
                  <div className={\`flex-1 rounded-lg p-2 text-center \${myDone >= oppDone ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}\`}>
                    <p className="text-[10px] text-muted-foreground">You</p>
                    <p className="font-bold text-primary">{myDone}/10</p>
                  </div>
                  <Flame className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className={\`flex-1 rounded-lg p-2 text-center \${oppDone > myDone ? 'bg-muted border border-border' : 'bg-muted'}\`}>
                    <p className="text-[10px] text-muted-foreground">@{opponentUsername}</p>
                    <p className="font-bold">{oppDone}/10</p>
                  </div>
                </div>
                <RushTaskList
                  tasks={tasks}
                  myId={user?.id}
                  challengeId={challenge.id}
                  isActive={challenge.status === 'active'}
                  onTaskToggle={(task, idx) => handleTaskToggle(challenge, task, idx)}
                />
              </>
            )}

            {/* Rush pending */}
            {isRush && challenge.status === 'pending' && (
              <div className="text-center py-3 text-muted-foreground">
                <Flame className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">10 random tasks will appear once the challenge is accepted.</p>
              </div>
            )}

            {/* Rush completed */}
            {isRush && challenge.status === 'completed' && (
              <div className="flex items-center gap-3 text-sm">
                <div className={\`flex-1 rounded-lg p-2.5 text-center \${myDone >= oppDone ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}\`}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">You {myDone >= oppDone ? '👑' : ''}</p>
                  <p className={\`font-bold font-heading \${myDone >= oppDone ? 'text-primary' : ''}\`}>{myDone}/10</p>
                </div>
                <Trophy className="w-4 h-4 text-chart-3 flex-shrink-0" />
                <div className={\`flex-1 rounded-lg p-2.5 text-center \${oppDone > myDone ? 'bg-muted border border-border' : 'bg-muted'}\`}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">@{opponentUsername} {oppDone > myDone ? '👑' : ''}</p>
                  <p className="font-bold font-heading">{oppDone}/10</p>
                </div>
              </div>
            )}

            {/* ── SAVINGS MODE ── */}
            {!isRush && challenge.status === 'active' && (
              <ClashProgressBar mySavings={mySavings} opponentSavings={opponentSavings} goal={challenge.savings_goal} myUsername={myUsername} opponentUsername={opponentUsername} />
            )}

            {!isRush && challenge.status === 'pending' && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 bg-muted rounded-lg p-2.5 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">You</p>
                  <p className="font-bold font-heading text-primary">\${(mySavings || 0).toFixed(2)}</p>
                </div>
                <Swords className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 bg-muted rounded-lg p-2.5 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">@{opponentUsername}</p>
                  <p className="font-bold font-heading">\${(opponentSavings || 0).toFixed(2)}</p>
                </div>
              </div>
            )}

            {!isRush && challenge.status === 'completed' && (
              <div className="flex items-center gap-3 text-sm">
                <div className={\`flex-1 rounded-lg p-2.5 text-center \${(mySavings || 0) >= (opponentSavings || 0) ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}\`}>
                  <p className="text-xs text-muted-foreground mb-0.5">You {(mySavings || 0) >= (opponentSavings || 0) ? '👑' : ''}</p>
                  <p className={\`font-bold font-heading \${(mySavings || 0) >= (opponentSavings || 0) ? 'text-primary' : ''}\`}>\${(mySavings || 0).toFixed(2)}</p>
                </div>
                <Trophy className="w-4 h-4 text-chart-3 flex-shrink-0" />
                <div className={\`flex-1 rounded-lg p-2.5 text-center bg-muted\`}>
                  <p className="text-xs text-muted-foreground mb-0.5">@{opponentUsername} {(opponentSavings || 0) > (mySavings || 0) ? '👑' : ''}</p>
                  <p className="font-bold font-heading">\${(opponentSavings || 0).toFixed(2)}</p>
                </div>
              </div>
            )}

            {!isRush && challenge.savings_goal && challenge.status !== 'active' && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" /> Goal: \${challenge.savings_goal}
              </p>
            )}

            {isPendingForMe && (
              <Button onClick={() => handleAccept(challenge)} size="sm" className="w-full gap-2">
                <CheckCircle className="w-4 h-4" /> Accept Challenge
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Swords className="w-6 h-6 text-accent" /> 1v1 Clash
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Challenge friends to savings battles or challenge rushes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setHowOpen(!howOpen)}>
            <Info className="w-4 h-4" /> How it works
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Clash</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Swords className="w-5 h-5 text-primary" /> New 1v1 Clash</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">

                {/* Game mode selector */}
                <div className="space-y-2">
                  <Label>Game Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGameMode('savings')}
                      className={\`p-3 rounded-xl border-2 text-left transition-all \${gameMode === 'savings' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}\`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Swords className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">Savings Battle</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Whoever saves more money by the deadline wins.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGameMode('rush')}
                      className={\`p-3 rounded-xl border-2 text-left transition-all \${gameMode === 'rush' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'}\`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-accent" />
                        <span className="text-sm font-bold">Challenge Rush</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">10 random tasks assigned. Finish them all first — or the most by the deadline.</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Challenge Title</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={gameMode === 'rush' ? 'Who finishes first?' : 'Who saves more this week?'} />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><AtSign className="w-3.5 h-3.5" /> Opponent Username</Label>
                  {friendProfiles.length > 0 && (
                    <div>
                      <button type="button" onClick={() => setShowFriendPicker(!showFriendPicker)}
                        className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2 hover:underline">
                        <Users className="w-3.5 h-3.5" />
                        {showFriendPicker ? 'Hide friends' : 'Pick from friends'}
                        {showFriendPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {showFriendPicker && (
                        <div className="border border-border rounded-xl divide-y divide-border max-h-40 overflow-y-auto mb-2">
                          {friendProfiles.map(fp => (
                            <button key={fp.id} type="button"
                              onClick={() => { setForm({ ...form, opponent_username: fp.username }); setShowFriendPicker(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left transition-colors">
                              <span className="text-lg">{AVATAR_PRESETS[fp.avatar_id] || '🦁'}</span>
                              <div>
                                <p className="text-sm font-medium">{fp.display_name}</p>
                                <p className="text-xs text-muted-foreground">@{fp.username}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input value={form.opponent_username} onChange={e => setForm({ ...form, opponent_username: e.target.value.replace('@', '') })} placeholder="their_username" className="pl-7" />
                  </div>
                </div>

                {gameMode === 'savings' && (
                  <div className="space-y-2">
                    <Label>Savings Goal ($)</Label>
                    <Input type="number" value={form.savings_goal} onChange={e => setForm({ ...form, savings_goal: e.target.value })} placeholder="100" />
                    <p className="text-xs text-muted-foreground">How much do you each aim to save this week?</p>
                  </div>
                )}

                {gameMode === 'rush' && (
                  <div className="bg-accent/5 border border-accent/20 rounded-xl p-3">
                    <p className="text-xs text-accent font-medium flex items-center gap-1.5 mb-1"><Flame className="w-3.5 h-3.5" /> Challenge Rush</p>
                    <p className="text-[11px] text-muted-foreground">10 tasks (2 from each category) will be randomly assigned when the opponent accepts. Both players see the same tasks. Mark them done as you complete them. First to finish all 10 wins instantly!</p>
                  </div>
                )}

                <Button onClick={handleCreate} className="w-full gap-2" disabled={searching}>
                  {searching ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Swords className="w-4 h-4" />}
                  Send Clash Invite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />

      {/* Stats strip */}
      {myChallenges.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active',    count: active.length,    icon: Swords, color: 'text-primary' },
            { label: 'Pending',   count: pending.length,   icon: Clock,  color: 'text-chart-3' },
            { label: 'Completed', count: completed.length, icon: Trophy, color: 'text-accent' },
          ].map(({ label, count, icon: Icon, color }) => (
            <Card key={label} className="text-center">
              <CardContent className="p-3">
                <Icon className={\`w-5 h-5 mx-auto mb-1 \${color}\`} />
                <p className="text-lg font-heading font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Invites
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" /> Active Clashes
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" /> Completed
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
          </div>
        </div>
      )}

      {myChallenges.length === 0 && (
        <div className="text-center py-16 text-muted-foreground space-y-4">
          <Swords className="w-12 h-12 mx-auto opacity-20" />
          <div>
            <p className="text-sm font-medium">No clashes yet</p>
            <p className="text-xs mt-1">Pick Savings Battle or Challenge Rush to start a fight!</p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setHowOpen(true)}>
            <Info className="w-4 h-4" /> See how it works
          </Button>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Challenges.jsx', challenges, 'utf8');
console.log('✅ Challenges.jsx written (Challenge Rush mode added)');

console.log('\n📋 IMPORTANT — run this SQL in your Supabase dashboard:');
console.log(`
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS game_mode text DEFAULT 'savings',
  ADD COLUMN IF NOT EXISTS rush_tasks jsonb;
`);

console.log('\n🎉 Done! Run: npm run dev');
