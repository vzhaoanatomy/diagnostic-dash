-- Submission tracking, resubmit support, and strict mode sessions

alter table public.game_sessions
  add column if not exists strict_mode boolean not null default false;

alter table public.teams
  add column if not exists submission_count integer not null default 0
    check (submission_count >= 0 and submission_count <= 2),
  add column if not exists first_diagnosis text,
  add column if not exists first_submitted_at timestamptz;
