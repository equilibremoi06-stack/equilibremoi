import { useMemo } from 'react';
import {
  CORRELATION_SPOTLIGHTS,
  getCorrelationHighlights,
  getEncouragementLine,
  getMicroWinLine,
  getSeasonalWhisper,
  getWeeklyPrimaryInsight,
} from '../../lib/premiumLivingContent';
import styles from './PremiumLivingPanel.module.css';

type Props = {
  userId?: string | null;
};

export function PremiumLivingPanel({ userId }: Props) {
  const now = useMemo(() => new Date(), []);
  const primary = useMemo(() => getWeeklyPrimaryInsight(now, userId), [now, userId]);
  const seasonal = useMemo(() => getSeasonalWhisper(now, userId), [now, userId]);
  const micro = useMemo(() => getMicroWinLine(now, userId), [now, userId]);
  const encourage = useMemo(() => getEncouragementLine(now, userId), [now, userId]);
  const correlations = useMemo(() => getCorrelationHighlights(now, userId, 3), [now, userId]);
  const dayKeys = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] as const;
  const dow = (now.getDay() + 6) % 7;

  return (
    <div className={styles.wrap}>
      <p className={styles.kicker}>Aujourd’hui avec toi</p>
      <div className={styles.cardGrid}>
        {dayKeys.map((k, i) => (
          <div
            key={k}
            className={`${styles.miniCard} ${i === dow ? styles.miniCardActive : ''}`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <span className={styles.miniDay}>{k}</span>
            <span className={styles.miniHint}>{i === dow ? 'focus' : '…'}</span>
          </div>
        ))}
      </div>

      <div className={styles.pulseRow}>
        <article className={`${styles.featureCard} ${styles.stagger1}`}>
          <p className={styles.featureLabel}>Ce que l’IA observe cette semaine</p>
          <p className={styles.featureText}>{primary}</p>
        </article>
        <article className={`${styles.featureCard} ${styles.stagger2}`}>
          <p className={styles.featureLabel}>Message saisonnier</p>
          <p className={styles.featureText}>{seasonal}</p>
        </article>
        <article className={`${styles.featureCard} ${styles.stagger3}`}>
          <p className={styles.featureLabel}>Micro-retour</p>
          <p className={styles.featureText}>{micro}</p>
        </article>
      </div>

      <div className={styles.encourageBand}>
        <span className={styles.spark} aria-hidden>
          ✨
        </span>
        <p>{encourage}</p>
      </div>

      <div className={styles.iaBlock}>
        <p className={styles.iaKicker}>Corrélations douces — ton profil IA</p>
        <p className={styles.iaIntro}>
          Ce ne sont pas des règles : des pistes générées pour donner l’impression que l’app te comprend — sans
          jugement.
        </p>
        <ul className={styles.iaList}>
          {correlations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className={styles.iaPoolNote}>Bibliothèque : +{CORRELATION_SPOTLIGHTS.length} motifs bienveillants…</p>
      </div>
    </div>
  );
}
