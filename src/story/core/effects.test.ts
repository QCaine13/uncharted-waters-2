import type { ItemId } from '../../data/itemData';
import type { Role } from '../../state/state';
import {
  characterId,
  storyEventId,
  type CharacterId,
  type StoryDiagnostic,
  type StoryEffect,
  type StoryEventId,
} from './types';
import {
  executeStoryEffects,
  preflightStoryEffects,
  type StoryEffectRuntime,
} from './effects';

type Operation = [string, ...unknown[]];

const createRuntime = (
  validate: (effect: StoryEffect) => StoryDiagnostic[] = () => [],
): StoryEffectRuntime & { operations: Operation[] } => {
  const operations: Operation[] = [];

  return {
    operations,
    canExecute: validate,
    completeEvent: (eventId: StoryEventId) => {
      operations.push(['completeEvent', eventId]);
    },
    receiveGold: (amount: number) => {
      operations.push(['receiveGold', amount]);
    },
    receiveItem: (itemId: ItemId) => {
      operations.push(['receiveItem', itemId]);
    },
    receiveShip: (shipId: string, name: string) => {
      operations.push(['receiveShip', shipId, name]);
    },
    addCompanion: (companionId: CharacterId) => {
      operations.push(['addCompanion', companionId]);
    },
    assignMate: (companionId: CharacterId, role: Role) => {
      operations.push(['assignMate', companionId, role]);
    },
    exitBuilding: () => {
      operations.push(['exitBuilding']);
    },
    setPort: (portId: string | null) => {
      operations.push(['setPort', portId]);
    },
    save: () => {
      operations.push(['save']);
    },
  };
};

describe('story effect interpreter', () => {
  const eventId = storyEventId('joao.meet-enrico');
  const companionId = characterId('joao.companion.rocco');

  test('executes every effect in source order and persists once', () => {
    const effects: StoryEffect[] = [
      { type: 'receiveGold', amount: 1000 },
      { type: 'receiveItem', itemId: '4' },
      { type: 'receiveShip', shipId: '6', name: 'Hermes II' },
      { type: 'addCompanion', characterId: companionId },
      { type: 'assignMate', characterId: companionId, role: 'firstMate' },
      { type: 'exitBuilding' },
      { type: 'setPort', portId: '2' },
      { type: 'save' },
      { type: 'completeEvent', eventId },
    ];
    const runtime = createRuntime();

    expect(executeStoryEffects(effects, runtime)).toEqual({
      ok: true,
      executed: effects.length,
    });
    expect(runtime.operations).toEqual([
      ['receiveGold', 1000],
      ['receiveItem', '4'],
      ['receiveShip', '6', 'Hermes II'],
      ['addCompanion', companionId],
      ['assignMate', companionId, 'firstMate'],
      ['exitBuilding'],
      ['setPort', '2'],
      ['completeEvent', eventId],
      ['save'],
    ]);
  });

  test('preflights the whole group and performs no operations when invalid', () => {
    const missingCompanion = characterId('missing-companion');
    const effects: StoryEffect[] = [
      { type: 'receiveGold', amount: 1000 },
      { type: 'addCompanion', characterId: missingCompanion },
      { type: 'receiveShip', shipId: 'missing-ship', name: 'Ghost' },
    ];
    const runtime = createRuntime((effect) => {
      if (effect.type === 'addCompanion') {
        return [
          {
            severity: 'error',
            code: 'missing-companion',
            path: 'effect.characterId',
            message: 'Unknown companion.',
          },
        ];
      }
      if (effect.type === 'receiveShip') {
        return [
          {
            severity: 'error',
            code: 'missing-ship',
            path: 'effect.shipId',
            message: 'Unknown ship.',
          },
        ];
      }
      return [];
    });

    const diagnostics = preflightStoryEffects(effects, runtime);
    expect(diagnostics.map(({ code }) => code)).toEqual([
      'missing-companion',
      'missing-ship',
    ]);
    expect(executeStoryEffects(effects, runtime)).toEqual({
      ok: false,
      executed: 0,
      diagnostics,
    });
    expect(runtime.operations).toEqual([]);
  });

  test('coalesces redundant explicit saves into one operation', () => {
    const effects: StoryEffect[] = [
      { type: 'save' },
      { type: 'receiveGold', amount: 10 },
      { type: 'save' },
      { type: 'save' },
    ];
    const runtime = createRuntime();

    expect(executeStoryEffects(effects, runtime)).toEqual({
      ok: true,
      executed: effects.length,
    });
    expect(runtime.operations).toEqual([['receiveGold', 10], ['save']]);
  });
});
