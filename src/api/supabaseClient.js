import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
  me: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error('Not authenticated');
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
    };
  },
  logout: async (redirectUrl) => {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },
  redirectToLogin: (redirectTo = window.location.href) => {
    window.location.href = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
  },
};

export function entity(tableName) {
  return {
    list: async (orderCol = 'created_at', limit = 50) => {
      const descending = orderCol.startsWith('-');
      const col = descending ? orderCol.slice(1) : orderCol;
      const { data, error } = await supabase
        .from(tableName).select('*')
        .order(col, { ascending: !descending }).limit(limit);
      if (error) throw error;
      return data;
    },
    filter: async (matchObj = {}, orderCol = 'created_at', limit = 100) => {
      const descending = orderCol.startsWith('-');
      const col = descending ? orderCol.slice(1) : orderCol;
      const { data, error } = await supabase
        .from(tableName).select('*').match(matchObj)
        .order(col, { ascending: !descending }).limit(limit);
      if (error) throw error;
      return data;
    },
    create: async (rowObj) => {
      const { data, error } = await supabase
        .from(tableName).insert([rowObj]).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id, patchObj) => {
      const { data, error } = await supabase
        .from(tableName).update(patchObj).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

export const entities = {
  UserProfile: entity('user_profiles'),
  Transaction: entity('transactions'),
  Challenge: entity('challenges'),
  Proposal: entity('proposals'),
  Friend: entity('friends'),
  Notification: entity('notifications'),
  Tournament: entity('tournaments'),
  TournamentParticipant: entity('tournament_participants'),
};

// ── Social helpers ──────────────────────────────────────────

export const profilesApi = {
  searchByUsername: async (query) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, created_by, username, display_name, avatar_id, custom_avatar_url, banner_color, card_bg_color, challenge_btn_color, friend_btn_color, stat_card_color, level, xp, badges, battles_won, tournament_wins, bio')
      .ilike('username', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data;
  },
  getByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('created_by', userId)
      .single();
    if (error) throw error;
    return data;
  },
  getByUsername: async (username) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, created_by, username, display_name, avatar_id, custom_avatar_url, banner_color, card_bg_color, challenge_btn_color, friend_btn_color, stat_card_color, level, xp, badges, battles_won, tournament_wins, bio')
      .eq('username', username)
      .single();
    if (error) throw error;
    return data;
  },
  leaderboard: async (orderCol = 'xp', limit = 50) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, created_by, username, display_name, avatar_id, custom_avatar_url, banner_color, card_bg_color, challenge_btn_color, friend_btn_color, stat_card_color, level, xp, battles_won, tournament_wins, badges, bio')
      .order(orderCol, { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },
  updateByUserId: async (userId, patch) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(patch)
      .eq('created_by', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

};

export const friendsApi = {
  getMyFriends: async (myId) => {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`requester_id.eq.${myId},recipient_id.eq.${myId}`)
      .eq('status', 'accepted');
    if (error) throw error;
    return data;
  },
  getPendingReceived: async (myId) => {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('recipient_id', myId)
      .eq('status', 'pending');
    if (error) throw error;
    return data;
  },
  sendRequest: async (requesterId, recipientId) => {
    const { data, error } = await supabase
      .from('friends')
      .insert([{ requester_id: requesterId, recipient_id: recipientId, status: 'pending' }])
      .select().single();
    if (error) throw error;
    return data;
  },
  accept: async (id) => {
    const { data, error } = await supabase
      .from('friends').update({ status: 'accepted' }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  block: async (id) => {
    const { data, error } = await supabase
      .from('friends').update({ status: 'blocked' }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  remove: async (id) => {
    const { error } = await supabase.from('friends').delete().eq('id', id);
    if (error) throw error;
  },
  getRelationship: async (myId, otherId) => {
    const { data } = await supabase
      .from('friends')
      .select('*')
      .or(`and(requester_id.eq.${myId},recipient_id.eq.${otherId}),and(requester_id.eq.${otherId},recipient_id.eq.${myId})`)
      .maybeSingle();
    return data;
  },
};

export const notificationsApi = {
  getMyNotifications: async (myId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', myId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
  markRead: async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },
  markAllRead: async (myId) => {
    await supabase.from('notifications').update({ read: true }).eq('recipient_id', myId).eq('read', false);
  },
  send: async (notification) => {
    const { error } = await supabase.from('notifications').insert([notification]);
    if (error) throw error;
  },
  getUnreadCount: async (myId) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', myId)
      .eq('read', false);
    if (error) return 0;
    return count || 0;
  },
};
