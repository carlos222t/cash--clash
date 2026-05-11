import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

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

const EXPENSE_CATEGORIES = ['food', 'transport', 'entertainment', 'education', 'housing', 'utilities', 'savings', 'other'];
const INCOME_CATEGORIES  = ['salary', 'freelance', 'allowance', 'other'];

const inputStyle = {
  width: '100%',
  background: '#0C0C0E',
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 8,
  color: t.text,
  fontSize: 13,
  height: 36,
  padding: '0 12px',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const textareaStyle = {
  ...inputStyle,
  height: 'auto',
  padding: '8px 12px',
  resize: 'vertical',
  minHeight: 58,
};

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  color: t.muted,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 5,
};

export default function TransactionForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense', category: '',
    date: new Date().toISOString().split('T')[0], notes: '',
  });

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount) });
    setForm({ title: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0], notes: '' });
  };

  return (
    <div style={{ padding: '20px 22px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=swap');
        .cc-form-input:focus { border-color: rgba(184,151,58,0.5) !important; box-shadow: 0 0 0 3px rgba(184,151,58,0.08); }
        .cc-form-input::placeholder { color: rgba(240,237,230,0.25) !important; }
        .cc-select-trigger { background: #0C0C0E !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #F0EDE6 !important; border-radius: 8px !important; height: 36px !important; font-size: 13px !important; transition: border-color 0.15s; }
        .cc-select-trigger:hover, .cc-select-trigger:focus { border-color: rgba(184,151,58,0.4) !important; }
        .cc-select-content { background: #16161A !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; }
        .cc-select-item { color: rgba(240,237,230,0.7) !important; font-size: 13px !important; }
        .cc-select-item[data-highlighted] { background: rgba(184,151,58,0.12) !important; color: #F0EDE6 !important; }
        .cc-submit-btn:hover:not(:disabled) { background: #D4AF5A !important; box-shadow: 0 0 18px rgba(184,151,58,0.3); }
        .cc-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .cc-close-btn:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h2 style={{
          margin: 0,
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 600, fontSize: 20, color: t.text,
        }}>New Transaction</h2>
        {onCancel && (
          <button
            className="cc-close-btn"
            type="button"
            onClick={onCancel}
            style={{
              width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <X style={{ width: 14, height: 14, color: t.muted }} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 4, background: '#0C0C0E', borderRadius: 10, padding: 4 }}>
          <button
            type="button"
            onClick={() => setForm({ ...form, type: 'expense', category: '' })}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 7, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s', letterSpacing: '0.04em', textTransform: 'uppercase',
              background: form.type === 'expense' ? t.redDim : 'transparent',
              color: form.type === 'expense' ? t.red : t.muted,
              outline: form.type === 'expense' ? `1px solid ${t.redBorder}` : 'none',
            }}
          >Expense</button>
          <button
            type="button"
            onClick={() => setForm({ ...form, type: 'income', category: '' })}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 7, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s', letterSpacing: '0.04em', textTransform: 'uppercase',
              background: form.type === 'income' ? t.greenDim : 'transparent',
              color: form.type === 'income' ? t.green : t.muted,
              outline: form.type === 'income' ? `1px solid ${t.greenBorder}` : 'none',
            }}
          >Income</button>
        </div>

        {/* Title + Amount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Title</label>
            <input
              className="cc-form-input"
              style={inputStyle}
              placeholder="e.g. Groceries"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Amount ($)</label>
            <input
              className="cc-form-input"
              style={inputStyle}
              type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              className="cc-form-input"
              style={inputStyle}
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="cc-select-trigger"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent className="cc-select-content">
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="cc-select-item" style={{ textTransform: 'capitalize' }}>
                    {c.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            {/* spacer — keeps grid aligned */}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: t.dim }}>(optional)</span></label>
          <textarea
            className="cc-form-input"
            style={textareaStyle}
            placeholder="Any details..."
            rows={2}
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="cc-submit-btn"
          style={{
            width: '100%', padding: '10px', borderRadius: 8,
            background: t.gold, color: '#0C0C0E', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.15s, box-shadow 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Plus style={{ width: 13, height: 13 }} /> Add Transaction
        </button>
      </form>
    </div>
  );
}