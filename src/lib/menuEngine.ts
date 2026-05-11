import { mealDatabase } from '../data/mealDatabase';
import type {
  BudgetType,
  DietType,
  Meal,
  MealType,
  SeasonScope,
  SeasonType,
} from '../data/mealDatabase';

export interface UserFoodProfile {
  diet: DietType;
  allergies: string[];
  dislikes: string[];
  budget?: number | null;
  isPremium: boolean;
  prepStyle?: 'quick' | 'flex';
}

export interface GeneratedDayMeals {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snack?: Meal;
}

export interface GeneratedWeek {
  weekNumber: number;
  days: GeneratedDayMeals[];
}

type MealHistoryItem = {
  mealId: string;
  weekNumber: number;
  dayNumber: number;
  type: MealType;
  tags: string[];
  ingredients: string[];
};

const DAYS_PER_WEEK = 7;
const DEFAULT_MIN_WEEKS = 8;
const ROTATION_LOCK_WEEKS = 3;
const PRIMARY_TAGS = new Set([
  'bowl',
  'wrap',
  'salad',
  'pasta',
  'warm',
  'comfort',
  'fresh',
  'batch',
  'light',
  'protein',
  'veggie',
]);

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function includesAnyKeyword(haystack: string[], keywords: string[]): boolean {
  if (!keywords.length) return false;
  const normalizedHaystack = haystack.map((item) => normalize(item));
  return keywords.some((keyword) =>
    normalizedHaystack.some(
      (value) => value.includes(keyword) || keyword.includes(value),
    ),
  );
}

function getMainStyleTag(meal: Meal): string | null {
  for (const tag of meal.tags) {
    if (PRIMARY_TAGS.has(tag)) return tag;
  }
  return null;
}

function getProteinTag(meal: Meal): string | null {
  return meal.tags.find((tag) => tag.startsWith('protein:')) ?? null;
}

function scoreByBudgetFit(meal: Meal, targetBudget: BudgetType): number {
  if (meal.budget.includes(targetBudget)) return 10;
  if (targetBudget === 'medium' && meal.budget.includes('low')) return 5;
  if (targetBudget === 'high' && meal.budget.includes('medium')) return 4;
  if (targetBudget === 'low' && meal.budget.includes('medium')) return -4;
  if (targetBudget === 'low' && meal.budget.includes('high')) return -8;
  return -2;
}

export function getCurrentSeason(date = new Date()): SeasonType {
  const month = date.getMonth(); // 0 = Jan
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

/**
 * Couche « saison » douce : jamais de filtrage, uniquement un bonus / léger malus dans le score.
 * - Aligné avec la saison courante : priorité forte (sensation ~majorité saisonnière).
 * - `all` : filet de repères intemporels (~neutre / « 30 % » possibles).
 * - Saison non couverte : léger malus ; le repas reste sélectionnable (pas de blocage).
 */
export function scoreSeasonPreference(
  scopes: readonly SeasonScope[],
  current: SeasonType,
): number {
  if (!scopes.length) return 6;
  if (scopes.some((s) => s === 'all')) return 6;
  if (scopes.includes(current)) return 14;
  return -2;
}

function scoreBySeasonFit(meal: Meal, season: SeasonType): number {
  return scoreSeasonPreference(meal.season, season);
}

export function mapBudgetToLevel(budget?: number | null): BudgetType {
  if (budget == null || Number.isNaN(budget)) return 'medium';
  if (budget <= 25) return 'low';
  if (budget <= 45) return 'medium';
  return 'high';
}

export function isMealCompatible(meal: Meal, profile: UserFoodProfile): boolean {
  if (!meal.diets.includes(profile.diet)) return false;

  if (profile.isPremium) {
    const userBudget = mapBudgetToLevel(profile.budget);
    if (!meal.budget.includes(userBudget)) return false;
  }

  if (profile.prepStyle === 'quick' && meal.prepTime !== 'quick') return false;

  const restrictedWords = uniqueStrings([
    ...profile.allergies,
    ...profile.dislikes,
  ]).map((item) => normalize(item));

  if (!restrictedWords.length) return true;

  const mealWords = [
    meal.name,
    ...meal.ingredients,
    ...(meal.excludes ?? []),
    ...meal.tags,
  ];

  return !includesAnyKeyword(mealWords, restrictedWords);
}

/** Budget élargi (palier voisin) — uniquement pour compléter les alternatives Premium sans toucher au menu du jour. */
function isMealCompatibleRelaxedBudgetOnly(meal: Meal, profile: UserFoodProfile): boolean {
  if (!meal.diets.includes(profile.diet)) return false;

  const userBudget = mapBudgetToLevel(profile.budget);
  const neighbor: Record<BudgetType, BudgetType[]> = {
    low: ['low', 'medium'],
    medium: ['low', 'medium', 'high'],
    high: ['medium', 'high'],
  };
  if (!neighbor[userBudget].some((b) => meal.budget.includes(b))) return false;

  if (profile.prepStyle === 'quick' && meal.prepTime !== 'quick') return false;

  const restrictedWords = uniqueStrings([
    ...profile.allergies,
    ...profile.dislikes,
  ]).map((item) => normalize(item));

  if (!restrictedWords.length) return true;

  const mealWords = [
    meal.name,
    ...meal.ingredients,
    ...(meal.excludes ?? []),
    ...meal.tags,
  ];

  return !includesAnyKeyword(mealWords, restrictedWords);
}

export function getCompatibleMealsByType(
  type: MealType,
  profile: UserFoodProfile,
): Meal[] {
  return mealDatabase.filter(
    (meal) => meal.type === type && isMealCompatible(meal, profile),
  );
}

function scoreMealVariety(
  meal: Meal,
  type: MealType,
  profile: UserFoodProfile,
  weekNumber: number,
  dayNumber: number,
  usedThisWeek: Set<string>,
  history: MealHistoryItem[],
  season: SeasonType,
): number {
  let score = 100;

  if (!meal.diets.includes(profile.diet)) score -= 1000;
  if (usedThisWeek.has(meal.id)) score -= 80;

  const recentSameType = history
    .filter((item) => item.type === type)
    .sort((a, b) => b.weekNumber - a.weekNumber || b.dayNumber - a.dayNumber);

  const recentThreeWeeks = recentSameType.filter(
    (item) => weekNumber - item.weekNumber <= ROTATION_LOCK_WEEKS,
  );

  if (recentThreeWeeks.some((item) => item.mealId === meal.id)) {
    score -= 120;
  }

  const mainStyle = getMainStyleTag(meal);
  const proteinTag = getProteinTag(meal);

  const lastMeal = recentSameType[0];
  const prevMeal = recentSameType[1];

  if (lastMeal) {
    const overlapIngredients = meal.ingredients.filter((ingredient) =>
      lastMeal.ingredients.some(
        (old) => normalize(old) === normalize(ingredient),
      ),
    ).length;

    if (overlapIngredients >= 2) score -= 12;

    const lastStyle = lastMeal.tags.find((tag) => PRIMARY_TAGS.has(tag)) ?? null;
    const lastProtein = lastMeal.tags.find((tag) => tag.startsWith('protein:')) ?? null;

    if (mainStyle && lastStyle === mainStyle) score -= 16;
    if (proteinTag && lastProtein === proteinTag) score -= 14;
  }

  if (lastMeal && prevMeal) {
    const lastStyle = lastMeal.tags.find((tag) => PRIMARY_TAGS.has(tag)) ?? null;
    const prevStyle = prevMeal.tags.find((tag) => PRIMARY_TAGS.has(tag)) ?? null;
    if (mainStyle && lastStyle === mainStyle && prevStyle === mainStyle) score -= 24;

    const lastProtein = lastMeal.tags.find((tag) => tag.startsWith('protein:')) ?? null;
    const prevProtein = prevMeal.tags.find((tag) => tag.startsWith('protein:')) ?? null;
    if (
      proteinTag &&
      lastProtein === proteinTag &&
      prevProtein === proteinTag
    ) {
      score -= 20;
    }
  }

  if (profile.isPremium) {
    score += scoreByBudgetFit(meal, mapBudgetToLevel(profile.budget));
  }

  score += scoreBySeasonFit(meal, season);

  if (meal.prepTime === 'quick') score += 2;
  if (dayNumber >= 5 && meal.tags.includes('comfort')) score += 2;

  return score;
}

function pickBestMeal(
  candidates: Meal[],
  context: {
    type: MealType;
    profile: UserFoodProfile;
    weekNumber: number;
    dayNumber: number;
    usedThisWeek: Set<string>;
    history: MealHistoryItem[];
    avoidIds?: Set<string>;
    season: SeasonType;
  },
): Meal | undefined {
  const avoidIds = context.avoidIds ?? new Set<string>();
  const scored = candidates
    .filter((meal) => !avoidIds.has(meal.id))
    .map((meal) => ({
      meal,
      score: scoreMealVariety(
        meal,
        context.type,
        context.profile,
        context.weekNumber,
        context.dayNumber,
        context.usedThisWeek,
        context.history,
        context.season,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 4);
  if (!top.length) return undefined;

  const bestScore = top[0].score;
  const nearBest = top.filter((item) => item.score >= bestScore - 3);
  return nearBest[Math.floor(Math.random() * nearBest.length)].meal;
}

function appendHistory(
  history: MealHistoryItem[],
  meal: Meal,
  weekNumber: number,
  dayNumber: number,
): void {
  history.push({
    mealId: meal.id,
    weekNumber,
    dayNumber,
    type: meal.type,
    tags: meal.tags,
    ingredients: meal.ingredients,
  });
}

export function generateDayMeals(
  profile: UserFoodProfile,
  recentMealIds: string[],
): GeneratedDayMeals {
  const dayHistory: MealHistoryItem[] = [];
  const usedThisWeek = new Set<string>(recentMealIds);
  const avoidIds = new Set<string>(recentMealIds);
  const dayNumber = 1;
  const weekNumber = 1;
  const season = getCurrentSeason();

  const breakfast = pickBestMeal(getCompatibleMealsByType('breakfast', profile), {
    type: 'breakfast',
    profile,
    weekNumber,
    dayNumber,
    usedThisWeek,
    history: dayHistory,
    avoidIds,
    season,
  });
  if (breakfast) {
    usedThisWeek.add(breakfast.id);
    appendHistory(dayHistory, breakfast, weekNumber, dayNumber);
  }

  const lunch = pickBestMeal(getCompatibleMealsByType('lunch', profile), {
    type: 'lunch',
    profile,
    weekNumber,
    dayNumber,
    usedThisWeek,
    history: dayHistory,
    avoidIds,
    season,
  });
  if (lunch) {
    usedThisWeek.add(lunch.id);
    appendHistory(dayHistory, lunch, weekNumber, dayNumber);
  }

  const dinner = pickBestMeal(getCompatibleMealsByType('dinner', profile), {
    type: 'dinner',
    profile,
    weekNumber,
    dayNumber,
    usedThisWeek,
    history: dayHistory,
    avoidIds,
    season,
  });
  if (dinner) {
    usedThisWeek.add(dinner.id);
    appendHistory(dayHistory, dinner, weekNumber, dayNumber);
  }

  const snack = pickBestMeal(getCompatibleMealsByType('snack', profile), {
    type: 'snack',
    profile,
    weekNumber,
    dayNumber,
    usedThisWeek,
    history: dayHistory,
    avoidIds,
    season,
  });

  return { breakfast, lunch, dinner, snack };
}

export function generateWeekPlan(
  weekNumber: number,
  profile: UserFoodProfile,
  recentMealIds: string[],
): GeneratedWeek {
  const days: GeneratedDayMeals[] = [];
  const weekUsed = new Set<string>();
  const history: MealHistoryItem[] = [];
  const season = getCurrentSeason();

  // Seed with recent meals to avoid immediate repetition.
  for (const mealId of recentMealIds) {
    weekUsed.add(mealId);
  }

  for (let dayNumber = 1; dayNumber <= DAYS_PER_WEEK; dayNumber += 1) {
    const day: GeneratedDayMeals = {};
    const dayTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

    for (const type of dayTypes) {
      const pool = getCompatibleMealsByType(type, profile);
      const meal = pickBestMeal(pool, {
        type,
        profile,
        weekNumber,
        dayNumber,
        usedThisWeek: weekUsed,
        history,
        season,
      });
      if (!meal) continue;
      day[type] = meal;
      weekUsed.add(meal.id);
      appendHistory(history, meal, weekNumber, dayNumber);
    }

    days.push(day);
  }

  return { weekNumber, days };
}

export function generateProgram(
  totalWeeks: number,
  profile: UserFoodProfile,
): GeneratedWeek[] {
  const targetWeeks = Math.max(totalWeeks, DEFAULT_MIN_WEEKS);
  const weeks: GeneratedWeek[] = [];
  const rollingHistoryByWeek: string[][] = [];

  for (let weekNumber = 1; weekNumber <= targetWeeks; weekNumber += 1) {
    const recentMealIds = rollingHistoryByWeek
      .slice(-ROTATION_LOCK_WEEKS)
      .flat();

    const week = generateWeekPlan(weekNumber, profile, recentMealIds);
    weeks.push(week);

    const currentWeekIds = week.days.flatMap((day) =>
      [day.breakfast, day.lunch, day.dinner, day.snack]
        .filter(Boolean)
        .map((meal) => (meal as Meal).id),
    );
    rollingHistoryByWeek.push(currentWeekIds);
  }

  return weeks;
}

export function replaceMeal(
  currentMeal: Meal,
  type: MealType,
  profile: UserFoodProfile,
  excludedMealIds: string[],
): Meal | null {
  const pool = getCompatibleMealsByType(type, profile).filter(
    (meal) => meal.id !== currentMeal.id && !excludedMealIds.includes(meal.id),
  );

  if (!pool.length) return null;

  const usedThisWeek = new Set<string>(excludedMealIds);
  const season = getCurrentSeason();
  const history: MealHistoryItem[] = excludedMealIds.map((id, index) => {
    const found = mealDatabase.find((meal) => meal.id === id);
    if (!found) {
      return {
        mealId: id,
        weekNumber: 1,
        dayNumber: index + 1,
        type,
        tags: [],
        ingredients: [],
      };
    }
    return {
      mealId: found.id,
      weekNumber: 1,
      dayNumber: index + 1,
      type: found.type,
      tags: found.tags,
      ingredients: found.ingredients,
    };
  });

  const next = pickBestMeal(pool, {
    type,
    profile,
    weekNumber: 1,
    dayNumber: 1,
    usedThisWeek,
    history,
    avoidIds: new Set<string>([currentMeal.id, ...excludedMealIds]),
    season,
  });

  return next ?? null;
}

export type GetMealAlternativesOptions = {
  /**
   * Si le pool « strict » (même filtres que la génération du programme) est petit,
   * ajoute des repas du même moment de la journée qui restent cohérents régime / allergies / rythme,
   * en élargissant légèrement le budget (palier adjacent). Réservé au Premium ; pas de tirage “aléatoire hors profil”.
   */
  expandPoolWhenSparse?: boolean;
};

export function getMealAlternatives(
  currentMeal: Meal,
  type: MealType,
  profile: UserFoodProfile,
  excludedMealIds: string[],
  limit: number,
  options?: GetMealAlternativesOptions,
): Meal[] {
  const safeExcluded = excludedMealIds.filter(Boolean);
  const usedThisWeek = new Set<string>(safeExcluded);
  const season = getCurrentSeason();
  const avoidIds = new Set<string>([currentMeal.id, ...safeExcluded]);
  const history: MealHistoryItem[] = safeExcluded.map((id, index) => {
    const found = mealDatabase.find((meal) => meal.id === id);
    return {
      mealId: id,
      weekNumber: 1,
      dayNumber: index + 1,
      type: found?.type ?? type,
      tags: found?.tags ?? [],
      ingredients: found?.ingredients ?? [],
    };
  });

  const strictPool = getCompatibleMealsByType(type, profile).filter(
    (meal) => !avoidIds.has(meal.id),
  );

  const expand =
    Boolean(options?.expandPoolWhenSparse) &&
    profile.isPremium &&
    strictPool.length < limit;

  let pool: Meal[] = strictPool;

  if (expand) {
    const strictIds = new Set(strictPool.map((m) => m.id));
    const relaxedAdds = mealDatabase.filter(
      (meal) =>
        meal.type === type &&
        !avoidIds.has(meal.id) &&
        !strictIds.has(meal.id) &&
        isMealCompatibleRelaxedBudgetOnly(meal, profile),
    );
    pool = [...strictPool, ...relaxedAdds];
  }

  const ranked = pool
    .map((meal) => ({
      meal,
      score: scoreMealVariety(meal, type, profile, 1, 1, usedThisWeek, history, season),
    }))
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const deduped: { meal: Meal; score: number }[] = [];
  for (const row of ranked) {
    if (seen.has(row.meal.id)) continue;
    seen.add(row.meal.id);
    deduped.push(row);
  }

  const cap = Math.max(0, limit);
  return deduped.slice(0, cap).map(({ meal }) => meal);
}

export const FREE_MEAL_ALTERNATIVE_LIMIT = 2;
export const PREMIUM_MEAL_ALTERNATIVE_LIMIT = 6;

export function getDailyReplacementLimit(isPremium: boolean): number {
  return isPremium ? PREMIUM_MEAL_ALTERNATIVE_LIMIT : FREE_MEAL_ALTERNATIVE_LIMIT;
}

export function buildPersonalizationSummary(profile: UserFoodProfile): string[] {
  const summary: string[] = [];

  const dietLabels: Record<DietType, string> = {
    omnivore: 'Alimentation omnivore',
    vegetarian: 'Alimentation végétarienne',
    vegan: 'Alimentation végétalienne',
    pescetarian: 'Alimentation pescétarienne',
  };

  summary.push(dietLabels[profile.diet]);

  if (profile.isPremium) {
    const budgetLevel = mapBudgetToLevel(profile.budget);
    const budgetLabel: Record<BudgetType, string> = {
      low: 'Budget serré pris en compte',
      medium: 'Budget modéré pris en compte',
      high: 'Budget confort pris en compte',
    };
    summary.push(budgetLabel[budgetLevel]);
  } else if (profile.budget != null) {
    summary.push(
      'Budget enregistré (ajustement automatique des menus inclus en Premium)',
    );
  }

  const blocked = uniqueStrings([...profile.allergies, ...profile.dislikes]);
  if (blocked.length) {
    summary.push(`Menus sans ${blocked.map((w) => normalize(w)).join(', ')}`);
  }

  if (profile.prepStyle === 'quick') {
    summary.push('Préférence pour des repas rapides');
  }

  summary.push('Objectif: équilibre durable et perte de poids progressive');

  return summary;
}

export function buildSeasonNote(season: SeasonType): string {
  const notes: Record<SeasonType, string> = {
    spring:
      'Une pointe de fraîcheur printanière — repas légers, équilibrés, tout en douceur ✨',
    summer: 'Des assiettes fraîches, légères et colorées — comme une pause bienvenue ☀️',
    autumn: 'Des saveurs réconfortantes et une assiette chaleureuse pour accompagner l’automne 🍂',
    winter: 'Des repas réconfortants, moment cocooning, saveurs douces pour l’hiver ❄️',
  };

  return notes[season];
}
