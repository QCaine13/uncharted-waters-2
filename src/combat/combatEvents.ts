import Input from '../input';
import { subscribeGameLoad } from '../state/saveEvents';
import state from '../state/state';
import type { CombatState } from './types';

let generation = 0;
let releaseCombatPause: (() => void) | null = null;
const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

const reconcilePause = (replace = false): void => {
  if (replace && releaseCombatPause) {
    releaseCombatPause();
    releaseCombatPause = null;
  }

  if (state.activeCombat !== null && releaseCombatPause === null) {
    releaseCombatPause = Input.suspend('combat');
  } else if (state.activeCombat === null && releaseCombatPause !== null) {
    releaseCombatPause();
    releaseCombatPause = null;
  }
};

export const getCombatSnapshot = (): CombatState | null => state.activeCombat;

export const getCombatGeneration = (): number => generation;

export const subscribeCombat = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyCombatChanged = (resolved = false): void => {
  reconcilePause();
  if (resolved) generation += 1;
  emit();
};

reconcilePause();
subscribeGameLoad(() => {
  reconcilePause(true);
  generation += 1;
  emit();
});
