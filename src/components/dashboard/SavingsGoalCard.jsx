import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const MILESTONES = [
  { amount: 100, label: 'First $100', icon: '🌱' },
  { amount: 500, label: '$500 Saver', icon: '🏆' },
  { amount: 1000, label: 'Grand Saver', icon: '💎' },
  { amount: 2000, label: 'Cash Legend', icon: '👑' },
  { amount: 5000, label: 'Elite Saver', icon: '🚀' },
];

export default function SavingsGoalCard({ profile, transactions }) {
  const totalSaved = profile?.total_saved || 0;
  const nextMilestone = MILESTONES.find(m => totalSaved < m.amount) || MILESTONES[MILESTONES.length - 1];
  const prevMilestone = MILESTONES[MILESTONES.indexOf(nextMilestone) - 1];
  const prevAmount = prevMilestone?.amount || 0;
  const progress = Math.min(((totalSaved - prevAmount) / (nextMilestone.amount - prevAmount)) * 100, 100);

  // Monthly savings rate
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyTx = (transactions || []).filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const income = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savedThisMonth = Math.max(income - expenses, 0);
  const savingsRate = income > 0 ? Math.round((savedThisMonth / income) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-heading font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Savings Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Total Saved */}
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-3xl font-heading font-bold">${totalSaved.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm ml-1">saved</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-heading font-semibold text-primary">{nextMilestone.icon} {nextMilestone.label}</span>
              <p className="text-xs text-muted-foreground">${(nextMilestone.amount - totalSaved).toLocaleString()} to go</p>
            </div>
          </div>
          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }}>
            <Progress value={progress} className="h-3" />
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* This Month Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-sm font-semibold">${savedThisMonth.toLocaleString()} saved</p>
            </div>
          </div>
          <div className={`text-center px-3 py-1.5 rounded-lg ${savingsRate >= 20 ? 'bg-primary/10' : savingsRate >= 10 ? 'bg-chart-3/10' : 'bg-muted'}`}>
            <p className={`text-lg font-heading font-bold ${savingsRate >= 20 ? 'text-primary' : savingsRate >= 10 ? 'text-chart-3' : 'text-muted-foreground'}`}>
              {savingsRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">rate</p>
          </div>
        </div>

        {/* Milestones row */}
        <div className="flex justify-between gap-1">
          {MILESTONES.map(m => (
            <div key={m.amount} className={`flex-1 text-center text-lg transition-all ${totalSaved >= m.amount ? 'opacity-100' : 'opacity-20 grayscale'}`} title={m.label}>
              {m.icon}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}