-- Statut onboarding persistant pour éviter de renvoyer les utilisatrices déjà accompagnées dans le questionnaire.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists parcours_type text null check (parcours_type in ('classique', 'menopause')),
  add column if not exists questionnaire_completed_at timestamptz null,
  add column if not exists onboarding_step integer not null default 0,
  add column if not exists current_onboarding_step integer not null default 0,
  add column if not exists questionnaire_snapshot jsonb null,
  add column if not exists onboarding_updated_at timestamptz not null default now();

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

