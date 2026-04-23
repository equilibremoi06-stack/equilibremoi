import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, syncPremiumStatus } from '../lib/authFlow';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authed' | 'anon'>('loading');
  const scrollToOffers = () => {
    document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToContent = () => {
    document.getElementById('inside-app-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then(async (user) => {
        if (!mounted) return;
        if (user) {
          await syncPremiumStatus(user);
          if (mounted) setAuthStatus('authed');
          return;
        }
        localStorage.setItem('isPremium', 'false');
        setAuthStatus('anon');
      })
      .catch(() => {
        if (!mounted) return;
        setAuthStatus('anon');
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>ÉquilibreMoi Premium</p>
        <div className={styles.heroTitleBlock}>
          <h1 className={styles.heroTitle}>
            Retrouve un équilibre alimentaire vraiment adapté à toi
          </h1>
        </div>
        <p className={styles.heroSub}>
          Un accompagnement doux, sans pression, pour te sentir mieux dans ton corps et
          dans ta vie.
        </p>
        <p className={styles.heroSocialProof}>
          ✨ Déjà + de 100 femmes accompagnées avec douceur
        </p>
        <button type="button" className={styles.heroCta} onClick={scrollToOffers}>
          Je choisis mon accompagnement
        </button>
        <button
          type="button"
          className={styles.heroScrollHint}
          onClick={scrollToContent}
          aria-label="Découvrir l’accompagnement"
        >
          <span className={styles.heroScrollHintText}>Découvrir l’accompagnement</span>
          <span className={styles.heroScrollHintArrow}>↓</span>
        </button>
        <p className={styles.heroMeta}>✨ 7 jours gratuits — sans engagement — accès immédiat</p>
        <p className={styles.heroPresence}>
          ❤️ Sans pression. Sans jugement. Juste pour toi.
        </p>
      </section>

      <section
        className={`${styles.section} ${styles.sectionBenefits} ${styles.reveal}`}
        data-reveal
        aria-labelledby="inside-app-heading"
      >
        <h2 id="inside-app-heading" className={styles.sectionTitle}>
          Dans l’application, tu retrouves ✨
        </h2>
        <ul className={styles.featureGrid}>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>🥗 Menus personnalisés selon ton rythme</span>
            <p>
              Des idées de repas alignées sur ta vie réelle, pour avancer sans te compliquer
              la tête.
            </p>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>🔄 Remplacements simples</span>
            <p>
              Quand un repas ne te convient pas, tu l’ajustes facilement — sans tout
              casser.
            </p>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>🧾 Liste de courses claire</span>
            <p>
              Utile au quotidien : tu vois ce qu’il te faut, sans te noyer dans les
              détails.
            </p>
          </li>
          <li className={styles.featureCard}>
            <span className={styles.featureTitle}>🌿 Approche douce</span>
            <p>
              Sans pression ni culpabilité : on avance avec bienveillance, à ton tempo.
            </p>
          </li>
          <li className={`${styles.featureCard} ${styles.featureCardWide}`}>
            <span className={styles.featureTitle}>🌸 Accompagnement spécial ménopause (si choisi)</span>
            <p>
              Un accompagnement pensé pour ton quotidien, et un cadre adapté quand cette
              étape de vie te concerne.
            </p>
          </li>
        </ul>
      </section>

      <section
        className={`${styles.section} ${styles.sectionBeforeAfter} ${styles.reveal}`}
        data-reveal
        aria-labelledby="before-after-heading"
      >
        <h2 id="before-after-heading" className={styles.sectionTitle}>
          Un changement plus doux, plus réaliste ✨
        </h2>
        <p className={styles.beforeAfterLead}>
          Pas pour être parfaite. Juste pour te sentir mieux, à ton rythme.
        </p>
        <div className={styles.beforeAfterRow}>
          <article
            className={`${styles.beforeAfterCard} ${styles.beforeAfterCardBefore}`}
            aria-labelledby="before-after-col-before"
          >
            <h3 id="before-after-col-before" className={styles.beforeAfterCardTitle}>
              Avant
            </h3>
            <ul className={styles.beforeAfterList}>
              <li>❌ Régimes stricts</li>
              <li>❌ Frustration</li>
              <li>❌ Effet yo-yo</li>
              <li>❌ Trop de pression</li>
            </ul>
          </article>
          <article
            className={`${styles.beforeAfterCard} ${styles.beforeAfterCardAfter}`}
            aria-labelledby="before-after-col-after"
          >
            <h3 id="before-after-col-after" className={styles.beforeAfterCardTitle}>
              Avec ÉquilibreMoi
            </h3>
            <ul className={styles.beforeAfterList}>
              <li>✅ Simple</li>
              <li>✅ Doux</li>
              <li>✅ Adapté à ton rythme</li>
              <li>✅ Durable</li>
            </ul>
          </article>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.sectionHuman} ${styles.reveal}`}
        data-reveal
        aria-labelledby="parcours-heading"
      >
        <h2 id="parcours-heading" className={styles.sectionTitle}>
          Deux parcours pour te ressembler 💗
        </h2>
        <div className={styles.humanGrid}>
          <article className={styles.humanCard}>
            <h3 className={styles.humanCardTitle}>Équilibre au quotidien</h3>
            <p className={styles.humanLead}>
              Pour retrouver une alimentation simple, sans pression, adaptée à ton rythme
            </p>
            <Link className={styles.heroCta} to="/onboarding">
              Choisir ce parcours
            </Link>
          </article>
          <article className={styles.humanCard}>
            <h3 className={styles.humanCardTitle}>Parcours ménopause</h3>
            <p className={styles.humanLead}>
              Un accompagnement pensé pour cette étape de vie, en douceur et sans contraintes
            </p>
            <Link className={styles.heroCta} to="/onboarding">
              Choisir ce parcours
            </Link>
          </article>
        </div>
      </section>

      <section
        className={`${styles.offers} ${styles.reveal}`}
        data-reveal
        id="offres"
        aria-labelledby="offers-heading"
      >
        <h2 id="offers-heading" className={styles.sectionTitle}>
          Offres
        </h2>
        <p className={styles.offersLead}>Choisis ce qui te correspond, à ton rythme ❤️</p>
        <p className={styles.offersTrialBridge}>
          Commence par 7 jours gratuits, puis choisis la formule qui te correspond
        </p>
        <p className={styles.offersTrialNote}>
          ✨ Essai gratuit de 7 jours avant activation
        </p>
        {authStatus === 'anon' ? (
          <div className={styles.offersAuthGate}>
            <p className={styles.offersAuthGateText}>
              Accès limité en visiteuse. Connecte-toi pour débloquer les options premium.
            </p>
            <Link className={styles.offersAuthGateCta} to="/auth?next=%2Foffres">
              Se connecter pour accéder
            </Link>
          </div>
        ) : null}
        <div className={styles.offersTierMonthly}>
          <p className={`${styles.offersSubhead} ${styles.offersSubheadMuted}`}>Mensuel</p>
          <div className={styles.offersGridMonthly}>
            <article className={`${styles.offerCard} ${styles.offerCardEarly}`}>
              <span className={`${styles.offerBadge} ${styles.offerBadgeEarly}`}>EARLY</span>
              <p className={styles.offerPrice}>7,99€ / mois</p>
              <p className={styles.offerDesc}>
                Offre limitée — réservée aux premières inscrites
              </p>
            </article>
            <article className={styles.offerCard}>
              <p className={styles.offerPrice}>9,90€ / mois</p>
            </article>
            <article className={`${styles.offerCard} ${styles.offerCardEarly}`}>
              <span className={`${styles.offerBadge} ${styles.offerBadgeEarly}`}>
                EARLY MENOPAUSE
              </span>
              <p className={styles.offerPrice}>9,90€ / mois</p>
            </article>
            <article className={styles.offerCard}>
              <p className={styles.offerPrice}>11,90€ / mois</p>
            </article>
          </div>
        </div>

        <div className={styles.offersTierAnnual}>
          <p className={`${styles.offersSubhead} ${styles.offersSubheadAnnual}`}>
            ANNUEL — LE PLUS AVANTAGEUX
          </p>
          <div className={styles.offersGridAnnual}>
            <article
              className={`${styles.offerCard} ${styles.offerBest} ${styles.offerFeatured}`}
            >
              <span className={styles.offerBadgeBest}>BEST</span>
              <p className={styles.offerPriceLarge}>99€ / an</p>
              <p className={styles.offerDescHighlight}>2 mois offerts — soit 20€ d’économie</p>
            </article>
            <article className={`${styles.offerCard} ${styles.offerBest} ${styles.offerBestAlt}`}>
              <span className={styles.offerBadgeBest}>BEST</span>
              <p className={styles.offerPriceLarge}>119€ / an</p>
              <p className={styles.offerDescHighlight}>
                2 mois offerts — soit 24€ d’économie
              </p>
            </article>
          </div>
        </div>

        <p className={styles.offersTrust}>
          Sans engagement · Paiement sécurisé · Annulation facile
        </p>
      </section>
    </div>
  );
}
