import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SeasonalLayout } from './components/seasonal/SeasonalLayout';
import { SeasonalThemeProvider } from './hooks/useSeasonalTheme';
import ChoixParcoursEntryPage from './pages/ChoixParcoursEntryPage';
import HomePage from './pages/HomePage';
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
                <Route
                  path="/choix-parcours"
                  element={<ChoixParcoursEntryPage />}
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
