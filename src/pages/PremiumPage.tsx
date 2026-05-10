import { PremiumHubPanel } from '../components/premium/PremiumHubPanel';
import { useUserAccess } from '../context/UserAccessContext';
import { hasPremiumEntitlements } from '../lib/authFlow';
import styles from './PremiumPage.module.css';

export default function PremiumPage() {
  const { access, profile, user } = useUserAccess();
  const isAdminUser =
    access.isAdmin || profile?.is_admin === true || profile?.role === 'admin';
  const hasPremiumAccess = hasPremiumEntitlements(access, profile);

  return (
    <div className={styles.premiumPage}>
      <PremiumHubPanel
        hasPremiumAccess={hasPremiumAccess}
        isAdminUser={isAdminUser}
        userId={user?.id ?? null}
      />
    </div>
  );
}
