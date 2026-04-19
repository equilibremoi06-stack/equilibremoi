import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MedicalDisclaimer } from '../components/medical/MedicalDisclaimer';
import { saveMenopauseFlags } from '../lib/healthProfileStorage';
import {
  boneHealthContent,
  hotFlashesContent,
  menopauseDisclaimers,
  menopauseFoodsOrHabitsToModerate,
  menopauseFoodsToFavor,
  menopauseNutritionGeneral,
  menopauseSymptomsHandled,
  moodFatigueContent,
  MENOPAUSE_MEDICAL_REDIRECT,
  sleepContent,
  weightGlycemicContent,
} from '../lib/menopauseContent';
import styles from './QuestionnaireMenopausePage.module.css';

export default function QuestionnaireMenopausePage() {
  useEffect(() => {
    saveMenopauseFlags(['parcours_menopause']);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Parcours Ménopause</h1>
        <p className={styles.lead}>
          Un cadre bienveillant pour parler alimentation et confort au quotidien — sans
          promesse miracle, sans prescription. Si tu suis un traitement ou si un
          symptôme t’inquiète, ton professionnel de santé reste la référence.
        </p>

        <div className={styles.alert} role="status">
          <strong>Important</strong>
          <p>{MENOPAUSE_MEDICAL_REDIRECT}</p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.h2}>Symptômes pris en charge (approche douce)</h2>
          <ul className={styles.bullets}>
            {menopauseSymptomsHandled.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>{menopauseNutritionGeneral.title}</h2>
          <ul className={styles.bullets}>
            {menopauseNutritionGeneral.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>{hotFlashesContent.title}</h2>
          <ul className={styles.bullets}>
            {hotFlashesContent.prudentTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className={styles.note}>{hotFlashesContent.soyNote}</p>
          <p className={styles.quote}>{hotFlashesContent.aiToneExample}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>{boneHealthContent.title}</h2>
          <ul className={styles.bullets}>
            {boneHealthContent.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className={styles.message}>{boneHealthContent.message}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>{weightGlycemicContent.title}</h2>
          <ul className={styles.bullets}>
            {weightGlycemicContent.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className={styles.quote}>{weightGlycemicContent.aiToneExample}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>{sleepContent.title}</h2>
          <ul className={styles.bullets}>
            {sleepContent.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>{moodFatigueContent.title}</h2>
          <ul className={styles.bullets}>
            {moodFatigueContent.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>À privilégier (général)</h2>
          <ul className={styles.bullets}>
            {menopauseFoodsToFavor.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>À modérer ou ajuster selon tolérance</h2>
          <ul className={styles.bullets}>
            {menopauseFoodsOrHabitsToModerate.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Rappels responsables</h2>
          <ul className={styles.bullets}>
            {menopauseDisclaimers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>

        <MedicalDisclaimer className={styles.disclaimer} />

        <Link className={styles.back} to="/">
          ← Changer de parcours
        </Link>
      </div>
    </div>
  );
}
