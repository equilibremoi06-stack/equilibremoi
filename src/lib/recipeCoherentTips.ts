import type { SeasonType } from '../data/mealDatabase';
import type { RecipeMealTime } from '../data/recipesHub';

export type MealSlotForTips = 'breakfast' | 'lunch' | 'dinner';

export type CoherentTipsInput = {
  slot: MealSlotForTips;
  mealId: string;
  mealName: string;
  mealIngredients: string[];
  caloriesLevel?: 'light' | 'balanced' | 'satisfying';
  recipeTitle?: string;
  recipeTags?: string[];
  recipeCategory?: string;
  /** Saison calendaire : une phrase d’ambiance au plus, jamais intrusive. */
  season?: SeasonType;
};

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Indice stable : même recette → mêmes variantes choisies (pas un tirage à chaque ouverture). */
function seedPick(seed: string, salt: string, modulo: number): number {
  const raw = `${seed}|${salt}`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}

function pickOne(lines: readonly string[], seed: string, salt: string): string {
  if (lines.length === 0) return '';
  return lines[seedPick(seed, salt, lines.length)] ?? lines[0];
}

function blob(ctx: CoherentTipsInput): string {
  const parts = [
    ctx.mealName,
    ctx.recipeTitle ?? '',
    ctx.mealIngredients.join(' '),
    ...(ctx.recipeTags ?? []),
    ctx.recipeCategory ?? '',
  ];
  return norm(parts.join(' '));
}

export function mealTimeToSlot(mealTime: RecipeMealTime): MealSlotForTips {
  if (mealTime === 'matin') return 'breakfast';
  if (mealTime === 'midi') return 'lunch';
  return 'dinner';
}

const BREAKFAST = [
  'Pour une énergie douce jusqu’au prochain repas, combine féculent lent + protéine (yaourt, œuf, fromage blanc…) quand tu peux.',
  'Le soir précédent, pose tes bols / fruits / flocons : le matin, tu gagnes en calme sans oublier le petit-déj.',
  'Vise le confort digestif : trop de sucre rapide peut donner un coup de pompe ; les fibres et la protéine aident à lisser la courbe.',
  'Tiède ou à température ambiante : parfois c’est plus doux pour le réveil qu’un bol très froid.',
  'Une matinée pressée ? Prépare la veille un mix prêt à assembler en deux gestes le lendemain.',
] as const;

const LUNCH = [
  'Le midi, un repas qui rassasie sans alourdir aide souvent à tenir l’après-midi : protéine + légumes + féculent si tu en as envie.',
  'Écoute ton équilibre du moment : si tu as eu faim hier l’après-midi, ajoute une petite portion en plus aujourd’hui.',
  'Une belle assiette colorée = plaisir pour les yeux et fibres variées sans complication.',
] as const;

const DINNER = [
  'Le soir, les cuissons douces (four, vapeur, mijoté léger) gardent des textures tendres et digestes.',
  'Une assiette un peu plus légère le soir aide souvent le sommeil — sans rigidité : ton appétit a le dernier mot.',
  'Assaisonne à la fin pour préserver le goût des herbes et limiter le sel au strict nécessaire.',
] as const;

const SOUP = [
  'Soupe et velouté : pense batch cooking — une grande casserole, puis portions au frais ou au congélateur.',
  'Réchauffe à feu doux ; un filet d’huile ou des herbes fraîches au dernier moment ravivent les saveurs.',
  'Un topping croquant (graines torréfiées, quelques noix, chapelure légère au four) change toute la texture.',
] as const;

const FISH = [
  'Poisson en filet : cuisson plutôt courte pour garder le moelleux ; arrête un peu avant si tu aimes le cœur encore tendre.',
  'Citron, aneth, ciboulette ou baies roses : parfums qui soulagent le poisson sans le masquer.',
  'Consomme vite après l’achat ou congèle sans traîner : la qualité du poisson se joue là.',
] as const;

const VEG_PROTEIN = [
  'Repas végé : associe légumineuse ou tofu + céréale complète pour une satiété qui tient bien.',
  'Cumin doux, paprika fumé, coriandre : peu d’épices, beaucoup de caractère sans alourdir.',
  'Varie les textures (croquant, crémeux) : l’assiette paraît plus généreuse sans calories superflues.',
] as const;

const SALAD_RAW = [
  'Crudités : assaisonne au dernier moment pour garder le croquant et les couleurs vives.',
  'Une base de légumes + une protéine visible = assiette complète et claire pour le corps.',
] as const;

const POULTRY = [
  'Volaille en morceaux réguliers = cuisson plus homogène et viande plus tendre à cœur.',
  'Quelques minutes de repos après cuisson : les jus se répartissent, la bouchée est plus moelleuse.',
] as const;

const EGGS = [
  'Œufs : cuisson douce, feu maîtrisé — retire avant que ce ne soit sec si tu aimes le jaune crémeux.',
  'Une pincée de sel en fin de cuisson suffit souvent à équilibrer sans sursalage.',
] as const;

const AVOCADO = [
  'Avocat à point : chair souple sous la peau, sans filaments amers — sinon il manque un peu de rondeur.',
  'Un filet de citron ou de citron vert limite l’oxydation si tu prépares à l’avance.',
] as const;

const OATS = [
  'Flocons d’avoine : mijote avec assez de liquide et en remuant pour une texture soyeuse, pas « pâteuse ».',
  'Cannelle ou une pointe de vanille : douceur nature sans rajouter de sucre.',
] as const;

const RICE_NOODLE = [
  'Riz ou pâtes : respecte le temps de cuisson indiqué pour éviter le ramolli ou le cœur dur.',
  "Un peu d'huile après égouttage évite parfois que ça colle, surtout pour les lendemains de lunch box.",
] as const;

const EQ_SOFT = [
  'Si un ingrédient ne te convient pas, « Changer ce repas » dans ton programme garde le tout aligné avec ton profil.',
  'Ajuste les quantités selon ta faim du jour : le confort prime, pas la « perf alimentaire ».',
] as const;

/** Une seule phrase possible par saison, choix stable par recette. */
const SEASON_MOOD: Record<SeasonType, readonly string[]> = {
  winter: [
    'En ce moment, les repas un peu réconfortants et les saveurs douces collent souvent bien à l’hiver.',
  ],
  summer: [
    'En été, une assiette fraîche et colorée peut faire tout le plaisir sans alourdir.',
  ],
  autumn: [
    'En automne, les plats doux et un brin réconfortants accompagnent gentiment les journées qui raccourcissent.',
  ],
  spring: [
    'Au printemps, une touche de fraîcheur légère suffit souvent à éveiller l’envie de manger équilibré.',
  ],
};

export function buildCoherentRecipeTips(ctx: CoherentTipsInput): string[] {
  const t = blob(ctx);
  const seed = `${ctx.mealId}:${ctx.slot}`;
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (line: string) => {
    const k = norm(line);
    if (!line || seen.has(k)) return;
    seen.add(k);
    out.push(line);
  };

  if (ctx.slot === 'breakfast') {
    push(pickOne(BREAKFAST, seed, 'slot'));
  } else if (ctx.slot === 'lunch') {
    push(pickOne(LUNCH, seed, 'slot'));
  } else {
    push(pickOne(DINNER, seed, 'slot'));
  }

  if (/\b(soupe|veloute|velouté|minestrone|bisque|gazpacho)\b/.test(t)) {
    push(pickOne(SOUP, seed, 'soup'));
  }

  if (/\b(saumon|poisson|thon|cabillaud|daurade|dorade|maquereau|sardine|truite|lieu|colin|moules?|crevette)\b/.test(t)) {
    push(pickOne(FISH, seed, 'fish'));
  }

  if (
    /\b(tofu|tempeh|lentille|pois chiche|houmous|hummus|falafel|vegetarien|vegétarien|vegan|vege|legumineuse)\b/.test(t) ||
    ctx.recipeCategory === 'vegetarien' ||
    (ctx.recipeTags ?? []).some((x) => norm(x).includes('veget'))
  ) {
    push(pickOne(VEG_PROTEIN, seed, 'veg'));
  }

  if (/\b(salade|wrap|crudit|taboule|bowl froid)\b/.test(t)) {
    push(pickOne(SALAD_RAW, seed, 'salad'));
  }

  if (/\b(poulet|dinde|canard)\b/.test(t)) {
    push(pickOne(POULTRY, seed, 'poultry'));
  }

  if (/\b(oeuf|œuf|omelette|coque|poch)\b/.test(t)) {
    push(pickOne(EGGS, seed, 'egg'));
  }

  if (/\b(avocat)\b/.test(t)) {
    push(pickOne(AVOCADO, seed, 'avo'));
  }

  if (/\b(avoine|flocon|porridge|muesli|granola)\b/.test(t)) {
    push(pickOne(OATS, seed, 'oats'));
  }

  if (/\b(riz|quinoa|pate|pâtes|nouille|couscous|boulgour)\b/.test(t)) {
    push(pickOne(RICE_NOODLE, seed, 'starch'));
  }

  if (ctx.caloriesLevel === 'light') {
    push(
      pickOne(
        [
          'Assiette légère : hydrate bien et ajoute une protéine même modeste pour éviter la faim deux heures après.',
          'Les saveurs vives (herbes, agrume) donnent du peps sans alourdir.',
        ],
        seed,
        'light',
      ),
    );
  } else if (ctx.caloriesLevel === 'satisfying') {
    push(
      pickOne(
        [
          'Repas rassasiant : tu peux ajuster légèrement une portion demain si tu te sens trop pleine — toujours sans culpabilité.',
          'Les protéines et les fibres aident la satiété ; écrase-les trop vite : l’assiette reste généreuse.',
        ],
        seed,
        'sat',
      ),
    );
  }

  while (out.length < 3) {
    push(pickOne(EQ_SOFT, seed, `eq${out.length}`));
  }

  if (ctx.season && out.length < 4) {
    const mood = SEASON_MOOD[ctx.season];
    if (mood?.length) push(pickOne(mood, seed, 'season'));
  }

  return out.slice(0, 4);
}
