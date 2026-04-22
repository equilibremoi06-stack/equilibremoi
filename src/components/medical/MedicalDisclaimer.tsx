import { useCallback, useEffect, useId, useState } from 'react';
import styles from './MedicalDisclaimer.module.css';

const MODAL_BODY =
  "ÉquilibreMoi est une application de bien-être. Les recommandations proposées sont basées sur des principes nutritionnels généraux et ne tiennent pas compte de ta situation médicale complète. Elles ne remplacent jamais l'avis d'un médecin, gynécologue, sage-femme, diététicien ou autre professionnel de santé. En cas de doute, de symptômes importants ou de traitement en cours, consulte un professionnel.";

type Props = {
  className?: string;
};

export function MedicalDisclaimer({ className }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <button
        type="button"
        className={styles.noteTrigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={styles.noteIcon} aria-hidden>
          ⓘ
        </span>
        <span className={styles.noteLabel}>
          Conseils informatifs — pas de substitution médicale
        </span>
        <span className={styles.noteHint}>Toucher pour en savoir plus</span>
      </button>

      {open ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={onClose}
        />
      ) : null}

      {open ? (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <h2 id={titleId} className={styles.modalTitle}>
            À lire avec calme
          </h2>
          <p className={styles.modalBody}>{MODAL_BODY}</p>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            J’ai compris
          </button>
        </div>
      ) : null}
    </div>
  );
}
