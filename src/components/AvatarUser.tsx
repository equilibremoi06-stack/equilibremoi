import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAccess } from '../context/UserAccessContext';
import { hasPremiumEntitlements, type AuthUserLike } from '../lib/authFlow';
import { getSupabase } from '../lib/supabaseClient';
import styles from './AvatarUser.module.css';

type AvatarUserProps = {
  user: AuthUserLike;
};

export default function AvatarUser({ user }: AvatarUserProps) {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const letter = useMemo(() => {
    const first =
      user?.email?.[0] ||
      (typeof user?.user_metadata?.first_name === 'string' ? user.user_metadata.first_name[0] : '') ||
      (typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name[0] : '') ||
      'E';
    return first.toUpperCase();
  }, [user]);

  const displayEmail = user?.email || 'utilisatrice';
  const { access, profile: accessProfile } = useUserAccess();
  const isAdmin =
    access.isAdmin || accessProfile?.is_admin === true || accessProfile?.role === 'admin';
  const premiumActive = hasPremiumEntitlements(access, accessProfile);

  const onSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    localStorage.removeItem('isPremium');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('equilibremoi_is_admin');
    localStorage.removeItem('userRole');
    setOpen(false);
    navigate('/offres', { replace: true });
  };

  const onProfile = () => {
    setOpen(false);
    navigate('/app?tab=profil');
  };

  const onClassicProgram = () => {
    setOpen(false);
    navigate('/app?parcours=classique&tab=programme');
  };

  const onMenopauseProgram = () => {
    setOpen(false);
    navigate('/app?parcours=menopause&tab=programme');
  };

  const onPremium = () => {
    setOpen(false);
    navigate('/premium');
  };

  const onAdmin = () => {
    setOpen(false);
    navigate('/app?tab=recettes');
  };

  if (!user) return null;

  return (
    <div className={styles.wrap} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${styles.avatarButton} ${premiumActive ? styles.avatarButtonPremium : ''}`}
        aria-label="Ouvrir le menu utilisateur"
        aria-expanded={open}
      >
        {letter}
      </button>

      {open ? (
        <div className={styles.menu}>
          <div className={styles.identity}>
            <span className={styles.identityAvatar}>
              {letter}
            </span>
            <div className={styles.identityTextBlock}>
              <span className={styles.identityText}>{displayEmail}</span>
              {premiumActive ? (
                <span className={styles.premiumBadge}>Premium actif ✨</span>
              ) : null}
            </div>
          </div>
          <div className={styles.separator} />
          <button
            type="button"
            onClick={onProfile}
            className={styles.menuItem}
          >
            Profil
          </button>
          <button
            type="button"
            onClick={onClassicProgram}
            className={styles.menuItem}
          >
            Programme normal
          </button>
          <button
            type="button"
            onClick={onMenopauseProgram}
            className={styles.menuItem}
          >
            Programme ménopause
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={onAdmin}
              className={`${styles.menuItem} ${styles.adminItem}`}
            >
              Admin
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPremium}
            className={styles.menuItem}
          >
            ✨ Premium
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className={`${styles.menuItem} ${styles.signOut}`}
          >
            Déconnexion
          </button>
        </div>
      ) : null}
    </div>
  );
}
