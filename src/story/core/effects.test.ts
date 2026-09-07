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
import { executeStoryEffects, type StoryEffectRuntime } from './effects';

type Operation = [string, ...unknown[]];

const createRuntime = (
  validate: (effect: StoryEffect) => StoryDiagnostic[] = () => [],
): StoryEffectRuntime & {
  operations: Operation[];
  preflights: StoryEffect[];
} => {
  const operations: Operation[] = [];
  const preflights: StoryEffect[] = [];

  return {
    operations,
    preflights,
    canExecute: (effect: StoryEffect) => {
      preflights.push(effect);
      return validate(effect);
    },
    completeEvent: (eventId: StoryEventId) => {
      operations.push(['completeEvent', eventId]);
    },
    receiveGold: (amount: number) => {
      operations.push(['receiveGold', amount]);
    },
    receiveFame: (fame, amount) => {
      operations.push(['receiveFame', fame, amount]);
    },
    receiveItem: (itemId: ItemId) => {
      operations.push(['receiveItem', itemId]);
    },
    consumeItem: (itemId: ItemId) => {
      operations.push(['consumeItem', itemId]);
    },
    receiveShip: (shipId: string, name: string) => {
      operations.push(['receiveShip', shipId, name]);
    },
    addCompanion: (companionId: CharacterId) => {
      operations.push(['addCompanion', companionId]);
    },
    removeCompanion: (companionId: CharacterId) => {
      operations.push(['removeCompanion', companionId]);
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
    startCombat: (encounterId: string) => {
      operations.push(['startCombat', encounterId]);
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
      { type: 'receiveFame', fame: 'adventure', amount: 200 },
      { type: 'receiveItem', itemId: '4' },
      { type: 'consumeItem', itemId: '4' },
      { type: 'receiveShip', shipId: '6', name: 'Hermes II' },
      { type: 'addCompanion', characterId: companionId },
      { type: 'removeCompanion', characterId: companionId },
      { type: 'assignMate', characterId: companionId, role: 'firstMate' },
      { type: 'exitBuilding' },
      { type: 'setPort', portId: '2' },
      { type: 'save' },
      { type: 'completeEvent', eventId },
      { type: 'startCombat', encounterId: 'joao.m2.kahn-house' },
    ];
    const runtime = createRuntime();

    expect(executeStoryEffects(effects, runtime)).toEqual({
      ok: true,
      executed: effects.length,
    });
    expect(runtime.operations).toEqual([
      ['receiveGold', 1000],
      ['receiveFame', 'adventure', 200],
      ['receiveItem', '4'],
      ['consumeItem', '4'],
      ['receiveShip', '6', 'Hermes II'],
      ['addCompanion', companionId],
      ['removeCompanion', companionId],
      ['assignMate', companionId, 'firstMate'],
      ['exitBuilding'],
      ['setPort', '2'],
      ['completeEvent', eventId],
      ['startCombat', 'joao.m2.kahn-house'],
      ['save'],
    ]);
  });

  test('preflights the whole group and performs no operations when invalid', () => {
    const missingCompanion = characterId('missing-companion');
    const effects: StoryEffect[] = [
      { type: 'receiveGold', amount: 1000 },
      { type: 'addCompanion', characterId: missingCompanion },
      { type: 'receiveShip', shipId: 'missing-ship', name: 'Ghost' },
      { type: 'save' },
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

    const result = executeStoryEffects(effects, runtime);

    expect(result).toEqual({
      ok: false,
      executed: 0,
      diagnostics: [
        expect.objectContaining({ code: 'missing-companion' }),
        expect.objectContaining({ code: 'missing-ship' }),
      ],
    });
    expect(runtime.preflights).toEqual(effects);
    expect(runtime.operations).toEqual([]);
  });

  test('implicitly persists a mutating group without an explicit save', () => {
    const effects: StoryEffect[] = [
      { type: 'receiveGold', amount: 1000 },
      { type: 'receiveItem', itemId: '4' },
    ];
    const runtime = createRuntime();

    expect(executeStoryEffects(effects, runtime)).toEqual({
      ok: true,
      executed: effects.length,
    });
    expect(runtime.operations).toEqual([
      ['receiveGold', 1000],
      ['receiveItem', '4'],
      ['save'],
    ]);
  });

  test('persists a standalone completion without an explicit save', () => {
    const effects: StoryEffect[] = [{ type: 'completeEvent', eventId }];
    const runtime = createRuntime();

    expect(executeStoryEffects(effects, runtime)).toEqual({
      ok: true,
      executed: 1,
    });
    expect(runtime.operations).toEqual([['completeEvent', eventId], ['save']]);
  });

  test('does not persist an empty group', () => {
    const runtime = createRuntime();

    expect(executeStoryEffects([], runtime)).toEqual({
      ok: true,
      executed: 0,
    });
    expect(runtime.preflights).toEqual([]);
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
