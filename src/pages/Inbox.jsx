import React, { useEffect, useState } from 'react';
import { notificationsApi, supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Users, Swords, Trophy, Star, CheckCheck, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

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

const NOTIF_CONFIG = {
  friend_request:    { icon: Users,  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  friend_accepted:   { icon: Users,  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  clash_invite:      { icon: Swords, color: T.gold,    bg: T.goldDim },
  clan_invite:       { icon: Shield, color: T.gold,    bg: T.goldDim },
  clan_invite:       { icon: Users,  color: T.gold,    bg: T.goldDim },
  tournament_invite: { icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  level_up:          { icon: Zap,    color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  badge_earned:      { icon: Star,   color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
};

const NOTIF_ROUTES = {
  friend_request:    '/Friends',
  friend_accepted:   '/Friends',
  clash_invite:      '/Challenges',
  clan_invite:       '/Clans',
  clan_invite:       '/Clans',
  tournament_invite: '/Challenges',
  level_up:          '/Dashboard',
  badge_earned:      '/Badges',
};

export default function Inbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // clan-invite-v2
  const { data: clanInvites = [] } = useQuery({
    queryKey: ['inbox-clan-invites', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('clan_join_requests')
        .select('*, clan:clans(*)')
        .eq('user_id', user.id).eq('status', 'invited')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const handleClanInviteAccept = async (invite) => {
    const { error } = await supabase.from('clan_members')
      .insert({ clan_id: invite.clan_id, user_id: user.id, role: 'member' });
    if (error && error.code !== '23505') { alert('Failed: ' + error.message); return; }
    await supabase.from('clan_join_requests').update({ status: 'accepted' }).eq('id', invite.id);
    queryClient.invalidateQueries({ queryKey: ['inbox-clan-invites', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['clan-invite', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['my-clan-membership', user?.id] });
    navigate('/Clans');
  };

  const handleClanInviteDecline = async (invite) => {
    await supabase.from('clan_join_requests').update({ status: 'rejected' }).eq('id', invite.id);
    queryClient.invalidateQueries({ queryKey: ['inbox-clan-invites', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['clan-invite', user?.id] });
  };

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.getMyNotifications(user.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAll = async () => {
    await notificationsApi.markAllRead(user.id);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['notif-count'] });
  };

  const handleMarkOne = async (notif) => {
    if (!notif.read) {
      await notificationsApi.markRead(notif.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    }
    const dest = NOTIF_ROUTES[notif.type];
    if (dest) navigate(dest);
  };

  // clan-invite-fixed
  const handleClanInviteAction = async (notif, accept) => {
    if (accept) {
      const { error } = await supabase.from('clan_members')
        .insert({ clan_id: notif.related_id, user_id: user.id, role: 'member' });
      if (error && error.code !== '23505') {
        alert('Failed to join clan: ' + error.message); return;
      }
    }
    await notificationsApi.markRead(notif.id);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    queryClient.invalidateQueries({ queryKey: ['my-clan-membership', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['clan-invite', user?.id] });
    if (accept) navigate('/Clans');
  };

  return (
    <div style={{ backgroundColor: T.surface, minHeight: '100vh', width: '100%', color: T.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-24 md:pb-8">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell style={{ width: 20, height: 20, color: T.gold }} />
              </div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Inbox</h1>
              {unreadCount > 0 && (
                <Badge style={{ backgroundColor: T.gold, color: '#000', fontWeight: 800 }}>
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                onClick={handleMarkAll} 
                style={{ color: T.gold, fontSize: '12px', fontWeight: 600 }}
                className="gap-1.5 hover:bg-[rgba(184,151,58,0.1)]"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </Button>
            )}
          </div>
          <p style={{ fontSize: 14, color: T.textMuted }}>Your notifications, invites and activity</p>
        </motion.div>

        {/* CLAN INVITES */}
        {clanInvites.map((invite, i) => (
          <motion.div key={invite.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
            <Card style={{ background: T.surfaceAlt, border: `1px solid ${T.goldBorder}` }}>
              <CardContent className="flex items-start gap-4 p-4">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.goldDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                  {invite.clan?.avatar_emoji || '🛡️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Clan Invitation</p>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.gold }} />
                  </div>
                  <p style={{ fontSize: 13, color: T.textMuted, margin: '2px 0 0' }}>
                    You've been invited to join <strong style={{ color: T.gold }}>{invite.clan?.name || 'a clan'}</strong>
                  </p>
                  {invite.clan?.bio && <p style={{ fontSize: 11, color: T.textDim, margin: '2px 0 0' }}>{invite.clan.bio}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={() => handleClanInviteAccept(invite)}
                      style={{ background: T.gold, border: 'none', borderRadius: 8, padding: '7px 18px', color: '#111', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      ✓ Accept
                    </button>
                    <button onClick={() => handleClanInviteDecline(invite)}
                      style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 18px', color: T.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      ✗ Decline
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* CONTENT */}
        {notifications.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: T.textDim }}>
            <Bell style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.2 }} />
            <p style={{ fontSize: 14 }}>You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, i) => {
              const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.friend_request;
              const Icon = config.icon;
              const isUnread = !notif.read;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    style={{
                      cursor: notif.type === 'clan_invite' ? 'default' : 'pointer',
                      background: isUnread ? T.surfaceAlt : 'transparent',
                      border: `1px solid ${isUnread ? T.goldBorder : T.border}`,
                      transition: 'all 0.2s ease',
                    }}
                    className={notif.type !== 'clan_invite' ? 'hover:scale-[1.01]' : ''}
                    onClick={notif.type !== 'clan_invite' ? () => handleMarkOne(notif) : undefined}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      <div style={{ 
                        width: 40, height: 40, borderRadius: '50%', 
                        background: config.bg, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon style={{ width: 18, height: 18, color: config.color }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p style={{ 
                            fontSize: 14, 
                            fontWeight: isUnread ? 700 : 500, 
                            color: isUnread ? T.text : T.textMuted 
                          }}>
                            {notif.title}
                          </p>
                          {isUnread && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.gold, marginTop: 6 }} />
                          )}
                        </div>
                        
                        {notif.body && (
                          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                            {notif.body}
                          </p>
                        )}
                        
                        <p style={{ fontSize: 10, color: T.textDim, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                        {notif.type === 'clan_invite' && isUnread && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                              onClick={() => handleClanInviteAction(notif, true)}
                              style={{ background: T.gold, border: 'none', borderRadius: 8, padding: '7px 18px', color: '#111', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >✓ Accept</button>
                            <button
                              onClick={() => handleClanInviteAction(notif, false)}
                              style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 18px', color: T.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                            >✗ Decline</button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}