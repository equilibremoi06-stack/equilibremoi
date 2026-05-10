/** Contenus premium « vivants » : rotation hebdo / jour / saison (déterministe, sans backend). */

export function getIsoWeekNumber(reference = new Date()): number {
  const d = new Date(Date.UTC(reference.getFullYear(), reference.getMonth(), reference.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((d.getTime() - y.getTime()) / 86400000 / 7);
}

export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

export function monthToSeason(monthIndex: number): SeasonKey {
  if (monthIndex >= 2 && monthIndex <= 4) return 'spring';
  if (monthIndex >= 5 && monthIndex <= 7) return 'summer';
  if (monthIndex >= 8 && monthIndex <= 10) return 'autumn';
  return 'winter';
}

const SEASON_WHISPERS: Record<SeasonKey, string[]> = {
  spring: [
    'Les premières douceurs du printemps invitent à des repas plus légers et colorés 🌸',
    'C’est cette saison où ton corps aime retrouver fraîcheur et légèreté au plat.',
  ],
  summer: [
    'L’été appelle l’hydratation et des assiettes simples, pour ne pas surcharger ton énergie ☀️',
    'Les équilibres du soir gagnent à être plus légers quand les journées sont longues.',
  ],
  autumn: [
    'L’automne se prête aux petits plats réconfortants, sans excès — juste ce qu’il faut de chaleur 🍂',
    'Cocooning oui, mais avec des protéines et des couleurs pour garder la vitalité.',
  ],
  winter: [
    'L’hiver te rappelle d’être douce avec ton appétit : ton corps peut demander plus de densité ❄️',
    'Les matins plus protéinés t’aident souvent à tenir jusque midi sans fringale.',
  ],
};

/** Graine stable par utilisateur + semaine + jour (0 = lundi). */
export function livingSeed(week: number, dayIndexMon0: number, userId?: string | null): number {
  let s = week * 13 + dayIndexMon0 * 17;
  if (userId) {
    for (let i = 0; i < userId.length; i += 1) {
      s = (s + userId.charCodeAt(i) * (i + 3)) % 100000;
    }
  }
  return s;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

const WEEKLY_PRIMARY_INSIGHTS: string[] = [
  'Ton corps semble apprécier davantage les repas riches en protéines le matin 🌿',
  'Quand tu prévois un peu plus de temps le midi, tes journées semblent plus régulières ✨',
  'Tes repas les plus équilibrés coïncident souvent avec des soirées plus calmes.',
  'Les matinées où tu inclus une protéine solide semblent te donner plus de stabilité jusqu’au déjeuner.',
  'Tu avances avec plus de douceur les semaines où tu varies les textures et les couleurs d’assiette.',
  'Ton énergie semble meilleure quand le dîner reste léger et digeste 🌙',
  'Les journées où tu cuisines moins de 20 minutes peuvent rester très équilibrées — la simplicité te réussit.',
  'Une toucher plus végétal au déjeuner semble t’apporter plus de confort digestif.',
  'Quand tu prends un vrai moment pour le petit-déjeuner, ta journée paraît plus ancrée.',
  'Les semaines où tu hydrates un peu plus, ton ressenti semble plus fluide.',
  'Ton rythme aime les transitions douces entre les repas — sans long jeûne forcé.',
  'Les repas partagés calmement semblent prolonger ton bien-être, même hors assiette.',
];

const MICRO_WINS: string[] = [
  'Aujourd’hui, un simple « bien joué pour ton intention » suffit 💛',
  'Une petite victoire : tu fais attention à toi, et ça se voit.',
  'Ta régularité, même imparfaite, est déjà une forme de courage.',
  'Chaque choix aligné avec ton corps est une preuve de respect envers toi.',
  'Tu n’as pas besoin d’être à 100 % pour être déjà sur le bon chemin.',
  'Ce que tu as mis en place cette semaine mérite une vraie reconnaissance.',
  'Souviens-toi : le progrès, c’est aussi les jours où tu ne lâches pas complètement.',
];

const ENCOURAGEMENTS: string[] = [
  'L’application apprend de tes préférences — ton parcours est unique, et c’est normal qu’il évolue.',
  'Plus tu utilises ton espace en douceur, plus les suggestions gagnent en justesse.',
  'Rien n’est figé : chaque semaine, un nouveau fil se tisse avec ce que tu vis vraiment.',
  'Ton histoire avec l’alimentation mérite d’être écoutée sans urgence ni jugement.',
  'Les micro-ajustements d’aujourd’hui préparent souvent les grands apaisements de demain.',
];

export const CORRELATION_SPOTLIGHTS: string[] = [
  'Tu sembles plus régulière quand tes petits-déjeuners sont protéinés.',
  'Tes journées les plus équilibrées pourraient être celles où tu cuisines moins de 20 minutes.',
  'Ton énergie semble meilleure après des repas plus légers le soir.',
  'Quand tu prends le temps d’un déjeuner complet, tes après-midis paraissent plus stables.',
  'Les semaines où tu varies les légumes semblent aussi plus confortables pour ton ventre.',
  'Une hydratation un peu plus présente semble aller de pair avec un meilleur sommeil perçu.',
  'Les jours où tu marches un peu, ton ressenti alimentaire semble plus serein.',
];

export function getSeasonalWhisper(now = new Date(), userId?: string | null): string {
  const season = monthToSeason(now.getMonth());
  const w = getIsoWeekNumber(now);
  const d = (now.getDay() + 6) % 7;
  return pick(SEASON_WHISPERS[season], livingSeed(w, d, userId));
}

export function getWeeklyPrimaryInsight(now = new Date(), userId?: string | null): string {
  const w = getIsoWeekNumber(now);
  const d = (now.getDay() + 6) % 7;
  return pick(WEEKLY_PRIMARY_INSIGHTS, livingSeed(w, d, userId));
}

export function getMicroWinLine(now = new Date(), userId?: string | null): string {
  const w = getIsoWeekNumber(now);
  const d = (now.getDay() + 6) % 7;
  return pick(MICRO_WINS, livingSeed(w, d, userId) + 3);
}

export function getEncouragementLine(now = new Date(), userId?: string | null): string {
  const w = getIsoWeekNumber(now);
  const d = (now.getDay() + 6) % 7;
  return pick(ENCOURAGEMENTS, livingSeed(w + 1, d, userId));
}

export function getCorrelationHighlights(now = new Date(), userId?: string | null, count = 4): string[] {
  const w = getIsoWeekNumber(now);
  const base = livingSeed(w, (now.getDay() + 6) % 7, userId);
  const out: string[] = [];
  const used = new Set<number>();
  let i = 0;
  while (out.length < count && i < CORRELATION_SPOTLIGHTS.length * 2) {
    const idx = (base + i * 7) % CORRELATION_SPOTLIGHTS.length;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(CORRELATION_SPOTLIGHTS[idx]);
    }
    i += 1;
  }
  return out;
}

export function getMotivationalQuoteForPdf(now = new Date(), userId?: string | null): string {
  const pool = [...WEEKLY_PRIMARY_INSIGHTS, ...ENCOURAGEMENTS];
  const w = getIsoWeekNumber(now);
  const d = (now.getDay() + 6) % 7;
  return pick(pool, livingSeed(w, d, userId) + 11);
}
