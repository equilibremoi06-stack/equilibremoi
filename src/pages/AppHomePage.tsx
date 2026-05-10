import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { hasClassiqueOnboardingComplete, loadClassiqueSnapshot } from '../lib/appSession';
import { getCurrentUser, getCurrentUserAccess } from '../lib/authFlow';
import { getUserOnboardingStatus, markQuestionnaireCompleted, restoreCompletedOnboardingLocally } from '../lib/onboardingStatus';
import { getStoredParcours, isUserParcours, setStoredParcours, type UserParcours } from '../lib/userParcours';
import MenopauseDashboardPage from './MenopauseDashboardPage';
import QuestionnaireClassiquePage from './QuestionnaireClassiquePage';

/**
 * Accueil principal après onboarding : programme + onglets.
 * Redirige vers /onboarding si le questionnaire classique n’est pas terminé.
 */
export default function AppHomePage() {
  const [searchParams] = useSearchParams();
  const requestedParcours = searchParams.get('parcours');
  const [resolved, setResolved] = useState(false);
  const [shouldRedirectOnboarding, setShouldRedirectOnboarding] = useState(false);
  const [dashboardParcours, setDashboardParcours] = useState<UserParcours | null>(null);

  useEffect(() => {
    let mounted = true;
    setResolved(false);
    setShouldRedirectOnboarding(false);

    const resolveAccess = async () => {
        const { user, access } = await getCurrentUserAccess();
        if (!user) {
          if (!mounted) return;
          setShouldRedirectOnboarding(true);
          setResolved(true);
          return;
        }

      const status = await getUserOnboardingStatus(user);
      const forcedParcours = isUserParcours(requestedParcours) ? requestedParcours : null;
      if (!mounted) return;

      if (forcedParcours && (status.onboardingCompleted || access.isAdmin)) {
        if (access.isAdmin) {
          setStoredParcours(forcedParcours);
        }
        restoreCompletedOnboardingLocally({
          ...status,
          onboardingCompleted: true,
          parcoursType: forcedParcours,
        });
        setDashboardParcours(forcedParcours);
        setResolved(true);
        return;
      }

      if (status.onboardingCompleted) {
        restoreCompletedOnboardingLocally(status);
        const nextParcours =
          forcedParcours && forcedParcours === status.parcoursType
            ? forcedParcours
            : status.parcoursType ?? getStoredParcours() ?? 'classique';
        setDashboardParcours(nextParcours);
        setResolved(true);
        return;
      }

      const localSnapshot = loadClassiqueSnapshot();
      if (hasClassiqueOnboardingComplete() && localSnapshot) {
        await markQuestionnaireCompleted(user, 'classique', localSnapshot);
        if (!mounted) return;
        setDashboardParcours('classique');
        setResolved(true);
        return;
      }

      setShouldRedirectOnboarding(true);
      setResolved(true);
    };

    void resolveAccess();
    return () => {
      mounted = false;
    };
  }, [requestedParcours]);

  useEffect(() => {
    if (dashboardParcours !== 'classique') return;
    const snapshot = loadClassiqueSnapshot();
    if (!snapshot) return;
    void getCurrentUser().then((user) => {
      if (!user) return;
      return markQuestionnaireCompleted(user, 'classique', snapshot);
    });
  }, [dashboardParcours]);

  if (!resolved) {
    return null;
  }

  if (shouldRedirectOnboarding || !dashboardParcours) {
    return <Navigate to="/onboarding" replace />;
  }

  const initialTab = searchParams.get('tab') ?? undefined;

  if (dashboardParcours === 'menopause') {
    return <MenopauseDashboardPage initialTab={initialTab} />;
  }

  if (!hasClassiqueOnboardingComplete() || !loadClassiqueSnapshot()) {
    return <Navigate to="/onboarding" replace />;
  }

  return <QuestionnaireClassiquePage flow="app" initialTabFromUrl={initialTab} />;
}
