import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingProgress } from '../lib/onboardingStatus';
import { getSupabase } from '../lib/supabaseClient';
import { setStoredParcours, syncSelectedParcoursSupabase, type UserParcours } from '../lib/userParcours';
import styles from './ChoixParcoursPage.module.css';

export default function ChoixParcoursPage() {
  const navigate = useNavigate();
  const [selectedParcours, setSelectedParcours] = useState<UserParcours | null>(null);

  const continueWithParcours = async (parcours: UserParcours) => {
    setSelectedParcours(parcours);
    setStoredParcours(parcours);

    const supabase = getSupabase();
    const { data } = supabase
      ? await supabase.auth.getUser()
      : { data: { user: null } };

    if (data.user) {
      await syncSelectedParcoursSupabase(data.user);
      await saveOnboardingProgress(data.user, {
        parcoursType: parcours,
        onboardingCompleted: false,
        onboardingStep: 0,
      });
      navigate(parcours === 'menopause' ? '/questionnaire-menopause' : '/questionnaire-classique');
      return;
    }

    navigate('/login?next=%2Fonboarding', { state: { parcours } });
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroHead}>
          <p className={styles.kicker}>Ton accompagnement commence ici</p>
          <h1 className={styles.title}>
            Choisis le parcours
            <br />
            qui te ressemble vraiment
          </h1>
          <div className={styles.decorLine} aria-hidden />
        </div>
        <p className={styles.subtitle}>
          Avant de créer ton espace, dis-nous ce dont tu as besoin. Ton questionnaire,
          tes conseils et ton tableau de bord seront adaptés à ce choix.
        </p>
      </section>

      <section className={styles.cards} aria-label="Choix du parcours">
        <article
          className={`${styles.card} ${selectedParcours === 'classique' ? styles.cardSelected : ''}`}
          onClick={() => continueWithParcours('classique')}
        >
          <span className={styles.cardIcon} aria-hidden>
            🌿
          </span>
          <p className={styles.cardEyebrow}>Routine classique</p>
          <h2 className={styles.cardTitle}>Parcours Équilibre</h2>
          <ul className={styles.list}>
            <li>Accompagnement quotidien</li>
            <li>Alimentation douce</li>
            <li>Perte de poids bienveillante</li>
            <li>Routine classique</li>
          </ul>
          <button
            type="button"
            className={styles.cta}
            onClick={(e) => {
              e.stopPropagation();
              void continueWithParcours('classique');
            }}
          >
            Continuer avec ce parcours
          </button>
        </article>

        <article
          className={`${styles.card} ${styles.cardHighlight} ${selectedParcours === 'menopause' ? styles.cardSelected : ''}`}
          onClick={() => continueWithParcours('menopause')}
        >
          <span className={styles.badge}>Accompagnement spécifique</span>
          <span className={styles.cardIcon} aria-hidden>
            🌸
          </span>
          <p className={styles.cardEyebrow}>Équilibre hormonal</p>
          <h2 className={styles.cardTitle}>Parcours Ménopause</h2>
          <ul className={styles.list}>
            <li>Symptômes</li>
            <li>Fatigue</li>
            <li>Hormones</li>
            <li>Accompagnement spécifique</li>
          </ul>
          <button
            type="button"
            className={styles.cta}
            onClick={(e) => {
              e.stopPropagation();
              void continueWithParcours('menopause');
            }}
          >
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
