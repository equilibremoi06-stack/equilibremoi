import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyQuotePopup } from '../components/DailyQuotePopup';
import type { DietType, Meal as EngineMeal } from '../data/mealDatabase';
import {
  getIngredientDisplayParts,
  RECIPE_PORTION_DISCLAIMER,
  resolveRecipeForMeal,
  type Recipe,
} from '../data/recipeLibrary';
import {
  canAccessRecipesAdmin,
  createEmptyAdminRecipe,
  deleteCustomRecipe,
  getRecipeOfDay,
  listRecipesForApp,
  upsertCustomRecipe,
  type RecipeCatalogItem,
  type RecipeMealTime,
} from '../data/recipesHub';
import { getCurrentUser } from '../lib/authFlow';
import { buildProgressSummary, type WeightEntry } from '../data/progressTracking';
import {
  buildPersonalizationSummary,
  buildSeasonNote,
  generateProgram,
  getCurrentSeason,
  getDailyReplacementLimit,
  replaceMeal,
  type GeneratedWeek,
  type UserFoodProfile,
} from '../lib/menuEngine';
import { type ClassiqueSnapshotV1, loadClassiqueSnapshot, persistClassiqueSnapshot } from '../lib/appSession';
import { getCoursesDaysLimit } from '../lib/shoppingList';
import styles from './QuestionnaireClassiquePage.module.css';

type TimelineOption = '1 mois' | '2 mois' | '3 mois' | '6 mois' | '+6 mois';
type DietOption = 'Omnivore' | 'Végétarienne' | 'Végétalienne' | 'Pescétarienne';
type BudgetOption = '20€' | '30€' | '40€' | '50€' | '60€ et +';
type RhythmOption = 'Calme' | 'Actif' | 'Très actif';
type Phase = 'questions' | 'goalValidation' | 'analyzing' | 'result';

type MealSlot = 'breakfast' | 'lunch' | 'dinner';
type AppTab = 'accueil' | 'programme' | 'recettes' | 'courses' | 'suivi' | 'besoin' | 'profil';
type EmotionKey = 'sereine' | 'fatiguee' | 'motivee' | 'stressee';

const STEP_LABELS = ['Ton objectif', 'Ton alimentation', 'Tes préférences', 'Ton budget', 'Ton quotidien'] as const;
const TIMELINE_OPTIONS: TimelineOption[] = ['1 mois', '2 mois', '3 mois', '6 mois', '+6 mois'];
const DIET_OPTIONS: DietOption[] = ['Omnivore', 'Végétarienne', 'Végétalienne', 'Pescétarienne'];
const BUDGET_OPTIONS: BudgetOption[] = ['20€', '30€', '40€', '50€', '60€ et +'];
const RHYTHM_OPTIONS: RhythmOption[] = ['Calme', 'Actif', 'Très actif'];
const ANALYSIS_STEPS = [
  'On analyse tes réponses…',
  'On comprend ton rythme et ton quotidien…',
  'On adapte les repas à ton objectif…',
  'On construit quelque chose de réaliste pour toi…',
  'On crée ton équilibre personnalisé… ✨',
] as const;
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
const APP_TABS: { id: AppTab; label: string }[] = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'programme', label: 'Programme' },
  { id: 'recettes', label: 'Recettes' },
  { id: 'courses', label: 'Courses' },
  { id: 'suivi', label: 'Suivi' },
  { id: 'besoin', label: 'Besoin du moment' },
  { id: 'profil', label: 'Profil' },
];

const APP_TAB_IDS: AppTab[] = APP_TABS.map((t) => t.id);
const ADMIN_EMAIL = 'equilibremoi.06@gmail.com';

function isAppTab(value: string | undefined): value is AppTab {
  return Boolean(value && APP_TAB_IDS.includes(value as AppTab));
}
const SLOT_MEAL_LABEL: Record<MealSlot, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
};

/** Emojis moment de la journée (cartes repas + en-tête recette) */
const SLOT_TIME_EMOJI: Record<MealSlot, string> = {
  breakfast: '🌞',
  lunch: '☀️',
  dinner: '🌙',
};

const MEAL_ENERGY_LINE: Record<string, string> = {
  light: 'Repas léger',
  balanced: 'Repas équilibré',
  satisfying: 'Repas rassasiant',
};

const DAILY_MOTIVATIONS = [
  'On avance en douceur à ton rythme 💛',
  'Chaque petit pas compte ✨',
  'Tu prends soin de toi aujourd’hui 🌿',
] as const;

function dailyMotivationLine(): string {
  const d = new Date();
  const seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  return DAILY_MOTIVATIONS[seed % DAILY_MOTIVATIONS.length];
}

function dayValidatedLabel(count: number): string {
  if (count === 0) return 'Aucun repas validé sur 3';
  if (count === 1) return '1 repas validé sur 3';
  return `${count} repas validés sur 3`;
}

function parseTextList(raw: string): string[] {
  return raw
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildProgrammeRecipeBadges(recipe: Recipe | undefined, meal: EngineMeal): string[] {
  const out: string[] = [];
  const prepMin = recipe?.prepMinutes ?? (meal.prepTime === 'quick' ? 12 : 28);
  if (prepMin <= 20) {
    out.push('⏱️ Rapide');
  }
  if (recipe?.tags.includes('leger') || meal.caloriesLevel === 'light') {
    out.push('🌿 Léger');
  }
  if (meal.caloriesLevel === 'satisfying' || recipe?.tags.includes('protein')) {
    out.push('🔥 Satiété');
  }
  if (out.length === 0) {
    out.push('🌿 Recette équilibrée');
  }
  return [...new Set(out)].slice(0, 3);
}

const SEASON_TAG_LABEL: Record<string, string> = {
  spring: 'Printemps frais',
  summer: 'Été léger',
  autumn: 'Automne doux',
  winter: 'Hiver cocooning',
};

const SEASON_FR: Record<string, string> = {
  spring: 'printemps',
  summer: 'été',
  autumn: 'automne',
  winter: 'hiver',
};

const RECIPE_CATEGORY_LABEL: Record<string, string> = {
  rapide: 'Rapide',
  plaisir: 'Plaisir',
  vegetarien: 'Végétarien',
  leger: 'Léger',
  protein: 'Protéiné',
  'petit-budget': 'Petit budget',
  equilibre: 'Équilibre',
};

const EMOTION_MESSAGES: Record<EmotionKey, string> = {
  sereine: '🌿 Tu es dans un bon équilibre aujourd’hui, continue comme ça ✨',
  fatiguee: '💖 Ton corps te parle, prends soin de toi avec douceur aujourd’hui',
  motivee: '🔥 Cette énergie est précieuse, profite-en pour avancer à ton rythme',
  stressee: '🌸 Respire… tu fais déjà de ton mieux, un petit pas suffit aujourd’hui',
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const splitKeywords = (raw: string) =>
  raw
    .split(/[,;]+/)
    .map((part) => normalize(part))
    .filter((part) => part.length >= 3);

const estimateComfortTimeline = (kg: number) => {
  if (!Number.isFinite(kg) || kg <= 0) return null;
  const minMonths = Math.max(2, Math.ceil(kg / 2));
  const maxMonths = Math.max(minMonths, Math.ceil(kg / 1.5));
  return { minMonths, maxMonths };
};

const toTimelineWeeks = (selected: TimelineOption | '') => {
  if (selected === '1 mois') return 4;
  if (selected === '2 mois') return 8;
  if (selected === '3 mois') return 12;
  if (selected === '6 mois') return 24;
  if (selected === '+6 mois') return 32;
  return 8;
};

const budgetToNumber = (selected: BudgetOption | '') => {
  if (selected === '20€') return 20;
  if (selected === '30€') return 30;
  if (selected === '40€') return 40;
  if (selected === '50€') return 50;
  if (selected === '60€ et +') return 60;
  return null;
};

type GoalValidation = {
  requestedTargetKg: number;
  requestedTimeframeWeeks: number;
  adjustedTargetKg: number;
  adjustedTimeframeWeeks: number;
  requestedRate: number;
  isAdjusted: boolean;
  message: string;
};

function validateGoal(weightLoss: number, timeframeWeeks: number): GoalValidation {
  const safeKg = Number.isFinite(weightLoss) && weightLoss > 0 ? weightLoss : 0;
  const safeWeeks = Math.max(1, timeframeWeeks);
  const requestedRate = safeKg / safeWeeks;
  const minHealthyRate = 0.5;
  const maxHealthyRate = 1;

  if (safeKg === 0) {
    return {
      requestedTargetKg: 0,
      requestedTimeframeWeeks: safeWeeks,
      adjustedTargetKg: 0,
      adjustedTimeframeWeeks: safeWeeks,
      requestedRate: 0,
      isAdjusted: false,
      message: 'On part sur une progression douce et durable, à ton rythme.',
    };
  }

  const minWeeksForHealthyPace = Math.ceil(safeKg / maxHealthyRate);
  if (requestedRate > maxHealthyRate) {
    const adjustedWeeks = Math.max(safeWeeks, minWeeksForHealthyPace);
    const maxReasonableWeeks = 40;
    if (adjustedWeeks > maxReasonableWeeks) {
      const adjustedKg = Math.max(1, Math.round(safeWeeks * maxHealthyRate));
      return {
        requestedTargetKg: safeKg,
        requestedTimeframeWeeks: safeWeeks,
        adjustedTargetKg: adjustedKg,
        adjustedTimeframeWeeks: safeWeeks,
        requestedRate,
        isAdjusted: true,
        message:
          'Ton objectif est ambitieux ❤️ Et c’est une très belle intention. On l’adapte pour qu’il reste doux, réaliste et surtout durable dans le temps.',
      };
    }
    return {
      requestedTargetKg: safeKg,
      requestedTimeframeWeeks: safeWeeks,
      adjustedTargetKg: safeKg,
      adjustedTimeframeWeeks: adjustedWeeks,
      requestedRate,
      isAdjusted: true,
      message:
        'Ton objectif est ambitieux ❤️ Et c’est une très belle intention. On l’adapte pour qu’il reste doux, réaliste et surtout durable dans le temps.',
    };
  }

  if (requestedRate < minHealthyRate) {
    return {
      requestedTargetKg: safeKg,
      requestedTimeframeWeeks: safeWeeks,
      adjustedTargetKg: safeKg,
      adjustedTimeframeWeeks: safeWeeks,
      requestedRate,
      isAdjusted: false,
      message: 'On garde un rythme progressif et confortable pour tenir sur la durée ✨',
    };
  }

  return {
    requestedTargetKg: safeKg,
    requestedTimeframeWeeks: safeWeeks,
    adjustedTargetKg: safeKg,
    adjustedTimeframeWeeks: safeWeeks,
    requestedRate,
    isAdjusted: false,
    message: 'Parfait, ton objectif est déjà dans une zone douce et réaliste.',
  };
}

function formatWeeksToTimelineLabel(weeks: number): string {
  const months = Math.round((weeks / 4) * 10) / 10;
  if (Number.isInteger(months)) {
    return `${months} mois`;
  }
  return `${months.toString().replace('.', ',')} mois`;
}

type QuestionnaireClassiquePageProps = {
  /** questionnaire : parcours complet. app : accueil principal (données restaurées). */
  flow?: 'questionnaire' | 'app';
  /** Ex. `programme` depuis `/app?tab=programme` */
  initialTabFromUrl?: string;
};

export default function QuestionnaireClassiquePage({
  flow = 'questionnaire',
  initialTabFromUrl,
}: QuestionnaireClassiquePageProps) {
  const snapshot = flow === 'app' ? loadClassiqueSnapshot() : null;

  const defaultActiveDay = () => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  };

  const [step, setStep] = useState(() => snapshot?.step ?? 1);
  const [phase, setPhase] = useState<Phase>(() =>
    flow === 'app' && snapshot?.phase === 'result' ? 'result' : 'questions',
  );
  const [analysisIndex, setAnalysisIndex] = useState(() => snapshot?.analysisIndex ?? 0);
  const [targetKg, setTargetKg] = useState(() => snapshot?.targetKg ?? '');
  const [timeline, setTimeline] = useState<TimelineOption | ''>(
    () => (snapshot?.timeline as TimelineOption | '') ?? '',
  );
  const [diet, setDiet] = useState<DietOption | ''>(() => (snapshot?.diet as DietOption | '') ?? '');
  const [allergies, setAllergies] = useState(() => snapshot?.allergies ?? '');
  const [dislikes, setDislikes] = useState(() => snapshot?.dislikes ?? '');
  const [budget, setBudget] = useState<BudgetOption | ''>(() => (snapshot?.budget as BudgetOption | '') ?? '');
  const [rhythm, setRhythm] = useState<RhythmOption | ''>(() => (snapshot?.rhythm as RhythmOption | '') ?? '');
  const [activeWeek, setActiveWeek] = useState(() => snapshot?.activeWeek ?? 0);
  const [activeDay, setActiveDay] = useState(() => snapshot?.activeDay ?? defaultActiveDay());
  const [programWeeks, setProgramWeeks] = useState<GeneratedWeek[]>(() => snapshot?.programWeeks ?? []);
  const [validationState, setValidationState] = useState<Record<string, boolean>>(
    () => snapshot?.validationState ?? {},
  );
  const [replaceCountByDay, setReplaceCountByDay] = useState<Record<string, number>>(
    () => snapshot?.replaceCountByDay ?? {},
  );
  const [replaceInfo, setReplaceInfo] = useState(() => snapshot?.replaceInfo ?? '');
  const [goalValidationResult, setGoalValidationResult] = useState<GoalValidation | null>(() =>
    snapshot?.goalValidationResult ? { ...snapshot.goalValidationResult } : null,
  );
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (isAppTab(initialTabFromUrl)) {
      return initialTabFromUrl;
    }
    if (snapshot?.activeTab && isAppTab(snapshot.activeTab)) {
      return snapshot.activeTab;
    }
    return 'accueil';
  });
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(
    () => (snapshot?.selectedEmotion as EmotionKey | null) ?? null,
  );
  const [coursesDays, setCoursesDays] = useState(() => snapshot?.coursesDays ?? 7);
  const [recipeModal, setRecipeModal] = useState<{ meal: EngineMeal; slot: MealSlot } | null>(null);
  const [recipeCatalog, setRecipeCatalog] = useState<RecipeCatalogItem[]>([]);
  const [selectedCatalogRecipe, setSelectedCatalogRecipe] = useState<RecipeCatalogItem | null>(null);
  const [recipesAdminEnabled, setRecipesAdminEnabled] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [adminRecipeDraft, setAdminRecipeDraft] = useState<RecipeCatalogItem>(() => createEmptyAdminRecipe());
  const [adminEditingId, setAdminEditingId] = useState<string | null>(null);
  const [recipeImageErrors, setRecipeImageErrors] = useState<Record<string, boolean>>({});
  const [addedToWeekIds, setAddedToWeekIds] = useState<Record<string, boolean>>({});
  const [activeRecipeFilter, setActiveRecipeFilter] = useState<
    'Tout' | 'Petit-déj' | 'Déjeuner' | 'Dîner' | 'Rapide' | 'Léger' | 'Protéiné'
  >('Tout');
  const [openedRecipeRows, setOpenedRecipeRows] = useState<Record<string, boolean>>({});
  const [displayedRecipesByMeal, setDisplayedRecipesByMeal] = useState<
    Record<'matin' | 'midi' | 'soir', RecipeCatalogItem[]>
  >({
    matin: [],
    midi: [],
    soir: [],
  });
  const totalSteps = 5;
  const navigate = useNavigate();

  const hydrateProgramOnceRef = useRef(false);

  const analyzingPayloadRef = useRef({
    step,
    targetKg,
    timeline,
    diet,
    allergies,
    dislikes,
    budget,
    rhythm,
    activeWeek,
    activeDay,
    goalValidationResult,
    validationState,
    replaceCountByDay,
    replaceInfo,
    activeTab,
    selectedEmotion,
    coursesDays,
    analysisIndex,
  });
  analyzingPayloadRef.current = {
    step,
    targetKg,
    timeline,
    diet,
    allergies,
    dislikes,
    budget,
    rhythm,
    activeWeek,
    activeDay,
    goalValidationResult,
    validationState,
    replaceCountByDay,
    replaceInfo,
    activeTab,
    selectedEmotion,
    coursesDays,
    analysisIndex,
  };

  useEffect(() => {
    if (isAppTab(initialTabFromUrl)) {
      setActiveTab(initialTabFromUrl);
    }
  }, [initialTabFromUrl]);

  useEffect(() => {
    if (!selectedCatalogRecipe) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedCatalogRecipe]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        const email = user?.email?.toLowerCase?.() ?? '';
        setCurrentUserEmail(email);
        setRecipesAdminEnabled(email === ADMIN_EMAIL || canAccessRecipesAdmin(user?.email));
      })
      .catch(() => {
        setCurrentUserEmail('');
        setRecipesAdminEnabled(false);
      });
    setRecipeCatalog(listRecipesForApp());
  }, []);

  const refreshRecipeCatalog = () => {
    setRecipeCatalog(listRecipesForApp());
  };

  const recipeOfDay = useMemo(() => getRecipeOfDay(recipeCatalog), [recipeCatalog]);
  const recipeOfDayId = recipeOfDay?.id;
  const filteredRecipes = useMemo(
    () => recipeCatalog.filter((r) => r.id !== recipeOfDayId),
    [recipeCatalog, recipeOfDayId],
  );
  useEffect(() => {
    const grouped: Record<'matin' | 'midi' | 'soir', RecipeCatalogItem[]> = {
      matin: filteredRecipes.filter((r) => r.mealTime === 'matin' && r.id !== recipeOfDayId).slice(0, 4),
      midi: filteredRecipes.filter((r) => r.mealTime === 'midi' && r.id !== recipeOfDayId).slice(0, 4),
      soir: filteredRecipes.filter((r) => r.mealTime === 'soir' && r.id !== recipeOfDayId).slice(0, 4),
    };
    setDisplayedRecipesByMeal(grouped);
  }, [filteredRecipes, recipeOfDayId]);
  type VisualMealBucket = 'breakfast' | 'lunch' | 'dinner';
  type VisualRecipeEntry = {
    recipe: RecipeCatalogItem;
    originMealTime: 'matin' | 'midi' | 'soir';
    originIndex: number;
    bucket: VisualMealBucket;
  };

  const inferMealBucket = (
    recipe: RecipeCatalogItem,
    fallbackSection?: 'matin' | 'midi' | 'soir',
  ): VisualMealBucket => {
    const title = normalize(recipe.title);
    const tagsText = recipe.tags.map(normalize).join(' ');
    const category = normalize(recipe.category);
    const mealTime = normalize(recipe.mealTime ?? '');
    const full = `${title} ${tagsText} ${category}`;

    const breakfastHints = [
      'yaourt',
      'granola',
      'porridge',
      'tartine',
      'toast',
      'bowl yaourt',
      'fruits',
      'pancake',
      'banane',
      'pomme cannelle',
      'muesli',
      'pudding chia',
      'overnight oats',
      'brioche',
      'croissant',
      'petit dejeuner',
    ];
    const lunchDinnerHints = [
      'poulet',
      'saumon',
      'poisson',
      'pates',
      'pâtes',
      'curry',
      'salade repas',
      'quinoa',
      'riz',
      'feta',
      'lentilles',
      'wrap',
      'falafel',
      'soupe',
      'veloute',
      'velouté',
      'gratin',
      'burger',
      'pizza',
      'thon',
      'crevette',
    ];

    const hasBreakfastHint = breakfastHints.some((w) => title.includes(normalize(w)));
    const hasLunchDinnerHint = lunchDinnerHints.some((w) => title.includes(normalize(w)));

    if (hasLunchDinnerHint) {
      if (mealTime.includes('soir') || title.includes('diner') || title.includes('dîner') || full.includes('dinner')) {
        return 'dinner';
      }
      return 'lunch';
    }
    if (hasBreakfastHint) return 'breakfast';

    if (mealTime.includes('matin') || mealTime.includes('petit') || mealTime.includes('breakfast')) return 'breakfast';
    if (mealTime.includes('midi') || mealTime.includes('dejeuner') || mealTime.includes('déjeuner') || mealTime.includes('lunch')) {
      return 'lunch';
    }
    if (mealTime.includes('soir') || mealTime.includes('diner') || mealTime.includes('dîner') || mealTime.includes('dinner')) {
      return 'dinner';
    }

    if (fallbackSection === 'matin') return 'breakfast';
    if (fallbackSection === 'midi') return 'lunch';
    if (fallbackSection === 'soir') return 'dinner';

    if (full.includes('dejeuner') || full.includes('déjeuner') || full.includes('lunch')) return 'lunch';
    if (full.includes('diner') || full.includes('dîner') || full.includes('dinner')) return 'dinner';
    return 'breakfast';
  };
  const getRecipeMealType = (
    recipe: RecipeCatalogItem,
    sectionId?: 'matin' | 'midi' | 'soir',
  ): VisualMealBucket => inferMealBucket(recipe, sectionId);
  const getDisplayMealLabel = (
    recipe: RecipeCatalogItem,
    sectionId?: 'matin' | 'midi' | 'soir',
  ): string => {
    const bucket = getRecipeMealType(recipe, sectionId);
    if (bucket === 'breakfast') return 'Petit-déjeuner';
    if (bucket === 'lunch') return 'Déjeuner';
    return 'Dîner';
  };

  const isPremium = useMemo(() => localStorage.getItem('isPremium') === 'true', []);
  const isAdminUser = currentUserEmail === ADMIN_EMAIL;
  const hasPremiumAccess = isPremium || isAdminUser;
  const parsedKg = Number(targetKg);
  const timeframeWeeks = toTimelineWeeks(timeline);
  const targetTooFast = goalValidationResult?.isAdjusted ?? false;
  const targetFastWarning = parsedKg >= 5 && (timeline === '1 mois' || timeline === '2 mois');
  const comfortTimeline = estimateComfortTimeline(parsedKg);
  const changesPerDay = getDailyReplacementLimit(hasPremiumAccess);
  const season = getCurrentSeason();
  const seasonNote = buildSeasonNote(season);

  const displayedWeeks = useMemo(() => toTimelineWeeks(timeline), [timeline]);
  const rotationWeeks = Math.max(8, displayedWeeks);

  useEffect(() => {
    if (phase !== 'analyzing') return undefined;
    let tick = 0;
    const interval = window.setInterval(() => {
      tick += 1;
      if (tick < ANALYSIS_STEPS.length) {
        setAnalysisIndex(tick);
      }
    }, 1200);
    const done = window.setTimeout(() => {
      window.clearInterval(interval);
      const p = analyzingPayloadRef.current;
      if (flow === 'questionnaire') {
        const snap: ClassiqueSnapshotV1 = {
          v: 1,
          phase: 'result',
          step: p.step,
          analysisIndex: ANALYSIS_STEPS.length - 1,
          targetKg: p.targetKg,
          timeline: p.timeline || '',
          diet: p.diet || '',
          allergies: p.allergies,
          dislikes: p.dislikes,
          budget: p.budget || '',
          rhythm: p.rhythm || '',
          activeWeek: p.activeWeek,
          activeDay: p.activeDay,
          goalValidationResult: p.goalValidationResult,
          validationState: p.validationState,
          replaceCountByDay: p.replaceCountByDay,
          replaceInfo: p.replaceInfo,
          activeTab: p.activeTab,
          selectedEmotion: p.selectedEmotion,
          coursesDays: p.coursesDays,
        };
        persistClassiqueSnapshot(snap);
        navigate('/app', { replace: true });
      } else {
        setPhase('result');
      }
    }, 2600);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [phase, flow, navigate]);

  const canContinue = () => {
    if (step === 1) return Boolean(targetKg && timeline);
    if (step === 2) return Boolean(diet);
    if (step === 3) return true;
    if (step === 4) return Boolean(budget);
    if (step === 5) return Boolean(rhythm);
    return false;
  };

  const goNext = () => {
    if (!canContinue()) return;
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
      return;
    }
    const validation = validateGoal(Number(targetKg), timeframeWeeks);
    setGoalValidationResult(validation);
    setPhase('goalValidation');
  };

  const dietRule: DietType = useMemo(() => {
    if (diet === 'Végétarienne') return 'vegetarian';
    if (diet === 'Végétalienne') return 'vegan';
    if (diet === 'Pescétarienne') return 'pescetarian';
    return 'omnivore';
  }, [diet]);

  const profile = useMemo<UserFoodProfile>(
    () => ({
      diet: dietRule,
      allergies: splitKeywords(allergies),
      dislikes: splitKeywords(dislikes),
      budget: budgetToNumber(budget),
      isPremium: hasPremiumAccess,
      prepStyle: rhythm === 'Très actif' ? 'quick' : 'flex',
    }),
    [allergies, budget, dietRule, dislikes, hasPremiumAccess, rhythm],
  );

  const generatedProgram = useMemo<GeneratedWeek[]>(
    () => generateProgram(rotationWeeks, profile),
    [profile, rotationWeeks],
  );
  const coursesDaysLimit = getCoursesDaysLimit(hasPremiumAccess);
  const displayedShoppingByCategoryEntries = useMemo(() => {
    const effectiveDays = Math.max(1, Math.min(coursesDays, coursesDaysLimit));
    const selectedDays = programWeeks.flatMap((week) => week.days).slice(0, effectiveDays);
    const selectedMeals = selectedDays.flatMap((day) =>
      [
        { meal: day.breakfast, slot: 'breakfast' as const },
        { meal: day.lunch, slot: 'lunch' as const },
        { meal: day.dinner, slot: 'dinner' as const },
      ].filter((entry): entry is { meal: EngineMeal; slot: 'breakfast' | 'lunch' | 'dinner' } => Boolean(entry.meal))
    );

    const fallbackByMealType: Record<'breakfast' | 'lunch' | 'dinner', string[]> = {
      breakfast: ['Flocons d avoine', 'Banane', 'Yaourt nature'],
      lunch: ['Légumes variés', 'Riz complet', 'Huile d olive'],
      dinner: ['Légumes de saison', 'Protéine maigre', 'Herbes et épices'],
    };

    const fallbackIngredientsByRecipe = (recipe: Recipe | undefined, meal: EngineMeal, slot: MealSlot) => {
      const source = normalize(`${recipe?.title ?? ''} ${meal.name}`);
      const fallback: Array<{ name: string; quantity: number; unit: string }> = [];
      if (/(omelette|oeuf|oeufs)/.test(source)) fallback.push({ name: 'Oeufs', quantity: 2, unit: 'pièce' });
      if (/(riz|bowl|poke)/.test(source)) fallback.push({ name: 'Riz complet', quantity: 100, unit: 'g' });
      if (/(saumon|poisson|thon)/.test(source)) fallback.push({ name: 'Saumon', quantity: 150, unit: 'g' });
      if (/(poulet|dinde)/.test(source)) fallback.push({ name: 'Poulet', quantity: 150, unit: 'g' });
      if (/(courgette)/.test(source)) fallback.push({ name: 'Courgettes', quantity: 1, unit: 'pièce' });
      if (/(carotte)/.test(source)) fallback.push({ name: 'Carottes', quantity: 2, unit: 'pièce' });
      if (/(avocat)/.test(source)) fallback.push({ name: 'Avocat', quantity: 1, unit: 'pièce' });
      if (/(coco)/.test(source)) fallback.push({ name: 'Lait de coco', quantity: 20, unit: 'cl' });
      if (fallback.length === 0) {
        return fallbackByMealType[slot].map((name) => ({ name, quantity: 1, unit: 'pièce' }));
      }
      return fallback;
    };

    const normalizeIngredientName = (rawName: string) => {
      const compact = normalize(rawName).replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
      const aliasRules: Array<[RegExp, string]> = [
        [/\boeufs?\b|\bœufs?\b/, 'oeuf'],
        [/\bcarottes?\b/, 'carotte'],
        [/\bcourgettes?\b/, 'courgette'],
        [/\bavocats?\b/, 'avocat'],
        [/\byaourts?\b/, 'yaourt nature'],
        [/\blaits?\s+de\s+coco\b/, 'lait de coco'],
        [/\bflocons?\s+d[' ]?avoine\b/, 'flocons d avoine'],
        [/\bpates?\b/, 'pates'],
        [/\boignons?\b/, 'oignon'],
        [/\btomates?\b/, 'tomate'],
      ];
      const alias = aliasRules.find(([pattern]) => pattern.test(compact))?.[1];
      const canonical = alias ?? compact;
      const display = canonical
        .split(' ')
        .map((word) => (word.length > 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
        .join(' ');
      return { key: canonical, display };
    };

    const normalizeUnit = (rawUnit: string) => {
      const unit = normalize(rawUnit).replace(/\./g, '').trim();
      if (!unit) return '';
      const map: Record<string, string> = {
        ml: 'ml',
        millilitre: 'ml',
        millilitres: 'ml',
        cl: 'cl',
        centilitre: 'cl',
        centilitres: 'cl',
        l: 'l',
        litre: 'l',
        litres: 'l',
        g: 'g',
        gr: 'g',
        gramme: 'g',
        grammes: 'g',
        kg: 'kg',
        kilo: 'kg',
        kilos: 'kg',
        piece: 'pièce',
        pieces: 'pièce',
        unite: 'pièce',
        unites: 'pièce',
        pot: 'pot',
        pots: 'pot',
        tranche: 'tranche',
        tranches: 'tranche',
        cuillere: 'cuillère',
        cuilleres: 'cuillère',
      };
      return map[unit] ?? unit;
    };

    const parseFraction = (value: string) => {
      const trimmed = value.trim();
      const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (fractionMatch) {
        const numerator = Number(fractionMatch[1]);
        const denominator = Number(fractionMatch[2]);
        if (denominator !== 0) return numerator / denominator;
      }
      const parsed = Number(trimmed.replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : null;
    };

    const parseAmount = (amountRaw: string, ingredientName: string) => {
      const source = normalize(`${amountRaw} ${ingredientName}`).replace(/\s+/g, ' ').trim();
      if (!source) return { quantity: 1, unit: 'pièce' };
      const numberMatch = source.match(/(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)/);
      const quantity = numberMatch ? parseFraction(numberMatch[1]) : null;
      const unitMatch = source.match(/\b(ml|cl|l|g|kg|gr|grammes?|litres?|millilitres?|centilitres?|piece|pieces|pot|pots|tranche|tranches|cuillere|cuilleres)\b/);
      const unit = normalizeUnit(unitMatch?.[1] ?? '');
      if (quantity && quantity > 0) {
        return { quantity, unit: unit || 'pièce' };
      }
      return { quantity: 1, unit: unit || 'pièce' };
    };

    const convertToBase = (quantity: number, unit: string) => {
      if (unit === 'l') return { family: 'volume' as const, baseUnit: 'ml', baseQuantity: quantity * 1000 };
      if (unit === 'cl') return { family: 'volume' as const, baseUnit: 'ml', baseQuantity: quantity * 10 };
      if (unit === 'ml') return { family: 'volume' as const, baseUnit: 'ml', baseQuantity: quantity };
      if (unit === 'kg') return { family: 'mass' as const, baseUnit: 'g', baseQuantity: quantity * 1000 };
      if (unit === 'g') return { family: 'mass' as const, baseUnit: 'g', baseQuantity: quantity };
      return { family: 'count' as const, baseUnit: unit || 'pièce', baseQuantity: quantity };
    };

    const formatQuantity = (baseQuantity: number, family: 'volume' | 'mass' | 'count', baseUnit: string) => {
      const pretty = (value: number) => {
        const rounded = Math.round(value * 10) / 10;
        return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
      };
      if (family === 'volume') {
        if (baseQuantity >= 1000) return `${pretty(baseQuantity / 1000)} l`;
        if (baseQuantity >= 100) return `${pretty(baseQuantity / 10)} cl`;
        return `${pretty(baseQuantity)} ml`;
      }
      if (family === 'mass') {
        if (baseQuantity >= 1000) return `${pretty(baseQuantity / 1000)} kg`;
        return `${pretty(baseQuantity)} g`;
      }
      return `${pretty(baseQuantity)} ${baseUnit}`.trim();
    };

    const inferCategory = (ingredientName: string): string => {
      const source = normalize(ingredientName);
      if (!source) return 'autres';
      if (/(carotte|courgette|tomate|concombre|epinard|brocoli|salade|poivron|oignon|ail|champignon|legume)/.test(source)) {
        return 'légumes';
      }
      if (/(banane|pomme|poire|fraise|framboise|orange|citron|kiwi|mangue|ananas|fruit)/.test(source)) {
        return 'fruits';
      }
      if (/(poulet|dinde|boeuf|saumon|thon|oeuf|tofu|pois chiche|lentille|haricot|proteine|poisson)/.test(source)) {
        return 'protéines';
      }
      if (/(yaourt|lait|fromage|creme|skyr|mozzarella|feta|beurre)/.test(source)) {
        return 'crèmerie';
      }
      if (/(amande|noix|barre|granola|collation|snack|compote)/.test(source)) {
        return 'collations';
      }
      if (/(flocon|pain|cereale|muesli|porridge|confiture)/.test(source)) {
        return 'petits-déjeuners';
      }
      if (/(riz|pate|quinoa|semoule|farine|huile|vinaigre|sel|poivre|epice|miel|chocolat|sauce|epicerie)/.test(source)) {
        return 'épicerie';
      }
      return 'autres';
    };

    const mergedByIngredient = new Map<
      string,
      { name: string; category: string; family: 'volume' | 'mass' | 'count'; baseUnit: string; total: number }
    >();

    selectedMeals.forEach(({ meal, slot }) => {
      const resolvedRecipe = resolveRecipeForMeal(meal.id, meal.name);
      const structuredIngredients =
        resolvedRecipe?.ingredients
          ?.map((ing) => ({
            name: ing?.name?.trim() ?? '',
            amount: ing?.amount?.trim() ?? '',
          }))
          .filter((ing) => ing.name.length > 0) ?? [];

      const unstructuredIngredients =
        meal.ingredients
          ?.map((ing) => ing?.trim())
          .filter((ing): ing is string => Boolean(ing && ing.length > 0))
          .map((name) => ({ name, amount: '' })) ?? [];

      const selectedIngredients =
        structuredIngredients.length > 0
          ? structuredIngredients
          : unstructuredIngredients.length > 0
            ? unstructuredIngredients
            : fallbackIngredientsByRecipe(resolvedRecipe, meal, slot).map((item) => ({
                name: item.name,
                amount: `${item.quantity} ${item.unit}`.trim(),
              }));

      selectedIngredients.forEach((ingredient) => {
        const { key, display } = normalizeIngredientName(ingredient.name);
        if (!key) return;
        const parsed = parseAmount(ingredient.amount, ingredient.name);
        const converted = convertToBase(parsed.quantity, parsed.unit);
        const aggregateKey = `${key}::${converted.family}::${converted.baseUnit}`;
        const existing = mergedByIngredient.get(aggregateKey);
        if (existing) {
          existing.total += converted.baseQuantity;
          return;
        }
        mergedByIngredient.set(aggregateKey, {
          name: display,
          category: inferCategory(ingredient.name),
          family: converted.family,
          baseUnit: converted.baseUnit,
          total: converted.baseQuantity,
        });
      });
    });

    const categoryOrder = [
      'légumes',
      'fruits',
      'protéines',
      'crèmerie',
      'épicerie',
      'petits-déjeuners',
      'collations',
      'autres',
    ];

    const grouped = categoryOrder.reduce(
      (acc, category) => {
        acc[category] = [];
        return acc;
      },
      {} as Record<string, { name: string; quantityLabel: string }[]>
    );

    mergedByIngredient.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push({
        name: item.name,
        quantityLabel: formatQuantity(item.total, item.family, item.baseUnit),
      });
    });

    return categoryOrder
      .map((category) => [
        category,
        (grouped[category] ?? []).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
      ] as const)
      .filter(([, items]) => items.length > 0);
  }, [coursesDays, coursesDaysLimit, programWeeks]);
  const progressEntries = useMemo<WeightEntry[]>(
    () => [
      { date: '2026-03-01', weightKg: 72.4, waistCm: 86 },
      { date: '2026-03-15', weightKg: 71.2, waistCm: 84 },
      { date: '2026-04-01', weightKg: 70.5, waistCm: 83 },
    ],
    [],
  );
  const progressSummary = useMemo(
    () => buildProgressSummary(progressEntries),
    [progressEntries],
  );

  useEffect(() => {
    if (phase !== 'result') return;
    if (flow === 'app' && !hydrateProgramOnceRef.current) {
      hydrateProgramOnceRef.current = true;
      if (programWeeks.length === 0) {
        setProgramWeeks(generatedProgram);
      }
      return;
    }
    setProgramWeeks(generatedProgram);
    setValidationState({});
    setReplaceCountByDay({});
    setReplaceInfo('');
    setActiveWeek(0);
    setActiveDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
    setActiveTab('accueil');
    setRecipeModal(null);
    setCoursesDays((prev) => Math.min(prev, coursesDaysLimit));
  }, [coursesDaysLimit, generatedProgram, phase, flow]);

  useEffect(() => {
    if (flow !== 'app' || phase !== 'result') return;
    const snap: ClassiqueSnapshotV1 = {
      v: 1,
      phase: 'result',
      step,
      analysisIndex,
      targetKg,
      timeline: timeline || '',
      diet: diet || '',
      allergies,
      dislikes,
      budget: budget || '',
      rhythm: rhythm || '',
      activeWeek,
      activeDay,
      goalValidationResult,
      validationState,
      replaceCountByDay,
      replaceInfo,
      activeTab,
      selectedEmotion,
      coursesDays,
      programWeeks: programWeeks.length > 0 ? programWeeks : undefined,
    };
    persistClassiqueSnapshot(snap);
  }, [
    flow,
    phase,
    step,
    analysisIndex,
    targetKg,
    timeline,
    diet,
    allergies,
    dislikes,
    budget,
    rhythm,
    activeWeek,
    activeDay,
    goalValidationResult,
    validationState,
    replaceCountByDay,
    replaceInfo,
    activeTab,
    selectedEmotion,
    coursesDays,
    programWeeks,
  ]);

  const dynamicNotes = useMemo(() => {
    const notes: string[] = [];
    if (targetTooFast) {
      notes.push(
        'J’ai volontairement ajusté le rythme pour te proposer quelque chose de plus confortable et réaliste.'
      );
    } else {
      notes.push('On part sur une approche progressive, durable et sans pression.');
    }

    if (diet === 'Végétarienne') {
      notes.push('J’ai construit tes menus sans viande ni poisson, en gardant des repas rassasiants et faciles.');
    } else if (diet === 'Végétalienne') {
      notes.push('J’ai construit tes menus 100% végétaux, simples et complets au quotidien.');
    } else if (diet === 'Pescétarienne') {
      notes.push('J’ai gardé les options poisson, sans viande, pour respecter ton équilibre.');
    }

    if (splitKeywords(allergies).length > 0) {
      notes.push('J’ai retiré les aliments signalés pour sécuriser tes propositions.');
    }
    if (splitKeywords(dislikes).length > 0) {
      notes.push('J’ai évité les aliments que tu n’apprécies pas pour garder des menus agréables.');
    }

    if (budget === '20€' || budget === '30€') {
      notes.push(
        hasPremiumAccess
          ? 'J’ai privilégié des idées simples et accessibles au quotidien.'
          : 'Ton budget sera pris en compte avec la version Premium ✨'
      );
    } else if (budget && !hasPremiumAccess) {
      notes.push('Ton budget est bien enregistré, et pourra être appliqué avec la version Premium.');
    }

    notes.push(...buildPersonalizationSummary(profile));
    return notes;
  }, [allergies, budget, diet, dislikes, hasPremiumAccess, profile, targetTooFast]);

  const openAdminEditor = (recipe?: RecipeCatalogItem) => {
    if (recipe) {
      setAdminEditingId(recipe.id);
      setAdminRecipeDraft({ ...recipe });
      return;
    }
    setAdminEditingId(null);
    setAdminRecipeDraft(createEmptyAdminRecipe());
  };

  const saveAdminRecipe = () => {
    if (!recipesAdminEnabled) return;
    const cleanedTitle = adminRecipeDraft.title.trim();
    if (!cleanedTitle) return;
    const now = new Date().toISOString();
    const payload: RecipeCatalogItem = {
      ...adminRecipeDraft,
      title: cleanedTitle,
      description: adminRecipeDraft.description.trim(),
      photoUrl: adminRecipeDraft.photoUrl.trim(),
      tags: adminRecipeDraft.tags.map((t) => t.trim()).filter(Boolean),
      ingredients: adminRecipeDraft.ingredients.filter((i) => i.name.trim().length > 0),
      steps: adminRecipeDraft.steps.map((s) => s.trim()).filter(Boolean),
      tips: (adminRecipeDraft.tips ?? []).map((s) => s.trim()).filter(Boolean),
      updatedAt: now,
      createdAt: adminEditingId ? adminRecipeDraft.createdAt : now,
    };
    if (payload.isRecipeOfDay) {
      recipeCatalog
        .filter((r) => r.id.startsWith('custom-') && r.id !== payload.id && r.isRecipeOfDay)
        .forEach((r) => upsertCustomRecipe({ ...r, isRecipeOfDay: false, updatedAt: now }));
    }
    upsertCustomRecipe(payload);
    refreshRecipeCatalog();
    openAdminEditor();
  };

  const renderRecipeVisual = (
    recipe: RecipeCatalogItem,
    className: string,
    variant: 'hero' | 'card' | 'sheet',
  ) => {
    const hasPhoto = Boolean(recipe.photoUrl?.trim()) && !recipeImageErrors[recipe.id];
    if (hasPhoto) {
      return (
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          className={className}
          onError={() => setRecipeImageErrors((prev) => ({ ...prev, [recipe.id]: true }))}
        />
      );
    }
    const icon =
      recipe.mealTime === 'matin' ? '🌿' : recipe.mealTime === 'midi' ? '🍽️' : recipe.mealTime === 'soir' ? '💗' : '✨';
    return (
      <div className={`${styles.recipeVisualPlaceholder} ${styles[`recipeVisual${variant}`]}`}>
        <div className={styles.recipeVisualGlow} aria-hidden />
        <p className={styles.recipeVisualIcon} aria-hidden>
          {icon}
        </p>
        <p className={styles.recipeVisualLabel}>{getDisplayMealLabel(recipe)}</p>
      </div>
    );
  };

  const stepMeta = (n: number) => (
    <p className={styles.stepMeta}>
      Étape {n} sur {totalSteps} · {STEP_LABELS[n - 1]}
    </p>
  );
  const recipeLevelLabel = (minutes: number) => {
    if (minutes <= 15) return 'Rapide';
    if (minutes <= 25) return 'Facile';
    return 'Confort';
  };
  const getRecipeFoodEmoji = (recipe: RecipeCatalogItem) => {
    const title = normalize(recipe.title);
    const tags = recipe.tags.map(normalize).join(' ');
    const category = normalize(recipe.category);
    const searchText = `${title} ${tags} ${category}`;

    const titlePriorityMap: Array<{ keywords: string[]; emoji: string }> = [
      { keywords: ['wrap'], emoji: '🌯' },
      { keywords: ['salade'], emoji: '🥗' },
      { keywords: ['bowl'], emoji: '🥣' },
      { keywords: ['yaourt', 'granola', 'porridge'], emoji: '🥣' },
      { keywords: ['pudding'], emoji: '🍮' },
      { keywords: ['saumon', 'poisson', 'thon'], emoji: '🐟' },
      { keywords: ['crevette'], emoji: '🍤' },
      { keywords: ['poulet'], emoji: '🍗' },
      { keywords: ['oeuf', 'œuf', 'omelette'], emoji: '🍳' },
      { keywords: ['pates', 'pasta', 'pâtes'], emoji: '🍝' },
      { keywords: ['curry'], emoji: '🍛' },
      { keywords: ['riz'], emoji: '🍚' },
      { keywords: ['soupe', 'veloute', 'velouté'], emoji: '🍲' },
      { keywords: ['tarte', 'quiche'], emoji: '🥧' },
      { keywords: ['toast', 'tartine'], emoji: '🍞' },
      { keywords: ['sandwich'], emoji: '🥪' },
      { keywords: ['burger'], emoji: '🍔' },
      { keywords: ['pizza'], emoji: '🍕' },
      { keywords: ['falafel', 'pois chiches'], emoji: '🧆' },
      { keywords: ['lentilles'], emoji: '🥘' },
      { keywords: ['feta'], emoji: '🧀' },
      { keywords: ['fruits rouges', 'fraise'], emoji: '🍓' },
      { keywords: ['banane'], emoji: '🍌' },
      { keywords: ['pomme'], emoji: '🍎' },
      { keywords: ['avocat'], emoji: '🥑' },
    ];

    for (const item of titlePriorityMap) {
      if (item.keywords.some((keyword) => title.includes(normalize(keyword)))) {
        return item.emoji;
      }
    }

    if (searchText.includes('rapide')) return '⚡';
    if (searchText.includes('leger')) return '🌿';
    if (recipe.mealTime === 'matin') return '☕';
    if (recipe.mealTime === 'midi') return '🍽️';
    if (recipe.mealTime === 'soir') return '🍲';
    return '🍴';
  };
  const visualRecipeEntries = useMemo<VisualRecipeEntry[]>(
    () =>
      (['matin', 'midi', 'soir'] as const).flatMap((meal) =>
        (displayedRecipesByMeal[meal] ?? []).map((recipe, idx) => ({
          recipe,
          originMealTime: meal,
          originIndex: idx,
          bucket: inferMealBucket(recipe, meal),
        })),
      ),
    [displayedRecipesByMeal],
  );
  const filteredVisualEntries = useMemo(() => {
    const textMatch = (recipe: RecipeCatalogItem, terms: string[]) => {
      const all = `${normalize(recipe.title)} ${recipe.tags.map(normalize).join(' ')} ${normalize(recipe.category)}`;
      return terms.some((t) => all.includes(normalize(t)));
    };
    return visualRecipeEntries.filter((entry) => {
      if (activeRecipeFilter === 'Tout') return true;
      if (activeRecipeFilter === 'Petit-déj') return entry.bucket === 'breakfast';
      if (activeRecipeFilter === 'Déjeuner') return entry.bucket === 'lunch';
      if (activeRecipeFilter === 'Dîner') return entry.bucket === 'dinner';
      if (activeRecipeFilter === 'Rapide') return entry.recipe.prepMinutes <= 20 || textMatch(entry.recipe, ['rapide']);
      if (activeRecipeFilter === 'Léger') return textMatch(entry.recipe, ['leger', 'léger', 'light']);
      return textMatch(entry.recipe, ['proteine', 'protéiné', 'protein', 'poulet', 'saumon', 'thon', 'oeuf', 'œuf', 'lentilles']);
    });
  }, [activeRecipeFilter, visualRecipeEntries]);
  const displayedRecipeGroups = useMemo(() => {
    const byBucket = {
      breakfast: filteredVisualEntries.filter((e) => e.bucket === 'breakfast'),
      lunch: filteredVisualEntries.filter((e) => e.bucket === 'lunch'),
      dinner: filteredVisualEntries.filter((e) => e.bucket === 'dinner'),
    };
    if (activeRecipeFilter === 'Tout') {
      return [
        { id: 'breakfast', title: 'Petit-déjeuner', entries: byBucket.breakfast },
        { id: 'lunch', title: 'Déjeuner', entries: byBucket.lunch },
        { id: 'dinner', title: 'Dîner', entries: byBucket.dinner },
      ].filter((group) => group.entries.length > 0);
    }
    if (activeRecipeFilter === 'Petit-déj') return [{ id: 'breakfast', title: 'Petit-déjeuner', entries: byBucket.breakfast }];
    if (activeRecipeFilter === 'Déjeuner') return [{ id: 'lunch', title: 'Déjeuner', entries: byBucket.lunch }];
    if (activeRecipeFilter === 'Dîner') return [{ id: 'dinner', title: 'Dîner', entries: byBucket.dinner }];
    return [{ id: 'filtered', title: 'Recettes filtrées', entries: filteredVisualEntries }];
  }, [activeRecipeFilter, filteredVisualEntries]);
  const inspirationRecipes = useMemo(
    () =>
      Array.from(
        new Map(filteredVisualEntries.map((entry) => [entry.recipe.id, entry.recipe])).values(),
      ).slice(0, 6),
    [filteredVisualEntries],
  );
  const addRecipeToWeek = (recipeId: string) => {
    setAddedToWeekIds((prev) => ({ ...prev, [recipeId]: true }));
  };
  const handleChangeRecipe = (mealTime: 'matin' | 'midi' | 'soir', recipeIndex: number) => {
    const currentList = displayedRecipesByMeal[mealTime];
    const usedIds = new Set([
      recipeOfDay?.id,
      ...displayedRecipesByMeal.matin.map((r) => r.id),
      ...displayedRecipesByMeal.midi.map((r) => r.id),
      ...displayedRecipesByMeal.soir.map((r) => r.id),
    ]);
    const fallbackId = currentList[recipeIndex]?.id;
    const next = filteredRecipes.find(
      (r) =>
        r.mealTime === mealTime &&
        !usedIds.has(r.id) &&
        r.id !== fallbackId &&
        r.id !== recipeOfDayId,
    );
    if (!next) return;
    setDisplayedRecipesByMeal((prev) => ({
      ...prev,
      [mealTime]: prev[mealTime].map((r, idx) => (idx === recipeIndex ? next : r)),
    }));
  };

  if (phase === 'analyzing') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.loaderWrap}>
            <div className={styles.loaderRing} aria-hidden />
            <p className={styles.loaderText}>On crée ton programme sur mesure 💖</p>
            <p className={styles.loaderDynamicLine}>{ANALYSIS_STEPS[analysisIndex]}</p>
            <p className={styles.loaderSub}>
              Quelques secondes… on prépare quelque chose de vraiment adapté à toi 🌿
            </p>
            <p className={styles.loaderSub}>
              Tu vas bientôt découvrir une façon plus simple de manger et de prendre soin de toi 💛
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'goalValidation') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h2 className={styles.h2}>Validation de ton objectif ✨</h2>
          <p className={styles.intro}>{goalValidationResult?.message}</p>
          <p className={styles.softNote}>
            Perte saine visée: environ 0,5 à 1 kg par semaine, en restant progressive et durable.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => setPhase('questions')}
            >
              Ajuster mes réponses
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setAnalysisIndex(0);
                setPhase('analyzing');
              }}
            >
              Continuer →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const currentWeek = programWeeks[activeWeek];
    const currentDayPlan = currentWeek?.days?.[activeDay];
    const dayKey = `${activeWeek}-${activeDay}`;
    const usedChanges = replaceCountByDay[dayKey] ?? 0;
    const dayProgress =
      ['breakfast', 'lunch', 'dinner'].filter(
        (slot) => validationState[`${dayKey}-${slot}`]
      ).length ?? 0;
    const accessibleWeeks = Math.min(displayedWeeks, Math.max(1, programWeeks.length));
    const visibleWeeks = programWeeks.slice(0, accessibleWeeks);
    const totalMeals = visibleWeeks.length * 7 * 3;
    const validatedMeals = Object.values(validationState).filter(Boolean).length;
    const globalProgress =
      totalMeals > 0 ? Math.min(100, Math.round((validatedMeals / totalMeals) * 100)) : 0;
    const selectedRecipe = recipeModal
      ? resolveRecipeForMeal(recipeModal.meal.id, recipeModal.meal.name)
      : undefined;

    const handleValidateMeal = (slot: MealSlot) => {
      const key = `${dayKey}-${slot}`;
      setValidationState((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleReplaceMeal = (slot: MealSlot) => {
      if (!currentDayPlan || !currentWeek) return;
      if (usedChanges >= changesPerDay) {
        setReplaceInfo(
          hasPremiumAccess
            ? 'Tu as utilisé tes 5 changements disponibles aujourd’hui.'
            : 'Tu as utilisé tes 2 changements disponibles aujourd’hui ✨ Passe au Premium pour plus de flexibilité.'
        );
        return;
      }
      const currentMeal = currentDayPlan[slot];
      const recentIds = [
        currentDayPlan.breakfast?.id,
        currentDayPlan.lunch?.id,
        currentDayPlan.dinner?.id,
        currentWeek.days[Math.max(activeDay - 1, 0)]?.[slot]?.id,
      ].filter(Boolean) as string[];
      const replacement = replaceMeal(currentMeal as EngineMeal, slot, profile, [
        ...recentIds,
        ...(programWeeks
          .slice(Math.max(0, activeWeek - 2), activeWeek + 1)
          .flatMap((week) => week.days)
          .map((day) => day[slot]?.id)
          .filter(Boolean) as string[]),
      ]);
      if (!replacement) {
        setReplaceInfo('Je n’ai pas trouvé de meilleure alternative pour ce repas, tout reste cohérent avec ton profil.');
        return;
      }

      setProgramWeeks((prev) =>
        prev.map((week, wIdx) =>
          wIdx !== activeWeek
            ? week
            : {
                ...week,
                days: week.days.map((day, dIdx) =>
                  dIdx !== activeDay ? day : { ...day, [slot]: replacement as EngineMeal }
                ),
              }
        )
      );
      setReplaceCountByDay((prev) => ({ ...prev, [dayKey]: (prev[dayKey] ?? 0) + 1 }));
      setReplaceInfo(
        hasPremiumAccess
          ? `Repas ajusté (${usedChanges + 1}/${changesPerDay} changements aujourd’hui).`
          : `Repas ajusté (${usedChanges + 1}/${changesPerDay} changements aujourd’hui).`
      );
    };

    const handleUnlockPremium = () => {
      navigate('/offres');
    };

    const supportEmail = 'equilibremoi.06@gmail.com';
    const handleWriteClick = () => {
      window.location.href = `mailto:${supportEmail}?subject=Besoin d'accompagnement EquilibreMoi&body=Bonjour,%0D%0A%0D%0AJ'aurais besoin d'aide concernant mon programme.%0D%0A`;
    };
    const handleCopyEmail = async () => {
      try {
        await navigator.clipboard.writeText(supportEmail);
        alert('Adresse email copiée 💖');
      } catch {
        alert("Impossible de copier l'adresse");
      }
    };

    return (
      <div className={styles.page}>
        <div className={`${styles.card} ${styles.resultsContainer}`}>
          <h2 className={styles.h2}>✨ Ton programme est prêt</h2>
          <p className={styles.intro}>
            On a créé un accompagnement adapté à ton rythme et ton quotidien.
          </p>
          <p className={styles.intro}>
            Tu peux avancer simplement, sans pression… à ton rythme 💖
          </p>

          {activeTab === 'accueil' ? <DailyQuotePopup /> : null}

          <nav className={styles.appTabs} aria-label="Navigation application">
            {APP_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.appTabButton} ${activeTab === tab.id ? styles.appTabButtonActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'accueil' ? (
            <>
              <div className={`${styles.summaryCard} ${styles.cardHighlight} ${styles.homeBlock} ${styles.fadeInSoft}`}>
                <div className={styles.sectionAccentBar} aria-hidden />
                <h3 className={`${styles.blockTitle} ${styles.highlightTitle}`}>Un accompagnement plus humain 💖</h3>
                <p className={styles.intro}>
                  Je suis là pour t’accompagner, pas seulement pour te proposer un programme.
                  Si tu en ressens le besoin, tu peux m’écrire directement.
                </p>
                <div className={styles.humanHelpActions}>
                  <button type="button" className={`${styles.buttonPrimary} ${styles.writeButton}`} onClick={handleWriteClick}>
                    M’écrire
                  </button>
                  <div className={styles.supportEmailBlock}>
                    <span className={styles.supportEmail}>{supportEmail}</span>
                    <button type="button" className={styles.copyEmailButton} onClick={handleCopyEmail}>
                      Copier l’adresse
                    </button>
                  </div>
                </div>
                <p className={styles.evolveNote}>Tu peux m’écrire directement ou copier mon adresse email 💌</p>
                <p className={styles.evolveNote}>Je te répondrai personnellement ✨</p>
              </div>

              <div className={`${styles.summaryCard} ${styles.emotionsBlock} ${styles.fadeInSoft}`}>
                <div className={styles.sectionAccentBar} aria-hidden />
                <h3 className={styles.blockTitle}>Mon état émotionnel</h3>
                <div className={styles.emotionsGrid}>
                  {([
                    { key: 'sereine', label: 'Sereine', emoji: '😌' },
                    { key: 'fatiguee', label: 'Fatiguée', emoji: '😴' },
                    { key: 'motivee', label: 'Motivée', emoji: '💪' },
                    { key: 'stressee', label: 'Stressée', emoji: '😰' },
                  ] as { key: EmotionKey; label: string; emoji: string }[]).map((emotion) => (
                    <button
                      key={emotion.key}
                      type="button"
                      className={`${styles.emotionBtn} ${selectedEmotion === emotion.key ? styles.emotionBtnActive : ''}`}
                      onClick={() => setSelectedEmotion(emotion.key)}
                    >
                      {emotion.emoji} {emotion.label}
                    </button>
                  ))}
                </div>
                {selectedEmotion ? (
                  <div className={`${styles.emotionMessage} ${styles.fadeInSoft}`}>
                    {EMOTION_MESSAGES[selectedEmotion]}
                  </div>
                ) : null}
              </div>

              {!hasPremiumAccess ? (
                <div className={`${styles.premiumCallout} ${styles.premiumBlock} ${styles.fadeInSoft}`}>
                  <div className={styles.sectionAccentBar} aria-hidden />
                  <p className={`${styles.premiumCalloutTitle} ${styles.premiumTitle}`}>Passe au Premium ✨</p>
                  <p>
                    Ton programme peut aller encore plus loin. Débloque une expérience complète, plus fluide, plus personnalisée et encore plus simple au quotidien 💖
                  </p>
                  <p className={styles.evolveNote}>Plus de menus, plus de flexibilité, plus de clarté</p>
                  <div className={styles.resultActions}>
                    <button type="button" className={`${styles.buttonPrimary} ${styles.premiumButton}`} onClick={handleUnlockPremium}>
                      Je débloque mon programme
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === 'recettes' ? (
            <div
              className={`${styles.summaryCard} ${styles.resultsSection} ${styles.fadeInSoft} bg-[#FAF7F2] rounded-[24px]`}
              style={{
                background: '#FAF7F2',
                borderRadius: 24,
                border: '1px solid #F3D6DB',
                boxShadow: '0 10px 24px rgba(26,46,34,0.05)',
                padding: '1rem',
              }}
            >
              <header style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '1.62rem',
                    color: '#1A2E22',
                  }}
                >
                  Recettes du moment
                </h3>
                <p style={{ margin: '0.3rem 0 0', color: '#7A8C82', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  Des idées simples, douces et inspirantes pour votre semaine.
                </p>
                <div
                  aria-hidden
                  style={{
                    margin: '0.58rem auto 0',
                    width: 110,
                    height: 4,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #F2A7B0, #FDF7E8)',
                  }}
                />
              </header>

              {recipeOfDay ? (
                <article
                  style={{
                    display: 'block',
                    borderRadius: 24,
                    overflow: 'hidden',
                    background: 'linear-gradient(145deg, #FDF2F4, #FDF7E8 92%)',
                    border: '1px solid #F3D6DB',
                    boxShadow: '0 8px 20px rgba(26,46,34,0.05)',
                    marginBottom: '0.9rem',
                  }}
                >
                  <div style={{ padding: '0.9rem 0.95rem 0.85rem' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.7rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#A86C7A',
                        fontWeight: 700,
                        background: '#FDF7E8',
                        border: '1px solid rgba(200,164,74,0.4)',
                        borderRadius: 999,
                        width: 'fit-content',
                        padding: '0.2rem 0.62rem',
                      }}
                    >
                      Recette du jour
                    </p>
                    <h4
                      style={{
                        margin: '0.42rem 0 0',
                        color: '#1A2E22',
                        fontSize: '1.16rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                    >
                      <span aria-hidden style={{ fontSize: '1.05rem', lineHeight: 1 }}>
                        {getRecipeFoodEmoji(recipeOfDay)}
                      </span>
                      {recipeOfDay.title}
                    </h4>
                    <p style={{ margin: '0.34rem 0 0', color: '#7A8C82', fontSize: '0.8rem' }}>
                      ⏱ {recipeOfDay.prepMinutes} min · {getDisplayMealLabel(recipeOfDay)} ·{' '}
                      {RECIPE_CATEGORY_LABEL[recipeOfDay.category]}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.34rem', marginTop: '0.5rem' }}>
                      {recipeOfDay.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            borderRadius: 999,
                            padding: '0.16rem 0.5rem',
                            fontSize: '0.7rem',
                            background: '#FFF3F5',
                            color: '#A86C7A',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p style={{ margin: '0.45rem 0 0', color: '#7A8C82', fontSize: '0.83rem', lineHeight: 1.45 }}>
                      {recipeOfDay.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedCatalogRecipe(recipeOfDay)}
                      style={{
                        marginTop: '0.55rem',
                        border: 0,
                        borderRadius: 999,
                        background: '#8E5E6B',
                        color: '#FAF7F2',
                        fontWeight: 700,
                        padding: '0.5rem 0.95rem',
                        cursor: 'pointer',
                      }}
                    >
                      Voir la recette
                    </button>
                  </div>
                </article>
              ) : null}

              <div
                style={{
                  display: 'flex',
                  gap: '0.42rem',
                  overflowX: 'auto',
                  paddingBottom: '0.35rem',
                  marginBottom: '0.75rem',
                  scrollbarWidth: 'none',
                }}
              >
                {['Tout', 'Petit-déj', 'Déjeuner', 'Dîner', 'Rapide', 'Léger', 'Protéiné'].map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    style={{
                      whiteSpace: 'nowrap',
                      borderRadius: 999,
                      padding: '0.28rem 0.72rem',
                      fontSize: '0.72rem',
                      border:
                        activeRecipeFilter === filter
                          ? '1px solid #F2A7B0'
                          : '1px solid rgba(242,167,176,0.38)',
                      background: activeRecipeFilter === filter ? '#F2A7B0' : '#FAF7F2',
                      color: activeRecipeFilter === filter ? '#8E5E6B' : '#1A2E22',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      setActiveRecipeFilter(
                        filter as 'Tout' | 'Petit-déj' | 'Déjeuner' | 'Dîner' | 'Rapide' | 'Léger' | 'Protéiné',
                      )
                    }
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <section style={{ display: 'grid', gap: '0.72rem' }}>
                {displayedRecipeGroups.map((section) => (
                  <section
                    key={section.id}
                    style={{
                      borderRadius: 24,
                      background: '#FFF8F7',
                      border: '1px solid #F6E3E7',
                      boxShadow: '0 8px 18px rgba(26,46,34,0.04)',
                      padding: '0.68rem',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 0.6rem',
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: '1.08rem',
                        color: '#1A2E22',
                      }}
                    >
                      {section.title}
                    </h4>
                    {section.entries.length === 0 ? (
                      <p className={styles.recipesMealSectionEmpty}>
                        De nouvelles idées arrivent bientôt pour cette section.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.34rem' }}>
                        {section.entries.map((entry) => {
                            const recipe = entry.recipe;
                            const rowOpen = Boolean(openedRecipeRows[recipe.id]);
                            return (
                              <article
                                key={recipe.id}
                                style={{
                                  background: '#FAF7F2',
                                  borderRadius: 24,
                                  border: '1px solid #F3D6DB',
                                  boxShadow: '0 5px 14px rgba(26,46,34,0.04)',
                                  overflow: 'hidden',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenedRecipeRows((prev) => ({
                                      ...prev,
                                      [recipe.id]: !prev[recipe.id],
                                    }))
                                  }
                                  style={{
                                    width: '100%',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    gap: '0.6rem',
                                    background: 'transparent',
                                    border: 0,
                                    padding: '0.74rem 0.78rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <span>
                                    <span style={{ color: '#7A8C82', fontSize: '0.82rem' }}>
                                      {getDisplayMealLabel(recipe, entry.originMealTime)}
                                    </span>
                                    <span
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                        color: '#1A2E22',
                                        fontWeight: 700,
                                        marginTop: '0.12rem',
                                        fontSize: '0.93rem',
                                      }}
                                    >
                                      <span aria-hidden style={{ fontSize: '1rem', lineHeight: 1 }}>
                                        {getRecipeFoodEmoji(recipe)}
                                      </span>
                                      {recipe.title}
                                    </span>
                                    <span style={{ display: 'block', color: '#7A8C82', fontSize: '0.8rem', marginTop: '0.12rem' }}>
                                      {recipeLevelLabel(recipe.prepMinutes)} · {RECIPE_CATEGORY_LABEL[recipe.category]}
                                    </span>
                                  </span>
                                  <span style={{ display: 'grid', justifyItems: 'end', alignContent: 'center' }}>
                                    <span style={{ color: '#1A2E22', fontSize: '0.82rem', fontWeight: 600 }}>
                                      {recipe.prepMinutes} min
                                    </span>
                                    <span style={{ color: '#7A8C82', fontSize: '1rem', lineHeight: 1, marginTop: '0.25rem' }}>
                                      {rowOpen ? '▴' : '▾'}
                                    </span>
                                  </span>
                                </button>
                                {rowOpen ? (
                                  <div
                                    style={{
                                      borderTop: '1px solid #F6E3E7',
                                      background: '#FDF2F4',
                                      padding: '0.68rem 0.78rem 0.75rem',
                                      display: 'grid',
                                      gap: '0.48rem',
                                    }}
                                  >
                                    <p style={{ margin: 0, color: '#7A8C82', fontSize: '0.84rem', lineHeight: 1.5 }}>
                                      {recipe.description}
                                    </p>
                                    {recipe.ingredients.length ? (
                                      <p style={{ margin: 0, color: '#7A8C82', fontSize: '0.8rem' }}>
                                        Ingrédients : {recipe.ingredients.slice(0, 4).map((i) => i.name).join(', ')}
                                      </p>
                                    ) : null}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.32rem' }}>
                                      {recipe.tags.slice(0, 4).map((tag) => (
                                        <span
                                          key={`${recipe.id}-${tag}`}
                                          style={{
                                            borderRadius: 999,
                                            padding: '0.15rem 0.48rem',
                                            fontSize: '0.7rem',
                                            background: '#FDF7E8',
                                            color: '#C8A44A',
                                          }}
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.42rem' }}>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedCatalogRecipe(recipe)}
                                        style={{
                                          border: 0,
                                          borderRadius: 999,
                                          background: '#8E5E6B',
                                          color: '#FAF7F2',
                                          fontWeight: 700,
                                          padding: '0.43rem 0.86rem',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Voir la recette
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => addRecipeToWeek(recipe.id)}
                                        style={{
                                          border: '1px solid #F2A7B0',
                                          color: '#A86C7A',
                                          borderRadius: 999,
                                          background: 'transparent',
                                          padding: '0.43rem 0.8rem',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {addedToWeekIds[recipe.id]
                                          ? 'Ajouté à ma semaine ❤️'
                                          : 'Ajouter à ma semaine ❤️'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleChangeRecipe(
                                            entry.originMealTime,
                                            entry.originIndex,
                                          )
                                        }
                                        style={{
                                          border: '1px solid #F6E3E7',
                                          color: '#7A8C82',
                                          borderRadius: 999,
                                          background: '#FFF6F4',
                                          padding: '0.43rem 0.8rem',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Changer
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </article>
                            );
                          })}
                      </div>
                    )}
                  </section>
                ))}
              </section>

              <section style={{ marginTop: '0.88rem' }}>
                <h4
                  style={{
                    margin: '0 0 0.55rem',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: '1.05rem',
                    color: '#1A2E22',
                  }}
                >
                  Inspirations
                </h4>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.48rem',
                    overflowX: 'auto',
                    paddingBottom: '0.35rem',
                    scrollbarWidth: 'none',
                  }}
                >
                  {inspirationRecipes.map((recipe) => (
                      <button
                        key={`inspo-${recipe.id}`}
                        type="button"
                        onClick={() => setSelectedCatalogRecipe(recipe)}
                        style={{
                          minWidth: 155,
                          borderRadius: 24,
                          border: '1px solid #F3D6DB',
                          background: '#FDF7E8',
                          boxShadow: '0 7px 18px rgba(26,46,34,0.04)',
                          padding: '0.62rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '0.74rem', color: '#A86C7A' }}>♡ Inspiration</p>
                        <p
                          style={{
                            margin: '0.2rem 0 0',
                            fontSize: '0.84rem',
                            color: '#1A2E22',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span aria-hidden style={{ fontSize: '0.95rem', lineHeight: 1 }}>
                            {getRecipeFoodEmoji(recipe)}
                          </span>
                          {recipe.title}
                        </p>
                        <p style={{ margin: '0.22rem 0 0', fontSize: '0.76rem', color: '#7A8C82' }}>
                          ⏱ {recipe.prepMinutes} min
                        </p>
                        <p style={{ margin: '0.14rem 0 0', fontSize: '0.72rem', color: '#7A8C82' }}>
                          {getDisplayMealLabel(recipe)}
                        </p>
                      </button>
                    ))}
                </div>
              </section>

              {recipesAdminEnabled ? (
                <section className={styles.recipesAdminPanel}>
                  <div className={styles.recipesAdminHead}>
                    <p className={styles.recipesAdminTitle}>Admin recettes</p>
                    <span className={styles.recipesAdminOwner}>Connectee en admin</span>
                  </div>
                  <div className={styles.recipesAdminForm}>
                    <input
                      className={styles.input}
                      placeholder="Titre recette"
                      value={adminRecipeDraft.title}
                      onChange={(e) =>
                        setAdminRecipeDraft((p) => ({ ...p, title: e.target.value }))
                      }
                    />
                    <input
                      className={styles.input}
                      placeholder="URL photo"
                      value={adminRecipeDraft.photoUrl}
                      onChange={(e) =>
                        setAdminRecipeDraft((p) => ({ ...p, photoUrl: e.target.value }))
                      }
                    />
                    <textarea
                      className={styles.textarea}
                      placeholder="Description courte"
                      value={adminRecipeDraft.description}
                      onChange={(e) =>
                        setAdminRecipeDraft((p) => ({ ...p, description: e.target.value }))
                      }
                    />
                    <div className={styles.recipesAdminGrid}>
                      <input
                        className={styles.input}
                        placeholder="Temps (min)"
                        type="number"
                        value={adminRecipeDraft.prepMinutes}
                        onChange={(e) =>
                          setAdminRecipeDraft((p) => ({
                            ...p,
                            prepMinutes: Number(e.target.value || 0),
                          }))
                        }
                      />
                      <input
                        className={styles.input}
                        placeholder="Portions"
                        type="number"
                        value={adminRecipeDraft.servings}
                        onChange={(e) =>
                          setAdminRecipeDraft((p) => ({
                            ...p,
                            servings: Number(e.target.value || 1),
                          }))
                        }
                      />
                      <select
                        className={styles.input}
                        value={adminRecipeDraft.mealTime}
                        onChange={(e) =>
                          setAdminRecipeDraft((p) => ({
                            ...p,
                            mealTime: e.target.value as RecipeMealTime,
                          }))
                        }
                      >
                        <option value="matin">Petit-déjeuner</option>
                        <option value="midi">Déjeuner</option>
                        <option value="soir">Dîner</option>
                      </select>
                    </div>
                    <textarea
                      className={styles.textarea}
                      placeholder="Ingrédients (un par ligne) format: nom | quantité | équivalent"
                      value={adminRecipeDraft.ingredients
                        .map((i) => [i.name, i.amount, i.everydayEquivalent ?? ''].join(' | '))
                        .join('\n')}
                      onChange={(e) =>
                        setAdminRecipeDraft((p) => ({
                          ...p,
                          ingredients: parseTextList(e.target.value).map((line) => {
                            const [name, amount, everydayEquivalent] = line
                              .split('|')
                              .map((v) => v.trim());
                            return { name: name || '', amount: amount || '', everydayEquivalent };
                          }),
                        }))
                      }
                    />
                    <textarea
                      className={styles.textarea}
                      placeholder="Étapes (une par ligne)"
                      value={adminRecipeDraft.steps.join('\n')}
                      onChange={(e) =>
                        setAdminRecipeDraft((p) => ({ ...p, steps: parseTextList(e.target.value) }))
                      }
                    />
                    <textarea
                      className={styles.textarea}
                      placeholder="Tags (une par ligne)"
                      value={adminRecipeDraft.tags.join('\n')}
                      onChange={(e) =>
                        setAdminRecipeDraft((p) => ({ ...p, tags: parseTextList(e.target.value) }))
                      }
                    />
                    <label className={styles.adminCheckboxRow}>
                      <input
                        type="checkbox"
                        checked={adminRecipeDraft.isRecipeOfDay ?? false}
                        onChange={(e) =>
                          setAdminRecipeDraft((p) => ({
                            ...p,
                            isRecipeOfDay: e.target.checked,
                          }))
                        }
                      />
                      Définir comme recette du jour
                    </label>
                    <div className={styles.recipesAdminActions}>
                      <button type="button" className={styles.buttonPrimary} onClick={saveAdminRecipe}>
                        {adminEditingId ? 'Mettre à jour' : 'Ajouter recette'}
                      </button>
                      <button type="button" className={styles.buttonGhost} onClick={() => openAdminEditor()}>
                        Nouvelle fiche
                      </button>
                    </div>
                  </div>
                  <div className={styles.recipesAdminList}>
                    {recipeCatalog
                      .filter((r) => r.id.startsWith('custom-'))
                      .map((r) => (
                        <div key={r.id} className={styles.recipesAdminListRow}>
                          <span>{r.title}</span>
                          <div>
                            <button
                              type="button"
                              className={styles.buttonGhost}
                              onClick={() => openAdminEditor(r)}
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              className={styles.buttonGhost}
                              onClick={() => {
                                deleteCustomRecipe(r.id);
                                refreshRecipeCatalog();
                              }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              ) : null}

              {selectedCatalogRecipe ? (
                <div
                  className={styles.recipeSheetOverlay}
                  onClick={() => setSelectedCatalogRecipe(null)}
                  style={{ background: 'rgba(26,46,34,0.34)', backdropFilter: 'none' }}
                >
                  <div className={styles.recipeSheet} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.recipeSheetTopClose}
                      aria-label="Fermer la recette"
                      onClick={() => setSelectedCatalogRecipe(null)}
                    >
                      ×
                    </button>
                    {renderRecipeVisual(selectedCatalogRecipe, styles.recipeSheetImage, 'sheet')}
                    <div className={styles.recipeSheetBody}>
                      <h4 className={styles.recipeSheetTitle}>{selectedCatalogRecipe.title}</h4>
                      <p className={styles.recipeSheetDesc}>{selectedCatalogRecipe.description}</p>
                      <p className={styles.recipeSheetMeta}>
                        {selectedCatalogRecipe.prepMinutes} min · {selectedCatalogRecipe.servings} portion
                        {selectedCatalogRecipe.servings > 1 ? 's' : ''} ·{' '}
                        {getDisplayMealLabel(selectedCatalogRecipe)}
                      </p>
                      <h5 className={styles.recipeSheetSection}>Ingrédients</h5>
                      <ul className={styles.recipeSheetList}>
                        {selectedCatalogRecipe.ingredients.map((ingredient, idx) => {
                          const parts = getIngredientDisplayParts(ingredient);
                          return (
                            <li key={`${parts.name}-${idx}`}>
                              <strong>{parts.name}</strong> — {parts.detail || 'à ajuster'}
                            </li>
                          );
                        })}
                      </ul>
                      <h5 className={styles.recipeSheetSection}>Étapes</h5>
                      <ol className={styles.recipeSheetSteps}>
                        {selectedCatalogRecipe.steps.map((step, idx) => (
                          <li key={`${idx}-${step}`}>{step}</li>
                        ))}
                      </ol>
                      {selectedCatalogRecipe.tips?.length ? (
                        <>
                          <h5 className={styles.recipeSheetSection}>Conseils</h5>
                          <ul className={styles.recipeSheetList}>
                            {selectedCatalogRecipe.tips.map((tip) => (
                              <li key={tip}>{tip}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'courses' ? (
            <div
              className={`${styles.summaryCard} ${styles.resultsSection} ${styles.fadeInSoft}`}
              style={{
                background: 'linear-gradient(160deg, #FAF7F2, #FFF8F7)',
                borderRadius: 24,
                border: '1px solid #F3D6DB',
                boxShadow: '0 14px 28px rgba(26,46,34,0.08)',
                padding: '0.9rem',
              }}
            >
              <h3 className={styles.blockTitle}>Courses</h3>
              <p className={styles.intro}>Ta liste est déjà prête… tu gagnes un temps fou 🤍</p>
              <p className={styles.evolveNote}>
                {hasPremiumAccess
                  ? 'Premium : jusqu’à 15 jours, adaptation budget, téléchargement et partage.'
                  : 'Gratuit : version simple jusqu’à 7 jours.'}
              </p>
              <div
                className={styles.optionRow}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.38rem',
                  marginTop: '0.35rem',
                  marginBottom: '0.25rem',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 10, 15].map((dayCount) => (
                  <button
                    key={dayCount}
                    type="button"
                    className={`${styles.pillButton} ${coursesDays === dayCount ? styles.pillButtonActive : ''}`}
                    onClick={() => setCoursesDays(Math.min(dayCount, coursesDaysLimit))}
                    disabled={!hasPremiumAccess && dayCount > 7}
                    style={{
                      borderRadius: 999,
                      border: coursesDays === dayCount ? '1px solid #F2A7B0' : '1px solid rgba(242,167,176,0.46)',
                      background:
                        coursesDays === dayCount
                          ? 'linear-gradient(145deg, #F2A7B0, #F7C0C7)'
                          : dayCount > coursesDaysLimit
                            ? '#F7F2EC'
                            : '#FFFFFF',
                      color: coursesDays === dayCount ? '#7F4F5C' : '#1A2E22',
                      fontWeight: coursesDays === dayCount ? 700 : 600,
                      boxShadow:
                        coursesDays === dayCount
                          ? '0 8px 18px rgba(242,167,176,0.34)'
                          : '0 3px 9px rgba(26,46,34,0.06)',
                      transform: coursesDays === dayCount ? 'translateY(-1px)' : 'none',
                      transition: 'all 180ms ease',
                    }}
                  >
                    {dayCount} j
                  </button>
                ))}
              </div>
              <div
                style={{
                  borderRadius: 18,
                  background: 'linear-gradient(145deg, #FFF8F7, #FDF2F4 65%, #FDF7E8)',
                  border: '1px solid #F3D6DB',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                  padding: '0.62rem 0.78rem',
                  marginTop: '0.55rem',
                  marginBottom: '0.78rem',
                }}
              >
                <p className={styles.softNote} style={{ margin: 0 }}>
                  Liste affichée pour {coursesDays} jour{coursesDays > 1 ? 's' : ''} ·{' '}
                  {displayedShoppingByCategoryEntries.length} catégorie
                  {displayedShoppingByCategoryEntries.length > 1 ? 's' : ''} · Basée sur tes repas sélectionnés
                </p>
              </div>
              <div style={{ display: 'grid', gap: '0.64rem' }}>
                {displayedShoppingByCategoryEntries.map(([category, items]) => (
                  <article
                    key={category}
                    style={{
                      borderRadius: 20,
                      border: '1px solid #F3D6DB',
                      background: 'linear-gradient(160deg, #FFF8F7, #FFFFFF)',
                      boxShadow: '0 10px 18px rgba(26,46,34,0.06)',
                      padding: '0.68rem 0.78rem',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 999,
                        background: '#FDF7E8',
                        color: '#C8A44A',
                        border: '1px solid rgba(200,164,74,0.34)',
                        boxShadow: '0 4px 10px rgba(200,164,74,0.2)',
                        padding: '0.18rem 0.56rem',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {category}
                    </p>
                    <p style={{ margin: '0.5rem 0 0', color: '#5E7167', fontSize: '0.84rem', lineHeight: 1.62 }}>
                      {items.map((item) => `${item.name} — ${item.quantityLabel}`).join(' · ')}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'suivi' ? (
            <div className={`${styles.summaryCard} ${styles.resultsSection} ${styles.fadeInSoft}`}>
              <h3 className={styles.blockTitle}>Onglet Suivi</h3>
              <p className={styles.intro}>Tu avances déjà… même doucement, et ça compte 💖</p>
              <ul className={styles.summaryList}>
                <li>Poids départ : {progressSummary.startWeight ?? '—'} kg</li>
                <li>Poids actuel : {progressSummary.currentWeight ?? '—'} kg</li>
                <li>Évolution : {progressSummary.deltaKg ?? '—'} kg</li>
                <li>
                  {hasPremiumAccess
                    ? 'Premium : historique complet, mensurations détaillées et graphiques.'
                    : 'Gratuit : suivi simple du poids et progression basique.'}
                </li>
              </ul>
            </div>
          ) : null}

          {activeTab === 'besoin' ? (
            <div className={`${styles.summaryCard} ${styles.resultsSection} ${styles.fadeInSoft}`}>
              <h3 className={styles.blockTitle}>Besoin du moment</h3>
              <p className={styles.intro}>
                Des conseils rapides, doux et rassurants selon ton énergie du jour.
              </p>
              <ul className={styles.summaryList}>
                <li>Carte “J’ai faim entre les repas” : 3 astuces immédiates</li>
                <li>Carte “J’ai peu de temps” : repas express déjà prêts</li>
                <li>Carte “J’ai perdu ma motivation” : micro-rituels bienveillants</li>
              </ul>
            </div>
          ) : null}

          {activeTab === 'profil' ? (
            <div className={`${styles.summaryCard} ${styles.resultsSection} ${styles.fadeInSoft}`}>
              <h3 className={styles.blockTitle}>Profil</h3>
              <ul className={styles.summaryList}>
                <li>
                  Objectif : -{(goalValidationResult?.adjustedTargetKg ?? Number(targetKg)) || 0} kg
                </li>
                <li>Durée : {formatWeeksToTimelineLabel(goalValidationResult?.adjustedTimeframeWeeks ?? timeframeWeeks)}</li>
                <li>Alimentation : {diet || '—'}</li>
                <li>Rythme : {rhythm || '—'}</li>
                <li>Statut : {isAdminUser ? 'Administratrice' : hasPremiumAccess ? 'Premium actif' : 'Version essentielle'}</li>
              </ul>
            </div>
          ) : null}

          {activeTab === 'programme' ? (
            <>

          <header className={`${styles.programmeHero} ${styles.fadeInSoft}`}>
            <div className={styles.programmeHeroAccent} aria-hidden />
            <h2 className={styles.programmeHeroTitle}>Ta journée est prête ✨</h2>
            <p className={styles.programmeMotivationLine}>{dailyMotivationLine()}</p>
            <p className={styles.programmeHeroLead}>
              Touche un repas pour voir la recette complète, puis valide-le au fur et à mesure 💖
            </p>
            <div className={`${styles.dayProgressBlock} ${styles.dayProgressInHero}`}>
              <p className={styles.dayProgressText}>{dayValidatedLabel(dayProgress)}</p>
              <div className={styles.dayProgressBar} aria-hidden>
                <div
                  className={styles.dayProgressBarFill}
                  style={{ width: `${Math.min(100, (dayProgress / 3) * 100)}%` }}
                />
              </div>
              <p className={styles.dayProgressMotto}>
                {dayProgress >= 2 ? 'Ta journée avance bien ✨' : 'Chaque repas validé t’aide à garder ton rythme ❤️'}
              </p>
            </div>
            <div className={styles.programmeGlobalProgress}>
              <div className={styles.programmeGlobalProgressTop}>
                <span className={styles.programmeGlobalProgressLabel}>Progression programme</span>
                <span className={styles.programmeGlobalProgressValue}>{globalProgress}%</span>
              </div>
              <div className={styles.programmeGlobalProgressBar} aria-hidden>
                <div
                  className={styles.programmeGlobalProgressFill}
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
            </div>
            {targetTooFast && comfortTimeline ? (
              <p className={styles.programmeHeroHint}>
                Pour plus de confort sur la durée, un délai d’environ{' '}
                {comfortTimeline.minMonths === comfortTimeline.maxMonths
                  ? `${comfortTimeline.minMonths} mois`
                  : `${comfortTimeline.minMonths} à ${comfortTimeline.maxMonths} mois`}{' '}
                serait aussi très adapté ❤️
              </p>
            ) : null}
          </header>

          <div className={`${styles.programmeProfileCard} ${styles.fadeInSoft}`}>
            <div className={styles.programmeProfileGrid}>
              <div className={styles.programmeProfileItem}>
                <span className={styles.programmeProfileIcon} aria-hidden>🎯</span>
                <div>
                  <p className={styles.programmeProfileLabel}>Objectif</p>
                  <p className={styles.programmeProfileValue}>
                    Perte progressive (−{goalValidationResult?.adjustedTargetKg ?? (targetKg || '0')} kg) ·{' '}
                    {formatWeeksToTimelineLabel(
                      goalValidationResult?.adjustedTimeframeWeeks ?? timeframeWeeks
                    )}
                  </p>
                </div>
              </div>
              <div className={styles.programmeProfileItem}>
                <span className={styles.programmeProfileIcon} aria-hidden>🌿</span>
                <div>
                  <p className={styles.programmeProfileLabel}>Alimentation</p>
                  <p className={styles.programmeProfileValue}>{diet || '—'} · rythme {rhythm || '—'}</p>
                </div>
              </div>
              <div className={styles.programmeProfileItem}>
                <span className={styles.programmeProfileIcon} aria-hidden>💸</span>
                <div>
                  <p className={styles.programmeProfileLabel}>Budget</p>
                  <p className={styles.programmeProfileValue}>
                    {budget ? `${budget} / semaine` : 'Non précisé'}
                    {hasPremiumAccess ? ' · pris en compte dans tes menus' : ' · enregistré, appliqué en Premium'}
                  </p>
                </div>
              </div>
              <div className={styles.programmeProfileItem}>
                <span className={styles.programmeProfileIcon} aria-hidden>🌸</span>
                <div>
                  <p className={styles.programmeProfileLabel}>Saison</p>
                  <p className={styles.programmeProfileValue}>
                    {SEASON_FR[season] ?? season} · {seasonNote}
                  </p>
                </div>
              </div>
            </div>
            {goalValidationResult?.isAdjusted ? (
              <p className={styles.softWarning}>
                Ton objectif est ambitieux ❤️ Et c’est une très belle intention. On l’adapte pour qu’il reste doux, réaliste et surtout durable dans le temps.
              </p>
            ) : null}
            <p className={styles.programmeProfileFoot}>
              Allergies : {allergies.trim() || 'aucune précisée'} · À éviter :{' '}
              {dislikes.trim() || 'rien de signalé'}
            </p>
            <p className={styles.budgetApprox}>
              Les menus suivent ton budget de façon indicative (marques, courses déjà à la maison…).
            </p>
          </div>

          {!hasPremiumAccess ? (
            <div className={`${styles.premiumCallout} ${styles.premiumBlock} ${styles.fadeInSoft}`}>
              <div className={styles.sectionAccentBar} aria-hidden />
              <p className={styles.premiumCalloutTitle}>Ton programme est prêt… mais il va encore plus loin ✨</p>
              <p>Avec la version Premium, tu débloques :</p>
              <p>🌿 tous tes menus sur plusieurs semaines</p>
              <p>🌿 plus de flexibilité pour adapter tes repas</p>
              <p>🌿 une expérience encore plus personnalisée</p>
              <p>C’est ce qui fait toute la différence pour rester régulière et atteindre ton objectif 💛</p>
            </div>
          ) : null}

          <div className={`${styles.programmeSoftNotes} ${styles.fadeInSoft}`}>
            {dynamicNotes.slice(0, 3).map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>

          <p className={styles.programmeMetaLine}>
            {hasPremiumAccess ? '5 changements de repas / jour en Premium.' : '2 changements de repas / jour en gratuit.'}{' '}
            {hasPremiumAccess
              ? `Accès : ${displayedWeeks} semaine${displayedWeeks > 1 ? 's' : ''}.`
              : 'Tous tes jours de programme sont visibles — le Premium ajoute plus de flexibilité et d’options ✨'}
          </p>

          <div className={styles.weekNav}>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => setActiveWeek((w) => Math.max(0, w - 1))}
              disabled={activeWeek === 0}
            >
              Semaine précédente
            </button>
            <span className={styles.weekLabel}>
              Semaine {Math.min(activeWeek + 1, accessibleWeeks)} / {accessibleWeeks}
            </span>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => setActiveWeek((w) => Math.min(accessibleWeeks - 1, w + 1))}
              disabled={activeWeek >= accessibleWeeks - 1}
            >
              Semaine suivante
            </button>
          </div>

          <div className={styles.dayTabs}>
            {currentWeek?.days.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.dayTab} ${activeDay === idx ? styles.dayTabActive : ''}`}
                onClick={() => setActiveDay(idx)}
              >
                {DAYS[idx]}
              </button>
            ))}
          </div>

          {replaceInfo ? <p className={styles.replaceInfo}>{replaceInfo}</p> : null}
          {!hasPremiumAccess && usedChanges >= changesPerDay ? (
            <p className={styles.premiumHint}>
              Besoin de plus de flexibilité ? Le Premium permet jusqu’à 5 changements de repas par jour ❤️
            </p>
          ) : null}

          <section id="menus-personnalises" className={styles.menuGrid}>
            {currentDayPlan ? (
              <article key={`${activeWeek}-${activeDay}`} className={styles.menuDayCard}>
                <h4 className={styles.menuDayTitle}>{DAYS[activeDay]}</h4>
                {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot, slotIdx) => {
                  const meal = currentDayPlan[slot];
                  const validated = validationState[`${dayKey}-${slot}`];
                  if (!meal) return null;
                  const timeEmoji = SLOT_TIME_EMOJI[slot];
                  const slotLabel = SLOT_MEAL_LABEL[slot];
                  const ingredientPreview = meal.ingredients.slice(0, 4).join(' · ');
                  const seasonKey = meal.season[0];
                  const seasonLine =
                    seasonKey && SEASON_TAG_LABEL[seasonKey] ? SEASON_TAG_LABEL[seasonKey] : null;
                  const energyLine = MEAL_ENERGY_LINE[meal.caloriesLevel] ?? 'Repas équilibré';
                  const mealCardClass =
                    slot === 'breakfast'
                      ? styles.mealCardBreakfast
                      : slot === 'lunch'
                        ? styles.mealCardLunch
                        : styles.mealCardDinner;
                  return (
                    <div
                      key={slot}
                      className={`${styles.mealRow} ${validated ? styles.mealRowDone : ''} ${styles.mealRowStagger}`}
                      style={{ animationDelay: `${slotIdx * 0.06}s` }}
                    >
                      <button
                        type="button"
                        className={`${styles.mealCard} ${mealCardClass} ${validated ? styles.mealCardValidated : ''}`}
                        onClick={() => setRecipeModal({ meal, slot })}
                      >
                        <span className={styles.mealCardTop}>
                          <span className={styles.mealCardMoment}>
                            {timeEmoji} {slotLabel}
                          </span>
                          <span className={styles.mealChevron} aria-hidden>
                            →
                          </span>
                        </span>
                        <span className={styles.mealTitle}>{meal.name}</span>
                        {seasonLine ? <span className={styles.mealSeasonLine}>{seasonLine}</span> : null}
                        <span className={styles.mealEnergyLine}>{energyLine}</span>
                        <span className={styles.mealIngredients}>{ingredientPreview}</span>
                        <span className={styles.mealCardHint}>Clique pour voir la recette</span>
                      </button>
                      <div className={styles.mealActions}>
                        <button
                          type="button"
                          className={styles.mealBtnSecondary}
                          onClick={() => handleReplaceMeal(slot)}
                        >
                          Changer ce repas
                        </button>
                        <button
                          type="button"
                          className={`${styles.mealBtnPrimary} ${validated ? styles.mealBtnPrimaryDone : ''}`}
                          onClick={() => handleValidateMeal(slot)}
                        >
                          {validated ? 'Repas validé ✅' : 'Valider ce repas 💛'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </article>
            ) : null}
          </section>

          {recipeModal ? (
            <div className={styles.recipeModalOverlay} onClick={() => setRecipeModal(null)}>
              <div
                className={`${styles.recipeModal} ${styles.recipeModalEnter}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="recipe-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.recipeModalTopAccent} aria-hidden />
                <div className={styles.recipeModalBadges}>
                  <span className={styles.recipeModalBadgeMeal}>
                    {SLOT_TIME_EMOJI[recipeModal.slot]} {SLOT_MEAL_LABEL[recipeModal.slot]}
                  </span>
                  {recipeModal.meal.season[0] && SEASON_TAG_LABEL[recipeModal.meal.season[0]] ? (
                    <span className={styles.recipeModalBadgeSeason}>
                      {SEASON_TAG_LABEL[recipeModal.meal.season[0]]}
                    </span>
                  ) : null}
                  {buildProgrammeRecipeBadges(selectedRecipe, recipeModal.meal).map((label) => (
                    <span key={label} className={styles.recipeModalBadgePill}>
                      {label}
                    </span>
                  ))}
                </div>
                <div className={styles.recipeModalHeaderRow}>
                  <span className={styles.recipeModalHeaderEmoji} aria-hidden>
                    {SLOT_TIME_EMOJI[recipeModal.slot]}
                  </span>
                  <div className={styles.recipeModalHeaderText}>
                    <h4 id="recipe-modal-title" className={styles.recipeModalTitle}>
                      {recipeModal.meal.name}
                    </h4>
                    <p className={styles.recipeModalSubtitle}>Recette détaillée</p>
                  </div>
                </div>
                {selectedRecipe?.premiumOnly && !hasPremiumAccess ? (
                  <>
                    <p className={styles.recipeModalPremiumLock}>
                      Cette fiche complète est réservée au Premium ✨ Débloque le Premium pour les quantités précises
                      et toutes les étapes de cette recette exclusive.
                    </p>
                    <section className={styles.recipeModalSection}>
                      <div className={styles.recipeModalSectionHeading}>
                        <span className={styles.recipeModalSectionMark}>1</span>
                        <h5 className={styles.recipeModalSectionTitle}>Ingrédients (aperçu)</h5>
                      </div>
                      <ul className={styles.recipeModalListPremium}>
                        {recipeModal.meal.ingredients.map((name, idx) => (
                          <li key={`${idx}-${name}`} className={styles.recipeIngredientRow}>
                            <span className={styles.recipeIngredientBullet} aria-hidden>
                              •
                            </span>
                            <span className={styles.recipeIngredientNameOnly}>{name}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                ) : (
                  <>
                    <section className={styles.recipeModalSection}>
                      <div className={styles.recipeModalSectionHeading}>
                        <span className={styles.recipeModalSectionMark}>1</span>
                        <h5 className={styles.recipeModalSectionTitle}>Ingrédients</h5>
                      </div>
                      <ul className={styles.recipeModalListPremium}>
                        {(selectedRecipe?.ingredients ??
                          recipeModal.meal.ingredients.map((name) => ({
                            name,
                            amount: '',
                            everydayEquivalent: '1 portion · ajuste selon ton appétit',
                          }))
                        ).map((ingredient, idx) => {
                          const parts = getIngredientDisplayParts(ingredient);
                          return (
                            <li key={`${parts.name}-${idx}`} className={styles.recipeIngredientRow}>
                              <span className={styles.recipeIngredientBullet} aria-hidden>
                                •
                              </span>
                              <div className={styles.recipeIngredientBody}>
                                <span className={styles.recipeIngredientName}>{parts.name}</span>
                                {parts.detail ? (
                                  <span className={styles.recipeIngredientDetail}>{parts.detail}</span>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      <p className={styles.recipeModalPortionNote}>{RECIPE_PORTION_DISCLAIMER}</p>
                    </section>
                    <section className={styles.recipeModalSection}>
                      <div className={styles.recipeModalSectionHeading}>
                        <span className={styles.recipeModalSectionMark}>2</span>
                        <h5 className={styles.recipeModalSectionTitle}>Étapes</h5>
                      </div>
                      <ol className={styles.recipeModalSteps}>
                        {(selectedRecipe?.steps ?? [
                          'Prépare les ingrédients principaux.',
                          'Assemble le repas en gardant un format simple et rapide.',
                          'Ajuste l’assaisonnement selon ton goût.',
                        ]).map((step, idx) => (
                          <li key={`${idx}-${step.slice(0, 24)}`}>
                            <span className={styles.recipeStepNum}>{idx + 1}</span>
                            <span className={styles.recipeStepText}>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </section>
                  </>
                )}
                <div className={styles.recipeModalActions}>
                  <button type="button" className={styles.recipeModalClose} onClick={() => setRecipeModal(null)}>
                    Fermer
                  </button>
                  {!(selectedRecipe?.premiumOnly && !hasPremiumAccess) ? (
                    <button
                      type="button"
                      className={styles.recipeModalValidate}
                      disabled={validationState[`${dayKey}-${recipeModal.slot}`]}
                      onClick={() => {
                        handleValidateMeal(recipeModal.slot);
                        setRecipeModal(null);
                      }}
                    >
                      {validationState[`${dayKey}-${recipeModal.slot}`]
                        ? 'Déjà validé ✅'
                        : 'Valider ce repas 💛'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.progressOuter} aria-hidden>
          <div className={styles.progressInner} style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {step === 1 ? (
          <>
            {stepMeta(1)}
            <h2 className={styles.h2}>Ton objectif ✨</h2>
            <p className={styles.intro}>Combien de kilos aimerais-tu perdre ?</p>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              placeholder="Ex : 4"
              value={targetKg}
              onChange={(e) => setTargetKg(e.target.value)}
            />
            <p className={styles.intro}>En combien de temps ?</p>
            <div className={styles.optionRow}>
              {TIMELINE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.pillButton} ${timeline === option ? styles.pillButtonActive : ''}`}
                  onClick={() => setTimeline(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {targetFastWarning ? (
              <p className={styles.softWarning}>
                On va prendre soin de toi ❤️ Un rythme plus progressif permet des résultats durables et sans frustration.
                On va t’accompagner pour avancer en douceur, à ton rythme.
              </p>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            {stepMeta(2)}
            <h2 className={styles.h2}>Ton alimentation 🥗</h2>
            <p className={styles.intro}>Quel est ton type d’alimentation ?</p>
            <div className={styles.optionColumn}>
              {DIET_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionCardButton} ${diet === option ? styles.optionCardButtonActive : ''}`}
                  onClick={() => setDiet(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            {stepMeta(3)}
            <h2 className={styles.h2}>Tes préférences 🍽️</h2>
            <p className={styles.intro}>As-tu des allergies ou intolérances ?</p>
            <textarea
              className={styles.textarea}
              placeholder="Ex : lactose, gluten, fruits à coque..."
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
            <p className={styles.intro}>Y a-t-il des aliments que tu n’aimes pas ?</p>
            <textarea
              className={styles.textarea}
              placeholder="Ex : coriandre, choux, abats..."
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
            />
          </>
        ) : null}

        {step === 4 ? (
          <>
            {stepMeta(4)}
            <h2 className={styles.h2}>Ton budget 💰</h2>
            <p className={styles.intro}>
              Quel budget hebdomadaire souhaites-tu consacrer à tes repas ?
            </p>
            <p className={styles.softNote}>
              Cette option permet d’adapter les menus à ton budget. Elle est appliquée
              automatiquement avec la version Premium ✨
            </p>
            <div className={styles.optionColumn}>
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionCardButton} ${budget === option ? styles.optionCardButtonActive : ''}`}
                  onClick={() => setBudget(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 5 ? (
          <>
            {stepMeta(5)}
            <h2 className={styles.h2}>Ton quotidien 🌿</h2>
            <p className={styles.intro}>Ton rythme de vie est plutôt :</p>
            <div className={styles.optionColumn}>
              {RHYTHM_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionCardButton} ${rhythm === option ? styles.optionCardButtonActive : ''}`}
                  onClick={() => setRhythm(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div className={styles.actions}>
          {step > 1 ? (
            <button type="button" className={styles.buttonGhost} onClick={() => setStep((s) => s - 1)}>
              Retour
            </button>
          ) : (
            <span />
          )}
          <button type="button" className={styles.button} onClick={goNext} disabled={!canContinue()}>
            Continuer →
          </button>
        </div>
      </div>
    </div>
  );
}
