import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { profilesApi, friendsApi, notificationsApi } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, UserPlus, UserCheck, UserX, Shield, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import UserProfileModal from '@/components/social/UserProfileModal';

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

const AVATAR_PRESETS = {
  avatar1:'🦁', avatar2:'🐯', avatar3:'🦊', avatar4:'🐺', avatar5:'🦅',
  avatar6:'🐉', avatar7:'🦄', avatar8:'🐻', avatar9:'🦈', avatar10:'🍆',
  avatar11:'🐸', avatar12:'🦉',
};

function AvatarDisplay({ profile, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-lg' : 'w-11 h-11 text-2xl';
  if (profile?.custom_avatar_url) {
    return (
      <Avatar className={sizeClass} style={{ border: `1px solid ${T.goldBorder}` }}>
        <AvatarImage src={profile.custom_avatar_url} />
        <AvatarFallback>{AVATAR_PRESETS[profile.avatar_id] || '🦁'}</AvatarFallback>
      </Avatar>
    );
  }
  return (
    <div 
      className={`${sizeClass} rounded-full flex items-center justify-center`}
      style={{ background: T.goldDim, border: `1px solid ${T.goldBorder}`, color: T.gold }}
    >
      {AVATAR_PRESETS[profile?.avatar_id] || '🦁'}
    </div>
  );
}

export default function Friends() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.id) {
      profilesApi.getByUserId(user.id).then(setMyProfile).catch(() => {});
    }
  }, [user?.id]);

  const { data: friends = [] } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: () => friendsApi.getMyFriends(user.id),
    enabled: !!user?.id,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['friend-requests', user?.id],
    queryFn: () => friendsApi.getPendingReceived(user.id),
    enabled: !!user?.id,
  });

  const { data: pendingProfiles = [] } = useQuery({
    queryKey: ['pending-profiles', pendingRequests.map(r => r.requester_id)],
    queryFn: async () => {
      if (!pendingRequests.length) return [];
      const ids = pendingRequests.map(r => r.requester_id);
      const { data } = await supabase.from('user_profiles').select('*').in('created_by', ids);
      return data || [];
    },
    enabled: pendingRequests.length > 0,
  });

  const { data: friendProfiles = [] } = useQuery({
    queryKey: ['friend-profiles', friends.map(f => f.id)],
    queryFn: async () => {
      if (!friends.length) return [];
      const otherIds = friends.map(f => f.requester_id === user.id ? f.recipient_id : f.requester_id);
      const { data } = await supabase.from('user_profiles').select('*').in('created_by', otherIds);
      return data || [];
    },
    enabled: friends.length > 0,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await profilesApi.searchByUsername(searchQuery.trim());
      setSearchResults(results.filter(p => p.created_by !== user?.id));
    } catch { toast.error('Search failed'); }
    finally { setIsSearching(false); }
  };

  const [sentRequests, setSentRequests] = React.useState(new Set());

  const handleAddFriend = async (targetProfile) => {
    try {
      const rel = await friendsApi.getRelationship(user.id, targetProfile.created_by);
      if (rel) { toast.info('Friend request already exists'); return; }
      await friendsApi.sendRequest(user.id, targetProfile.created_by);
      await notificationsApi.send({
        recipient_id: targetProfile.created_by,
        sender_id: user.id,
        sender_username: myProfile?.username || 'Someone',
        type: 'friend_request',
        title: 'New Friend Request',
        body: `@${myProfile?.username || 'Someone'} sent you a friend request!`,
        read: false,
      });
      setSentRequests(prev => new Set([...prev, targetProfile.created_by]));
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      toast.success(`Friend request sent to @${targetProfile.username}!`);
    } catch (err) {
      toast.error('Failed to send friend request');
    }
  };

  const handleAccept = async (friendRow) => {
    try {
      await friendsApi.accept(friendRow.id);
      await notificationsApi.send({
        recipient_id: friendRow.requester_id,
        sender_id: user.id,
        sender_username: myProfile?.username,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        body: `@${myProfile?.username} accepted your friend request!`,
        read: false,
      });
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests', user?.id] });
      toast.success('Friend request accepted!');
    } catch { toast.error('Failed to accept request'); }
  };

  const handleDecline = async (friendRow) => {
    try {
      await friendsApi.remove(friendRow.id);
      queryClient.invalidateQueries({ queryKey: ['friend-requests', user?.id] });
      toast.success('Request declined');
    } catch { toast.error('Failed to decline'); }
  };

  const handleBlock = async (friendRow) => {
    try {
      await friendsApi.block(friendRow.id);
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      toast.success('User blocked');
    } catch { toast.error('Failed to block'); }
  };

  const handleRemoveFriend = async (friendRow) => {
    try {
      await friendsApi.remove(friendRow.id);
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['friend-profiles'] });
      toast.success('Friend removed');
    } catch { toast.error('Failed to remove friend'); }
  };

  return (
    <div style={{ backgroundColor: T.surface, minHeight: '100vh', width: '100%', color: T.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users style={{ width: 20, height: 20, color: T.gold }} />
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Friends</h1>
          </div>
          <p style={{ fontSize: 14, color: T.textMuted }}>Search players, add friends, manage your squad</p>
        </motion.div>

        {/* SEARCH CARD */}
        <Card style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <CardHeader className="pb-3">
            <CardTitle style={{ color: T.text, fontSize: '1rem' }} className="flex items-center gap-2">
              <Search className="w-4 h-4" style={{ color: T.gold }} /> Find Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, color: T.text }}
                className="flex-1 focus-visible:ring-gold"
              />
              <Button onClick={handleSearch} disabled={isSearching} size="sm" style={{ background: T.gold, color: '#000' }}>
                {isSearching ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map(profile => (
                  <div key={profile.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                    <button onClick={() => setViewProfile(profile)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <AvatarDisplay profile={profile} />
                      <div className="min-w-0">
                        <p style={{ color: T.text }} className="font-medium text-sm truncate">{profile.display_name}</p>
                        <p style={{ color: T.textMuted }} className="text-xs">@{profile.username}</p>
                      </div>
                      <div className="flex gap-1 ml-auto">
                        <Badge style={{ background: T.goldDim, color: T.gold, border: `1px solid ${T.goldBorder}` }} className="text-xs">Lv {profile.level || 1}</Badge>
                      </div>
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => !sentRequests.has(profile.created_by) && handleAddFriend(profile)}
                      disabled={sentRequests.has(profile.created_by)}
                      style={{
                        border: `1px solid ${sentRequests.has(profile.created_by) ? 'rgba(184,151,58,0.3)' : T.goldBorder}`,
                        color: sentRequests.has(profile.created_by) ? T.gold : T.gold,
                        background: sentRequests.has(profile.created_by) ? 'rgba(184,151,58,0.1)' : 'transparent',
                        opacity: 1, cursor: sentRequests.has(profile.created_by) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                      className="gap-1 flex-shrink-0"
                    >
                      {sentRequests.has(profile.created_by)
                        ? <><UserCheck className="w-3.5 h-3.5" /> Requested</>
                        : <><UserPlus className="w-3.5 h-3.5" /> Add</>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TABS */}
        <Tabs defaultValue="friends">
          <TabsList style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }} className="w-full">
            <TabsTrigger value="friends" className="flex-1 data-[state=active]:bg-goldDim data-[state=active]:text-gold">
              Friends {friendProfiles.length > 0 && <Badge className="ml-1.5" style={{ background: T.gold, color: '#000' }}>{friendProfiles.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 data-[state=active]:bg-goldDim data-[state=active]:text-gold">
              Requests {pendingRequests.length > 0 && <Badge className="ml-1.5" style={{ background: T.gold, color: '#000' }}>{pendingRequests.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4 space-y-2">
            {friendProfiles.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: T.textDim }}>
                <Users style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ fontSize: 14 }}>No friends yet. Search for players to add!</p>
              </div>
            ) : (
              friendProfiles.map(profile => {
                const friendRow = friends.find(f =>
                  f.requester_id === profile.created_by || f.recipient_id === profile.created_by
                );
                return (
                  <div key={profile.id} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }} className="flex items-center gap-3 p-3 rounded-xl hover:border-goldBorder transition-all">
                    <button onClick={() => setViewProfile(profile)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <AvatarDisplay profile={profile} />
                      <div className="min-w-0">
                        <p style={{ color: T.text }} className="font-medium text-sm">{profile.display_name}</p>
                        <p style={{ color: T.textMuted }} className="text-xs">@{profile.username}</p>
                      </div>
                      <div className="flex gap-1 ml-auto mr-2">
                        <Badge style={{ background: T.goldDim, color: T.gold, border: `1px solid ${T.goldBorder}` }} className="text-xs">Lv {profile.level || 1}</Badge>
                      </div>
                    </button>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFriend(friendRow)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-muted-foreground hover:text-amber-500" onClick={() => handleBlock(friendRow)}>
                        <Shield className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-2">
            {pendingRequests.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: T.textDim }}>
                <UserPlus style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ fontSize: 14 }}>No pending friend requests</p>
              </div>
            ) : (
              pendingRequests.map(req => {
                const senderProfile = pendingProfiles.find(p => p.created_by === req.requester_id);
                return (
                  <div key={req.id} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}` }} className="flex items-center gap-3 p-3 rounded-xl">
                    <button onClick={() => senderProfile && setViewProfile(senderProfile)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <AvatarDisplay profile={senderProfile} />
                      <div>
                        <p style={{ color: T.text }} className="font-medium text-sm">{senderProfile?.display_name || 'Unknown'}</p>
                        <p style={{ color: T.textMuted }} className="text-xs">@{senderProfile?.username || '...'}</p>
                      </div>
                    </button>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAccept(req)} style={{ background: T.gold, color: '#000' }} className="gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDecline(req)} style={{ border: '1px solid rgba(192,102,90,0.35)', color: '#C0665A', background: 'rgba(192,102,90,0.08)' }} className="gap-1">
                        <UserX className="w-3.5 h-3.5" /> Decline
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {viewProfile && (
          <UserProfileModal profile={viewProfile} onClose={() => setViewProfile(null)} currentUserId={user?.id} myProfile={myProfile} />
        )}
      </div>
    </div>
  );
}