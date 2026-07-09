-- Add menu item types for purchasable patient history, tests, and image clues

alter table public.case_menu_items
  add column if not exists item_type text not null default 'test'
  check (item_type in (
    'symptom_history',
    'medical_background',
    'lifestyle_background',
    'test',
    'image'
  ));

comment on column public.case_menu_items.item_type is
  'symptom_history | medical_background | lifestyle_background | test | image';
