import React, { useState, useEffect, useRef } from 'react';
import { auth, entities, profilesApi } from '@/api/supabaseClient';
import { supabase, friendsApi } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon, User, Camera, Save, LogOut,
  Shield, Palette, RefreshCw, CheckCircle2, AtSign, Globe, X, Ban, UserX,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const tk = {
  gold:       '#B8973A',
  goldLight:  '#D4AF5A',
  goldDim:    'rgba(184,151,58,0.15)',
  goldBorder: 'rgba(184,151,58,0.28)',
  dark:       '#0C0C0E',
  surface:    '#111114',
  surfaceAlt: '#16161A',
  border:     'rgba(255,255,255,0.07)',
  text:       '#F0EDE6',
  muted:      'rgba(240,237,230,0.45)',
  dim:        'rgba(240,237,230,0.22)',
  red:        '#C0665A',
  redDim:     'rgba(192,102,90,0.15)',
  redBorder:  'rgba(192,102,90,0.3)',
  green:      '#6EAF7A',
  greenDim:   'rgba(110,175,122,0.15)',
  greenBorder:'rgba(110,175,122,0.3)',
};

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@500;600;700&display=swap');

  .cc-settings * { box-sizing: border-box; }

  /* ── cards ── */
  .cc-settings [class*="card"], .cc-settings [class*="Card"],
  .cc-settings .rounded-xl, .cc-settings .rounded-2xl, .cc-settings .rounded-lg {
    background: #16161A !important; border-color: rgba(255,255,255,0.07) !important; color: #F0EDE6 !important;
  }
  .cc-settings [class*="CardHeader"] { border-bottom: 1px solid rgba(255,255,255,0.06) !important; }
  .cc-settings [class*="CardTitle"]  { color: #F0EDE6 !important; }
  .cc-settings [class*="CardDescription"] { color: rgba(240,237,230,0.45) !important; }

  /* ── text ── */
  .cc-settings [class*="text-foreground"], .cc-settings [class*="text-card-foreground"] { color: #F0EDE6 !important; }
  .cc-settings [class*="text-muted-foreground"] { color: rgba(240,237,230,0.45) !important; }
  .cc-settings label, .cc-settings [class*="Label"] { color: rgba(240,237,230,0.6) !important; }
  .cc-settings h1, .cc-settings h2, .cc-settings h3 { color: #F0EDE6 !important; }

  /* ── inputs ── */
  .cc-settings input:not([type="range"]), .cc-settings textarea, .cc-settings select {
    background: #0C0C0E !important; border-color: rgba(255,255,255,0.1) !important;
    color: #F0EDE6 !important; border-radius: 8px !important;
  }
  .cc-settings input::placeholder, .cc-settings textarea::placeholder { color: rgba(240,237,230,0.25) !important; }
  .cc-settings input:focus, .cc-settings textarea:focus, .cc-settings select:focus {
    outline: none !important; border-color: rgba(184,151,58,0.5) !important;
    box-shadow: 0 0 0 3px rgba(184,151,58,0.08) !important;
  }
  .cc-settings select option { background: #16161A !important; color: #F0EDE6 !important; }

  /* ── buttons ── */
  .cc-settings button[class*="bg-primary"], .cc-settings [class*="Button"][class*="default"] {
    background: #B8973A !important; color: #0C0C0E !important; border: none !important;
  }
  .cc-settings button[class*="bg-primary"]:hover { background: #D4AF5A !important; }
  .cc-settings button[class*="variant-outline"], .cc-settings button[class*="outline"] {
    border-color: rgba(255,255,255,0.1) !important; color: #F0EDE6 !important; background: transparent !important;
  }
  .cc-settings button[class*="variant-outline"]:hover { border-color: rgba(184,151,58,0.4) !important; }
  .cc-settings button[class*="variant-ghost"]:hover { background: rgba(255,255,255,0.05) !important; }
  .cc-settings button[class*="variant-destructive"] { background: ${tk.red} !important; color: #fff !important; }

  /* ── badges ── */
  .cc-settings [class*="badge"], .cc-settings [class*="Badge"] {
    background: rgba(184,151,58,0.12) !important; color: #B8973A !important; border-color: rgba(184,151,58,0.25) !important;
  }

  /* ── borders ── */
  .cc-settings [class*="border-border"], .cc-settings [class*="border-input"] { border-color: rgba(255,255,255,0.07) !important; }
  .cc-settings [class*="border-destructive"] { border-color: rgba(192,102,90,0.3) !important; }
  .cc-settings hr, .cc-settings [class*="separator"] { background: rgba(255,255,255,0.07) !important; }

  /* ── muted bg ── */
  .cc-settings [class*="bg-muted"] { background: rgba(255,255,255,0.05) !important; }
  .cc-settings [class*="bg-background"] { background: #0C0C0E !important; }

  /* ── text-primary accents ── */
  .cc-settings [class*="text-primary"]:not(button) { color: #B8973A !important; }
  .cc-settings [class*="text-destructive"] { color: #C0665A !important; }
  .cc-settings [class*="text-green"] { color: #6EAF7A !important; }
  .cc-settings [class*="text-amber"] { color: #B8973A !important; }

  /* ── scrollbar ── */
  .cc-settings ::-webkit-scrollbar { width: 4px; }
  .cc-settings ::-webkit-scrollbar-thumb { background: rgba(184,151,58,0.3); border-radius: 99px; }

  /* ── avatar picker button active ── */
  .cc-settings .avatar-active { border-color: #B8973A !important; background: rgba(184,151,58,0.12) !important; }

  /* ── profile stat card ── */
  .cc-stat-card { background: rgba(184,151,58,0.07); border: 1px solid rgba(184,151,58,0.15); border-radius: 12px; padding: 12px; text-align: center; }
`;

const REGIONS = [
  { value: 'us',    label: '🇺🇸 United States',  currency: 'USD', symbol: '$'   },
  { value: 'gb',    label: '🇬🇧 United Kingdom',  currency: 'GBP', symbol: '£'   },
  { value: 'eu',    label: '🇪🇺 European Union',   currency: 'EUR', symbol: '€'   },
  { value: 'ca',    label: '🇨🇦 Canada',           currency: 'CAD', symbol: 'CA$' },
  { value: 'au',    label: '🇦🇺 Australia',        currency: 'AUD', symbol: 'A$'  },
  { value: 'mx',    label: '🇲🇽 Mexico',           currency: 'MXN', symbol: 'MX$' },
  { value: 'br',    label: '🇧🇷 Brazil',           currency: 'BRL', symbol: 'R$'  },
  { value: 'in',    label: '🇮🇳 India',            currency: 'INR', symbol: '₹'   },
  { value: 'jp',    label: '🇯🇵 Japan',            currency: 'JPY', symbol: '¥'   },
  { value: 'cn',    label: '🇨🇳 China',            currency: 'CNY', symbol: '¥'   },
  { value: 'za',    label: '🇿🇦 South Africa',     currency: 'ZAR', symbol: 'R'   },
  { value: 'ng',    label: '🇳🇬 Nigeria',          currency: 'NGN', symbol: '₦'   },
  { value: 'other', label: '🌍 Other',             currency: 'USD', symbol: '$'   },
];

const AVATAR_PRESETS = [
  { id: 'avatar1',  emoji: '🦁', label: 'Lion'      },
  { id: 'avatar2',  emoji: '🐯', label: 'Tiger'     },
  { id: 'avatar3',  emoji: '🦊', label: 'Fox'       },
  { id: 'avatar4',  emoji: '🐺', label: 'Wolf'      },
  { id: 'avatar5',  emoji: '🦅', label: 'Eagle'     },
  { id: 'avatar6',  emoji: '🐉', label: 'Dragon'    },
  { id: 'avatar7',  emoji: '🦄', label: 'Unicorn'   },
  { id: 'avatar8',  emoji: '🐻', label: 'Bear'      },
  { id: 'avatar9',  emoji: '🦈', label: 'Shark'     },
  { id: 'avatar10', emoji: '🍆', label: 'EggyWeggy' },
  { id: 'avatar11', emoji: '🐸', label: 'Frog'      },
  { id: 'avatar12', emoji: '🦉', label: 'Owl'       },
];

/* ─── Blocked Users Tab ──────────────────────────────────────────────────── */
function BlockedUsersTab({ userId }) {
  const [blocked, setBlocked] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: rows } = await supabase
        .from('friends')
        .select('id, requester_id, recipient_id')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('status', 'blocked');
      if (!rows?.length) { setBlocked([]); setLoading(false); return; }
      const otherIds = rows.map(r => r.requester_id === userId ? r.recipient_id : r.requester_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username')
        .in('id', otherIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      setBlocked(rows.map(r => ({
        ...r,
        other: profileMap[r.requester_id === userId ? r.recipient_id : r.requester_id] || {},
      })));
      setLoading(false);
    })();
  }, [userId]);

  const handleUnblock = async (row) => {
    await friendsApi.remove(row.id);
    setBlocked(prev => prev.filter(r => r.id !== row.id));
    toast.success('User unblocked');
  };

  if (loading) return (
    <p style={{ fontSize: 13, color: tk.muted, textAlign: 'center', padding: '24px 0' }}>Loading...</p>
  );

  return (
    <div style={{ background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <UserX style={{ width: 14, height: 14, color: tk.gold }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Blocked Users</span>
        <span style={{ fontSize: 11, color: tk.muted, marginLeft: 2 }}>— these users cannot interact with you</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        {blocked.length === 0 ? (
          <p style={{ fontSize: 13, color: tk.muted, textAlign: 'center', padding: '16px 0', margin: 0 }}>No blocked users.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {blocked.map(row => {
              const name     = row.other?.display_name || row.other?.username || 'Unknown';
              const username = row.other?.username ? `@${row.other.username}` : '';
              return (
                <div key={row.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${tk.border}` }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: tk.text }}>{name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: tk.muted }}>{username}</p>
                  </div>
                  <button
                    onClick={() => handleUnblock(row)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: tk.redDim, color: tk.red, border: `1px solid ${tk.redBorder}`, cursor: 'pointer', transition: 'opacity 0.15s', fontFamily: 'inherit' }}
                  >
                    <X style={{ width: 11, height: 11 }} /> Unblock
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Settings() {
  const [user,              setUser]              = useState(null);
  const [displayName,       setDisplayName]       = useState('');
  const [username,          setUsername]          = useState('');
  const [bio,               setBio]               = useState('');
  const [selectedAvatar,    setSelectedAvatar]    = useState('avatar1');
  const [customAvatarUrl,   setCustomAvatarUrl]   = useState('');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isSaving,          setIsSaving]          = useState(false);
  const [hasChanges,        setHasChanges]        = useState(false);
  const [activeTab,         setActiveTab]         = useState('profile');
  const [region,            setRegion]            = useState('us');
  const [myClan,            setMyClan]            = useState(null);
  const [enlargedImage,     setEnlargedImage]     = useState(null);
  const queryClient    = useQueryClient();
  const originalValues = useRef({});
  const initialized    = useRef(false);
  const { logout }     = useAuth();

  useEffect(() => { auth.me().then(u => {
    setUser(u);
    supabase.from('clan_members').select('*, clan:clans(*)').eq('user_id', u.id).maybeSingle()
      .then(({ data }) => { if (data?.clan) setMyClan(data.clan); });
  }).catch(() => {}); }, []);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => entities.UserProfile.filter({ created_by: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = profiles?.[0];

  useEffect(() => {
    if (profile && !initialized.current) {
      const name      = profile.display_name || user?.full_name || '';
      const uname     = profile.username || '';
      const bioVal    = profile.bio || '';
      const avatar    = profile.avatar_id || 'avatar1';
      const avatarUrl = profile.custom_avatar_url || '';
      const reg       = profile.region || 'us';
      setDisplayName(name); setUsername(uname); setBio(bioVal);
      setSelectedAvatar(avatar); setRegion(reg);
      setCustomAvatarUrl(avatarUrl); setCustomAvatarInput(avatarUrl);
      originalValues.current = { name, uname, bioVal, avatar, avatarUrl, reg };
      initialized.current = true;
    }
  }, [profile, user]);

  useEffect(() => {
    const changed =
      displayName !== originalValues.current.name ||
      username    !== originalValues.current.uname ||
      bio         !== originalValues.current.bioVal ||
      selectedAvatar  !== originalValues.current.avatar ||
      customAvatarUrl !== originalValues.current.avatarUrl ||
      region          !== originalValues.current.reg;
    setHasChanges(changed);
  }, [displayName, username, bio, selectedAvatar, customAvatarUrl]);

  const handleSaveProfile = async () => {
    if (!displayName.trim())          { toast.error('Display name cannot be empty'); return; }
    if (displayName.trim().length < 2){ toast.error('Display name must be at least 2 characters'); return; }
    if (displayName.trim().length > 30){ toast.error('Display name must be 30 characters or less'); return; }
    if (username.trim()) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
        toast.error('Username must be 3–20 characters: letters, numbers, underscores only'); return;
      }
      if (username.trim().toLowerCase() !== originalValues.current.uname) {
        const { data: existing } = await supabase
          .from('user_profiles').select('id').eq('username', username.trim().toLowerCase()).maybeSingle();
        if (existing && existing.id !== profile?.id) {
          toast.error('Username already taken. Choose another.'); return;
        }
      }
    }
    setIsSaving(true);
    try {
      const updateData = {
        display_name: displayName.trim(), username: username.trim().toLowerCase(),
        bio: bio.trim(), avatar_id: selectedAvatar, custom_avatar_url: customAvatarUrl,
        email: user?.email, region,
        currency: REGIONS.find(r => r.value === region)?.currency || 'USD',
        currency_symbol: REGIONS.find(r => r.value === region)?.symbol || '$',
      };
      if (profile) {
        await entities.UserProfile.update(profile.id, updateData);
      } else {
        await entities.UserProfile.create({
          ...updateData, created_by: user?.id,
          level: 1, xp: 0, total_saved: 0, monthly_budget: 0,
          monthly_income: 0, badges: [], streak_days: 0, battles_won: 0, tournament_wins: 0,
        });
      }
      originalValues.current = {
        name: updateData.display_name, uname: updateData.username,
        bioVal: updateData.bio, avatar: updateData.avatar_id,
        avatarUrl: updateData.custom_avatar_url, reg: updateData.region,
      };
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setHasChanges(false);
      toast.success('Profile saved! ✅');
    } catch (err) {
      toast.error('Failed to save profile. Please try again.');
    } finally { setIsSaving(false); }
  };

  const handleApplyCustomAvatar = () => {
    if (!customAvatarInput.trim()) { toast.error('Please enter an image URL'); return; }
    try { new URL(customAvatarInput.trim()); } catch { toast.error('Please enter a valid URL'); return; }
    setCustomAvatarUrl(customAvatarInput.trim()); setSelectedAvatar('custom');
    toast.success('Custom avatar applied!');
  };

  const handleClearCustomAvatar = () => {
    setCustomAvatarUrl(''); setCustomAvatarInput(''); setSelectedAvatar('avatar1');
  };

  const handleLogout      = () => logout();
  const handleResetChanges = () => {
    setDisplayName(originalValues.current.name); setUsername(originalValues.current.uname);
    setBio(originalValues.current.bioVal); setSelectedAvatar(originalValues.current.avatar);
    setCustomAvatarUrl(originalValues.current.avatarUrl); setCustomAvatarInput(originalValues.current.avatarUrl);
    setRegion(originalValues.current.reg); setHasChanges(false); toast('Changes reset');
  };

  const getAvatarDisplay = () => {
    if (customAvatarUrl && selectedAvatar === 'custom') return { type: 'image', value: customAvatarUrl };
    const preset = AVATAR_PRESETS.find(a => a.id === selectedAvatar);
    return { type: 'emoji', value: preset?.emoji || '🦁' };
  };
  const avatarDisplay = getAvatarDisplay();

  const TABS = [
    { id: 'profile',    label: 'Profile',    icon: User    },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account',    label: 'Account',    icon: Shield  },
    { id: 'blocked',    label: 'Blocked',    icon: Ban     },
  ];

  if (isLoading) return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tk.dark }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${tk.goldDim}`, borderTopColor: tk.gold, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div
        className="cc-settings"
        style={{ minHeight: '100vh', background: tk.dark, color: tk.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>

          {/* ── PAGE HEADER ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: tk.surface, border: `1px solid ${tk.goldBorder}`, padding: '22px 26px', marginBottom: 20 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: `linear-gradient(90deg,transparent,${tk.gold},transparent)`, opacity: 0.5 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: tk.goldDim, border: `1px solid ${tk.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SettingsIcon style={{ width: 15, height: 15, color: tk.gold }} />
              </div>
              <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: 26, color: tk.text, lineHeight: 1.1 }}>Settings</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: tk.muted }}>Manage your profile and account preferences</p>
          </motion.div>

          {/* ── PROFILE PREVIEW CARD ──────────────────────────────────── */}
          <div style={{ background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 12 }}>
              <div
                onClick={() => setEnlargedImage({ src: avatarDisplay.type === 'image' ? avatarDisplay.value : null, emoji: avatarDisplay.value })}
                style={{ width: 60, height: 60, borderRadius: 14, border: `2px solid ${tk.goldBorder}`, background: tk.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', transition: 'opacity 0.15s' }}
              >
                {avatarDisplay.type === 'image'
                  ? <img src={avatarDisplay.value} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>{avatarDisplay.value}</span>}
              </div>
              <div style={{ paddingBottom: 2 }}>
                <h2 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 600, color: tk.text }}>{displayName || user?.full_name || 'Player'}</h2>
                {username
                  ? <p style={{ margin: 0, fontSize: 12, color: tk.muted, display: 'flex', alignItems: 'center', gap: 4 }}><AtSign style={{ width: 11, height: 11 }} />{username}</p>
                  : <p style={{ margin: 0, fontSize: 12, color: tk.dim, fontStyle: 'italic' }}>No username set</p>}
                {bio && <p style={{ margin: '2px 0 0', fontSize: 11, color: tk.muted, fontStyle: 'italic' }}>"{bio}"</p>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: tk.goldDim, color: tk.gold, border: `1px solid ${tk.goldBorder}`, letterSpacing: '0.04em' }}>Level {profile?.level || 1}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: tk.muted, border: `1px solid ${tk.border}` }}>{(profile?.xp || 0).toLocaleString()} XP</span>
              {myClan && (
                <button
                  onClick={() => setEnlargedImage({ src: myClan.avatar_url, emoji: myClan.avatar_emoji || '🛡️' })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: tk.goldDim, color: tk.gold, border: `1px solid ${tk.goldBorder}`, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  🛡️ {myClan.name}
                </button>
              )}
              {hasChanges && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(184,151,58,0.2)', color: tk.gold, border: `1px solid ${tk.goldBorder}` }}>Unsaved changes</span>}
            </div>
          </div>

          {/* ── TAB BAR ───────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 3, background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 11, padding: 3, marginBottom: 16 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 6px', borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', border: 'none', transition: 'all 0.15s', fontFamily: 'inherit',
                  background: active ? tk.gold : 'transparent',
                  color: active ? tk.dark : tk.muted,
                  boxShadow: active ? `0 1px 8px rgba(184,151,58,0.35)` : 'none',
                }}>
                  <tab.icon style={{ width: 13, height: 13 }} />
                  <span style={{ display: 'none' }} className="sm-show">{tab.label}</span>
                  <span className="hide-mobile">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <style>{`.hide-mobile { display: inline; } @media(max-width:480px){.hide-mobile{display:none;}}`}</style>

          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}>

            {/* ── PROFILE TAB ─────────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Display Info */}
                <div style={{ background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User style={{ width: 14, height: 14, color: tk.gold }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Display Info</span>
                    <span style={{ fontSize: 11, color: tk.muted }}>— how other players see you</span>
                  </div>
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Display Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: tk.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Display Name</label>
                      <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter your display name" maxLength={30}
                        style={{ width: '100%', background: tk.dark, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, color: tk.text, fontSize: 13, height: 36, padding: '0 12px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(184,151,58,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: tk.dim }}>2–30 characters</span>
                        <span style={{ fontSize: 10, color: displayName.length > 28 ? tk.red : tk.dim }}>{displayName.length}/30</span>
                      </div>
                    </div>
                    {/* Username */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: tk.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
                        Username <span style={{ color: tk.gold, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>— used for clash invites</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tk.muted, fontSize: 13 }}>@</span>
                        <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} placeholder="your_username" maxLength={20}
                          style={{ width: '100%', background: tk.dark, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, color: tk.text, fontSize: 13, height: 36, paddingLeft: 28, paddingRight: 12, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' }}
                          onFocus={e => e.target.style.borderColor = 'rgba(184,151,58,0.5)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                      </div>
                      <span style={{ fontSize: 10, color: tk.dim, marginTop: 4, display: 'block' }}>3–20 chars, letters/numbers/underscores. Must be unique.</span>
                    </div>
                    {/* Bio */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: tk.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Bio <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: tk.dim }}>(optional)</span></label>
                      <input value={bio} onChange={e => setBio(e.target.value)} placeholder="A short bio about yourself..." maxLength={80}
                        style={{ width: '100%', background: tk.dark, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, color: tk.text, fontSize: 13, height: 36, padding: '0 12px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(184,151,58,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Picture */}
                <div style={{ background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera style={{ width: 14, height: 14, color: tk.gold }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Profile Picture</span>
                  </div>
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                      {AVATAR_PRESETS.map(avatar => {
                        const active = selectedAvatar === avatar.id && !customAvatarUrl;
                        return (
                          <button key={avatar.id} onClick={() => { setSelectedAvatar(avatar.id); setCustomAvatarUrl(''); }} title={avatar.label}
                            style={{ width: '100%', aspectRatio: '1', borderRadius: 11, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', border: `2px solid ${active ? tk.gold : 'transparent'}`, background: active ? tk.goldDim : 'rgba(255,255,255,0.04)', transform: active ? 'scale(1.06)' : 'scale(1)', fontFamily: 'inherit' }}
                          >{avatar.emoji}</button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: tk.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Or use a custom image URL</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={customAvatarInput} onChange={e => setCustomAvatarInput(e.target.value)} placeholder="https://example.com/photo.jpg"
                          style={{ flex: 1, background: tk.dark, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, color: tk.text, fontSize: 12, height: 34, padding: '0 12px', fontFamily: 'inherit', outline: 'none' }}
                          onFocus={e => e.target.style.borderColor = 'rgba(184,151,58,0.5)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        <button onClick={handleApplyCustomAvatar}
                          style={{ padding: '0 14px', height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'transparent', color: tk.muted, border: `1px solid rgba(255,255,255,0.1)`, cursor: 'pointer', transition: 'border-color 0.15s,color 0.15s', fontFamily: 'inherit' }}
                          onMouseEnter={e => { e.target.style.borderColor = tk.goldBorder; e.target.style.color = tk.text; }}
                          onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = tk.muted; }}
                        >Apply</button>
                      </div>
                      {customAvatarUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 style={{ width: 13, height: 13, color: tk.green, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: tk.green, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Custom avatar active</span>
                          <button onClick={handleClearCustomAvatar} style={{ fontSize: 11, color: tk.red, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Remove</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── APPEARANCE TAB ──────────────────────────────────────── */}
            {activeTab === 'appearance' && (
              <div style={{ background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Palette style={{ width: 14, height: 14, color: tk.gold }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Profile Stats</span>
                </div>
                <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Level',      value: profile?.level || 1 },
                    { label: 'Total XP',   value: (profile?.xp || 0).toLocaleString() },
                    { label: 'Day Streak', value: `🔥 ${profile?.streak_days || 0}` },
                    { label: 'Badges',     value: profile?.badges?.length || 0 },
                  ].map(stat => (
                    <div key={stat.label} className="cc-stat-card">
                      <p style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 700, color: tk.text, fontFamily: "'Cormorant Garamond',serif" }}>{stat.value}</p>
                      <p style={{ margin: 0, fontSize: 11, color: tk.muted }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BLOCKED TAB ─────────────────────────────────────────── */}
            {activeTab === 'blocked' && (
              <BlockedUsersTab userId={user?.id} />
            )}

            {/* ── ACCOUNT TAB ─────────────────────────────────────────── */}
            {activeTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Region */}
                <div style={{ background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Globe style={{ width: 14, height: 14, color: tk.gold }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Region &amp; Currency</span>
                  </div>
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <select value={region} onChange={e => setRegion(e.target.value)}
                      style={{ width: '100%', height: 36, background: tk.dark, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, color: tk.text, fontSize: 13, padding: '0 12px', fontFamily: 'inherit', outline: 'none' }}>
                      {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label} — {r.currency}</option>)}
                    </select>
                    {(() => { const r = REGIONS.find(x => x.value === region); return r ? (
                      <p style={{ margin: 0, fontSize: 11, color: tk.muted }}>Currency: <span style={{ fontWeight: 600, color: tk.text }}>{r.symbol} {r.currency}</span></p>
                    ) : null; })()}
                  </div>
                </div>

                {/* Account Info */}
                <div style={{ background: tk.surfaceAlt, border: `1px solid ${tk.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield style={{ width: 14, height: 14, color: tk.gold }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Account Info</span>
                  </div>
                  <div style={{ padding: '4px 18px' }}>
                    {[
                      { label: 'Email',        value: user?.email || '—' },
                      { label: 'Username',      value: profile?.username ? `@${profile.username}` : '—' },
                      { label: 'Battles Won',   value: profile?.battles_won || 0 },
                    ].map((row, i, arr) => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < arr.length - 1 ? `1px solid ${tk.border}` : 'none' }}>
                        <span style={{ fontSize: 12, color: tk.muted }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: tk.text }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign Out */}
                <div style={{ background: tk.surfaceAlt, border: `1px solid ${tk.redBorder}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogOut style={{ width: 14, height: 14, color: tk.red }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: tk.red }}>Sign Out</span>
                  </div>
                  <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, color: tk.muted }}>You'll need to log back in to access your account.</p>
                    <button onClick={handleLogout}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', width: '100%', background: tk.redDim, color: tk.red, border: `1px solid ${tk.redBorder}`, cursor: 'pointer', transition: 'opacity 0.15s', fontFamily: 'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <LogOut style={{ width: 13, height: 13 }} /> Sign Out of Cash Clash
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── FLOATING SAVE BAR ─────────────────────────────────────── */}
          {hasChanges && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: tk.surface, border: `1px solid ${tk.goldBorder}`, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: '10px 16px' }}>
                <p style={{ margin: 0, fontSize: 12, color: tk.muted, whiteSpace: 'nowrap' }}>Unsaved changes</p>
                <button onClick={handleResetChanges}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: 'transparent', color: tk.muted, border: `1px solid ${tk.border}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <RefreshCw style={{ width: 11, height: 11 }} /> Reset
                </button>
                <button onClick={handleSaveProfile} disabled={isSaving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', background: tk.gold, color: tk.dark, border: 'none', cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'inherit', opacity: isSaving ? 0.7 : 1 }}>
                  {isSaving
                    ? <div style={{ width: 11, height: 11, border: `2px solid rgba(12,12,14,0.3)`, borderTopColor: tk.dark, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <Save style={{ width: 11, height: 11 }} />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── ENLARGED IMAGE OVERLAY ────────────────────────────────────── */}
      {enlargedImage && (
        <div onClick={() => setEnlargedImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
            <button onClick={() => setEnlargedImage(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 28, height: 28, borderRadius: '50%', background: tk.surfaceAlt, border: `1px solid ${tk.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
              <X style={{ width: 13, height: 13, color: tk.muted }} />
            </button>
            {enlargedImage.src
              ? <img src={enlargedImage.src} alt="enlarged" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} />
              : <div style={{ width: 192, height: 192, borderRadius: 16, background: tk.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>{enlargedImage.emoji}</div>
            }
          </div>
        </div>
      )}
    </>
  );
}