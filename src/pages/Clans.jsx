import React, { useState, useEffect } from 'react';
import { auth, profilesApi, friendsApi } from '@/api/supabaseClient';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Users, Trophy, Zap, Crown, LogOut, Settings, Search, CheckCircle2, XCircle, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

// --- THEME CONSTANTS ---
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

const CLAN_AVATARS = ['🛡️','⚔️','🔥','💎','👑','🦅','🐉','🌟','💰','🏆','🦁','🐺','🌙','⚡','🎯'];

// --- CUSTOM STYLED COMPONENTS ---

const Card = ({ children, style = {} }) => (
  <div style={{ 
    background: T.surfaceAlt, 
    border: `1px solid ${T.border}`, 
    borderRadius: 16, 
    padding: 20, 
    ...style 
  }}>{children}</div>
);

const GoldButton = ({ children, onClick, variant = 'primary', disabled, style = {} }) => {
  const isPrimary = variant === 'primary';
  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '10px 16px',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        border: `1px solid ${isPrimary ? T.gold : T.goldBorder}`,
        background: isPrimary ? T.gold : T.goldDim,
        color: isPrimary ? T.surface : T.gold,
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
    >{children}</button>
  );
};

const InputField = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 12, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{label}</label>}
    <input 
      {...props}
      style={{
        width: '100%',
        background: 'rgba(0,0,0,0.2)',
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: '10px 12px',
        color: T.text,
        fontSize: 14,
        outline: 'none',
        ...props.style
      }}
    />
  </div>
);

function ClanAvatar({ clan, size = 'md', onClick }) {
  const dim = size === 'lg' ? 80 : size === 'md' ? 56 : 40;
  const font = size === 'lg' ? 40 : size === 'md' ? 24 : 18;
  
  return (
    <div
      onClick={onClick}
      style={{
        width: dim, height: dim,
        borderRadius: 14,
        background: T.goldDim,
        border: `1px solid ${T.goldBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden', flexShrink: 0
      }}
    >
      {clan?.avatar_url
        ? <img src={clan.avatar_url} alt="clan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: font }}>{clan?.avatar_emoji || '🛡️'}</span>
      }
    </div>
  );
}

// --- MODALS ---

function CustomDialog({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ width: '100%', maxWidth: 400, background: T.surface, border: `1px solid ${T.goldBorder}`, borderRadius: 20, padding: 24, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.gold }}>{title}</h2>
          <X onClick={onClose} style={{ cursor: 'pointer', color: T.textMuted }} />
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function CreateClanDialog({ open, onClose, userId, onCreated }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [minXP, setMinXP] = useState('0');
  const [avatarEmoji, setAvatarEmoji] = useState('🛡️');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!name.trim()) { toast.error('Clan name is required'); return; }
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('clans').select('id').ilike('name', name.trim()).maybeSingle();
      if (existing) { toast.error('Clan name already taken'); return; }

      const { data: clan, error } = await supabase.from('clans').insert({
        name: name.trim(), bio: bio.trim(), min_xp: parseInt(minXP) || 0,
        avatar_emoji: avatarEmoji, avatar_url: avatarUrl.trim() || null,
        owner_id: userId, total_wins: 0,
      }).select().single();

      if (error) throw error;
      await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: userId, role: 'owner' });
      toast.success(`Clan "${clan.name}" created!`);
      onCreated(clan);
      onClose();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <CustomDialog open={open} onClose={onClose} title="Establish Clan">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
        {CLAN_AVATARS.map(em => (
          <div key={em} onClick={() => setAvatarEmoji(em)} style={{
            height: 40, borderRadius: 8, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: `2px solid ${avatarEmoji === em ? T.gold : 'transparent'}`, background: T.surfaceAlt
          }}>{em}</div>
        ))}
      </div>
      <InputField label="Clan Name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter name..." />
      <InputField label="Bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Clan motto..." />
      <InputField label="Min XP" type="number" value={minXP} onChange={e => setMinXP(e.target.value)} />
      <GoldButton onClick={handle} disabled={loading} style={{ width: '100%' }}>Create Clan</GoldButton>
    </CustomDialog>
  );
}

// --- MAIN PAGE ---

export default function Clans() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState('my'); // 'my' | 'browse'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      profilesApi.getByUserId(u.id).then(setMyProfile).catch(() => {});
    }).catch(() => {});
  }, []);

  const { data: myMembership } = useQuery({
    queryKey: ['my-clan-membership', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('clan_members').select('*, clan:clans(*)').eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const myClan = myMembership?.clan;
  const myRole = myMembership?.role;

  const { data: clanMembers = [] } = useQuery({
    queryKey: ['clan-members', myClan?.id],
    queryFn: async () => {
      const { data } = await supabase.from('clan_members').select('*, profile:user_profiles!clan_members_user_id_fkey(*)').eq('clan_id', myClan.id).order('role', { ascending: true });
      return data || [];
    },
    enabled: !!myClan?.id,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase.from('clans').select('*').ilike('name', `%${searchQuery.trim()}%`).limit(10);
      setSearchResults(data || []);
    } finally { setSearching(false); }
  };

  const handleJoinRequest = async (clan) => {
    if ((myProfile?.xp || 0) < (clan.min_xp || 0)) {
      toast.error(`Requires ${clan.min_xp} XP`); return;
    }
    const { error } = await supabase.from('clan_join_requests').insert({ clan_id: clan.id, user_id: user.id, status: 'pending' });
    if (error) toast.error('Request failed');
    else toast.success('Join request sent!');
  };

  const totalClanXP = clanMembers.reduce((s, m) => s + (m.profile?.xp || 0), 0);

  return (
    <div style={{ backgroundColor: T.surface, minHeight: '100vh', width: '100%', color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: T.text, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield style={{ color: T.gold, width: 32, height: 32 }} /> Clans
            </h1>
            <p style={{ color: T.textMuted, fontSize: 14, margin: '4px 0 0' }}>Unite with others and dominate the ranks</p>
          </div>
          {!myClan && (
            <GoldButton onClick={() => setCreateOpen(true)}><Plus size={18}/> Create Clan</GoldButton>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, marginBottom: 24, border: `1px solid ${T.border}` }}>
          {[['my','My Clan'], ['browse','Browse']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: tab === id ? T.goldDim : 'transparent',
              color: tab === id ? T.gold : T.textMuted,
              transition: 'all 0.2s'
            }}>{label}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'my' && (
            <motion.div key="my" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!myClan ? (
                <Card style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                  <Shield size={48} style={{ color: T.textDim, marginBottom: 16 }} />
                  <p style={{ color: T.textMuted }}>You are not currently a member of any clan.</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                    <GoldButton onClick={() => setCreateOpen(true)}>Establish New Clan</GoldButton>
                    <GoldButton variant="outline" onClick={() => setTab('browse')}>Find a Clan</GoldButton>
                  </div>
                </Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Card style={{ border: `1px solid ${T.goldBorder}`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: T.gold }} />
                      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <ClanAvatar clan={myClan} size="lg" />
                        <div>
                          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{myClan.name}</h2>
                          <p style={{ color: T.textMuted, margin: '4px 0' }}>{myClan.bio || 'No clan biography set.'}</p>
                          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                            <div>
                                <span style={{ display: 'block', fontSize: 10, color: T.textDim, textTransform: 'uppercase', fontWeight: 800 }}>Clan Wins</span>
                                <span style={{ color: T.gold, fontWeight: 700 }}>{myClan.total_wins || 0}</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: 10, color: T.textDim, textTransform: 'uppercase', fontWeight: 800 }}>Total XP</span>
                                <span style={{ color: T.text, fontWeight: 700 }}>{totalClanXP.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card>
                        <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: T.textMuted, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Users size={16} /> Members ({clanMembers.length})
                        </h3>
                        {clanMembers.map(m => (
                            <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.gold }}>
                                    {m.profile?.display_name?.[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>{m.profile?.display_name}</span>
                                        {m.role === 'owner' && <Crown size={12} style={{ color: T.gold }} />}
                                    </div>
                                    <span style={{ fontSize: 11, color: T.textDim }}>{m.profile?.xp} XP</span>
                                </div>
                                <span style={{ fontSize: 10, textTransform: 'uppercase', color: T.textDim, fontWeight: 700 }}>{m.role}</span>
                            </div>
                        ))}
                    </Card>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                     <Card style={{ background: T.goldDim, borderColor: T.goldBorder }}>
                        <h4 style={{ margin: '0 0 8px', fontSize: 12, color: T.gold, fontWeight: 800, textTransform: 'uppercase' }}>Requirements</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={14} style={{ color: T.gold }} />
                            <span style={{ fontSize: 13 }}>{myClan.min_xp.toLocaleString()} Min XP</span>
                        </div>
                     </Card>
                     {myRole !== 'owner' && (
                        <button onClick={() => {}} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: '#ff4d4d', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Leave Clan
                        </button>
                     )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'browse' && (
            <motion.div key="browse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textDim }} />
                        <input 
                            placeholder="Search by clan name..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            style={{ width: '100%', padding: '12px 12px 12px 40px', background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text }} 
                        />
                    </div>
                    <GoldButton onClick={handleSearch} disabled={searching}>Search</GoldButton>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    {searchResults.map(clan => (
                        <Card key={clan.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <ClanAvatar clan={clan} size="md" />
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{clan.name}</h4>
                                <p style={{ margin: '2px 0', fontSize: 12, color: T.textMuted }}>{clan.bio}</p>
                                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                    <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>{clan.min_xp} XP REQ</span>
                                    <span style={{ fontSize: 11, color: T.textDim, fontWeight: 700 }}>{clan.total_wins} WINS</span>
                                </div>
                            </div>
                            {!myClan && <GoldButton onClick={() => handleJoinRequest(clan)} variant="outline">Request</GoldButton>}
                        </Card>
                    ))}
                    {searchResults.length === 0 && !searching && (
                         <div style={{ textAlign: 'center', padding: '40px', color: T.textDim }}>
                            <Trophy size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
                            <p>Search for a clan to join the competition.</p>
                         </div>
                    )}
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CreateClanDialog 
            open={createOpen} 
            onClose={() => setCreateOpen(false)} 
            userId={user?.id} 
            onCreated={() => queryClient.invalidateQueries(['my-clan-membership'])} 
        />
      </div>
    </div>
  );
}