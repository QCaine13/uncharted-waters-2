import { asInferredKeysWithValue } from '../utils';

export const goodCategories = {
  '1': 'Food',
  '2': 'Beverage',
  '3': 'Textile',
  '4': 'Spice',
  '5': 'Mineral',
  '6': 'Material',
  '7': 'Luxury',
  '8': 'Specialty',
} as const;

export type GoodCategoryId = keyof typeof goodCategories;

export type Good = {
  name: string;
  category: GoodCategoryId;
  basePrice: number;
};

export const goodData = asInferredKeysWithValue<Good>()({
  '1': { name: 'Wheat', category: '1', basePrice: 40 },
  '2': { name: 'Salt', category: '1', basePrice: 50 },
  '3': { name: 'Wine', category: '2', basePrice: 70 },
  '4': { name: 'Olive Oil', category: '2', basePrice: 65 },
  '5': { name: 'Sugar', category: '1', basePrice: 80 },
  '6': { name: 'Cotton', category: '3', basePrice: 60 },
  '7': { name: 'Wool', category: '3', basePrice: 55 },
  '8': { name: 'Silk', category: '3', basePrice: 200 },
  '9': { name: 'Dye', category: '6', basePrice: 100 },
  '10': { name: 'Pepper', category: '4', basePrice: 150 },
  '11': { name: 'Cinnamon', category: '4', basePrice: 180 },
  '12': { name: 'Cloves', category: '4', basePrice: 220 },
  '13': { name: 'Nutmeg', category: '4', basePrice: 250 },
  '14': { name: 'Gold', category: '5', basePrice: 400 },
  '15': { name: 'Silver', category: '5', basePrice: 280 },
  '16': { name: 'Ivory', category: '7', basePrice: 300 },
  '17': { name: 'Copper', category: '5', basePrice: 90 },
  '18': { name: 'Iron', category: '5', basePrice: 70 },
  '19': { name: 'Lumber', category: '6', basePrice: 35 },
  '20': { name: 'Tea', category: '8', basePrice: 160 },
  '21': { name: 'Porcelain', category: '7', basePrice: 200 },
  '22': { name: 'Glassware', category: '7', basePrice: 130 },
  '23': { name: 'Coffee', category: '8', basePrice: 140 },
  '24': { name: 'Fur', category: '7', basePrice: 120 },
});

export type GoodId = keyof typeof goodData;
