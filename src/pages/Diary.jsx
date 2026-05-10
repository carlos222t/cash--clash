import React, { useState, useEffect } from 'react';
import { auth, supabase } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BookOpen, Plus, CheckCircle2, XCircle, ChevronLeft, Trash2 } from 'lucide-react';

/* ── Design tokens (matches app theme) ── */
const T = {
  dark:        '#0C0C0E',
  surface:     '#111114',
  surfaceAlt:  '#16161A',
  surfaceHigh: '#1C1C22',
  gold:        '#B8973A',
  goldLight:   '#D4AF5A',
  goldDim:     'rgba(184,151,58,0.12)',
  goldBorder:  'rgba(184,151,58,0.28)',
  border:      'rgba(255,255,255,0.07)',
  text:        '#F0EDE6',
  textMuted:   'rgba(240,237,230,0.45)',
  textDim:     'rgba(240,237,230,0.22)',
  success:     '#7EB88A',
  successDim:  'rgba(126,184,138,0.12)',
  successBorder:'rgba(126,184,138,0.28)',
  danger:      '#C0392B',
  dangerDim:   'rgba(192,57,43,0.10)',
  dangerBorder:'rgba(192,57,43,0.28)',
};

/* ── Steps ── */
const STEP_LIST   = 'list';
const STEP_TYPE   = 'type';
const STEP_WRITE  = 'write';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function Diary() {
  const [user, setUser]       = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep]       = useState(STEP_LIST);
  const [entryType, setEntryType] = useState(null); // 'success' | 'failure'
  const [description, setDescription] = useState('');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  /* ── Load user + entries ── */
  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      return supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false });
    }).then(({ data, error }) => {
      if (!error && data) setEntries(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  /* ── Save entry ── */
  const handleSave = async () => {
    if (!description.trim()) { toast.error('Write something first.'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .insert([{ user_id: user.id, type: entryType, description: description.trim() }])
        .select()
        .single();
      if (error) throw error;
      setEntries(prev => [data, ...prev]);
      toast.success(entryType === 'success' ? 'Win logged.' : 'Lesson noted.');
      setStep(STEP_LIST);
      setEntryType(null);
      setDescription('');
    } catch (e) {
      toast.error('Failed to save — try again.');
    } finally { setSaving(false); }
  };

  /* ── Delete entry ── */
  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from('diary_entries').delete().eq('id', id);
      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch { toast.error('Could not delete entry.'); }
    finally { setDeleting(null); }
  };

  const isSuccess = (e) => e.type === 'success';

  /* ────────────────────────────── RENDER ────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh',
      background: T.dark,
      color: T.text,
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      padding: '24px 24px 100px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
                fontSize: 32, color: T.text, margin: 0,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <BookOpen style={{ width: 22, height: 22, color: T.gold }} />
                Diary
              </h1>
              <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                Track your financial wins and lessons learned.
              </p>
            </div>

            {step === STEP_LIST && (
              <button
                onClick={() => setStep(STEP_TYPE)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 10, border: 'none',
                  background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                  color: '#0C0C0E', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Plus style={{ width: 13, height: 13 }} /> New Entry
              </button>
            )}

            {step !== STEP_LIST && (
              <button
                onClick={() => { setStep(STEP_LIST); setEntryType(null); setDescription(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', borderRadius: 9,
                  background: 'transparent', border: `1px solid ${T.border}`,
                  color: T.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <ChevronLeft style={{ width: 12, height: 12 }} /> Back
              </button>
            )}
          </div>
        </motion.div>

        {/* ── STEP: choose type ── */}
        <AnimatePresence mode="wait">
          {step === STEP_TYPE && (
            <motion.div key="type"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 20 }}>
                What kind of entry is this?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* Success */}
                <button onClick={() => { setEntryType('success'); setStep(STEP_WRITE); }} style={{
                  padding: '28px 20px', borderRadius: 14, border: `1.5px solid ${T.successBorder}`,
                  background: T.successDim, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s',
                }}>
                  <CheckCircle2 style={{ width: 32, height: 32, color: T.success }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.success }}>Success</span>
                  <span style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', lineHeight: 1.5 }}>
                    A win, milestone, or good financial decision
                  </span>
                </button>

                {/* Failure */}
                <button onClick={() => { setEntryType('failure'); setStep(STEP_WRITE); }} style={{
                  padding: '28px 20px', borderRadius: 14, border: `1.5px solid ${T.dangerBorder}`,
                  background: T.dangerDim, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s',
                }}>
                  <XCircle style={{ width: 32, height: 32, color: T.danger }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.danger }}>Failure</span>
                  <span style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', lineHeight: 1.5 }}>
                    A mistake, setback, or lesson learned
                  </span>
                </button>

              </div>
            </motion.div>
          )}

          {/* ── STEP: write ── */}
          {step === STEP_WRITE && (
            <motion.div key="write"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>

              {/* Type pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 99, marginBottom: 20,
                background: entryType === 'success' ? T.successDim : T.dangerDim,
                border: `1px solid ${entryType === 'success' ? T.successBorder : T.dangerBorder}`,
              }}>
                {entryType === 'success'
                  ? <CheckCircle2 style={{ width: 12, height: 12, color: T.success }} />
                  : <XCircle style={{ width: 12, height: 12, color: T.danger }} />}
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: entryType === 'success' ? T.success : T.danger,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {entryType === 'success' ? 'Success' : 'Failure'}
                </span>
              </div>

              <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 12 }}>
                {entryType === 'success'
                  ? 'Describe what happened and why it was a win.'
                  : 'Describe what happened and what you learned from it.'}
              </p>

              <textarea
                autoFocus
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={entryType === 'success'
                  ? 'e.g. I skipped eating out all week and saved $60...'
                  : 'e.g. I impulse-bought something I didn\'t need...'}
                maxLength={1000}
                rows={7}
                style={{
                  width: '100%', padding: '14px 16px',
                  background: T.surfaceAlt, border: `1px solid ${entryType === 'success' ? T.successBorder : T.dangerBorder}`,
                  borderRadius: 12, color: T.text, fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  resize: 'vertical', minHeight: 140, boxSizing: 'border-box',
                  transition: 'border-color 0.15s', lineHeight: 1.6,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 10, color: description.length > 900 ? T.danger : T.textDim }}>
                  {description.length}/1000
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving || !description.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 24px', borderRadius: 10, border: 'none',
                    background: (!description.trim() || saving)
                      ? T.surfaceHigh
                      : entryType === 'success'
                        ? 'linear-gradient(135deg, #5a9e6a, #7EB88A)'
                        : 'linear-gradient(135deg, #a83225, #C0392B)',
                    color: (!description.trim() || saving) ? T.textMuted : '#fff',
                    fontSize: 12, fontWeight: 700,
                    cursor: (!description.trim() || saving) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {saving
                    ? <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    : null}
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: list ── */}
          {step === STEP_LIST && (
            <motion.div key="list"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                  <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              ) : entries.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: T.surfaceAlt, borderRadius: 16,
                    border: `1px solid ${T.border}`,
                  }}>
                  <BookOpen style={{ width: 36, height: 36, color: T.textDim, margin: '0 auto 14px' }} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: T.textMuted, margin: '0 0 6px' }}>
                    No entries yet
                  </p>
                  <p style={{ fontSize: 12, color: T.textDim, margin: 0 }}>
                    Hit New Entry to start tracking your journey.
                  </p>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {entries.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        background: T.surfaceAlt,
                        border: `1px solid ${isSuccess(entry) ? T.successBorder : T.dangerBorder}`,
                        borderLeft: `3px solid ${isSuccess(entry) ? T.success : T.danger}`,
                        borderRadius: 12,
                        padding: '16px 18px',
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                      }}
                    >
                      {/* Icon */}
                      <div style={{ flexShrink: 0, marginTop: 1 }}>
                        {isSuccess(entry)
                          ? <CheckCircle2 style={{ width: 18, height: 18, color: T.success }} />
                          : <XCircle style={{ width: 18, height: 18, color: T.danger }} />}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: isSuccess(entry) ? T.success : T.danger,
                          }}>
                            {isSuccess(entry) ? 'Success' : 'Failure'}
                          </span>
                          <span style={{ fontSize: 10, color: T.textDim }}>
                            {formatDate(entry.created_at)} · {formatTime(entry.created_at)}
                          </span>
                        </div>
                        <p style={{
                          fontSize: 13, color: T.text, margin: 0,
                          lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {entry.description}
                        </p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        style={{
                          flexShrink: 0, background: 'none', border: 'none',
                          cursor: deleting === entry.id ? 'not-allowed' : 'pointer',
                          color: T.textDim, padding: '2px',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = T.danger}
                        onMouseLeave={e => e.currentTarget.style.color = T.textDim}
                      >
                        {deleting === entry.id
                          ? <div style={{ width: 14, height: 14, border: `2px solid ${T.border}`, borderTopColor: T.danger, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                          : <Trash2 style={{ width: 14, height: 14 }} />}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
