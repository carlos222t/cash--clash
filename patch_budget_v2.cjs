const fs = require('fs');

// ─────────────────────────────────────────────────────────────────────
// 1. REWRITE src/components/budget/TransactionList.jsx
//    - Transactions grouped by day with date bookmarks
//    - Weekly clear button
//    - Calendar history modal (click day or week to see breakdown)
//    - Week rows coloured green/red by savings %
// ─────────────────────────────────────────────────────────────────────

const txList = `import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, ArrowUpRight, ArrowDownRight, Calendar, ChevronLeft, ChevronRight, Eraser, X } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks, startOfMonth, endOfMonth, eachWeekOfInterval, getWeek } from 'date-fns';
import { entities } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const CATEGORY_ICONS = {
  food: '🍔', transport: '🚗', entertainment: '🎮', education: '📚',
  housing: '🏠', utilities: '💡', savings: '🏦', salary: '💼',
  freelance: '💻', allowance: '🎁', other: '📌', subscription: '🔁',
};

function savingsPct(txs) {
  const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  if (income === 0) return expense === 0 ? 0 : -100;
  return Math.round(((income - expense) / income) * 100);
}

function weekColor(pct) {
  if (pct >= 20) return { bg: 'bg-green-500/15 border-green-500/30', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' };
  if (pct > 0)   return { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' };
  return { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' };
}

// ── CALENDAR MODAL ───────────────────────────────────────────────────
function CalendarModal({ open, onClose, allTransactions }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd   = endOfMonth(viewDate);

  // Get all week-starts in this month
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

  const txsInMonth = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  const txsForDay = (day) => allTransactions.filter(t => isSameDay(new Date(t.date), day));
  const txsForWeek = (weekStart) => {
    const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return allTransactions.filter(t => { const d = new Date(t.date); return d >= weekStart && d <= wEnd; });
  };

  const focusTxs = selectedDay
    ? txsForDay(selectedDay)
    : selectedWeek
      ? txsForWeek(selectedWeek)
      : [];

  const focusIncome  = focusTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const focusExpense = focusTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const focusSaved   = focusIncome - focusExpense;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Calendar className="w-4 h-4 text-primary" /> Transaction History
          </DialogTitle>
        </DialogHeader>

        {/* Month navigator */}
        <div className="flex items-center justify-between py-1">
          <button onClick={() => { setViewDate(v => subWeeks(v, 4)); setSelectedDay(null); setSelectedWeek(null); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold">{format(viewDate, 'MMMM yyyy')}</span>
          <button onClick={() => { setViewDate(v => addWeeks(v, 4)); setSelectedDay(null); setSelectedWeek(null); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-8 gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
          <div className="text-[9px] text-muted-foreground/50 flex items-center">Wk</div>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center">{d}</div>
          ))}
        </div>

        {/* Week rows */}
        <div className="space-y-1">
          {weeks.map((weekStart, wi) => {
            const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
            const wTxs = txsForWeek(weekStart);
            const pct  = savingsPct(wTxs);
            const col  = weekColor(pct);
            const wIncome  = wTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const wExpense = wTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const wSaved = wIncome - wExpense;
            const isSelWeek = selectedWeek && isSameDay(weekStart, selectedWeek);

            return (
              <div key={wi} className="grid grid-cols-8 gap-1 items-center">
                {/* Week button */}
                <button
                  onClick={() => { setSelectedWeek(isSelWeek ? null : weekStart); setSelectedDay(null); }}
                  className={\`flex flex-col items-center justify-center rounded-lg p-1 border text-[9px] transition-all \${wTxs.length > 0 ? col.bg + ' cursor-pointer hover:opacity-80' : 'border-transparent'} \${isSelWeek ? 'ring-2 ring-primary' : ''}\`}
                >
                  {wTxs.length > 0 && (
                    <>
                      <span className={\`font-bold text-[10px] \${col.text}\`}>{pct > 0 ? '+' : ''}{pct}%</span>
                      <span className={\`\${col.text} text-[8px]\`}>{wSaved >= 0 ? '+' : ''}\\${wSaved.toFixed(0)}</span>
                    </>
                  )}
                  {wTxs.length === 0 && <span className="text-muted-foreground/30">—</span>}
                </button>

                {/* Day cells */}
                {days.map((day, di) => {
                  const dTxs = txsForDay(day);
                  const inMonth = day >= monthStart && day <= monthEnd;
                  const isToday = isSameDay(day, new Date());
                  const isSelDay = selectedDay && isSameDay(day, selectedDay);
                  const dIncome  = dTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                  const dExpense = dTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                  const dNet = dIncome - dExpense;

                  return (
                    <button
                      key={di}
                      onClick={() => { if (dTxs.length > 0) { setSelectedDay(isSelDay ? null : day); setSelectedWeek(null); } }}
                      className={\`relative flex flex-col items-center justify-center rounded-lg p-1.5 text-xs transition-all min-h-[44px]
                        \${!inMonth ? 'opacity-30' : ''}
                        \${dTxs.length > 0 ? 'cursor-pointer hover:bg-muted' : 'cursor-default'}
                        \${isToday ? 'ring-2 ring-primary' : ''}
                        \${isSelDay ? 'bg-primary/10 ring-2 ring-primary' : ''}
                      \`}
                    >
                      <span className={\`text-[11px] font-medium \${isToday ? 'text-primary font-bold' : 'text-foreground'}\`}>
                        {format(day, 'd')}
                      </span>
                      {dTxs.length > 0 && (
                        <span className={\`text-[9px] font-semibold mt-0.5 \${dNet >= 0 ? 'text-green-500' : 'text-red-500'}\`}>
                          {dNet >= 0 ? '+' : ''}\\${Math.abs(dNet).toFixed(0)}
                        </span>
                      )}
                      {dTxs.length > 0 && (
                        <div className={\`w-1 h-1 rounded-full mt-0.5 \${dNet >= 0 ? 'bg-green-500' : 'bg-red-500'}\`} />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {(selectedDay || selectedWeek) && focusTxs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="border border-border rounded-2xl overflow-hidden mt-2">
              <div className="px-4 py-3 bg-muted/40 flex items-center justify-between">
                <p className="text-xs font-semibold">
                  {selectedDay ? format(selectedDay, 'EEEE, MMM d') : \`Week of \${format(selectedWeek, 'MMM d')}\`}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-green-500 font-medium">+\\${focusIncome.toFixed(2)}</span>
                  <span className="text-red-500 font-medium">-\\${focusExpense.toFixed(2)}</span>
                  <span className={\`font-bold \${focusSaved >= 0 ? 'text-green-500' : 'text-red-500'}\`}>
                    net: {focusSaved >= 0 ? '+' : ''}\\${focusSaved.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-border max-h-48 overflow-y-auto">
                {focusTxs.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-base">{CATEGORY_ICONS[tx.category] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{tx.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{tx.category}</p>
                    </div>
                    <span className={\`text-xs font-semibold \${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}\`}>
                      {tx.type === 'income' ? '+' : '-'}\\${tx.amount.toFixed(2)}
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

// ── MAIN COMPONENT ───────────────────────────────────────────────────
export default function TransactionList({ transactions }) {
  const queryClient = useQueryClient();
  const [calOpen, setCalOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleDelete = async (id) => {
    await entities.Transaction.delete(id);
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  // Only show THIS week's transactions on the main list
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekEnd   = endOfWeek(new Date(), { weekStartsOn: 1 });

  const thisWeekTxs = (transactions || []).filter(t => {
    const d = new Date(t.date);
    return d >= thisWeekStart && d <= thisWeekEnd;
  });

  // Group by day
  const byDay = useMemo(() => {
    const map = {};
    thisWeekTxs.forEach(tx => {
      const key = tx.date?.split('T')[0] || format(new Date(tx.date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [thisWeekTxs]);

  const weekIncome  = thisWeekTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const weekExpense = thisWeekTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const weekSaved   = weekIncome - weekExpense;
  const weekPct     = savingsPct(thisWeekTxs);
  const weekCol     = weekColor(weekPct);

  const handleClearWeek = async () => {
    for (const tx of thisWeekTxs) {
      await entities.Transaction.delete(tx.id);
    }
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    setConfirmClear(false);
    toast.success('This week cleared! History saved in calendar. 🗓️');
  };

  return (
    <>
      <CalendarModal open={calOpen} onClose={() => setCalOpen(false)} allTransactions={transactions || []} />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-heading">This Week</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {format(thisWeekStart, 'MMM d')} – {format(thisWeekEnd, 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setCalOpen(true)}>
                <Calendar className="w-3.5 h-3.5" /> History
              </Button>
              {thisWeekTxs.length > 0 && (
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                  onClick={() => setConfirmClear(true)}>
                  <Eraser className="w-3.5 h-3.5" /> Clear Week
                </Button>
              )}
            </div>
          </div>

          {/* Week summary strip */}
          {thisWeekTxs.length > 0 && (
            <div className={\`flex items-center justify-between mt-2 px-3 py-2 rounded-xl border \${weekCol.bg}\`}>
              <div className="flex items-center gap-2">
                <div className={\`w-2 h-2 rounded-full \${weekCol.dot}\`} />
                <span className={\`text-xs font-semibold \${weekCol.text}\`}>
                  {weekPct > 0 ? '+' : ''}{weekPct}% saved this week
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-green-500 font-medium">+\${weekIncome.toFixed(2)}</span>
                <span className="text-red-500 font-medium">-\${weekExpense.toFixed(2)}</span>
                <span className={\`font-bold \${weekSaved >= 0 ? 'text-green-500' : 'text-red-500'}\`}>
                  net {weekSaved >= 0 ? '+' : ''}\${weekSaved.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Confirm clear dialog */}
          <AnimatePresence>
            {confirmClear && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-4 p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-3">
                <p className="text-sm font-medium text-destructive">Clear this week's {thisWeekTxs.length} transactions?</p>
                <p className="text-xs text-muted-foreground">They'll still appear in the calendar history — this just clears the main view.</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleClearWeek}>Yes, clear</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {thisWeekTxs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">No transactions this week</p>
              <p className="text-xs mt-1">Add your first one above ↑</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {byDay.map(([dateKey, txs]) => {
                const dayDate  = new Date(dateKey + 'T12:00:00');
                const dayIncome  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                const dayNet = dayIncome - dayExpense;

                return (
                  <div key={dateKey}>
                    {/* Day bookmark */}
                    <div className="flex items-center gap-3 mb-2 sticky top-0 bg-card/95 backdrop-blur-sm py-1 z-10">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-xs font-bold text-foreground">
                          {isSameDay(dayDate, new Date()) ? 'Today' :
                           isSameDay(dayDate, new Date(Date.now() - 86400000)) ? 'Yesterday' :
                           format(dayDate, 'EEEE, MMM d')}
                        </span>
                      </div>
                      <span className={\`text-[10px] font-semibold px-2 py-0.5 rounded-full \${dayNet >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}\`}>
                        {dayNet >= 0 ? '+' : ''}\${dayNet.toFixed(2)}
                      </span>
                    </div>

                    {/* Transactions for this day */}
                    <div className="space-y-0.5 ml-3 border-l-2 border-border pl-3">
                      {txs.map(tx => (
                        <motion.div key={tx.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                          <span className="text-lg">{CATEGORY_ICONS[tx.category] || '📌'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium truncate">{tx.title}</p>
                              {tx.is_auto && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-muted-foreground">auto</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">{tx.category?.replace(/_/g, ' ')}{tx.notes ? \` · \${tx.notes}\` : ''}</p>
                          </div>
                          <div className={\`flex items-center gap-1 text-sm font-semibold \${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}\`}>
                            {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            \${tx.amount.toLocaleString()}
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(tx.id)}>
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
`;

fs.writeFileSync('src/components/budget/TransactionList.jsx', txList, 'utf8');
console.log('✅ TransactionList.jsx rewritten (day bookmarks + calendar + weekly clear)');

// ─────────────────────────────────────────────────────────────────────
// 2. CREATE src/components/budget/AutoTransactions.jsx
//    - Create recurring expenses (weekly / bi-weekly / monthly)
//    - Listed with delete option
//    - Budget.jsx will call the engine to fire due transactions
// ─────────────────────────────────────────────────────────────────────

const autoTx = `import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const EXPENSE_CATEGORIES = ['food','transport','entertainment','education','housing','utilities','savings','subscription','other'];
const INCOME_CATEGORIES  = ['salary','freelance','allowance','other'];

const FREQ_LABELS = {
  weekly:    { label: 'Weekly',    icon: '🗓️' },
  biweekly:  { label: 'Bi-Weekly', icon: '📅' },
  monthly:   { label: 'Monthly',   icon: '🔁' },
};

export default function AutoTransactions({ autoList = [], onAdd, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense', category: '', frequency: 'monthly', next_date: new Date().toISOString().split('T')[0],
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" /> Auto Transactions
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setOpen(!open)}>
            <Plus className="w-3.5 h-3.5" /> New
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Recurring expenses & income logged automatically.</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Form */}
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border mb-3">

                {/* Type toggle */}
                <div className="flex gap-2 bg-background rounded-lg p-1">
                  {['expense','income'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category: '' })}
                      className={\`flex-1 py-1.5 rounded-md text-xs font-medium transition-all capitalize
                        \${form.type === t ? (t === 'expense' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground') : 'text-muted-foreground'}\`}>
                      {t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <Label className="text-[11px]">Name</Label>
                    <Input placeholder="e.g. Netflix" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Amount ($)</Label>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Pick" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="capitalize text-sm">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px]">Frequency</Label>
                    <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQ_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="text-sm">{v.icon} {v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px]">Next Date</Label>
                    <Input type="date" value={form.next_date} onChange={e => setForm({ ...form, next_date: e.target.value })} className="h-8 text-sm" />
                  </div>
                </div>

                <Button onClick={handleAdd} size="sm" className="w-full gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" /> Add Auto Transaction
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {autoList.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No auto transactions yet</p>
        ) : (
          <div className="space-y-1.5">
            {autoList.map((item, i) => {
              const freq = FREQ_LABELS[item.frequency] || FREQ_LABELS.monthly;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-base">{freq.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      <Badge variant="outline" className="text-[9px] px-1.5 h-4 capitalize">{freq.label}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {item.category} · next: {item.next_date ? format(parseISO(item.next_date), 'MMM d') : '—'}
                    </p>
                  </div>
                  <span className={\`text-xs font-bold \${item.type === 'income' ? 'text-green-500' : 'text-red-500'}\`}>
                    {item.type === 'income' ? '+' : '-'}\${item.amount.toFixed(2)}
                  </span>
                  <button onClick={() => onDelete(i)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
`;

fs.writeFileSync('src/components/budget/AutoTransactions.jsx', autoTx, 'utf8');
console.log('✅ AutoTransactions.jsx created');

// ─────────────────────────────────────────────────────────────────────
// 3. REWRITE src/pages/Budget.jsx
//    - Load & save auto transactions from profile
//    - Fire due auto transactions on mount
//    - Render AutoTransactions panel in sidebar
// ─────────────────────────────────────────────────────────────────────

const budget = `import React, { useState, useEffect } from 'react';
import { auth, entities } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, parseISO, addWeeks, addDays, addMonths, isToday, isBefore, isEqual } from 'date-fns';
import TransactionForm from '../components/budget/TransactionForm';
import TransactionList from '../components/budget/TransactionList';
import BudgetCalculator from '../components/budget/BudgetCalculator';
import AutoTransactions from '../components/budget/AutoTransactions';
import { XP_ACTIONS } from '../components/game/GameUtils';

function nextDateAfter(currentDate, frequency) {
  const d = parseISO(currentDate);
  if (frequency === 'weekly')   return format(addWeeks(d, 1), 'yyyy-MM-dd');
  if (frequency === 'biweekly') return format(addDays(d, 14), 'yyyy-MM-dd');
  if (frequency === 'monthly')  return format(addMonths(d, 1), 'yyyy-MM-dd');
  return currentDate;
}

export default function Budget() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

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
      badges: [], streak_days: 0, role: 'student',
    });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    return created;
  };

  // ── Fire due auto transactions on load ───────────────────────────
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
        const due = item.next_date <= today;
        if (!due) continue;

        // Check if already logged today for this auto item
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
        toast.info(\`Auto: "\${item.title}" logged for \${item.next_date}\`);
      }

      if (updated) {
        await entities.UserProfile.update(profile.id, { auto_transactions: newList });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    })();
  }, [profile?.id, user?.id]);

  const handleAddTransaction = async (data) => {
    await entities.Transaction.create({ ...data, created_by: user?.id });
    const p = await ensureProfile();
    const newXP = (p.xp || 0) + XP_ACTIONS.LOG_TRANSACTION;
    const badges = [...(p.badges || [])];
    const txCount = transactions.length + 1;
    if (txCount === 1 && !badges.includes('first_track')) badges.push('first_track');
    if (txCount >= 10 && !badges.includes('penny_wise')) badges.push('penny_wise');
    await entities.UserProfile.update(p.id, { xp: newXP, badges });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success(\`+\${XP_ACTIONS.LOG_TRANSACTION} XP earned!\`);
    setShowForm(false);
  };

  const handleSaveBudget = async (budgetData) => {
    const p = await ensureProfile();
    await entities.UserProfile.update(p.id, budgetData);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success('Budget plan saved!');
  };

  const handleAddAuto = async (item) => {
    const p = await ensureProfile();
    const current = p.auto_transactions || [];
    const newItem = { ...item, id: Date.now().toString() };
    await entities.UserProfile.update(p.id, { auto_transactions: [...current, newItem] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success(\`"\${item.title}" will auto-log \${item.frequency}!\`);
  };

  const handleDeleteAuto = async (index) => {
    const p = await ensureProfile();
    const current = [...(p.auto_transactions || [])];
    current.splice(index, 1);
    await entities.UserProfile.update(p.id, { auto_transactions: current });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success('Auto transaction removed');
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Budget Tracker</h1>
        <Button data-tutorial="btn-add-transaction" onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Add Transaction'}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <TransactionForm onSubmit={handleAddTransaction} onCancel={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TransactionList transactions={transactions} />
        </div>
        <div className="space-y-4">
          <AutoTransactions
            autoList={profile?.auto_transactions || []}
            onAdd={handleAddAuto}
            onDelete={handleDeleteAuto}
          />
          <BudgetCalculator profile={profile} onSave={handleSaveBudget} />
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Budget.jsx', budget, 'utf8');
console.log('✅ Budget.jsx rewritten (auto transaction engine added)');

console.log('\n📋 IMPORTANT — run this SQL in your Supabase dashboard:');
console.log(`
-- Add columns needed for auto transactions
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS auto_transactions jsonb DEFAULT '[]'::jsonb;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_auto boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_id text;
`);

console.log('\n🎉 Done! Run: npm run dev');
