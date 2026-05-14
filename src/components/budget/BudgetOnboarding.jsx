import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ArrowRight, Upload, Sparkles, X } from 'lucide-react';

const tokens = {
  gold:        '#B8973A',
  goldLight:   '#D4AF5A',
  goldDim:     'rgba(184,151,58,0.15)',
  goldBorder:  'rgba(184,151,58,0.3)',
  dark:        '#0C0C0E',
  surface:     '#111114',
  surfaceAlt:  '#16161A',
  border:      'rgba(255,255,255,0.07)',
  textPrimary: '#F0EDE6',
  textMuted:   'rgba(240,237,230,0.45)',
  textDim:     'rgba(240,237,230,0.25)',
};

const STEPS = ['salary', 'transaction'];

export default function BudgetOnboarding({ onComplete, onOpenTransactionForm, onSalary }) {
  const [step, setStep] = useState(0);
  const [salary, setSalary] = useState('');
  const [salaryError, setSalaryError] = useState('');
  const [salarySubmitted, setSalarySubmitted] = useState(false);

  const currentStep = STEPS[step];

  const handleSalarySubmit = () => {
    const val = parseFloat(salary.replace(/[^0-9.]/g, ''));
    if (!val || val <= 0) {
      setSalaryError('Please enter a valid monthly salary.');
      return;
    }
    setSalaryError('');
    setSalarySubmitted(true);
    // Save salary without closing modal
    if (onSalary) onSalary({ monthly_income: val });
    // Advance to step 2
    setTimeout(() => setStep(1), 700);
  };

  const handleOpenTransaction = () => {
    onOpenTransactionForm();
    // Dismiss modal after directing user
    setTimeout(() => onComplete(null), 300);
  };

  const handleSkip = () => {
    onComplete(null);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="onboarding-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(12,12,14,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');
          .ob-input:focus { outline: none; border-color: #B8973A !important; box-shadow: 0 0 0 3px rgba(184,151,58,0.15) !important; }
          .ob-btn-primary { transition: background 0.15s, box-shadow 0.15s, transform 0.1s; }
          .ob-btn-primary:hover { background: #D4AF5A !important; box-shadow: 0 0 24px rgba(184,151,58,0.35) !important; }
          .ob-btn-primary:active { transform: scale(0.97); }
          .ob-btn-ghost:hover { border-color: rgba(184,151,58,0.4) !important; color: #F0EDE6 !important; }
          .ob-skip:hover { color: rgba(240,237,230,0.7) !important; }
        `}</style>

        {/* Modal card */}
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          style={{
            width: '100%',
            maxWidth: 460,
            background: tokens.surfaceAlt,
            border: `1px solid ${tokens.goldBorder}`,
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,151,58,0.1)',
          }}
        >
          {/* Top gold glow line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #B8973A 40%, #D4AF5A 60%, transparent)',
            opacity: 0.8,
          }} />

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="ob-skip"
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              cursor: 'pointer',
              color: tokens.textDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4,
              borderRadius: 6,
              transition: 'color 0.15s',
              zIndex: 2,
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>

          {/* Step indicator */}
          <div style={{
            display: 'flex', gap: 6,
            padding: '22px 24px 0',
          }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                height: 3,
                flex: 1,
                borderRadius: 99,
                background: i <= step
                  ? tokens.gold
                  : 'rgba(255,255,255,0.1)',
                transition: 'background 0.4s ease',
              }} />
            ))}
          </div>

          {/* ── STEP 1: SALARY ──────────────────────────────────────── */}
          {currentStep === 'salary' && (
            <div style={{ padding: '28px 28px 32px' }}>
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
                style={{
                  width: 52, height: 52,
                  borderRadius: 14,
                  background: tokens.goldDim,
                  border: `1px solid ${tokens.goldBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Sparkles style={{ width: 22, height: 22, color: tokens.gold }} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                style={{
                  margin: '0 0 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: tokens.gold,
                }}
              >
                Welcome to Budget Tracker
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                style={{
                  margin: '0 0 8px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  fontSize: 28,
                  color: tokens.textPrimary,
                  lineHeight: 1.15,
                }}
              >
                What's your predicted<br />monthly salary?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 }}
                style={{
                  margin: '0 0 24px',
                  fontSize: 13,
                  color: tokens.textMuted,
                  lineHeight: 1.6,
                }}
              >
                This sets your income baseline so Cash Clash can calculate your budget and track your progress.
              </motion.p>

              {/* Salary input */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                style={{ position: 'relative', marginBottom: 8 }}
              >
                <span style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: tokens.gold,
                  fontSize: 16,
                  fontWeight: 600,
                  pointerEvents: 'none',
                }}>$</span>
                <input
                  className="ob-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 4500"
                  value={salary}
                  onChange={e => { setSalary(e.target.value); setSalaryError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSalarySubmit()}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 32px',
                    background: tokens.surface,
                    border: `1px solid ${salaryError ? '#E06C75' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10,
                    color: tokens.textPrimary,
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                />
              </motion.div>

              {salaryError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ margin: '0 0 12px', fontSize: 12, color: '#E06C75' }}
                >
                  {salaryError}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                style={{ marginTop: 20, display: 'flex', gap: 10 }}
              >
                <button
                  onClick={handleSalarySubmit}
                  className="ob-btn-primary"
                  style={{
                    flex: 1,
                    padding: '13px 20px',
                    background: salarySubmitted ? 'rgba(184,151,58,0.7)' : tokens.gold,
                    border: 'none',
                    borderRadius: 10,
                    color: '#0C0C0E',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {salarySubmitted ? (
                    <>✓ Saved</>
                  ) : (
                    <>Set Income <ArrowRight style={{ width: 15, height: 15 }} /></>
                  )}
                </button>
              </motion.div>

              <p
                onClick={handleSkip}
                className="ob-skip"
                style={{
                  textAlign: 'center',
                  marginTop: 14,
                  fontSize: 12,
                  color: tokens.textDim,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                Skip for now
              </p>
            </div>
          )}

          {/* ── STEP 2: ADD FIRST TRANSACTION ───────────────────────── */}
          {currentStep === 'transaction' && (
            <div style={{ padding: '28px 28px 32px' }}>
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
                style={{
                  width: 52, height: 52,
                  borderRadius: 14,
                  background: tokens.goldDim,
                  border: `1px solid ${tokens.goldBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Upload style={{ width: 22, height: 22, color: tokens.gold }} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                style={{
                  margin: '0 0 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: tokens.gold,
                }}
              >
                One more thing
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                style={{
                  margin: '0 0 8px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  fontSize: 28,
                  color: tokens.textPrimary,
                  lineHeight: 1.15,
                }}
              >
                Log your most recent<br />transaction
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 }}
                style={{
                  margin: '0 0 28px',
                  fontSize: 13,
                  color: tokens.textMuted,
                  lineHeight: 1.6,
                }}
              >
                Add your first transaction to kick off your budget. Even one entry helps Cash Clash understand your spending patterns.
              </motion.p>

              {/* Visual hint card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                style={{
                  background: tokens.surface,
                  border: `1px solid rgba(255,255,255,0.07)`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'rgba(126,184,138,0.12)',
                  border: '1px solid rgba(126,184,138,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <DollarSign style={{ width: 16, height: 16, color: '#7EB88A' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 2 }}>
                    Grocery run, paycheck, coffee…
                  </div>
                  <div style={{ fontSize: 12, color: tokens.textMuted }}>
                    Anything counts. Income or expense.
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                style={{ display: 'flex', gap: 10, flexDirection: 'column' }}
              >
                <button
                  onClick={handleOpenTransaction}
                  className="ob-btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    background: tokens.gold,
                    border: 'none',
                    borderRadius: 10,
                    color: '#0C0C0E',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Add Transaction <ArrowRight style={{ width: 15, height: 15 }} />
                </button>

                <button
                  onClick={() => onComplete(null)}
                  className="ob-btn-ghost"
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'transparent',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    borderRadius: 10,
                    color: tokens.textMuted,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                >
                  I'll do it later
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
