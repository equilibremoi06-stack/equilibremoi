import type { ReactNode } from 'react';
import { AppHeader } from '../AppHeader';
import { useSeasonalThemeContext } from '../../hooks/useSeasonalTheme';
import { SeasonalBrandMark } from './SeasonalBrandMark';
import { SeasonalDecor } from './SeasonalDecor';

type Props = { children: ReactNode };

export function SeasonalLayout({ children }: Props) {
  const theme = useSeasonalThemeContext();

  return (
    <div className="seasonal-app-shell">
      <SeasonalDecor theme={theme} />
      <AppHeader />
      <div className="seasonal-app-shell-content">{children}</div>
      <SeasonalBrandMark theme={theme} />
    </div>
  );
}
