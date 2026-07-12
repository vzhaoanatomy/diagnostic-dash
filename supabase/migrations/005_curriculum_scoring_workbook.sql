-- Curriculum units, difficulty budgets, lab interpretation, presentation workbook, scoring, timer

alter table public.cases
  add column if not exists difficulty text not null default 'intermediate'
    check (difficulty in ('introductory', 'intermediate', 'advanced')),
  add column if not exists primary_unit text not null default 'mixed'
    check (primary_unit in (
      'integumentary', 'skeletal', 'muscular', 'nervous', 'cardiovascular',
      'digestive', 'respiratory', 'urinary', 'reproductive', 'immune', 'mixed'
    ));

alter table public.case_menu_items
  add column if not exists reference_range text not null default '',
  add column if not exists interpretation text not null default '';

alter table public.teams
  add column if not exists pathophys_explanation text not null default '',
  add column if not exists treatment_plan text[] not null default '{}',
  add column if not exists key_orders_reflection text not null default '',
  add column if not exists purchase_journey text not null default '',
  add column if not exists presentation_notes text not null default '',
  add column if not exists speed_bonus integer not null default 0,
  add column if not exists speed_rank integer
    check (speed_rank is null or speed_rank in (1, 2)),
  add column if not exists teacher_budget_adjustment integer not null default 0;

alter table public.game_sessions
  add column if not exists round_timer_ends_at timestamptz,
  add column if not exists round_timer_seconds integer;
