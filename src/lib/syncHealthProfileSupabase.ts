import type { UserHealthProfile } from '../types/healthProfile';
import { getSupabase } from './supabaseClient';

/**
 * Envoie le profil santé local vers Supabase quand une session utilisateur existe.
 * Sans `userId`, ne fait rien (mode local uniquement).
 */
export async function upsertUserHealthProfile(
  userId: string | undefined,
  profile: UserHealthProfile,
): Promise<void> {
  if (!userId) return;
  const sb = getSupabase();
  if (!sb) return;

  const row = {
    user_id: userId,
    medical_acknowledged: profile.medicalAcknowledged,
    health_conditions: profile.healthConditions,
    has_sensitive_profile: profile.hasSensitiveProfile,
    menopause_flags: profile.menopauseFlags,
    needs_recurring_medical_reminder: profile.needsRecurringMedicalReminder,
    last_medical_reminder_at: profile.lastMedicalReminderAt,
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb.from('user_health_profile').upsert(row, {
    onConflict: 'user_id',
  });
  if (error) {
    console.warn('[EquilibreMoi] sync user_health_profile', error.message);
  }
}
