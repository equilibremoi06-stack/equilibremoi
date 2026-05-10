import type { User } from '@supabase/supabase-js';
import type { ClassiqueSnapshotV1 } from './appSession';
import { createDefaultClassiqueSnapshot, persistClassiqueSnapshot } from './appSession';
import { resolveUserAccess } from './authFlow';
import { getSupabase } from './supabaseClient';
import { isUserParcours, setStoredParcours, type UserParcours } from './userParcours';

type ProfileRow = {
  onboarding_completed?: boolean | null;
  parcours_type?: string | null;
  questionnaire_completed_at?: string | null;
  program_created_at?: string | null;
  created_at?: string | null;
  onboarding_step?: number | null;
  current_onboarding_step?: number | null;
  questionnaire_snapshot?: unknown;
};

export type OnboardingStatus = {
  onboardingCompleted: boolean;
  parcoursType: UserParcours | null;
  questionnaireCompletedAt: string | null;
  programCreatedAt: string | null;
  onboardingStep: number;
  questionnaireSnapshot: ClassiqueSnapshotV1 | null;
};

function metadataValue(user: User, key: string): unknown {
  return user.user_metadata?.[key] ?? user.app_metadata?.[key];
}

function normalizeParcours(value: unknown): UserParcours | null {
  return isUserParcours(value) ? value : null;
}

function normalizeSnapshot(value: unknown): ClassiqueSnapshotV1 | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Partial<ClassiqueSnapshotV1>;
  return snapshot.v === 1 && snapshot.phase === 'result' ? (snapshot as ClassiqueSnapshotV1) : null;
}

function statusFromMetadata(user: User): OnboardingStatus {
  const access = resolveUserAccess(user);
  const metadataCompleted =
    metadataValue(user, 'onboarding_completed') === true ||
    metadataValue(user, 'questionnaire_completed') === true ||
    metadataValue(user, 'questionnaire_completed_at') != null;
  const metadataStep = metadataValue(user, 'current_onboarding_step') ?? metadataValue(user, 'onboarding_step');

  return {
    onboardingCompleted: Boolean(metadataCompleted || access.isAdmin),
    parcoursType: normalizeParcours(metadataValue(user, 'parcours_type') ?? metadataValue(user, 'parcours') ?? metadataValue(user, 'selected_parcours')),
    questionnaireCompletedAt:
      typeof metadataValue(user, 'questionnaire_completed_at') === 'string'
        ? (metadataValue(user, 'questionnaire_completed_at') as string)
        : null,
    programCreatedAt:
      typeof metadataValue(user, 'program_created_at') === 'string'
        ? (metadataValue(user, 'program_created_at') as string)
        : typeof user.created_at === 'string'
          ? user.created_at
          : null,
    onboardingStep: typeof metadataStep === 'number' ? metadataStep : 0,
    questionnaireSnapshot: null,
  };
}

export async function getUserOnboardingStatus(user: User): Promise<OnboardingStatus> {
  const fallback = statusFromMetadata(user);
  const supabase = getSupabase();
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed, parcours_type, questionnaire_completed_at, program_created_at, created_at, onboarding_step, current_onboarding_step, questionnaire_snapshot')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[EquilibreMoi] lecture statut onboarding', error.message);
    return fallback;
  }

  const row = (data ?? {}) as ProfileRow;
  const parcoursType = normalizeParcours(row.parcours_type) ?? fallback.parcoursType;
  return {
    onboardingCompleted: row.onboarding_completed === true || fallback.onboardingCompleted,
    parcoursType,
    questionnaireCompletedAt: row.questionnaire_completed_at ?? fallback.questionnaireCompletedAt,
    programCreatedAt:
      row.questionnaire_completed_at ??
      row.program_created_at ??
      fallback.programCreatedAt ??
      row.created_at ??
      null,
    onboardingStep: row.current_onboarding_step ?? row.onboarding_step ?? fallback.onboardingStep,
    questionnaireSnapshot: normalizeSnapshot(row.questionnaire_snapshot) ?? fallback.questionnaireSnapshot,
  };
}

export async function saveOnboardingProgress(
  user: User,
  values: {
    parcoursType?: UserParcours | null;
    onboardingCompleted?: boolean;
    onboardingStep?: number;
    questionnaireSnapshot?: ClassiqueSnapshotV1 | null;
  },
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const current = await getUserOnboardingStatus(user);
  const completed = current.onboardingCompleted || (values.onboardingCompleted ?? false);
  const completedAt = completed
    ? current.questionnaireCompletedAt ?? new Date().toISOString()
    : null;
  const programCreatedAt = current.onboardingCompleted
    ? current.programCreatedAt ?? completedAt ?? new Date().toISOString()
    : completedAt ?? current.programCreatedAt ?? new Date().toISOString();
  const parcoursType = current.onboardingCompleted
    ? current.parcoursType ?? values.parcoursType ?? null
    : values.parcoursType ?? current.parcoursType;

  if (parcoursType) {
    setStoredParcours(parcoursType);
  }

  const payload = {
    id: user.id,
    email: user.email ?? null,
    onboarding_completed: completed,
    parcours_type: parcoursType,
    questionnaire_completed_at: completedAt,
    program_created_at: programCreatedAt,
    onboarding_step: values.onboardingStep ?? current.onboardingStep,
    current_onboarding_step: values.onboardingStep ?? current.onboardingStep,
    questionnaire_snapshot: values.questionnaireSnapshot ?? current.questionnaireSnapshot,
    onboarding_updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.warn('[EquilibreMoi] sauvegarde statut onboarding', error.message);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      onboarding_completed: completed,
      parcours_type: parcoursType,
      questionnaire_completed_at: completedAt,
      program_created_at: programCreatedAt,
      onboarding_step: payload.onboarding_step,
      current_onboarding_step: payload.current_onboarding_step,
    },
  });
  if (metadataError) {
    console.warn('[EquilibreMoi] metadata statut onboarding', metadataError.message);
  }
}

export async function markQuestionnaireCompleted(
  user: User | null | undefined,
  parcoursType: UserParcours,
  questionnaireSnapshot?: ClassiqueSnapshotV1 | null,
): Promise<void> {
  if (!user) return;
  await saveOnboardingProgress(user, {
    parcoursType,
    onboardingCompleted: true,
    onboardingStep: questionnaireSnapshot?.step ?? 999,
    questionnaireSnapshot,
  });
}

export function restoreCompletedOnboardingLocally(status: OnboardingStatus): void {
  if (status.parcoursType) {
    setStoredParcours(status.parcoursType);
  }
  if (status.questionnaireSnapshot) {
    persistClassiqueSnapshot(status.questionnaireSnapshot);
    return;
  }
  if (status.onboardingCompleted && status.parcoursType !== 'menopause') {
    persistClassiqueSnapshot(createDefaultClassiqueSnapshot());
  }
}
