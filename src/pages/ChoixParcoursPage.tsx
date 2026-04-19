import { useNavigate } from 'react-router-dom';
import { SensitiveProfileBanner } from '../components/medical/SensitiveProfileBanner';
import { SeasonalProfileBadge } from '../components/seasonal/SeasonalProfileBadge';
import { useSeasonalThemeContext } from '../hooks/useSeasonalTheme';
import styles from './ChoixParcoursPage.module.css';

export default function ChoixParcoursPage() {
  const navigate = useNavigate();
  const theme = useSeasonalThemeContext();

  const handleClassique = () => {
    localStorage.setItem('parcours', 'classique');
    navigate('/questionnaire-classique');
  };

  const handleMenopause = () => {
    localStorage.setItem('parcours', 'menopause');
    navigate('/questionnaire-menopause');
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroHead}>
          {theme.showProfileBadge ? (
            <div className={styles.heroBadge}>
              <SeasonalProfileBadge theme={theme} />
            </div>
          ) : null}
          <h1>Un accompagnement pensé pour toi, vraiment.</h1>
        </div>
        <p>
          Chaque femme a un rythme, un corps et des besoins différents. Choisis le
          parcours qui correspond à ton moment de vie.
        </p>
      </section>

      <div className={styles.sensitiveBanner}>
        <SensitiveProfileBanner />
      </div>

      <section className={styles.cards}>
        <article className={styles.card}>
          <h2>Équilibre au quotidien 🌿</h2>
          <p>
            Retrouve un équilibre alimentaire simple, sans pression ni restriction,
            avec des menus adaptés à ton rythme et ton quotidien.
          </p>
          <ul className={styles.list}>
            <li>Menus personnalisés</li>
            <li>Accompagnement émotionnel</li>
            <li>Flexibilité totale</li>
            <li>Approche douce et réaliste</li>
          </ul>
          <button type="button" className={styles.button} onClick={handleClassique}>
            Je choisis ce parcours
          </button>
        </article>

        <article className={`${styles.card} ${styles.cardHighlight}`}>
          <span className={styles.badge}>Recommandé si concernée</span>
          <h2>Parcours Ménopause 🌸</h2>
          <p>
            Un accompagnement spécifique pour mieux vivre les changements hormonaux,
            retrouver ton énergie et apaiser ton quotidien.
          </p>
          <ul className={styles.list}>
            <li>Menus adaptés à cette période</li>
            <li>Gestion des fringales &amp; fatigue</li>
            <li>Conseils doux et ciblés</li>
            <li>Approche rassurante et sans culpabilité</li>
          </ul>
          <button type="button" className={styles.button} onClick={handleMenopause}>
            Je choisis ce parcours
          </button>
        </article>
      </section>

      <section className={styles.warning}>
        <strong>Important 💛</strong>
        <div>
          ÉquilibreMoi est une application de bien-être et d&apos;accompagnement.
          Elle ne remplace pas un professionnel de santé, un médecin ou un suivi
          médical. Les conseils proposés sont généraux et doivent être adaptés à la
          situation personnelle de chaque utilisatrice. En cas de doute, de
          pathologie, ou de besoin spécifique, il est recommandé de consulter un
          professionnel de santé.
        </div>
      </section>
    </div>
  );
}
