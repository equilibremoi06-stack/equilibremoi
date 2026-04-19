import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SeasonalAnimation from './components/seasonal/SeasonalAnimation';
import { SeasonalLayout } from './components/seasonal/SeasonalLayout';
import { SeasonalThemeProvider } from './hooks/useSeasonalTheme';
import ChoixParcoursPage from './pages/ChoixParcoursPage';
import QuestionnaireClassiquePage from './pages/QuestionnaireClassiquePage';
import QuestionnaireMenopausePage from './pages/QuestionnaireMenopausePage';

function App() {
  return (
    <BrowserRouter>
      <div className="seasonal-app-column">
        <SeasonalAnimation />
        <div className="seasonal-main-wrap">
          <SeasonalThemeProvider>
            <SeasonalLayout>
              <Routes>
                <Route path="/" element={<ChoixParcoursPage />} />
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
