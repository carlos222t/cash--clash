import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { format } from 'date-fns';

const gold    = '#B8973A';
const green   = '#7EB88A';
const red     = '#C0606A';
const surface = '#111114';
const textMuted   = 'rgba(240,237,230,0.45)';
const textPrimary = '#F0EDE6';
const border      = 'rgba(255,255,255,0.07)';

const CATEGORIES = [
  { key: 'housing',       label: 'Housing / Rent'   },
  { key: 'food',          label: 'Food & Groceries'  },
  { key: 'transport',     label: 'Transportation'    },
  { key: 'utilities',     label: 'Utilities'         },
  { key: 'education',     label: 'Education'         },
  { key: 'entertainment', label: 'Entertainment'     },
  { key: 'savings',       label: 'Savings'           },
  { key: 'other',         label: 'Other'             },
];

// Map transaction categories to budget keys
const TX_CAT_MAP = {
  housing: 'housing', rent: 'housing',
  food: 'food', groceries: 'food', dining: 'food', restaurant: 'food',
  transport: 'transport', transportation: 'transport', gas: 'transport', transit: 'transport',
  utilities: 'utilities', electric: 'utilities', water: 'utilities', internet: 'utilities',
  education: 'education', school: 'education', tuition: 'education',
  entertainment: 'entertainment', fun: 'entertainment', subscriptions: 'entertainment',
  savings: 'savings', saving: 'savings',
  other: 'other',
};

export default function PredictedIncomePanel({ transactions = [], autoList = [], profile }) {
  const monthlyIncome    = profile?.monthly_income    || 0;
  const monthlyBudget    = profile?.monthly_budget    || 0;
  const budgetAllocations = profile?.budget_allocations || {};
  const thisMonth = format(new Date(), 'yyyy-MM');

  // ── Actual income this month ───────────────────────────────────────────────
  const actualIncome = useMemo(() => {
    let inc = 0;
    for (const tx of transactions) {
      if (!tx.date?.startsWith(thisMonth)) continue;
      if (tx.type === 'income' || tx.type === 'saving') inc += Number(tx.amount) || 0;
    }
    return inc;
  }, [transactions, thisMonth]);

  // ── Actual spending per category this month ────────────────────────────────
  const spentByCategory = useMemo(() => {
    const map = {};
    CATEGORIES.forEach(c => { map[c.key] = 0; });
    for (const tx of transactions) {
      if (!tx.date?.startsWith(thisMonth)) continue;
      if (tx.type !== 'expense') continue;
      const raw = (tx.category || 'other').toLowerCase().trim();
      const key = TX_CAT_MAP[raw] || 'other';
      map[key] = (map[key] || 0) + (Number(tx.amount) || 0);
    }
    return map;
  }, [transactions, thisMonth]);

  // ── Per-category budgeted amounts ─────────────────────────────────────────
  const budgetByCategory = useMemo(() => {
    const map = {};
    CATEGORIES.forEach(c => {
      const pct = parseFloat(budgetAllocations[c.key]) || 0;
      map[c.key] = monthlyIncome * pct / 100;
    });
    return map;
  }, [budgetAllocations, monthlyIncome]);

  // ── Income chart data (single bar: predicted vs actual) ───────────────────
  const predictedAutoIncome = useMemo(() =>
    autoList.filter(a => a.type === 'income').reduce((s, a) => s + Number(a.amount || 0), 0),
  [autoList]);
  const predictedIncome = monthlyIncome + predictedAutoIncome;

  const incomeChartData = [
    { name: 'Predicted', value: predictedIncome,  color: gold  },
    { name: 'Actual',    value: actualIncome,      color: green },
  ];

  // ── Category remaining ────────────────────────────────────────────────────
  const categoryRows = CATEGORIES.map(c => {
    const budgeted = budgetByCategory[c.key] || 0;
    const spent    = spentByCategory[c.key]  || 0;
    const diff     = budgeted - spent;
    const over     = diff < 0;
    return { ...c, budgeted, spent, diff: Math.abs(diff), over };
  }).filter(c => c.budgeted > 0 || c.spent > 0);

  const totalBudgetLeft = monthlyBudget - Object.values(spentByCategory).reduce((s, v) => s + v, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#1C1C21', border: `1px solid rgba(184,151,58,0.25)`, borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: gold, fontWeight: 700 }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ margin: '2px 0', fontSize: 12, color: p.payload.color }}>
            ${Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '16px 18px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── LEFT: Income chart ─────────────────────────────────────────── */}
        <div style={{ flex: '0 0 220px', minWidth: 160 }}>
          <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Income This Month
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={incomeChartData} barCategoryGap="35%">
              <XAxis dataKey="name" tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke={border} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {incomeChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color + '55'} stroke={entry.color} strokeWidth={1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Mini stats */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 9, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Predicted</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: gold }}>${predictedIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Actual</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: green }}>${actualIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
        </div>

        {/* ── DIVIDER ────────────────────────────────────────────────────── */}
        <div style={{ width: 1, background: border, alignSelf: 'stretch', minHeight: 180 }} />

        {/* ── RIGHT: Budget left breakdown ───────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Budget Remaining
            </p>
            <div style={{
              padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: totalBudgetLeft >= 0 ? 'rgba(110,175,122,0.12)' : 'rgba(192,102,90,0.12)',
              border: `1px solid ${totalBudgetLeft >= 0 ? 'rgba(110,175,122,0.3)' : 'rgba(192,102,90,0.3)'}`,
              color: totalBudgetLeft >= 0 ? green : red,
            }}>
              {totalBudgetLeft >= 0 ? '+' : '-'}${Math.abs(totalBudgetLeft).toLocaleString(undefined, { maximumFractionDigits: 0 })} total
            </div>
          </div>

          {categoryRows.length === 0 ? (
            <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>
              Set a budget in the Budget Planner below to see category breakdown.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {categoryRows.map(row => (
                <div key={row.key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: textMuted }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'rgba(240,237,230,0.25)' }}>
                        ${row.spent.toFixed(0)} / ${row.budgeted.toFixed(0)}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: row.over ? red : green,
                        minWidth: 80, textAlign: 'right',
                      }}>
                        {row.over
                          ? `$${row.diff.toFixed(0)} Over`
                          : `$${row.diff.toFixed(0)} Left`
                        }
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: row.over ? red : row.spent / row.budgeted > 0.8 ? gold : green,
                      width: `${Math.min((row.spent / (row.budgeted || 1)) * 100, 100)}%`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
