import { useMemo, type CSSProperties } from 'react';
import styles from './SeasonalAnimation.module.css';

export type ThemeAnimation =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'valentine'
  | 'halloween'
  | 'christmas';

type Particle = {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  variant: number;
};

function isBetween(now: Date, start: Date, end: Date) {
  return now >= start && now <= end;
}

export function getCurrentAnimationTheme(date = new Date()): ThemeAnimation {
  const year = date.getFullYear();

  const valentinesStart = new Date(year, 1, 7);
  const valentinesEnd = new Date(year, 1, 14, 23, 59, 59);

  const halloweenStart = new Date(year, 9, 22);
  const halloweenEnd = new Date(year, 9, 31, 23, 59, 59);

  const christmasStart = new Date(year, 11, 1);
  const christmasEnd = new Date(year, 11, 25, 23, 59, 59);

  if (isBetween(date, valentinesStart, valentinesEnd)) return 'valentine';
  if (isBetween(date, halloweenStart, halloweenEnd)) return 'halloween';
  if (isBetween(date, christmasStart, christmasEnd)) return 'christmas';

  const springStart = new Date(year, 2, 20);
  const summerStart = new Date(year, 5, 21);
  const autumnStart = new Date(year, 8, 23);
  const winterStart = new Date(year, 11, 21);
  const winterEnd = new Date(year, 2, 19, 23, 59, 59);

  if (date >= springStart && date < summerStart) return 'spring';
  if (date >= summerStart && date < autumnStart) return 'summer';
  if (date >= autumnStart && date < winterStart) return 'autumn';
  if (date >= winterStart || date <= winterEnd) return 'winter';

  return 'spring';
}

function createParticles(theme: ThemeAnimation): Particle[] {
  const counts: Record<ThemeAnimation, number> = {
    spring: 9,
    summer: 9,
    autumn: 8,
    winter: 12,
    valentine: 6,
    halloween: 6,
    christmas: 16,
  };

  const count = counts[theme];

  return Array.from({ length: count }, (_, index) => {
    let size: number;
    let duration: number;
    let delay: number;
    const drift = (Math.random() - 0.5) * 80;

    if (theme === 'spring') {
      size = 10 + Math.random() * 4;
      duration = 20 + Math.random() * 12;
      delay = Math.random() * 2;
    } else if (theme === 'winter' || theme === 'christmas') {
      size = 4 + Math.random() * 5;
      duration =
        theme === 'christmas' ? 11 + Math.random() * 8 : 12 + Math.random() * 8;
      delay = Math.random() * 4;
    } else if (theme === 'summer') {
      size = 6 + Math.random() * 8;
      duration = 4 + Math.random() * 4;
      delay = Math.random() * 4;
    } else if (theme === 'valentine') {
      size = 10 + Math.random() * 4;
      duration = 7 + Math.random() * 4;
      delay = Math.random() * 3;
    } else {
      size = 8 + Math.random() * 8;
      duration =
        theme === 'halloween' ? 8 + Math.random() * 6 : 9 + Math.random() * 6;
      delay = Math.random() * 5;
    }

    return {
      id: index,
      left: Math.random() * 100,
      size,
      duration,
      delay,
      drift,
      variant: Math.floor(Math.random() * 3),
    };
  });
}

const themeClassMap: Record<ThemeAnimation, keyof typeof styles> = {
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
  winter: 'winter',
  valentine: 'valentine',
  halloween: 'halloween',
  christmas: 'christmas',
};

const variantClassMap = {
  0: styles.variant0,
  1: styles.variant1,
  2: styles.variant2,
} as const;

export default function SeasonalAnimation() {
  const theme = useMemo(() => getCurrentAnimationTheme(), []);
  const particles = useMemo(() => createParticles(theme), [theme]);

  const themeClass = styles[themeClassMap[theme]];

  return (
    <div
      className={`${styles.layer} ${themeClass}`}
      aria-hidden
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={`${styles.particle} ${variantClassMap[particle.variant as 0 | 1 | 2]}`}
          style={
            {
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              '--drift': `${particle.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
