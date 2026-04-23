import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  hasClassiqueOnboardingComplete,
  loadClassiqueSnapshot,
  setClassiqueOnboardingComplete,
} from '../lib/appSession';
import ChoixParcoursEntryPage from './ChoixParcoursEntryPage';

/**
 * Entrée onboarding : disclaimer médical + choix de parcours.
 * Si le questionnaire classique est déjà terminé (avec données), accès direct à l’app.
 */
export default function OnboardingEntryPage() {
  useEffect(() => {
    if (hasClassiqueOnboardingComplete() && !loadClassiqueSnapshot()) {
      setClassiqueOnboardingComplete(false);
    }
  }, []);

  if (hasClassiqueOnboardingComplete() && loadClassiqueSnapshot()) {
    return <Navigate to="/app" replace />;
  }

  return <ChoixParcoursEntryPage />;
}
