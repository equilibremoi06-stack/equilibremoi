import { useNavigate } from 'react-router-dom';
import styles from './PremiumPage.module.css';

export default function PremiumPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.premiumPage}>
      <button type="button" className={styles.backButton} onClick={() => navigate('/app')}>
        ← Retour à mon programme
      </button>
      <h1>✨ Passe au Premium</h1>

      <p>
        Ton programme peut aller encore plus loin.
        Plus simple, plus personnalisé… et vraiment adapté à toi 💖
      </p>

      <div className={styles.premiumCard}>
        <h2>Gratuit</h2>
        <ul>
          <li>Menus limités</li>
          <li>Recettes limitées</li>
          <li>Pas de suivi avancé</li>
        </ul>
      </div>

      <div className={`${styles.premiumCard} ${styles.highlight}`}>
        <h2>Premium 💖</h2>
        <ul>
          <li>Menus complets sur plusieurs semaines</li>
          <li>Liste de courses intelligente</li>
          <li>Suivi complet + progression</li>
          <li>Recettes détaillées avec quantités</li>
          <li>Accompagnement personnalisé</li>
        </ul>
      </div>

      <button type="button" className={styles.premiumBtn} onClick={() => navigate('/app')}>
        Je débloque mon programme ✨
      </button>

      <p className={styles.premiumNote}>
        Tu avances déjà… le Premium est juste là pour t’aider encore plus 💖
      </p>
    </div>
  );
}
