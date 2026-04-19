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
          <p className={styles.kicker}>Ton rythme, ton corps</p>
          <h1 className={styles.title}>
            L’accompagnement alimentaire
            <br />
            qui te ressemble
          </h1>
          <div className={styles.decorLine} aria-hidden />
        </div>
        <p className={styles.subtitle}>
          Une approche douce, pensée pour les femmes : choisis le parcours qui
          correspond à ton moment de vie. Bien-être uniquement — jamais un substitut
          à un suivi médical.
        </p>
      </section>

      <div className={styles.sensitiveBanner}>
        <SensitiveProfileBanner />
      </div>

      <section className={styles.cards}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>Équilibre au quotidien</h2>
          <p className={styles.cardLead}>
            Des repas qui s’adaptent à ta vie, sans culpabiliser. Simple, fluide,
            à ton tempo.
          </p>
          <ul className={styles.list}>
            <li>Menus qui suivent ton humeur</li>
            <li>Petites victoires célébrées</li>
            <li>Zéro pression, tout en douceur</li>
          </ul>
          <button type="button" className={styles.button} onClick={handleClassique}>
            Choisir ce parcours
          </button>
        </article>

        <article className={`${styles.card} ${styles.cardHighlight}`}>
          <span className={styles.badge}>Si cette étape te parle</span>
          <h2 className={styles.cardTitle}>Parcours Ménopause</h2>
          <p className={styles.cardLead}>
            Un cadre rassurant pour les changements du corps : confort, clarté et
            bienveillance au quotidien.
          </p>
          <ul className={styles.list}>
            <li>Conseils adaptés à cette période</li>
            <li>Ton protecteur, jamais culpabilisant</li>
            <li>Aller-retour possible avec ton médecin</li>
          </ul>
          <button type="button" className={styles.buttonPrimary} onClick={handleMenopause}>
            Choisir ce parcours
          </button>
        </article>
      </section>

      <aside className={styles.legalNote}>
        <span className={styles.legalIcon} aria-hidden>
          ✦
        </span>
        <div className={styles.legalBody}>
          <span className={styles.legalTitle}>Note bien-être</span>
          <p>
            ÉquilibreMoi t’accompagne dans une démarche de bien-être. Elle ne remplace
            pas un professionnel de santé. Les contenus sont généraux ; en cas de
            pathologie, traitement ou doute, parle-en à ton médecin ou à un spécialiste.
          </p>
        </div>
      </aside>
    </div>
  );
}
