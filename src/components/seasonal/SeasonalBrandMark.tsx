import { useCallback, useRef } from 'react';
import type { SeasonalTheme } from '../../utils/seasonalTheme';

const STORAGE_KEY = 'equilibre-easter-egg';

type Props = { theme: SeasonalTheme };

export function SeasonalBrandMark({ theme }: Props) {
  const taps = useRef(0);

  const onClick = useCallback(() => {
    if (theme.themeKey !== 'easter') return;
    taps.current += 1;
    if (taps.current >= 5) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
      taps.current = 0;
    }
  }, [theme.themeKey]);

  if (theme.themeKey !== 'easter') return null;

  return (
    <button
      type="button"
      className="seasonal-brand-mark"
      onClick={onClick}
      aria-label="ÉquilibreMoi"
    >
      EM
    </button>
  );
}
