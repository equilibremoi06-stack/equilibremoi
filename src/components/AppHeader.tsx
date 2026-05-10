import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyUserFlags, hasPremiumEntitlements } from '../lib/authFlow';
import { useUserAccess } from '../context/UserAccessContext';
import AvatarUser from './AvatarUser';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const location = useLocation();
  const { user, profile, access } = useUserAccess();
  const premiumActive = hasPremiumEntitlements(access, profile);

  useEffect(() => {
    if (user) {
      applyUserFlags(user, profile ?? undefined);
    }
  }, [user, profile]);

  const showAvatar = Boolean(user) && !['/login', '/auth'].includes(location.pathname);
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <h1 className={styles.logoText}>EquilibreMoi</h1>
          <p className={styles.logoSub}>bien-être féminin</p>
          {premiumActive ? (
            <span className={styles.premiumHeaderPill} title="Premium actif">
              Premium actif ✨
            </span>
          ) : null}
        </div>
        <div className={styles.userBlock}>
          {showAvatar ? <AvatarUser user={user} /> : null}
        </div>
      </div>
    </header>
  );
}
