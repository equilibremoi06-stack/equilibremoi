import type { SeasonalTheme } from '../../utils/seasonalTheme';

type Props = { theme: SeasonalTheme };

/** Fond statique : pas de déco flottante ni saisonnière pour l’instant. */
export function SeasonalDecor(_: Props) {
  return null;
}
