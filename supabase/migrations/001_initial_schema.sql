-- Diagnostic Dash: initial schema
-- Run in Supabase SQL Editor or via supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TEACHERS (profiles linked to auth.users)
-- ============================================================
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.teachers enable row level security;

create policy "Teachers can read own profile"
  on public.teachers for select
  using (auth.uid() = id);

create policy "Teachers can update own profile"
  on public.teachers for update
  using (auth.uid() = id);

-- Auto-create teacher profile on signup
create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.teachers (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_teacher();

-- ============================================================
-- CASES
-- ============================================================
create table public.cases (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null,
  category text not null default 'General',
  patient_age integer not null default 0,
  patient_sex text not null default 'Unknown',
  chief_complaint text not null default '',
  case_intro text not null default '',
  accepted_diagnoses text[] not null default '{}',
  alternate_accepted_answers text[] not null default '{}',
  starting_budget integer not null default 1000,
  teacher_notes text not null default '',
  debrief_content text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases enable row level security;

create policy "Teachers manage own cases"
  on public.cases for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- ============================================================
-- CASE MENU ITEMS (diagnostic tests / clues)
-- ============================================================
create table public.case_menu_items (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete cascade,
  name text not null,
  cost integer not null default 0,
  description text not null default '',
  clue_content text not null default '',
  clue_image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.case_menu_items enable row level security;

create policy "Teachers manage menu items for own cases"
  on public.case_menu_items for all
  using (
    exists (
      select 1 from public.cases c
      where c.id = case_menu_items.case_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = case_menu_items.case_id and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- GAME SESSIONS
-- ============================================================
create type public.session_status as enum ('waiting', 'active', 'paused', 'ended');

create table public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  join_code text not null unique,
  status public.session_status not null default 'waiting',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index game_sessions_join_code_idx on public.game_sessions(join_code);

alter table public.game_sessions enable row level security;

create policy "Teachers manage own sessions"
  on public.game_sessions for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Students can read active sessions by join code (via anon)
create policy "Anyone can read sessions"
  on public.game_sessions for select
  using (true);

-- ============================================================
-- TEAMS
-- ============================================================
create type public.diagnosis_status as enum ('pending', 'correct', 'incorrect');

create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  team_name text not null,
  budget_remaining integer not null default 1000,
  shared_notes text not null default '',
  diagnosis text,
  evidence text[] not null default '{}',
  alternate_diagnosis text,
  diagnosis_status public.diagnosis_status not null default 'pending',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, team_name)
);

alter table public.teams enable row level security;

create policy "Anyone can read teams"
  on public.teams for select
  using (true);

create policy "Anyone can insert teams"
  on public.teams for insert
  with check (true);

create policy "Anyone can update teams"
  on public.teams for update
  using (true);

create policy "Teachers can delete teams in own sessions"
  on public.teams for delete
  using (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = teams.session_id and gs.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- TEAM PURCHASES
-- ============================================================
create table public.team_purchases (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  menu_item_id uuid not null references public.case_menu_items(id) on delete cascade,
  cost_paid integer not null,
  purchased_at timestamptz not null default now(),
  unique (team_id, menu_item_id)
);

alter table public.team_purchases enable row level security;

create policy "Anyone can read purchases"
  on public.team_purchases for select
  using (true);

create policy "Anyone can insert purchases"
  on public.team_purchases for insert
  with check (true);

-- ============================================================
-- PUBLIC READ ACCESS FOR CASES IN ACTIVE SESSIONS
-- Students need case info when playing
-- ============================================================
create policy "Anyone can read cases in active sessions"
  on public.cases for select
  using (
    exists (
      select 1 from public.game_sessions gs
      where gs.case_id = cases.id
        and gs.status in ('waiting', 'active', 'paused')
    )
    or auth.uid() = teacher_id
  );

create policy "Anyone can read menu items for active session cases"
  on public.case_menu_items for select
  using (
    exists (
      select 1 from public.game_sessions gs
      join public.cases c on c.id = gs.case_id
      where c.id = case_menu_items.case_id
        and gs.status in ('waiting', 'active', 'paused')
    )
    or exists (
      select 1 from public.cases c
      where c.id = case_menu_items.case_id and c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET FOR CLUE IMAGES
-- ============================================================
insert into storage.buckets (id, name, public)
values ('clue-images', 'clue-images', true)
on conflict (id) do nothing;

create policy "Teachers can upload clue images"
  on storage.objects for insert
  with check (
    bucket_id = 'clue-images'
    and auth.role() = 'authenticated'
  );

create policy "Anyone can view clue images"
  on storage.objects for select
  using (bucket_id = 'clue-images');

create policy "Teachers can update own clue images"
  on storage.objects for update
  using (bucket_id = 'clue-images' and auth.role() = 'authenticated');

create policy "Teachers can delete own clue images"
  on storage.objects for delete
  using (bucket_id = 'clue-images' and auth.role() = 'authenticated');

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.team_purchases;

-- ============================================================
-- HELPER: generate join code
-- ============================================================
create or replace function public.generate_join_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$;

-- ============================================================
-- PURCHASE MENU ITEM (atomic budget deduction)
-- ============================================================
create or replace function public.purchase_menu_item(
  p_team_id uuid,
  p_menu_item_id uuid
)
returns public.team_purchases
language plpgsql
security definer set search_path = public
as $$
declare
  v_team public.teams;
  v_item public.case_menu_items;
  v_session public.game_sessions;
  v_purchase public.team_purchases;
begin
  select * into v_team from public.teams where id = p_team_id for update;
  if not found then raise exception 'Team not found'; end if;

  select * into v_session from public.game_sessions where id = v_team.session_id;
  if v_session.status not in ('active', 'waiting') then
    raise exception 'Session is not active';
  end if;

  select * into v_item from public.case_menu_items where id = p_menu_item_id;
  if not found then raise exception 'Menu item not found'; end if;

  if exists (select 1 from public.team_purchases where team_id = p_team_id and menu_item_id = p_menu_item_id) then
    raise exception 'Already purchased';
  end if;

  if v_team.budget_remaining < v_item.cost then
    raise exception 'Insufficient budget';
  end if;

  update public.teams
  set budget_remaining = budget_remaining - v_item.cost
  where id = p_team_id;

  insert into public.team_purchases (team_id, menu_item_id, cost_paid)
  values (p_team_id, p_menu_item_id, v_item.cost)
  returning * into v_purchase;

  return v_purchase;
end;
$$;

grant execute on function public.purchase_menu_item(uuid, uuid) to anon, authenticated;
