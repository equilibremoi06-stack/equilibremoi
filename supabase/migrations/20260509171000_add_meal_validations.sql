-- Validations de repas persistantes par utilisatrice, parcours, date et repas.

create table if not exists public.meal_validations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parcours_type text not null check (parcours_type in ('classique', 'menopause')),
  meal_date date not null,
  week_index integer not null default 0,
  day_index integer not null default 0,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  recipe_id text null,
  validated boolean not null default true,
  validated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, parcours_type, meal_date, meal_type)
);

alter table public.meal_validations enable row level security;

drop policy if exists "Users can read their own meal validations" on public.meal_validations;
create policy "Users can read their own meal validations"
  on public.meal_validations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own meal validations" on public.meal_validations;
create policy "Users can insert their own meal validations"
  on public.meal_validations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own meal validations" on public.meal_validations;
create policy "Users can update their own meal validations"
  on public.meal_validations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists meal_validations_user_parcours_date_idx
  on public.meal_validations (user_id, parcours_type, meal_date);
