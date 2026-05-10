import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const chooseParcoursPath = '/choix-parcours';

export default function OffersPage() {
  const pageRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const goToParcoursChoice = () => {
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
    <main ref={pageRef} className={`${styles.page} ${styles.offersPage}`}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Offres ÉquilibreMoi</p>
        <div className={styles.heroTitleBlock}>
          <h1 className={styles.heroTitle}>Choisis l’accompagnement qui te ressemble</h1>
        </div>
        <p className={styles.heroSub}>
          Un accompagnement doux, sans pression, pour retrouver des repères clairs et une
          relation plus apaisée à ton alimentation.
        </p>
        <button type="button" className={styles.heroCta} onClick={goToParcoursChoice}>
          <span>Commencer gratuitement</span>
          <span className={styles.heroCtaArrow}>↓</span>
        </button>
        <p className={styles.heroMeta}>✨ 7 jours gratuits — sans engagement — accès immédiat</p>
        <p className={styles.heroPresence}>
          ❤️ Sans pression. Sans jugement. Juste pour toi.
        </p>
      </section>

      <section
        className={`${styles.section} ${styles.sectionBenefits} ${styles.reveal}`}
        data-reveal
        aria-labelledby="offers-benefits-heading"
      >
        <h2 id="offers-benefits-heading" className={styles.sectionTitle}>
          Dans l’application, tu retrouves ✨
        </h2>
        <ul className={styles.featureGrid}>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>🥗 Menus personnalisés selon ton rythme</span>
            <p>Des idées de repas alignées sur ta vie réelle, sans règles impossibles.</p>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>🔄 Remplacements simples</span>
            <p>Quand un repas ne te convient pas, tu l’ajustes facilement.</p>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>🧾 Liste de courses claire</span>
            <p>Tu vois ce qu’il te faut, sans te noyer dans les détails.</p>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>🌿 Approche douce</span>
            <p>Sans pression ni culpabilité : on avance avec bienveillance.</p>
          </li>
          <li className={`${styles.featureCard} ${styles.featureCardWide}`}>
            <span className={styles.featureTitle}>🌸 Accompagnement spécial ménopause</span>
            <p>Un cadre adapté quand cette étape de vie te concerne.</p>
          </li>
        </ul>
      </section>

      <section
        className={`${styles.offers} ${styles.offersStandalone} ${styles.reveal}`}
        data-reveal
        id="offres"
        aria-labelledby="offers-heading"
      >
        <h2 id="offers-heading" className={styles.sectionTitle}>
          Offres
        </h2>
        <p className={styles.offersTrialNote}>✨ Essai gratuit de 7 jours avant activation</p>

        <div className={styles.offersTierMonthly}>
          <p className={`${styles.offersSubhead} ${styles.offersSubheadMuted}`}>Mensuel</p>
          <div className={styles.offersGridMonthly}>
            <article className={`${styles.offerCard} ${styles.offerCardEarly}`}>
              <span className={`${styles.offerBadge} ${styles.offerBadgeEarly}`}>EARLY</span>
              <p className={styles.offerPrice}>7,99€ / mois</p>
              <p className={styles.offerDesc}>Offre de lancement — réservée aux premières inscrites</p>
              <span className={styles.offerInfoPill}>Essai gratuit inclus</span>
            </article>
            <article className={styles.offerCard}>
              <p className={styles.offerPrice}>9,90€ / mois</p>
              <p className={styles.offerDesc}>Équilibre au quotidien</p>
              <span className={styles.offerInfoPill}>Après création de l’espace</span>
            </article>
            <article className={`${styles.offerCard} ${styles.offerCardEarly}`}>
              <span className={`${styles.offerBadge} ${styles.offerBadgeEarly}`}>
                EARLY MÉNOPAUSE
              </span>
              <p className={styles.offerPrice}>9,90€ / mois</p>
              <p className={styles.offerDesc}>Offre de lancement — parcours ménopause</p>
              <span className={styles.offerInfoPill}>Essai gratuit inclus</span>
            </article>
            <article className={styles.offerCard}>
              <p className={styles.offerPrice}>11,90€ / mois</p>
              <p className={styles.offerDesc}>Parcours ménopause</p>
              <span className={styles.offerInfoPill}>Après choix du parcours</span>
            </article>
          </div>
        </div>

        <div className={styles.offersTierAnnual}>
          <p className={`${styles.offersSubhead} ${styles.offersSubheadAnnual}`}>Annuel</p>
          <div className={styles.offersGridAnnual}>
            <article className={`${styles.offerCard} ${styles.offerBest} ${styles.offerFeatured}`}>
              <span className={styles.offerBadgeBest}>BEST</span>
              <p className={styles.offerPriceLarge}>99€ / an</p>
              <p className={styles.offerDescHighlight}>2 mois offerts — soit 20€ d’économie</p>
              <span className={`${styles.offerInfoPill} ${styles.offerInfoPillBest}`}>Option annuelle disponible dans l’app</span>
            </article>
            <article className={`${styles.offerCard} ${styles.offerBest} ${styles.offerBestAlt}`}>
              <span className={styles.offerBadgeBest}>BEST</span>
              <p className={styles.offerPriceLarge}>119€ / an</p>
              <p className={styles.offerDescHighlight}>2 mois offerts — soit 24€ d’économie</p>
              <span className={`${styles.offerInfoPill} ${styles.offerInfoPillBest}`}>Option annuelle disponible dans l’app</span>
            </article>
          </div>
        </div>

        <p className={styles.offersTrust}>
          Sans engagement · Paiement sécurisé · Annulation facile
        </p>
        <button type="button" className={styles.offersSoftCta} onClick={goToParcoursChoice}>
          Découvrir mon parcours
        </button>
      </section>
    </main>
  );
}
