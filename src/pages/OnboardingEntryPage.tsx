import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  hasClassiqueOnboardingComplete,
  loadClassiqueSnapshot,
} from '../lib/appSession';
import { getCurrentUser } from '../lib/authFlow';
import {
  getUserOnboardingStatus,
  markQuestionnaireCompleted,
  restoreCompletedOnboardingLocally,
} from '../lib/onboardingStatus';
import { getStoredParcours } from '../lib/userParcours';
import ChoixParcoursEntryPage from './ChoixParcoursEntryPage';

/**
 * Entrée onboarding : disclaimer médical + choix de parcours.
 * Si le questionnaire classique est déjà terminé (avec données), accès direct à l’app.
 */
export default function OnboardingEntryPage() {
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const resolveRoute = async () => {
      const localSnapshot = loadClassiqueSnapshot();
      const user = await getCurrentUser();

      if (user) {
        const status = await getUserOnboardingStatus(user);
        if (!mounted) return;

        if (status.onboardingCompleted) {
          restoreCompletedOnboardingLocally(status);
          setRedirectTo('/app');
          setResolved(true);
          return;
        }

        if (hasClassiqueOnboardingComplete() && localSnapshot) {
          await markQuestionnaireCompleted(user, 'classique', localSnapshot);
          if (!mounted) return;
          setRedirectTo('/app');
          setResolved(true);
          return;
        }

        const parcoursFromStatus = status.parcoursType;
        if (parcoursFromStatus === 'menopause') {
          setRedirectTo('/questionnaire-menopause');
        } else if (parcoursFromStatus === 'classique') {
          setRedirectTo('/questionnaire-classique');
        }
        setResolved(true);
        return;
      }

      if (hasClassiqueOnboardingComplete() && localSnapshot) {
        setRedirectTo('/app');
      }
      setResolved(true);
    };

    void resolveRoute();
    return () => {
      mounted = false;
    };
  }, []);

  if (!resolved) {
    return null;
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  const parcours = getStoredParcours();
  if (parcours === 'menopause') {
    return <Navigate to="/questionnaire-menopause" replace />;
  }

  if (parcours === 'classique') {
    return <Navigate to="/questionnaire-classique" replace />;
  }

  return <ChoixParcoursEntryPage />;
}
