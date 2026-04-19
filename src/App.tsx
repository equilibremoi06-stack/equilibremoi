import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SeasonalLayout } from './components/seasonal/SeasonalLayout';
import { SeasonalThemeProvider } from './hooks/useSeasonalTheme';
import ChoixParcoursEntryPage from './pages/ChoixParcoursEntryPage';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import QuestionnaireClassiquePage from './pages/QuestionnaireClassiquePage';
import QuestionnaireMenopausePage from './pages/QuestionnaireMenopausePage';

function App() {
  return (
    <BrowserRouter>
      <div className="seasonal-app-column">
        <div className="seasonal-main-wrap">
          <SeasonalThemeProvider>
            <SeasonalLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/app" element={<ChoixParcoursEntryPage />} />
                <Route
                  path="/choix-parcours"
                  element={<Navigate to="/app" replace />}
                />
                <Route
                  path="/questionnaire-classique"
                  element={<QuestionnaireClassiquePage />}
                />
                <Route
                  path="/questionnaire-menopause"
                  element={<QuestionnaireMenopausePage />}
                />
              </Routes>
            </SeasonalLayout>
          </SeasonalThemeProvider>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
