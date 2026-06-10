import type { Position } from '../../types';
import type { GoodId } from '../../data/goodsData';

export const provisions = ['water', 'food', 'lumber', 'shot'] as const;
export type Provisions = typeof provisions[number];

export type CargoType = Provisions | GoodId;

export interface Cargo {
  type: CargoType;
  quantity: number;
}

export interface Ship {
  id: string;
  name: string;
  crew: number;
  cargo: Cargo[];
  durability: number;
}

interface Fleet {
  position: Position | undefined;
  ships: Ship[];
}

export interface Fleets {
  [key: string]: Fleet;
}

export const fleets: Fleets = {
  '1': {
    position: undefined,
    ships: [],
  },
};
