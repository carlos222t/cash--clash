import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, TrendingUp, CheckCircle, Calendar, DollarSign, Loader2 } from 'lucide-react';

const t = {
  gold:        '#B8973A',
  goldLight:   '#D4AF5A',
  goldDim:     'rgba(184,151,58,0.15)',
  goldBorder:  'rgba(184,151,58,0.25)',
  dark:        '#0C0C0E',
  surface:     '#111114',
  surfaceAlt:  '#16161A',
  border:      'rgba(255,255,255,0.07)',
  borderGold:  'rgba(184,151,58,0.3)',
  textPrimary: '#F0EDE6',
  textMuted:   'rgba(240,237,230,0.45)',
  textDim:     'rgba(240,237,230,0.25)',
};

function CCInput({ id, label, placeholder, value, onChange, type = 'text', inputMode }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted, marginBottom: 7 }}>
        {label}
      </label>
      <input
        id={id} type={type} inputMode={inputMode} required
        placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: '100%', boxSizing: 'border-box', background: t.surface, border: '1px solid ' + t.border, borderRadius: 9, color: t.textPrimary, fontSize: 13, padding: '10px 14px', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
        onFocus={e => e.target.style.borderColor = t.borderGold}
        onBlur={e => e.target.style.borderColor = t.border}
      />
    </div>
  );
}

function StatPill({ label, value, icon: Icon }) {
  return (
    <div style={{ background: t.surface, border: '1px solid ' + t.border, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {Icon && <Icon style={{ width: 12, height: 12, color: t.gold }} />}
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.textMuted, margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: t.textPrimary, fontFamily: 'Cormorant Garamond, serif', margin: 0 }}>{value}</p>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 8) return '#7EB88A';
  if (score >= 5) return t.gold;
  return '#E07070';
}

// ── Call the AI in TWO small requests to avoid large JSON parsing issues ──
async function callClaude(systemPrompt, userPrompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error('API error ' + res.status);
  const data = await res.json();
  return (data?.content?.[0]?.text ?? '').trim();
}

function safeParseArray(text) {
  // Pull out the first [...] block
  const start = text.indexOf('[');
  const end   = text.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  let s = text.slice(start, end + 1);
  // Remove trailing commas
  s = s.replace(/,\s*([\]}])/g, '$1');
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}

function safeParseObj(text) {
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1) return {};
  let s = text.slice(start, end + 1);
  s = s.replace(/,\s*([\]}])/g, '$1');
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

async function analyzeGoal({ goal, age, income }) {
  const context = 'Goal: ' + goal + ' | Age: ' + age + ' | Annual income USD: ' + income;

  // ── Request 1: core stats (tiny, safe JSON) ──
  const statsSystem = 'You are a US personal finance analyst. Reply with ONLY a JSON object on one line, no markdown, no explanation. Keys: category (string), amount (integer USD), timelineMonths (integer), score (integer 1-10), verdict (string under 40 words, no quotes inside), assumptions (string under 30 words, no quotes inside).';
  const statsPrompt = context + '\n\nOne-line JSON only:';
  const statsRaw    = await callClaude(statsSystem, statsPrompt);
  const stats       = safeParseObj(statsRaw);

  // ── Request 2: steps + milestones (separate call, smaller chunks) ──
  const planSystem = 'You are a US personal finance analyst. Reply with ONLY a JSON object on one line, no markdown, no explanation. Keys: steps (array of 5 objects each with "title" string under 6 words and "detail" string under 20 words), milestones (array of 4 objects each with "label" string, "detail" string under 15 words, "amount" integer). No nested quotes. No trailing commas.';
  const planPrompt  = context + '\n\nOne-line JSON only:';
  const planRaw     = await callClaude(planSystem, planPrompt);
  const plan        = safeParseObj(planRaw);

  const amount         = Number(stats.amount) || 0;
  const timelineMonths = Math.max(1, Number(stats.timelineMonths) || 12);

  return {
    category:      String(stats.category || 'General'),
    amount,
    timelineMonths,
    monthlySave:   amount / timelineMonths,
    score:         Math.min(10, Math.max(1, Number(stats.score) || 5)),
    verdict:       String(stats.verdict || ''),
    assumptions:   String(stats.assumptions || ''),
    steps: Array.isArray(plan.steps)
      ? plan.steps.slice(0, 5).map(s => ({ title: String(s?.title || ''), detail: String(s?.detail || '') }))
      : [],
    milestones: Array.isArray(plan.milestones)
      ? plan.milestones.slice(0, 4).map(m => ({ label: String(m?.label || ''), detail: String(m?.detail || ''), amount: Number(m?.amount) || 0 }))
      : [],
  };
}

export default function GoalGuide() {
  const [goal, setGoal]       = useState('');
  const [age, setAge]         = useState('');
  const [income, setIncome]   = useState('');
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [error, setError]     = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setPlan(null);
    setLoading(true);
    setLoadMsg('Scoring your goal...');
    try {
      // Small delay so the first message shows
      await new Promise(r => setTimeout(r, 300));
      setLoadMsg('Building your plan...');
      const result = await analyzeGoal({ goal, age: Number(age), income: Number(income) });
      setPlan(result);
    } catch (err) {
      setError(err?.message || 'Something went wrong — please try again.');
    } finally {
      setLoading(false);
      setLoadMsg('');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: t.dark, color: t.textPrimary, fontFamily: 'DM Sans, Helvetica Neue, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=swap');
        .ccgg * { box-sizing: border-box; }
        .ccgg input::placeholder { color: rgba(240,237,230,0.22); }
        @keyframes ccspin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        .ccspin { animation: ccspin 1s linear infinite; }
      `}</style>

      <div className="ccgg" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,' + t.gold + ',transparent)', marginBottom: 28, opacity: 0.5 }} />
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(26px,5vw,42px)', fontWeight: 700, color: t.textPrimary, margin: '0 0 10px', lineHeight: 1.15 }}>
            Reality-check your <span style={{ color: t.gold }}>financial goal.</span>
          </h1>
          <p style={{ fontSize: 13, color: t.textMuted, maxWidth: 480, lineHeight: 1.7, margin: 0 }}>
            Tell us your goal, age, and income. We'll score how realistic it is and hand you a step-by-step plan.
          </p>
        </motion.div>

        {/* FORM */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <form onSubmit={onSubmit} style={{ background: t.surfaceAlt, border: '1px solid ' + t.borderGold, borderRadius: 16, padding: '24px 22px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle,' + t.goldDim + ',transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
              <CCInput id="goal" label="Financial goal" placeholder="Buy a house, retire by 55, pay off student loans..." value={goal} onChange={e => setGoal(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <CCInput id="age" label="Your age" type="number" inputMode="numeric" placeholder="25" value={age} onChange={e => setAge(e.target.value)} />
                <CCInput id="income" label="Annual income (USD)" type="number" inputMode="numeric" placeholder="65000" value={income} onChange={e => setIncome(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: loading ? 'rgba(184,151,58,0.45)' : 'linear-gradient(135deg,' + t.gold + ',' + t.goldLight + ')', color: '#0C0C0E', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                {loading
                  ? <><Loader2 className="ccspin" style={{ width: 14, height: 14 }} />{loadMsg}</>
                  : <><Zap style={{ width: 14, height: 14 }} />Score my goal</>}
              </button>
              {error && <p style={{ fontSize: 12, color: '#E07070', textAlign: 'center', margin: 0 }}>{error}</p>}
            </div>
          </form>
        </motion.div>

        {/* RESULTS */}
        <AnimatePresence>
          {plan && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Score */}
              <div style={{ background: t.surfaceAlt, border: '1px solid ' + t.borderGold, borderRadius: 16, padding: '24px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg,transparent,' + t.gold + ',transparent)', opacity: 0.6 }} />
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.textMuted, marginBottom: 6 }}>Realism Score</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 700, color: scoreColor(plan.score), lineHeight: 1 }}>{plan.score}</span>
                      <span style={{ fontSize: 20, color: t.textMuted }}>/10</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: (plan.score * 10) + '%' }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: 'linear-gradient(90deg,' + scoreColor(plan.score) + ',' + (plan.score >= 8 ? '#A8D8B0' : plan.score >= 5 ? t.goldLight : '#E89090') + ')', borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
                {plan.verdict && <p style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.7, marginBottom: 20 }}>{plan.verdict}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                  <StatPill label="Category"       value={plan.category}                                        icon={Target} />
                  <StatPill label="Estimated Cost"  value={'$' + plan.amount.toLocaleString()}                  icon={DollarSign} />
                  <StatPill label="Timeline"        value={plan.timelineMonths + ' months'}                     icon={Calendar} />
                  <StatPill label="Monthly Save"    value={'$' + Math.round(plan.monthlySave).toLocaleString()} icon={TrendingUp} />
                </div>
                {plan.assumptions && (
                  <p style={{ fontSize: 11, color: t.textDim, marginTop: 14, lineHeight: 1.6, borderTop: '1px solid ' + t.border, paddingTop: 12 }}>
                    Assumptions: {plan.assumptions}
                  </p>
                )}
              </div>

              {/* Steps */}
              {plan.steps.length > 0 && (
                <div style={{ background: t.surfaceAlt, border: '1px solid ' + t.border, borderRadius: 16, padding: 22 }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: t.textPrimary, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle style={{ width: 16, height: 16, color: t.gold }} /> Your step-by-step plan
                  </h2>
                  <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {plan.steps.map((s, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} style={{ display: 'flex', gap: 14 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid ' + t.borderGold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: t.gold, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, margin: '0 0 3px' }}>{s.title}</p>
                          <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6, margin: 0 }}>{s.detail}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Milestones */}
              {plan.milestones.length > 0 && (
                <div style={{ background: t.surfaceAlt, border: '1px solid ' + t.border, borderRadius: 16, padding: 22 }}>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, color: t.textPrimary, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar style={{ width: 16, height: 16, color: t.gold }} /> Realistic timeline
                  </h2>
                  <div>
                    {plan.milestones.map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '12px 0', borderBottom: i < plan.milestones.length - 1 ? '1px solid ' + t.border : 'none' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, margin: '0 0 2px' }}>{m.label}</p>
                          <p style={{ fontSize: 11, color: t.textMuted, margin: 0 }}>{m.detail}</p>
                        </div>
                        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: t.gold, flexShrink: 0 }}>
                          {'$' + m.amount.toLocaleString()}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => { setPlan(null); setGoal(''); setAge(''); setIncome(''); }}
                style={{ background: 'transparent', border: '1px solid ' + t.border, borderRadius: 9, color: t.textMuted, fontSize: 12, fontWeight: 500, padding: '9px 18px', cursor: 'pointer', alignSelf: 'center', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = t.borderGold}
                onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                Analyze another goal
              </button>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}