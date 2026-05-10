import { recipeLibrary } from './recipeLibrary';
import { isUserAdminFromMetadata } from '../lib/authFlow';


export type RecipeMealTime = 'matin' | 'midi' | 'soir' | 'collation';


export type RecipeCatalogItem = {
  id: string;
  title: string;
  description: string;
  photoUrl: string;
  category: 'rapide' | 'plaisir' | 'vegetarien' | 'leger' | 'protein' | 'petit-budget' | 'equilibre';
  mealTime: RecipeMealTime;
  prepMinutes: number;
  servings: number;
  ingredients: { name: string; amount: string; everydayEquivalent?: string }[];
  steps: string[];
  tags: string[];
  tips?: string[];
  isFeatured?: boolean;
  isRecipeOfDay?: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};


const RECIPES_CUSTOM_KEY = 'equilibremoi_recipes_custom_v1';


const baseRecipes: RecipeCatalogItem[] = recipeLibrary.slice(0, 8).map((r, idx) => ({
  id: `base-${r.id}`,
  title: r.title,
  description: 'Une recette simple, gourmande et adaptée à ton rythme.',
  photoUrl: '',
  category: r.tags.includes('vegetarien')
    ? 'vegetarien'
    : r.tags.includes('leger')
      ? 'leger'
      : r.tags.includes('protein')
        ? 'protein'
        : r.tags.includes('petit-budget')
          ? 'petit-budget'
          : 'equilibre',
  mealTime: idx % 3 === 0 ? 'matin' : idx % 3 === 1 ? 'midi' : 'soir',
  prepMinutes: r.prepMinutes,
  servings: 1,
  ingredients: r.ingredients,
  steps: r.steps,
  tags: r.tags,
  tips: ['Tu peux ajuster les épices selon tes envies du jour.'],
  isFeatured: idx === 0,
  isRecipeOfDay: idx === 1,
  isPublished: true,
  createdAt: new Date(2026, 0, idx + 1).toISOString(),
  updatedAt: new Date(2026, 0, idx + 1).toISOString(),
}));


export function canAccessRecipesAdmin(
  user:
    | {
        email?: string | null;
        app_metadata?: Record<string, unknown> | null;
        user_metadata?: Record<string, unknown> | null;
      }
    | null
    | undefined
): boolean {
  return isUserAdminFromMetadata(user);
}


export function listRecipesForApp(): RecipeCatalogItem[] {
  const custom = listCustomRecipes();
  return [...baseRecipes, ...custom]
    .filter((r) => r.isPublished)
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}


export function getRecipeOfDay(
  recipes: RecipeCatalogItem[]
): RecipeCatalogItem | undefined {
  const flagged = recipes.find((r) => r.isRecipeOfDay);
  if (flagged) return flagged;
  if (recipes.length === 0) return undefined;
  const now = new Date();
  const daySeed = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) /
      (1000 * 60 * 60 * 24),
  );
  return recipes[daySeed % recipes.length];
}


export function upsertCustomRecipe(item: RecipeCatalogItem): void {
  const all = listCustomRecipes();
  const next = [...all.filter((r) => r.id !== item.id), item];
  saveCustomRecipes(next);
}


export function deleteCustomRecipe(id: string): void {
  const all = listCustomRecipes().filter((r) => r.id !== id);
  saveCustomRecipes(all);
}


export function createEmptyAdminRecipe(): RecipeCatalogItem {
  const now = new Date().toISOString();
  return {
    id: `custom-${Date.now()}`,
    title: '',
    description: '',
    photoUrl: '',
    category: 'equilibre',
    mealTime: 'midi',
    prepMinutes: 20,
    servings: 1,
    ingredients: [],
    steps: [],
    tags: [],
    tips: [],
    isFeatured: false,
    isRecipeOfDay: false,
    isPublished: true,
    createdAt: now,
    updatedAt: now,
  };
}


function listCustomRecipes(): RecipeCatalogItem[] {
  try {
    const raw = localStorage.getItem(RECIPES_CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecipeCatalogItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}


function saveCustomRecipes(items: RecipeCatalogItem[]): void {
  try {
    localStorage.setItem(RECIPES_CUSTOM_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}