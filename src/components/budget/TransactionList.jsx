import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Trash2, ArrowUpRight, ArrowDownRight, Calendar, ChevronLeft, ChevronRight,
  Eraser, ShoppingCart, Car, Tv, GraduationCap, Home, Zap, PiggyBank,
  Briefcase, Monitor, Gift, MoreHorizontal, RefreshCw, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
  subMonths, addMonths, startOfMonth, endOfMonth, eachWeekOfInterval,
} from 'date-fns';
import { entities } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const t = {
  gold:       '#B8973A',
  goldLight:  '#D4AF5A',
  goldDim:    'rgba(184,151,58,0.15)',
  goldBorder: 'rgba(184,151,58,0.3)',
  dark:       '#0C0C0E',
  surface:    '#111114',
  surfaceAlt: '#16161A',
  border:     'rgba(255,255,255,0.07)',
  text:       '#F0EDE6',
  muted:      'rgba(240,237,230,0.45)',
  dim:        'rgba(240,237,230,0.22)',
  green:      '#6EAF7A',
  greenDim:   'rgba(110,175,122,0.15)',
  greenBorder:'rgba(110,175,122,0.3)',
  red:        '#C0665A',
  redDim:     'rgba(192,102,90,0.15)',
  redBorder:  'rgba(192,102,90,0.3)',
};

/* ─── Category → Lucide icon map ─────────────────────────────────────────── */
const CATEGORY_ICONS = {
  food:          ShoppingCart,
  transport:     Car,
  entertainment: Tv,
  education:     GraduationCap,
  housing:       Home,
  utilities:     Zap,
  savings:       PiggyBank,
  salary:        Briefcase,
  freelance:     Monitor,
  allowance:     Gift,
  subscription:  RefreshCw,
  other:         MoreHorizontal,
};

function CategoryIcon({ category, size = 14, color }) {
  const Icon = CATEGORY_ICONS[category] || MoreHorizontal;
  return <Icon style={{ width: size, height: size, color: color || t.muted, flexShrink: 0 }} />;
}

function savingsPct(txs) {
  const income  = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const expense = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  if (income === 0) return expense === 0 ? 0 : -100;
  return Math.round(((income - expense) / income) * 100);
}

function weekPalette(pct) {
  if (pct >= 20) return { border: t.greenBorder, bg: t.greenDim, text: t.green,  dot: t.green  };
  if (pct > 0)   return { border: 'rgba(184,151,58,0.3)', bg: t.goldDim, text: t.gold, dot: t.gold };
  return               { border: t.redBorder,   bg: t.redDim,   text: t.red,   dot: t.red   };
}

/* ══════════════════════════════════════════════════════════════════════════
   CALENDAR MODAL
══════════════════════════════════════════════════════════════════════════ */
function CalendarModal({ open, onClose, allTransactions }) {
  const [viewDate,     setViewDate]     = useState(new Date());
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd   = endOfMonth(viewDate);
  const weeks      = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

  const txsForDay  = day => allTransactions.filter(tx => isSameDay(new Date(tx.date), day));
  const txsForWeek = wStart => {
    const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
    return allTransactions.filter(tx => { const d = new Date(tx.date); return d >= wStart && d <= wEnd; });
  };

  const focusTxs     = selectedDay ? txsForDay(selectedDay) : selectedWeek ? txsForWeek(selectedWeek) : [];
  const focusIncome  = focusTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const focusExpense = focusTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const focusSaved   = focusIncome - focusExpense;

  const dialogOverride = {
    background: t.surface,
    border: `1px solid ${t.goldBorder}`,
    borderRadius: 16,
    color: t.text,
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: 520,
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={dialogOverride}>
        <style>{`
          [data-radix-dialog-content] { background: #111114 !important; color: #F0EDE6 !important; border: 1px solid rgba(184,151,58,0.3) !important; }
          [data-radix-dialog-overlay] { background: rgba(0,0,0,0.7) !important; }
          [data-radix-dialog-close] svg { color: rgba(240,237,230,0.5) !important; }
          [data-radix-dialog-close]:hover svg { color: #F0EDE6 !important; }
        `}</style>

        <DialogHeader>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.text, fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600 }}>
            <Calendar style={{ width: 16, height: 16, color: t.gold }} />
            Transaction History
          </DialogTitle>
        </DialogHeader>

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 8px' }}>
          <button
            onClick={() => { setViewDate(v => subMonths(v, 1)); setSelectedDay(null); setSelectedWeek(null); }}
            style={{ padding: 6, borderRadius: 8, background: 'transparent', border: `1px solid ${t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = t.goldBorder}
            onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
          >
            <ChevronLeft style={{ width: 14, height: 14, color: t.muted }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{format(viewDate, 'MMMM yyyy')}</span>
          <button
            onClick={() => { setViewDate(v => addMonths(v, 1)); setSelectedDay(null); setSelectedWeek(null); }}
            style={{ padding: 6, borderRadius: 8, background: 'transparent', border: `1px solid ${t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = t.goldBorder}
            onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
          >
            <ChevronRight style={{ width: 14, height: 14, color: t.muted }} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3, marginBottom: 4 }}>
          <div style={{ fontSize: 9, color: t.dim, textAlign: 'center', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Wk</div>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} style={{ fontSize: 9, color: t.muted, textAlign: 'center', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {weeks.map((weekStart, wi) => {
            const days     = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
            const wTxs     = txsForWeek(weekStart);
            const pct      = savingsPct(wTxs);
            const pal      = weekPalette(pct);
            const wIncome  = wTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
            const wExpense = wTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
            const wNet     = wIncome - wExpense;
            const isSelWeek = selectedWeek && isSameDay(weekStart, selectedWeek);

            return (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3, alignItems: 'center' }}>
                {/* Week summary cell */}
                <button
                  onClick={() => { setSelectedWeek(isSelWeek ? null : weekStart); setSelectedDay(null); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 8, padding: '4px 2px', minHeight: 44,
                    background: wTxs.length > 0 ? pal.bg : 'transparent',
                    border: wTxs.length > 0 ? `1px solid ${pal.border}` : '1px solid transparent',
                    outline: isSelWeek ? `2px solid ${t.gold}` : 'none',
                    cursor: wTxs.length > 0 ? 'pointer' : 'default',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {wTxs.length > 0 ? (
                    <>
                      <span style={{ fontSize: 10, fontWeight: 700, color: pal.text }}>{pct > 0 ? '+' : ''}{pct}%</span>
                      <span style={{ fontSize: 8, color: pal.text }}>{wNet >= 0 ? '+' : ''}${wNet.toFixed(0)}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 9, color: t.dim }}>—</span>
                  )}
                </button>

                {/* Day cells */}
                {days.map((day, di) => {
                  const dTxs    = txsForDay(day);
                  const inMonth = day >= monthStart && day <= monthEnd;
                  const isToday = isSameDay(day, new Date());
                  const isSelDay = selectedDay && isSameDay(day, selectedDay);
                  const dIncome  = dTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
                  const dExpense = dTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
                  const dNet    = dIncome - dExpense;

                  return (
                    <button key={di}
                      onClick={() => { if (dTxs.length > 0) { setSelectedDay(isSelDay ? null : day); setSelectedWeek(null); } }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 8, padding: '4px 2px', minHeight: 44,
                        opacity: inMonth ? 1 : 0.3,
                        background: isSelDay ? t.goldDim : 'transparent',
                        border: isToday ? `2px solid ${t.gold}` : isSelDay ? `1px solid ${t.goldBorder}` : '1px solid transparent',
                        cursor: dTxs.length > 0 ? 'pointer' : 'default',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? t.gold : t.text }}>
                        {format(day, 'd')}
                      </span>
                      {dTxs.length > 0 && (
                        <span style={{ fontSize: 8, fontWeight: 600, marginTop: 1, color: dNet >= 0 ? t.green : t.red }}>
                          {dNet >= 0 ? '+' : ''}${Math.abs(dNet).toFixed(0)}
                        </span>
                      )}
                      {dTxs.length > 0 && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', marginTop: 1, background: dNet >= 0 ? t.green : t.red }} />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Selected day/week detail */}
        <AnimatePresence>
          {(selectedDay || selectedWeek) && focusTxs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ borderRadius: 12, overflow: 'hidden', marginTop: 12, border: `1px solid ${t.border}` }}
            >
              <div style={{
                padding: '10px 16px', background: t.surfaceAlt,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${t.border}`,
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: t.text, margin: 0 }}>
                  {selectedDay ? format(selectedDay, 'EEEE, MMM d') : `Week of ${format(selectedWeek, 'MMM d')}`}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                  <span style={{ color: t.green, fontWeight: 600 }}>+${focusIncome.toFixed(2)}</span>
                  <span style={{ color: t.red, fontWeight: 600 }}>-${focusExpense.toFixed(2)}</span>
                  <span style={{ fontWeight: 700, color: focusSaved >= 0 ? t.green : t.red }}>
                    net: {focusSaved >= 0 ? '+' : ''}${focusSaved.toFixed(2)}
                  </span>
                </div>
              </div>
              <div style={{ maxHeight: 192, overflowY: 'auto' }}>
                {focusTxs.map(tx => (
                  <div key={tx.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px', borderBottom: `1px solid ${t.border}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: tx.is_saving ? 'rgba(255,255,255,0.07)' : tx.type === 'income' ? t.greenDim : t.redDim,
                      border: `1px solid ${tx.is_saving ? 'rgba(255,255,255,0.15)' : tx.type === 'income' ? t.greenBorder : t.redBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CategoryIcon category={tx.category} size={13} color={tx.is_saving ? '#F0EDE6' : tx.type === 'income' ? t.green : t.red} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: t.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
                      <p style={{ fontSize: 10, color: t.muted, margin: 0, textTransform: 'capitalize' }}>{tx.category}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: tx.is_saving ? '#F0EDE6' : tx.type === 'income' ? t.green : t.red, flexShrink: 0 }}>
                      {tx.is_saving ? '' : tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function TransactionList({ transactions }) {
  const queryClient                   = useQueryClient();
  const [calOpen,       setCalOpen]   = useState(false);
  const [confirmClear,  setConfirmClear] = useState(false);

  const handleDelete = async (id) => {
    await entities.Transaction.delete(id);
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekEnd   = endOfWeek(new Date(),   { weekStartsOn: 1 });

  const thisWeekTxs = (transactions || []).filter(tx => {
    const d = new Date(tx.date);
    return d >= thisWeekStart && d <= thisWeekEnd;
  });

  const byDay = useMemo(() => {
    const map = {};
    thisWeekTxs.forEach(tx => {
      const key = tx.date?.split('T')[0] || format(new Date(tx.date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [thisWeekTxs]);

  const weekIncome  = thisWeekTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const weekExpense = thisWeekTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const weekSaved   = weekIncome - weekExpense;
  const weekPct     = savingsPct(thisWeekTxs);
  const weekPal     = weekPalette(weekPct);

  const handleClearWeek = async () => {
    for (const tx of thisWeekTxs) await entities.Transaction.delete(tx.id);
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    setConfirmClear(false);
    toast.success('This week cleared! History saved in calendar.');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=swap');
        .cc-tx-row:hover { background: rgba(255,255,255,0.03) !important; }
        .cc-tx-del { opacity: 0 !important; transition: opacity 0.15s; }
        .cc-tx-row:hover .cc-tx-del { opacity: 1 !important; }
        .cc-cal-btn:hover { border-color: rgba(184,151,58,0.4) !important; color: #F0EDE6 !important; }
        .cc-clear-btn:hover { border-color: rgba(192,102,90,0.5) !important; color: #C0665A !important; }
      `}</style>

      <CalendarModal open={calOpen} onClose={() => setCalOpen(false)} allTransactions={transactions || []} />

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.text }}>This Week</p>
            <p style={{ margin: 0, fontSize: 11, color: t.muted, marginTop: 2 }}>
              {format(thisWeekStart, 'MMM d')} – {format(thisWeekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="cc-cal-btn"
              onClick={() => setCalOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                background: 'transparent', color: t.muted, cursor: 'pointer',
                border: `1px solid ${t.border}`, transition: 'border-color 0.15s, color 0.15s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Calendar style={{ width: 12, height: 12 }} /> History
            </button>
            {thisWeekTxs.length > 0 && (
              <button
                className="cc-clear-btn"
                onClick={() => setConfirmClear(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                  background: 'transparent', color: t.muted, cursor: 'pointer',
                  border: `1px solid ${t.border}`, transition: 'border-color 0.15s, color 0.15s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Eraser style={{ width: 12, height: 12 }} /> Clear Week
              </button>
            )}
          </div>
        </div>

        {/* Week summary bar */}
        {thisWeekTxs.length > 0 && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 10,
            background: weekPal.bg, border: `1px solid ${weekPal.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: weekPal.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: weekPal.text }}>
                {weekPct > 0 ? '+' : ''}{weekPct}% saved this week
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
              <span style={{ color: t.green, fontWeight: 600 }}>+${weekIncome.toFixed(2)}</span>
              <span style={{ color: t.red, fontWeight: 600 }}>-${weekExpense.toFixed(2)}</span>
              <span style={{ fontWeight: 700, color: weekSaved >= 0 ? t.green : t.red }}>
                net {weekSaved >= 0 ? '+' : ''}${weekSaved.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 18px 18px' }}>
        <AnimatePresence>
          {confirmClear && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                marginBottom: 16, padding: 14, borderRadius: 10,
                background: t.redDim, border: `1px solid ${t.redBorder}`,
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: t.red, margin: '0 0 4px' }}>
                Clear this week's {thisWeekTxs.length} transactions?
              </p>
              <p style={{ fontSize: 11, color: t.muted, margin: '0 0 10px' }}>They'll still appear in the calendar history.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleClearWeek}
                  style={{
                    padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                    background: t.red, color: '#fff', border: 'none', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >Yes, clear</button>
                <button
                  onClick={() => setConfirmClear(false)}
                  style={{
                    padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                    background: 'transparent', color: t.muted, border: `1px solid ${t.border}`, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {thisWeekTxs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: t.muted }}>
            <TrendingUp style={{ width: 32, height: 32, color: t.dim, margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontSize: 13, margin: '0 0 4px', color: t.muted }}>No transactions this week</p>
            <p style={{ fontSize: 11, margin: 0, color: t.dim }}>Add your first one above</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 600, overflowY: 'auto', paddingRight: 2 }}>
            {byDay.map(([dateKey, txs]) => {
              const dayDate   = new Date(dateKey + 'T12:00:00');
              const dayIncome  = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
              const dayExpense = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
              const dayNet    = dayIncome - dayExpense;

              return (
                <div key={dateKey}>
                  {/* Day header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                    position: 'sticky', top: 0, zIndex: 10,
                    background: t.surfaceAlt, paddingTop: 4, paddingBottom: 4,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.gold, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.text, flex: 1 }}>
                      {isSameDay(dayDate, new Date()) ? 'Today'
                       : isSameDay(dayDate, new Date(Date.now() - 86400000)) ? 'Yesterday'
                       : format(dayDate, 'EEEE, MMM d')}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                      background: dayNet >= 0 ? t.greenDim : t.redDim,
                      color: dayNet >= 0 ? t.green : t.red,
                      border: `1px solid ${dayNet >= 0 ? t.greenBorder : t.redBorder}`,
                    }}>
                      {dayNet >= 0 ? '+' : ''}${dayNet.toFixed(2)}
                    </span>
                  </div>

                  {/* Transaction rows */}
                  <div style={{ marginLeft: 10, borderLeft: `2px solid ${t.border}`, paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {txs.map(tx => (
                      <motion.div
                        key={tx.id} layout
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        className="cc-tx-row"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 9,
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Icon */}
                        <div style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          background: tx.is_saving ? 'rgba(255,255,255,0.07)' : tx.type === 'income' ? t.greenDim : t.redDim,
                          border: `1px solid ${tx.is_saving ? 'rgba(255,255,255,0.15)' : tx.type === 'income' ? t.greenBorder : t.redBorder}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <CategoryIcon category={tx.category} size={13} color={tx.is_saving ? '#F0EDE6' : tx.type === 'income' ? t.green : t.red} />
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tx.title}
                            </p>
                            {tx.is_auto && (
                              <span style={{
                                fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 99,
                                background: t.goldDim, color: t.gold, border: `1px solid ${t.goldBorder}`,
                                letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0,
                              }}>auto</span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 10, color: t.muted, textTransform: 'capitalize' }}>
                            {tx.category?.replace(/_/g, ' ')}{tx.notes && tx.notes !== 'Auto transaction' ? ` · ${tx.notes}` : ''}
                          </p>
                        </div>

                        {/* Amount */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 700, color: tx.is_saving ? '#F0EDE6' : tx.type === 'income' ? t.green : t.red, flexShrink: 0 }}>
                          {tx.is_saving
                            ? <TrendingUp style={{ width: 12, height: 12 }} />
                            : tx.type === 'income'
                              ? <ArrowUpRight style={{ width: 12, height: 12 }} />
                              : <ArrowDownRight style={{ width: 12, height: 12 }} />}
                          ${tx.amount.toLocaleString()}
                        </div>

                        {/* Delete */}
                        <button
                          className="cc-tx-del"
                          onClick={() => handleDelete(tx.id)}
                          style={{
                            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                          }}
                        >
                          <Trash2 style={{ width: 12, height: 12, color: t.red }} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}