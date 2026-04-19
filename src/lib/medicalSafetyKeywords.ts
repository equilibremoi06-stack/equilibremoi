/** Mots-clés sensibles dans les réponses libres / messages utilisateur (français). */
export const MEDICAL_SAFETY_KEYWORDS: string[] = [
  'douleur',
  'douleurs',
  'saignement',
  'saignements',
  'traitement',
  'médicament',
  'medicament',
  'cancer',
  'tumeur',
  'fatigue extrême',
  'fatigue extreme',
  'vertige',
  'vertiges',
  'malaise',
  'endocrinologue',
  'insulinothérapie',
  'insulinotherapie',
  'grossesse',
  'enceinte',
  'allaitement',
  'allaiter',
  'infarctus',
  'accident vasculaire',
  'suicide',
  'automutilation',
];

export const KEYWORD_SAFETY_MESSAGE =
  '💚 Ces symptômes ou cette situation méritent l’attention d’un professionnel de santé. L’alimentation peut accompagner ton bien-être, mais elle ne remplace jamais un suivi médical. Parle-en à ton médecin, ton gynécologue, ta sage-femme ou ton diététicien.';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * Détecte si le texte utilisateur contient un mot-clé sensible.
 */
export function detectSensitiveKeywords(text: string): boolean {
  const n = normalize(text);
  return MEDICAL_SAFETY_KEYWORDS.some((kw) => n.includes(normalize(kw)));
}
