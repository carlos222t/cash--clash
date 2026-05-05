import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// S&P 500 historical average annual return (~10% nominal, ~7% inflation-adjusted)
const SP500_RATE = 0.10;
const RETIRE_AGE = 55;

function formatMoney(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

function compoundGrowth(monthlyContrib, years, annualRate) {
  const r = annualRate / 12;
  const n = years * 12;
  // FV of annuity: PMT * ((1+r)^n - 1) / r
  return monthlyContrib * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

function getMilestones(monthlyContrib, yearsTotal) {
  const checkpoints = [0.25, 0.5, 0.75, 1].map(pct => Math.round(yearsTotal * pct)).filter((v, i, a) => a.indexOf(v) === i && v > 0);
  return checkpoints.map(y => ({
    year: y,
    value: compoundGrowth(monthlyContrib, y, SP500_RATE),
  }));
}

export default function InvestmentEstimator({ profile }) {
  const savedAge = profile?.age || '';
  const savedMonthly = profile?.monthly_income ? Math.round(profile.monthly_income * 0.1) : '';

  const [age, setAge] = useState(String(savedAge));
  const [monthly, setMonthly] = useState(String(savedMonthly));
  const [showBreakdown, setShowBreakdown] = useState(false);

  const yearsToRetire = useMemo(() => {
    const a = parseInt(age);
    if (!a || a >= RETIRE_AGE || a < 10) return null;
    return RETIRE_AGE - a;
  }, [age]);

  const result = useMemo(() => {
    const m = parseFloat(monthly);
    if (!m || m <= 0 || !yearsToRetire) return null;
    const fv = compoundGrowth(m, yearsToRetire, SP500_RATE);
    const totalContributed = m * 12 * yearsToRetire;
    const gains = fv - totalContributed;
    const milestones = getMilestones(m, yearsToRetire);
    return { fv, totalContributed, gains, milestones };
  }, [monthly, yearsToRetire]);

  const gainsPct = result ? Math.round((result.gains / result.totalContributed) * 100) : 0;

  // Progress bar segments for the breakdown chart
  const segments = result ? [
    { label: 'You invested', value: result.totalContributed, color: 'bg-primary/60' },
    { label: 'Market gains', value: result.gains, color: 'bg-accent' },
  ] : [];

  return (
    <Card className="overflow-hidden border-primary/10">
      <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          S&P 500 Investment Estimator
        </CardTitle>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Based on the S&P 500's ~10% average annual return. Estimates only — not financial advice.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Your Age</Label>
            <Input
              type="number"
              min="10" max="54"
              placeholder="e.g. 19"
              value={age}
              onChange={e => setAge(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly Investment ($)</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 100"
              value={monthly}
              onChange={e => setMonthly(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Age validation message */}
        {age && (parseInt(age) >= RETIRE_AGE || parseInt(age) < 10) && (
          <p className="text-xs text-destructive">Please enter an age between 10 and 54.</p>
        )}

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && yearsToRetire && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Hero number */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/15 p-4 text-center">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                  By age 55 ({yearsToRetire} years)
                </p>
                <motion.p
                  key={result.fv}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-heading font-bold text-primary"
                >
                  {formatMoney(result.fv)}
                </motion.p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  investing <span className="font-semibold text-foreground">${parseFloat(monthly).toLocaleString()}/mo</span> at 10%/yr
                </p>
              </div>

              {/* Stacked bar */}
              <div className="space-y-1.5">
                <div className="flex overflow-hidden rounded-full h-3">
                  {segments.map((seg, i) => {
                    const pct = (seg.value / result.fv) * 100;
                    return (
                      <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.15, ease: 'easeOut' }}
                        className={`h-full ${seg.color} ${i === 0 ? 'rounded-l-full' : 'rounded-r-full'}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/60 inline-block" /> You put in {formatMoney(result.totalContributed)}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> Market grew it +{gainsPct}%</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'You Invest',    value: formatMoney(result.totalContributed), sub: 'total deposits' },
                  { label: 'Market Gains',  value: formatMoney(result.gains),            sub: 'compound growth' },
                  { label: 'Multiplier',    value: `${(result.fv / result.totalContributed).toFixed(1)}×`,  sub: 'return on invest.' },
                ].map(s => (
                  <div key={s.label} className="bg-muted/50 rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold font-heading text-foreground">{s.value}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Milestone breakdown toggle */}
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <span className="font-medium">Growth milestones</span>
                {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {showBreakdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-1">
                      {result.milestones.map((m, i) => {
                        const ageAtMilestone = parseInt(age) + m.year;
                        const pct = Math.round((m.value / result.fv) * 100);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-14 flex-shrink-0 text-right">
                              <p className="text-[10px] font-bold text-foreground">Age {ageAtMilestone}</p>
                              <p className="text-[9px] text-muted-foreground">yr {m.year}</p>
                            </div>
                            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="h-full bg-gradient-to-r from-primary/60 to-accent rounded-full"
                              />
                            </div>
                            <p className="w-16 text-right text-[10px] font-semibold text-foreground">{formatMoney(m.value)}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-start gap-2 bg-muted/40 rounded-xl p-3">
                      <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Based on the S&P 500's historical ~10% average annual return (1957–present). Actual returns vary year to year. This is an estimate, not a guarantee. Consider consulting a financial advisor.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {!result && age && monthly && yearsToRetire && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">Enter a valid age and monthly amount to see your projection.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
