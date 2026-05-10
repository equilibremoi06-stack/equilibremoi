import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const chooseParcoursPath = '/choix-parcours';

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const scrollToPrograms = () => {
    navigate(chooseParcoursPath);
  };

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealVisible);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
    );

    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={pageRef} className={`${styles.page} ${styles.landingReferencePage}`}>
      <section className={styles.landingHero} aria-labelledby="landing-hero-title">
        <h1 id="landing-hero-title" className={styles.heroTitlePremiumUnique}>
          Un accompagnement
          <br />
          pensé pour toi,
          <br />
          vraiment <span className={styles.heroTitleHeart}>❤️</span>
        </h1>
        <p className={styles.landingHeroText}>
          Une expérience douce et premium pour choisir le parcours qui respecte ton corps,
          ton rythme et ton moment de vie.
        </p>
        <button type="button" className={styles.scrollCtaPremiumUnique} onClick={scrollToPrograms}>
          <span className={styles.scrollArrowPremiumUnique}>↓</span>
          <span>Découvre les programmes</span>
        </button>
      </section>

      <section
        id="programmes"
        className={`${styles.section} ${styles.landingProgramSection} ${styles.reveal}`}
        data-reveal
        aria-labelledby="parcours-heading"
      >
        <p className={styles.landingProgramEyebrow}>ÉquilibreMoi</p>
        <h2 id="parcours-heading" className={styles.sectionTitle}>
          Deux parcours pour te ressembler
        </h2>
        <p className={styles.landingProgramLead}>
          Choisis ton parcours et découvre pour commencer le programme le plus juste pour toi.
        </p>
        <div className={styles.landingProgramGrid}>
          <article className={styles.landingProgramCard}>
            <span className={styles.landingProgramBadge}>Besoin d’un suivi</span>
            <h3>Équilibre au quotidien</h3>
            <p>
              Des repas simples pour retrouver un équilibre alimentaire, une pression adaptée à
              ta vraie vie.
            </p>
            <ul>
              <li>Des temps simples, rassurants et faciles à suivre</li>
              <li>Pas de liberté, moins de règles strictes</li>
              <li>Retrouver du plaisir sans culpabiliser</li>
            </ul>
            <Link className={styles.landingProgramButton} to={chooseParcoursPath}>
              Voir les offres →
            </Link>
          </article>

          <article className={`${styles.landingProgramCard} ${styles.landingProgramCardMenopause}`}>
            <span className={styles.landingProgramBadge}>Spécial ménopause</span>
            <h3>Parcours ménopause</h3>
            <p>
              Un accompagnement pensé pour cette étape de la vie, avec réconfort, compréhension
              et sans pression.
            </p>
            <ul>
              <li>Des conseils adaptés à ton corps aujourd’hui</li>
              <li>Une approche douce, rassurante et sans pression</li>
              <li>Retrouver ton équilibre sans te brusquer</li>
            </ul>
            <Link className={styles.landingProgramButton} to={chooseParcoursPath}>
              Voir les offres →
            </Link>
          </article>
        </div>
        <div className={styles.landingProgramFooter}>
          <p>ÉquilibreMoi, c’est d’abord une expérience douce et rassurante.</p>
          <p>Tu avances avec ton rythme, sans pression ni culpabilité.</p>
        </div>
      </section>
    </div>
  );
}
