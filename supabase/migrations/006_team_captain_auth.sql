-- Captain PIN + token for single-writer team control

alter table public.teams
  add column if not exists captain_pin text,
  add column if not exists captain_token text;

-- Backfill existing teams
update public.teams
set
  captain_pin = lpad(floor(random() * 10000)::int::text, 4, '0'),
  captain_token = gen_random_uuid()::text
where captain_token is null;
