import { useMemo, type CSSProperties } from 'react';

type ThemeKey =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'valentine'
  | 'womensDay'
  | 'easter'
  | 'halloween'
  | 'christmas';

type Particle = {
  id: number;
  left: number;
  top?: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY?: number;
  opacity: number;
  rotateFrom: number;
  rotateTo: number;
  colorA: string;
  colorB?: string;
  type:
    | 'petal'
    | 'spark'
    | 'leaf'
    | 'snowflake'
    | 'heart'
    | 'confetti'
    | 'star'
    | 'moon';
};

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function isBetween(now: Date, start: Date, end: Date) {
  return now >= start && now <= end;
}

function getTheme(now = new Date()): ThemeKey {
  const year = now.getFullYear();

  const valentineStart = new Date(year, 1, 7, 0, 0, 0);
  const valentineEnd = new Date(year, 1, 14, 23, 59, 59);

  const womensDayStart = new Date(year, 2, 1, 0, 0, 0);
  const womensDayEnd = new Date(year, 2, 8, 23, 59, 59);

  const easter = getEasterDate(year);
  const easterStart = new Date(easter);
  easterStart.setDate(easter.getDate() - 6);
  easterStart.setHours(0, 0, 0, 0);

  const easterEnd = new Date(easter);
  easterEnd.setHours(23, 59, 59, 999);

  const halloweenStart = new Date(year, 9, 22, 0, 0, 0);
  const halloweenEnd = new Date(year, 9, 31, 23, 59, 59);

  const christmasStart = new Date(year, 11, 1, 0, 0, 0);
  const christmasEnd = new Date(year, 11, 25, 23, 59, 59);

  if (isBetween(now, valentineStart, valentineEnd)) return 'valentine';
  if (isBetween(now, womensDayStart, womensDayEnd)) return 'womensDay';
  if (isBetween(now, easterStart, easterEnd)) return 'easter';
  if (isBetween(now, halloweenStart, halloweenEnd)) return 'halloween';
  if (isBetween(now, christmasStart, christmasEnd)) return 'christmas';

  const springStart = new Date(year, 2, 20, 0, 0, 0);
  const summerStart = new Date(year, 5, 21, 0, 0, 0);
  const autumnStart = new Date(year, 8, 23, 0, 0, 0);
  const winterStart = new Date(year, 11, 21, 0, 0, 0);
  const winterEnd = new Date(year, 2, 19, 23, 59, 59);

  if (now >= springStart && now < summerStart) return 'spring';
  if (now >= summerStart && now < autumnStart) return 'summer';
  if (now >= autumnStart && now < winterStart) return 'autumn';
  if (now >= winterStart || now <= winterEnd) return 'winter';

  return 'spring';
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function createParticles(theme: ThemeKey): Particle[] {
  switch (theme) {
    case 'spring':
      return Array.from({ length: 12 }, (_, i) => ({
        id: i,
        type: 'petal' as const,
        left: random(0, 100),
        size: random(6, 14),
        duration: random(6, 10),
        delay: random(0, 8),
        driftX: random(-90, 90),
        opacity: random(0.4, 0.7),
        rotateFrom: random(-15, 0),
        rotateTo: random(0, 15),
        colorA: pick(['#FFF0F5', '#F2A7B0']),
        colorB: pick(['#FFF0F5', '#F8C8D3']),
      }));

    case 'summer':
      return Array.from({ length: 15 }, (_, i) => ({
        id: i,
        type: 'spark' as const,
        left: random(0, 100),
        top: random(20, 95),
        size: random(2, 5),
        duration: random(5, 9),
        delay: random(0, 6),
        driftX: random(-40, 40),
        driftY: random(-120, -40),
        opacity: random(0.25, 0.8),
        rotateFrom: 0,
        rotateTo: 0,
        colorA: pick(['#F9E07A', '#C8A44A']),
      }));

    case 'autumn':
      return Array.from({ length: 8 }, (_, i) => ({
        id: i,
        type: 'leaf' as const,
        left: random(0, 100),
        size: random(10, 20),
        duration: random(5, 9),
        delay: random(0, 7),
        driftX: random(-120, 120),
        opacity: random(0.45, 0.75),
        rotateFrom: 0,
        rotateTo: 360,
        colorA: pick(['#C8A44A', '#D4845A', '#8B4513']),
        colorB: pick(['#D4845A', '#C8A44A', '#B76A43']),
      }));

    case 'winter':
      return Array.from({ length: 15 }, (_, i) => ({
        id: i,
        type: 'snowflake' as const,
        left: random(0, 100),
        size: random(6, 16),
        duration: random(7, 12),
        delay: random(0, 8),
        driftX: random(-25, 25),
        opacity: random(0.5, 0.8),
        rotateFrom: 0,
        rotateTo: 360,
        colorA: pick(['#FFFFFF', '#D4E8F0']),
      }));

    case 'valentine':
      return Array.from({ length: 6 }, (_, i) => ({
        id: i,
        type: 'heart' as const,
        left: random(10, 90),
        size: random(8, 14),
        duration: random(7, 11),
        delay: random(0, 5),
        driftX: random(-40, 40),
        opacity: random(0.45, 0.8),
        rotateFrom: random(-10, 0),
        rotateTo: random(0, 10),
        colorA: pick(['#F2A7B0', '#E8758A']),
      }));

    case 'womensDay':
      return Array.from({ length: 12 }, (_, i) => ({
        id: i,
        type: 'spark' as const,
        left: random(35, 65),
        top: random(35, 65),
        size: random(3, 7),
        duration: random(4, 7),
        delay: random(0, 3),
        driftX: random(-160, 160),
        driftY: random(-120, 120),
        opacity: random(0.35, 0.8),
        rotateFrom: 0,
        rotateTo: 0,
        colorA: pick(['#C8A44A', '#F2A7B0']),
      }));

    case 'easter':
      return Array.from({ length: 10 }, (_, i) => ({
        id: i,
        type: 'confetti' as const,
        left: random(0, 100),
        size: random(7, 13),
        duration: random(6, 10),
        delay: random(0, 6),
        driftX: random(-70, 70),
        opacity: random(0.45, 0.8),
        rotateFrom: random(0, 45),
        rotateTo: random(180, 360),
        colorA: pick(['#F2A7B0', '#F9E07A', '#BFD8C2', '#CFE3F6']),
      }));

    case 'halloween':
      return Array.from({ length: 8 }, (_, i) => ({
        id: i,
        type: (Math.random() > 0.5 ? 'star' : 'moon') as 'star' | 'moon',
        left: random(0, 100),
        top: random(10, 80),
        size: random(8, 16),
        duration: random(6, 10),
        delay: random(0, 6),
        driftX: random(-80, 80),
        driftY: random(-20, 20),
        opacity: random(0.25, 0.55),
        rotateFrom: random(-20, 0),
        rotateTo: random(0, 20),
        colorA: pick(['#8B4513', '#D4845A']),
      }));

    case 'christmas':
      return Array.from({ length: 20 }, (_, i) => ({
        id: i,
        type: (Math.random() > 0.7 ? 'star' : 'snowflake') as 'star' | 'snowflake',
        left: random(0, 100),
        size: random(6, 14),
        duration: random(5, 10),
        delay: random(0, 7),
        driftX: random(-35, 35),
        opacity: random(0.45, 0.85),
        rotateFrom: 0,
        rotateTo: 360,
        colorA: Math.random() > 0.7 ? '#C8A44A' : pick(['#FFFFFF', '#D4E8F0']),
      }));

    default:
      return [];
  }
}

function Petal({ colorA, colorB = '#FFF0F5' }: { colorA: string; colorB?: string }) {
  const gid = `petal-${colorA.replace('#', '')}-${colorB.replace('#', '')}`;
  return (
    <svg viewBox="0 0 20 28" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
      </defs>
      <path
        d="M10 1 C15 3, 19 10, 16 18 C13 25, 7 28, 4 20 C1 13, 4 5, 10 1 Z"
        fill={`url(#${gid})`}
      />
    </svg>
  );
}

function Leaf({ colorA, colorB = '#D4845A' }: { colorA: string; colorB?: string }) {
  const gid = `leaf-${colorA.replace('#', '')}-${colorB.replace('#', '')}`;
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colorA} />
          <stop offset="100%" stopColor={colorB} />
        </linearGradient>
      </defs>
      <path
        d="M28 4 C18 5, 8 10, 5 20 C3 26, 8 29, 13 27 C22 23, 27 14, 28 4 Z"
        fill={`url(#${gid})`}
      />
      <path
        d="M9 24 C13 19, 18 15, 25 9"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

function Snowflake({ colorA }: { colorA: string }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <g stroke={colorA} strokeWidth="1.4" strokeLinecap="round" opacity="0.95">
        <path d="M12 2 V22" />
        <path d="M2 12 H22" />
        <path d="M5 5 L19 19" />
        <path d="M19 5 L5 19" />
        <path d="M12 2 L10 5" />
        <path d="M12 2 L14 5" />
        <path d="M12 22 L10 19" />
        <path d="M12 22 L14 19" />
      </g>
    </svg>
  );
}

function Heart({ colorA }: { colorA: string }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path
        d="M12 21.35 L10.55 20.03 C5.4 15.36 2 12.28 2 8.5 C2 5.42 4.42 3 7.5 3 C9.24 3 10.91 3.81 12 5.09 C13.09 3.81 14.76 3 16.5 3 C19.58 3 22 5.42 22 8.5 C22 12.28 18.6 15.36 13.45 20.04 L12 21.35 Z"
        fill={colorA}
      />
    </svg>
  );
}

function Star({ colorA }: { colorA: string }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path
        d="M12 2 L14.7 8.2 L21.5 8.7 L16.3 13.1 L18 20 L12 16.4 L6 20 L7.7 13.1 L2.5 8.7 L9.3 8.2 Z"
        fill={colorA}
      />
    </svg>
  );
}

function Moon({ colorA }: { colorA: string }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path
        d="M16.8 2.8 C14 3.6 12 6.2 12 9.3 C12 13.1 15.1 16.2 18.9 16.2 C19.8 16.2 20.7 16.1 21.4 15.7 C20.2 19.2 17 21.7 13.1 21.7 C8.2 21.7 4.3 17.8 4.3 12.9 C4.3 8.3 7.8 4.6 12.3 4.2 C13.9 4.1 15.5 4.2 16.8 2.8 Z"
        fill={colorA}
      />
    </svg>
  );
}

function Confetti({ colorA }: { colorA: string }) {
  return (
    <svg viewBox="0 0 20 28" width="100%" height="100%" aria-hidden="true">
      <rect x="4" y="4" width="12" height="20" rx="6" fill={colorA} />
    </svg>
  );
}

function Spark({ colorA }: { colorA: string }) {
  return (
    <span
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        borderRadius: '999px',
        background: colorA,
        boxShadow: `0 0 10px ${colorA}, 0 0 18px ${colorA}`,
      }}
    />
  );
}

function ParticleShape({ particle }: { particle: Particle }) {
  switch (particle.type) {
    case 'petal':
      return <Petal colorA={particle.colorA} colorB={particle.colorB} />;
    case 'leaf':
      return <Leaf colorA={particle.colorA} colorB={particle.colorB} />;
    case 'snowflake':
      return <Snowflake colorA={particle.colorA} />;
    case 'heart':
      return <Heart colorA={particle.colorA} />;
    case 'star':
      return <Star colorA={particle.colorA} />;
    case 'moon':
      return <Moon colorA={particle.colorA} />;
    case 'confetti':
      return <Confetti colorA={particle.colorA} />;
    case 'spark':
      return <Spark colorA={particle.colorA} />;
    default:
      return null;
  }
}

export default function SeasonalAnimation() {
  const theme = useMemo(() => getTheme(new Date()), []);
  const particles = useMemo(() => createParticles(theme), [theme]);

  return (
    <>
      <style>{`
        .em-seasonal-layer {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }

        .em-seasonal-item {
          position: absolute;
          will-change: transform, opacity;
          transform: translate3d(0,0,0);
          backface-visibility: hidden;
        }

        .em-fall {
          top: -8vh;
          animation-name: emFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .em-rise {
          bottom: -8vh;
          animation-name: emRise;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .em-float {
          animation-name: emFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .em-burst {
          animation-name: emBurst;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
        }

        @keyframes emFall {
          0% {
            transform: translate3d(0, -8vh, 0) rotate(var(--rotate-from, 0deg));
            opacity: 0;
          }
          10% {
            opacity: var(--opacity, 0.5);
          }
          25% {
            transform: translate3d(calc(var(--drift-x, 0px) * 0.35), 25vh, 0) rotate(calc(var(--rotate-from, 0deg) + 8deg));
          }
          50% {
            transform: translate3d(calc(var(--drift-x, 0px) * 0.65), 52vh, 0) rotate(calc((var(--rotate-from, 0deg) + var(--rotate-to, 0deg)) / 2));
          }
          75% {
            transform: translate3d(calc(var(--drift-x, 0px) * 0.9), 78vh, 0) rotate(calc(var(--rotate-to, 0deg) - 6deg));
          }
          100% {
            transform: translate3d(var(--drift-x, 0px), 112vh, 0) rotate(var(--rotate-to, 0deg));
            opacity: 0;
          }
        }

        @keyframes emRise {
          0% {
            transform: translate3d(0, 0, 0) rotate(var(--rotate-from, 0deg));
            opacity: 0;
          }
          15% {
            opacity: var(--opacity, 0.5);
          }
          50% {
            transform: translate3d(calc(var(--drift-x, 0px) * 0.6), -45vh, 0) rotate(calc((var(--rotate-from, 0deg) + var(--rotate-to, 0deg)) / 2));
          }
          100% {
            transform: translate3d(var(--drift-x, 0px), -110vh, 0) rotate(var(--rotate-to, 0deg));
            opacity: 0;
          }
        }

        @keyframes emFloat {
          0% {
            transform: translate3d(0, 0, 0) rotate(var(--rotate-from, 0deg)) scale(0.92);
            opacity: 0;
          }
          20% {
            opacity: var(--opacity, 0.45);
          }
          50% {
            transform: translate3d(var(--drift-x, 0px), var(--drift-y, 0px), 0) rotate(calc(var(--rotate-to, 0deg) * 0.5)) scale(1);
            opacity: var(--opacity, 0.45);
          }
          100% {
            transform: translate3d(calc(var(--drift-x, 0px) * -0.65), calc(var(--drift-y, 0px) * -0.35), 0) rotate(var(--rotate-to, 0deg)) scale(0.94);
            opacity: 0;
          }
        }

        @keyframes emBurst {
          0% {
            transform: translate3d(0, 0, 0) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: var(--opacity, 0.55);
          }
          100% {
            transform: translate3d(var(--drift-x, 0px), var(--drift-y, 0px), 0) scale(1);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .em-seasonal-layer {
            z-index: 1;
          }
        }
      `}</style>

      <div className="em-seasonal-layer" aria-hidden="true">
        {particles.map((particle) => {
          const animationClass =
            theme === 'summer' || theme === 'halloween'
              ? 'em-float'
              : theme === 'valentine'
                ? 'em-rise'
                : theme === 'womensDay'
                  ? 'em-burst'
                  : 'em-fall';

          return (
            <div
              key={particle.id}
              className={`em-seasonal-item ${animationClass}`}
              style={
                {
                  left: `${particle.left}%`,
                  top: particle.top !== undefined ? `${particle.top}%` : undefined,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  opacity: particle.opacity,
                  animationDuration: `${particle.duration}s`,
                  animationDelay: `${particle.delay}s`,
                  '--drift-x': `${particle.driftX}px`,
                  '--drift-y': `${particle.driftY ?? 0}px`,
                  '--rotate-from': `${particle.rotateFrom}deg`,
                  '--rotate-to': `${particle.rotateTo}deg`,
                  '--opacity': String(particle.opacity),
                } as CSSProperties
              }
            >
              <ParticleShape particle={particle} />
            </div>
          );
        })}
      </div>
    </>
  );
}
