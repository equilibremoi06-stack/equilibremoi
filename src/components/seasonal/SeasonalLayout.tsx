import type { ReactNode } from 'react';
import { useUserAccess } from '../../context/UserAccessContext';
import { hasPremiumEntitlements } from '../../lib/authFlow';
import { useSeasonalThemeContext } from '../../hooks/useSeasonalTheme';
import { AppHeader } from '../AppHeader';
import { SeasonalBrandMark } from './SeasonalBrandMark';
import { SeasonalDecor } from './SeasonalDecor';

type Props = { children: ReactNode };

export function SeasonalLayout({ children }: Props) {
  const theme = useSeasonalThemeContext();
  const { access, profile } = useUserAccess();
  const premiumChrome = hasPremiumEntitlements(access, profile);

  return (
    <div className="seasonal-app-shell" data-eq-premium={premiumChrome ? 'true' : 'false'}>
      <SeasonalDecor theme={theme} />
      <AppHeader />
      <div className="seasonal-app-shell-content">{children}</div>
      <SeasonalBrandMark theme={theme} />
    </div>
  );
}
