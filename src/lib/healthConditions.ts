import type { HealthConditionId } from '../types/healthProfile';

export const NONE_CONDITION_ID: HealthConditionId = 'none';

export const HEALTH_CONDITION_OPTIONS: {
  id: HealthConditionId;
  label: string;
}[] = [
  { id: 'diabetes', label: 'Diabète ou pré-diabète' },
  { id: 'thyroid', label: 'Problèmes de thyroïde' },
  {
    id: 'eating_disorder',
    label: 'Troubles alimentaires (anorexie, boulimie, hyperphagie…)',
  },
  { id: 'cardiovascular', label: 'Maladie cardiovasculaire' },
  { id: 'severe_allergy', label: 'Allergie alimentaire grave' },
  { id: 'pregnancy', label: 'Grossesse' },
  { id: 'breastfeeding', label: 'Allaitement' },
  { id: 'ongoing_treatment', label: 'Traitement médical en cours' },
  {
    id: 'hormonal_cancer_history',
    label: 'Cancer hormono-dépendant ou antécédent',
  },
  { id: 'none', label: 'Aucun de ces éléments' },
];

export function hasSensitiveSelection(selected: HealthConditionId[]): boolean {
  if (!selected.length) return false;
  const onlyNone =
    selected.length === 1 && selected[0] === NONE_CONDITION_ID;
  if (onlyNone) return false;
  if (selected.includes(NONE_CONDITION_ID) && selected.length > 1) {
    return true;
  }
  return !selected.every((id) => id === NONE_CONDITION_ID);
}

export const SAFETY_MESSAGE_SENSITIVE = `💚 Merci pour ta confiance. Étant donné ta situation de santé, nous te recommandons fortement de consulter ton médecin, ta sage-femme, ton gynécologue ou un diététicien avant de commencer un programme alimentaire. ÉquilibreMoi peut être un complément de bien-être, mais ne remplace jamais un suivi médical.`;

export const RECURRING_REMINDER_TEXT =
  '💚 Pense à faire le point régulièrement avec ton professionnel de santé.';

export const HORMONAL_CANCER_DISCLAIMER =
  '💚 Ces recommandations nécessitent l’avis de ton médecin ou gynécologue avant toute application.';

export const EATING_DISORDER_IMMEDIATE =
  "💚 ÉquilibreMoi n’est pas adaptée comme seul soutien pour les troubles alimentaires. Nous t’encourageons vivement à te faire accompagner par un professionnel spécialisé.";

export const EATING_DISORDER_RESOURCE =
  'Anorexie boulimie, info écoute : 09 69 325 900';
