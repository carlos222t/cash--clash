import React, { useState, useEffect } from 'react';
import { auth, entities } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { ALL_BADGES, getUnlockedBadges, getLockedBadges, getLevelFromXP, getRankTitle } from '../components/game/GameUtils';
import XPBar from '../components/game/XPBar';
import { Trophy, Lock, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const T = {
  gold:       '#B8973A',
  goldLight:  '#D4AF5A',
  goldDim:    'rgba(184,151,58,0.15)',
  goldBorder: 'rgba(184,151,58,0.28)',
  surface:    '#111114',
  surfaceAlt: '#16161A',
  border:     'rgba(255,255,255,0.07)',
  text:       '#F0EDE6',
  textMuted:  'rgba(240,237,230,0.45)',
  textDim:    'rgba(240,237,230,0.22)',
};

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

/**
 * Updated BadgeIcon: Scaled up and removed margin to maximize space.
 */
function BadgeIcon({ badgeName, isLocked = false }) {
  const fileName = badgeName.toLowerCase().replace(/\s+/g, '.') + '.png';
  const src = `/achievements/${fileName}`;

  return (
    <div style={{ 
      width: '100%', 
      aspectRatio: '1/1', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      marginBottom: 8 // Reduced margin
    }}>
      <img 
        src={src} 
        alt={badgeName} 
        style={{ 
          width: '100%', // Increased from 90%
          height: '100%', 
          objectFit: 'contain',
          filter: isLocked ? 'grayscale(1) brightness(0.3) opacity(0.5)' : 'drop-shadow(0 0 20px rgba(184,151,58,0.4))',
          transition: 'all 0.3s ease'
        }} 
        onError={(e) => { e.target.src = '/achievements/default.png'; }}
      />
      {isLocked && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.6 }}>
          <Lock style={{ color: '#fff', width: 28, height: 28 }} />
        </div>
      )}
    </div>
  );
}

export default function Badges() {
  const [user, setUser] = useState(null);
  const [pfpZoom, setPfpZoom] = useState(false);
  const [selectedRank, setSelectedRank] = useState(null);
  useEffect(() => { auth.me().then(setUser).catch(() => {}); }, []);

  const { data: profiles } = useQuery({
    queryKey: ['profile'],
    queryFn: () => entities.UserProfile.filter({ created_by: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = profiles?.[0];
  const xp = profile?.xp || 0;
  const earnedIds = profile?.badges || [];
  const unlocked = getUnlockedBadges(earnedIds);
  const locked = getLockedBadges(earnedIds);
  const level = getLevelFromXP(xp);

  const RANKS = [
    { name: 'Rookie Saver',  minLevel: 1,  img: '/badges/rookie_saver.png',  desc: 'Every legend starts somewhere. Reach Level 1 to earn this rank.' },
    { name: 'Penny Pincher', minLevel: 5,  img: '/badges/pennypincher.png',  desc: 'You are getting serious about your finances. Reach Level 5 to unlock.' },
    { name: 'Smart Spender', minLevel: 10, img: '/badges/smartspender.png',  desc: 'Your money habits are sharpening. Reach Level 10 to unlock.' },
    { name: 'Savings Pro',   minLevel: 15, img: '/badges/savingspro.png',    desc: 'A true savings professional. Reach Level 15 to unlock.' },
    { name: 'Budget Boss',   minLevel: 20, img: '/badges/budgetboss.png',    desc: 'You run your budget like a boss. Reach Level 20 to unlock.' },
    { name: 'Money Master',  minLevel: 30, img: '/badges/moneymaster.png',   desc: 'Complete mastery of personal finance. Reach Level 30 to unlock.' },
    { name: 'Cash Legend',   minLevel: 40, img: '/badges/cashlegend.png',    desc: 'The pinnacle of Cash Clash greatness. Reach Level 40 to become a legend.' },
  ];

  const SectionLabel = ({ icon: Icon, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ width: 14, height: 14, color: T.gold }} />
      </div>
      <span style={{ fontWeight: 600, fontSize: 15, color: T.text, letterSpacing: '0.02em' }}>{text}</span>
    </div>
  );

  return (
    <div style={{ backgroundColor: T.surface, minHeight: '100vh', width: '100%' }}>
      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

        {/* HERO SECTION */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: T.surfaceAlt, border: `1px solid ${T.goldBorder}`, padding: '28px' }}>
            <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: `linear-gradient(90deg,transparent,${T.gold},transparent)`, opacity: 0.6 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div onClick={() => setPfpZoom(true)} style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${T.goldBorder}`, flexShrink: 0, cursor: 'pointer' }}>
                {profile?.custom_avatar_url
                  ? <img src={profile.custom_avatar_url} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: T.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: T.gold }}>{(profile?.display_name || 'P')[0].toUpperCase()}</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>{profile?.display_name || 'Player'}</h1>
                  <img src={getRankImg(level)} alt="rank" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: T.textMuted }}>Level {level} • {getRankTitle(level)}</p>
                <div style={{ maxWidth: 360 }}><XPBar xp={xp} /></div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 24px', borderRadius: 14, background: T.goldDim, border: `1px solid ${T.goldBorder}` }}>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: T.gold, lineHeight: 1 }}>{unlocked.length}</p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>of {ALL_BADGES.length} Badges</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RANK TIERS */}
        <div style={{ marginBottom: 40 }}>
          <SectionLabel icon={Star} text="Rank Progression" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
            {RANKS.map(rank => {
              const achieved = level >= rank.minLevel;
              const isCurrent = achieved && rank.minLevel === Math.max(...RANKS.filter(r => level >= r.minLevel).map(r => r.minLevel));
              return (
                <div
                  key={rank.name}
                  onClick={() => setSelectedRank({ ...rank, achieved, isCurrent })}
                  style={{
                    textAlign: 'center', padding: '12px 8px', borderRadius: 14, cursor: 'pointer',
                    background: isCurrent ? T.goldDim : achieved ? T.surfaceAlt : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isCurrent ? T.goldBorder : achieved ? 'rgba(184,151,58,0.12)' : T.border}`,
                    transform: isCurrent ? 'scale(1.05)' : 'none',
                    transition: 'all 0.18s ease',
                    opacity: achieved ? 1 : 0.45,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'rgba(184,151,58,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = achieved ? '1' : '0.45'; e.currentTarget.style.borderColor = isCurrent ? T.goldBorder : achieved ? 'rgba(184,151,58,0.12)' : T.border; }}
                >
                  <img src={rank.img} alt={rank.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block', filter: achieved ? 'none' : 'grayscale(1)' }} />
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: isCurrent ? T.gold : T.textMuted, lineHeight: 1.2 }}>{rank.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 9, color: T.textDim }}>Lv {rank.minLevel}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* EARNED BADGES - Larger Grid */}
        <div style={{ marginBottom: 40 }}>
          <SectionLabel icon={Trophy} text={`Unlocked Achievements (${unlocked.length})`} />
          {unlocked.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', borderRadius: 16, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
              <p style={{ color: T.textMuted, fontSize: 14 }}>Your trophy cabinet is currently empty. Complete tasks to earn your first badge!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
              {unlocked.map((badge, i) => (
                <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                  <div style={{ 
                    padding: '16px', // Balanced padding
                    borderRadius: 20, 
                    background: T.surfaceAlt, 
                    border: `1px solid ${T.goldBorder}`, 
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    position: 'relative'
                  }}>
                    <BadgeIcon badgeName={badge.name} isLocked={false} />
                    <div style={{ marginTop: 'auto' }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15, color: T.text }}>{badge.name}</p>
                      <p style={{ margin: '0', fontSize: 11, color: T.textMuted, lineHeight: 1.3 }}>{badge.description}</p>
                      {badge.xpReward > 0 && <p style={{ margin: '8px 0 0', fontSize: 10, fontWeight: 900, color: T.gold, letterSpacing: '0.08em' }}>+{badge.xpReward} XP</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* LOCKED BADGES */}
        <div>
          <SectionLabel icon={Lock} text={`Remaining Challenges (${locked.length})`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {locked.map(badge => (
              <div key={badge.id} style={{ 
                padding: '16px', 
                borderRadius: 20, 
                background: 'rgba(22, 22, 26, 0.4)', 
                border: `1px solid ${T.border}`, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <BadgeIcon badgeName={badge.name} isLocked={true} />
                <div style={{ marginTop: 'auto' }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 15, color: T.textDim }}>{badge.name}</p>
                  <p style={{ margin: '0', fontSize: 11, color: T.textDim, lineHeight: 1.3 }}>{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* RANK DETAIL MODAL */}
      {selectedRank && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          onClick={() => setSelectedRank(null)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: T.surfaceAlt,
              border: `1px solid ${selectedRank.isCurrent ? T.goldBorder : selectedRank.achieved ? 'rgba(184,151,58,0.3)' : T.border}`,
              borderRadius: 24,
              padding: '36px 32px',
              maxWidth: 340,
              width: '90vw',
              textAlign: 'center',
              position: 'relative',
              boxShadow: selectedRank.achieved ? `0 0 60px rgba(184,151,58,0.2), 0 24px 64px rgba(0,0,0,0.6)` : '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedRank(null)}
              style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 16, lineHeight: 1 }}
            >×</button>

            {/* Badge image — large + focused */}
            <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 24px' }}>
              {selectedRank.achieved && (
                <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,151,58,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
              )}
              <img
                src={selectedRank.img}
                alt={selectedRank.name}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%',
                  filter: selectedRank.achieved
                    ? 'drop-shadow(0 0 24px rgba(184,151,58,0.6)) drop-shadow(0 0 8px rgba(184,151,58,0.4))'
                    : 'grayscale(1) brightness(0.35)',
                }}
              />
              {!selectedRank.achieved && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  <Lock style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.5)' }} />
                </div>
              )}
            </div>

            {/* Name */}
            <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: selectedRank.isCurrent ? T.gold : selectedRank.achieved ? T.text : T.textMuted, letterSpacing: '-0.01em', fontFamily: "'Cormorant Garamond', serif" }}>
              {selectedRank.name}
            </p>

            {/* Level requirement pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99, marginBottom: 16, background: selectedRank.achieved ? T.goldDim : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedRank.achieved ? T.goldBorder : T.border}` }}>
              <Star style={{ width: 11, height: 11, color: selectedRank.achieved ? T.gold : T.textMuted }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: selectedRank.achieved ? T.gold : T.textMuted, letterSpacing: '0.04em' }}>
                Level {selectedRank.minLevel} required
              </span>
            </div>

            {/* Description */}
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
              {selectedRank.desc}
            </p>

            {/* Status badge */}
            {selectedRank.isCurrent ? (
              <div style={{ padding: '8px 20px', borderRadius: 10, background: T.goldDim, border: `1px solid ${T.goldBorder}` }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Current Rank</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textMuted }}>You are Level {level}</p>
              </div>
            ) : selectedRank.achieved ? (
              <div style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(110,175,122,0.1)', border: '1px solid rgba(110,175,122,0.25)' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#6EAF7A', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Achieved</p>
              </div>
            ) : (
              <div style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Locked</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textDim }}>{selectedRank.minLevel - level} more level{selectedRank.minLevel - level !== 1 ? 's' : ''} to go</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* PFP MODAL */}
      {pfpZoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }} onClick={() => setPfpZoom(false)}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: 320, height: 320, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${T.gold}`, boxShadow: `0 0 50px ${T.goldDim}` }} onClick={e => e.stopPropagation()}>
            {profile?.custom_avatar_url
              ? <img src={profile.custom_avatar_url} alt="pfp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: T.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100, fontWeight: 700, color: T.gold }}>{(profile?.display_name || 'P')[0].toUpperCase()}</div>
            }
          </motion.div>
        </div>
      )}
    </div>
  );
}