-- Reliable menu item loading for students (bypasses RLS edge cases for anon play)

create or replace function public.get_team_menu_items(p_team_id uuid)
returns table (
  id uuid,
  case_id uuid,
  name text,
  cost integer,
  description text,
  item_type text,
  sort_order integer
)
language sql
security definer
set search_path = public
as $$
  select
    m.id,
    m.case_id,
    m.name,
    m.cost,
    m.description,
    coalesce(m.item_type, 'test') as item_type,
    m.sort_order
  from public.case_menu_items m
  join public.game_sessions gs on gs.case_id = m.case_id
  join public.teams t on t.session_id = gs.id
  where t.id = p_team_id
    and gs.status in ('waiting', 'active', 'paused')
  order by m.sort_order;
$$;

grant execute on function public.get_team_menu_items(uuid) to anon, authenticated;
