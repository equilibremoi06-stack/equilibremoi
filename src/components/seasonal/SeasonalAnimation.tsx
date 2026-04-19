import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import styles from './SeasonalAnimation.module.css';

const PETAL_COUNT = 8;

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function SeasonalAnimation() {
  const petals = useMemo(
    () =>
      Array.from({ length: PETAL_COUNT }, (_, i) => ({
        id: i,
        left: random(4, 92),
        delay: random(0, 4.5),
        drift: random(-14, 14),
      })),
    []
  );

  return (
    <div className={styles.layer} aria-hidden>
      {petals.map((p) => (
        <div
          key={p.id}
          className={styles.petal}
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
