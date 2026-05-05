-- ============================================================
-- Cash Clash – Supabase Database Setup (Full v2)
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. USER PROFILES
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by text,
  email text,
  username text unique,
  display_name text,
  bio text,
  avatar_id text default 'avatar1',
  banner_color text default 'green',
  custom_avatar_url text,
  level integer default 1,
  xp integer default 0,
  total_saved numeric default 0,
  monthly_budget numeric default 0,
  monthly_income numeric default 0,
  badges text[] default '{}',
  streak_days integer default 0,
  role text default 'student',
  battles_won integer default 0,
  tournament_wins integer default 0
);

-- 2. TRANSACTIONS
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by text,
  title text not null,
  amount numeric not null,
  type text check (type in ('income','expense')) not null,
  category text not null,
  date date not null,
  notes text
);

-- 3. CHALLENGES
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  title text not null,
  description text,
  week_start date,
  week_end date,
  challenger_id text,
  challenger_username text,
  challenger_email text,
  challenger_name text,
  opponent_id text,
  opponent_username text,
  opponent_email text,
  opponent_name text,
  challenger_savings numeric default 0,
  opponent_savings numeric default 0,
  status text default 'pending' check (status in ('pending','active','completed')),
  winner_email text,
  savings_goal numeric
);

-- 4. PROPOSALS
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz default now(),
  title text not null,
  description text,
  monthly_income numeric,
  savings_goal numeric,
  student_email text,
  student_name text,
  teacher_email text,
  status text default 'pending' check (status in ('pending','approved','needs_revision','rejected')),
  feedback text
);

-- 5. FRIENDS
create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  requester_id text not null,
  recipient_id text not null,
  status text default 'pending' check (status in ('pending','accepted','blocked')),
  unique(requester_id, recipient_id)
);

-- 6. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  recipient_id text not null,
  sender_id text,
  sender_username text,
  type text not null check (type in (
    'friend_request','clash_invite','tournament_invite',
    'level_up','badge_earned','friend_accepted'
  )),
  title text not null,
  body text,
  read boolean default false,
  related_id text
);

-- 7. TOURNAMENTS
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by text,
  title text not null,
  description text,
  start_date date,
  end_date date,
  status text default 'pending' check (status in ('pending','active','completed')),
  max_participants integer default 8,
  prize_description text
);

create table if not exists tournament_participants (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  user_id text not null,
  username text,
  display_name text,
  status text default 'invited' check (status in ('invited','accepted','rejected')),
  score numeric default 0,
  joined_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table user_profiles enable row level security;
alter table transactions enable row level security;
alter table challenges enable row level security;
alter table proposals enable row level security;
alter table friends enable row level security;
alter table notifications enable row level security;
alter table tournaments enable row level security;
alter table tournament_participants enable row level security;

drop policy if exists "Users manage own profile" on user_profiles;
drop policy if exists "Anyone can read profiles" on user_profiles;
drop policy if exists "Users manage own transactions" on transactions;
drop policy if exists "Challenge participants access" on challenges;
drop policy if exists "Proposal participants access" on proposals;
drop policy if exists "Friends access" on friends;
drop policy if exists "Own notifications" on notifications;
drop policy if exists "Insert notification for anyone" on notifications;
drop policy if exists "Anyone can read tournaments" on tournaments;
drop policy if exists "Creator manages tournament" on tournaments;
drop policy if exists "Participants can read" on tournament_participants;
drop policy if exists "Users manage own participation" on tournament_participants;

create policy "Users manage own profile"
  on user_profiles for all
  using (created_by = auth.uid()::text)
  with check (created_by = auth.uid()::text);

create policy "Anyone can read profiles"
  on user_profiles for select
  using (true);

create policy "Users manage own transactions"
  on transactions for all
  using (created_by = auth.uid()::text)
  with check (created_by = auth.uid()::text);

create policy "Challenge participants access"
  on challenges for all
  using (challenger_id = auth.uid()::text or opponent_id = auth.uid()::text)
  with check (challenger_id = auth.uid()::text or opponent_id = auth.uid()::text);

create policy "Proposal participants access"
  on proposals for all
  using (student_email = auth.jwt() ->> 'email' or teacher_email = auth.jwt() ->> 'email')
  with check (student_email = auth.jwt() ->> 'email' or teacher_email = auth.jwt() ->> 'email');

create policy "Friends access"
  on friends for all
  using (requester_id = auth.uid()::text or recipient_id = auth.uid()::text)
  with check (requester_id = auth.uid()::text or recipient_id = auth.uid()::text);

create policy "Own notifications"
  on notifications for all
  using (recipient_id = auth.uid()::text)
  with check (recipient_id = auth.uid()::text);

create policy "Insert notification for anyone"
  on notifications for insert
  with check (true);

create policy "Anyone can read tournaments"
  on tournaments for select using (true);

create policy "Creator manages tournament"
  on tournaments for all
  using (created_by = auth.uid()::text)
  with check (created_by = auth.uid()::text);

create policy "Participants can read"
  on tournament_participants for select using (true);

create policy "Users manage own participation"
  on tournament_participants for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Indexes
create index if not exists idx_user_profiles_username on user_profiles(username);
create index if not exists idx_user_profiles_email on user_profiles(email);
create index if not exists idx_notifications_recipient on notifications(recipient_id, read);
create index if not exists idx_friends_requester on friends(requester_id);
create index if not exists idx_friends_recipient on friends(recipient_id);
create index if not exists idx_user_profiles_xp on user_profiles(xp desc);
create index if not exists idx_user_profiles_battles on user_profiles(battles_won desc);
create index if not exists idx_user_profiles_tournaments on user_profiles(tournament_wins desc);
