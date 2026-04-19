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

const STEP_LABELS = [
  'Ta santé',
  'Ton intention',
  'Ton profil',
  'Ton rythme',
  'Ton récap',
] as const;

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
  const totalSteps = 5;

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

  const stepMeta = (n: number) => (
    <p className={styles.stepMeta}>
      Étape {n} sur {totalSteps} · {STEP_LABELS[n - 1]}
    </p>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {step === 1 && (
          <>
            {stepMeta(1)}
            <h2 className={styles.h2}>Parlons de toi, en confiance</h2>
            <p className={styles.intro}>
              As-tu une situation qui appelle un peu plus de prudence côté santé ?
              Réponds avec honnêteté — cela nous aide à rester douces avec toi.
            </p>
            <p className={styles.hint}>Plusieurs réponses possibles.</p>
            <ul className={styles.options}>
              {HEALTH_CONDITION_OPTIONS.map(({ id, label }) => {
                const checked = healthConditions.includes(id);
                return (
                  <li key={id}>
                    <label
                      className={`${styles.optionCard} ${checked ? styles.optionCardChecked : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCondition(id)}
                        className={styles.srOnly}
                      />
                      <span className={styles.optionCheck} aria-hidden>
                        {checked ? '✓' : ''}
                      </span>
                      <span className={styles.optionLabel}>{label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {healthError ? <p className={styles.error}>{healthError}</p> : null}
            <button type="button" className={styles.button} onClick={handleHealthContinue}>
              Continuer
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {stepMeta(2)}
            <h2 className={styles.h2}>Ce qui te motive en ce moment</h2>
            <p className={styles.intro}>
              Une phrase suffit : énergie, simplicité, plaisir au plat…
            </p>
            <input
              className={styles.input}
              placeholder="Ex. des repas plus simples, plus d’énergie…"
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
            {stepMeta(3)}
            <h2 className={styles.h2}>Quelques repères</h2>
            <p className={styles.intro}>
              Des chiffres optionnels pour personnaliser — sans jugement.
            </p>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              placeholder="Ton âge"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            {!eatingDisorder ? (
              <>
                <input
                  className={styles.input}
                  type="number"
                  inputMode="decimal"
                  placeholder="Ton poids (kg)"
                  value={poids}
                  onChange={(e) => setPoids(e.target.value)}
                />
                <input
                  className={styles.input}
                  type="number"
                  inputMode="numeric"
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
            {stepMeta(4)}
            <h2 className={styles.h2}>Ton rythme & ton budget</h2>
            <p className={styles.intro}>
              Pour des idées réalistes, adaptées à ta vie.
            </p>
            <input
              className={styles.input}
              placeholder="Niveau en cuisine : débutante, à l’aise…"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
            />
            <input
              className={styles.input}
              type="number"
              inputMode="decimal"
              placeholder="Budget alimentaire (€ / semaine)"
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
            {stepMeta(5)}
            <h2 className={styles.h2}>Ton premier aperçu</h2>
            <p className={styles.intro}>
              Un résumé pour la suite — les conseils restent généraux et informatifs.
            </p>
            <div className={styles.plan}>
              <div className={styles.planRow}>
                <span>Objectif</span>
                <span>{objectif || '—'}</span>
              </div>
              <div className={styles.planRow}>
                <span>Âge</span>
                <span>{age || '—'}</span>
              </div>
              {!eatingDisorder ? (
                <>
                  <div className={styles.planRow}>
                    <span>Poids</span>
                    <span>{poids ? `${poids} kg` : '—'}</span>
                  </div>
                  <div className={styles.planRow}>
                    <span>Taille</span>
                    <span>{taille ? `${taille} cm` : '—'}</span>
                  </div>
                </>
              ) : null}
              <div className={styles.planRow}>
                <span>Niveau</span>
                <span>{niveau || '—'}</span>
              </div>
              <div className={styles.planRow}>
                <span>Budget</span>
                <span>{budget ? `${budget} €` : '—'}</span>
              </div>
            </div>
            <MedicalDisclaimer className={styles.disclaimerSpacing} />
            <button type="button" className={styles.buttonGhost} onClick={() => setStep(1)}>
              Recommencer le questionnaire
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
            <div className={styles.modalHeader}>
              <span className={styles.modalIcon} aria-hidden>
                ✦
              </span>
              <span className={styles.modalKicker}>Message important</span>
            </div>
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
