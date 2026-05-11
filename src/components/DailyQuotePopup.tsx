import { useEffect, useState } from 'react';
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

const STORAGE_KEY = 'equilibremoi.dailyQuote.v1';
const DISPLAYED_KEY = 'equilibremoi.dailyQuoteDisplayed.v1';

type StoredQuote = { d: string; t: 'free' | 'premium'; q: string };
type DisplayedFlag = { date: string; displayed: boolean };

function localCalendarYmd(): string {
  const x = new Date();
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function randomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

function loadStoredQuote(tier: 'free' | 'premium'): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as StoredQuote;
    if (o.d === localCalendarYmd() && o.t === tier && typeof o.q === 'string' && o.q.length > 0) {
      return o.q;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveStoredQuote(tier: 'free' | 'premium', quote: string) {
  const payload: StoredQuote = { d: localCalendarYmd(), t: tier, q: quote };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadDisplayedFlag(): DisplayedFlag | null {
  try {
    const raw = window.localStorage.getItem(DISPLAYED_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as DisplayedFlag;
    if (typeof o.date === 'string' && typeof o.displayed === 'boolean') {
      return { date: o.date, displayed: o.displayed };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveDisplayedFlag() {
  const payload: DisplayedFlag = { date: localCalendarYmd(), displayed: true };
  window.localStorage.setItem(DISPLAYED_KEY, JSON.stringify(payload));
}

/** Popup plein écran : une fois par jour max (tant que displayed n’a pas été posé pour aujourd’hui). */
function shouldOpenPopupOverlay(): boolean {
  const today = localCalendarYmd();
  const row = loadDisplayedFlag();
  if (!row || row.date !== today) return true;
  return row.displayed !== true;
}

type Props = {
  hasPremiumAccess: boolean;
};

export function DailyQuotePopup({ hasPremiumAccess }: Props) {
  const tier: 'free' | 'premium' = hasPremiumAccess ? 'premium' : 'free';
  const [quoteText, setQuoteText] = useState<string>('');
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    const pool = hasPremiumAccess ? PREMIUM_QUOTES : FREE_QUOTES;
    let text = loadStoredQuote(tier);
    if (!text) {
      text = pool[randomIndex(pool.length)];
      saveStoredQuote(tier, text);
    }
    setQuoteText(text);

    if (shouldOpenPopupOverlay()) {
      setOverlayOpen(true);
      saveDisplayedFlag();
    } else {
      setOverlayOpen(false);
    }
  }, [hasPremiumAccess, tier]);

  const closeOverlay = () => {
    setOverlayOpen(false);
  };

  /* Rien sur l’accueil hors la popup ponctuelle : pas de bandeau / carte / message fixe. */
  if (!overlayOpen || !quoteText) return null;

  return (
    <div className={styles.quoteOverlay}>
      <div className={styles.quotePopup}>
        <p>{quoteText}</p>
        <div className={styles.quoteActions}>
          <button type="button" className={styles.quotePrimary} onClick={closeOverlay}>
            Continuer
          </button>
        </div>
        {!hasPremiumAccess ? (
          <p className={styles.quoteHint}>Un coup de pouce par jour — Premium : bibliothèque de messages élargie 💎</p>
        ) : (
          <p className={styles.quoteHint}>Un message choisi pour toi aujourd’hui — demain, une nouvelle phrase douce ✨</p>
        )}
      </div>
    </div>
  );
}
