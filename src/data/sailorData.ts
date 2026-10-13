export const sailorSkills = [
  'Celestial Navigation',
  'Accounting',
  'Negotiation',
  'Gunnery',
  'Cartography',
] as const;
export type SailorSkills = typeof sailorSkills[number];

export type Sailor = {
  name: string;
  age: number;
  stats: {
    leadership: number;
    seamanship: number;
    knowledge: number;
    intuition: number;
    courage: number;
    swordplay: number;
    charm: number;
    luck: number;
  };
  navigationLevel: number;
  battleLevel: number;
  skills: SailorSkills[];
};

export const sailorData: { [key: string]: Sailor } = {
  '1': {
    name: 'João Franco',
    age: 18,
    stats: {
      leadership: 78,
      seamanship: 75,
      knowledge: 73,
      intuition: 85,
      courage: 82,
      swordplay: 82,
      charm: 89,
      luck: 50,
    },
    navigationLevel: 1,
    battleLevel: 1,
    skills: ['Negotiation'],
  },
  '2': {
    name: 'Katarina Erantzo',
    age: 18,
    stats: {
      leadership: 88,
      seamanship: 80,
      knowledge: 64,
      intuition: 82,
      courage: 94,
      swordplay: 92,
      charm: 90,
      luck: 80,
    },
    navigationLevel: 8,
    battleLevel: 12,
    skills: ['Gunnery'],
  },
  '4': {
    name: 'Pietro Conti',
    age: 28,
    stats: {
      leadership: 78,
      seamanship: 84,
      knowledge: 90,
      intuition: 95,
      courage: 76,
      swordplay: 74,
      charm: 84,
      luck: 85,
    },
    navigationLevel: 6,
    battleLevel: 5,
    skills: ['Celestial Navigation', 'Cartography', 'Negotiation'],
  },
  '32': {
    name: 'Rocco Alemkel',
    age: 65,
    stats: {
      leadership: 75,
      seamanship: 82,
      knowledge: 84,
      intuition: 90,
      courage: 93,
      swordplay: 92,
      charm: 70,
      luck: 70,
    },
    navigationLevel: 30,
    battleLevel: 32,
    skills: ['Celestial Navigation', 'Gunnery'],
  },
  '33': {
    name: 'Enrico Malione',
    age: 24,
    stats: {
      leadership: 66,
      seamanship: 48,
      knowledge: 93,
      intuition: 55,
      courage: 62,
      swordplay: 48,
      charm: 82,
      luck: 100,
    },
    navigationLevel: 1,
    battleLevel: 1,
    skills: ['Accounting'],
  },
  '34': {
    name: 'Domingo Manana',
    age: 17,
    stats: {
      leadership: 60,
      seamanship: 68,
      knowledge: 58,
      intuition: 62,
      courage: 81,
      swordplay: 76,
      charm: 90,
      luck: 100,
    },
    navigationLevel: 1,
    battleLevel: 1,
    skills: ['Negotiation'],
  },
  '35': {
    name: 'Camillo Stefano',
    age: 25,
    stats: {
      leadership: 68,
      seamanship: 72,
      knowledge: 86,
      intuition: 78,
      courage: 66,
      swordplay: 64,
      charm: 80,
      luck: 75,
    },
    navigationLevel: 5,
    battleLevel: 4,
    skills: ['Accounting'],
  },
  '36': {
    name: 'Emilio Sanches',
    age: 26,
    stats: {
      leadership: 76,
      seamanship: 78,
      knowledge: 74,
      intuition: 75,
      courage: 85,
      swordplay: 82,
      charm: 76,
      luck: 75,
    },
    navigationLevel: 7,
    battleLevel: 8,
    skills: ['Celestial Navigation', 'Gunnery'],
  },
  'm2-relief-captain': {
    name: 'Relief Captain',
    age: 30,
    stats: {
      leadership: 50,
      seamanship: 50,
      knowledge: 50,
      intuition: 50,
      courage: 50,
      swordplay: 50,
      charm: 50,
      luck: 50,
    },
    navigationLevel: 1,
    battleLevel: 1,
    skills: [],
  },
  'm3-relief-captain': {
    name: 'Second Relief Captain',
    age: 30,
    stats: {
      leadership: 50,
      seamanship: 50,
      knowledge: 50,
      intuition: 50,
      courage: 50,
      swordplay: 50,
      charm: 50,
      luck: 50,
    },
    navigationLevel: 1,
    battleLevel: 1,
    skills: [],
  },
};

const getSailor = (id: string) => sailorData[id];

export default getSailor;
