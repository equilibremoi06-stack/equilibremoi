/**
 * Contenu ménopause : informations générales de bien-être, sans prescription ni dosage.
 * Ne pas utiliser comme substitut à un avis médical.
 */

export const MENOPAUSE_MEDICAL_REDIRECT =
  'En cas de traitement hormonal, douleur, saignement, cancer, symptôme intense ou inhabituel, consulte sans attendre un professionnel de santé.';

export const menopauseSymptomsHandled = [
  'Bouffées de chaleur',
  'Santé osseuse',
  'Prise de poids abdominale / équilibre glycémique',
  'Sommeil',
  'Humeur / fatigue',
] as const;

export const menopauseNutritionGeneral = {
  title: 'Approche nutritionnelle prudente',
  lines: [
    'Privilégier une alimentation variée et des repas réguliers, adaptés à ton appétit.',
    'Hydratation suffisante au fil de la journée.',
    'Limiter progressivement ce qui t’inconforte (alcool, excitants, épices très fortes) selon ta tolérance.',
  ],
};

export const menopauseFoodsToFavor = [
  'Légumes et fruits de saison',
  'Protéines variées (légumineuses, poissons, œufs, etc.) selon tes habitudes',
  'Féculents peu transformés selon tolérance',
  'Sources alimentaires de calcium au fil de la journée (produits laitiers ou alternatives enrichies, etc.)',
];

export const menopauseFoodsOrHabitsToModerate = [
  'Alcool (à modérer selon ce qui te convient)',
  'Boissons très caféinées surtout en fin de journée si elles gênent le sommeil',
  'Aliments très épicés si tu remarques un inconfort',
  'Ultra-transformés en excès',
];

export const hotFlashesContent = {
  title: 'Bouffées de chaleur',
  prudentTips: [
    'Repas simples, bonne hydratation.',
    'Alcool à modérer.',
    'Boissons caféinées à limiter surtout l’après-midi si elles aggravent les symptômes pour toi.',
    'Épices fortes à modérer si elles déclenchent un inconfort.',
  ],
  soyNote:
    'Le soja n’est pas une solution « prouvée » pour tout le monde : si tu en parles, reste prudente et ne l’impose pas comme règle.',
  aiToneExample:
    'Le café du matin peut rester un plaisir 😊 Si tu remarques que tes bouffées de chaleur sont plus fortes ensuite, on peut tester une version plus douce l’après-midi.',
};

export const boneHealthContent = {
  title: 'Santé osseuse',
  tips: [
    'Encourager la présence régulière de sources alimentaires de calcium.',
    'Alimentation variée et activité physique adaptée à ta forme.',
    'En cas de doute de carence : ton médecin pourra faire le point.',
  ],
  message:
    '💚 Pour ta santé osseuse, pense à inclure régulièrement une source de calcium dans la journée. Si tu penses avoir une carence, ton médecin pourra faire le point avec toi.',
};

export const weightGlycemicContent = {
  title: 'Prise de poids abdominale / équilibre glycémique',
  tips: [
    'Repas structurés.',
    'Aliments peu transformés, fibres, féculents complets selon tolérance.',
    'Bons gras et hydratation.',
  ],
  aiToneExample:
    'Les changements hormonaux peuvent modifier la façon dont le corps stocke. Pas de panique 💚 On va surtout chercher plus de stabilité et moins de pics.',
};

export const sleepContent = {
  title: 'Sommeil',
  tips: [
    'Repas du soir plus simples si c’est plus confortable pour toi.',
    'Limiter alcool et excitants selon ta tolérance.',
    'Hydratation adaptée et petite routine du soir.',
  ],
};

export const moodFatigueContent = {
  title: 'Humeur / fatigue',
  tips: [
    'Régularité des repas et hydratation.',
    'Aliments riches en nutriments au fil de la semaine.',
    'Petits changements valorisés, sans promesse de résultat.',
  ],
};

export const menopauseDisclaimers = [
  'ÉquilibreMoi est une application de bien-être : pas de prescription, pas de dosage de compléments, pas de promesse thérapeutique.',
  MENOPAUSE_MEDICAL_REDIRECT,
];
