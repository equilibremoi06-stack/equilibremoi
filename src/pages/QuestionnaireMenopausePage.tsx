import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MedicalDisclaimer } from '../components/medical/MedicalDisclaimer';
import MedicalAcknowledgmentPage from './MedicalAcknowledgmentPage';
import { loadLocalHealthProfile, saveMenopauseFlags } from '../lib/healthProfileStorage';
import { getCurrentUser } from '../lib/authFlow';
import {
  menopauseDisclaimers,
  menopauseFoodsOrHabitsToModerate,
  menopauseFoodsToFavor,
  menopauseNutritionGeneral,
  MENOPAUSE_MEDICAL_REDIRECT,
} from '../lib/menopauseContent';
import { markQuestionnaireCompleted } from '../lib/onboardingStatus';
import { setStoredParcours } from '../lib/userParcours';
import styles from './QuestionnaireMenopausePage.module.css';

const MINI_CARDS = [
  {
    title: 'Bouffées de chaleur',
    lines: [
      'Hydratation et repas simples, à ton rythme.',
      'Observer ce qui t’apaise — sans te restreindre.',
    ],
  },
  {
    title: 'Sommeil',
    lines: [
      'Soirée plus légère si tu le souhaites.',
      'Moins d’excitants en fin de journée, si ça t’aide.',
    ],
  },
  {
    title: 'Humeur & fatigue',
    lines: [
      'Régularité des repas, petits plaisirs autorisés.',
      'Ton corps mérite douceur, pas de performance.',
    ],
  },
  {
    title: 'Équilibre glycémique',
    lines: [
      'Repas structurés, aliments peu transformés.',
      'Stabilité douce plutôt que contrôle strict.',
    ],
  },
] as const;

export default function QuestionnaireMenopausePage() {
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);
  const [medicalAcknowledged, setMedicalAcknowledged] = useState(() => loadLocalHealthProfile().medicalAcknowledged);

  useEffect(() => {
    setStoredParcours('menopause');
    saveMenopauseFlags(['parcours_menopause']);
  }, []);

  const completeMenopauseQuestionnaire = async () => {
    setStoredParcours('menopause');
    saveMenopauseFlags(['parcours_menopause']);
    const user = await getCurrentUser();
    await markQuestionnaireCompleted(user, 'menopause', null);
    navigate('/app', { replace: true });
  };

  if (!medicalAcknowledged) {
    return <MedicalAcknowledgmentPage onComplete={() => setMedicalAcknowledged(true)} />;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>Parcours ménopause</p>
          <h1 className={styles.title}>Douceur & clarté pour cette étape</h1>
          <p className={styles.lead}>
            Un accompagnement bien-être pour t’inspirer au quotidien — jamais une
            promesse médicale. Ton médecin ou ta sage-femme restent tes repères si un
            symptôme t’inquiète.
          </p>
        </header>

        <div className={styles.safety} role="status">
          <span className={styles.safetyIcon} aria-hidden>
            ✦
          </span>
          <div>
            <span className={styles.safetyLabel}>Sécurité</span>
            <p className={styles.safetyText}>{MENOPAUSE_MEDICAL_REDIRECT}</p>
          </div>
        </div>

        <div className={styles.grid}>
          {MINI_CARDS.map((c) => (
            <article key={c.title} className={styles.miniCard}>
              <h2 className={styles.miniTitle}>{c.title}</h2>
              {c.lines.map((line) => (
                <p key={line} className={styles.miniLine}>
                  {line}
                </p>
              ))}
            </article>
          ))}
        </div>

        <div className={styles.ctaBlock}>
          <button
            type="button"
            className={styles.cta}
            onClick={() => {
              void completeMenopauseQuestionnaire();
            }}
          >
            Continuer vers mon dashboard ménopause
          </button>
          <button
            type="button"
            className={styles.linkDetail}
            onClick={() => setShowDetail((v) => !v)}
            aria-expanded={showDetail}
          >
            {showDetail ? 'Masquer le détail' : 'Voir le détail du cadre nutritionnel'}
          </button>
        </div>

        {showDetail ? (
          <section className={styles.detail}>
            <h3 className={styles.detailTitle}>{menopauseNutritionGeneral.title}</h3>
            <ul className={styles.detailList}>
              {menopauseNutritionGeneral.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <h3 className={styles.detailTitle}>À privilégier (général)</h3>
            <ul className={styles.detailList}>
              {menopauseFoodsToFavor.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h3 className={styles.detailTitle}>À modérer selon tolérance</h3>
            <ul className={styles.detailList}>
              {menopauseFoodsOrHabitsToModerate.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <h3 className={styles.detailTitle}>Rappels responsables</h3>
            <ul className={styles.detailList}>
              {menopauseDisclaimers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className={styles.disclaimerWrap}>
          <MedicalDisclaimer />
        </div>

        <Link className={styles.back} to="/">
          ← Changer de parcours
        </Link>
      </div>
    </div>
  );
}
