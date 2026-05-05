const fs = require('fs');

// ─────────────────────────────────────────────
// 1. SETTINGS.JSX — remove banner state, logic, and UI
// ─────────────────────────────────────────────
const settings = `import React, { useState, useEffect, useRef } from 'react';
import { auth, entities, profilesApi } from '@/api/supabaseClient';
import { supabase } from '@/api/supabaseClient';
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
  Shield, Palette, RefreshCw, CheckCircle2, AtSign,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const AVATAR_PRESETS = [
  { id: 'avatar1',  emoji: '🦁', label: 'Lion' },
  { id: 'avatar2',  emoji: '🐯', label: 'Tiger' },
  { id: 'avatar3',  emoji: '🦊', label: 'Fox' },
  { id: 'avatar4',  emoji: '🐺', label: 'Wolf' },
  { id: 'avatar5',  emoji: '🦅', label: 'Eagle' },
  { id: 'avatar6',  emoji: '🐉', label: 'Dragon' },
  { id: 'avatar7',  emoji: '🦄', label: 'Unicorn' },
  { id: 'avatar8',  emoji: '🐻', label: 'Bear' },
  { id: 'avatar9',  emoji: '🦈', label: 'Shark' },
  { id: 'avatar10', emoji: '🍆', label: 'EggyWeggy' },
  { id: 'avatar11', emoji: '🐸', label: 'Frog' },
  { id: 'avatar12', emoji: '🦉', label: 'Owl' },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const queryClient = useQueryClient();
  const originalValues = useRef({});
  const initialized = useRef(false);
  const { logout } = useAuth();

  useEffect(() => { auth.me().then(setUser).catch(() => {}); }, []);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => entities.UserProfile.filter({ created_by: user?.id }),
    enabled: !!user?.id,
    initialData: [],
  });

  const profile = profiles?.[0];

  useEffect(() => {
    if (profile && !initialized.current) {
      const name = profile.display_name || user?.full_name || '';
      const uname = profile.username || '';
      const bioVal = profile.bio || '';
      const avatar = profile.avatar_id || 'avatar1';
      const avatarUrl = profile.custom_avatar_url || '';
      setDisplayName(name); setUsername(uname); setBio(bioVal);
      setSelectedAvatar(avatar);
      setCustomAvatarUrl(avatarUrl); setCustomAvatarInput(avatarUrl);
      originalValues.current = { name, uname, bioVal, avatar, avatarUrl };
      initialized.current = true;
    }
  }, [profile, user]);

  useEffect(() => {
    const changed =
      displayName !== originalValues.current.name ||
      username !== originalValues.current.uname ||
      bio !== originalValues.current.bioVal ||
      selectedAvatar !== originalValues.current.avatar ||
      customAvatarUrl !== originalValues.current.avatarUrl;
    setHasChanges(changed);
  }, [displayName, username, bio, selectedAvatar, customAvatarUrl]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { toast.error('Display name cannot be empty'); return; }
    if (displayName.trim().length < 2) { toast.error('Display name must be at least 2 characters'); return; }
    if (displayName.trim().length > 30) { toast.error('Display name must be 30 characters or less'); return; }

    if (username.trim()) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
        toast.error('Username must be 3–20 characters: letters, numbers, underscores only');
        return;
      }
      if (username.trim().toLowerCase() !== originalValues.current.uname) {
        const { data: existing } = await supabase
          .from('user_profiles').select('id').eq('username', username.trim().toLowerCase()).maybeSingle();
        if (existing && existing.id !== profile?.id) {
          toast.error('Username already taken. Choose another.');
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const updateData = {
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        avatar_id: selectedAvatar,
        custom_avatar_url: customAvatarUrl,
        email: user?.email,
      };
      if (profile) {
        await entities.UserProfile.update(profile.id, updateData);
      } else {
        await entities.UserProfile.create({
          ...updateData, created_by: user?.id,
          level: 1, xp: 0, total_saved: 0, monthly_budget: 0,
          monthly_income: 0, badges: [], streak_days: 0, role: 'student',
          battles_won: 0, tournament_wins: 0,
        });
      }
      originalValues.current = {
        name: updateData.display_name, uname: updateData.username,
        bioVal: updateData.bio, avatar: updateData.avatar_id,
        avatarUrl: updateData.custom_avatar_url,
      };
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setHasChanges(false);
      toast.success('Profile saved! ✅');
    } catch (err) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyCustomAvatar = () => {
    if (!customAvatarInput.trim()) { toast.error('Please enter an image URL'); return; }
    try { new URL(customAvatarInput.trim()); } catch { toast.error('Please enter a valid URL'); return; }
    setCustomAvatarUrl(customAvatarInput.trim());
    setSelectedAvatar('custom');
    toast.success('Custom avatar applied!');
  };

  const handleClearCustomAvatar = () => {
    setCustomAvatarUrl(''); setCustomAvatarInput(''); setSelectedAvatar('avatar1');
  };

  const handleLogout = () => logout();

  const handleResetChanges = () => {
    setDisplayName(originalValues.current.name);
    setUsername(originalValues.current.uname);
    setBio(originalValues.current.bioVal);
    setSelectedAvatar(originalValues.current.avatar);
    setCustomAvatarUrl(originalValues.current.avatarUrl);
    setCustomAvatarInput(originalValues.current.avatarUrl);
    setHasChanges(false); toast('Changes reset');
  };

  const getAvatarDisplay = () => {
    if (customAvatarUrl && selectedAvatar === 'custom') return { type: 'image', value: customAvatarUrl };
    const preset = AVATAR_PRESETS.find(a => a.id === selectedAvatar);
    return { type: 'emoji', value: preset?.emoji || '🦁' };
  };

  const avatarDisplay = getAvatarDisplay();

  const TABS = [
    { id: 'profile',    label: 'Profile',    icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account',    label: 'Account',    icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground text-sm">Manage your profile and account preferences</p>
      </motion.div>

      {/* Profile Preview Card — no banner */}
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-end gap-4 mb-3">
            <div className="w-16 h-16 rounded-2xl border-4 border-card bg-card flex items-center justify-center text-3xl shadow-lg overflow-hidden flex-shrink-0">
              {avatarDisplay.type === 'image'
                ? <img src={avatarDisplay.value} alt="avatar" className="w-full h-full object-cover" />
                : <span>{avatarDisplay.value}</span>}
            </div>
            <div className="pb-1">
              <h2 className="font-heading font-bold text-base leading-tight">{displayName || user?.full_name || 'Player'}</h2>
              {username
                ? <p className="text-xs text-muted-foreground flex items-center gap-1"><AtSign className="w-3 h-3" />{username}</p>
                : <p className="text-xs text-muted-foreground italic">No username set</p>
              }
              {bio && <p className="text-xs text-muted-foreground mt-0.5 italic">"{bio}"</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Level {profile?.level || 1}</Badge>
            <Badge variant="outline" className="text-xs">{(profile?.xp || 0).toLocaleString()} XP</Badge>
            {hasChanges && <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">Unsaved changes</Badge>}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={\`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all
              \${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}\`}>
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Display Info</CardTitle>
                <CardDescription>How other players see you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Enter your display name" maxLength={30} />
                  <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground">2–30 characters</p>
                    <p className={\`text-xs \${displayName.length > 28 ? 'text-destructive' : 'text-muted-foreground'}\`}>{displayName.length}/30</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5" /> Username
                    <span className="text-xs text-primary font-normal ml-1">Used to send & receive clash invites</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input id="username" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                      placeholder="your_username" maxLength={20} className="pl-7" />
                  </div>
                  <p className="text-xs text-muted-foreground">3–20 chars, letters/numbers/underscores. Must be unique.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input id="bio" value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="A short bio about yourself..." maxLength={80} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Camera className="w-4 h-4 text-primary" /> Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map(avatar => (
                    <button key={avatar.id} onClick={() => { setSelectedAvatar(avatar.id); setCustomAvatarUrl(''); }}
                      className={\`w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all border-2
                        \${selectedAvatar === avatar.id && !customAvatarUrl
                          ? 'border-primary bg-primary/10 scale-105 shadow-md'
                          : 'border-transparent bg-muted hover:border-primary/30 hover:scale-105'}\`}
                      title={avatar.label}>{avatar.emoji}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground block">Or use a custom image URL</Label>
                  <div className="flex gap-2">
                    <Input value={customAvatarInput} onChange={e => setCustomAvatarInput(e.target.value)}
                      placeholder="https://example.com/photo.jpg" className="flex-1 text-sm" />
                    <Button onClick={handleApplyCustomAvatar} size="sm" variant="outline">Apply</Button>
                  </div>
                  {customAvatarUrl && (
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <p className="text-xs text-green-600 flex-1 truncate">Custom avatar active</p>
                      <button onClick={handleClearCustomAvatar} className="text-xs text-destructive hover:underline flex-shrink-0">Remove</button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* APPEARANCE TAB — banner picker removed, only stats remain */}
        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Profile Stats</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Level',      value: profile?.level || 1 },
                    { label: 'Total XP',   value: (profile?.xp || 0).toLocaleString() },
                    { label: 'Day Streak', value: \`🔥 \${profile?.streak_days || 0}\` },
                    { label: 'Badges',     value: profile?.badges?.length || 0 },
                  ].map(stat => (
                    <div key={stat.label} className="bg-muted rounded-xl p-3 text-center">
                      <p className="text-xl font-bold font-heading">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Account Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user?.email || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Username</span>
                  <span className="text-sm font-medium">{profile?.username ? \`@\${profile.username}\` : '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <span className="text-sm font-medium capitalize">{profile?.role || 'student'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Battles Won</span>
                  <span className="text-sm font-medium">{profile?.battles_won || 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive"><LogOut className="w-4 h-4" /> Sign Out</CardTitle>
                <CardDescription>You'll need to log back in to access your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out of Cash Clash
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {hasChanges && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl shadow-2xl px-4 py-3">
            <p className="text-sm text-muted-foreground hidden sm:block">You have unsaved changes</p>
            <Button onClick={handleResetChanges} variant="ghost" size="sm" className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </Button>
            <Button onClick={handleSaveProfile} size="sm" className="gap-1.5" disabled={isSaving}>
              {isSaving ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Settings.jsx', settings, 'utf8');
console.log('✅ Settings.jsx written (banners removed)');

// ─────────────────────────────────────────────
// 2. USERPROFILEMODAL.JSX — remove banner from the profile modal header
// ─────────────────────────────────────────────
const profileModal = `import React, { useEffect, useState } from 'react';
import { friendsApi, notificationsApi } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, UserCheck, Shield, Star, Trophy, Swords, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AVATAR_PRESETS = {
  avatar1:'🦁', avatar2:'🐯', avatar3:'🦊', avatar4:'🐺', avatar5:'🦅',
  avatar6:'🐉', avatar7:'🦄', avatar8:'🐻', avatar9:'🦈', avatar10:'🍆',
  avatar11:'🐸', avatar12:'🦉',
};

const BADGE_LABELS = {
  first_save:       { emoji: '💰', label: 'First Save' },
  streak_7:         { emoji: '🔥', label: '7-Day Streak' },
  streak_30:        { emoji: '⚡', label: '30-Day Streak' },
  budget_master:    { emoji: '🎯', label: 'Budget Master' },
  clash_winner:     { emoji: '⚔️', label: 'Clash Winner' },
  tournament_champ: { emoji: '🏆', label: 'Tournament Champ' },
  saver_100:        { emoji: '💎', label: 'Saved \$100' },
  saver_1000:       { emoji: '👑', label: 'Saved \$1,000' },
};

export default function UserProfileModal({ profile, onClose, currentUserId, myProfile }) {
  const [relationship, setRelationship] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUserId && profile?.created_by) {
      friendsApi.getRelationship(currentUserId, profile.created_by).then(setRelationship);
    }
  }, [currentUserId, profile?.created_by]);

  const isFriend = relationship?.status === 'accepted';
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
        body: \`@\${myProfile?.username || 'Someone'} sent you a friend request!\`,
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* No banner — straight into content */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl flex-shrink-0">
              {profile?.custom_avatar_url
                ? <img src={profile.custom_avatar_url} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
                : <span>{AVATAR_PRESETS[profile?.avatar_id] || '🦁'}</span>
              }
            </div>
            <div className="min-w-0">
              <h2 className="font-heading font-bold text-lg leading-tight truncate">{profile?.display_name}</h2>
              <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-sm text-muted-foreground italic mb-4">"{profile.bio}"</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: Zap,    label: 'Level',       value: profile?.level || 1 },
              { icon: Star,   label: 'XP',          value: (profile?.xp || 0).toLocaleString() },
              { icon: Swords, label: 'Battles Won', value: profile?.battles_won || 0 },
            ].map(stat => (
              <div key={stat.label} className="bg-muted rounded-xl p-2.5 text-center">
                <stat.icon className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="font-bold text-sm font-heading">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          {profile?.badges?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Badges</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.badges.map(b => {
                  const badge = BADGE_LABELS[b];
                  return badge ? (
                    <span key={b} title={badge.label} className="text-lg" role="img" aria-label={badge.label}>
                      {badge.emoji}
                    </span>
                  ) : null;
                })}
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
  );
}
`;

fs.writeFileSync('src/components/social/UserProfileModal.jsx', profileModal, 'utf8');
console.log('✅ UserProfileModal.jsx written (banner removed)');

console.log('\n🎉 All banner references removed! Run: npm run dev');
