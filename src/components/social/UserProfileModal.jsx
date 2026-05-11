import React, { useEffect, useState } from 'react';
import { friendsApi, notificationsApi, profilesApi } from '@/api/supabaseClient';
import { supabase } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserCheck, Star, Trophy, Swords, Zap, X, Shield, ChevronDown, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { isGodly, getLevelFromXP } from '@/components/game/GameUtils';
import GodlyWrapper, { GodlyBadgePill } from '@/components/social/GodlyProfile';

const RANK_IMGS = [
  { minLevel: 40, img: '/badges/cashlegend.png',   name: 'Cash Legend'   },
  { minLevel: 30, img: '/badges/moneymaster.png',  name: 'Money Master'  },
  { minLevel: 20, img: '/badges/budgetboss.png',   name: 'Budget Boss'   },
  { minLevel: 15, img: '/badges/savingspro.png',   name: 'Savings Pro'   },
  { minLevel: 10, img: '/badges/smartspender.png', name: 'Smart Spender' },
  { minLevel: 5,  img: '/badges/pennypincher.png', name: 'Penny Pincher' },
  { minLevel: 1,  img: '/badges/rookie_saver.png', name: 'Rookie Saver'  },
];
function getRankImg(level) {
  return (RANK_IMGS.find(r => level >= r.minLevel) || RANK_IMGS[RANK_IMGS.length - 1]).img;
}

const AVATAR_PRESETS = {
  avatar1:'🦁', avatar2:'🐯', avatar3:'🦊', avatar4:'🐺', avatar5:'🦅',
  avatar6:'🐉', avatar7:'🦄', avatar8:'🐻', avatar9:'🦈', avatar10:'🍆',
  avatar11:'🐸', avatar12:'🦉',
};

const BADGE_LABELS = {
  first_track:     { label: 'First Track'     },
  penny_wise:      { label: 'Penny Wise'      },
  budget_keeper:   { label: 'Budget Keeper'   },
  savings_starter: { label: 'Savings Starter' },
  savings_pro:     { label: 'Savings Pro'     },
  savings_legend:  { label: 'Savings Legend'  },
  streak_3:        { label: '3-Day Streak'    },
  streak_7:        { label: 'Week Warrior'    },
  streak_30:       { label: 'Monthly Master'  },
  clash_winner:    { label: 'Clash Victor'    },
  clash_champ:     { label: 'Clash Champion'  },
  level_5:         { label: 'Rising Star'     },
  level_10:        { label: 'Smart Spender'   },
  level_20:        { label: 'Budget Boss'     },
  diversified:     { label: 'Diversified'     },
  big_saver:       { label: 'Big Saver'       },
  godly:           { label: 'GODLY'           },
};

/* ── Profile UI color resolvers ── */
const CARD_BG_MAP = {
  default:  '#FFFFFF', cream: '#FFF8F0', slate: '#F1F5F9', blush: '#FFF0F3',
  mint: '#F0FFF4', lavender: '#F5F0FF', charcoal: '#1C1C22', navy: '#0F1C2E',
};
const CHALLENGE_BTN_MAP = {
  green:  { bg: '#22C55E', text: '#fff' }, gold:   { bg: '#B8973A', text: '#fff' },
  ember:  { bg: '#E74C3C', text: '#fff' }, ocean:  { bg: '#3B82F6', text: '#fff' },
  violet: { bg: '#8B5CF6', text: '#fff' }, rose:   { bg: '#E8748A', text: '#fff' },
  onyx:   { bg: '#2C2C35', text: '#fff' }, white:  { bg: '#FFFFFF', text: '#111' },
};
const FRIEND_BTN_MAP = {
  default: { bg: '#F3F4F6', text: '#374151' }, gold:   { bg: '#B8973A', text: '#fff' },
  ocean:   { bg: '#3B82F6', text: '#fff'    }, forest: { bg: '#22C55E', text: '#fff' },
  violet:  { bg: '#8B5CF6', text: '#fff'    }, rose:   { bg: '#E8748A', text: '#fff' },
  slate:   { bg: '#64748B', text: '#fff'    }, onyx:   { bg: '#2C2C35', text: '#fff' },
};
const STAT_CARD_MAP = {
  default: { bg: '#F9F5EB', border: 'rgba(184,151,58,0.15)', icon: '#B8973A', dark: false },
  ocean:   { bg: '#EFF6FF', border: 'rgba(59,130,246,0.2)',  icon: '#3B82F6', dark: false },
  forest:  { bg: '#F0FDF4', border: 'rgba(34,197,94,0.2)',   icon: '#22C55E', dark: false },
  violet:  { bg: '#F5F3FF', border: 'rgba(139,92,246,0.2)',  icon: '#8B5CF6', dark: false },
  rose:    { bg: '#FFF1F2', border: 'rgba(232,116,138,0.2)', icon: '#E8748A', dark: false },
  ember:   { bg: '#FFF5F5', border: 'rgba(231,76,60,0.2)',   icon: '#E74C3C', dark: false },
  dark:    { bg: '#1C1C22', border: 'rgba(255,255,255,0.08)',icon: '#B8973A', dark: true  },
  copper:  { bg: '#FFF7ED', border: 'rgba(192,120,64,0.2)',  icon: '#C07840', dark: false },
};
const PROFILE_COLORS = [
  { id: 'gold',    bg: 'linear-gradient(135deg, #B8973A, #D4AF5A)' },
  { id: 'ember',   bg: 'linear-gradient(135deg, #C0392B, #E74C3C)' },
  { id: 'ocean',   bg: 'linear-gradient(135deg, #1a6b9a, #5B9BD5)' },
  { id: 'forest',  bg: 'linear-gradient(135deg, #27774A, #7EB88A)' },
  { id: 'violet',  bg: 'linear-gradient(135deg, #6C3483, #A569BD)' },
  { id: 'rose',    bg: 'linear-gradient(135deg, #9B2335, #E8748A)' },
  { id: 'slate',   bg: 'linear-gradient(135deg, #2C3E50, #596980)' },
  { id: 'copper',  bg: 'linear-gradient(135deg, #7D4F30, #C07840)' },
  { id: 'ice',     bg: 'linear-gradient(135deg, #2980B9, #AED6F1)' },
  { id: 'onyx',    bg: 'linear-gradient(135deg, #1a1a1f, #3a3a44)' },
];
const getBannerBg = (id) => (PROFILE_COLORS.find(c => c.id === id) || PROFILE_COLORS[0]).bg;
function resolveCardBg(id)       { return CARD_BG_MAP[id]     || '#FFFFFF'; }
function resolveChallBtn(id)     { return CHALLENGE_BTN_MAP[id] || CHALLENGE_BTN_MAP.green; }
function resolveFriendBtn(id)    { return FRIEND_BTN_MAP[id]   || FRIEND_BTN_MAP.default; }
function resolveStatCard(id)     { return STAT_CARD_MAP[id]    || STAT_CARD_MAP.default; }

function BadgeImg({ badgeId, label, size = 40, onClick }) {
  const fileName = label.toLowerCase().replace(/\s+/g, '.') + '.png';
  return (
    <img
      src={`/achievements/${fileName}`}
      alt={label}
      title={label}
      onClick={onClick}
      style={{
        width: size, height: size,
        objectFit: 'contain',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 8,
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'scale(1.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
}

export default function UserProfileModal({ profile: initialProfile, onClose, currentUserId, myProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [relationship, setRelationship] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [clan, setClan] = useState(null);
  const [rankExpanded, setRankExpanded] = useState(false);
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();
  const godly = isGodly(profile);
  const level = getLevelFromXP(profile?.xp || 0);

  // Resolve saved UI colors
  const cardBg   = resolveCardBg(profile?.card_bg_color);
  const challBtn = resolveChallBtn(profile?.challenge_btn_color);
  const friendBtn = resolveFriendBtn(profile?.friend_btn_color);
  const statCard = resolveStatCard(profile?.stat_card_color);
  const statText = statCard.dark ? "#F0EDE6" : "#111827";
  const statSub  = statCard.dark ? "rgba(240,237,230,0.55)" : "#6B7280";
  const isDarkCard = ['charcoal','navy','dark'].includes(profile?.card_bg_color);
  const cardText   = isDarkCard ? '#F0EDE6'              : undefined; // undefined = inherit Tailwind
  const cardSub    = isDarkCard ? 'rgba(240,237,230,0.55)' : undefined;

  useEffect(() => {
    // Always re-fetch fresh profile so customizations are up to date
    if (initialProfile?.created_by) {
      setFetching(true);
      profilesApi.getByUserId(initialProfile.created_by)
        .then(fresh => { if (fresh) setProfile({ ...initialProfile, ...fresh }); })
        .catch(() => {})
        .finally(() => setFetching(false));
    }
    if (currentUserId && initialProfile?.created_by) {
      friendsApi.getRelationship(currentUserId, initialProfile.created_by).then(setRelationship);
    }
    if (profile?.created_by) {
      supabase.from('clan_members').select('*, clan:clans(*)').eq('user_id', profile.created_by).maybeSingle()
        .then(({ data }) => { if (data?.clan) setClan(data.clan); });
    }
  }, [currentUserId, initialProfile?.created_by]);

  const isFriend  = relationship?.status === 'accepted';
  const isPending = relationship?.status === 'pending';

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      await friendsApi.sendRequest(currentUserId, profile.created_by);
      await notificationsApi.send({
        recipient_id: profile.created_by,
        sender_id: currentUserId,
        sender_username: myProfile?.username || 'Someone',
        type: 'friend_request',
        title: 'New Friend Request',
        body: `@${myProfile?.username || 'Someone'} sent you a friend request!`,
        read: false,
      });
      setRelationship({ status: 'pending' });
      toast.success('Friend request sent!');
    } catch { toast.error('Could not send request'); }
    finally { setLoading(false); }
  };

  const handleChallenge = () => {
    onClose();
    navigate('/Challenges', { state: { prefillUsername: profile?.username } });
  };

  // Ranks ordered lowest→highest for the expansion panel
  const RANKS_ASC = [...RANK_IMGS].reverse();

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-sm p-0 overflow-hidden" style={{ background: cardBg, border: '1px solid rgba(184,151,58,0.25)', borderRadius: 20 }}>
          {fetching && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(12,12,14,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(184,151,58,0.2)', borderTop: '3px solid #B8973A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}

          {godly ? (
            <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 56, background: 'linear-gradient(135deg, #3a2000, #B8973A, #FFD700, #B8973A, #3a2000)', backgroundSize: '300% 300%' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }} />
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.35em', color: '#7A4900', textTransform: 'uppercase', zIndex: 10, position: 'relative' }}>KING</p>
            </div>
          ) : (
            <div style={{ height: 48, background: getBannerBg(profile?.banner_color) }} />
          )}

          <div className="px-5 pt-4 pb-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-4">
              {godly ? (
                <GodlyWrapper active className="rounded-2xl flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setEnlargedImage({ src: profile?.custom_avatar_url, emoji: AVATAR_PRESETS[profile?.avatar_id] || '🦁' })}>
                    {profile?.custom_avatar_url
                      ? <img src={profile.custom_avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
                      : <span>{AVATAR_PRESETS[profile?.avatar_id] || '🦁'}</span>
                    }
                  </div>
                </GodlyWrapper>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setEnlargedImage({ src: profile?.custom_avatar_url, emoji: AVATAR_PRESETS[profile?.avatar_id] || '🦁' })}>
                  {profile?.custom_avatar_url
                    ? <img src={profile.custom_avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
                    : <span>{AVATAR_PRESETS[profile?.avatar_id] || '🦁'}</span>
                  }
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-heading font-bold text-lg leading-tight truncate" style={cardText ? { color: cardText } : {}}>{profile?.display_name}</h2>
                  <img
                    src={getRankImg(level)}
                    alt="rank"
                    title="Click to see rank progression"
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setRankExpanded(v => !v)}
                  />
                  {godly && <GodlyBadgePill />}
                </div>
                <p className="text-sm" style={{ color: cardSub || 'rgba(100,100,110,0.65)' }}>@{profile?.username}</p>
              </div>
            </div>

            {profile?.bio && (
              <p className="text-sm italic mb-4" style={{ color: cardSub || 'rgba(100,100,110,0.7)' }}>"{profile.bio}"</p>
            )}

            {/* Rank progression panel (expandable) */}
            <div className="mb-4">
              <button
                onClick={() => setRankExpanded(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 10,
                  background: 'rgba(184,151,58,0.08)', border: '1px solid rgba(184,151,58,0.2)',
                  cursor: 'pointer', transition: 'background 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: cardSub || 'rgba(100,100,110,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Rank Progression
                </span>
                <ChevronDown style={{
                  width: 14, height: 14, color: 'rgba(184,151,58,0.7)',
                  transform: rankExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }} />
              </button>

              {rankExpanded && (
                <div style={{ marginTop: 8, padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {RANKS_ASC.map(rank => {
                      const achieved = level >= rank.minLevel;
                      const isCurrent = achieved && rank.minLevel === Math.max(...RANKS_ASC.filter(r => level >= r.minLevel).map(r => r.minLevel));
                      return (
                        <div
                          key={rank.name}
                          onClick={() => setEnlargedImage({ src: rank.img, emoji: null, isRank: true })}
                          style={{
                            textAlign: 'center', padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                            background: isCurrent ? 'rgba(184,151,58,0.15)' : achieved ? 'rgba(255,255,255,0.04)' : 'transparent',
                            border: `1px solid ${isCurrent ? 'rgba(184,151,58,0.4)' : achieved ? 'rgba(184,151,58,0.15)' : 'rgba(255,255,255,0.06)'}`,
                            opacity: achieved ? 1 : 0.4,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <div style={{ position: 'relative', width: 36, height: 36, margin: '0 auto 4px' }}>
                            <img src={rank.img} alt={rank.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', filter: achieved ? 'none' : 'grayscale(1)' }} />
                            {!achieved && (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(0,0,0,0.4)' }}>
                                <Lock style={{ width: 10, height: 10, color: '#fff' }} />
                              </div>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: isCurrent ? '#B8973A' : 'rgba(240,237,230,0.5)', lineHeight: 1.2 }}>{rank.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 9, color: 'rgba(240,237,230,0.3)' }}>Lv {rank.minLevel}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>


            <div className="grid grid-cols-3 gap-2 mb-4">
              {[{icon:Zap,label:'Level',value:profile?.level||1},{icon:Star,label:'XP',value:(profile?.xp||0).toLocaleString()},{icon:Swords,label:'Battles Won',value:profile?.battles_won||0}].map(stat=>(
                <div key={stat.label} style={{background:'#16161A',borderRadius:12,padding:'10px',textAlign:'center',border:'1px solid rgba(184,151,58,0.15)'}}>
                  <stat.icon style={{width:16,height:16,margin:'0 auto 4px',display:'block',color:'#B8973A'}}/>
                  <p style={{fontWeight:700,fontSize:14,color:'#F0EDE6',margin:'2px 0 0'}}>{stat.value}</p>
                  <p style={{fontSize:10,color:'rgba(240,237,230,0.45)',margin:0}}>{stat.label}</p>
                </div>
              ))}
            </div>
            {/* Badges — image grid */}
            {profile?.badges?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: cardSub || 'rgba(100,100,110,0.7)' }}>Badges</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.badges.map(b => {
                    const badge = BADGE_LABELS[b];
                    if (!badge) return null;
                    return (
                      <BadgeImg
                        key={b}
                        badgeId={b}
                        label={badge.label}
                        size={40}
                        onClick={() => setEnlargedImage({ src: `/achievements/${badge.label.toLowerCase().replace(/\s+/g, '.')}.png`, emoji: null, label: badge.label })}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clan */}
            {clan && (
              <div
                className="mb-4"
                onClick={() => { onClose(); navigate('/Clans', { state: { clanId: clan.id } }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, rgba(184,151,58,0.08), rgba(184,151,58,0.04))', border: '1px solid rgba(184,151,58,0.2)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(184,151,58,0.45)'; e.currentTarget.style.background = 'rgba(184,151,58,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(184,151,58,0.2)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(184,151,58,0.08), rgba(184,151,58,0.04))'; }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, border: '1.5px solid rgba(184,151,58,0.35)', background: 'rgba(184,151,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden', flexShrink: 0 }}>
                  {clan.avatar_url ? <img src={clan.avatar_url} alt="clan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{clan.avatar_emoji || '🛡️'}</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(184,151,58,0.7)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Shield style={{ width: 10, height: 10 }} /> Clan
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#F0EDE6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clan.name}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(184,151,58,0.5)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            )}

            {/* Actions */}
            {currentUserId !== profile?.created_by && (
              <div className="flex gap-2">
                {isFriend ? (
                  <>
                    <button
                      disabled
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: friendBtn.bg, color: friendBtn.text, fontSize: 13, fontWeight: 600, border: 'none', opacity: 0.7, cursor: 'not-allowed' }}
                    >
                      <UserCheck style={{ width: 16, height: 16 }} /> Friends
                    </button>
                    <button
                      onClick={handleChallenge}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: challBtn.bg, color: challBtn.text, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      <Swords style={{ width: 16, height: 16 }} /> Challenge
                    </button>
                  </>
                ) : isPending ? (
                  <button
                    disabled
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: 'rgba(184,151,58,0.12)', color: '#B8973A', fontSize: 13, fontWeight: 600, border: '1px solid rgba(184,151,58,0.3)', opacity: 1, cursor: 'not-allowed' }}
                  >
                    <UserCheck style={{ width: 16, height: 16 }} /> Requested
                  </button>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={loading}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: loading ? 'rgba(184,151,58,0.12)' : friendBtn.bg, color: loading ? '#B8973A' : friendBtn.text, fontSize: 13, fontWeight: 600, border: loading ? '1px solid rgba(184,151,58,0.3)' : 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: 1, transition: 'all 0.2s' }}
                  >
                    <UserPlus style={{ width: 16, height: 16 }} /> {loading ? 'Sending...' : 'Add Friend'}
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom overlay */}
      {enlargedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm" onClick={() => setEnlargedImage(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setEnlargedImage(null)} className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center z-10 hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
            {enlargedImage.src
              ? <img src={enlargedImage.src} alt={enlargedImage.label || 'enlarged'} style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 20, objectFit: 'contain', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
              : <div className="w-48 h-48 rounded-2xl bg-muted flex items-center justify-center text-8xl shadow-2xl">{enlargedImage.emoji}</div>
            }
            {enlargedImage.label && (
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: 700, color: '#F0EDE6', letterSpacing: '0.04em' }}>{enlargedImage.label}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}