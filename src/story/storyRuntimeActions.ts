import { itemData } from '../data/itemData';
import { regularPorts, supplyPorts } from '../data/portData';
import { shipData } from '../data/shipData';
import {
  addStoryCompanion,
  assignStoryMateRole,
  completeLegacyQuestOnce,
  exitBuildingWithoutSave,
  getAvailableSailorId,
  receiveStoryGold,
  receiveStoryItem,
  receiveStoryShip,
  updateGeneral,
} from '../state/actionsPort';
import { save } from '../state/saveLoad';
import state from '../state/state';
import {
  getLegacyCompletionKey,
  type LegacyQuestCompletionKey,
} from './legacy/lisbonCompletionKeys';
import { compiledStoryContent } from '.';
import type { StoryEffectRuntime } from './core/effects';
import type { StoryDiagnostic, StoryEffect } from './core/types';

const diagnostic = (code: string, message: string): StoryDiagnostic => ({
  severity: 'error',
  code,
  path: 'effect',
  message,
});

const character = (effect: Extract<StoryEffect, { characterId: unknown }>) =>
  compiledStoryContent.charactersById.get(effect.characterId);

const validPort = (portId: string): boolean => {
  const value = Number(portId);
  return (
    Number.isInteger(value) &&
    value >= 1 &&
    value <= regularPorts.length + supplyPorts.length
  );
};

export const storyRuntimeActions: StoryEffectRuntime = {
  canExecute(effect) {
    switch (effect.type) {
      case 'receiveShip':
        if (!shipData[effect.shipId]) {
          return [diagnostic('unknown-ship', `Unknown ship ${effect.shipId}`)];
        }
        return getAvailableSailorId()
          ? []
          : [
              diagnostic(
                'no-available-sailor',
                'No sailor can captain the ship',
              ),
            ];
      case 'receiveItem':
        return itemData[effect.itemId]
          ? []
          : [diagnostic('unknown-item', `Unknown item ${effect.itemId}`)];
      case 'addCompanion':
        return character(effect)?.sailorId
          ? []
          : [
              diagnostic(
                'unknown-character',
                `Unknown companion ${effect.characterId}`,
              ),
            ];
      case 'assignMate': {
        const target = character(effect);
        return target?.sailorId &&
          state.mates.some(({ sailorId }) => sailorId === target.sailorId)
          ? []
          : [diagnostic('unknown-mate', `Unknown mate ${effect.characterId}`)];
      }
      case 'completeEvent':
        return compiledStoryContent.eventsById.has(effect.eventId) &&
          getLegacyCompletionKey(effect.eventId, compiledStoryContent) !== null
          ? []
          : [
              diagnostic(
                'unknown-event',
                `Unknown completable event ${effect.eventId}`,
              ),
            ];
      case 'setPort':
        return effect.portId === null || validPort(effect.portId)
          ? []
          : [diagnostic('unknown-port', `Unknown port ${effect.portId}`)];
      case 'receiveGold':
      case 'exitBuilding':
      case 'save':
        return [];
      default: {
        const exhaustive: never = effect;
        return [diagnostic('unknown-effect', JSON.stringify(exhaustive))];
      }
    }
  },
  completeEvent(eventId) {
    const key = getLegacyCompletionKey(eventId, compiledStoryContent);
    if (key !== null) completeLegacyQuestOnce(key as LegacyQuestCompletionKey);
  },
  receiveGold: receiveStoryGold,
  receiveItem: receiveStoryItem,
  receiveShip: receiveStoryShip,
  addCompanion(characterId) {
    const sailorId =
      compiledStoryContent.charactersById.get(characterId)?.sailorId;
    if (sailorId) addStoryCompanion(sailorId);
  },
  assignMate(characterId, role) {
    const sailorId =
      compiledStoryContent.charactersById.get(characterId)?.sailorId;
    if (sailorId) assignStoryMateRole(sailorId, role);
  },
  exitBuilding: exitBuildingWithoutSave,
  setPort(portId) {
    state.portId = portId;
  },
  save() {
    updateGeneral();
    save();
  },
};

export default storyRuntimeActions;
