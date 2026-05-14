import React, { useState, useEffect } from 'react';
import { auth, entities, supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, LayoutGrid, RefreshCw, Calculator, PiggyBank, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, addWeeks, addDays, addMonths, parseISO } from 'date-fns';
import TransactionForm from '../components/budget/TransactionForm';
import TransactionList from '../components/budget/TransactionList';
import BudgetCalculator from '../components/budget/BudgetCalculator';
import AutoTransactions from '../components/budget/AutoTransactions';
import SavingsTracker from '../components/budget/SavingsTracker';
import PredictedIncomePanel from '../components/budget/PredictedIncomePanel';
import BudgetOnboarding from '../components/budget/BudgetOnboarding';
import { XP_ACTIONS } from '../components/game/GameUtils';

/* ─── Design tokens (mirrored from Dashboard) ────────────────────────────── */
const tokens = {
  gold:        '#B8973A',
  goldLight:   '#D4AF5A',
  goldDim:     'rgba(184,151,58,0.15)',
  goldBorder:  'rgba(184,151,58,0.25)',
  dark:        '#0C0C0E',
  surface:     '#111114',
  surfaceAlt:  '#16161A',
  border:      'rgba(255,255,255,0.07)',
  borderGold:  'rgba(184,151,58,0.3)',
  textPrimary: '#F0EDE6',
  textMuted:   'rgba(240,237,230,0.45)',
  textDim:     'rgba(240,237,230,0.25)',
};

function nextDateAfter(currentDate, frequency) {
  const d = parseISO(currentDate);
  if (frequency === 'weekly')   return format(addWeeks(d, 1), 'yyyy-MM-dd');
  if (frequency === 'biweekly') return format(addDays(d, 14), 'yyyy-MM-dd');
  if (frequency === 'monthly')  return format(addMonths(d, 1), 'yyyy-MM-dd');
  return currentDate;
}

export default function Budget() {
  const [user, setUser]       = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const queryClient           = useQueryClient();

  useEffect(() => { auth.me().then(setUser).catch(() => {}); }, []);

  const { data: profiles } = useQuery({
    queryKey: ['profile'],
    queryFn: () => entities.UserProfile.filter({ created_by: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => entities.Transaction.filter({ created_by: user?.id }, '-date', 200),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = profiles?.[0];

  const ensureProfile = async () => {
    if (profile) return profile;
    const created = await entities.UserProfile.create({
      display_name: user?.full_name || 'Player',
      created_by: user?.id,
      level: 1, xp: 0, total_saved: 0, monthly_budget: 0, monthly_income: 0,
      badges: [], streak_days: 0,
    });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    return created;
  };

  useEffect(() => {
    if (!profile || !user) return;
    const autoList = profile.auto_transactions || [];
    if (autoList.length === 0) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    let updated = false;
    const newList = [...autoList];
    (async () => {
      for (let i = 0; i < newList.length; i++) {
        const item = newList[i];
        if (!item.next_date) continue;
        if (item.next_date > today) continue;
        const alreadyLogged = (transactions || []).some(t =>
          t.is_auto && t.auto_id === item.id && t.date === item.next_date
        );
        if (alreadyLogged) continue;
        await entities.Transaction.create({
          title: item.title,
          amount: item.amount,
          type: item.type,
          category: item.category,
          date: item.next_date,
          notes: 'Auto transaction',
          is_auto: true,
          auto_id: item.id || String(i),
          created_by: user.id,
        });
        newList[i] = { ...item, next_date: nextDateAfter(item.next_date, item.frequency) };
        updated = true;
        toast.info(`Auto: "${item.title}" logged for ${item.next_date}`);
      }
      if (updated) {
        await entities.UserProfile.update(profile.id, { auto_transactions: newList });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    })();
  }, [profile?.id, user?.id]);

  useEffect(() => {
    if (!profile) return;
    if (!profile.has_seen_budget_onboarding) {
      setShowOnboarding(true);
    }
  }, [profile?.id]);

  const handleAddTransaction = async (data) => {
    await entities.Transaction.create({ ...data, created_by: user?.id });
    const p = await ensureProfile();
    const newXP = (p.xp || 0) + XP_ACTIONS.LOG_TRANSACTION;
    const badges = [...(p.badges || [])];
    const txCount = transactions.length + 1;
    if (txCount === 1  && !badges.includes('first_track')) badges.push('first_track');
    if (txCount >= 10  && !badges.includes('penny_wise'))  badges.push('penny_wise');
    const levelUps = countLevelUps(p.xp || 0, newXP);
    const newLevel  = getLevelFromXP(newXP);
    const levelUpCoins = levelUps * COIN_ACTIONS.LEVEL_UP;
    await entities.UserProfile.update(p.id, {
      xp: newXP, level: newLevel, badges,
      ...(levelUpCoins > 0 ? { coins: (p.coins || 0) + levelUpCoins } : {}),
    });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    if (levelUps > 0) toast.success(`🎉 Level up! You reached level ${newLevel} — +${levelUpCoins} coins!`);
    else toast.success(`+${XP_ACTIONS.LOG_TRANSACTION} XP earned!`);
    setShowForm(false);
  };


  const handleAddSaving = async (data) => {
    await entities.Transaction.create({ ...data, created_by: user?.id });
    const p = await ensureProfile();
    const newTotalSaved = (p.total_saved || 0) + data.amount;
    const newXP = (p.xp || 0) + XP_ACTIONS.LOG_TRANSACTION;
    const badges = [...(p.badges || [])];
    const txCount = (transactions?.length || 0) + 1;
    if (txCount === 1  && !badges.includes('first_track'))      badges.push('first_track');
    if (txCount >= 10  && !badges.includes('penny_wise'))       badges.push('penny_wise');
    if (newTotalSaved >= 100  && !badges.includes('savings_starter')) badges.push('savings_starter');
    if (newTotalSaved >= 500  && !badges.includes('savings_pro'))     badges.push('savings_pro');
    if (newTotalSaved >= 2000 && !badges.includes('savings_legend'))  badges.push('savings_legend');
    const levelUps2     = countLevelUps(p.xp || 0, newXP);
    const newLevel2     = getLevelFromXP(newXP);
    const levelUpCoins2 = levelUps2 * COIN_ACTIONS.LEVEL_UP;
    await entities.UserProfile.update(p.id, {
      xp: newXP, level: newLevel2, badges, total_saved: newTotalSaved,
      ...(levelUpCoins2 > 0 ? { coins: (p.coins || 0) + levelUpCoins2 } : {}),
    });
    if (levelUps2 > 0) toast.success(`🎉 Level up! You reached level ${newLevel2} — +${levelUpCoins2} coins!`);
    try {
      const { data: activeChallenges } = await supabase
        .from('challenges')
        .select('id, challenger_id, opponent_id')
        .eq('status', 'active')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`);
      if (activeChallenges?.length) {
        for (const ch of activeChallenges) {
          const field = ch.challenger_id === user.id ? 'challenger_savings' : 'opponent_savings';
          await supabase.from('challenges').update({ [field]: newTotalSaved }).eq('id', ch.id);
        }
      }
    } catch (_) {}
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    toast.success(`$${data.amount} saved! +${XP_ACTIONS.LOG_TRANSACTION} XP`);
  };

  const handleSaveBudget = async (budgetData) => {
    const incomeFromTx = (transactions || []).filter(t => t.type === "income" || t.type === "saving").reduce((s, t) => s + Number(t.amount || 0), 0);
    const computedBudget = incomeFromTx + (budgetData.monthly_income || profile?.monthly_income || 0);
    budgetData = { ...budgetData, monthly_budget: computedBudget };
    const p = await ensureProfile();
    await entities.UserProfile.update(p.id, budgetData);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success('Budget plan saved!');
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2800);
  };

  const handleAddAuto = async (item) => {
    const p = await ensureProfile();
    const current = p.auto_transactions || [];
    const newItem = { ...item, id: Date.now().toString() };
    await entities.UserProfile.update(p.id, { auto_transactions: [...current, newItem] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success(`"${item.title}" will auto-log ${item.frequency}!`);
  };

  const handleDeleteAuto = async (index) => {
    const p = await ensureProfile();
    const current = [...(p.auto_transactions || [])];
    current.splice(index, 1);
    await entities.UserProfile.update(p.id, { auto_transactions: current });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success('Auto transaction removed');
  };

  const handleOnboardingComplete = async (data) => {
    setShowOnboarding(false);
    const p = await ensureProfile();
    await entities.UserProfile.update(p.id, {
      has_seen_budget_onboarding: true,
      ...(data?.monthly_income ? { monthly_income: data.monthly_income } : {}),
    });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    if (data?.monthly_income) {
      toast.success(`Monthly income set to $${data.monthly_income.toLocaleString()}!`);
    }
  };

  const handleOnboardingSalary = async (data) => {
    const p = await ensureProfile();
    await entities.UserProfile.update(p.id, {
      ...(data?.monthly_income ? { monthly_income: data.monthly_income } : {}),
    });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    if (data?.monthly_income) {
      toast.success(`Monthly income set to $${data.monthly_income.toLocaleString()}!`);
    }
  };

  return (
    <div
      className="cc-budget-root"
      style={{
        minHeight: '100vh',
        background: tokens.dark,
        color: tokens.textPrimary,
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=swap');

        /* ── CHILD COMPONENT DARK OVERRIDES ─────────────────────────────── */
        .cc-budget-root [class*="card"],
        .cc-budget-root [class*="Card"],
        .cc-budget-root [class*="bg-white"],
        .cc-budget-root [class*="bg-background"],
        .cc-budget-root [class*="bg-card"],
        .cc-budget-root [class*="bg-secondary"] {
          background-color: #16161A !important;
          background: #16161A !important;
          color: #F0EDE6 !important;
        }
        .cc-budget-root [style*="background: white"],
        .cc-budget-root [style*="background: #fff"],
        .cc-budget-root [style*="background-color: white"],
        .cc-budget-root [style*="background-color: rgb(255, 255, 255)"],
        .cc-budget-root [style*="background-color: rgb(248"],
        .cc-budget-root [style*="background-color: rgb(249"],
        .cc-budget-root [style*="background-color: rgb(250"],
        .cc-budget-root [style*="background-color: rgb(251"],
        .cc-budget-root [style*="background-color: rgb(252"],
        .cc-budget-root [style*="background-color: rgb(253"],
        .cc-budget-root [style*="background-color: rgb(254"] {
          background-color: #16161A !important;
          background: #16161A !important;
        }
        .cc-budget-root [class*="border"] {
          border-color: rgba(255,255,255,0.07) !important;
        }
        .cc-budget-root [class*="border-border"] {
          border-color: rgba(255,255,255,0.07) !important;
        }
        .cc-budget-root [class*="text-foreground"],
        .cc-budget-root [class*="text-card-foreground"] {
          color: #F0EDE6 !important;
        }
        .cc-budget-root [class*="text-muted-foreground"] {
          color: rgba(240,237,230,0.45) !important;
        }
        .cc-budget-root h1, .cc-budget-root h2,
        .cc-budget-root h3, .cc-budget-root h4 {
          color: #F0EDE6;
        }
        .cc-budget-root .recharts-wrapper,
        .cc-budget-root .recharts-surface {
          background: transparent !important;
        }
        .cc-budget-root .recharts-cartesian-grid line {
          stroke: rgba(255,255,255,0.06) !important;
        }
        .cc-budget-root .recharts-text {
          fill: rgba(240,237,230,0.4) !important;
        }
        .cc-budget-root .recharts-tooltip-wrapper > * {
          background: #1C1C21 !important;
          border: 1px solid rgba(184,151,58,0.25) !important;
          color: #F0EDE6 !important;
          border-radius: 8px !important;
        }
        .cc-budget-root [class*="bg-muted"] {
          background-color: rgba(255,255,255,0.07) !important;
        }
        .cc-budget-root .bg-white,
        .cc-budget-root .bg-gray-50,
        .cc-budget-root .bg-gray-100,
        .cc-budget-root .bg-slate-50,
        .cc-budget-root .bg-slate-100,
        .cc-budget-root .bg-zinc-50,
        .cc-budget-root .bg-zinc-100,
        .cc-budget-root .bg-neutral-50,
        .cc-budget-root .bg-neutral-100 {
          background-color: #16161A !important;
        }
        .cc-budget-root [class*="text-primary"]:not(button):not(a) {
          color: #B8973A !important;
        }
        .cc-budget-root [class*="text-green-"] {
          color: #7EB88A !important;
        }
        .cc-budget-root input,
        .cc-budget-root select,
        .cc-budget-root textarea {
          background: #111114 !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: #F0EDE6 !important;
        }
        .cc-budget-root input::placeholder,
        .cc-budget-root textarea::placeholder {
          color: rgba(240,237,230,0.3) !important;
        }
        .cc-budget-root [class*="separator"],
        .cc-budget-root hr {
          border-color: rgba(255,255,255,0.07) !important;
          background: rgba(255,255,255,0.07) !important;
        }
        .cc-budget-root .rounded-xl,
        .cc-budget-root .rounded-2xl,
        .cc-budget-root .rounded-lg {
          background-color: #16161A;
        }
        /* Select dropdown options */
        .cc-budget-root select option {
          background: #16161A !important;
          color: #F0EDE6 !important;
        }
        /* Labels */
        .cc-budget-root label {
          color: rgba(240,237,230,0.7) !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          letter-spacing: 0.03em !important;
        }
        /* Scrollbar */
        .cc-budget-root ::-webkit-scrollbar { width: 4px; height: 4px; }
        .cc-budget-root ::-webkit-scrollbar-track { background: transparent; }
        .cc-budget-root ::-webkit-scrollbar-thumb { background: rgba(184,151,58,0.3); border-radius: 99px; }

        /* ── LOCAL COMPONENT STYLES ──────────────────────────────────────── */
        .cc-budget-btn-primary {
          background: #B8973A;
          color: #0C0C0E;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 8px 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s, box-shadow 0.15s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .cc-budget-btn-primary:hover {
          background: #D4AF5A;
          box-shadow: 0 0 18px rgba(184,151,58,0.3);
        }

        .cc-budget-btn-ghost {
          background: transparent;
          color: rgba(240,237,230,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          padding: 8px 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: border-color 0.15s, color 0.15s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .cc-budget-btn-ghost:hover {
          border-color: rgba(184,151,58,0.4);
          color: #F0EDE6;
        }

        /* Override shadcn Button inside child components */
        .cc-budget-root button[class*="bg-primary"],
        .cc-budget-root [class*="Button"][class*="default"] {
          background: #B8973A !important;
          color: #0C0C0E !important;
          border: none !important;
        }
        .cc-budget-root button[class*="bg-primary"]:hover,
        .cc-budget-root [class*="Button"][class*="default"]:hover {
          background: #D4AF5A !important;
        }
        .cc-budget-root button[class*="variant-outline"],
        .cc-budget-root button[class*="outline"] {
          border-color: rgba(255,255,255,0.1) !important;
          color: #F0EDE6 !important;
          background: transparent !important;
        }
        .cc-budget-root button[class*="variant-outline"]:hover,
        .cc-budget-root button[class*="outline"]:hover {
          border-color: rgba(184,151,58,0.4) !important;
        }

        /* Tab styles if used inside child components */
        .cc-budget-root [role="tablist"] {
          background: #16161A !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 10px !important;
          padding: 3px !important;
        }
        .cc-budget-root [role="tab"][data-state="active"] {
          background: #B8973A !important;
          color: #0C0C0E !important;
          font-weight: 700 !important;
          box-shadow: 0 1px 8px rgba(184,151,58,0.35) !important;
        }
        .cc-budget-root [role="tab"] {
          color: rgba(240,237,230,0.45) !important;
        }
        .cc-budget-root [role="tab"]:hover:not([data-state="active"]) {
          color: #F0EDE6 !important;
          background: rgba(255,255,255,0.05) !important;
        }

        /* Badge chips */
        .cc-budget-root [class*="badge"],
        .cc-budget-root [class*="Badge"] {
          background: rgba(184,151,58,0.12) !important;
          color: #B8973A !important;
          border-color: rgba(184,151,58,0.25) !important;
        }

        /* Section heading glow line */
        .cc-section-top-line {
          position: absolute;
          top: 0; left: 24px; right: 24px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #B8973A, transparent);
          opacity: 0.55;
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px' }}>

        <div style={{ padding: '8px 0 16px' }}>
          <motion.h1
            initial={{ fontSize: '160px', opacity: 0.85 }}
            animate={{ fontSize: '28px', opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              color: tokens.textPrimary,
              lineHeight: 1.1,
              transformOrigin: 'left center',
            }}
          >
            Budget Tracker
          </motion.h1>
        </div>

        {/* ── ADD TRANSACTION BUTTON (full width) ───────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowForm(!showForm)}
          style={{
            width: '100%',
            marginBottom: 16,
            padding: '14px 24px',
            borderRadius: 14,
            border: showForm ? `1px solid ${tokens.borderGold}` : `1px dashed rgba(184,151,58,0.35)`,
            background: showForm ? tokens.surfaceAlt : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s ease',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => {
            if (!showForm) {
              e.currentTarget.style.background = 'rgba(184,151,58,0.06)';
              e.currentTarget.style.borderColor = 'rgba(184,151,58,0.55)';
            }
          }}
          onMouseLeave={e => {
            if (!showForm) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(184,151,58,0.35)';
            }
          }}
        >
          <motion.div
            animate={{ rotate: showForm ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 22, height: 22, borderRadius: 6,
              background: showForm ? 'rgba(184,151,58,0.15)' : tokens.goldDim,
              border: `1px solid ${tokens.borderGold}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Plus style={{ width: 13, height: 13, color: tokens.gold }} />
          </motion.div>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: showForm ? tokens.textMuted : tokens.gold,
          }}>
            {showForm ? 'Cancel' : 'Add Transaction'}
          </span>
        </motion.button>

        {/* ── TRANSACTION FORM (animated) ────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                overflow: 'hidden',
                marginBottom: 20,
                borderRadius: 14,
                background: tokens.surfaceAlt,
                border: `1px solid ${tokens.borderGold}`,
              }}
            >
              <div style={{ padding: '4px 0' }}>
                <TransactionForm onSubmit={handleAddTransaction} onCancel={() => setShowForm(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN GRID ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 0. PREDICTED INCOME PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              borderRadius: 14,
              background: tokens.surfaceAlt,
              border: `1px solid ${tokens.borderGold}`,
              overflow: "hidden",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "14px 18px 12px",
              borderBottom: `1px solid ${tokens.border}`,
            }}>
              <TrendingUp style={{ width: 14, height: 14, color: tokens.gold }} />
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", color: tokens.textMuted,
              }}>Predicted Monthly Income</span>
            </div>
            <PredictedIncomePanel
              transactions={transactions}
              autoList={profile?.auto_transactions || []}
              profile={profile}
            />
          </motion.div>

          {/* 1. AUTO TRANSACTIONS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              borderRadius: 14,
              background: tokens.surfaceAlt,
              border: `1px solid ${tokens.border}`,
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 18px 12px',
              borderBottom: `1px solid ${tokens.border}`,
            }}>
              <RefreshCw style={{ width: 14, height: 14, color: tokens.gold }} />
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: tokens.textMuted,
              }}>Auto Transactions</span>
            </div>
            <AutoTransactions
              autoList={profile?.auto_transactions || []}
              onAdd={handleAddAuto}
              onDelete={handleDeleteAuto}
            />
          </motion.div>

          {/* 2. TRANSACTIONS + SAVINGS tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            style={{
              borderRadius: 14,
              background: tokens.surfaceAlt,
              border: `1px solid ${tokens.border}`,
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              padding: '10px 14px 0',
              borderBottom: `1px solid ${tokens.border}`,
            }}>
              {[
                { id: 'transactions', icon: <LayoutGrid style={{ width: 13, height: 13 }} />, label: 'Transactions' },
                { id: 'savings',      icon: <PiggyBank  style={{ width: 13, height: 13 }} />, label: 'Money Saved' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id
                      ? `2px solid ${tokens.gold}`
                      : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: activeTab === tab.id ? tokens.gold : tokens.textMuted,
                    fontFamily: "'DM Sans', sans-serif",
                    marginBottom: -1,
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
            {activeTab === 'transactions'
              ? <TransactionList transactions={transactions} />
              : <SavingsTracker onSubmit={handleAddSaving} totalSaved={profile?.total_saved || 0} />
            }
          </motion.div>

          {/* 3. BUDGET PLANNER */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            style={{
              borderRadius: 14,
              background: tokens.surfaceAlt,
              border: budgetSaved ? `1px solid ${tokens.gold}` : `1px solid ${tokens.border}`,
              overflow: 'hidden',
              position: 'relative',
              transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
              boxShadow: budgetSaved ? '0 0 32px rgba(184,151,58,0.18)' : 'none',
            }}
          >
            {/* Saved flash overlay */}
            <AnimatePresence>
              {budgetSaved && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    pointerEvents: 'none',
                    borderRadius: 14,
                    background: 'rgba(184,151,58,0.04)',
                  }}
                >
                  {/* Shimmer line */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '120%' }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '60%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(184,151,58,0.12), transparent)',
                    }}
                  />
                  {/* Top glow line */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #B8973A, transparent)',
                      transformOrigin: 'center',
                    }}
                  />
                  {/* Saved badge */}
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.9 }}
                    transition={{ delay: 0.1, duration: 0.3, type: 'spring', stiffness: 260 }}
                    style={{
                      position: 'absolute', top: 12, right: 16,
                      background: 'rgba(184,151,58,0.15)',
                      border: '1px solid rgba(184,151,58,0.4)',
                      borderRadius: 99,
                      padding: '4px 12px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#B8973A',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      backdropFilter: 'blur(8px)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    >✓</motion.span>
                    Saved
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 18px 12px',
              borderBottom: `1px solid ${tokens.border}`,
            }}>
              <motion.div
                animate={budgetSaved ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Calculator style={{ width: 14, height: 14, color: budgetSaved ? tokens.gold : tokens.gold }} />
              </motion.div>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: tokens.textMuted,
              }}>Budget Planner</span>
            </div>
            <BudgetCalculator profile={profile} onSave={handleSaveBudget} />
          </motion.div>

        </div>
      </div>

      {showOnboarding && (
        <BudgetOnboarding
          onComplete={handleOnboardingComplete}
          onSalary={handleOnboardingSalary}
          onOpenTransactionForm={() => {
            setShowOnboarding(false);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}