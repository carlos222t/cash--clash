import React from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, ShoppingCart, Car, Tv, GraduationCap, Home, Zap, PiggyBank, Briefcase, Monitor, Gift, MoreHorizontal, RefreshCw } from 'lucide-react';

const CATEGORY_ICONS = {
  food: ShoppingCart, transport: Car, entertainment: Tv, education: GraduationCap,
  housing: Home, utilities: Zap, savings: PiggyBank, salary: Briefcase,
  freelance: Monitor, allowance: Gift, subscription: RefreshCw, other: MoreHorizontal,
};

const t = {
  gold:'#B8973A', goldDim:'rgba(184,151,58,0.15)', goldBorder:'rgba(184,151,58,0.3)',
  surfaceAlt:'#16161A', border:'rgba(255,255,255,0.07)',
  text:'#F0EDE6', muted:'rgba(240,237,230,0.45)',
  green:'#6EAF7A', greenDim:'rgba(110,175,122,0.15)', greenBorder:'rgba(110,175,122,0.3)',
  red:'#C0665A', redDim:'rgba(192,102,90,0.15)', redBorder:'rgba(192,102,90,0.3)',
};

export default function RecentActivity({ transactions }) {
  const recent = (transactions || []).slice(0, 8);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`.cc-ra-row:hover { background: rgba(255,255,255,0.03) !important; }`}</style>
      {recent.length === 0 ? (
        <p style={{ fontSize: 13, color: t.muted, textAlign: 'center', padding: '16px 0', margin: 0 }}>
          No transactions yet. Start tracking!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recent.map(tx => {
            const Icon = CATEGORY_ICONS[tx.category] || MoreHorizontal;
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id} className="cc-ra-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9, transition: 'background 0.15s' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isIncome ? t.greenDim : t.redDim, border: `1px solid ${isIncome ? t.greenBorder : t.redBorder}` }}>
                  <Icon style={{ width: 13, height: 13, color: isIncome ? t.green : t.red }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: t.muted }}>{format(new Date(tx.date), 'MMM d')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 700, color: isIncome ? t.green : t.red, flexShrink: 0 }}>
                  {isIncome ? <ArrowUpRight style={{ width: 12, height: 12 }} /> : <ArrowDownRight style={{ width: 12, height: 12 }} />}
                  ${tx.amount.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}