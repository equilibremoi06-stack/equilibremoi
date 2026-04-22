import { menopauseDisclaimers, MENOPAUSE_MEDICAL_REDIRECT } from '../menopauseContent';
import type { UserHealthProfile } from '../../types/healthProfile';
import { buildMedicalContext } from './buildMedicalContext';

/**
 * Contexte additionnel pour le parcours ménopause : ton doux, cadre sérieux, zéro promesse.
 */
export function buildMenopauseContext(profile: UserHealthProfile): string {
  const base = buildMedicalContext(profile);

  const menopauseBlock = [
    'Parcours ménopause : ton doux et bienveillant, jamais clinique ni culpabilisant.',
    'Interdictions : promesses thérapeutiques ; dosages ; prescriptions ; recommandations de compléments ; présenter le soja comme solution « prouvée » ou systématique.',
    'Si soja ou phytoestrogènes évoqués : prudence, jamais imposé.',
    MENOPAUSE_MEDICAL_REDIRECT,
    ...menopauseDisclaimers.map((d) => `— ${d}`),
  ].join('\n');

  return `${base}\n\n---\n${menopauseBlock}`;
}
