import { executeStoryEffects } from './core/effects';
import { characterId, storyEventId, type StoryEffect } from './core/types';
import { compiledStoryContent } from '.';
import state from '../state/state';
import updateInterface from '../state/updateInterface';
import { storyRuntimeActions } from './storyRuntimeActions';

const ship = () => ({
  id: '1',
  name: 'Balsa',
  crew: 0,
  cargo: [],
  durability: 30,
});

describe('production story runtime actions', () => {
  afterEach(() => jest.restoreAllMocks());

  beforeEach(() => {
    state.portId = '1';
    state.buildingId = '4';
    state.timePassed = 600;
    state.gold = 0;
    state.items = [];
    state.quests = [];
    state.fleets = { '1': { position: undefined, ships: [ship()] } };
    state.mates = [
      { sailorId: '1', role: 0 },
      { sailorId: '32', role: Number.NaN },
      { sailorId: '33', role: Number.NaN },
    ];
    state.port = {
      characters: () => ({ spawnNpcs: jest.fn(), despawnNpcs: jest.fn() }),
    } as unknown as typeof state.port;
    updateInterface.general = jest.fn();
    window.localStorage.clear();
  });

  test('preflights every target kind and rejects invalid groups atomically', () => {
    const invalid = [
      { type: 'receiveShip', shipId: 'missing', name: 'Nope' },
      { type: 'receiveItem', itemId: 'missing' },
      { type: 'addCompanion', characterId: characterId('missing') },
      {
        type: 'assignMate',
        characterId: characterId('missing'),
        role: 'firstMate',
      },
      { type: 'completeEvent', eventId: storyEventId('missing') },
      { type: 'setPort', portId: 'missing' },
    ] as unknown as StoryEffect[];
    const before = JSON.stringify(state);

    const result = executeStoryEffects(invalid, storyRuntimeActions);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected rejected effects');
    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'unknown-ship',
      'unknown-item',
      'unknown-character',
      'unknown-mate',
      'unknown-event',
      'unknown-port',
    ]);
    expect(JSON.stringify(state)).toBe(before);
    expect(window.localStorage.length).toBe(0);
  });

  test.each([
    {
      rocco: Number.NaN,
      enrico: Number.NaN,
      expected: ['firstMate', 'bookKeeper'],
    },
    { rocco: null, enrico: null, expected: [null, null] },
    {
      rocco: 1,
      enrico: 'chiefNavigator' as const,
      expected: [1, 'chiefNavigator'],
    },
    { rocco: 2, enrico: Number.NaN, expected: [2, 'bookKeeper'] },
  ])(
    'matches characterized legacy role final state %#',
    ({ rocco, enrico, expected }) => {
      state.mates[1].role = rocco;
      state.mates[2].role = enrico;

      expect(
        executeStoryEffects(
          [
            {
              type: 'assignMate',
              characterId: characterId('rocco'),
              role: 'firstMate',
            },
            {
              type: 'assignMate',
              characterId: characterId('enrico'),
              role: 'bookKeeper',
            },
          ],
          storyRuntimeActions,
        ),
      ).toEqual({ ok: true, executed: 2 });
      expect(state.mates.slice(1).map(({ role }) => role)).toEqual(expected);
      expect(window.localStorage.length).toBe(1);
    },
  );

  test.each([
    { label: 'empty', effects: [], writes: 0 },
    {
      label: 'invalid',
      effects: [{ type: 'receiveItem', itemId: 'missing' }],
      writes: 0,
    },
    {
      label: 'valid',
      effects: [{ type: 'receiveGold', amount: 1000 }],
      writes: 1,
    },
    {
      label: 'redundant explicit save',
      effects: [{ type: 'receiveGold', amount: 1000 }, { type: 'save' }],
      writes: 1,
    },
    { label: 'exit building', effects: [{ type: 'exitBuilding' }], writes: 1 },
    {
      label: 'complete event',
      effects: [
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.harbor-final'),
        },
      ],
      writes: 1,
    },
  ] as const)(
    '$label group writes storage exactly $writes time(s)',
    ({ effects, writes }) => {
      const setItem = jest.spyOn(Storage.prototype, 'setItem');
      executeStoryEffects(
        effects as readonly StoryEffect[],
        storyRuntimeActions,
      );
      expect(setItem).toHaveBeenCalledTimes(writes);
    },
  );

  test('applies all supported valid targets through existing state shapes', () => {
    const eventId = storyEventId('joao.lisbon-opening.shipyard-hermes-ii');
    expect(compiledStoryContent.eventsById.has(eventId)).toBe(true);
    const effects: StoryEffect[] = [
      { type: 'receiveItem', itemId: '53' },
      { type: 'receiveShip', shipId: '6', name: 'Hermes II' },
      { type: 'addCompanion', characterId: characterId('rocco') },
      { type: 'completeEvent', eventId },
      { type: 'setPort', portId: '1' },
    ];

    expect(executeStoryEffects(effects, storyRuntimeActions)).toEqual({
      ok: true,
      executed: 5,
    });
    expect(state.items).toEqual(['53']);
    expect(state.fleets['1'].ships[1]).toMatchObject({
      id: '6',
      name: 'Hermes II',
    });
    expect(state.mates.some(({ sailorId }) => sailorId === '32')).toBe(true);
    expect(state.quests).toEqual(['shipyardAfterQuest']);
    expect(updateInterface.general).toHaveBeenCalledTimes(1);
  });

  test('rejects two ships competing for one sailor before any mutation', () => {
    state.fleets = { '1': { position: undefined, ships: [] } };
    state.mates = [{ sailorId: '1', role: null }];
    const before = JSON.stringify({ fleets: state.fleets, mates: state.mates });
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    expect(
      executeStoryEffects(
        [
          { type: 'receiveShip', shipId: '6', name: 'First' },
          { type: 'receiveShip', shipId: '6', name: 'Second' },
        ],
        storyRuntimeActions,
      ),
    ).toEqual({
      ok: false,
      executed: 0,
      diagnostics: [expect.objectContaining({ code: 'no-available-sailor' })],
    });
    expect(JSON.stringify({ fleets: state.fleets, mates: state.mates })).toBe(
      before,
    );
    expect(setItem).not.toHaveBeenCalled();
  });

  test('preflights ordered groups that add a sailor before receiving a ship', () => {
    state.fleets = { '1': { position: undefined, ships: [] } };
    state.mates = [{ sailorId: '1', role: 0 }];

    expect(
      executeStoryEffects(
        [
          { type: 'addCompanion', characterId: characterId('rocco') },
          { type: 'receiveShip', shipId: '6', name: "Rocco's ship" },
        ],
        storyRuntimeActions,
      ),
    ).toEqual({ ok: true, executed: 2 });
    expect(state.fleets['1'].ships).toHaveLength(1);
    expect(state.mates).toContainEqual({ sailorId: '32', role: 0 });
  });
});
