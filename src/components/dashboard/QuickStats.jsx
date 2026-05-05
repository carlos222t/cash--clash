import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank, Target } from 'lucide-react';
import { motion } from 'framer-motion';

function StatCard({ title, value, icon: Icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-4 relative overflow-hidden group hover:shadow-lg transition-shadow">
        <div className={`absolute top-0 right-0 w-20 h-20 -mr-4 -mt-4 rounded-full opacity-10 ${color}`} />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-heading font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className="w-4 h-4 text-foreground/70" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function QuickStats({ transactions, profile }) {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyTx = (transactions || []).filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const income = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const saved = income - expenses;
  const budget = profile?.monthly_budget || 0;
  const budgetLeft = budget > 0 ? budget - expenses : saved;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard title="Income" value={`$${income.toLocaleString()}`} icon={TrendingUp} color="bg-primary" delay={0} />
      <StatCard title="Expenses" value={`$${expenses.toLocaleString()}`} icon={TrendingDown} color="bg-destructive" delay={0.05} />
      <StatCard title="Saved" value={`$${saved.toLocaleString()}`} icon={PiggyBank} color="bg-accent" delay={0.1} />
      <StatCard title="Budget Left" value={`$${budgetLeft.toLocaleString()}`} icon={Target} color="bg-chart-4" delay={0.15} />
    </div>
  );
}