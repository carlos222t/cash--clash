import React, { useState, useEffect } from 'react';
import { auth, entities, profilesApi } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Car, Home, Gamepad2, HelpCircle, Sparkles, Target, Clock, TrendingUp, CheckCircle2, AlertTriangle, ChevronRight, Trash2, PiggyBank, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const GOAL_TYPES = [
  { id: 'vehicle',       label: 'Vehicle',       icon: Car,       emoji: '🚗', desc: 'Car, truck, motorcycle, or other vehicle' },
  { id: 'real_estate',   label: 'Real Estate',   icon: Home,      emoji: '🏠', desc: 'House, condo, apartment deposit' },
  { id: 'entertainment', label: 'Entertainment', icon: Gamepad2,  emoji: '🎮', desc: 'Console, trip, event, hobby gear' },
  { id: 'other',         label: 'Other',         icon: HelpCircle,emoji: '🎯', desc: 'Anything else you want to save for' },
];

const REALISM_CONFIG = {
  very_hard:  { label: 'Very Difficult',  color: 'text-red-500',    bg: 'bg-red-500/10 border-red-500/20',    bar: 'bg-red-500',    pct: 15 },
  hard:       { label: 'Challenging',     color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-500', pct: 40 },
  moderate:   { label: 'Achievable',      color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-500', pct: 65 },
  easy:       { label: 'Very Realistic',  color: 'text-green-500',  bg: 'bg-green-500/10 border-green-500/20',  bar: 'bg-green-500',  pct: 90 },
};

function getRealismLevel(monthlySavingsNeeded, monthlyIncome, monthlyNecessities) {
  const disposable = monthlyIncome - monthlyNecessities;
  if (disposable <= 0) return 'very_hard';
  const ratio = monthlySavingsNeeded / disposable;
  if (ratio > 0.8) return 'very_hard';
  if (ratio > 0.55) return 'hard';
  if (ratio > 0.3) return 'moderate';
  return 'easy';
}

function GoalCard({ goal, onDelete, transactions }) {
  const typeInfo = GOAL_TYPES.find(t => t.id === goal.goal_type) || GOAL_TYPES[3];
  const saved = (transactions || [])
    .filter(t => t.goal_id === goal.id && t.type === 'income')
    .reduce((s, t) => s + (t.amount || 0), 0);
  const pct = Math.min(100, Math.round((saved / goal.target_amount) * 100));
  const monthsLeft = goal.estimated_months ? Math.max(0, goal.estimated_months - Math.round(saved / (goal.monthly_savings_target || 1))) : null;
  const realism = REALISM_CONFIG[goal.realism_level] || REALISM_CONFIG.moderate;

  return (
    <Card className="overflow-hidden hover:border-primary/20 transition-colors">
      <div className="h-1.5 w-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{typeInfo.emoji}</span>
            <div>
              <h3 className="font-heading font-bold text-sm leading-tight">{goal.title}</h3>
              <p className="text-xs text-muted-foreground">${(goal.target_amount || 0).toLocaleString()} goal</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${realism.bg} ${realism.color} border`}>{realism.label}</Badge>
            <button onClick={() => onDelete(goal.id)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Saved</span>
            <span className="font-semibold text-primary">{pct}% · ${saved.toFixed(0)} of ${(goal.target_amount || 0).toLocaleString()}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <p className="text-xs font-bold">${(goal.monthly_savings_target || 0).toFixed(0)}/mo</p>
            <p className="text-[10px] text-muted-foreground">Save monthly</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <p className="text-xs font-bold">{monthsLeft !== null ? `~${monthsLeft} mo` : `${goal.estimated_months} mo`}</p>
            <p className="text-[10px] text-muted-foreground">Est. time left</p>
          </div>
        </div>

        {goal.ai_plan && (
          <details className="group">
            <summary className="text-xs text-primary font-medium cursor-pointer flex items-center gap-1 list-none hover:underline">
              <Sparkles className="w-3 h-3" /> View AI Plan <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed bg-muted/40 rounded-xl p-3 whitespace-pre-wrap">
              {goal.ai_plan}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export default function Goals() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [step, setStep] = useState('list'); // 'list' | 'create' | 'result'
  const [selectedType, setSelectedType] = useState(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      profilesApi.getByUserId(u.id).then(setProfile).catch(() => {});
    }).catch(() => {});
  }, []);

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data } = await import('@/api/supabaseClient').then(m => m.supabase)
        .then(sb => sb.from('goals').select('*').eq('created_by', user.id).order('created_at', { ascending: false }));
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => entities.Transaction.filter({ created_by: user?.id }, '-date', 200),
    enabled: !!user?.id,
    initialData: [],
  });

  const monthlyIncome = profile?.monthly_income || 0;
  const budgetAllocations = profile?.budget_allocations || {};

  // Calculate fixed/necessary expenses from budget (housing + utilities + transport + education)
  const necessityKeys = ['housing', 'utilities', 'transport', 'education'];
  const necessityPct = necessityKeys.reduce((s, k) => s + (parseFloat(budgetAllocations[k]) || 0), 0);
  const monthlyNecessities = monthlyIncome * (necessityPct / 100);

  const handleGeneratePlan = async () => {
    if (!selectedType || !targetAmount || !goalTitle) {
      toast.error('Please fill in all fields');
      return;
    }
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Please enter a valid amount'); return; }
    setLoading(true);

    try {
      const systemPrompt = `You are a concise, practical personal finance advisor for students. 
You give realistic, actionable advice. Be direct and specific with numbers. 
Always respond in the EXACT JSON format requested. No markdown, no extra text.`;

      const userPrompt = `A student wants to save for a goal. Give them a realistic plan.

GOAL:
- Type: ${selectedType}
- Name: ${goalTitle}
- Target Amount: $${amount}

CURRENT FINANCES:
- Monthly Income: $${monthlyIncome.toFixed(2)}
- Fixed/Necessary Monthly Expenses: $${monthlyNecessities.toFixed(2)} (housing, utilities, transport, education)
- Budget Breakdown: ${JSON.stringify(budgetAllocations)}
- Free/Disposable Monthly Income: $${(monthlyIncome - monthlyNecessities).toFixed(2)}

INSTRUCTIONS:
Return ONLY a valid JSON object with these exact fields:
{
  "monthly_savings_target": <number - how much they should save per month toward this goal>,
  "estimated_months": <number - realistic months to achieve the goal>,
  "realism_level": <"easy" | "moderate" | "hard" | "very_hard">,
  "adjusted_budget": {
    "housing": <number - suggested % of income>,
    "food": <number>,
    "transport": <number>,
    "utilities": <number>,
    "education": <number>,
    "entertainment": <number>,
    "savings": <number - should include goal savings>,
    "other": <number>
  },
  "where_to_save": <string - 1-2 sentences: recommend HYSA, index funds, etc. based on goal timeline>,
  "plan_summary": <string - 3-4 sentence plain-English plan. What to cut, what to save, how to stay on track. Be specific with dollar amounts.>,
  "quick_wins": <array of 3 strings - specific immediate actions they can take this week to start>
}

Rules:
- All adjusted_budget percentages must sum to exactly 100
- monthly_savings_target must be realistic given disposable income
- If income is very low (under $500/month), realism_level must be "very_hard"
- estimated_months = target_amount / monthly_savings_target (rounded up)`;

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        toast.error('Missing API key. Add VITE_ANTHROPIC_API_KEY to your .env file.');
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content || '';
      const clean = raw.replace(/```json|j```|```/g, '').trim();
      const parsed = JSON.parse(clean);

      setAiResult({
        ...parsed,
        goal_type: selectedType,
        title: goalTitle,
        target_amount: amount,
      });
      setStep('result');
    } catch (err) {
      console.error(err);
      toast.error('AI plan failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!aiResult) return;
    try {
      const { supabase } = await import('@/api/supabaseClient');
      const planText = `📋 GOAL PLAN: ${aiResult.title}
━━━━━━━━━━━━━━━━━━━━
${aiResult.plan_summary}

💾 Where to Save/Invest:
${aiResult.where_to_save}

⚡ Quick Wins This Week:
${(aiResult.quick_wins || []).map((w, i) => `${i + 1}. ${w}`).join('\n')}

📊 Adjusted Budget:
${Object.entries(aiResult.adjusted_budget || {}).map(([k, v]) => `  ${k}: ${v}%`).join('\n')}`;

      await supabase.from('goals').insert({
        created_by: user.id,
        title: aiResult.title,
        goal_type: aiResult.goal_type,
        target_amount: aiResult.target_amount,
        monthly_savings_target: aiResult.monthly_savings_target,
        estimated_months: aiResult.estimated_months,
        realism_level: aiResult.realism_level,
        adjusted_budget: aiResult.adjusted_budget,
        ai_plan: planText,
        amount_saved: 0,
        status: 'active',
      });

      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
      toast.success('Goal saved! 🎯');
      setStep('list');
      setAiResult(null);
      setSelectedType(null);
      setGoalTitle('');
      setTargetAmount('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save goal');
    }
  };

  const handleDeleteGoal = async (id) => {
    const { supabase } = await import('@/api/supabaseClient');
    await supabase.from('goals').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['goals', user?.id] });
    toast.success('Goal removed');
  };

  const realism = aiResult ? REALISM_CONFIG[aiResult.realism_level] || REALISM_CONFIG.moderate : null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Goals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Set a goal — AI builds your personalized savings plan</p>
        </div>
        {step === 'list' && (
          <Button size="sm" className="gap-2" onClick={() => setStep('create')}>
            <Sparkles className="w-4 h-4" /> New Goal
          </Button>
        )}
        {step !== 'list' && (
          <Button size="sm" variant="outline" onClick={() => { setStep('list'); setAiResult(null); }}>
            ← Back
          </Button>
        )}
      </div>

      {/* No income warning */}
      {step === 'create' && monthlyIncome === 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You haven't set a monthly income yet. Go to <strong>Budget → Budget Calculator</strong> and save your income first for the most accurate AI plan.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── LIST VIEW ── */}
        {step === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {goals.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center space-y-4">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground/20" />
                  <div>
                    <p className="text-sm font-medium">No goals yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create your first goal and let AI build you a budget plan to reach it.</p>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => setStep('create')}>
                    <Sparkles className="w-4 h-4" /> Create First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {goals.map((g, i) => (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <GoalCard goal={g} onDelete={handleDeleteGoal} transactions={transactions} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── CREATE VIEW ── */}
        {step === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Step 1: Goal Type */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Step 1 — What are you saving for?</h2>
              <div className="grid grid-cols-2 gap-3">
                {GOAL_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all hover:border-primary/40 ${selectedType === type.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'}`}
                  >
                    <span className="text-3xl block mb-2">{type.emoji}</span>
                    <p className="text-sm font-bold">{type.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Details */}
            {selectedType && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Step 2 — Goal details</h2>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label>Goal Name</Label>
                      <Input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder={`e.g. ${selectedType === 'vehicle' ? 'Used Honda Civic' : selectedType === 'real_estate' ? 'Apartment down payment' : selectedType === 'entertainment' ? 'PlayStation 6' : 'Emergency Fund'}`} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target Amount ($)</Label>
                      <Input type="number" min="1" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="e.g. 5000" />
                    </div>

                    {/* Income preview */}
                    {monthlyIncome > 0 && (
                      <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your finances (from Budget)</p>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Monthly income</span><span className="font-medium">${monthlyIncome.toFixed(0)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Fixed necessities</span><span className="font-medium text-red-500">−${monthlyNecessities.toFixed(0)}</span></div>
                        <div className="flex justify-between text-xs border-t border-border pt-1 mt-1"><span className="font-semibold">Disposable</span><span className="font-bold text-primary">${(monthlyIncome - monthlyNecessities).toFixed(0)}</span></div>
                      </div>
                    )}

                    <Button onClick={handleGeneratePlan} className="w-full gap-2" disabled={loading || !goalTitle || !targetAmount}>
                      {loading
                        ? <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Building your plan...</>
                        : <><Sparkles className="w-4 h-4" /> Generate AI Plan</>
                      }
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── RESULT VIEW ── */}
        {step === 'result' && aiResult && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Realism meter */}
            <Card className={`border ${realism.bg}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className={`w-4 h-4 ${realism.color}`} />
                    <span className="text-sm font-bold">Realism Meter</span>
                  </div>
                  <Badge className={`${realism.bg} ${realism.color} border font-bold`}>{realism.label}</Badge>
                </div>
                <div className="h-3 bg-background/60 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${realism.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${realism.bar} rounded-full`}
                  />
                </div>
                {aiResult.realism_level === 'very_hard' && (
                  <p className="text-xs text-red-500 mt-2 flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    Your current income may be too low to reach this goal in a reasonable time. Consider a smaller goal first or increasing income.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Key numbers */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: PiggyBank, label: 'Save Monthly',   value: `$${(aiResult.monthly_savings_target || 0).toFixed(0)}`, color: 'text-primary' },
                { icon: Clock,     label: 'Est. Months',    value: aiResult.estimated_months || '—',                           color: 'text-accent' },
                { icon: TrendingUp,label: 'Goal Amount',    value: `$${(aiResult.target_amount || 0).toLocaleString()}`,    color: 'text-chart-2' },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-3 text-center">
                    <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                    <p className={`text-lg font-heading font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Plan summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Your AI Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{aiResult.plan_summary}</p>

                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                  <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Where to Save/Invest</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{aiResult.where_to_save}</p>
                </div>

                {aiResult.quick_wins?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">⚡ Quick Wins This Week</p>
                    {aiResult.quick_wins.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{w}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Adjusted budget */}
            {aiResult.adjusted_budget && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Suggested Budget Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {Object.entries(aiResult.adjusted_budget).map(([key, pct]) => {
                    const current = parseFloat(budgetAllocations[key]) || 0;
                    const diff = parseFloat(pct) - current;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs capitalize w-24 text-muted-foreground flex-shrink-0">{key}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-primary/60 rounded-full"
                          />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{pct}%</span>
                        {current > 0 && diff !== 0 && (
                          <span className={`text-[10px] w-10 text-right flex-shrink-0 ${diff > 0 ? 'text-green-500' : 'text-red-400'}`}>
                            {diff > 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Button onClick={handleSaveGoal} className="w-full gap-2" size="lg">
              <Target className="w-4 h-4" /> Save Goal & Start Tracking
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
