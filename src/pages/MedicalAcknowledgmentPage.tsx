import { useState } from 'react';
import { saveMedicalAcknowledged } from '../lib/healthProfileStorage';
import styles from './MedicalAcknowledgmentPage.module.css';

type Props = {
  onComplete: () => void;
};

const INTRO =
  "💚 ÉquilibreMoi est une application de bien-être et de rééquilibrage alimentaire. Elle ne remplace pas l'avis d'un médecin, diététicien, gynécologue, sage-femme ou autre professionnel de santé. En cas de problème de santé ou de doute, consulte toujours un professionnel.";

export default function MedicalAcknowledgmentPage({ onComplete }: Props) {
  const [accepted, setAccepted] = useState(false);

  const handleContinue = () => {
    if (!accepted) return;
    saveMedicalAcknowledged(true);
    onComplete();
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.kicker}>Bienvenue</p>
        <h1 className={styles.title}>Avant de commencer</h1>
        <div className={styles.decorLine} aria-hidden />
        <p className={styles.lead}>{INTRO}</p>

        <div className={styles.note}>
          <span className={styles.noteIcon} aria-hidden>
            ✦
          </span>
          <p className={styles.noteText}>
            Cette case est obligatoire pour continuer : elle protège ton usage de
            l’app dans le bon cadre.
          </p>
        </div>

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className={styles.checkbox}
          />
          <span>
            J’ai compris qu’ÉquilibreMoi est un outil de bien-être et ne remplace pas
            un suivi médical
          </span>
        </label>

        <button
          type="button"
          className={styles.button}
          disabled={!accepted}
          onClick={handleContinue}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
