import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { auth, entities, profilesApi, notificationsApi, friendsApi, supabase } from '@/api/supabaseClient';
import { XP_ACTIONS, getLevelFromXP } from '@/components/game/GameUtils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Swords, Plus, Trophy, Clock, CheckCircle, Target, AtSign, Info, Users, Zap, ChevronDown, ChevronUp, CheckCircle2, Circle, Flame, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

/* ── Design tokens ── */
const T = {
  dark:        '#0C0C0E',
  surface:     '#111114',
  surfaceAlt:  '#16161A',
  surfaceHigh: '#1C1C22',
  gold:        '#B8973A',
  goldLight:   '#D4AF5A',
  goldDim:     'rgba(184,151,58,0.12)',
  goldBorder:  'rgba(184,151,58,0.28)',
  border:      'rgba(255,255,255,0.07)',
  text:        '#F0EDE6',
  textMuted:   'rgba(240,237,230,0.45)',
  textDim:     'rgba(240,237,230,0.25)',
  danger:      '#C0392B',
  dangerDim:   'rgba(192,57,43,0.12)',
  success:     '#7EB88A',
  successDim:  'rgba(126,184,138,0.12)',
};

const cardStyle = {
  background: T.surfaceAlt,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  color: T.text,
};

const mutedBg = { background: T.surfaceHigh, borderRadius: 10 };

// ── CHALLENGE POOL ─────────────────────────────────────────────────────
const CHALLENGE_POOL = {
  financial: [
    { id: 'f1', text: 'Commit to at least one "No-Spend" day where you only use what you already have at home.' },
    { id: 'f2', text: 'Meal prep for 3 days to reduce spending and save time.' },
    { id: 'f3', text: 'Set up a weekly automatic transfer (even $5) into your savings account. (If already done, set another $5 transfer.)' },
    { id: 'f4', text: 'Study one of these High-Yield Savings Accounts (HYSAs) https://www.bestmoney.com/online-banking/compare-savings-accounts?utm_source=google&kw=hysa&sk=hysa&c=754435351814&t=search&p=&m=e&dev=c&network=g&campaignid=22602285091&devmod=&mobval=0&groupid=183812048567&targetid=kwd-498508174472&interest=&physical=1026339&feedid=&eid=&a=11000&topic=Google_Savings_Desktop&ctype=&camtype=ps&ts=HYSA&niche=&exp=&pq=&dyn=&gad_source=1&gad_campaignid=22602285091&gbraid=0AAAAACvAeKTFuegNdIuobh7k0HQOM8C7I&gclid=EAIaIQobChMIzujvk_SalAMVuVJ_AB3vlQXuEAAYASAAEgJbOfD_BwE' },
  ],
  savings: [
    { id: 's1', text: 'Finish a chapter, and complete a quiz within the learning tab.' },
    { id: 's2', text: 'Make it a goal to consistently deepen your understanding of long-term investing tools, like a Roth IRA. https://www.irs.gov/retirement-plans/roth-iras' },
    { id: 's3', text: 'Keep your finances in check by adjusting alerts, and set a low balance notification.' },
    { id: 's4', text: 'Only spend cash for a day, and review your spending habits.' },
  ],
  spending: [
    { id: 'c1', text: 'Learn new investing strategies or concepts (tax-loss harvesting). https://investor.vanguard.com/investor-resources-education/taxes/offset-gains-loss-harvesting' },
    { id: 'c2', text: 'While shopping, compare unit prices to make more cost-effective decisions.' },
    { id: 'c3', text: 'Apply the weekly lesson on the dashboard to your daily life.' },
    { id: 'c4', text: 'Review and refine your "Financial Independence" number as your expenses or goals change.' },
  ],
  social: [
    { id: 'so1', text: 'Stay aware of your money\'s value by checking and reflecting on inflation trends at least 3 times this week in the stock tab.' },
    { id: 'so2', text: 'Use and research the Rule of 72 weekly to better understand growth opportunities.' },
    { id: 'so3', text: 'Take 30 minutes to reflect on and address your financial anxieties, writing them down and tracking progress.' },
    { id: 'so4', text: 'Compare investment strategies (index funds vs. active management).' },
  ],
  growth: [
    { id: 'g1', text: 'Expand your skills by learning and trying one new low-cost recipe this week.' },
    { id: 'g2', text: 'Review and update your beneficiaries to ensure everything stays accurate.' },
    { id: 'g3', text: 'Build motivation by adding to your "Success Folder" each week, tracking wins like saving milestones or income growth.' },
  ],
};

const CATEGORY_LABELS = {
  financial: { label: 'Financial Discipline', icon: 'F' },
  savings:   { label: 'Savings Milestones',   icon: 'S' },
  spending:  { label: 'Spending Reduction',    icon: 'R' },
  social:    { label: 'Social & Competitive',  icon: 'C' },
  growth:    { label: 'Growth & Education',    icon: 'G' },
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

// ── HOW IT WORKS ──────────────────────────────────────────────────────
function HowItWorks({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          style={{
            background: T.surfaceAlt,
            border: `1px solid ${T.goldBorder}`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600, fontSize: 17,
              color: T.text,
              display: 'flex', alignItems: 'center', gap: 8, margin: 0,
            }}>
              <Swords style={{ width: 15, height: 15, color: T.gold }} /> How Clashes Work
            </h3>
            <button onClick={onClose} style={{ color: T.textMuted, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}>
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[
              { title: 'Savings Battle',  desc: 'Log income & expenses all week. Whoever saves more money wins.' },
              { title: 'Challenge Rush',  desc: '10 random tasks are assigned. Finish all 10 first — or the most by the deadline.' },
              { title: 'Mark Tasks Done', desc: 'In Challenge Rush, tap each task when you complete it. Self-reported, honour system.' },
              { title: 'Winner Takes XP', desc: 'Win a clash to earn +100 XP. Completing any clash gives +50 XP.' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '12px 14px', background: T.surfaceHigh, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{s.title}</p>
                <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{
            background: T.goldDim,
            border: `1px solid ${T.goldBorder}`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Zap style={{ width: 14, height: 14, color: T.gold, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: T.gold, fontWeight: 500, lineHeight: 1.5 }}>
              In Challenge Rush, the first player to complete all 10 tasks wins instantly — no need to wait for the deadline.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── SAVINGS PROGRESS BAR ──────────────────────────────────────────────
function ClashProgressBar({ mySavings, opponentSavings, goal, myUsername, opponentUsername }) {
  const total = (mySavings || 0) + (opponentSavings || 0);
  const myPct = total > 0 ? Math.round(((mySavings || 0) / total) * 100) : 50;
  const oppPct = 100 - myPct;
  const goalPct = goal ? Math.min(100, Math.round(((mySavings || 0) / goal) * 100)) : null;
  const winning = (mySavings || 0) > (opponentSavings || 0);
  const tied    = (mySavings || 0) === (opponentSavings || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', height: 6, borderRadius: 99, overflow: 'hidden', background: T.surfaceHigh, display: 'flex' }}>
        <motion.div
          initial={{ width: '50%' }}
          animate={{ width: `${myPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight})`, borderRadius: '99px 0 0 99px' }}
        />
        <motion.div
          initial={{ width: '50%' }}
          animate={{ width: `${oppPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '0 99px 99px 0' }}
        />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: T.surfaceAlt, transform: 'translateX(-50%)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ fontWeight: 700, color: winning && !tied ? T.gold : T.textMuted }}>
          {winning && !tied ? '+ ' : ''}You ${(mySavings || 0).toFixed(0)}
        </span>
        <span style={{ fontWeight: 700, color: !winning && !tied ? T.text : T.textMuted }}>
          @{opponentUsername} ${(opponentSavings || 0).toFixed(0)}{!winning && !tied ? ' +' : ''}
        </span>
      </div>
      {goal && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target style={{ width: 10, height: 10 }} /> Your goal progress
            </span>
            <span>{goalPct}% of ${goal}</span>
          </div>
          <div style={{ height: 3, background: T.surfaceHigh, borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: T.gold, borderRadius: 99 }}
            />
          </div>
        </div>
      )}
      <p style={{ fontSize: 10, textAlign: 'center', color: T.textMuted }}>
        {tied ? "Tied — log a transaction to pull ahead." : winning ? `Leading by $${((mySavings || 0) - (opponentSavings || 0)).toFixed(0)}` : `$${((opponentSavings || 0) - (mySavings || 0)).toFixed(0)} behind — catch up!`}
      </p>
    </div>
  );
}

// ── RUSH TASK LIST ─────────────────────────────────────────────────────
function RushTaskList({ tasks, myId, challengeId, isActive, onTaskToggle }) {
  const myCompleted = tasks.filter(t => (t.completed_by || []).includes(myId)).length;
  const total = tasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Your progress</span>
        <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>{myCompleted}/{total} done</span>
      </div>
      <div style={{ height: 3, background: T.surfaceHigh, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(myCompleted / total) * 100}%` }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight})`, borderRadius: 99 }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {tasks.map((task, i) => {
          const iDoneIt  = (task.completed_by || []).includes(myId);
          const catInfo  = CATEGORY_LABELS[task.category] || { label: task.category, icon: '·' };
          const urlMatch = task.text.match(/https?:\/\/[^\s]+/);
          const cleanText = task.text.replace(/https?:\/\/[^\s]+/, '').trim();

          return (
            <div key={task.id || i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              background: iDoneIt ? T.goldDim : T.surfaceHigh,
              border: `1px solid ${iDoneIt ? T.goldBorder : T.border}`,
              transition: 'all 0.15s',
            }}>
              <button
                disabled={!isActive}
                onClick={() => onTaskToggle(task, i)}
                style={{
                  flexShrink: 0, marginTop: 1, background: 'none', border: 'none',
                  cursor: isActive ? 'pointer' : 'default',
                  opacity: isActive ? 1 : 0.5, padding: 0,
                  color: iDoneIt ? T.gold : T.textMuted,
                }}
              >
                {iDoneIt
                  ? <CheckCircle2 style={{ width: 15, height: 15 }} />
                  : <Circle style={{ width: 15, height: 15 }} />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 11, lineHeight: 1.55, margin: 0,
                  color: iDoneIt ? T.textMuted : T.text,
                  textDecoration: iDoneIt ? 'line-through' : 'none',
                }}>{cleanText}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: T.textDim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {catInfo.label}
                  </span>
                  {urlMatch && (
                    <button
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: T.gold, padding: '2px 4px', borderRadius: 4,
                        display: 'flex', alignItems: 'center',
                      }}
                      onClick={e => { e.stopPropagation(); window.open(urlMatch[0], '_blank'); }}
                    >
                      <BookOpen style={{ width: 12, height: 12 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AVATAR MAP ─────────────────────────────────────────────────────────
const AVATAR_PRESETS = {
  avatar1:'🦁', avatar2:'🐯', avatar3:'🦊', avatar4:'🐺', avatar5:'🦅',
  avatar6:'🐉', avatar7:'🦄', avatar8:'🐻', avatar9:'🦈', avatar10:'🍆',
  avatar11:'🐸', avatar12:'🦉',
};

// ── MAIN PAGE ──────────────────────────────────────────────────────────
export default function Challenges() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [gameMode, setGameMode] = useState('savings');
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
  const active    = myChallenges.filter(c => c.status === 'active');
  const pending   = myChallenges.filter(c => c.status === 'pending');
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
      const weekEnd   = new Date(weekStart);
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
        week_end:   format(weekEnd,   'yyyy-MM-dd'),
        challenger_savings: 0,
        opponent_savings: 0,
        status: 'pending',
      });

      await notificationsApi.send({
        recipient_id: opponent.created_by,
        sender_id: user.id,
        sender_username: myProfile?.username || 'Someone',
        type: 'clash_invite',
        title: 'Clash Invite',
        body: `@${myProfile?.username || 'Someone'} challenged you to "${form.title}" (${gameMode === 'rush' ? 'Challenge Rush' : 'Savings Battle'})!`,
        read: false,
      });

      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setDialogOpen(false);
      setForm({ title: '', opponent_username: '', savings_goal: '' });
      setGameMode('savings');
      toast.success(`Clash sent to @${opponent.username}!`);
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
      title: 'Clash Accepted',
      body: `@${myProfile?.username} accepted your clash "${challenge.title}"!`,
      read: false,
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    toast.success('Challenge accepted! Game on!');
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

    const myDoneCount = tasks.filter(tk => (tk.completed_by || []).includes(user.id)).length;
    const isWinner = myDoneCount === tasks.length;

    const updateObj = { rush_tasks: tasks };
    if (isWinner) {
      updateObj.status       = 'completed';
      updateObj.winner_email = user.email;
    }

    await entities.Challenge.update(challenge.id, updateObj);

    if (isWinner) {
      try {
        const profile = await profilesApi.getByUserId(user.id);
        if (profile) {
          const newXP    = (profile.xp || 0) + XP_ACTIONS.WIN_RUSH;
          const newLevel = getLevelFromXP(newXP);
          const badges   = [...(profile.badges || [])];
          if (!badges.includes('godly'))        badges.push('godly');
          if (!badges.includes('clash_winner')) badges.push('clash_winner');
          await entities.UserProfile.update(profile.id, {
            xp: newXP, level: newLevel,
            battles_won: (profile.battles_won || 0) + 1,
            badges,
          });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      } catch (e) { console.error('XP award failed', e); }
    }

    queryClient.invalidateQueries({ queryKey: ['challenges'] });

    if (isWinner) {
      toast.success('All 10 tasks complete — +100 XP awarded!');
    } else if (!alreadyDone) {
      toast.success(`Task marked complete! ${myDoneCount}/${tasks.length} done`);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending:   { background: 'rgba(180,140,40,0.12)', color: T.gold,    border: `1px solid rgba(184,151,58,0.28)` },
      active:    { background: T.goldDim,               color: T.gold,    border: `1px solid ${T.goldBorder}` },
      completed: { background: T.successDim,            color: T.success, border: `1px solid rgba(126,184,138,0.28)` },
    };
    const s = styles[status] || {};
    return (
      <span style={{
        ...s, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99,
      }}>{status}</span>
    );
  };

  const getDaysLeft = (weekEnd) => {
    if (!weekEnd) return null;
    const days = differenceInDays(new Date(weekEnd), new Date());
    if (days < 0) return 'Ended';
    if (days === 0) return 'Last day';
    return `${days}d left`;
  };

  const ClashCard = ({ challenge, i }) => {
    const isChallenger = challenge.challenger_id === user?.id;
    const opponentUsername = isChallenger ? challenge.opponent_username : challenge.challenger_username;
    const mySavings        = isChallenger ? challenge.challenger_savings : challenge.opponent_savings;
    const opponentSavings  = isChallenger ? challenge.opponent_savings  : challenge.challenger_savings;
    const myUsername       = isChallenger ? challenge.challenger_username : challenge.opponent_username;
    const isPendingForMe   = challenge.status === 'pending' && !isChallenger;
    const daysLeft         = getDaysLeft(challenge.week_end);
    const isRush           = challenge.game_mode === 'rush';
    const tasks            = challenge.rush_tasks || [];
    const myDone           = tasks.filter(t => (t.completed_by || []).includes(user?.id)).length;
    const oppDone          = tasks.filter(t => {
      const oppId = isChallenger ? challenge.opponent_id : challenge.challenger_id;
      return (t.completed_by || []).includes(oppId);
    }).length;

    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
      >
        <div style={{
          ...cardStyle,
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.goldBorder}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          {/* Card Header */}
          <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 17, color: T.text, margin: 0, lineHeight: 1.2 }}>
                  {challenge.title}
                </h3>
                <div style={{ marginTop: 6 }}>
                  {isRush
                    ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flame style={{ width: 10, height: 10 }} /> Challenge Rush
                      </span>
                    : <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Swords style={{ width: 10, height: 10 }} /> Savings Battle
                      </span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {daysLeft && challenge.status === 'active' && (
                  <span style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock style={{ width: 10, height: 10 }} /> {daysLeft}
                  </span>
                )}
                {getStatusBadge(challenge.status)}
              </div>
            </div>
            <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
              vs{' '}
              <span style={{ fontWeight: 600, color: T.text }}>@{opponentUsername}</span>
              {challenge.week_start && ` · ${format(new Date(challenge.week_start), 'MMM d')} – ${format(new Date(challenge.week_end), 'MMM d')}`}
            </p>
          </div>

          {/* Card Body */}
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isRush && challenge.status === 'active' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    flex: 1, padding: '8px 10px', textAlign: 'center', borderRadius: 10,
                    background: myDone >= oppDone ? T.goldDim : T.surfaceHigh,
                    border: `1px solid ${myDone >= oppDone ? T.goldBorder : T.border}`,
                  }}>
                    <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>You</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: myDone >= oppDone ? T.gold : T.text, margin: 0 }}>{myDone}/10</p>
                  </div>
                  <Flame style={{ width: 14, height: 14, color: T.gold, flexShrink: 0 }} />
                  <div style={{
                    flex: 1, padding: '8px 10px', textAlign: 'center', borderRadius: 10,
                    background: T.surfaceHigh, border: `1px solid ${T.border}`,
                  }}>
                    <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>@{opponentUsername}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: T.text, margin: 0 }}>{oppDone}/10</p>
                  </div>
                </div>
                <RushTaskList
                  tasks={tasks} myId={user?.id} challengeId={challenge.id}
                  isActive={challenge.status === 'active'}
                  onTaskToggle={(task, idx) => handleTaskToggle(challenge, task, idx)}
                />
              </>
            )}

            {isRush && challenge.status === 'pending' && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: T.textMuted }}>
                <Flame style={{ width: 28, height: 28, margin: '0 auto 8px', opacity: 0.2 }} />
                <p style={{ fontSize: 11 }}>10 random tasks will appear once the challenge is accepted.</p>
              </div>
            )}

            {isRush && challenge.status === 'completed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  flex: 1, padding: '10px', textAlign: 'center', borderRadius: 10,
                  background: myDone >= oppDone ? T.goldDim : T.surfaceHigh,
                  border: `1px solid ${myDone >= oppDone ? T.goldBorder : T.border}`,
                }}>
                  <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>You {myDone >= oppDone ? '— Winner' : ''}</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: myDone >= oppDone ? T.gold : T.text, margin: 0 }}>{myDone}/10</p>
                </div>
                <Trophy style={{ width: 14, height: 14, color: T.gold, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '10px', textAlign: 'center', borderRadius: 10, background: T.surfaceHigh, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>@{opponentUsername} {oppDone > myDone ? '— Winner' : ''}</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: T.text, margin: 0 }}>{oppDone}/10</p>
                </div>
              </div>
            )}

            {!isRush && challenge.status === 'active' && (
              <ClashProgressBar mySavings={mySavings} opponentSavings={opponentSavings} goal={challenge.savings_goal} myUsername={myUsername} opponentUsername={opponentUsername} />
            )}

            {!isRush && challenge.status === 'pending' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, ...mutedBg, padding: '10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 10, color: T.textMuted, margin: '0 0 4px' }}>You</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: T.gold, margin: 0 }}>${(mySavings || 0).toFixed(2)}</p>
                </div>
                <Swords style={{ width: 14, height: 14, color: T.textMuted, flexShrink: 0 }} />
                <div style={{ flex: 1, ...mutedBg, padding: '10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 10, color: T.textMuted, margin: '0 0 4px' }}>@{opponentUsername}</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: T.text, margin: 0 }}>${(opponentSavings || 0).toFixed(2)}</p>
                </div>
              </div>
            )}

            {!isRush && challenge.status === 'completed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  flex: 1, padding: '10px', textAlign: 'center', borderRadius: 10,
                  background: (mySavings || 0) >= (opponentSavings || 0) ? T.goldDim : T.surfaceHigh,
                  border: `1px solid ${(mySavings || 0) >= (opponentSavings || 0) ? T.goldBorder : T.border}`,
                }}>
                  <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    You {(mySavings || 0) >= (opponentSavings || 0) ? '— Winner' : ''}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: (mySavings || 0) >= (opponentSavings || 0) ? T.gold : T.text, margin: 0 }}>
                    ${(mySavings || 0).toFixed(2)}
                  </p>
                </div>
                <Trophy style={{ width: 14, height: 14, color: T.gold, flexShrink: 0 }} />
                <div style={{ flex: 1, ...mutedBg, padding: '10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    @{opponentUsername} {(opponentSavings || 0) > (mySavings || 0) ? '— Winner' : ''}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: T.text, margin: 0 }}>
                    ${(opponentSavings || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {!isRush && challenge.savings_goal && challenge.status !== 'active' && (
              <p style={{ fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 5, margin: 0 }}>
                <Target style={{ width: 11, height: 11 }} /> Goal: ${challenge.savings_goal}
              </p>
            )}

            {isPendingForMe && (
              <button
                onClick={() => handleAccept(challenge)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                  border: 'none', color: '#0C0C0E',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                  cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <CheckCircle style={{ width: 14, height: 14 }} /> Accept Challenge
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const SectionLabel = ({ icon: Icon, label, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Icon style={{ width: 13, height: 13, color: color || T.textMuted }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted }}>
        {label}
      </span>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: T.dark,
      color: T.text,
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      padding: '24px 24px 80px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@600;700&display=swap');

        .cc-clash-dialog [class*="DialogContent"],
        .cc-clash-dialog [data-radix-popper-content-wrapper] > * {
          background: #16161A !important;
          border: 1px solid rgba(184,151,58,0.22) !important;
          color: #F0EDE6 !important;
          border-radius: 16px !important;
        }
        .cc-clash-dialog label { color: rgba(240,237,230,0.55) !important; font-size: 11px !important; letter-spacing: 0.06em; text-transform: uppercase; }
        .cc-clash-dialog input, .cc-clash-dialog select {
          background: #111114 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #F0EDE6 !important;
          border-radius: 8px !important;
        }
        .cc-clash-dialog input::placeholder { color: rgba(240,237,230,0.25) !important; }
        .cc-clash-dialog [class*="DialogTitle"] { color: #F0EDE6 !important; }
        .cc-clash-dialog [class*="DialogClose"] { color: rgba(240,237,230,0.4) !important; }
        .cc-clash-dialog [class*="bg-muted"] { background: #1C1C22 !important; }
        .cc-clash-dialog [class*="border-border"] { border-color: rgba(255,255,255,0.08) !important; }
        .cc-clash-dialog [class*="divide-y"] > * { border-color: rgba(255,255,255,0.06) !important; }
        .cc-clash-dialog [class*="text-muted-foreground"] { color: rgba(240,237,230,0.4) !important; }
      `}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600, fontSize: 32,
              color: T.text, margin: 0,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Swords style={{ width: 22, height: 22, color: T.gold }} /> 1v1 Clash
            </h1>
            <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
              Challenge friends to savings battles or challenge rushes
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }} className="cc-clash-dialog">
            <button
              onClick={() => setHowOpen(!howOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 9,
                background: 'transparent',
                border: `1px solid ${T.border}`,
                color: T.textMuted, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldBorder; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
            >
              <Info style={{ width: 13, height: 13 }} /> How it works
            </button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 9,
                  background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                  border: 'none', color: '#0C0C0E',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                  cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Plus style={{ width: 13, height: 13 }} /> New Clash
                </button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ background: T.surfaceAlt }}>
                <DialogHeader>
                  <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.text }}>
                    <Swords style={{ width: 16, height: 16, color: T.gold }} /> New 1v1 Clash
                  </DialogTitle>
                </DialogHeader>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                  {/* Game Mode */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 8 }}>Game Mode</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { mode: 'savings', Icon: Swords,  title: 'Savings Battle',  desc: 'Whoever saves more money by the deadline wins.' },
                        { mode: 'rush',    Icon: Flame,   title: 'Challenge Rush',   desc: '10 random tasks assigned. Finish them all first.' },
                      ].map(({ mode, Icon, title, desc }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setGameMode(mode)}
                          style={{
                            padding: '12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                            background: gameMode === mode ? T.goldDim : T.surfaceHigh,
                            border: `1.5px solid ${gameMode === mode ? T.goldBorder : T.border}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                            <Icon style={{ width: 13, height: 13, color: T.gold }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{title}</span>
                          </div>
                          <p style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5, margin: 0 }}>{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>Challenge Title</label>
                    <Input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder={gameMode === 'rush' ? 'Who finishes first?' : 'Who saves more this week?'}
                      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8 }}
                    />
                  </div>

                  {/* Opponent */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>
                      Opponent Username
                    </label>
                    {friendProfiles.length > 0 && (
                      <div>
                        <button type="button" onClick={() => setShowFriendPicker(!showFriendPicker)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.gold, fontWeight: 600, marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Users style={{ width: 12, height: 12 }} />
                          {showFriendPicker ? 'Hide friends' : 'Pick from friends'}
                          {showFriendPicker ? <ChevronUp style={{ width: 11, height: 11 }} /> : <ChevronDown style={{ width: 11, height: 11 }} />}
                        </button>
                        {showFriendPicker && (
                          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', maxHeight: 160, overflowY: 'auto', marginBottom: 8 }}>
                            {friendProfiles.map(fp => (
                              <button key={fp.id} type="button"
                                onClick={() => { setForm({ ...form, opponent_username: fp.username }); setShowFriendPicker(false); }}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 12px', background: 'none', border: 'none',
                                  borderBottom: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left',
                                  transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHigh}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(184,151,58,0.35)', background: 'rgba(184,151,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  {fp.custom_avatar_url
    ? <img src={fp.custom_avatar_url} alt={fp.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : <span style={{ fontSize: 14, fontWeight: 700, color: '#B8973A' }}>{(fp.display_name || fp.username || '?')[0].toUpperCase()}</span>
  }
</div>
                                <div>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>{fp.display_name}</p>
                                  <p style={{ fontSize: 10, color: T.textMuted, margin: 0 }}>@{fp.username}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 13 }}>@</span>
                      <Input
                        value={form.opponent_username}
                        onChange={e => setForm({ ...form, opponent_username: e.target.value.replace('@', '') })}
                        placeholder="their_username"
                        style={{ paddingLeft: 28, background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8 }}
                      />
                    </div>
                  </div>

                  {gameMode === 'savings' && (
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>Savings Goal ($)</label>
                      <Input
                        type="number"
                        value={form.savings_goal}
                        onChange={e => setForm({ ...form, savings_goal: e.target.value })}
                        placeholder="100"
                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8 }}
                      />
                      <p style={{ fontSize: 10, color: T.textMuted, marginTop: 5 }}>How much do you each aim to save this week?</p>
                    </div>
                  )}

                  <button
                    onClick={handleCreate}
                    disabled={searching}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '11px', borderRadius: 10,
                      background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                      border: 'none', color: '#0C0C0E',
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                      cursor: searching ? 'not-allowed' : 'pointer',
                      opacity: searching ? 0.7 : 1,
                    }}
                  >
                    {searching
                      ? <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0C0C0E', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      : <Swords style={{ width: 14, height: 14 }} />}
                    Send Clash Invite
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />

        {/* ── STATS ROW ── */}
        {myChallenges.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Active',    count: active.length,    icon: Swords, color: T.gold },
              { label: 'Pending',   count: pending.length,   icon: Clock,  color: T.textMuted },
              { label: 'Completed', count: completed.length, icon: Trophy, color: T.success },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                <Icon style={{ width: 16, height: 16, margin: '0 auto 8px', color }} />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 28, color: T.text, margin: 0, lineHeight: 1 }}>{count}</p>
                <p style={{ fontSize: 9, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {pending.length > 0 && (
            <div>
              <SectionLabel icon={Clock} label="Pending Invites" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {pending.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
              </div>
            </div>
          )}

          {active.length > 0 && (
            <div>
              <SectionLabel icon={Swords} label="Active Clashes" color={T.gold} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {active.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <SectionLabel icon={Trophy} label="Completed" color={T.success} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {completed.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
              </div>
            </div>
          )}

          {myChallenges.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMuted }}>
              <Swords style={{ width: 40, height: 40, margin: '0 auto 16px', opacity: 0.15 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>No clashes yet</p>
              <p style={{ fontSize: 12, marginBottom: 20 }}>Pick Savings Battle or Challenge Rush to start a fight.</p>
              <button
                onClick={() => setHowOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 9,
                  background: T.goldDim, border: `1px solid ${T.goldBorder}`,
                  color: T.gold, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Info style={{ width: 12, height: 12 }} /> See how it works
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}