import React, { useState, useEffect } from 'react';
import { auth, entities } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Swords, Trophy, FileText, Zap, ArrowRight, Star, Users } from 'lucide-react';

import LevelBadge from '../components/game/LevelBadge';
import XPBar from '../components/game/XPBar';
import QuickStats from '../components/dashboard/QuickStats';
import RecentActivity from '../components/dashboard/RecentActivity';
import SpendingChart from '../components/dashboard/SpendingChart';
import DailyTip from '../components/dashboard/DailyTip';
import SavingsGoalCard from '../components/dashboard/SavingsGoalCard';
import ChallengePreview from '../components/dashboard/ChallengePreview';
import InvestmentEstimator from '../components/dashboard/InvestmentEstimator';
import { getLevelFromXP, getRankTitle, getRankColor, ALL_BADGES } from '../components/game/GameUtils';

const RANK_IMGS = [
  { minLevel: 40, img: '/badges/cashlegend.png'   },
  { minLevel: 30, img: '/badges/moneymaster.png'  },
  { minLevel: 20, img: '/badges/budgetboss.png'   },
  { minLevel: 15, img: '/badges/savingspro.png'   },
  { minLevel: 10, img: '/badges/smartspender.png' },
  { minLevel: 5,  img: '/badges/pennypincher.png' },
  { minLevel: 1,  img: '/badges/rookie_saver.png' },
];
function getRankImg(level) {
  return (RANK_IMGS.find(r => level >= r.minLevel) || RANK_IMGS[RANK_IMGS.length - 1]).img;
}

/* ─── Design tokens aligned with Cash Clash gold/dark brand ─────────────── */
const tokens = {
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

/* Shared inline style helpers */
const card = {
  background: tokens.surfaceAlt,
  border: `1px solid ${tokens.border}`,
  borderRadius: 14,
};

const goldAccentCard = {
  ...card,
  border: `1px solid ${tokens.borderGold}`,
  boxShadow: `0 0 0 0px ${tokens.goldDim}`,
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [pfpZoom, setPfpZoom] = useState(false);

  useEffect(() => { auth.me().then(setUser).catch(() => {}); }, []);

  const { data: profiles } = useQuery({
    queryKey: ['profile'],
    queryFn: () => entities.UserProfile.filter({ created_by: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => entities.Transaction.filter({ created_by: user?.id }, '-date', 100),
    enabled: !!user?.id,
    initialData: [],
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => entities.Challenge.list('-created_date', 20),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = profiles?.[0];
  const xp = profile?.xp || 0;
  const level = getLevelFromXP(xp);
  const rank = getRankTitle(level);
  const gradient = getRankColor(level);
  const earnedBadges = (profile?.badges || []).map(id => ALL_BADGES.find(b => b.id === id)).filter(Boolean);

  return (
    <>
    <div
      className="cc-dashboard-root"
      style={{
        minHeight: '100vh',
        background: tokens.dark,
        color: tokens.textPrimary,
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=swap');

        /* ── GLOBAL CHILD COMPONENT DARK OVERRIDES ─────────────────────── */

        /* Kill every white/light card background in child components */
        .cc-dashboard-root [class*="card"],
        .cc-dashboard-root [class*="Card"],
        .cc-dashboard-root [class*="bg-white"],
        .cc-dashboard-root [class*="bg-background"],
        .cc-dashboard-root [class*="bg-card"],
        .cc-dashboard-root [class*="bg-muted"],
        .cc-dashboard-root [class*="bg-secondary"] {
          background-color: #16161A !important;
          background: #16161A !important;
          color: #F0EDE6 !important;
        }

        /* Catch inline white/near-white backgrounds on any element */
        .cc-dashboard-root [style*="background: white"],
        .cc-dashboard-root [style*="background: #fff"],
        .cc-dashboard-root [style*="background: #FFF"],
        .cc-dashboard-root [style*="background-color: white"],
        .cc-dashboard-root [style*="background-color: #fff"],
        .cc-dashboard-root [style*="background-color: rgb(255, 255, 255)"],
        .cc-dashboard-root [style*="background:#fff"],
        .cc-dashboard-root [style*="background: rgb(255"],
        .cc-dashboard-root [style*="background-color: rgb(248"],
        .cc-dashboard-root [style*="background-color: rgb(249"],
        .cc-dashboard-root [style*="background-color: rgb(250"],
        .cc-dashboard-root [style*="background-color: rgb(251"],
        .cc-dashboard-root [style*="background-color: rgb(252"],
        .cc-dashboard-root [style*="background-color: rgb(253"],
        .cc-dashboard-root [style*="background-color: rgb(254"] {
          background-color: #16161A !important;
          background: #16161A !important;
        }

        /* Borders */
        .cc-dashboard-root [class*="border"] {
          border-color: rgba(255,255,255,0.07) !important;
        }
        .cc-dashboard-root [class*="border-border"] {
          border-color: rgba(255,255,255,0.07) !important;
        }

        /* Text colors */
        .cc-dashboard-root [class*="text-foreground"],
        .cc-dashboard-root [class*="text-card-foreground"] {
          color: #F0EDE6 !important;
        }
        .cc-dashboard-root [class*="text-muted-foreground"] {
          color: rgba(240,237,230,0.45) !important;
        }
        .cc-dashboard-root h1, .cc-dashboard-root h2,
        .cc-dashboard-root h3, .cc-dashboard-root h4 {
          color: #F0EDE6;
        }
        .cc-dashboard-root p, .cc-dashboard-root span:not(.cc-rank-pill):not(.cc-streak-dot) {
          color: inherit;
        }

        /* Recharts / chart area */
        .cc-dashboard-root .recharts-wrapper,
        .cc-dashboard-root .recharts-surface {
          background: transparent !important;
        }
        .cc-dashboard-root .recharts-cartesian-grid line {
          stroke: rgba(255,255,255,0.06) !important;
        }
        .cc-dashboard-root .recharts-text {
          fill: rgba(240,237,230,0.4) !important;
        }
        .cc-dashboard-root .recharts-tooltip-wrapper > * {
          background: #1C1C21 !important;
          border: 1px solid rgba(184,151,58,0.25) !important;
          color: #F0EDE6 !important;
          border-radius: 8px !important;
        }

        /* Progress bars — lighten tracks */
        .cc-dashboard-root [class*="bg-muted"] {
          background-color: rgba(255,255,255,0.07) !important;
        }

        /* Tailwind arbitrary light backgrounds */
        .cc-dashboard-root .bg-white,
        .cc-dashboard-root .bg-gray-50,
        .cc-dashboard-root .bg-gray-100,
        .cc-dashboard-root .bg-slate-50,
        .cc-dashboard-root .bg-slate-100,
        .cc-dashboard-root .bg-zinc-50,
        .cc-dashboard-root .bg-zinc-100,
        .cc-dashboard-root .bg-neutral-50,
        .cc-dashboard-root .bg-neutral-100 {
          background-color: #16161A !important;
        }

        /* Accent color overrides to gold */
        .cc-dashboard-root [class*="text-primary"]:not(button):not(a) {
          color: #B8973A !important;
        }
        .cc-dashboard-root [class*="text-green-"] {
          color: #7EB88A !important;
        }

        /* Input / select fields inside child components */
        .cc-dashboard-root input,
        .cc-dashboard-root select,
        .cc-dashboard-root textarea {
          background: #111114 !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: #F0EDE6 !important;
        }

        /* Separator lines */
        .cc-dashboard-root [class*="separator"],
        .cc-dashboard-root hr {
          border-color: rgba(255,255,255,0.07) !important;
          background: rgba(255,255,255,0.07) !important;
        }

        /* Shadcn CardContent padding reset — keep spacing but fix bg */
        .cc-dashboard-root .rounded-xl,
        .cc-dashboard-root .rounded-2xl,
        .cc-dashboard-root .rounded-lg {
          background-color: #16161A;
        }

        /* Daily tip specific override */
        .cc-dashboard-root [class*="tip"],
        .cc-dashboard-root [class*="Tip"] {
          background: #16161A !important;
          border-color: rgba(184,151,58,0.2) !important;
        }

        .cc-hero-glow::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 320px; height: 320px;
          background: radial-gradient(circle, rgba(184,151,58,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .cc-hero-glow::after {
          content: '';
          position: absolute;
          bottom: -80px; left: 20%;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(184,151,58,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .cc-rank-pill {
          background: linear-gradient(135deg, ${tokens.gold}, ${tokens.goldLight});
          color: #0C0C0E;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 99px;
        }

        .cc-stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 600;
          color: ${tokens.textPrimary};
          line-height: 1;
        }

        .cc-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${tokens.textMuted};
        }

        .cc-heading {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          color: ${tokens.textPrimary};
        }

        .cc-divider {
          height: 1px;
          background: ${tokens.border};
          margin: 0;
          border: none;
        }

        .cc-cta-card {
          background: ${tokens.surfaceAlt};
          border: 1px solid ${tokens.border};
          border-radius: 12px;
          padding: 14px 12px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          text-decoration: none;
          display: block;
        }
        .cc-cta-card:hover {
          border-color: ${tokens.borderGold};
          box-shadow: 0 0 18px ${tokens.goldDim};
        }

        .cc-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 10px;
        }

        .cc-badge-tile {
          background: ${tokens.surface};
          border: 1px solid ${tokens.border};
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          flex-shrink: 0;
          min-width: 84px;
          transition: border-color 0.2s;
        }
        .cc-badge-tile:hover {
          border-color: ${tokens.borderGold};
        }

        .cc-btn-primary {
          background: ${tokens.gold};
          color: #0C0C0E;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 7px 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .cc-btn-primary:hover { background: ${tokens.goldLight}; }

        .cc-btn-ghost {
          background: transparent;
          color: ${tokens.textPrimary};
          border: 1px solid ${tokens.border};
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          padding: 7px 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: border-color 0.15s;
          white-space: nowrap;
        }
        .cc-btn-ghost:hover { border-color: ${tokens.borderGold}; }

        .cc-link {
          color: ${tokens.gold};
          font-size: 11px;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          letter-spacing: 0.02em;
          opacity: 0.85;
          transition: opacity 0.15s;
        }
        .cc-link:hover { opacity: 1; }

        .cc-xp-bar-track {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
          overflow: hidden;
          max-width: 260px;
          margin-top: 10px;
        }
        .cc-xp-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, ${tokens.gold}, ${tokens.goldLight});
          border-radius: 99px;
          transition: width 0.8s ease;
        }

        .cc-streak-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: ${tokens.gold};
          display: inline-block;
          margin-right: 5px;
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* ── HERO HUD ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="cc-hero-glow"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            background: tokens.surface,
            border: `1px solid ${tokens.borderGold}`,
            padding: '28px 28px',
            marginBottom: 20,
          }}
        >
          {/* Subtle top gold line */}
          <div style={{
            position: 'absolute', top: 0, left: 24, right: 24, height: 1,
            background: `linear-gradient(90deg, transparent, ${tokens.gold}, transparent)`,
            opacity: 0.6,
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div onClick={() => setPfpZoom(true)} style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(184,151,58,0.4)', flexShrink: 0, cursor: 'pointer', opacity: 1, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {profile?.custom_avatar_url
                ? <img src={profile.custom_avatar_url} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: 'rgba(184,151,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#B8973A' }}>{(profile?.display_name || user?.full_name || 'P')[0].toUpperCase()}</div>
              }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="cc-section-label" style={{ marginBottom: 4 }}>Welcome back</p>
              <h1 className="cc-heading" style={{ fontSize: 30, margin: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                {profile?.display_name || user?.full_name || 'Player'}
                <img src={getRankImg(level)} alt="rank" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="cc-rank-pill">{rank}</span>
                <span style={{ color: tokens.textMuted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap style={{ width: 11, height: 11, color: tokens.gold }} />
                  {xp.toLocaleString()} XP
                </span>
                <span style={{ color: tokens.textMuted, fontSize: 11, display: 'flex', alignItems: 'center' }}>
                  <span className="cc-streak-dot" />
                  {profile?.streak_days || 0} day streak
                </span>
              </div>
              {/* XP Bar — override child component visually via wrapper */}
              <div className="cc-xp-bar-track" style={{ marginTop: 12 }}>
                <XPBar xp={xp} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/Budget">
                <button className="cc-btn-primary">
                  <Plus style={{ width: 13, height: 13 }} /> Track Money
                </button>
              </Link>
              <Link to="/Challenges">
                <button className="cc-btn-ghost">
                  <Swords style={{ width: 13, height: 13 }} /> Clash
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── QUICK STATS ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 20 }}
        >
          <QuickStats transactions={transactions} profile={profile} />
        </motion.div>

        {/* ── DAILY TIP ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: 20 }}
        >
          <DailyTip />
        </motion.div>

        {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SpendingChart transactions={transactions} />
            <RecentActivity transactions={transactions} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SavingsGoalCard profile={profile} transactions={transactions} />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <InvestmentEstimator profile={profile} />
            </motion.div>

            {/* Active Clash */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Swords style={{ width: 13, height: 13, color: tokens.gold }} />
                  Active Clash
                </span>
                <Link to="/Challenges" className="cc-link">
                  View all <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>
              <ChallengePreview challenges={challenges} userEmail={user?.email} />
            </div>
          </div>
        </div>

        {/* ── ACHIEVEMENTS ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 className="cc-heading" style={{ fontSize: 20, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy style={{ width: 16, height: 16, color: tokens.gold }} />
              Achievements
            </h2>
            <Link to="/Badges" className="cc-link">
              All badges <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>

          {earnedBadges.length === 0 ? (
            <div style={{
              ...card,
              border: `1px dashed ${tokens.border}`,
              padding: '32px 24px',
              textAlign: 'center',
            }}>
              <Trophy style={{ width: 28, height: 28, color: tokens.textDim, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: tokens.textMuted, marginBottom: 14 }}>
                Log your first transaction to earn your first badge.
              </p>
              <Link to="/Budget">
                <button className="cc-btn-ghost" style={{ fontSize: 11 }}>
                  <Plus style={{ width: 11, height: 11 }} /> Track a Transaction
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {earnedBadges.slice(0, 8).map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="cc-badge-tile"
                >
                  <span style={{ fontSize: 26, display: 'block' }}>{badge.icon}</span>
                  <p style={{ fontSize: 10, fontWeight: 600, marginTop: 6, color: tokens.textPrimary, lineHeight: 1.3 }}>
                    {badge.name}
                  </p>
                  {badge.xpReward > 0 && (
                    <p style={{ fontSize: 9, color: tokens.gold, fontWeight: 700, marginTop: 3 }}>
                      +{badge.xpReward} XP
                    </p>
                  )}
                </motion.div>
              ))}
              <Link to="/Badges" style={{ flexShrink: 0, minWidth: 84 }}>
                <div className="cc-badge-tile" style={{ border: `1px dashed ${tokens.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <ArrowRight style={{ width: 16, height: 16, color: tokens.textMuted }} />
                  <p style={{ fontSize: 10, color: tokens.textMuted, marginTop: 6 }}>View all</p>
                </div>
              </Link>
            </div>
          )}
        </motion.div>

        {/* ── BOTTOM CTA STRIP ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              {
                to: '/Budget',
                icon: Plus,
                label: 'Log Transaction',
                iconBg: tokens.goldDim,
                iconColor: tokens.gold,
              },
              {
                to: '/Challenges',
                icon: Swords,
                label: '1v1 Clash',
                iconBg: 'rgba(255,255,255,0.05)',
                iconColor: tokens.textPrimary,
              },
              {
                to: '/Friends',
                icon: Users,
                label: 'Add Friends',
                iconBg: 'rgba(255,255,255,0.05)',
                iconColor: tokens.textPrimary,
              },
            ].map(({ to, icon: Icon, label, iconBg, iconColor }) => (
              <Link key={to} to={to} className="cc-cta-card">
                <div className="cc-icon-wrap" style={{ background: iconBg }}>
                  <Icon style={{ width: 14, height: 14, color: iconColor }} />
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: tokens.textPrimary, letterSpacing: '0.02em', lineHeight: 1.3 }}>
                  {label}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
    {pfpZoom && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }} onClick={() => setPfpZoom(false)}>
        <div style={{ width: 288, height: 288, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(184,151,58,0.5)', boxShadow: '0 0 40px rgba(184,151,58,0.3)' }} onClick={e => e.stopPropagation()}>
          {profile?.custom_avatar_url
            ? <img src={profile.custom_avatar_url} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: 'rgba(184,151,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, fontWeight: 700, color: '#B8973A' }}>{(profile?.display_name || user?.full_name || 'P')[0].toUpperCase()}</div>
          }
        </div>
      </div>
    )}
    </>
  );
}