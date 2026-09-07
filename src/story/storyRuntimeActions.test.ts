import { executeStoryEffects } from './core/effects';
import { characterId, storyEventId, type StoryEffect } from './core/types';
import { compiledStoryContent } from '.';
import state from '../state/state';
import updateInterface from '../state/updateInterface';
import { storyRuntimeActions } from './storyRuntimeActions';
import { notifyCombatChanged } from '../combat/combatEvents';
import { load } from '../state/saveLoad';
import { RELIEF_CAPTAIN_SAILOR_ID } from './companionDeparture';
import { getCaptain } from '../state/selectors';

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
    state.fame = { adventure: 0, pirate: 0, trade: 0 };
    state.items = [];
    state.quests = [];
    state.storyEvents = [];
    state.combatResults = {};
    state.activeCombat = null;
    state.equipment = { weaponId: null, armorId: null };
    state.mateProgress = {};
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
    notifyCombatChanged();
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

  test('rejects a combat group atomically when combat cannot start', () => {
    state.fleets = { '1': { position: undefined, ships: [] } };
    const eventId = storyEventId('joao.lisbon-opening.harbor-final');
    const before = JSON.stringify(state);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    expect(
      executeStoryEffects(
        [
          { type: 'receiveGold', amount: 500 },
          { type: 'receiveFame', fame: 'adventure', amount: 100 },
          { type: 'completeEvent', eventId },
          { type: 'startCombat', encounterId: 'joao.m2.katarina' },
        ],
        storyRuntimeActions,
      ),
    ).toEqual({
      ok: false,
      executed: 0,
      diagnostics: [expect.objectContaining({ code: 'combat-unavailable' })],
    });
    expect(JSON.stringify(state)).toBe(before);
    expect(setItem).not.toHaveBeenCalled();
  });

  test('applies semantic rewards and combat start in one saved transaction', () => {
    const eventId = storyEventId('joao.lisbon-opening.harbor-final');
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    expect(
      executeStoryEffects(
        [
          { type: 'receiveFame', fame: 'adventure', amount: 125 },
          { type: 'completeEvent', eventId },
          { type: 'startCombat', encounterId: 'joao.m2.kahn-house' },
        ],
        storyRuntimeActions,
      ),
    ).toEqual({ ok: true, executed: 3 });
    expect(state.fame.adventure).toBe(125);
    expect(state.storyEvents).toContain(eventId);
    expect(state.activeCombat?.encounterId).toBe('joao.m2.kahn-house');
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  test('dismisses Domingo from a four-ship fleet and retains valid captains after load', () => {
    state.fleets = {
      '1': {
        position: undefined,
        ships: [ship(), ship(), ship(), ship()],
      },
    };
    state.mates = [
      { sailorId: '1', role: 0 },
      { sailorId: '32', role: 1 },
      { sailorId: '33', role: 2 },
      { sailorId: '34', role: 3 },
    ];

    expect(
      executeStoryEffects(
        [{ type: 'removeCompanion', characterId: characterId('domingo') }],
        storyRuntimeActions,
      ),
    ).toEqual({ ok: true, executed: 1 });
    expect(state.fleets['1'].ships).toHaveLength(4);
    expect(state.mates).toContainEqual({
      sailorId: RELIEF_CAPTAIN_SAILOR_ID,
      role: 3,
    });
    expect(state.mates.some(({ sailorId }) => sailorId === '1')).toBe(true);

    state.mates = [];
    expect(load()).toBe(true);
    expect(state.fleets['1'].ships).toHaveLength(4);
    expect(
      [0, 1, 2, 3].filter(
        (role) =>
          state.mates.filter((mate) => mate.role === role).length === 1,
      ),
    ).toHaveLength(4);
    expect(
      state.mates.every(({ sailorId }) =>
        ['1', '32', '33', RELIEF_CAPTAIN_SAILOR_ID].includes(sailorId),
      ),
    ).toBe(true);
    expect([0, 1, 2, 3].map((role) => getCaptain(role).name)).toEqual([
      'João Franco',
      'Rocco Alemkel',
      'Enrico Malione',
      'Relief Captain',
    ]);
  });
});
