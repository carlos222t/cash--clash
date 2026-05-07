import React, { useState, useEffect } from 'react';
import { auth, profilesApi } from '@/api/supabaseClient';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Users, Trophy, Zap, Crown, LogOut, Settings, Search, CheckCircle2, XCircle, UserPlus, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

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

const Card = ({ children, style = {} }) => (
  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, ...style }}>{children}</div>
);

const GoldButton = ({ children, onClick, variant = 'primary', disabled, style = {} }) => {
  const isPrimary = variant === 'primary';
  return (
    <button disabled={disabled} onClick={onClick} style={{
      padding: '10px 16px', borderRadius: 10, fontWeight: 600, fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      border: `1px solid ${isPrimary ? T.gold : T.goldBorder}`,
      background: isPrimary ? T.gold : T.goldDim,
      color: isPrimary ? T.surface : T.gold,
      opacity: disabled ? 0.5 : 1, ...style
    }}>{children}</button>
  );
};

const InputField = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 12, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{label}</label>}
    <input {...props} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', color: T.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', ...props.style }} />
  </div>
);

function ClanAvatar({ clan, size = 'md' }) {
  const dim = size === 'lg' ? 80 : size === 'md' ? 56 : 40;
  const font = size === 'lg' ? 40 : size === 'md' ? 24 : 18;
  return (
    <div style={{ width: dim, height: dim, borderRadius: 14, background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {clan?.avatar_url ? <img src={clan.avatar_url} alt="clan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: font }}>{clan?.avatar_emoji || '🛡️'}</span>}
    </div>
  );
}

function CustomDialog({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ width: '100%', maxWidth: 440, background: T.surface, border: `1px solid ${T.goldBorder}`, borderRadius: 20, padding: 24, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.gold }}>{title}</h2>
          <X onClick={onClose} style={{ cursor: 'pointer', color: T.textMuted }} />
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ClanFormDialog({ open, onClose, userId, existingClan, onSaved }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [minXP, setMinXP] = useState('0');
  const [avatarEmoji, setAvatarEmoji] = useState('🛡️');
  const [loading, setLoading] = useState(false);
  const isEdit = !!existingClan;

  useEffect(() => {
    if (open) {
      setName(existingClan?.name || '');
      setBio(existingClan?.bio || '');
      setMinXP(String(existingClan?.min_xp ?? 0));
      setAvatarEmoji(existingClan?.avatar_emoji || '🛡️');
    }
  }, [open, existingClan]);

  const handle = async () => {
    if (!name.trim()) { toast.error('Clan name is required'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        const { error } = await supabase.from('clans').update({
          name: name.trim(), bio: bio.trim(), min_xp: parseInt(minXP) || 0, avatar_emoji: avatarEmoji,
        }).eq('id', existingClan.id);
        if (error) throw error;
        toast.success('Clan updated!');
      } else {
        const { data: existing } = await supabase.from('clans').select('id').ilike('name', name.trim()).maybeSingle();
        if (existing) { toast.error('Clan name already taken'); setLoading(false); return; }
        const { data: clan, error } = await supabase.from('clans').insert({
          name: name.trim(), bio: bio.trim(), min_xp: parseInt(minXP) || 0,
          avatar_emoji: avatarEmoji, owner_id: userId, total_wins: 0,
        }).select().single();
        if (error) throw error;
        await supabase.from('clan_members').insert({ clan_id: clan.id, user_id: userId, role: 'owner' });
        toast.success('Clan created!');
      }
      onSaved();
      onClose();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <CustomDialog open={open} onClose={onClose} title={isEdit ? 'Customize Clan' : 'Establish Clan'}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
        {CLAN_AVATARS.map(em => (
          <div key={em} onClick={() => setAvatarEmoji(em)} style={{ height: 40, borderRadius: 8, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px solid ${avatarEmoji === em ? T.gold : 'transparent'}`, background: T.surfaceAlt }}>{em}</div>
        ))}
      </div>
      <InputField label="Clan Name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter name..." />
      <InputField label="Bio / Motto" value={bio} onChange={e => setBio(e.target.value)} placeholder="Clan motto..." />
      <InputField label="Min XP to Join" type="number" value={minXP} onChange={e => setMinXP(e.target.value)} />
      <GoldButton onClick={handle} disabled={loading} style={{ width: '100%' }}>{isEdit ? 'Save Changes' : 'Create Clan'}</GoldButton>
    </CustomDialog>
  );
}

function InviteMembersDialog({ open, onClose, clanId, userId, queryClient }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [invited, setInvited] = useState(new Set());
  const [activeTab, setActiveTab] = useState('friends');

  const { data: friends = [] } = useQuery({
    queryKey: ['invite-friends', userId],
    queryFn: async () => {
      const { data: rows } = await supabase.from('friends')
        .select('*')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('status', 'accepted');
      if (!rows?.length) return [];
      const otherIds = rows.map(r => r.requester_id === userId ? r.recipient_id : r.requester_id);
      const { data: profiles } = await supabase.from('user_profiles')
        .select('id, created_by, username, display_name, custom_avatar_url, xp')
        .in('created_by', otherIds);
      return profiles || [];
    },
    enabled: open && !!userId,
  });

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase.from('user_profiles').select('id, created_by, username, display_name, custom_avatar_url, xp').ilike('username', `%${query.trim()}%`).limit(10);
      setResults(data || []);
    } finally { setSearching(false); }
  };

  const invite = async (profile) => {
    try {
      // Check if already invited
      const { data: existing } = await supabase.from('notifications')
        .select('id').eq('recipient_id', profile.created_by).eq('type', 'clan_invite').eq('related_id', clanId).maybeSingle();
      if (existing) { toast.error('Already invited'); return; }

      const { error } = await supabase.from('notifications').insert({
        recipient_id: profile.created_by,
        sender_id: userId,
        type: 'clan_invite',
        title: `You've been invited to join a clan!`,
        body: `You received a clan invitation. Open your inbox to accept or decline.`,
        related_id: clanId,
        read: false,
      });
      if (error) { console.error('Invite error:', error); toast.error(error.message); }
      else {
        setInvited(prev => new Set([...prev, profile.created_by]));
        toast.success(`Invite sent to ${profile.display_name}!`);
      }
    } catch (e) { console.error(e); toast.error(e.message); }
  };

  const renderProfile = (p) => (
    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {p.custom_avatar_url ? <img src={p.custom_avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{(p.display_name || p.username || '?')[0].toUpperCase()}</span>}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{p.display_name}</p>
        <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>@{p.username} · {p.xp} XP</p>
      </div>
      {invited.has(p.created_by)
        ? <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>✓ Added</span>
        : <GoldButton variant="outline" onClick={() => invite(p)} style={{ padding: '6px 12px', fontSize: 12 }}><UserPlus size={14} /> Add</GoldButton>}
    </div>
  );

  return (
    <CustomDialog open={open} onClose={onClose} title="Invite Members">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(0,0,0,0.2)', padding: 3, borderRadius: 10 }}>
        {[['friends', 'My Friends'], ['search', 'Search All']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === id ? T.goldDim : 'transparent', color: activeTab === id ? T.gold : T.textMuted }}>{label}</button>
        ))}
      </div>
      {activeTab === 'friends' && (
        friends.length === 0
          ? <p style={{ color: T.textDim, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>No friends to invite yet</p>
          : friends.map(renderProfile)
      )}
      {activeTab === 'search' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input placeholder="Search by username..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
              style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', color: T.text, fontSize: 14, outline: 'none' }} />
            <GoldButton onClick={search} disabled={searching}>Search</GoldButton>
          </div>
          {results.map(renderProfile)}
          {results.length === 0 && !searching && <p style={{ color: T.textDim, textAlign: 'center', padding: '20px 0', fontSize: 13 }}>Search for users to invite</p>}
        </>
      )}
    </CustomDialog>
  );
}

function JoinRequestsDialog({ open, onClose, clanId, queryClient }) {
  const { data: requests = [], refetch } = useQuery({
    queryKey: ['clan-join-requests', clanId],
    queryFn: async () => {
      const { data: reqs } = await supabase.from('clan_join_requests')
        .select('*').eq('clan_id', clanId).eq('status', 'pending');
      if (!reqs?.length) return [];
      const userIds = reqs.map(r => r.user_id);
      const { data: profiles } = await supabase.from('user_profiles').select('created_by, username, display_name, xp, custom_avatar_url').in('created_by', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.created_by, p]));
      const data = reqs.map(r => ({ ...r, profile: profileMap[r.user_id] || null }));
      return data || [];
    },
    enabled: open && !!clanId,
  });

  const handle = async (req, action) => {
    if (action === 'accept') {
      const { error } = await supabase.from('clan_members').insert({ clan_id: clanId, user_id: req.user_id, role: 'member' });
      if (error) { toast.error('User may already be in a clan'); return; }
      await supabase.from('clan_join_requests').update({ status: 'accepted' }).eq('id', req.id);
      toast.success(`${req.profile?.display_name} joined!`);
      queryClient.invalidateQueries(['clan-members', clanId]);
      queryClient.invalidateQueries(['clan-requests-count', clanId]);
    } else {
      await supabase.from('clan_join_requests').update({ status: 'rejected' }).eq('id', req.id);
      toast.success('Request rejected');
    }
    refetch();
  };

  return (
    <CustomDialog open={open} onClose={onClose} title={`Join Requests (${requests.length})`}>
      {requests.length === 0
        ? <p style={{ color: T.textDim, textAlign: 'center', padding: '20px 0' }}>No pending requests</p>
        : requests.map(req => (
          <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{(req.profile?.display_name || '?')[0].toUpperCase()}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{req.profile?.display_name}</p>
              <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>@{req.profile?.username} · {req.profile?.xp} XP</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handle(req, 'accept')} style={{ background: T.goldDim, border: `1px solid ${T.goldBorder}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: T.gold }}><CheckCircle2 size={16} /></button>
              <button onClick={() => handle(req, 'reject')} style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#ff4d4d' }}><XCircle size={16} /></button>
            </div>
          </div>
        ))
      }
    </CustomDialog>
  );
}

export default function Clans() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [clanFormOpen, setClanFormOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [tab, setTab] = useState('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [requestedClans, setRequestedClans] = useState(new Set());
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
      const { data } = await supabase.from('clan_members')
        .select('*, profile:user_profiles!clan_members_user_id_fkey(*)')
        .eq('clan_id', myClan.id).order('role', { ascending: true });
      return data || [];
    },
    enabled: !!myClan?.id,
  });

  const { data: pendingInvite } = useQuery({
    queryKey: ['clan-invite', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('notifications')
        .select('*, clan:clans!notifications_related_id_fkey(*)')
        .eq('recipient_id', user.id).eq('type', 'clan_invite').eq('read', false)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      // Fallback: fetch clan separately if join didn't work
      if (data && !data.clan && data.related_id) {
        const { data: clan } = await supabase.from('clans').select('*').eq('id', data.related_id).maybeSingle();
        return { ...data, clan };
      }
      return data;
    },
    enabled: !!user?.id && !myClan,
  });
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['clan-requests-count', myClan?.id],
    queryFn: async () => {
      const { count } = await supabase.from('clan_join_requests').select('id', { count: 'exact', head: true }).eq('clan_id', myClan.id).eq('status', 'pending');
      return count || 0;
    },
    enabled: !!myClan?.id && myRole === 'owner',
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
      toast.error(`Requires ${clan.min_xp} XP to join`); return;
    }
    try {
      const { error } = await supabase.from('clan_join_requests').insert({ clan_id: clan.id, user_id: user.id, status: 'pending' });
      if (error) {
        if (error.code === '23505') toast.error('Already requested to join');
        else throw error;
      } else {
        setRequestedClans(prev => new Set([...prev, clan.id]));
        toast.success('Join request sent!');
      }
    } catch (e) { toast.error(e.message); }
  };

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    try {
      const { error } = await supabase.from('clan_members').insert({ clan_id: pendingInvite.related_id, user_id: user.id, role: 'member' });
      if (error) { toast.error(error.code === '23505' ? 'Already in a clan' : error.message); return; }
      await supabase.from('notifications').update({ read: true }).eq('id', pendingInvite.id);
      toast.success(`Joined ${pendingInvite.clan?.name || 'the clan'}!`);
      queryClient.invalidateQueries(['my-clan-membership', user?.id]);
      queryClient.invalidateQueries(['clan-invite', user?.id]);
    } catch (e) { toast.error(e.message); }
  };

  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;
    await supabase.from('notifications').update({ read: true }).eq('id', pendingInvite.id);
    toast.success('Invite declined');
    queryClient.invalidateQueries(['clan-invite', user?.id]);
  };

  const handleLeaveClan = async () => {
    if (!window.confirm('Are you sure you want to leave this clan?')) return;
    await supabase.from('clan_members').delete().eq('user_id', user.id);
    toast.success('You left the clan');
    queryClient.invalidateQueries(['my-clan-membership', user?.id]);
  };

  const totalClanXP = clanMembers.reduce((s, m) => s + (m.profile?.xp || 0), 0);

  return (
    <div style={{ backgroundColor: T.surface, minHeight: '100vh', width: '100%', color: T.text, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: T.text, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield style={{ color: T.gold, width: 32, height: 32 }} /> Clans
            </h1>
            <p style={{ color: T.textMuted, fontSize: 14, margin: '4px 0 0' }}>Unite with others and dominate the ranks</p>
          </div>
          {!myClan && <GoldButton onClick={() => setClanFormOpen(true)}><Plus size={18} /> Create Clan</GoldButton>}
        </div>

        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 12, marginBottom: 24, border: `1px solid ${T.border}` }}>
          {[['my', 'My Clan'], ['browse', 'Browse']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: tab === id ? T.goldDim : 'transparent', color: tab === id ? T.gold : T.textMuted, transition: 'all 0.2s' }}>{label}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'my' && (
            <motion.div key="my" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!myClan ? (
                <>
                  {pendingInvite && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: T.goldDim, border: `1px solid ${T.goldBorder}`, borderRadius: 16, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                        {pendingInvite.clan?.avatar_emoji || '🛡️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Invitation</p>
                        <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: T.text }}>{pendingInvite.clan?.name || 'A clan'}</p>
                        {pendingInvite.clan?.bio && <p style={{ margin: '2px 0 0', fontSize: 12, color: T.textMuted }}>{pendingInvite.clan.bio}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleAcceptInvite} style={{ background: T.gold, border: 'none', borderRadius: 10, padding: '8px 16px', color: T.surface, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Accept</button>
                        <button onClick={handleDeclineInvite} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 16px', color: T.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Decline</button>
                      </div>
                    </motion.div>
                  )}
                <Card style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                  <Shield size={48} style={{ color: T.textDim, marginBottom: 16 }} />
                  <p style={{ color: T.textMuted }}>You are not currently a member of any clan.</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                    <GoldButton onClick={() => setClanFormOpen(true)}>Establish New Clan</GoldButton>
                    <GoldButton variant="outline" onClick={() => setTab('browse')}>Find a Clan</GoldButton>
                  </div>
                </Card>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Card style={{ border: `1px solid ${T.goldBorder}`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: T.gold }} />
                      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <ClanAvatar clan={myClan} size="lg" />
                        <div style={{ flex: 1 }}>
                          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{myClan.name}</h2>
                          <p style={{ color: T.textMuted, margin: '4px 0' }}>{myClan.bio || 'No clan biography set.'}</p>
                          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                            <div><span style={{ display: 'block', fontSize: 10, color: T.textDim, textTransform: 'uppercase', fontWeight: 800 }}>Wins</span><span style={{ color: T.gold, fontWeight: 700 }}>{myClan.total_wins || 0}</span></div>
                            <div><span style={{ display: 'block', fontSize: 10, color: T.textDim, textTransform: 'uppercase', fontWeight: 800 }}>Total XP</span><span style={{ color: T.text, fontWeight: 700 }}>{totalClanXP.toLocaleString()}</span></div>
                            <div><span style={{ display: 'block', fontSize: 10, color: T.textDim, textTransform: 'uppercase', fontWeight: 800 }}>Members</span><span style={{ color: T.text, fontWeight: 700 }}>{clanMembers.length}</span></div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: T.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={16} /> Members ({clanMembers.length})</h3>
                        {myRole === 'owner' && <GoldButton variant="outline" onClick={() => setInviteOpen(true)} style={{ padding: '6px 12px', fontSize: 12 }}><UserPlus size={14} /> Invite</GoldButton>}
                      </div>
                      {clanMembers.map(m => (
                        <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {m.profile?.custom_avatar_url ? <img src={m.profile.custom_avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{(m.profile?.display_name || '?')[0].toUpperCase()}</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600, fontSize: 14 }}>{m.profile?.display_name}</span>
                              {m.role === 'owner' && <Crown size={12} style={{ color: T.gold }} />}
                            </div>
                            <span style={{ fontSize: 11, color: T.textDim }}>{(m.profile?.xp || 0).toLocaleString()} XP</span>
                          </div>
                          <span style={{ fontSize: 10, textTransform: 'uppercase', color: T.textDim, fontWeight: 700 }}>{m.role}</span>
                        </div>
                      ))}
                    </Card>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Card style={{ background: T.goldDim, borderColor: T.goldBorder }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 12, color: T.gold, fontWeight: 800, textTransform: 'uppercase' }}>Requirements</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={14} style={{ color: T.gold }} /><span style={{ fontSize: 13 }}>{(myClan.min_xp || 0).toLocaleString()} Min XP</span></div>
                    </Card>
                    {myRole === 'owner' && (
                      <>
                        <GoldButton variant="outline" onClick={() => setClanFormOpen(true)} style={{ width: '100%' }}><Edit2 size={14} /> Customize Clan</GoldButton>
                        <button onClick={() => setRequestsOpen(true)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 16px', color: T.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          Join Requests
                          {pendingCount > 0 && <span style={{ background: T.gold, color: T.surface, borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingCount}</span>}
                        </button>
                      </>
                    )}
                    {myRole !== 'owner' && (
                      <button onClick={handleLeaveClan} style={{ background: 'transparent', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <LogOut size={14} /> Leave Clan
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
                  <input placeholder="Search by clan name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <GoldButton onClick={handleSearch} disabled={searching}>Search</GoldButton>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
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
                    {!myClan && (requestedClans.has(clan.id)
                      ? <span style={{ fontSize: 12, color: T.gold, fontWeight: 600, padding: '8px 12px' }}>✓ Requested</span>
                      : <GoldButton onClick={() => handleJoinRequest(clan)} variant="outline">Request</GoldButton>
                    )}
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

        <ClanFormDialog
          open={clanFormOpen}
          onClose={() => setClanFormOpen(false)}
          userId={user?.id}
          existingClan={myClan && myRole === 'owner' ? myClan : null}
          onSaved={() => queryClient.invalidateQueries(['my-clan-membership', user?.id])}
        />
        <InviteMembersDialog open={inviteOpen} onClose={() => setInviteOpen(false)} clanId={myClan?.id} userId={user?.id} queryClient={queryClient} />
        <JoinRequestsDialog open={requestsOpen} onClose={() => setRequestsOpen(false)} clanId={myClan?.id} queryClient={queryClient} />
      </div>
    </div>
  );
}