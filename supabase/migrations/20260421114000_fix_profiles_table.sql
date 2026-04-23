-- Fix missing public.profiles relation and align schema
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  email text,
  premium boolean not null default false
);

-- If profiles already exists with legacy columns, keep it compatible
alter table if exists public.profiles
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists email text,
  add column if not exists premium boolean not null default false;

-- Backward compatibility if old column name is still used
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'is_premium'
  ) then
    execute 'update public.profiles set premium = coalesce(premium, false) or coalesce(is_premium, false)';
  end if;
end $$;

alter table public.profiles enable row level security;

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
