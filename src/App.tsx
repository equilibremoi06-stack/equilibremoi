import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import { SeasonalLayout } from './components/seasonal/SeasonalLayout';
import { SeasonalThemeProvider } from './hooks/useSeasonalTheme';
import { UserAccessProvider } from './context/UserAccessContext';
import { ensureSessionUserId } from './lib/appSession';
import AppHomePage from './pages/AppHomePage';
import AuthPage from './pages/AuthPage';
import AuthResetPasswordPage from './pages/AuthResetPasswordPage';

import AuthVerifyPage from './pages/AuthVerifyPage';
import ChoixParcoursPage from './pages/ChoixParcoursPage';
import OffersPage from './pages/OffersPage';
import OnboardingEntryPage from './pages/OnboardingEntryPage';
import QuestionnaireClassiquePage from './pages/QuestionnaireClassiquePage';
import QuestionnaireMenopausePage from './pages/QuestionnaireMenopausePage';
import PremiumPage from './pages/PremiumPage';

function App() {
  useEffect(() => {
    ensureSessionUserId();
  }, []);

  return (
    <BrowserRouter>
      <UserAccessProvider>
        <div className="seasonal-app-column">
          <div className="seasonal-main-wrap">
            <SeasonalThemeProvider>
              <SeasonalLayout>
                <Routes>
                <Route path="/" element={<OffersPage />} />
                <Route path="/landing" element={<Navigate to="/offres" replace />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/reset-password" element={<AuthResetPasswordPage />} />
                <Route path="/auth/verify" element={<AuthVerifyPage />} />

                <Route path="/offres" element={<OffersPage />} />
                <Route path="/home" element={<Navigate to="/app" replace />} />
                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <AppHomePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <RequireAuth>
                      <OnboardingEntryPage />
                    </RequireAuth>
                  }
                />
                <Route path="/program" element={<Navigate to="/app?tab=programme" replace />} />
                <Route path="/choix-parcours" element={<ChoixParcoursPage />} />
                <Route
                  path="/questionnaire-classique"
                  element={
                    <RequireAuth>
                      <QuestionnaireClassiquePage flow="questionnaire" />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/questionnaire-menopause"
                  element={
                    <RequireAuth>
                      <QuestionnaireMenopausePage />
                    </RequireAuth>
                  }
                />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="*" element={<Navigate to="/offres" replace />} />
                </Routes>
              </SeasonalLayout>
            </SeasonalThemeProvider>
          </div>
        </div>
      </UserAccessProvider>
    </BrowserRouter>
  );
}

export default App;
