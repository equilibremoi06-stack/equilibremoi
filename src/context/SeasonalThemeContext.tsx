import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applySeasonalCssVars,
  getActiveSeasonalTheme,
  type SeasonalTheme,
} from '../utils/seasonalTheme';

const SeasonalThemeContext = createContext<SeasonalTheme | null>(null);

function nextMidnightMs(): number {
  const m = new Date();
  m.setDate(m.getDate() + 1);
  m.setHours(0, 0, 0, 0);
  return Math.max(1000, m.getTime() - Date.now());
}

export function SeasonalThemeProvider({ children }: { children: ReactNode }) {
  const [dayVersion, setDayVersion] = useState(0);
  const theme = useMemo(() => getActiveSeasonalTheme(), [dayVersion]);

  useEffect(() => {
    const root = document.documentElement;
    applySeasonalCssVars(root, theme);

    [...root.classList]
      .filter((c) => c.startsWith('seasonal-theme--'))
      .forEach((c) => root.classList.remove(c));
    root.classList.add(theme.cssClassName);
    root.setAttribute('data-seasonal-theme', theme.cssClassName);

    const id = window.setTimeout(() => setDayVersion((v) => v + 1), nextMidnightMs());

    return () => {
      window.clearTimeout(id);
      root.classList.remove(theme.cssClassName);
      root.removeAttribute('data-seasonal-theme');
      root.style.removeProperty('--seasonal-accent-primary');
      root.style.removeProperty('--seasonal-accent-secondary');
      root.style.removeProperty('--seasonal-accent-tertiary');
    };
  }, [theme]);

  return (
    <SeasonalThemeContext.Provider value={theme}>{children}</SeasonalThemeContext.Provider>
  );
}

export function useSeasonalThemeContext(): SeasonalTheme {
  const ctx = useContext(SeasonalThemeContext);
  if (!ctx) {
    throw new Error('useSeasonalThemeContext must be used within SeasonalThemeProvider');
  }
  return ctx;
}
