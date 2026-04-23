import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Bien-être &amp; alimentation</p>
        <h1 className={styles.heroTitle}>
          Un accompagnement pensé pour toi, vraiment ❤️
        </h1>
        <p className={styles.heroSub}>
          Retrouve un équilibre alimentaire doux, sans pression, adapté à ton corps et
          à ton rythme.
        </p>
        <div className={styles.heroDivider} aria-hidden />
        <p className={styles.heroHuman}>
          Je suis là pour t’accompagner, vraiment, à ton rythme ✨
        </p>
        <p className={styles.heroLandingLink}>
          <Link to="/auth">Je commence ✨</Link>
        </p>
      </section>

      <section className={styles.promise} aria-labelledby="promise-heading">
        <h2 id="promise-heading" className={styles.promiseHeading}>
          Ce qui nous ressemble
        </h2>
        <p className={styles.promiseIntro}>
          Trois engagements simples, pour un quotidien plus serein.
        </p>
        <ul className={styles.promiseGrid}>
          <li className={styles.promiseCard}>
            <span className={styles.promiseAccent} aria-hidden>
              ◆
            </span>
            <span className={styles.promiseTitle}>Sans restriction</span>
            <span className={styles.promiseText}>
              Des repas qui respirent, pas de liste de défense.
            </span>
          </li>
          <li className={styles.promiseCard}>
            <span className={styles.promiseAccent} aria-hidden>
              ◆
            </span>
            <span className={styles.promiseTitle}>Approche bienveillante</span>
            <span className={styles.promiseText}>
              On avance avec douceur, à ton tempo.
            </span>
          </li>
          <li className={styles.promiseCard}>
            <span className={styles.promiseAccent} aria-hidden>
              ◆
            </span>
            <span className={styles.promiseTitle}>Adapté à ton rythme</span>
            <span className={styles.promiseText}>
              Des idées qui s’alignent sur ta vie réelle.
            </span>
          </li>
        </ul>
      </section>

      <section className={styles.parcours} aria-labelledby="parcours-heading">
        <h2 id="parcours-heading" className={styles.sectionTitle}>
          Deux parcours pour te ressembler ❤️
        </h2>
        <p className={styles.sectionSubtitle}>Choisis ce qui te correspond, à ton rythme ✨</p>
        <h3 className={styles.howTitle}>Comment ça marche ? ✨</h3>
        <p className={styles.sectionLead}>
          Choisis ton parcours ci-dessous pour commencer le questionnaire — tu pourras
          ajuster plus tard.
        </p>
        <div className={styles.parcoursGrid}>
          <Link
            className={styles.parcoursCard}
            to="/auth"
            onClick={() => localStorage.setItem('parcours', 'classique')}
            aria-label="Équilibre au quotidien — voir les offres"
          >
            <span className={styles.parcoursBadge}>Pour tous les jours</span>
            <h3 className={styles.parcoursName}>Équilibre au quotidien</h3>
            <p className={styles.parcoursDesc}>
              Des repères simples pour retrouver un équilibre alimentaire, sans
              pression, adaptés à ta vraie vie.
            </p>
            <ul className={styles.parcoursBullets}>
              <li>Des repas simples, rassurants et faciles à suivre</li>
              <li>Plus de liberté, moins de règles strictes</li>
              <li>Retrouver du plaisir sans culpabiliser</li>
            </ul>
            <span className={styles.cardCta}>Voir les offres →</span>
          </Link>
          <Link
            className={`${styles.parcoursCard} ${styles.parcoursCardHighlight}`}
            to="/auth"
            onClick={() => localStorage.setItem('parcours', 'menopause')}
            aria-label="Parcours ménopause — voir les offres"
          >
            <span className={styles.parcoursBadge}>Spécial ménopause</span>
            <h3 className={styles.parcoursName}>Parcours ménopause</h3>
            <p className={styles.parcoursDesc}>
              Un accompagnement pensé pour cette étape de ta vie, avec douceur,
              compréhension et sans pression.
            </p>
            <ul className={styles.parcoursBullets}>
              <li>Des conseils adaptés à ton corps aujourd’hui</li>
              <li>Une approche douce, rassurante et sans pression</li>
              <li>Retrouver ton équilibre sans te brusquer</li>
            </ul>
            <span className={styles.cardCta}>Voir les offres →</span>
          </Link>
        </div>
      </section>

      <p className={styles.safety}>
        ÉquilibreMoi est une application de bien-être. Elle ne remplace pas un
        professionnel de santé.
      </p>

      <section className={styles.closing} aria-label="Conclusion">
        <p className={styles.closingText}>
          L’essentiel, c’est d’avancer à ton rythme — avec douceur, clarté et confiance
          en toi.
        </p>
      </section>
      <p className={styles.footerEmotion}>❤️ Sans pression. Sans jugement. Juste pour toi.</p>
    </div>
  );
}
