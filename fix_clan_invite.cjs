const fs = require('fs');

// ─── Patch Clans.jsx: skip notifications, insert directly into clan_join_requests ──
const clansPath = 'src/pages/Clans.jsx';
if (!fs.existsSync(clansPath)) { console.error('✗ Missing', clansPath); process.exit(1); }
let clans = fs.readFileSync(clansPath, 'utf8');

if (clans.includes('// clan-invite-v2')) {
  console.log('⚠ Clans.jsx already patched — skipping.'); 
} else {
  // Replace the entire invite() function — stop using notifications, use clan_join_requests directly
  clans = clans.replace(
    `  const invite = async (profile) => {
    try {
      // Check if already invited
      const { data: existing } = await supabase.from('notifications')
        .select('id').eq('recipient_id', profile.created_by).eq('type', 'clan_invite').eq('related_id', clanId).maybeSingle();
      if (existing) { toast.error('Already invited'); return; }

      const { error } = await supabase.from('notifications').insert({
        recipient_id: profile.created_by,
        sender_id: userId,
        type: 'clan_invite',
        title: \`You've been invited to join a clan!\`,
        body: \`You received a clan invitation. Open your inbox to accept or decline.\`,
        related_id: clanId,
        read: false,
      });
      if (error) { console.error('Invite error:', error); toast.error(error.message); }
      else {
        setInvited(prev => new Set([...prev, profile.created_by]));
        toast.success(\`Invite sent to \${profile.display_name}!\`);
      }
    } catch (e) { console.error(e); toast.error(e.message); }
  };`,
    `  // clan-invite-v2
  const invite = async (profile) => {
    try {
      // Check if already invited or already a member
      const { data: existing } = await supabase.from('clan_join_requests')
        .select('id').eq('clan_id', clanId).eq('user_id', profile.created_by)
        .in('status', ['pending', 'invited']).maybeSingle();
      if (existing) { toast.error('Already invited'); return; }

      const { data: alreadyMember } = await supabase.from('clan_members')
        .select('id').eq('clan_id', clanId).eq('user_id', profile.created_by).maybeSingle();
      if (alreadyMember) { toast.error('Already a member'); return; }

      // Insert as an invite (status='invited', initiated by owner)
      const { error } = await supabase.from('clan_join_requests').insert({
        clan_id: clanId,
        user_id: profile.created_by,
        status: 'invited',
        invited_by: userId,
      });
      if (error) { console.error('Invite error:', error); toast.error(error.message); return; }

      setInvited(prev => new Set([...prev, profile.created_by]));
      toast.success(\`Invite sent to \${profile.display_name}!\`);
    } catch (e) { console.error(e); toast.error(e.message); }
  };`
  );

  // Replace pendingInvite query to look in clan_join_requests (status='invited') instead of notifications
  clans = clans.replace(
    `  const { data: pendingInvite } = useQuery({
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
  });`,
    `  const { data: pendingInvite } = useQuery({
    queryKey: ['clan-invite', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('clan_join_requests')
        .select('*, clan:clans(*)')
        .eq('user_id', user.id).eq('status', 'invited')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data || null;
    },
    enabled: !!user?.id && !myClan,
    refetchInterval: 10000,
  });`
  );

  // Fix handleAcceptInvite — now uses clan_join_requests row (pendingInvite.clan_id, pendingInvite.id)
  clans = clans.replace(
    `  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    try {
      const { error } = await supabase.from('clan_members').insert({ clan_id: pendingInvite.related_id, user_id: user.id, role: 'member' });
      if (error) { toast.error(error.code === '23505' ? 'Already in a clan' : error.message); return; }
      await supabase.from('notifications').update({ read: true }).eq('id', pendingInvite.id);
      toast.success(\`Joined \${pendingInvite.clan?.name || 'the clan'}!\`);
      queryClient.invalidateQueries(['my-clan-membership', user?.id]);
      queryClient.invalidateQueries(['clan-invite', user?.id]);
    } catch (e) { toast.error(e.message); }
  };`,
    `  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    try {
      const { error } = await supabase.from('clan_members').insert({ clan_id: pendingInvite.clan_id, user_id: user.id, role: 'member' });
      if (error) { toast.error(error.code === '23505' ? 'Already in a clan' : error.message); return; }
      await supabase.from('clan_join_requests').update({ status: 'accepted' }).eq('id', pendingInvite.id);
      toast.success(\`Joined \${pendingInvite.clan?.name || 'the clan'}!\`);
      queryClient.invalidateQueries(['my-clan-membership', user?.id]);
      queryClient.invalidateQueries(['clan-invite', user?.id]);
    } catch (e) { toast.error(e.message); }
  };`
  );

  // Fix handleDeclineInvite — mark as rejected in clan_join_requests
  clans = clans.replace(
    `  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;
    await supabase.from('notifications').update({ read: true }).eq('id', pendingInvite.id);
    toast.success('Invite declined');
    queryClient.invalidateQueries(['clan-invite', user?.id]);
  };`,
    `  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;
    await supabase.from('clan_join_requests').update({ status: 'rejected' }).eq('id', pendingInvite.id);
    toast.success('Invite declined');
    queryClient.invalidateQueries(['clan-invite', user?.id]);
  };`
  );

  fs.writeFileSync(clansPath, clans, 'utf8');
  console.log('✓ Fixed Clans.jsx — invites now use clan_join_requests (status=invited)');
}

// ─── Patch Inbox.jsx — show clan invites from clan_join_requests ───────────────
const inboxPath = 'src/pages/Inbox.jsx';
if (!fs.existsSync(inboxPath)) { console.error('✗ Missing', inboxPath); process.exit(1); }
let inbox = fs.readFileSync(inboxPath, 'utf8');

if (inbox.includes('// clan-invite-v2')) {
  console.log('⚠ Inbox.jsx already patched — skipping.');
} else {
  // Add supabase import
  inbox = inbox.replace(
    `import { notificationsApi } from '@/api/supabaseClient';`,
    `import { notificationsApi, supabase } from '@/api/supabaseClient';`
  );

  // Add useState
  inbox = inbox.replace(
    `import React, { useEffect } from 'react';`,
    `import React, { useEffect, useState } from 'react';`
  );

  // Add Shield icon
  inbox = inbox.replace(
    `import { Bell, Users, Swords, Trophy, Star, CheckCheck, Zap } from 'lucide-react';`,
    `import { Bell, Users, Swords, Trophy, Star, CheckCheck, Zap, Shield } from 'lucide-react';`
  );

  // Add clan_invite to NOTIF_CONFIG
  inbox = inbox.replace(
    `  clash_invite:      { icon: Swords, color: T.gold,    bg: T.goldDim },`,
    `  clash_invite:      { icon: Swords, color: T.gold,    bg: T.goldDim },
  clan_invite:       { icon: Shield, color: T.gold,    bg: T.goldDim },`
  );

  // Add clan_invite to NOTIF_ROUTES
  inbox = inbox.replace(
    `  clash_invite:      '/Challenges',`,
    `  clash_invite:      '/Challenges',
  clan_invite:       '/Clans',`
  );

  // Add clan invite state + accept/decline handlers after useAuth block
  inbox = inbox.replace(
    `  const { data: notifications = [] } = useQuery({`,
    `  // clan-invite-v2
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

  const { data: notifications = [] } = useQuery({`
  );

  // Inject clan invite cards at top of content, before normal notifications
  inbox = inbox.replace(
    `        {/* CONTENT */}`,
    `        {/* CLAN INVITES */}
        {clanInvites.map((invite, i) => (
          <motion.div key={invite.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
            <Card style={{ background: T.surfaceAlt, border: \`1px solid \${T.goldBorder}\` }}>
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
                      style={{ background: 'transparent', border: \`1px solid \${T.border}\`, borderRadius: 8, padding: '7px 18px', color: T.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      ✗ Decline
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* CONTENT */}`
  );

  fs.writeFileSync(inboxPath, inbox, 'utf8');
  console.log('✓ Fixed Inbox.jsx — clan invites shown with Accept/Decline buttons');
}

console.log('\n✅ Done. Run: npm run dev');
console.log('\nSQL to run in Supabase:');
console.log('  ALTER TABLE clan_join_requests ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);');
console.log('  ALTER TABLE clan_join_requests DROP CONSTRAINT IF EXISTS clan_join_requests_status_check;');
console.log("  ALTER TABLE clan_join_requests ADD CONSTRAINT clan_join_requests_status_check CHECK (status IN ('pending','invited','accepted','rejected'));");
