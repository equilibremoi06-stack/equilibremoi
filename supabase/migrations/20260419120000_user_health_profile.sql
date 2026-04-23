-- Profil santé / disclaimers — aligné sur l’app ÉquilibreMoi

create table if not exists public.user_health_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  medical_acknowledged boolean not null default false,
  health_conditions text[] not null default '{}',
  has_sensitive_profile boolean not null default false,
  menopause_flags text[] not null default '{}',
  needs_recurring_medical_reminder boolean not null default false,
  last_medical_reminder_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_health_profile_user_id_idx
  on public.user_health_profile (user_id);

-- Mise à jour automatique de updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_health_profile_set_updated_at on public.user_health_profile;
create trigger user_health_profile_set_updated_at
  before update on public.user_health_profile
  for each row execute procedure public.set_updated_at();

alter table public.user_health_profile enable row level security;

create policy "Users can read own health profile"
  on public.user_health_profile for select
  using (auth.uid() = user_id);

create policy "Users can insert own health profile"
  on public.user_health_profile for insert
  with check (auth.uid() = user_id);

create policy "Users can update own health profile"
  on public.user_health_profile for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
