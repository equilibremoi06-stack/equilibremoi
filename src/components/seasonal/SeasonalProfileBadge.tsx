import type { SeasonalTheme } from '../../utils/seasonalTheme';

type Props = { theme: SeasonalTheme };

export function SeasonalProfileBadge({ theme }: Props) {
  if (!theme.showProfileBadge || !theme.badgeText) return null;
  return (
    <span className="seasonal-profile-badge" title={theme.label}>
      {theme.badgeText}
    </span>
  );
}
