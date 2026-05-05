import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Trash2, RefreshCw, ChevronDown, ChevronUp,
  Calendar, CalendarClock, RotateCcw,
  ShoppingCart, Car, Tv, GraduationCap, Home, Zap, PiggyBank,
  Briefcase, Monitor, Gift, MoreHorizontal, TrendingDown, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const t = {
  gold:       '#B8973A',
  goldLight:  '#D4AF5A',
  goldDim:    'rgba(184,151,58,0.15)',
  goldBorder: 'rgba(184,151,58,0.3)',
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

const EXPENSE_CATEGORIES = ['food','transport','entertainment','education','housing','utilities','savings','subscription','other'];
const INCOME_CATEGORIES  = ['salary','freelance','allowance','other'];

const CATEGORY_ICONS = {
  food: ShoppingCart, transport: Car, entertainment: Tv, education: GraduationCap,
  housing: Home, utilities: Zap, savings: PiggyBank, salary: Briefcase,
  freelance: Monitor, allowance: Gift, subscription: RefreshCw, other: MoreHorizontal,
};

const FREQ_CONFIG = {
  weekly:   { label: 'Weekly',    Icon: Calendar },
  biweekly: { label: 'Bi-Weekly', Icon: CalendarClock },
  monthly:  { label: 'Monthly',   Icon: RotateCcw },
};

function CategoryIcon({ category, size = 13, color }) {
  const Icon = CATEGORY_ICONS[category] || MoreHorizontal;
  return <Icon style={{ width: size, height: size, color: color || t.muted, flexShrink: 0 }} />;
}

/* Shared input/select style */
const inputStyle = {
  background: '#0C0C0E',
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 7,
  color: t.text,
  fontSize: 12,
  height: 32,
  paddingLeft: 10,
  paddingRight: 10,
  width: '100%',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  transition: 'border-color 0.15s',
};

export default function AutoTransactions({ autoList = [], onAdd, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense', category: '', frequency: 'monthly',
    next_date: new Date().toISOString().split('T')[0],
  });

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleAdd = () => {
    if (!form.title || !form.amount || !form.category || !form.frequency || !form.next_date) {
      toast.error('Please fill in all fields'); return;
    }
    onAdd({ ...form, amount: parseFloat(form.amount) });
    setForm({ title: '', amount: '', type: 'expense', category: '', frequency: 'monthly', next_date: new Date().toISOString().split('T')[0] });
    setOpen(false);
  };

  return (
    <div style={{ padding: '14px 16px 16px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .cc-auto-input:focus { border-color: rgba(184,151,58,0.5) !important; }
        .cc-select-trigger { background: #0C0C0E !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #F0EDE6 !important; border-radius: 7px !important; height: 32px !important; font-size: 12px !important; }
        .cc-select-trigger:hover { border-color: rgba(184,151,58,0.4) !important; }
        .cc-select-content { background: #16161A !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; }
        .cc-select-item { color: rgba(240,237,230,0.7) !important; font-size: 12px !important; }
        .cc-select-item:hover, .cc-select-item[data-highlighted] { background: rgba(184,151,58,0.12) !important; color: #F0EDE6 !important; }
        .cc-auto-row:hover { background: rgba(255,255,255,0.03) !important; }
        .cc-add-btn:hover { background: #D4AF5A !important; }
        .cc-new-btn:hover { border-color: rgba(184,151,58,0.4) !important; color: #F0EDE6 !important; }
        .cc-del-btn { opacity: 0; }
        .cc-auto-row:hover .cc-del-btn { opacity: 1; }
      `}</style>

      {/* Header row with New button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 11, color: t.muted }}>Recurring expenses and income logged automatically.</p>
        <button
          className="cc-new-btn"
          onClick={() => setOpen(!open)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
            background: 'transparent', color: t.muted, cursor: 'pointer',
            border: `1px solid ${t.border}`, transition: 'border-color 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          <Plus style={{ width: 11, height: 11 }} /> New
          {open ? <ChevronUp style={{ width: 10, height: 10 }} /> : <ChevronDown style={{ width: 10, height: 10 }} />}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: 12, borderRadius: 10, marginBottom: 12,
              background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {/* Expense / Income toggle */}
              <div style={{ display: 'flex', gap: 4, background: '#0C0C0E', borderRadius: 8, padding: 3 }}>
                {['expense', 'income'].map(tp => (
                  <button key={tp} type="button"
                    onClick={() => setForm({ ...form, type: tp, category: '' })}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', border: 'none', textTransform: 'capitalize', transition: 'all 0.15s',
                      background: form.type === tp
                        ? (tp === 'expense' ? t.redDim : t.greenDim)
                        : 'transparent',
                      color: form.type === tp
                        ? (tp === 'expense' ? t.red : t.green)
                        : t.muted,
                      outline: form.type === tp
                        ? `1px solid ${tp === 'expense' ? t.redBorder : t.greenBorder}`
                        : 'none',
                    }}
                  >{tp}</button>
                ))}
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Name</label>
                <input
                  className="cc-auto-input"
                  style={inputStyle}
                  placeholder="e.g. Netflix"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {/* Amount */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Amount ($)</label>
                  <input
                    className="cc-auto-input"
                    style={inputStyle}
                    type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Category</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger className="cc-select-trigger"><SelectValue placeholder="Pick" /></SelectTrigger>
                    <SelectContent className="cc-select-content">
                      {categories.map(c => <SelectItem key={c} value={c} className="cc-select-item" style={{ textTransform: 'capitalize' }}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Frequency */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Frequency</label>
                  <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                    <SelectTrigger className="cc-select-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent className="cc-select-content">
                      {Object.entries(FREQ_CONFIG).map(([k, cfg]) => (
                        <SelectItem key={k} value={k} className="cc-select-item">{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Next Date */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: t.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Next Date</label>
                  <input
                    className="cc-auto-input"
                    style={inputStyle}
                    type="date"
                    value={form.next_date}
                    onChange={e => setForm({ ...form, next_date: e.target.value })}
                  />
                </div>
              </div>

              <button
                className="cc-add-btn"
                onClick={handleAdd}
                style={{
                  width: '100%', padding: '8px', borderRadius: 7,
                  background: t.gold, color: '#0C0C0E', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.15s', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Plus style={{ width: 12, height: 12 }} /> Add Auto Transaction
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {autoList.length === 0 ? (
        <p style={{ fontSize: 12, color: t.dim, textAlign: 'center', padding: '16px 0', margin: 0 }}>No auto transactions yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {autoList.map((item, i) => {
            const freq = FREQ_CONFIG[item.frequency] || FREQ_CONFIG.monthly;
            const FreqIcon = freq.Icon;
            return (
              <div
                key={i}
                className="cc-auto-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${t.border}`,
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
              >
                {/* Category icon */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: item.type === 'income' ? t.greenDim : t.redDim,
                  border: `1px solid ${item.type === 'income' ? t.greenBorder : t.redBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CategoryIcon category={item.category} size={13} color={item.type === 'income' ? t.green : t.red} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 99, flexShrink: 0,
                      background: t.goldDim, color: t.gold, border: `1px solid ${t.goldBorder}`,
                      letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}>
                      <FreqIcon style={{ width: 8, height: 8 }} /> {freq.label}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 10, color: t.muted, textTransform: 'capitalize' }}>
                    {item.category} · next: {item.next_date ? format(parseISO(item.next_date), 'MMM d') : '—'}
                  </p>
                </div>

                {/* Amount */}
                <span style={{ fontSize: 12, fontWeight: 700, color: item.type === 'income' ? t.green : t.red, flexShrink: 0 }}>
                  {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                </span>

                {/* Delete */}
                <button
                  className="cc-del-btn"
                  onClick={() => onDelete(i)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Trash2 style={{ width: 12, height: 12, color: t.red }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}