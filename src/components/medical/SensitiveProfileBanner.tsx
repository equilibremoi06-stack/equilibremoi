import { useState } from 'react';
import {
  dismissRecurringReminderForNow,
  loadLocalHealthProfile,
  shouldShowRecurringMedicalReminder,
} from '../../lib/healthProfileStorage';
import { RECURRING_REMINDER_TEXT } from '../../lib/healthConditions';
import styles from './SensitiveProfileBanner.module.css';

/**
 * Bandeau discret pour profils « prudent » (ex. écran d’accueil / choix de parcours).
 */
export function SensitiveProfileBanner() {
  const [, setTick] = useState(0);
  const profile = loadLocalHealthProfile();
  const showRecurring =
    profile.hasSensitiveProfile && shouldShowRecurringMedicalReminder();

  if (!profile.hasSensitiveProfile) return null;

  const onDismissRecurring = () => {
    dismissRecurringReminderForNow();
    setTick((t) => t + 1);
  };

  return (
    <div className={styles.stack}>
      <div className={styles.permanent} role="status">
        <span className={styles.icon} aria-hidden>
          💚
        </span>
        <p>
          Profil prudent : les suggestions restent générales. En cas de doute ou de
          changement de santé, parle-en à un professionnel de santé.
        </p>
      </div>

      {showRecurring ? (
        <div className={styles.recurring}>
          <p>{RECURRING_REMINDER_TEXT}</p>
          <button type="button" className={styles.dismiss} onClick={onDismissRecurring}>
            Merci, noté
          </button>
        </div>
      ) : null}
    </div>
  );
}
