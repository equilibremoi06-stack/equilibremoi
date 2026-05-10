-- Source de vérité profil : admin/premium persistants pour le compte administrateur.

alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists is_admin boolean not null default false,
  add column if not exists role text null,
  add column if not exists subscription_type text null,
  add column if not exists premium_updated_at timestamptz null;

alter table public.profiles disable trigger trg_profiles_guard_premium_flags;

insert into public.profiles (id, email, premium, is_premium, is_admin, role, subscription_type, created_at, premium_updated_at)
select
  users.id,
  users.email,
  true,
  true,
  true,
  'admin',
  'premium',
  coalesce(users.created_at, now()),
  now()
from auth.users
where lower(users.email) = 'equilibremoi.06@gmail.com'
on conflict (id) do update set
  email = excluded.email,
  premium = true,
  is_premium = true,
  is_admin = true,
  role = 'admin',
  subscription_type = 'premium',
  premium_updated_at = now();

update public.profiles
set
  premium = true,
  is_premium = true,
  is_admin = true,
  role = 'admin',
  subscription_type = 'premium',
  premium_updated_at = now()
where lower(email) = 'equilibremoi.06@gmail.com';

alter table public.profiles enable trigger trg_profiles_guard_premium_flags;

create or replace function public.sync_admin_profile_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    premium,
    is_premium,
    is_admin,
    role,
    subscription_type,
    created_at,
    premium_updated_at
  )
  values (
    new.id,
    new.email,
    lower(new.email) = 'equilibremoi.06@gmail.com',
    lower(new.email) = 'equilibremoi.06@gmail.com',
    lower(new.email) = 'equilibremoi.06@gmail.com',
    case when lower(new.email) = 'equilibremoi.06@gmail.com' then 'admin' else null end,
    case when lower(new.email) = 'equilibremoi.06@gmail.com' then 'premium' else null end,
    coalesce(new.created_at, now()),
    case when lower(new.email) = 'equilibremoi.06@gmail.com' then now() else null end
  )
  on conflict (id) do update set
    email = excluded.email,
    premium = public.profiles.premium or excluded.premium,
    is_premium = public.profiles.is_premium or excluded.is_premium,
    is_admin = public.profiles.is_admin or excluded.is_admin,
    role = coalesce(excluded.role, public.profiles.role),
    subscription_type = coalesce(excluded.subscription_type, public.profiles.subscription_type),
    premium_updated_at = coalesce(excluded.premium_updated_at, public.profiles.premium_updated_at);

  return new;
end;
$$;

drop trigger if exists sync_admin_profile_flags_on_auth_user on auth.users;
create trigger sync_admin_profile_flags_on_auth_user
  after insert or update of email on auth.users
  for each row execute function public.sync_admin_profile_flags();
