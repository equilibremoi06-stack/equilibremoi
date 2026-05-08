import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import { SeasonalLayout } from './components/seasonal/SeasonalLayout';
import { SeasonalThemeProvider } from './hooks/useSeasonalTheme';
import { ensureSessionUserId } from './lib/appSession';
import AppHomePage from './pages/AppHomePage';
import AuthPage from './pages/AuthPage';
import AuthResetPasswordPage from './pages/AuthResetPasswordPage';

import AuthVerifyPage from './pages/AuthVerifyPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import OnboardingEntryPage from './pages/OnboardingEntryPage';
import QuestionnaireClassiquePage from './pages/QuestionnaireClassiquePage';
import QuestionnaireMenopausePage from './pages/QuestionnaireMenopausePage';

function App() {
  useEffect(() => {
    ensureSessionUserId();
  }, []);

  return (
    <BrowserRouter>
      <div className="seasonal-app-column">
        <div className="seasonal-main-wrap">
          <SeasonalThemeProvider>
            <SeasonalLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/landing" replace />} />
                <Route path="/landing" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/reset-password" element={<AuthResetPasswordPage />} />
                <Route path="/auth/verify" element={<AuthVerifyPage />} />

                <Route path="/offres" element={<LandingPage />} />
                <Route path="/home" element={<Navigate to="/app" replace />} />
                <Route
                  path="/app"
                  element={
                    <RequireAuth>
                      <AppHomePage />
                    </RequireAuth>
                  }
                />
                <Route path="/onboarding" element={<OnboardingEntryPage />} />
                <Route path="/program" element={<Navigate to="/app?tab=programme" replace />} />
                <Route path="/choix-parcours" element={<Navigate to="/onboarding" replace />} />
                <Route
                  path="/questionnaire-classique"
                  element={<QuestionnaireClassiquePage flow="questionnaire" />}
                />
                <Route
                  path="/questionnaire-menopause"
                  element={<QuestionnaireMenopausePage />}
                />
                <Route path="/premium" element={<Navigate to="/offres" replace />} />
                <Route path="*" element={<Navigate to="/landing" replace />} />
              </Routes>
            </SeasonalLayout>
          </SeasonalThemeProvider>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
