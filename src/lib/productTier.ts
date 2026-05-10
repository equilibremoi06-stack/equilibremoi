/**
 * Règles produit Gratuit vs Premium (alignées offre EquilibreMoi).
 * L’admin (ex. equilibremoi.06@gmail.com) est traité comme Premium via `hasPremiumEntitlements`.
 */

/** Entrées de suivi poids visibles en gratuit (historique limité). */
export const FREE_TIER_WEIGHT_HISTORY_VISIBLE = 4;

/**
 * Semaines navigables dans le programme (aperçu) — gratuit plus court, Premium jusqu’à ~2 mois.
 * Les données complètes peuvent être générées en arrière-plan selon l’objectif ; l’UI limite l’exploration.
 */
export const FREE_PROGRAM_WEEKS_VISIBLE_CAP = 4;
export const PREMIUM_PROGRAM_WEEKS_VISIBLE_CAP = 8;

export function getProgramWeeksVisibleCap(hasPremiumAccess: boolean): number {
  return hasPremiumAccess ? PREMIUM_PROGRAM_WEEKS_VISIBLE_CAP : FREE_PROGRAM_WEEKS_VISIBLE_CAP;
}

export function getVisibleWeightHistory<T extends { date: string }>(
  entries: T[],
  hasFullHistory: boolean
): T[] {
  if (hasFullHistory) return [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(-FREE_TIER_WEIGHT_HISTORY_VISIBLE);
}

export function canExportCoursesPdf(hasPremiumAccess: boolean): boolean {
  return hasPremiumAccess;
}

export function canAccessPremiumInsights(hasPremiumAccess: boolean): boolean {
  return hasPremiumAccess;
}
