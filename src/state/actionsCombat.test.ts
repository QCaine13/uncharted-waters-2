import { readFileSync } from 'fs';
import { resolve } from 'path';
import Assets from '../assets';
import { WORLD_MAP_COLUMNS } from '../constants';
import Input from '../input';
import type { Ship } from '../game/world/fleets';
import updateInterface from './updateInterface';
import state from './state';
import { load, save } from './saveLoad';
import {
  actCombat,
  canStartCombat,
  canStartCombatWithRoster,
  finishCombat,
  startCombat,
  startCombatWithoutSave,
} from './actionsCombat';
import {
  getCombatGeneration,
  getCombatSnapshot,
  subscribeCombat,
} from '../combat/combatEvents';

const flagship = (): Ship => ({
  id: '6',
  name: 'São Gabriel',
  crew: 20,
  durability: 25,
  cargo: [
    { type: 'water', quantity: 12 },
    { type: 'shot', quantity: 6 },
    { type: 'lumber', quantity: 2 },
    { type: '1', quantity: 4 },
  ],
});

const consort = (): Ship => ({
  id: '3',
  name: 'Consort',
  crew: 7,
  durability: 19,
  cargo: [{ type: 'shot', quantity: 9 }],
});

const savedWrites = () => jest.spyOn(Storage.prototype, 'setItem').mockClear();

const worldTilemap = new Uint8Array(
  readFileSync(resolve(__dirname, '../data/assets/worldTilemap.wasm')),
);

const footprintTilesAt = ({ x, y }: { x: number; y: number }) =>
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ].map(
    (offset) => worldTilemap[(y + offset.y) * WORLD_MAP_COLUMNS + x + offset.x],
  );

describe('combat state actions', () => {
  beforeEach(() => {
    jest.spyOn(Assets, 'data').mockReturnValue(worldTilemap);
    // Reconcile and release a combat token left by a previous test before
    // installing the next fixture.
    state.activeCombat = null;
    save();
    load();
    window.localStorage.clear();

    state.portId = '1';
    state.buildingId = '8';
    state.world = {} as typeof state.world;
    state.port = {} as typeof state.port;
    state.dayAtSea = 4;
    state.gold = 1800;
    state.items = ['4', '17'];
    state.equipment = { weaponId: '4', armorId: '17' };
    state.mates = [
      { sailorId: '1', role: 0 },
      { sailorId: '32', role: 'firstMate' },
      { sailorId: '33', role: 1 },
    ];
    state.mateProgress = { '1': { battleExperience: 900 } };
    state.combatResults = {};
    state.activeCombat = null;
    state.fleets = {
      '1': {
        position: { x: 1000, y: 500 },
        ships: [flagship(), consort()],
      },
    };

    updateInterface.general = jest.fn();
    updateInterface.dayAtSea = jest.fn();
    updateInterface.provisions = jest.fn();
    updateInterface.discovery = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('starts one equipped duel, pauses input, notifies, and saves once', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCombat(listener);
    const generation = getCombatGeneration();
    const writes = savedWrites();

    expect(startCombat('joao.m2.kahn-house')).toBe(true);

    expect(getCombatSnapshot()).toMatchObject({
      kind: 'duel',
      encounterId: 'joao.m2.kahn-house',
      player: {
        stats: {
          swordplay: 82,
          level: 10,
          weaponRating: 15,
          armorRating: 10,
          weaponCategory: '2',
        },
      },
    });
    expect(Input.isSuspended('combat')).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getCombatGeneration()).toBe(generation);
    expect(writes).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test('supports a validated non-saving start for an enclosing transaction', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCombat(listener);
    const writes = savedWrites();

    expect(startCombatWithoutSave('joao.m2.kahn-shipyard')).toBe(true);

    expect(getCombatSnapshot()?.encounterId).toBe('joao.m2.kahn-shipyard');
    expect(Input.isSuspended('combat')).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(writes).not.toHaveBeenCalled();
    unsubscribe();
  });

  test('rejects an unknown encounter, a second encounter, and an overlay-covered start', () => {
    expect(canStartCombat('future.encounter')).toBe(false);
    const releaseOverlay = Input.suspend('overlay');
    expect(startCombat('joao.m2.kahn-house')).toBe(false);
    releaseOverlay();

    expect(startCombat('joao.m2.kahn-house')).toBe(true);
    const current = getCombatSnapshot();
    expect(startCombat('joao.m2.kahn-shipyard')).toBe(false);
    expect(getCombatSnapshot()).toBe(current);
  });

  test.each([
    ['joao.m2.kahn-shipyard', 'draw', false],
    ['joao.m2.kahn-shipyard', 'victory', false],
    ['joao.m2.kahn-shipyard', 'defeat', false],
    ['joao.m2.kahn-shipyard', 'retreat', false],
    ['joao.m2.kahn-house', 'draw', true],
    ['joao.m2.kahn-house', 'victory', false],
    ['joao.m2.kahn-house', 'defeat', false],
    ['joao.m2.katarina', 'defeat', true],
    ['joao.m2.katarina', 'victory', false],
    ['joao.m2.katarina', 'retreat', false],
  ] as const)(
    'applies the replay rule for %s after %s',
    (encounterId, outcome, allowed) => {
      state.combatResults[encounterId] = outcome;
      expect(canStartCombat(encounterId)).toBe(allowed);
    },
  );

  test.each([
    ['joao.m2.kahn-house', 'draw', 'victory'],
    ['joao.m2.katarina', 'defeat', 'victory'],
  ] as const)(
    'settles a %s replay after an allowed %s result',
    (encounterId, priorOutcome, replayOutcome) => {
      state.combatResults[encounterId] = priorOutcome;
      expect(startCombat(encounterId)).toBe(true);
      const replay = getCombatSnapshot()!;
      replay.outcome = replayOutcome;

      expect(finishCombat(replay)).toBe(true);
      expect(state.activeCombat).toBeNull();
      expect(state.combatResults[encounterId]).toBe(replayOutcome);
    },
  );

  test('builds naval combat from the flagship, its cargo, and captain level', () => {
    expect(startCombat('joao.m2.katarina')).toBe(true);

    expect(getCombatSnapshot()).toMatchObject({
      kind: 'naval',
      player: {
        hull: 25,
        maxHull: 30,
        crew: 20,
        guns: 11,
        shot: 6,
        lumber: 2,
      },
      playerDuel: { swordplay: 82, level: 10 },
    });
  });

  test('does not invent firepower for an unarmed model or supplies from another ship', () => {
    const model = jest.requireActual('../data/shipData').shipData['6'];
    const originalGuns = model.usedGuns;
    model.usedGuns = 0;
    state.fleets['1'].ships[0].cargo = [];

    expect(startCombat('joao.m2.katarina')).toBe(true);
    expect(getCombatSnapshot()).toMatchObject({
      player: { guns: 0, shot: 0, lumber: 0 },
    });

    model.usedGuns = originalGuns;
  });

  test('rejects naval start without a flagship or assigned captain', () => {
    state.fleets['1'].ships = [];
    expect(startCombat('joao.m2.katarina')).toBe(false);
    state.fleets['1'].ships = [flagship()];
    state.mates[0].role = null;
    expect(startCombat('joao.m2.katarina')).toBe(false);
    state.mates[0].role = 0;
    state.fleets['1'].ships[0].id = 'future-model';
    expect(canStartCombat('joao.m2.katarina')).toBe(false);
  });

  test('checks prospective naval readiness with the same replay and overlay guards', () => {
    state.fleets['1'].ships = [];
    state.mates = [{ sailorId: '1', role: 'firstMate' }];
    const prospective = {
      ships: [{ id: '6' }],
      mates: [{ sailorId: '32', role: 0 }],
    };

    expect(canStartCombat('joao.m2.katarina')).toBe(false);
    expect(
      canStartCombatWithRoster('joao.m2.katarina', prospective),
    ).toBe(true);

    const releaseOverlay = Input.suspend('overlay');
    expect(
      canStartCombatWithRoster('joao.m2.katarina', prospective),
    ).toBe(false);
    releaseOverlay();

    state.combatResults['joao.m2.katarina'] = 'victory';
    expect(
      canStartCombatWithRoster('joao.m2.katarina', prospective),
    ).toBe(false);
  });

  test('autosaves legal actions and syncs only flagship battle resources', () => {
    expect(startCombat('joao.m2.katarina')).toBe(true);
    const expected = getCombatSnapshot()!;
    const consortBefore = JSON.stringify(state.fleets['1'].ships[1]);
    const listener = jest.fn();
    const unsubscribe = subscribeCombat(listener);
    const generation = getCombatGeneration();
    const writes = savedWrites();

    expect(actCombat(expected, { type: 'fire' })).toBe(true);

    expect(getCombatSnapshot()).not.toBe(expected);
    expect(state.fleets['1'].ships[0]).toMatchObject({
      durability: 21,
      crew: 20,
    });
    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: 'water', quantity: 12 },
      { type: 'shot', quantity: 5 },
      { type: 'lumber', quantity: 2 },
      { type: '1', quantity: 4 },
    ]);
    expect(JSON.stringify(state.fleets['1'].ships[1])).toBe(consortBefore);
    expect(updateInterface.provisions).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getCombatGeneration()).toBe(generation);
    expect(writes).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test('rejects stale, illegal, terminal, and overlay-covered actions without saving', () => {
    expect(startCombat('joao.m2.kahn-house')).toBe(true);
    const current = getCombatSnapshot()!;
    const stale = { ...current };
    const writes = savedWrites();

    expect(actCombat(stale, { type: 'attack', attack: 'slash' })).toBe(false);
    expect(actCombat(current, { type: 'defend', defense: 'block' })).toBe(
      false,
    );
    const releaseOverlay = Input.suspend('overlay');
    expect(actCombat(current, { type: 'attack', attack: 'slash' })).toBe(false);
    releaseOverlay();
    expect(writes).not.toHaveBeenCalled();
  });

  test('autosaves a nested boarding-duel action and keeps flagship resources synchronized', () => {
    state.fleets['1'].ships[0].crew = 22;
    expect(startCombat('joao.m2.katarina')).toBe(true);
    expect(actCombat(getCombatSnapshot()!, { type: 'approach' })).toBe(true);
    expect(actCombat(getCombatSnapshot()!, { type: 'approach' })).toBe(true);
    expect(actCombat(getCombatSnapshot()!, { type: 'challenge' })).toBe(true);
    const challenged = getCombatSnapshot()!;
    if (challenged.kind !== 'naval') throw Error('Expected naval combat');
    expect(challenged.boardingDuel).not.toBeNull();
    const writes = savedWrites();

    expect(
      actCombat(challenged, {
        type: 'duel',
        action: { type: 'attack', attack: 'slash' },
      }),
    ).toBe(true);

    const next = getCombatSnapshot()!;
    if (next.kind !== 'naval') throw Error('Expected naval combat');
    expect(state.fleets['1'].ships[0]).toMatchObject({
      durability: next.player.hull,
      crew: next.player.crew,
    });
    expect(writes).toHaveBeenCalledTimes(1);
  });

  test('loads a pending result, rejects its stale pre-load object, and settles it once', () => {
    expect(startCombat('joao.m2.kahn-house')).toBe(true);
    const current = getCombatSnapshot()!;
    if (current.kind !== 'duel') throw Error('Expected duel');
    current.enemy.hp = 1;
    expect(actCombat(current, { type: 'attack', attack: 'slash' })).toBe(true);
    const pendingBeforeLoad = getCombatSnapshot()!;
    expect(pendingBeforeLoad.outcome).toBe('victory');
    const beforeLoadGeneration = getCombatGeneration();

    expect(load()).toBe(true);
    const firstRestore = getCombatSnapshot()!;
    expect(firstRestore).not.toBe(pendingBeforeLoad);
    expect(load()).toBe(true);
    const restored = getCombatSnapshot()!;
    expect(restored).not.toBe(firstRestore);
    expect(restored.outcome).toBe('victory');
    expect(Input.isSuspended('combat')).toBe(true);
    expect(getCombatGeneration()).toBe(beforeLoadGeneration + 2);
    expect(finishCombat(pendingBeforeLoad)).toBe(false);

    const writes = savedWrites();
    const releaseOverlay = Input.suspend('overlay');
    expect(finishCombat(restored)).toBe(false);
    releaseOverlay();
    expect(finishCombat(restored)).toBe(true);
    expect(state.activeCombat).toBeNull();
    expect(state.combatResults['joao.m2.kahn-house']).toBe('victory');
    expect(state.mateProgress['1'].battleExperience).toBe(1000);
    expect(Input.isSuspended('combat')).toBe(false);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(finishCombat(restored)).toBe(false);
    expect(state.mateProgress['1'].battleExperience).toBe(1000);
    expect(startCombat('joao.m2.kahn-house')).toBe(false);
  });

  test('rejects settlement after the same unique encounter was already recorded', () => {
    expect(startCombat('joao.m2.kahn-house')).toBe(true);
    let current = getCombatSnapshot()!;
    while (current.outcome === null) {
      if (current.kind !== 'duel') throw Error('Expected duel');
      const action =
        current.phase === 'attack'
          ? {
              type: 'attack' as const,
              attack:
                current.enemyDefense === 'parry'
                  ? ('slash' as const)
                  : ('thrust' as const),
            }
          : {
              type: 'defend' as const,
              defense: {
                thrust: 'parry' as const,
                slash: 'block' as const,
                heavy: 'dodge' as const,
              }[current.enemyAttack],
            };
      expect(actCombat(current, action)).toBe(true);
      current = getCombatSnapshot()!;
    }
    expect(current.outcome).toBe('victory');

    state.combatResults['joao.m2.kahn-house'] = 'victory';
    const before = JSON.stringify(state);
    const writes = savedWrites();

    expect(finishCombat(current)).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
    expect(getCombatSnapshot()).toBe(current);
    expect(Input.isSuspended('combat')).toBe(true);
    expect(writes).not.toHaveBeenCalled();
  });

  test('records the first duel outcome without granting experience', () => {
    expect(startCombat('joao.m2.kahn-shipyard')).toBe(true);
    const current = getCombatSnapshot()!;
    current.outcome = 'draw';

    expect(finishCombat(current)).toBe(true);
    expect(state.combatResults['joao.m2.kahn-shipyard']).toBe('draw');
    expect(state.mateProgress['1'].battleExperience).toBe(900);
    expect(canStartCombat('joao.m2.kahn-shipyard')).toBe(false);
  });

  test('grants naval victory experience to current mates only at confirmation', () => {
    expect(startCombat('joao.m2.katarina')).toBe(true);
    const current = getCombatSnapshot()!;
    if (current.kind !== 'naval') throw Error('Expected naval combat');
    current.enemy.hull = 1;
    expect(actCombat(current, { type: 'fire' })).toBe(true);
    const result = getCombatSnapshot()!;
    expect(result.outcome).toBe('victory');
    expect(state.mateProgress['1'].battleExperience).toBe(900);

    expect(finishCombat(result)).toBe(true);
    expect(state.mateProgress).toEqual({
      '1': { battleExperience: 1000 },
      '32': { battleExperience: 50 },
      '33': { battleExperience: 50 },
    });
    expect(state.gold).toBe(1800);
    expect(canStartCombat('joao.m2.katarina')).toBe(false);
  });

  test('grants every current mate 25 experience for retreat and locks replay', () => {
    expect(startCombat('joao.m2.katarina')).toBe(true);
    expect(actCombat(getCombatSnapshot()!, { type: 'withdraw' })).toBe(true);
    expect(actCombat(getCombatSnapshot()!, { type: 'retreat' })).toBe(true);
    const result = getCombatSnapshot()!;

    expect(finishCombat(result)).toBe(true);
    expect(state.mateProgress).toEqual({
      '1': { battleExperience: 925 },
      '32': { battleExperience: 25 },
      '33': { battleExperience: 25 },
    });
    expect(canStartCombat('joao.m2.katarina')).toBe(false);
  });

  test('recovers once from naval defeat in Lisbon and permits a free retry', () => {
    const retained = {
      items: [...state.items],
      equipment: { ...state.equipment },
      gold: state.gold,
      progress: JSON.parse(JSON.stringify(state.mateProgress)),
      consort: JSON.stringify(state.fleets['1'].ships[1]),
    };
    state.portId = null;
    state.buildingId = null;
    state.fleets['1'].ships[0].durability = 4;
    state.fleets['1'].ships[0].crew = 3;
    expect(startCombat('joao.m2.katarina')).toBe(true);
    expect(actCombat(getCombatSnapshot()!, { type: 'fire' })).toBe(true);
    const defeated = getCombatSnapshot()!;
    expect(defeated.outcome).toBe('defeat');
    (updateInterface.provisions as jest.Mock).mockClear();
    const generation = getCombatGeneration();

    expect(finishCombat(defeated)).toBe(true);

    expect(state.combatResults['joao.m2.katarina']).toBe('defeat');
    expect(state.activeCombat).toBeNull();
    expect(state.fleets['1'].ships[0]).toMatchObject({
      durability: 15,
      crew: 10,
    });
    const recoveryPosition = state.fleets['1'].position!;
    expect(recoveryPosition).toEqual({ x: 838, y: 358 });
    const footprint = footprintTilesAt(recoveryPosition);
    expect(footprint).toEqual([0, 5, 0, 5]);
    expect(footprint.every((tile) => tile < 50)).toBe(true);
    expect(state.portId).toBe('1');
    expect(state.buildingId).toBeNull();
    expect(state.dayAtSea).toBe(0);
    expect(state.world).toBeUndefined();
    expect(state.port).toBeUndefined();
    expect(state.items).toEqual(retained.items);
    expect(state.equipment).toEqual(retained.equipment);
    expect(state.gold).toBe(retained.gold);
    expect(state.mateProgress).toEqual(retained.progress);
    expect(JSON.stringify(state.fleets['1'].ships[1])).toBe(retained.consort);
    expect(updateInterface.general).toHaveBeenCalledTimes(1);
    expect(updateInterface.dayAtSea).toHaveBeenCalledWith(0);
    expect(updateInterface.provisions).toHaveBeenCalledTimes(1);
    expect(updateInterface.discovery).toHaveBeenCalledWith([]);
    expect(getCombatGeneration()).toBe(generation + 1);
    expect(canStartCombat('joao.m2.katarina')).toBe(true);
    expect(startCombat('joao.m2.katarina')).toBe(true);
  });

  test('leaves the player at the duel location after defeat', () => {
    expect(startCombat('joao.m2.kahn-house')).toBe(true);
    const defeated = getCombatSnapshot()!;
    defeated.outcome = 'defeat';
    const position = { ...state.fleets['1'].position! };

    expect(finishCombat(defeated)).toBe(true);
    expect(state.portId).toBe('1');
    expect(state.buildingId).toBe('8');
    expect(state.fleets['1'].position).toEqual(position);
    expect(state.world).toBeDefined();
    expect(state.port).toBeDefined();
  });
});
