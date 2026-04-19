import { useState } from 'react';
import type { HealthConditionId } from '../types/healthProfile';
import {
  EATING_DISORDER_IMMEDIATE,
  EATING_DISORDER_RESOURCE,
  HEALTH_CONDITION_OPTIONS,
  NONE_CONDITION_ID,
  SAFETY_MESSAGE_SENSITIVE,
  hasSensitiveSelection,
} from '../lib/healthConditions';
import { detectSensitiveKeywords, KEYWORD_SAFETY_MESSAGE } from '../lib/medicalSafetyKeywords';
import { saveHealthConditions } from '../lib/healthProfileStorage';
import { MedicalDisclaimer } from '../components/medical/MedicalDisclaimer';
import styles from './QuestionnaireClassiquePage.module.css';

export default function QuestionnaireClassiquePage() {
  const [step, setStep] = useState(1);
  const [healthConditions, setHealthConditions] = useState<HealthConditionId[]>([]);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [objectif, setObjectif] = useState('');
  const [keywordAlert, setKeywordAlert] = useState(false);
  const [age, setAge] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [niveau, setNiveau] = useState('');
  const [budget, setBudget] = useState('');

  const eatingDisorder = healthConditions.includes('eating_disorder');

  const toggleCondition = (id: HealthConditionId) => {
    if (id === NONE_CONDITION_ID) {
      setHealthConditions([NONE_CONDITION_ID]);
      return;
    }
    setHealthConditions((prev) => {
      const withoutNone = prev.filter((x) => x !== NONE_CONDITION_ID);
      const has = withoutNone.includes(id);
      const next = has
        ? withoutNone.filter((x) => x !== id)
        : [...withoutNone, id];
      return next.length ? next : [];
    });
  };

  const handleHealthContinue = () => {
    setHealthError(null);
    if (healthConditions.length === 0) {
      setHealthError('Merci de sélectionner au moins une option.');
      return;
    }
    if (hasSensitiveSelection(healthConditions)) {
      setShowSafetyModal(true);
      return;
    }
    saveHealthConditions(healthConditions);
    setStep(2);
  };

  const handleSafetyModalContinue = () => {
    saveHealthConditions(healthConditions);
    setShowSafetyModal(false);
    setStep(2);
  };

  const onObjectifChange = (v: string) => {
    setObjectif(v);
    setKeywordAlert(detectSensitiveKeywords(v));
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {step === 1 && (
          <>
            <h2 className={styles.h2}>Ta santé</h2>
            <p className={styles.intro}>
              As-tu un problème de santé particulier ou une situation qui nécessite de
              la prudence ?
            </p>
            <p className={styles.hint}>Tu peux sélectionner plusieurs réponses.</p>
            <ul className={styles.options}>
              {HEALTH_CONDITION_OPTIONS.map(({ id, label }) => (
                <li key={id}>
                  <label className={styles.optionRow}>
                    <input
                      type="checkbox"
                      checked={healthConditions.includes(id)}
                      onChange={() => toggleCondition(id)}
                      className={styles.check}
                    />
                    <span>{label}</span>
                  </label>
                </li>
              ))}
            </ul>
            {healthError ? <p className={styles.error}>{healthError}</p> : null}
            <button type="button" className={styles.button} onClick={handleHealthContinue}>
              Continuer
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={styles.h2}>Bienvenue 👋</h2>
            <p className={styles.intro}>Ton objectif ?</p>
            <input
              className={styles.input}
              placeholder="Plus d’énergie, des repas plus simples…"
              value={objectif}
              onChange={(e) => onObjectifChange(e.target.value)}
            />
            {keywordAlert ? (
              <p className={styles.keywordSafety} role="status">
                {KEYWORD_SAFETY_MESSAGE}
              </p>
            ) : null}
            <button type="button" className={styles.button} onClick={() => setStep(3)}>
              Continuer
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className={styles.h2}>Ton profil</h2>
            <input
              className={styles.input}
              type="number"
              placeholder="Ton âge"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            {!eatingDisorder ? (
              <>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="Ton poids (kg)"
                  value={poids}
                  onChange={(e) => setPoids(e.target.value)}
                />
                <input
                  className={styles.input}
                  type="number"
                  placeholder="Ta taille (cm)"
                  value={taille}
                  onChange={(e) => setTaille(e.target.value)}
                />
              </>
            ) : (
              <p className={styles.softNote}>
                Pour un accompagnement plus doux, on ne met pas l’accent sur les
                chiffres ici — l’important, c’est comment tu te sens.
              </p>
            )}
            <button type="button" className={styles.button} onClick={() => setStep(4)}>
              Continuer
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className={styles.h2}>Ton niveau</h2>
            <input
              className={styles.input}
              placeholder="Débutant / moyen / avancé"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
            />
            <input
              className={styles.input}
              type="number"
              placeholder="Ton budget alimentaire (€ / semaine)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
            <button type="button" className={styles.button} onClick={() => setStep(5)}>
              Voir mon plan
            </button>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className={styles.h2}>Ton plan personnalisé 🎯</h2>
            <p>
              <b>Objectif :</b> {objectif}
            </p>
            <p>
              <b>Âge :</b> {age}
            </p>
            {!eatingDisorder ? (
              <>
                <p>
                  <b>Poids :</b> {poids} kg
                </p>
                <p>
                  <b>Taille :</b> {taille} cm
                </p>
              </>
            ) : null}
            <p>
              <b>Niveau :</b> {niveau}
            </p>
            <p>
              <b>Budget :</b> {budget} €
            </p>
            <MedicalDisclaimer className={styles.disclaimerSpacing} />
            <button type="button" className={styles.buttonGhost} onClick={() => setStep(1)}>
              Recommencer
            </button>
          </>
        )}
      </div>

      {showSafetyModal ? (
        <div className={styles.modalRoot}>
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onClick={() => setShowSafetyModal(false)}
          />
          <div className={styles.modalCard} role="dialog" aria-modal="true">
            <p className={styles.modalText}>{SAFETY_MESSAGE_SENSITIVE}</p>
            {healthConditions.includes('eating_disorder') ? (
              <>
                <p className={styles.modalText}>{EATING_DISORDER_IMMEDIATE}</p>
                <p className={styles.resource}>{EATING_DISORDER_RESOURCE}</p>
              </>
            ) : null}
            <button type="button" className={styles.button} onClick={handleSafetyModalContinue}>
              J’ai compris, je continue
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
