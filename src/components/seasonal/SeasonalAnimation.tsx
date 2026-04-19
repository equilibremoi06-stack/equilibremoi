import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import styles from './SeasonalAnimation.module.css';

const SPRING_COLORS = ['#f2a7b0', '#f6c3cb', '#f9d7de'] as const;
const MAX_PETALS = 10;

type PetalConfig = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  drift: number;
  rotStart: number;
  rotEnd: number;
  colorA: string;
  colorB: string;
};

function isSpring(now = new Date()): boolean {
  const y = now.getFullYear();
  const start = new Date(y, 2, 20, 0, 0, 0);
  const end = new Date(y, 5, 20, 23, 59, 59);
  return now >= start && now <= end;
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createSpringPetals(): PetalConfig[] {
  return Array.from({ length: MAX_PETALS }, (_, i) => ({
    id: i,
    left: random(2, 92),
    delay: random(0, 4),
    duration: random(7, 11),
    size: random(10, 16),
    opacity: random(0.65, 0.9),
    drift: random(-36, 36),
    rotStart: random(-10, -4),
    rotEnd: random(4, 12),
    colorA: SPRING_COLORS[i % 3],
    colorB: SPRING_COLORS[(i + 1) % 3],
  }));
}

export default function SeasonalAnimation() {
  const active = useMemo(() => isSpring(), []);
  const petals = useMemo(() => (active ? createSpringPetals() : []), [active]);

  if (!active) {
    return null;
  }

  return (
    <div className={styles.layer} aria-hidden>
      {petals.map((p) => (
        <div
          key={p.id}
          className={styles.petal}
          style={
            {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.12}px`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--rot-start': `${p.rotStart}deg`,
              '--rot-end': `${p.rotEnd}deg`,
              background: `linear-gradient(152deg, ${p.colorA} 0%, ${p.colorB} 100%)`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
