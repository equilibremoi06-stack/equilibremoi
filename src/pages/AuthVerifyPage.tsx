import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { applyUserFlags, getCurrentUser, syncPremiumStatus } from '../lib/authFlow';
import { getSupabase } from '../lib/supabaseClient';
import styles from './AuthPage.module.css';

export default function AuthVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((user) => {
      if (!mounted || !user) return;
      applyUserFlags(user);
          syncPremiumStatus(user).finally(() => navigate('/offres', { replace: true }));
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const checkConfirmation = async () => {
    setError('');
    setMessage('');
    setChecking(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        applyUserFlags(user);
        navigate('/offres', { replace: true });
        return;
      }
      setError('Email non vérifié');
    } finally {
      setChecking(false);
    }
  };

  const resendEmail = async () => {
    if (!supabase || !email) {
      setError('Impossible de renvoyer sans adresse email');
      return;
    }
    setError('');
    setMessage('');
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendError) throw resendError;
      setMessage('Lien envoyé');
    } catch {
      setError('Impossible de renvoyer l’email pour le moment');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <p className={styles.logo}>EquilibreMoi</p>
        <div className={styles.verifyCard}>
          <div className={styles.verifyIcon}>📩</div>
          <h1 className={styles.title}>Vérifie ton email 💌</h1>
          <p className={styles.subtitle}>
            On t’a envoyé un lien de confirmation pour activer ton compte.
          </p>
          {email ? <p className={styles.verifyEmail}>{email}</p> : null}
          <p className={styles.verifySmall}>Pense à vérifier tes spams si tu ne le vois pas 👀</p>
          {error ? <p className={styles.error}>{error}</p> : null}
          {message ? <p className={styles.ok}>{message}</p> : null}
          <button type="button" className={styles.button} onClick={checkConfirmation} disabled={checking}>
            {checking ? 'Vérification...' : 'J’ai confirmé mon email'}
          </button>
          <button type="button" className={styles.buttonSecondary} onClick={resendEmail} disabled={resending}>
            {resending ? 'Envoi...' : 'Renvoyer l’email'}
          </button>
          <Link className={styles.linkBtnCenter} to="/auth">
            Changer d’adresse email
          </Link>
        </div>
      </div>
    </div>
  );
}

