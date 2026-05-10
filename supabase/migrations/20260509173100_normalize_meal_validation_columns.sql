-- Compatibilité si une première version locale utilisait meal_slot / meal_id.

alter table public.meal_validations
  add column if not exists meal_type text,
  add column if not exists recipe_id text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_validations'
      and column_name = 'meal_slot'
  ) then
    execute 'update public.meal_validations set meal_type = coalesce(meal_type, meal_slot)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meal_validations'
      and column_name = 'meal_id'
  ) then
    execute 'update public.meal_validations set recipe_id = coalesce(recipe_id, meal_id)';
  end if;
end $$;

alter table public.meal_validations
  alter column meal_type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_validations_meal_type_check'
  ) then
    alter table public.meal_validations
      add constraint meal_validations_meal_type_check
      check (meal_type in ('breakfast', 'lunch', 'dinner')) not valid;
  end if;
end $$;

alter table public.meal_validations
  validate constraint meal_validations_meal_type_check;

alter table public.meal_validations
  drop constraint if exists meal_validations_user_id_parcours_type_meal_date_meal_slot_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'meal_validations_user_parcours_date_type_key'
  ) then
    alter table public.meal_validations
      add constraint meal_validations_user_parcours_date_type_key
      unique (user_id, parcours_type, meal_date, meal_type);
  end if;
end $$;
