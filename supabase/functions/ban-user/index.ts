import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { targetUserId, reason, callerToken } = await req.json()

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${callerToken}` } } }
    )
    const { data: { user: caller } } = await anonClient.auth.getUser()
    if (!caller || caller.email?.toLowerCase() !== 'carlos.thomas@ciac.edu.mx') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get email before deleting
    const { data: { user: target } } = await admin.auth.admin.getUserById(targetUserId)
    const targetEmail = target?.email?.toLowerCase() || ''

    // Store ban record
    await admin.from('banned_users').upsert({
      user_id: targetUserId,
      email: targetEmail,
      reason,
      banned_by: caller.id,
    }, { onConflict: 'user_id' })

    // Remove from all tables in parallel
    await Promise.all([
      // Leaderboard — delete profile row (removes from all leaderboard queries)
      admin.from('user_profiles').delete().eq('created_by', targetUserId),
      // Clans — remove membership and any pending/invited requests
      admin.from('clan_members').delete().eq('user_id', targetUserId),
      admin.from('clan_join_requests').delete().eq('user_id', targetUserId),
      // Friends — remove all friend relationships (both directions)
      admin.from('friends').delete().eq('requester_id', targetUserId),
      admin.from('friends').delete().eq('recipient_id', targetUserId),
      // Notifications — clear their inbox and any they sent
      admin.from('notifications').delete().eq('recipient_id', targetUserId),
      admin.from('notifications').delete().eq('sender_id', targetUserId),
    ])

    // Check if they owned a clan — if so, delete the clan or transfer to next member
    const { data: ownedClan } = await admin.from('clans').select('id').eq('created_by', targetUserId).maybeSingle()
    if (ownedClan) {
      // Try to find next member to promote
      const { data: nextMember } = await admin.from('clan_members')
        .select('user_id').eq('clan_id', ownedClan.id).neq('user_id', targetUserId).limit(1).maybeSingle()
      if (nextMember) {
        // Promote to owner
        await admin.from('clans').update({ created_by: nextMember.user_id }).eq('id', ownedClan.id)
        await admin.from('clan_members').update({ role: 'owner' }).eq('clan_id', ownedClan.id).eq('user_id', nextMember.user_id)
      } else {
        // No members left — delete the clan entirely
        await admin.from('clan_join_requests').delete().eq('clan_id', ownedClan.id)
        await admin.from('clan_members').delete().eq('clan_id', ownedClan.id)
        await admin.from('clans').delete().eq('id', ownedClan.id)
      }
    }

    // Finally delete the auth account — prevents any re-login
    const { error } = await admin.auth.admin.deleteUser(targetUserId)
    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: corsHeaders
    })
  }
})
