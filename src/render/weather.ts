/**
 * Deterministic daily weather per port. Purely cosmetic — never saved.
 */
/* eslint-disable no-bitwise */
export type Weather = 'clear' | 'cloudy' | 'rain' | 'fog';

export const WEATHERS: Weather[] = ['clear', 'cloudy', 'rain', 'fog'];

const hash = (text: string): number => {
  let h = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  // murmur3 finalizer so sequential inputs decorrelate
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;

  return h >>> 0;
};

export const weatherFor = (portId: string, dayNumber: number): Weather => {
  const roll = hash(`${portId}:${dayNumber}`) / 4294967296;

  if (roll < 0.6) {
    return 'clear';
  }
  if (roll < 0.8) {
    return 'cloudy';
  }
  if (roll < 0.92) {
    return 'rain';
  }

  return 'fog';
};
