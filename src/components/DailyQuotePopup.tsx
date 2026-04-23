import { useEffect, useState } from 'react';
import styles from './DailyQuotePopup.module.css';

export function DailyQuotePopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadySeen = localStorage.getItem('quoteSeen');
    if (!alreadySeen) {
      setVisible(true);
      localStorage.setItem('quoteSeen', 'true');
    }
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.quoteOverlay}>
      <div className={styles.quotePopup}>
        <p>✨ Aujourd’hui, un petit pas suffit 💖</p>
        <button type="button" onClick={() => setVisible(false)}>
          Continuer
        </button>
      </div>
    </div>
  );
}
