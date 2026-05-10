import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { applyUserFlags, getCurrentUser, syncPremiumStatus } from '../lib/authFlow';
import { sendWelcomeEmail } from '../lib/emailEvents';
import { getUserOnboardingStatus, restoreCompletedOnboardingLocally, saveOnboardingProgress } from '../lib/onboardingStatus';
import { getSupabase } from '../lib/supabaseClient';
import { getStoredParcours, syncSelectedParcoursSupabase } from '../lib/userParcours';
import styles from './AuthPage.module.css';

type Mode = 'signin' | 'signup';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payloadRaw] = token.split('.');
    if (!payloadRaw) return null;
    const base64 = payloadRaw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function humanizeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Mot de passe incorrect';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Cette adresse email est déjà utilisée';
  }
  if (m.includes('email not confirmed')) return 'Email non vérifié';
  return 'Une erreur est survenue. Réessaie dans un instant.';
}

export default function AuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const next = params.get('next') || '/onboarding';

  const supabase = getSupabase();

  const proceedAfterAuth = async (user: Awaited<ReturnType<typeof getCurrentUser>>) => {
    if (!user) return;
    applyUserFlags(user);
    await syncPremiumStatus(user);
    const existingStatus = await getUserOnboardingStatus(user);
    if (existingStatus.onboardingCompleted) {
      restoreCompletedOnboardingLocally(existingStatus);
      navigate('/app', { replace: true });
      return;
    }
    await syncSelectedParcoursSupabase(user);
    const storedParcours = getStoredParcours();
    if (storedParcours) {
      await saveOnboardingProgress(user, {
        parcoursType: storedParcours,
        onboardingCompleted: false,
        onboardingStep: 0,
      });
    }
    navigate(next, { replace: true });
  };

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    getCurrentUser().then((user) => {
      if (!mounted || !user) return;
      Promise.all([syncPremiumStatus(user)])
        .then(async () => {
          const existingStatus = await getUserOnboardingStatus(user);
          if (existingStatus.onboardingCompleted) {
            restoreCompletedOnboardingLocally(existingStatus);
            navigate('/app', { replace: true });
            return;
          }
          await syncSelectedParcoursSupabase(user);
          const storedParcours = getStoredParcours();
          if (storedParcours) {
            await saveOnboardingProgress(user, {
              parcoursType: storedParcours,
              onboardingCompleted: false,
              onboardingStep: 0,
            });
          }
          navigate(next, { replace: true });
        });
    });
    return () => {
      mounted = false;
    };
  }, [navigate, next, supabase]);

  if (!supabase) {
    return <Navigate to="/offres" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError('');
    setOk('');
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      setLoading(true);
      if (mode === 'signin') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        await proceedAfterAuth(data.user ?? null);
      } else {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
        const anonPayload = supabaseAnonKey ? decodeJwtPayload(supabaseAnonKey) : null;
        console.log('[auth] signUp target project', {
          supabaseUrl,
          anonKeyPrefix: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...` : null,
          anonRef: anonPayload?.ref,
          anonRole: anonPayload?.role,
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        });
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`,
          },
        });
        console.log('[auth] signUp response', {
          data: signUpData,
          user: signUpData?.user ?? null,
          session: signUpData?.session ?? null,
          emailConfirmedAt: signUpData?.user?.email_confirmed_at ?? null,
          error: signUpError,
        });
        if (signUpError) {
          console.error('[auth] signUp error details', signUpError);
          throw signUpError;
        }
        console.log('[auth] signup success, sending welcome email', { email });
        void sendWelcomeEmail(email).catch((err) => {
          console.error('Envoi email de bienvenue échoué :', err);
        });
        if (signUpData?.user) {
          await proceedAfterAuth(signUpData.user);
          return;
        }
        navigate(`/auth/verify?email=${encodeURIComponent(email)}`, { replace: true });
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('[auth] signup/signin failed', err);
      if (mode === 'signup') {
        setError(`Échec de création de compte : ${errorMessage}`);
      } else {
        setError(humanizeAuthError(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <p className={styles.logo}>EquilibreMoi</p>
        <h1 className={styles.title}>Entre dans ton espace douceur ✨</h1>
        <p className={styles.subtitle}>
          Crée ton compte pour accéder à ton accompagnement personnalisé.
        </p>
        <div className={styles.card}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${mode === 'signin' ? styles.tabActive : ''}`}
              onClick={() => setMode('signin')}
            >
              Se connecter
            </button>
            <button
              type="button"
              className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
              onClick={() => setMode('signup')}
            >
              Créer mon compte
            </button>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className={styles.passwordField}>
              <input
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {mode === 'signup' ? (
              <div className={styles.passwordField}>
                <input
                  className={styles.input}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword
                      ? 'Masquer la confirmation du mot de passe'
                      : 'Afficher la confirmation du mot de passe'
                  }
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            ) : null}
            {error ? <p className={styles.error}>{error}</p> : null}
            {ok ? <p className={styles.ok}>{ok}</p> : null}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading
                ? 'Chargement...'
                : mode === 'signin'
                  ? 'Me connecter'
                  : 'Créer mon compte'}
            </button>
            {mode === 'signin' ? (
              <Link className={styles.linkBtn} to="/auth/reset-password">
                Mot de passe oublié ?
              </Link>
            ) : null}
          </form>
          <p className={styles.note}>Une approche sans pression, adaptée à ton rythme 💛</p>
        </div>
      </div>
    </div>
  );
}

