import { Navigate, useSearchParams } from 'react-router-dom';
import { hasClassiqueOnboardingComplete, loadClassiqueSnapshot } from '../lib/appSession';
import QuestionnaireClassiquePage from './QuestionnaireClassiquePage';

/**
 * Accueil principal après onboarding : programme + onglets.
 * Redirige vers /onboarding si le questionnaire classique n’est pas terminé.
 */
export default function AppHomePage() {
  const [searchParams] = useSearchParams();

  if (!hasClassiqueOnboardingComplete()) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!loadClassiqueSnapshot()) {
    return <Navigate to="/onboarding" replace />;
  }

  const initialTab = searchParams.get('tab') ?? undefined;

  return <QuestionnaireClassiquePage flow="app" initialTabFromUrl={initialTab} />;
}
