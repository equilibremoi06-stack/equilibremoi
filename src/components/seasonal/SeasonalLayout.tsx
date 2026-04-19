import type { ReactNode } from 'react';
import { useSeasonalThemeContext } from '../../hooks/useSeasonalTheme';
import SeasonalAnimation from './SeasonalAnimation';
import { SeasonalBrandMark } from './SeasonalBrandMark';
import { SeasonalDecor } from './SeasonalDecor';

type Props = { children: ReactNode };

export function SeasonalLayout({ children }: Props) {
  const theme = useSeasonalThemeContext();

  return (
    <div className="seasonal-app-shell">
      <SeasonalAnimation />
      <SeasonalDecor theme={theme} />
      <div className="seasonal-app-shell-content">{children}</div>
      <SeasonalBrandMark theme={theme} />
    </div>
  );
}
