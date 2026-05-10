import { useCallback, useEffect, useState } from 'react';
import styles from './DailyQuotePopup.module.css';

const FREE_QUOTES = [
  'Aujourd’hui, un petit pas suffit 💖',
  'Ton corps écoute aussi la douceur que tu lui offres.',
  'Rien n’est urgent : avance à ton rythme, avec bienveillance.',
  'Chaque repas peut être un cocon, pas une performance.',
  'Tu n’as pas à être parfaite pour progresser.',
];

const PREMIUM_QUOTES = [
  'Ta journée mérite une présence douce — et tu la mérites aussi 💎',
  'Quand tu ralentis, ton corps trouve parfois le meilleur chemin.',
  'L’équilibre, ce n’est pas une ligne droite : c’est une courbe tendre.',
  'Ce que tu ressens compte autant que ce que tu manges.',
  'Offre-toi la permission d’être exactement là où tu es ✨',
  'Un petit rituel suffit parfois à transformer la journée.',
];

function randomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

type Props = {
  hasPremiumAccess: boolean;
};

export function DailyQuotePopup({ hasPremiumAccess }: Props) {
  const pool = hasPremiumAccess ? PREMIUM_QUOTES : FREE_QUOTES;
  const [visible, setVisible] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const pickFresh = useCallback(() => {
    setQuoteIndex(randomIndex(pool.length));
  }, [pool.length]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (!hasPremiumAccess) {
      const alreadySeen = window.localStorage.getItem(`quoteSeen:${today}`);
      if (alreadySeen) {
        setVisible(false);
        return;
      }
    }
    pickFresh();
    setVisible(true);
  }, [hasPremiumAccess, pickFresh]);

  const close = () => {
    if (!hasPremiumAccess) {
      const today = new Date().toISOString().slice(0, 10);
      window.localStorage.setItem(`quoteSeen:${today}`, 'true');
    }
    setVisible(false);
  };

  const anotherMessage = () => {
    if (!hasPremiumAccess) return;
    let next = randomIndex(PREMIUM_QUOTES.length);
    if (PREMIUM_QUOTES.length > 1) {
      while (next === quoteIndex) next = randomIndex(PREMIUM_QUOTES.length);
    }
    setQuoteIndex(next);
  };

  if (!visible) return null;

  const text = pool[quoteIndex % pool.length];

  return (
    <div className={styles.quoteOverlay}>
      <div className={styles.quotePopup}>
        <p>{text}</p>
        <div className={styles.quoteActions}>
          {hasPremiumAccess ? (
            <button type="button" className={styles.quoteSecondary} onClick={anotherMessage}>
              Encore un message ✨
            </button>
          ) : null}
          <button type="button" className={styles.quotePrimary} onClick={close}>
            Continuer
          </button>
        </div>
        {!hasPremiumAccess ? (
          <p className={styles.quoteHint}>Un coup de pouce par jour — Premium : messages illimités 💎</p>
        ) : null}
      </div>
    </div>
  );
}
