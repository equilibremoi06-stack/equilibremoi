export type SeasonalKind = 'season' | 'event';

export interface AccentColors {
  primary: string;
  secondary: string;
  tertiary?: string;
}

export interface SeasonalTheme {
  themeKey: string;
  type: SeasonalKind;
  label: string;
  welcomeMessage: string;
  accentColors: AccentColors;
  decorationType: string;
  showProfileBadge: boolean;
  badgeText: string;
  recipeMood: string;
  cssClassName: string;
}

/** Dimanche de Pâques (grégorien), date locale à minuit. */
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function inInclusiveRange(day: Date, start: Date, end: Date): boolean {
  const t = stripTime(day).getTime();
  return t >= stripTime(start).getTime() && t <= stripTime(end).getTime();
}

function isValentine(day: Date): boolean {
  const y = day.getFullYear();
  return inInclusiveRange(day, new Date(y, 1, 8), new Date(y, 1, 14));
}

function isWomensDay(day: Date): boolean {
  const y = day.getFullYear();
  return inInclusiveRange(day, new Date(y, 2, 2), new Date(y, 2, 8));
}

function isHalloween(day: Date): boolean {
  const y = day.getFullYear();
  return inInclusiveRange(day, new Date(y, 9, 21), new Date(y, 9, 31));
}

function isChristmas(day: Date): boolean {
  const y = day.getFullYear();
  return inInclusiveRange(day, new Date(y, 11, 1), new Date(y, 11, 25));
}

/** Du jour J-7 (inclus) jusqu’au dimanche de Pâques (inclus). */
function isEasterPeriod(day: Date): boolean {
  const easter = getEasterSunday(day.getFullYear());
  const start = new Date(easter);
  start.setDate(start.getDate() - 7);
  return inInclusiveRange(day, start, easter);
}

function getSeason(day: Date): SeasonalTheme {
  const m = day.getMonth();
  const d = day.getDate();

  const afterOrEq = (mm: number, dd: number) =>
    m > mm || (m === mm && d >= dd);
  const beforeOrEq = (mm: number, dd: number) =>
    m < mm || (m === mm && d <= dd);

  if (afterOrEq(2, 20) && beforeOrEq(5, 20)) {
    return {
      themeKey: 'spring',
      type: 'season',
      label: 'Printemps',
      welcomeMessage: 'Le printemps est là 🌸 Ton corps se réveille aussi',
      accentColors: {
        primary: '#e8b4c8',
        secondary: '#a8d4ba',
        tertiary: '#f5e6ef',
      },
      decorationType: 'petals',
      showProfileBadge: false,
      badgeText: '',
      recipeMood: 'Léger, vert, fleuri — salades et premières saveurs douces.',
      cssClassName: 'seasonal-theme--spring',
    };
  }

  if (afterOrEq(5, 21) && beforeOrEq(8, 22)) {
    return {
      themeKey: 'summer',
      type: 'season',
      label: 'Été',
      welcomeMessage: "L'été s'invite dans ton assiette ☀️",
      accentColors: {
        primary: '#e8c96a',
        secondary: '#7ec4c4',
        tertiary: '#fff9e6',
      },
      decorationType: 'sun-halo',
      showProfileBadge: false,
      badgeText: '',
      recipeMood: 'Fraîcheur, couleurs soleil, eaux infusées et marchés.',
      cssClassName: 'seasonal-theme--summer',
    };
  }

  if (afterOrEq(8, 23) && beforeOrEq(11, 20)) {
    return {
      themeKey: 'autumn',
      type: 'season',
      label: 'Automne',
      welcomeMessage: "L'automne réchauffe ton quotidien 🍂",
      accentColors: {
        primary: '#c4a574',
        secondary: '#b85c5c',
        tertiary: '#f4ebe4',
      },
      decorationType: 'leaves',
      showProfileBadge: false,
      badgeText: '',
      recipeMood: 'Réconfortant, couleurs chaudes, légumes de saison.',
      cssClassName: 'seasonal-theme--autumn',
    };
  }

  return {
    themeKey: 'winter',
    type: 'season',
    label: 'Hiver',
    welcomeMessage: 'Prends soin de toi cet hiver ❄️',
    accentColors: {
      primary: '#c5d4e0',
      secondary: '#a8b8c8',
      tertiary: '#faf8f5',
    },
    decorationType: 'frost-shimmer',
    showProfileBadge: false,
    badgeText: '',
    recipeMood: 'Douceur, cocooning, tisanes et plats mijotés légers.',
    cssClassName: 'seasonal-theme--winter',
  };
}

/**
 * Fêtes avant saisons. Ordre : Noël, Halloween, Pâques, Journée de la femme, Saint-Valentin.
 */
export function getActiveSeasonalTheme(now: Date = new Date()): SeasonalTheme {
  if (isChristmas(now)) {
    return {
      themeKey: 'christmas',
      type: 'event',
      label: 'Noël',
      welcomeMessage: 'Mange avec joie sans culpabilité 🌟',
      accentColors: {
        primary: '#c45c5c',
        secondary: '#d4a853',
        tertiary: '#fdf6f0',
      },
      decorationType: 'sparkle-tree',
      showProfileBadge: false,
      badgeText: '',
      recipeMood: 'Festif, doux, partage — sans excès de culpabilité.',
      cssClassName: 'seasonal-theme--christmas',
    };
  }

  if (isHalloween(now)) {
    return {
      themeKey: 'halloween',
      type: 'event',
      label: 'Halloween',
      welcomeMessage: 'Les recettes sont ensorcelées 🌙',
      accentColors: {
        primary: '#9b6b8f',
        secondary: '#e89d5c',
        tertiary: '#2a2438',
      },
      decorationType: 'pumpkin-moon',
      showProfileBadge: false,
      badgeText: '',
      recipeMood: 'Créatif, épices douces, couleurs crépusculaires.',
      cssClassName: 'seasonal-theme--halloween',
    };
  }

  if (isEasterPeriod(now)) {
    return {
      themeKey: 'easter',
      type: 'event',
      label: 'Pâques',
      welcomeMessage: 'Pâques doux et coloré 🥚',
      accentColors: {
        primary: '#e8a8c8',
        secondary: '#a8d4e8',
        tertiary: '#fffef8',
      },
      decorationType: 'easter-eggs',
      showProfileBadge: false,
      badgeText: '',
      recipeMood: 'Gourmandise légère, couleurs pastel, partage.',
      cssClassName: 'seasonal-theme--easter',
    };
  }

  if (isWomensDay(now)) {
    return {
      themeKey: 'womens-day',
      type: 'event',
      label: 'Journée de la femme',
      welcomeMessage: 'Tu es extraordinaire 💫',
      accentColors: {
        primary: '#d4af37',
        secondary: '#e8b4b8',
        tertiary: '#fffaf5',
      },
      decorationType: 'gold-glow',
      showProfileBadge: true,
      badgeText: '✦',
      recipeMood: 'Célébration douce, équilibre et bienveillance.',
      cssClassName: 'seasonal-theme--womens-day',
    };
  }

  if (isValentine(now)) {
    return {
      themeKey: 'valentine',
      type: 'event',
      label: 'Saint-Valentin',
      welcomeMessage: "Prends soin de toi, c'est aussi ça l'amour 🧡",
      accentColors: {
        primary: '#e8a0a8',
        secondary: '#f0c8d0',
        tertiary: '#fff5f7',
      },
      decorationType: 'hearts-soft',
      showProfileBadge: false,
      badgeText: '',
      recipeMood: 'Tendresse, petites douceurs conscientes.',
      cssClassName: 'seasonal-theme--valentine',
    };
  }

  return getSeason(now);
}

export function applySeasonalCssVars(root: HTMLElement, theme: SeasonalTheme): void {
  const { primary, secondary, tertiary } = theme.accentColors;
  root.style.setProperty('--seasonal-accent-primary', primary);
  root.style.setProperty('--seasonal-accent-secondary', secondary);
  if (tertiary) {
    root.style.setProperty('--seasonal-accent-tertiary', tertiary);
  }
}
