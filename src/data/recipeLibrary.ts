import type { SeasonScope } from './mealDatabase';

export type RecipeIngredient = {
  name: string;
  amount: string;
  everydayEquivalent?: string;
};

export type RecipeLibraryItem = {
  id: string;
  title: string;
  tags: string[];
  prepMinutes: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  premiumOnly?: boolean;
  /** Saisons d’affinité ; `all` = intemporel. Défaut traité comme `['all']` côté app. */
  season?: SeasonScope[];
};

export type Recipe = RecipeLibraryItem;

export const recipeLibrary: RecipeLibraryItem[] = [
    {
      id: "breakfast-1",
      title: "Bowl yaourt fruits rouges",
      tags: ["leger", "protein"],
      season: ['spring', 'summer', 'autumn'],
      prepMinutes: 10,
      ingredients: [
        { name: "Yaourt grec", amount: "150g", everydayEquivalent: "1 pot" },
        { name: "Fruits rouges", amount: "80g", everydayEquivalent: "1 poignée" },
        { name: "Flocons d'avoine", amount: "30g", everydayEquivalent: "3 cuillères à soupe" },
      ],
      steps: [
        "Verser le yaourt dans un bol.",
        "Ajouter les fruits rouges.",
        "Saupoudrer avec les flocons d'avoine.",
      ],
    },
    {
      id: "breakfast-2",
      title: "Tartines avocat œuf",
      tags: ["protein", "leger"],
      season: ['all'],
      prepMinutes: 15,
      ingredients: [
        { name: "Pain complet", amount: "2 tranches" },
        { name: "Avocat", amount: "1/2" },
        { name: "Œufs", amount: "2" },
      ],
      steps: [
        "Faire griller les tranches de pain.",
        "Écraser l'avocat sur les tartines.",
        "Cuire les œufs puis les déposer dessus.",
      ],
    },
    {
      id: "lunch-1",
      title: "Salade poulet quinoa",
      tags: ["protein", "leger"],
      season: ['spring', 'summer'],
      prepMinutes: 25,
      ingredients: [
        { name: "Quinoa", amount: "100g" },
        { name: "Blanc de poulet", amount: "120g" },
        { name: "Tomates cerises", amount: "10" },
      ],
      steps: [
        "Cuire le quinoa puis le laisser tiédir.",
        "Faire cuire le poulet à la poêle.",
        "Assembler le tout dans une assiette.",
      ],
    },
    {
      id: "lunch-2",
      title: "Wrap végétarien au houmous",
      tags: ["vegetarien", "petit-budget"],
      season: ['spring', 'summer'],
      prepMinutes: 15,
      ingredients: [
        { name: "Galette de blé", amount: "1" },
        { name: "Houmous", amount: "2 cuillères à soupe" },
        { name: "Crudités", amount: "100g" },
      ],
      steps: [
        "Étaler le houmous sur la galette.",
        "Ajouter les crudités.",
        "Rouler le wrap bien serré.",
      ],
    },
    {
      id: "lunch-3",
      title: "Pâtes complètes thon tomate",
      tags: ["petit-budget", "protein"],
      season: ['all'],
      prepMinutes: 20,
      ingredients: [
        { name: "Pâtes complètes", amount: "100g" },
        { name: "Thon", amount: "1 boîte" },
        { name: "Sauce tomate", amount: "150g" },
      ],
      steps: [
        "Cuire les pâtes.",
        "Réchauffer la sauce tomate.",
        "Ajouter le thon et mélanger avec les pâtes.",
      ],
    },
    {
      id: "dinner-1",
      title: "Soupe légumes maison",
      tags: ["vegetarien", "leger", "petit-budget"],
      season: ['autumn', 'winter', 'spring'],
      prepMinutes: 30,
      ingredients: [
        { name: "Carottes", amount: "2" },
        { name: "Courgette", amount: "1" },
        { name: "Pommes de terre", amount: "2" },
      ],
      steps: [
        "Éplucher et couper les légumes.",
        "Faire cuire dans une casserole d'eau.",
        "Mixer jusqu'à obtenir une soupe lisse.",
      ],
    },
    {
      id: "dinner-2",
      title: "Saumon riz brocolis",
      tags: ["protein", "leger"],
      season: ['all'],
      prepMinutes: 25,
      ingredients: [
        { name: "Saumon", amount: "120g" },
        { name: "Riz", amount: "100g" },
        { name: "Brocolis", amount: "150g" },
      ],
      steps: [
        "Cuire le riz.",
        "Cuire le saumon au four ou à la poêle.",
        "Cuire les brocolis à la vapeur.",
      ],
    },
    {
      id: "dinner-3",
      title: "Omelette champignons fromage",
      tags: ["protein", "petit-budget"],
      season: ['autumn', 'winter', 'spring'],
      prepMinutes: 15,
      ingredients: [
        { name: "Œufs", amount: "3" },
        { name: "Champignons", amount: "100g" },
        { name: "Fromage râpé", amount: "30g" },
      ],
      steps: [
        "Faire revenir les champignons.",
        "Battre les œufs dans un bol.",
        "Cuire l'omelette avec le fromage râpé.",
      ],
    },
  ];
export const RECIPE_PORTION_DISCLAIMER =
  "Les portions sont données à titre indicatif.";

export function getIngredientDisplayParts(ingredient: string | RecipeIngredient): {
  quantity: string;
  unit: string;
  name: string;
  detail: string;
} {
  if (typeof ingredient === "string") {
    return {
      quantity: "",
      unit: "",
      name: ingredient,
      detail: "",
    };
  }

  const detail = [ingredient.amount, ingredient.everydayEquivalent]
    .filter(Boolean)
    .join(" · ");

  return {
    quantity: ingredient.amount,
    unit: "",
    name: ingredient.name,
    detail,
  };
}

function normalizeRecipeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveRecipeForMeal(mealId?: string, mealName?: string): Recipe | undefined {
  const byId = mealId ? recipeLibrary.find((recipe) => recipe.id === mealId) : undefined;
  if (byId) return byId;

  if (mealName) {
    const key = normalizeRecipeKey(mealName);
    const byTitle = recipeLibrary.find((recipe) => normalizeRecipeKey(recipe.title) === key);
    if (byTitle) return byTitle;
  }

  return undefined;
}