-- Date stable de création du programme affichée dans l'onglet Profil.

alter table public.profiles
  add column if not exists program_created_at timestamptz null;

update public.profiles
set program_created_at = coalesce(program_created_at, questionnaire_completed_at, created_at)
where program_created_at is null;
