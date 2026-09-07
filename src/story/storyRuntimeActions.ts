import { itemData } from '../data/itemData';
import { regularPorts, supplyPorts } from '../data/portData';
import { shipData } from '../data/shipData';
import {
  canStartCombatWithRoster,
  startCombatWithoutSave,
} from '../state/actionsCombat';
import {
  addStoryCompanion,
  assignStoryMateRole,
  completeLegacyQuestOnce,
  consumeStoryItem,
  exitBuildingWithoutSave,
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
import {
  applyCompanionDeparture,
  planCompanionDeparture,
} from './companionDeparture';

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

const preflightStatefulGroup = (
  effects: readonly StoryEffect[],
): StoryDiagnostic[] => {
  const plannedMates = state.mates.map((mate) => ({ ...mate }));
  const plannedShips = (state.fleets['1']?.ships ?? []).map(({ id }) => ({
    id,
  }));
  const plannedItemCounts = state.items.reduce<Map<string, number>>(
    (counts, itemId) => counts.set(itemId, (counts.get(itemId) ?? 0) + 1),
    new Map(),
  );
  const diagnostics: StoryDiagnostic[] = [];

  effects.forEach((effect) => {
    if (effect.type === 'receiveItem') {
      plannedItemCounts.set(
        effect.itemId,
        (plannedItemCounts.get(effect.itemId) ?? 0) + 1,
      );
      return;
    }
    if (effect.type === 'consumeItem') {
      const count = plannedItemCounts.get(effect.itemId) ?? 0;
      if (count === 0) {
        diagnostics.push(
          diagnostic('missing-item', `Item ${effect.itemId} is not owned`),
        );
      } else {
        plannedItemCounts.set(effect.itemId, count - 1);
      }
      return;
    }
    if (effect.type === 'addCompanion') {
      const sailorId = character(effect)?.sailorId;
      if (sailorId) plannedMates.push({ sailorId, role: null });
      return;
    }
    if (effect.type === 'assignMate') {
      const sailorId = character(effect)?.sailorId;
      if (!sailorId) return;
      const mate = plannedMates.find(
        (candidate) => candidate.sailorId === sailorId,
      );
      if (!mate) {
        diagnostics.push(
          diagnostic('unknown-mate', `Unknown mate ${effect.characterId}`),
        );
      } else if (Number.isNaN(mate.role)) {
        mate.role = effect.role;
      }
      return;
    }
    if (effect.type === 'removeCompanion') {
      const sailorId = character(effect)?.sailorId;
      if (!sailorId) return;
      const departure = planCompanionDeparture(
        plannedMates,
        plannedShips.length,
        sailorId,
      );
      if (!departure.ok) {
        diagnostics.push(diagnostic(departure.code, departure.message));
      } else {
        plannedMates.splice(0, plannedMates.length, ...departure.mates);
      }
      return;
    }
    if (effect.type === 'receiveShip' && shipData[effect.shipId]) {
      const mate = plannedMates.find(
        ({ role }) => role === null || Number.isNaN(role),
      );
      if (!mate) {
        diagnostics.push(
          diagnostic('no-available-sailor', 'No sailor can captain the ship'),
        );
      } else {
        mate.role = plannedShips.length;
        plannedShips.push({ id: effect.shipId });
      }
      return;
    }
    if (effect.type === 'startCombat') {
      if (
        !canStartCombatWithRoster(effect.encounterId, {
          ships: plannedShips,
          mates: plannedMates,
        })
      ) {
        diagnostics.push(
          diagnostic(
            'combat-unavailable',
            `Combat ${effect.encounterId} cannot start`,
          ),
        );
      }
    }
  });

  effects.forEach((effect, index) => {
    if (effect.type !== 'startCombat') return;
    const laterNonSave = effects
      .slice(index + 1)
      .some((candidate) => candidate.type !== 'save');
    if (laterNonSave) {
      diagnostics.push(
        diagnostic(
          'non-terminal-combat-start',
          'Combat start must be the final non-save effect in its group',
        ),
      );
    }
  });

  return diagnostics;
};

export const storyRuntimeActions: StoryEffectRuntime = {
  preflightGroup: preflightStatefulGroup,
  canExecute(effect) {
    switch (effect.type) {
      case 'receiveShip':
        if (!shipData[effect.shipId]) {
          return [diagnostic('unknown-ship', `Unknown ship ${effect.shipId}`)];
        }
        return [];
      case 'receiveItem':
      case 'consumeItem':
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
      case 'removeCompanion':
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
        return target?.sailorId
          ? []
          : [diagnostic('unknown-mate', `Unknown mate ${effect.characterId}`)];
      }
      case 'completeEvent':
        return compiledStoryContent.eventsById.has(effect.eventId)
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
      case 'startCombat':
        return [];
      case 'receiveFame':
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
    if (!Array.isArray(state.storyEvents)) state.storyEvents = [];
    if (
      !state.storyEventTimes ||
      typeof state.storyEventTimes !== 'object' ||
      Array.isArray(state.storyEventTimes)
    ) {
      state.storyEventTimes = {};
    }
    const existingTime = state.storyEventTimes[eventId];
    if (
      typeof existingTime !== 'number' ||
      !Number.isFinite(existingTime) ||
      existingTime < 0
    ) {
      state.storyEventTimes[eventId] =
        Number.isFinite(state.timePassed) && state.timePassed >= 0
          ? state.timePassed
          : 0;
    }
    if (!state.storyEvents.includes(eventId)) state.storyEvents.push(eventId);
    const key = getLegacyCompletionKey(eventId, compiledStoryContent);
    if (key !== null) completeLegacyQuestOnce(key as LegacyQuestCompletionKey);
  },
  receiveGold: receiveStoryGold,
  receiveFame(fame, amount) {
    state.fame[fame] += amount;
  },
  receiveItem: receiveStoryItem,
  consumeItem: consumeStoryItem,
  receiveShip: receiveStoryShip,
  addCompanion(characterId) {
    const sailorId =
      compiledStoryContent.charactersById.get(characterId)?.sailorId;
    if (sailorId) addStoryCompanion(sailorId);
  },
  removeCompanion(characterId) {
    const sailorId =
      compiledStoryContent.charactersById.get(characterId)?.sailorId;
    if (!sailorId) return;
    const departure = planCompanionDeparture(
      state.mates,
      state.fleets['1']?.ships.length ?? 0,
      sailorId,
    );
    if (departure.ok) applyCompanionDeparture(state, departure);
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
  startCombat(encounterId) {
    startCombatWithoutSave(encounterId);
  },
  save() {
    updateGeneral();
    save();
  },
};

export default storyRuntimeActions;
