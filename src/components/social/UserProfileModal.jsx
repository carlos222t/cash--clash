import React, { useEffect, useState } from 'react';
import { friendsApi, notificationsApi } from '@/api/supabaseClient';
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

export default function UserProfileModal({ profile, onClose, currentUserId, myProfile }) {
  const [relationship, setRelationship] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [clan, setClan] = useState(null);
  const [rankExpanded, setRankExpanded] = useState(false);
  const navigate = useNavigate();
  const godly = isGodly(profile);
  const level = getLevelFromXP(profile?.xp || 0);

  useEffect(() => {
    if (currentUserId && profile?.created_by) {
      friendsApi.getRelationship(currentUserId, profile.created_by).then(setRelationship);
    }
    if (profile?.created_by) {
      supabase.from('clan_members').select('*, clan:clans(*)').eq('user_id', profile.created_by).maybeSingle()
        .then(({ data }) => { if (data?.clan) setClan(data.clan); });
    }
  }, [currentUserId, profile?.created_by]);

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
        <DialogContent className="max-w-sm p-0 overflow-hidden">

          {godly ? (
            <div className="relative h-16 overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7A4900, #FFD700, #FFA500, #FFD700, #7A4900)', backgroundSize: '300% 300%' }}>
              <p className="text-xs font-black tracking-[0.3em] text-amber-900/80 uppercase z-10">✨ Godly Player ✨</p>
            </div>
          ) : (
            <div className="h-3 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30" />
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
                  <h2 className="font-heading font-bold text-lg leading-tight truncate">{profile?.display_name}</h2>
                  <img
                    src={getRankImg(level)}
                    alt="rank"
                    title="Click to see rank progression"
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setRankExpanded(v => !v)}
                  />
                  {godly && <GodlyBadgePill />}
                </div>
                <p className="text-sm text-muted-foreground">@{profile?.username}</p>
              </div>
            </div>

            {profile?.bio && (
              <p className="text-sm text-muted-foreground italic mb-4">"{profile.bio}"</p>
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
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,237,230,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: Zap,    label: 'Level',       value: profile?.level || 1 },
                { icon: Star,   label: 'XP',          value: (profile?.xp || 0).toLocaleString() },
                { icon: Swords, label: 'Battles Won', value: profile?.battles_won || 0 },
              ].map(stat => (
                <div key={stat.label} className={`rounded-xl p-2.5 text-center ${godly ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-muted'}`}>
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${godly ? 'text-yellow-500' : 'text-primary'}`} />
                  <p className="font-bold text-sm font-heading">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Badges — image grid */}
            {profile?.badges?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Badges</p>
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
              <div className="mb-4 flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <div
                  className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setEnlargedImage({ src: clan.avatar_url, emoji: clan.avatar_emoji || '🛡️' })}
                >
                  {clan.avatar_url ? <img src={clan.avatar_url} alt="clan" className="w-full h-full object-cover" /> : <span>{clan.avatar_emoji || '🛡️'}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" /> Clan</p>
                  <p className="text-sm font-semibold truncate">{clan.name}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {currentUserId !== profile?.created_by && (
              <div className="flex gap-2">
                {isFriend ? (
                  <>
                    <Button variant="secondary" className="flex-1 gap-2" disabled>
                      <UserCheck className="w-4 h-4" /> Friends
                    </Button>
                    <Button className="flex-1 gap-2" onClick={handleChallenge}>
                      <Swords className="w-4 h-4" /> Challenge
                    </Button>
                  </>
                ) : isPending ? (
                  <Button variant="outline" className="flex-1 gap-2" disabled>
                    <UserCheck className="w-4 h-4" /> Request Sent
                  </Button>
                ) : (
                  <Button onClick={handleAddFriend} className="flex-1 gap-2" disabled={loading}>
                    <UserPlus className="w-4 h-4" /> Add Friend
                  </Button>
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
