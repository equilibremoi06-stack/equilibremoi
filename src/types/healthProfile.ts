/** Aligné sur la table Supabase `user_health_profile` */
export type HealthConditionId =
  | 'diabetes'
  | 'thyroid'
  | 'eating_disorder'
  | 'cardiovascular'
  | 'severe_allergy'
  | 'pregnancy'
  | 'breastfeeding'
  | 'ongoing_treatment'
  | 'hormonal_cancer_history'
  | 'none';

export interface UserHealthProfile {
  id?: string;
  userId?: string;
  medicalAcknowledged: boolean;
  healthConditions: HealthConditionId[];
  hasSensitiveProfile: boolean;
  menopauseFlags: string[];
  needsRecurringMedicalReminder: boolean;
  lastMedicalReminderAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}
