import type { ItemId } from '../../data/itemData';
import type { FameType, Role } from '../../state/state';
import type {
  CharacterId,
  StoryDiagnostic,
  StoryEffect,
  StoryEventId,
} from './types';

export interface StoryEffectRuntime {
  canExecute(effect: StoryEffect): StoryDiagnostic[];
  preflightGroup?(effects: readonly StoryEffect[]): StoryDiagnostic[];
  completeEvent(eventId: StoryEventId): void;
  receiveGold(amount: number): void;
  receiveFame(fame: FameType, amount: number): void;
  receiveItem(itemId: ItemId): void;
  consumeItem(itemId: ItemId): void;
  receiveShip(shipId: string, name: string): void;
  addCompanion(characterId: CharacterId): void;
  removeCompanion(characterId: CharacterId): void;
  assignMate(characterId: CharacterId, role: Role): void;
  exitBuilding(): void;
  setPort(portId: string | null): void;
  startCombat(encounterId: string): void;
  save(): void;
}

export type StoryEffectExecution =
  | { ok: true; executed: number }
  | { ok: false; executed: 0; diagnostics: StoryDiagnostic[] };

export const preflightStoryEffects = (
  effects: readonly StoryEffect[],
  runtime: StoryEffectRuntime,
): StoryDiagnostic[] =>
  effects
    .reduce<StoryDiagnostic[]>(
      (diagnostics, effect) => diagnostics.concat(runtime.canExecute(effect)),
      [],
    )
    .concat(runtime.preflightGroup?.(effects) ?? []);

const executeStoryEffect = (
  effect: Exclude<StoryEffect, { type: 'save' }>,
  runtime: StoryEffectRuntime,
): void => {
  switch (effect.type) {
    case 'completeEvent':
      runtime.completeEvent(effect.eventId);
      break;
    case 'receiveGold':
      runtime.receiveGold(effect.amount);
      break;
    case 'receiveFame':
      runtime.receiveFame(effect.fame, effect.amount);
      break;
    case 'receiveItem':
      runtime.receiveItem(effect.itemId);
      break;
    case 'consumeItem':
      runtime.consumeItem(effect.itemId);
      break;
    case 'receiveShip':
      runtime.receiveShip(effect.shipId, effect.name);
      break;
    case 'addCompanion':
      runtime.addCompanion(effect.characterId);
      break;
    case 'removeCompanion':
      runtime.removeCompanion(effect.characterId);
      break;
    case 'assignMate':
      runtime.assignMate(effect.characterId, effect.role);
      break;
    case 'exitBuilding':
      runtime.exitBuilding();
      break;
    case 'setPort':
      runtime.setPort(effect.portId);
      break;
    case 'startCombat':
      runtime.startCombat(effect.encounterId);
      break;
    default: {
      const exhaustive: never = effect;
      throw new Error(`Unhandled story effect: ${JSON.stringify(exhaustive)}`);
    }
  }
};

export const executeStoryEffects = (
  effects: readonly StoryEffect[],
  runtime: StoryEffectRuntime,
): StoryEffectExecution => {
  const diagnostics = preflightStoryEffects(effects, runtime);
  if (diagnostics.length > 0) {
    return { ok: false, executed: 0, diagnostics };
  }

  effects.forEach((effect) => {
    if (effect.type !== 'save') {
      executeStoryEffect(effect, runtime);
    }
  });

  if (effects.length > 0) {
    runtime.save();
  }

  return { ok: true, executed: effects.length };
};
