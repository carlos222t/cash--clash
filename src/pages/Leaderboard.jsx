import React, { useState, useEffect } from 'react';
import { profilesApi, supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Swords, Star, Crown, Medal, Shield, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import UserProfileModal from '@/components/social/UserProfileModal';
import { profilesApi as pApi } from '@/api/supabaseClient';
import { isGodly } from '@/components/game/GameUtils';
import GodlyWrapper, { GodlyBadgePill } from '@/components/social/GodlyProfile';

/* ─── Design tokens (mirrored from Dashboard) ────────────────────────────── */
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

const AVATAR_PRESETS = {
  avatar1:'🦁', avatar2:'🐯', avatar3:'🦊', avatar4:'🐺', avatar5:'🦅',
  avatar6:'🐉', avatar7:'🦄', avatar8:'🐻', avatar9:'🦈', avatar10:'🍆',
  avatar11:'🐸', avatar12:'🦉',
};

/* Rank styles aligned to gold/silver/bronze from Dashboard palette */
const RANK_STYLES = [
  { bg: `background:${tokens.surfaceAlt};border:1px solid rgba(184,151,58,0.4)`,  textColor: tokens.gold,          icon: Crown },
  { bg: `background:${tokens.surfaceAlt};border:1px solid rgba(148,163,184,0.35)`, textColor: '#94A3B8',            icon: Medal },
  { bg: `background:${tokens.surfaceAlt};border:1px solid rgba(180,120,60,0.35)`,  textColor: '#B4783C',            icon: Medal },
];

function LeaderboardRow({ profile, rank, onView, isMe, isTopPlayer }) {
  const rankStyle = rank <= 3 ? RANK_STYLES[rank - 1] : null;
  const RankIcon  = rankStyle?.icon;
  const godly     = isGodly(profile);

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: tokens.surfaceAlt,
    border: rankStyle ? undefined : `1px solid ${tokens.border}`,
    ...(isMe ? { outline: `2px solid rgba(184,151,58,0.4)`, outlineOffset: 1 } : {}),
  };

  /* Parse rank inline style string into object for the ranked rows */
  const rankBgMap = {
    1: { background: tokens.surfaceAlt, border: `1px solid rgba(184,151,58,0.4)` },
    2: { background: tokens.surfaceAlt, border: '1px solid rgba(148,163,184,0.35)' },
    3: { background: tokens.surfaceAlt, border: '1px solid rgba(180,120,60,0.35)' },
  };
  const finalRowStyle = rankStyle
    ? { ...rowStyle, ...rankBgMap[rank] }
    : rowStyle;

  const avatarEl = (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, overflow: 'hidden', flexShrink: 0,
    }}>
      {profile.custom_avatar_url
        ? <img src={profile.custom_avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
        : AVATAR_PRESETS[profile.avatar_id] || '🦁'
      }
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.03 }}>
      <div
        style={finalRowStyle}
        className="cc-lb-row"
        onClick={() => onView(profile)}
      >
        {/* Rank number / icon */}
        <div style={{
          width: 28, textAlign: 'center', fontWeight: 700, fontSize: 13,
          flexShrink: 0, color: rankStyle ? rankStyle.textColor : tokens.textMuted,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {RankIcon
            ? <RankIcon style={{ width: 18, height: 18, margin: '0 auto', display: 'block', color: rankStyle.textColor }} />
            : `#${rank}`}
        </div>

        {/* Avatar with optional crown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {isTopPlayer && (
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              fontSize: 16, zIndex: 20, pointerEvents: 'none',
            }}>👑</div>
          )}
          {avatarEl}
        </div>

        {/* Name / username */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{
              fontWeight: 500, fontSize: 13, color: tokens.textPrimary,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
            }}>{profile.display_name}</p>
            {isMe && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                background: tokens.goldDim, color: tokens.gold, border: `1px solid ${tokens.goldBorder}`,
                letterSpacing: '0.04em',
              }}>You</span>
            )}
            {godly && <GodlyBadgePill />}
          </div>
          <p style={{ fontSize: 11, color: tokens.textMuted, margin: 0 }}>@{profile.username}</p>
        </div>

        {/* Level badge */}
        <div style={{ flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
            background: tokens.goldDim, color: tokens.gold,
            border: `1px solid ${tokens.goldBorder}`,
          }}>Lv {profile.level}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [viewProfile, setViewProfile] = useState(null);
  const [myProfile,   setMyProfile]   = useState(null);

  useEffect(() => {
    if (user?.id) pApi.getByUserId(user.id).then(setMyProfile).catch(() => {});
  }, [user?.id]);

  const { data: byXP         = [] } = useQuery({ queryKey: ['leaderboard', 'xp'],              queryFn: () => profilesApi.leaderboard('xp', 50) });
  const { data: byBattles    = [] } = useQuery({ queryKey: ['leaderboard', 'battles_won'],      queryFn: () => profilesApi.leaderboard('battles_won', 50) });
  const { data: byTournament = [] } = useQuery({ queryKey: ['leaderboard', 'tournament_wins'],  queryFn: () => profilesApi.leaderboard('tournament_wins', 50) });

  const { data: clanLB = [] } = useQuery({
    queryKey: ['clans-leaderboard'],
    queryFn: async () => {
      const { data } = await supabase.from('clans').select('*').order('total_wins', { ascending: false }).limit(25);
      return data || [];
    },
  });

  const topPlayerId = byXP[0]?.created_by;

  const renderList = (list, valueProp, valueLabel, valueIcon) => {
    const Icon = valueIcon;
    return list.length === 0 ? (
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        background: tokens.surfaceAlt, borderRadius: 14,
        border: `1px dashed ${tokens.border}`,
      }}>
        <Trophy style={{ width: 36, height: 36, color: tokens.textDim, margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0 }}>No data yet. Start playing!</p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map((profile, idx) => (
          <div key={profile.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <LeaderboardRow
                profile={profile}
                rank={idx + 1}
                onView={setViewProfile}
                isMe={profile.created_by === user?.id}
                isTopPlayer={profile.created_by === topPlayerId && idx === 0}
              />
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, width: 80, justifyContent: 'flex-end',
            }}>
              <Icon style={{ width: 13, height: 13, color: tokens.gold }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary, fontFamily: "'DM Sans', sans-serif" }}>
                {(profile[valueProp] || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: 10, color: tokens.textMuted }}>{valueLabel}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: tokens.dark,
      color: tokens.textPrimary,
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=swap');

        .cc-lb-root [class*="bg-card"],
        .cc-lb-root [class*="bg-background"],
        .cc-lb-root [class*="bg-muted"],
        .cc-lb-root [class*="bg-white"],
        .cc-lb-root [class*="bg-secondary"] {
          background-color: #16161A !important;
          background: #16161A !important;
          color: #F0EDE6 !important;
        }
        .cc-lb-root [class*="border-border"] {
          border-color: rgba(255,255,255,0.07) !important;
        }
        .cc-lb-root [class*="text-foreground"],
        .cc-lb-root [class*="text-card-foreground"] {
          color: #F0EDE6 !important;
        }
        .cc-lb-root [class*="text-muted-foreground"] {
          color: rgba(240,237,230,0.45) !important;
        }

        /* Tab list */
        .cc-lb-root [role="tablist"] {
          background: #16161A !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          border-radius: 10px !important;
          padding: 3px !important;
        }
        .cc-lb-root [role="tab"] {
          color: rgba(240,237,230,0.45) !important;
          border-radius: 7px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          transition: all 0.15s !important;
        }
        .cc-lb-root [role="tab"][data-state="active"] {
          background: #B8973A !important;
          color: #0C0C0E !important;
          font-weight: 700 !important;
          box-shadow: 0 1px 8px rgba(184,151,58,0.35) !important;
        }
        .cc-lb-root [role="tab"]:hover:not([data-state="active"]) {
          color: #F0EDE6 !important;
          background: rgba(255,255,255,0.05) !important;
        }

        /* Row hover */
        .cc-lb-row:hover {
          border-color: rgba(184,151,58,0.35) !important;
          box-shadow: 0 0 14px rgba(184,151,58,0.1);
        }

        /* Badge overrides */
        .cc-lb-root [class*="badge"],
        .cc-lb-root [class*="Badge"] {
          background: rgba(184,151,58,0.12) !important;
          color: #B8973A !important;
          border-color: rgba(184,151,58,0.25) !important;
        }
      `}</style>

      <div className="cc-lb-root" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: 16,
            background: tokens.surface,
            border: `1px solid ${tokens.borderGold}`,
            padding: '24px 24px 20px',
            marginBottom: 24,
          }}
        >
          {/* Gold top line */}
          <div style={{
            position: 'absolute', top: 0, left: 24, right: 24, height: 1,
            background: `linear-gradient(90deg, transparent, ${tokens.gold}, transparent)`,
            opacity: 0.6,
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Trophy style={{ width: 20, height: 20, color: tokens.gold }} />
            <h1 style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              fontSize: 26,
              color: tokens.textPrimary,
            }}>Leaderboard</h1>
          </div>
          <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0 }}>
            Top players across Cash Clash. Click a player to view their profile.
          </p>
        </motion.div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="xp">
          <TabsList style={{ width: '100%', display: 'flex', padding: '3px', gap: 2 }}>
            <TabsTrigger value="xp"          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', padding: '6px 4px', whiteSpace: 'nowrap' }}><Star   style={{ width: 11, height: 11, flexShrink: 0 }} /> XP</TabsTrigger>
            <TabsTrigger value="battles"     style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', padding: '6px 4px', whiteSpace: 'nowrap' }}><Swords style={{ width: 11, height: 11, flexShrink: 0 }} /> Battles</TabsTrigger>
            <TabsTrigger value="tournaments" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', padding: '6px 4px', whiteSpace: 'nowrap' }}><Trophy style={{ width: 11, height: 11, flexShrink: 0 }} /> Tourneys</TabsTrigger>
            <TabsTrigger value="clans"       style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', padding: '6px 4px', whiteSpace: 'nowrap' }}><Shield style={{ width: 11, height: 11, flexShrink: 0 }} /> Clans</TabsTrigger>
          </TabsList>

          <TabsContent value="xp"          style={{ marginTop: 16 }}>{renderList(byXP,         'xp',              'XP',   Star)}</TabsContent>
          <TabsContent value="battles"     style={{ marginTop: 16 }}>{renderList(byBattles,    'battles_won',     'wins', Swords)}</TabsContent>
          <TabsContent value="tournaments" style={{ marginTop: 16 }}>{renderList(byTournament, 'tournament_wins', 'wins', Trophy)}</TabsContent>

          <TabsContent value="clans" style={{ marginTop: 16 }}>
            {clanLB.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                background: tokens.surfaceAlt, borderRadius: 14,
                border: `1px dashed ${tokens.border}`,
              }}>
                <Shield style={{ width: 36, height: 36, color: tokens.textDim, margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 13, color: tokens.textMuted, margin: 0 }}>No clans yet. Be the first to create one!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {clanLB.map((clan, idx) => {
                  const clanRankBorder =
                    idx === 0 ? `1px solid rgba(184,151,58,0.4)` :
                    idx === 1 ? '1px solid rgba(148,163,184,0.35)' :
                    idx === 2 ? '1px solid rgba(180,120,60,0.35)' :
                    `1px solid ${tokens.border}`;
                  const rankColor =
                    idx === 0 ? tokens.gold :
                    idx === 1 ? '#94A3B8' :
                    idx === 2 ? '#B4783C' :
                    tokens.textMuted;

                  return (
                    <motion.div
                      key={clan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 12,
                        background: tokens.surfaceAlt,
                        border: clanRankBorder,
                      }}>
                        {/* Rank */}
                        <div style={{
                          width: 28, textAlign: 'center', fontWeight: 700,
                          fontSize: 13, flexShrink: 0, color: rankColor,
                        }}>
                          {idx === 0
                            ? <Crown style={{ width: 18, height: 18, margin: '0 auto', display: 'block', color: tokens.gold }} />
                            : `#${idx + 1}`}
                        </div>

                        {/* Clan avatar */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: `linear-gradient(135deg, ${tokens.goldDim}, rgba(255,255,255,0.04))`,
                          border: `1px solid ${tokens.borderGold}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                          overflow: 'hidden',
                        }}>
                          {clan.avatar_url
                            ? <img src={clan.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} alt="clan" />
                            : clan.avatar_emoji || '🛡️'}
                        </div>

                        {/* Clan info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 500, fontSize: 13, color: tokens.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {clan.name}
                          </p>
                          <p style={{ fontSize: 11, color: tokens.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users style={{ width: 11, height: 11 }} />
                            {clan.member_count || 0} members
                          </p>
                        </div>

                        {/* Win count */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Trophy style={{ width: 13, height: 13, color: tokens.gold }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>{clan.total_wins || 0}</span>
                          <span style={{ fontSize: 10, color: tokens.textMuted }}>wins</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>

      {viewProfile && (
        <UserProfileModal key={viewProfile?.id} profile={viewProfile} onClose={() => setViewProfile(null)} currentUserId={user?.id} myProfile={myProfile} />
      )}
    </div>
  );
}