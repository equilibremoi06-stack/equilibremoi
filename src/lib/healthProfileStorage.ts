import type { HealthConditionId, UserHealthProfile } from '../types/healthProfile';
import { hasSensitiveSelection } from './healthConditions';

function trySyncSupabase(): void {
  void (async () => {
    const { getSupabase } = await import('./supabaseClient');
    const sb = getSupabase();
    if (!sb) return;
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user?.id) return;
    const { upsertUserHealthProfile } = await import('./syncHealthProfileSupabase');
    await upsertUserHealthProfile(user.id, loadLocalHealthProfile());
  })();
}

const LS_ACK = 'equilibre_medical_acknowledged';
const LS_CONDITIONS = 'equilibre_health_conditions';
const LS_SENSITIVE = 'equilibre_has_sensitive_profile';
const LS_REMINDER_AT = 'equilibre_last_medical_reminder_at';
const LS_MENOPAUSE_FLAGS = 'equilibre_menopause_flags';

const DAYS_RECURRING = 30;

function parseConditions(raw: string | null): HealthConditionId[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    return Array.isArray(j) ? (j as HealthConditionId[]) : [];
  } catch {
    return [];
  }
}

function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    return Array.isArray(j) ? j.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function loadLocalHealthProfile(): UserHealthProfile {
  const ack = localStorage.getItem(LS_ACK) === 'true';
  const healthConditions = parseConditions(localStorage.getItem(LS_CONDITIONS));
  const hasSensitiveProfile =
    localStorage.getItem(LS_SENSITIVE) === 'true' ||
    hasSensitiveSelection(healthConditions);
  const lastMedicalReminderAt = localStorage.getItem(LS_REMINDER_AT);
  const menopauseFlags = parseStringArray(localStorage.getItem(LS_MENOPAUSE_FLAGS));

  return {
    medicalAcknowledged: ack,
    healthConditions,
    hasSensitiveProfile,
    menopauseFlags,
    needsRecurringMedicalReminder: hasSensitiveProfile,
    lastMedicalReminderAt,
  };
}

export function saveMedicalAcknowledged(value: boolean): void {
  localStorage.setItem(LS_ACK, value ? 'true' : 'false');
  trySyncSupabase();
}

export function saveHealthConditions(conditions: HealthConditionId[]): void {
  localStorage.setItem(LS_CONDITIONS, JSON.stringify(conditions));
  const sensitive = hasSensitiveSelection(conditions);
  localStorage.setItem(LS_SENSITIVE, sensitive ? 'true' : 'false');
  trySyncSupabase();
}

export function touchMedicalReminderShown(): void {
  localStorage.setItem(LS_REMINDER_AT, new Date().toISOString());
  trySyncSupabase();
}

/**
 * Rappel tous les ~30 jours pour les profils sensibles.
 */
export function shouldShowRecurringMedicalReminder(): boolean {
  const p = loadLocalHealthProfile();
  if (!p.hasSensitiveProfile) return false;
  if (!p.lastMedicalReminderAt) return true;
  const last = new Date(p.lastMedicalReminderAt).getTime();
  if (Number.isNaN(last)) return true;
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return days >= DAYS_RECURRING;
}

export function dismissRecurringReminderForNow(): void {
  touchMedicalReminderShown();
}

export function saveMenopauseFlags(flags: string[]): void {
  localStorage.setItem(LS_MENOPAUSE_FLAGS, JSON.stringify(flags));
  trySyncSupabase();
}
