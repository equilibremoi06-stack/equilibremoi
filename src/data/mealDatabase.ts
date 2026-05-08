export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescetarian';
export type BudgetType = 'low' | 'medium' | 'high';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export type Meal = {
  id: string;
  name: string;
  type: MealType;
  diets: DietType[];
  budget: BudgetType[];
  prepTime: 'quick' | 'standard';
  caloriesLevel: 'light' | 'balanced' | 'satisfying';
  season: SeasonType[];
  tags: string[];
  ingredients: string[];
  description?: string;
  excludes?: string[];
};

const ALL_DIETS: DietType[] = ['omnivore', 'vegetarian', 'vegan', 'pescetarian'];
const FISH_DIETS: DietType[] = ['omnivore', 'pescetarian'];
const OMNIVORE_ONLY: DietType[] = ['omnivore'];
const ALL_SEASONS: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];

export const mealDatabase: Meal[] = [
  {
    id: 'b1',
    name: 'Bowl yaourt grec, fruits rouges & granola',
    type: 'breakfast',
    diets: ['omnivore', 'vegetarian', 'pescetarian'],
    budget: ['low', 'medium'],
    prepTime: 'quick',
    caloriesLevel: 'balanced',
    season: ALL_SEASONS,
    ingredients: ['Yaourt grec', 'Fruits rouges', 'Granola', 'Miel'],
    tags: ['bowl', 'fresh', 'protein:dairy', 'quick'],
  },
  {
    id: 'b2',
    name: 'Tartines avocat & oeuf poché',
    type: 'breakfast',
    diets: ['omnivore', 'vegetarian', 'pescetarian'],
    budget: ['medium', 'high'],
    prepTime: 'quick',
    caloriesLevel: 'satisfying',
    season: ALL_SEASONS,
    ingredients: ['Pain complet', 'Avocat', 'Oeuf', 'Citron'],
    tags: ['toast', 'protein:egg', 'comfort', 'quick'],
  },
  {
    id: 'b3',
    name: 'Porridge avoine & banane',
    type: 'breakfast',
    diets: ALL_DIETS,
    budget: ['low', 'medium'],
    prepTime: 'quick',
    caloriesLevel: 'balanced',
    season: ['autumn', 'winter', 'spring'],
    ingredients: ["Flocons d'avoine", 'Lait végétal', 'Banane', 'Cannelle'],
    tags: ['warm', 'veggie', 'budget', 'quick'],
  },
  {
    id: 'l1',
    name: 'Salade de lentilles, feta & légumes rôtis',
    type: 'lunch',
    diets: ['omnivore', 'vegetarian', 'pescetarian'],
    budget: ['low', 'medium'],
    prepTime: 'standard',
    caloriesLevel: 'balanced',
    season: ['spring', 'summer', 'autumn'],
    ingredients: ['Lentilles cuites', 'Feta', 'Poivron', 'Courgette', "Huile d'olive"],
    tags: ['salad', 'protein:legume', 'veggie', 'batch'],
  },
  {
    id: 'l2',
    name: 'Wrap poulet grillé & crudités',
    type: 'lunch',
    diets: OMNIVORE_ONLY,
    budget: ['medium'],
    prepTime: 'quick',
    caloriesLevel: 'balanced',
    season: ['spring', 'summer'],
    ingredients: ['Tortilla complète', 'Poulet grillé', 'Salade', 'Tomate', 'Yaourt nature'],
    tags: ['wrap', 'protein:chicken', 'fresh', 'quick'],
  },
  {
    id: 'l3',
    name: 'Soupe de pois chiches & épinards',
    type: 'lunch',
    diets: ALL_DIETS,
    budget: ['low', 'medium'],
    prepTime: 'standard',
    caloriesLevel: 'light',
    season: ['autumn', 'winter', 'spring'],
    ingredients: ['Pois chiches', 'Épinards frais', 'Tomates concassées', 'Cumin'],
    tags: ['warm', 'protein:legume', 'veggie', 'light'],
  },
  {
    id: 'l4',
    name: 'Bowl quinoa, avocat & saumon fumé',
    type: 'lunch',
    diets: FISH_DIETS,
    budget: ['medium', 'high'],
    prepTime: 'quick',
    caloriesLevel: 'satisfying',
    season: ['spring', 'summer'],
    ingredients: ['Quinoa cuit', 'Saumon fumé', 'Avocat', 'Concombre', 'Sauce soja'],
    tags: ['bowl', 'protein:fish', 'fresh', 'quick'],
  },
  {
    id: 'd1',
    name: 'Filet de cabillaud & légumes vapeur',
    type: 'dinner',
    diets: FISH_DIETS,
    budget: ['medium', 'high'],
    prepTime: 'standard',
    caloriesLevel: 'light',
    season: ALL_SEASONS,
    ingredients: ['Cabillaud', 'Brocoli', 'Carottes', 'Citron', 'Herbes de Provence'],
    tags: ['light', 'protein:fish', 'simple'],
  },
  {
    id: 'd2',
    name: 'Curry de pois chiches & lait de coco',
    type: 'dinner',
    diets: ALL_DIETS,
    budget: ['low', 'medium'],
    prepTime: 'standard',
    caloriesLevel: 'satisfying',
    season: ['autumn', 'winter'],
    ingredients: ['Pois chiches', 'Lait de coco', 'Tomates', 'Curry', 'Riz basmati'],
    tags: ['warm', 'comfort', 'protein:legume', 'veggie'],
  },
  {
    id: 'd3',
    name: 'Omelette aux champignons & fromage de chèvre',
    type: 'dinner',
    diets: ['omnivore', 'vegetarian', 'pescetarian'],
    budget: ['low', 'medium'],
    prepTime: 'quick',
    caloriesLevel: 'balanced',
    season: ALL_SEASONS,
    ingredients: ['Oeufs', 'Champignons', 'Fromage de chèvre', 'Ciboulette'],
    tags: ['protein:egg', 'quick', 'comfort'],
  },
  {
    id: 's1',
    name: 'Pomme, amandes & carré de chocolat',
    type: 'snack',
    diets: ALL_DIETS,
    budget: ['low', 'medium'],
    prepTime: 'quick',
    caloriesLevel: 'light',
    season: ALL_SEASONS,
    ingredients: ['Pomme', 'Amandes', 'Chocolat noir'],
    tags: ['fresh', 'quick', 'snack'],
  },
];
