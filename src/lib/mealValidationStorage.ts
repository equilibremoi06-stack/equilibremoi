import { getSupabase } from './supabaseClient';

export type ParcoursType = 'classique' | 'menopause';
export type PersistedMealSlot = 'breakfast' | 'lunch' | 'dinner';

export type PersistedMealValidation = {
  user_id: string;
  parcours_type: ParcoursType;
  meal_date: string;
  week_index: number;
  day_index: number;
  meal_type: PersistedMealSlot;
  recipe_id: string | null;
  validated: boolean;
  validated_at?: string | null;
};

type SaveMealValidationInput = {
  userId: string;
  parcoursType: ParcoursType;
  mealDate: string;
  weekIndex: number;
  dayIndex: number;
  mealType: PersistedMealSlot;
  recipeId?: string | null;
};

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getProgramMealDate(weekIndex: number, dayIndex: number): string {
  const today = new Date();
  const todayProgramDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const mealDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  mealDate.setDate(mealDate.getDate() - todayProgramDay + weekIndex * 7 + dayIndex);
  return toLocalIsoDate(mealDate);
}

function parseSnapshotValidationRows(
  snapshot: unknown,
  userId: string,
  parcoursType: ParcoursType
): PersistedMealValidation[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const validationState = (snapshot as { validationState?: unknown }).validationState;
  if (!validationState || typeof validationState !== 'object') return [];

  return Object.entries(validationState as Record<string, unknown>).flatMap(([key, validated]) => {
    if (validated !== true) return [];
    const [weekRaw, dayRaw, mealTypeRaw] = key.split('-');
    const weekIndex = Number(weekRaw);
    const dayIndex = Number(dayRaw);
    if (
      !Number.isInteger(weekIndex) ||
      !Number.isInteger(dayIndex) ||
      !['breakfast', 'lunch', 'dinner'].includes(mealTypeRaw)
    ) {
      return [];
    }

    return [{
      user_id: userId,
      parcours_type: parcoursType,
      meal_date: getProgramMealDate(weekIndex, dayIndex),
      week_index: weekIndex,
      day_index: dayIndex,
      meal_type: mealTypeRaw as PersistedMealSlot,
      recipe_id: null,
      validated: true,
      validated_at: null,
    }];
  });
}

async function loadValidationRowsFromProfile(
  userId: string,
  parcoursType: ParcoursType
): Promise<PersistedMealValidation[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('questionnaire_snapshot')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[mealValidationStorage] fallback profil échoué', error);
    return [];
  }

  return parseSnapshotValidationRows(data?.questionnaire_snapshot, userId, parcoursType);
}

async function saveValidationToProfileSnapshot(input: SaveMealValidationInput): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('questionnaire_snapshot')
    .eq('id', input.userId)
    .maybeSingle();

  if (error) {
    console.warn('[mealValidationStorage] lecture fallback profil échouée', error);
    return false;
  }

  const currentSnapshot =
    data?.questionnaire_snapshot && typeof data.questionnaire_snapshot === 'object'
      ? (data.questionnaire_snapshot as Record<string, unknown>)
      : { v: 1, phase: 'result' };
  const currentValidationState =
    currentSnapshot.validationState && typeof currentSnapshot.validationState === 'object'
      ? (currentSnapshot.validationState as Record<string, boolean>)
      : {};
  const key = `${input.weekIndex}-${input.dayIndex}-${input.mealType}`;
  const questionnaireSnapshot = {
    ...currentSnapshot,
    validationState: {
      ...currentValidationState,
      [key]: true,
    },
  };

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: input.userId,
      questionnaire_snapshot: questionnaireSnapshot,
      onboarding_updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (upsertError) {
    console.warn('[mealValidationStorage] sauvegarde fallback profil échouée', upsertError);
    return false;
  }

  return true;
}

export async function loadMealValidations(
  userId: string,
  parcoursType: ParcoursType
): Promise<PersistedMealValidation[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('meal_validations')
    .select('user_id, parcours_type, meal_date, week_index, day_index, meal_type, recipe_id, validated, validated_at')
    .eq('user_id', userId)
    .eq('parcours_type', parcoursType)
    .eq('validated', true);

  if (error) {
    console.warn('[mealValidationStorage] chargement Supabase échoué', error);
    return loadValidationRowsFromProfile(userId, parcoursType);
  }

  const tableRows = (data ?? []) as PersistedMealValidation[];
  const profileRows = await loadValidationRowsFromProfile(userId, parcoursType);
  const byDateAndType = new Map<string, PersistedMealValidation>();
  [...profileRows, ...tableRows].forEach((row) => {
    byDateAndType.set(`${row.meal_date}-${row.meal_type}`, row);
  });
  return [...byDateAndType.values()];
}

export async function saveMealValidation(input: SaveMealValidationInput): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const now = new Date().toISOString();
  const { error } = await supabase.from('meal_validations').upsert(
    {
      user_id: input.userId,
      parcours_type: input.parcoursType,
      meal_date: input.mealDate,
      week_index: input.weekIndex,
      day_index: input.dayIndex,
      meal_type: input.mealType,
      recipe_id: input.recipeId ?? null,
      validated: true,
      validated_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id,parcours_type,meal_date,meal_type' }
  );

  const profileSaved = await saveValidationToProfileSnapshot(input);

  if (error) {
    console.warn('[mealValidationStorage] sauvegarde Supabase échouée', error);
    return profileSaved;
  }

  return true;
}
