export type ShoppingCategory =
  | 'legumes'
  | 'fruits'
  | 'proteines'
  | 'cremerie'
  | 'epicerie'
  | 'petits-dejeuners'
  | 'collations';

export type ShoppingItem = {
  name: string;
  category: ShoppingCategory;
  quantity: string;
};

const BASE_ITEMS: ShoppingItem[] = [
  { name: 'Courgettes', category: 'legumes', quantity: '6 pieces' },
  { name: 'Carottes', category: 'legumes', quantity: '1 kg' },
  { name: 'Pommes', category: 'fruits', quantity: '8 pieces' },
  { name: 'Bananes', category: 'fruits', quantity: '10 pieces' },
  { name: 'Oeufs', category: 'proteines', quantity: '12 pieces' },
  { name: 'Poulet', category: 'proteines', quantity: '800 g' },
  { name: 'Yaourt nature', category: 'cremerie', quantity: '8 pots' },
  { name: 'Fromage blanc', category: 'cremerie', quantity: '1 grand pot' },
  { name: 'Riz complet', category: 'epicerie', quantity: '1 kg' },
  { name: 'Pates completes', category: 'epicerie', quantity: '500 g' },
  { name: 'Flocons d avoine', category: 'petits-dejeuners', quantity: '500 g' },
  { name: 'Amandes', category: 'collations', quantity: '250 g' },
];

export function getCoursesDaysLimit(isPremium: boolean): number {
  return isPremium ? 15 : 7;
}

export function buildShoppingList(days: number, isPremium: boolean): ShoppingItem[] {
  const safeDays = Math.max(1, Math.min(days, getCoursesDaysLimit(isPremium)));
  const factor = safeDays / 7;

  return BASE_ITEMS.map((item) => {
    if (!item.quantity.match(/\d/)) return item;
    const nextQuantity = item.quantity.replace(/(\d+(?:\.\d+)?)/, (raw) =>
      String(Math.max(1, Math.round(Number(raw) * factor))),
    );
    return { ...item, quantity: nextQuantity };
  });
}

export function groupByCategory(list: ShoppingItem[]): Record<ShoppingCategory, ShoppingItem[]> {
  return list.reduce(
    (acc, item) => {
      acc[item.category].push(item);
      return acc;
    },
    {
      legumes: [],
      fruits: [],
      proteines: [],
      cremerie: [],
      epicerie: [],
      'petits-dejeuners': [],
      collations: [],
    } as Record<ShoppingCategory, ShoppingItem[]>,
  );
}
