import React, { useState } from 'react';
import { PiggyBank, TrendingUp } from 'lucide-react';

const tk = {
  gold:         '#B8973A',
  goldLight:    '#D4AF5A',
  goldDim:      'rgba(184,151,58,0.15)',
  goldBorder:   'rgba(184,151,58,0.3)',
  surface:      '#111114',
  surfaceAlt:   '#16161A',
  border:       'rgba(255,255,255,0.07)',
  text:         '#F0EDE6',
  muted:        'rgba(240,237,230,0.45)',
  dim:          'rgba(240,237,230,0.22)',
  emerald:      '#50C878',
  emeraldDim:   'rgba(80,200,120,0.15)',
  emeraldBorder:'rgba(80,200,120,0.35)',
  diamond:      '#B9F2FF',
  diamondDim:   'rgba(185,242,255,0.12)',
  diamondBorder:'rgba(185,242,255,0.35)',
};

const SAVE_CATEGORIES = ['Savings', 'Investments', 'Emergency Fund', 'Retirement', 'Other'];
const TIERS = [0, 100, 500, 2000, 10000];

export function getSavingsTier(totalSaved) {
  if (totalSaved >= 10000) return {
    label: 'Diamond',
    color: tk.diamond,
    glow: true,
    textShadow: `0 0 12px ${tk.diamond}, 0 0 28px rgba(185,242,255,0.5)`,
    iconColor: tk.diamond,
  };
  if (totalSaved >= 2000) return {
    label: 'Diamond',
    color: tk.diamond,
    glow: false,
    textShadow: 'none',
    iconColor: tk.diamond,
  };
  if (totalSaved >= 500) return {
    label: 'Emerald',
    color: tk.emerald,
    glow: false,
    textShadow: 'none',
    iconColor: tk.emerald,
  };
  if (totalSaved >= 100) return {
    label: 'Gold',
    color: tk.gold,
    glow: false,
    textShadow: 'none',
    iconColor: tk.gold,
  };
  return {
    label: 'Starter',
    color: tk.text,
    glow: false,
    textShadow: 'none',
    iconColor: tk.muted,
  };
}

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  color: tk.muted,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 5,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: tk.surface,
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 8,
  padding: '9px 12px',
  color: tk.text,
  fontSize: 13,
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
};

export default function SavingsTracker({ onSubmit, totalSaved = 0 }) {
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('Savings');
  const [note,     setNote]     = useState('');
  const [loading,  setLoading]  = useState(false);

  const tier = getSavingsTier(totalSaved);
  const nextThreshold = TIERS.find(t => t > totalSaved) || 10000;
  const prevThreshold = [...TIERS].reverse().find(t => t <= totalSaved) || 0;
  const progress = nextThreshold === prevThreshold
    ? 100
    : Math.round(((totalSaved - prevThreshold) / (nextThreshold - prevThreshold)) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    setLoading(true);
    await onSubmit({
      title: note || category,
      amount: Number(amount),
      category: category.toLowerCase(),
      type: 'expense',
      is_saving: true,
      date: new Date().toISOString().split('T')[0],
      notes: note,
    });
    setAmount('');
    setNote('');
    setLoading(false);
  };

  return (
    <div style={{ padding: '18px 18px 22px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .cc-savings-input:focus { border-color: rgba(184,151,58,0.5) !important; box-shadow: 0 0 0 3px rgba(184,151,58,0.07); }
        @keyframes cc-glow-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(185,242,255,0.25), 0 0 36px rgba(185,242,255,0.12); }
          50%       { box-shadow: 0 0 28px rgba(185,242,255,0.45), 0 0 56px rgba(185,242,255,0.22); }
        }
        .cc-glow-ring { animation: cc-glow-pulse 2.4s ease-in-out infinite; }
      `}</style>

      {/* Savings Journey panel */}
      <div
        className={tier.glow ? 'cc-glow-ring' : ''}
        style={{
          borderRadius: 12,
          background: tk.surfaceAlt,
          border: `1px solid ${tier.glow ? tk.diamond : tier.color === tk.text ? tk.border : tier.color + '55'}`,
          padding: '14px 16px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <PiggyBank style={{ width: 15, height: 15, color: tier.iconColor }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: tk.muted, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              Savings Journey
            </span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: tier.color,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 99,
            background: tier.color === tk.text ? 'rgba(255,255,255,0.06)' : tier.color + '18',
            border: `1px solid ${tier.color === tk.text ? tk.border : tier.color + '44'}`,
          }}>{tier.label}</span>
        </div>

        <p style={{
          margin: '0 0 10px',
          fontSize: 26, fontWeight: 700,
          color: tier.color,
          textShadow: tier.textShadow,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          ${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>

        {totalSaved < 10000 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: tk.dim }}>toward next tier</span>
              <span style={{ fontSize: 10, color: tk.muted, fontWeight: 600 }}>${nextThreshold.toLocaleString()}</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(progress, 100)}%`,
                borderRadius: 99,
                background: tier.color,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}
        {totalSaved >= 10000 && (
          <p style={{ margin: 0, fontSize: 11, color: tk.diamond, letterSpacing: '0.04em' }}>
            Maximum tier reached
          </p>
        )}
      </div>

      {/* Log form */}
      <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 600, color: tk.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Add Saved / Invested
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>Amount</label>
          <input
            className="cc-savings-input"
            style={{ ...inputStyle, fontSize: 16, fontWeight: 600, border: `1px solid rgba(184,151,58,0.3)` }}
            type="number" min="0.01" step="0.01" placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Category</label>
          <select
            style={inputStyle}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {SAVE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Note <span style={{ textTransform: 'none', fontWeight: 400, color: tk.dim }}>(optional)</span></label>
          <input
            className="cc-savings-input"
            style={inputStyle}
            type="text"
            placeholder="e.g. Monthly deposit"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 4,
            background: tk.gold,
            color: '#0C0C0E',
            border: 'none', borderRadius: 8,
            padding: '10px 0', width: '100%',
            fontSize: 12, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.15s, box-shadow 0.15s',
          }}
        >
          <TrendingUp style={{ width: 13, height: 13 }} />
          {loading ? 'Saving...' : 'Log Savings'}
        </button>
      </form>
    </div>
  );
}