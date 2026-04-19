import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SeasonalLayout } from './components/seasonal/SeasonalLayout';
import { SeasonalThemeProvider } from './hooks/useSeasonalTheme';
import ChoixParcoursPage from './pages/ChoixParcoursPage';
import QuestionnaireClassiquePage from './pages/QuestionnaireClassiquePage';
import QuestionnaireMenopausePage from './pages/QuestionnaireMenopausePage';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
