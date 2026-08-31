export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: 'cleaning',     name: 'Sprzątanie',  emoji: '🧹' },
  { id: 'home',         name: 'Dom i Ogród', emoji: '🏠' },
  { id: 'construction', name: 'Budowa',      emoji: '🔨' },
  { id: 'auto',         name: 'Auto',        emoji: '🚗' },
  { id: 'transport',    name: 'Transport',   emoji: '🚛' },
  { id: 'beauty',       name: 'Uroda',       emoji: '✂️' },
  { id: 'tech',         name: 'IT/Naprawy',  emoji: '💻' },
  { id: 'edu',          name: 'Edukacja',    emoji: '🎓' },
  { id: 'health',       name: 'Zdrowie',     emoji: '❤️' },
  { id: 'pets',         name: 'Zwierzęta',   emoji: '🐾' },
  { id: 'finance',      name: 'Finanse',     emoji: '💰' },
  { id: 'care',         name: 'Opieka',      emoji: '👶' },
  { id: 'art',          name: 'Sztuka',      emoji: '🎨' },
  { id: 'events',       name: 'Eventy',      emoji: '🎉' },
  { id: 'garden',       name: 'Ogród',       emoji: '🌸' },
  { id: 'other',        name: 'Inne',        emoji: '⚙️' },
];

export const getCategoryName = (id: string): string =>
  CATEGORIES.find(c => c.id === id)?.name ?? id;
