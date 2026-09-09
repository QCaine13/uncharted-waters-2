import state from './state';
import { save, load } from './saveLoad';
import { getLoadGeneration, subscribeGameLoad } from './saveEvents';
import { advanceDuel, createDuel } from '../combat/duel';
import { advanceNaval, createNaval } from '../combat/naval';
import type { CombatState, DuelCombatantStats } from '../combat/types';
import { encounterCatalog, type CombatEncounterId } from '../combat/encounters';
import { notifyCombatChanged } from '../combat/combatEvents';
import Input from '../input';
import { conditionSatisfied } from '../story/core/resolver';
import {
  storyEventId,
  type StoryCondition,
  type StoryContext,
} from '../story/core/types';

const fighter: DuelCombatantStats = {
  swordplay: 82,
  level: 3,
  weaponRating: 15,
  armorRating: 20,
  weaponCategory: '2',
};

const storyMinutesAt = (
  year: number,
  month: number,
  day: number,
  hour = 10,
): number =>
  (Date.UTC(year, month - 1, day, hour) - Date.UTC(1522, 4, 17)) / 60_000;

const clockContext = (timePassed: number): StoryContext => ({
  stage: 'building',
  portId: '75',
  buildingId: '8',
  timePassed,
  dayAtSea: 0,
  completedEvents: new Set(state.storyEvents.map(storyEventId)),
  storyEventTimes: state.storyEventTimes,
  fame: state.fame,
  items: new Set(),
  companions: new Set(),
  discoveries: new Set(),
  reportedDiscoveries: new Set(),
  combatResults: {},
});

const earnedDuelVictory = (): CombatState => {
  let duel = createDuel({
    encounterId: 'joao.m2.kahn-house',
    player: fighter,
    enemy: encounterCatalog['joao.m2.kahn-house'].enemy,
  });
  while (duel.outcome === null) {
    duel =
      duel.phase === 'attack'
        ? advanceDuel(duel, {
            type: 'attack',
            attack: duel.enemyDefense === 'parry' ? 'slash' : 'thrust',
          })
        : advanceDuel(duel, {
            type: 'defend',
            defense: {
              thrust: 'parry' as const,
              slash: 'block' as const,
              heavy: 'dodge' as const,
            }[duel.enemyAttack],
          });
  }
  return duel;
};

const pendingReplay = (encounterId: CombatEncounterId): CombatState => {
  if (encounterId === 'joao.m2.kahn-house') return earnedDuelVictory();
  let naval = createNaval({
    encounterId,
    player: {
      hull: 100,
      maxHull: 100,
      crew: 20,
      guns: 10,
      shot: 10,
      lumber: 2,
    },
    playerDuel: fighter,
  });
  while (naval.outcome === null) naval = advanceNaval(naval, { type: 'fire' });
  return naval;
};

describe('save/load round trip', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('preserves a sparse marketPrices map', () => {
    state.marketPrices = {
      '1': { '10': { index: 130, updatedDay: 4 } },
      '2': { '3': { index: 70, updatedDay: 9 } },
    };

    save();
    state.marketPrices = {};

    expect(load()).toBe(true);
    expect(state.marketPrices).toEqual({
      '1': { '10': { index: 130, updatedDay: 4 } },
      '2': { '3': { index: 70, updatedDay: 9 } },
    });
  });

  test('preserves an empty marketPrices map', () => {
    state.marketPrices = {};

    save();
    state.marketPrices = { '1': { '10': { index: 130, updatedDay: 4 } } };

    expect(load()).toBe(true);
    expect(state.marketPrices).toEqual({});
  });

  test('preserves discoveries', () => {
    state.discoveries = ['strait-of-gibraltar', 'azores'];

    save();
    state.discoveries = [];

    expect(load()).toBe(true);
    expect(state.discoveries).toEqual(['strait-of-gibraltar', 'azores']);
  });

  test('preserves semantic story events and reported discoveries', () => {
    state.storyEvents = ['chapter.event', 'future.event'];
    state.storyEventTimes = { 'chapter.event': 120, 'future.event': 480 };
    state.reportedDiscoveries = ['strait-of-gibraltar', 'future-landmark'];

    save();
    state.storyEvents = [];
    state.storyEventTimes = {};
    state.reportedDiscoveries = [];

    expect(load()).toBe(true);
    expect(state.storyEvents).toEqual(['chapter.event', 'future.event']);
    expect(state.storyEventTimes).toEqual({
      'chapter.event': 120,
      'future.event': 480,
    });
    expect(state.reportedDiscoveries).toEqual([
      'strait-of-gibraltar',
      'future-landmark',
    ]);
  });

  test('preserves equipment, unknown progress/results, and a compatible ongoing duel exactly', () => {
    state.items = ['4', '18'];
    state.equipment = { weaponId: '4', armorId: '18' };
    state.mateProgress = {
      '1': { battleExperience: 240 },
      'future-mate': { battleExperience: 7 },
    };
    state.combatResults = {
      'joao.m2.kahn-shipyard': 'victory',
      'future.encounter': 'draw',
    };
    state.activeCombat = advanceDuel(
      createDuel({
        encounterId: 'joao.m2.kahn-house',
        player: fighter,
        enemy: encounterCatalog['joao.m2.kahn-house'].enemy,
      }),
      { type: 'attack', attack: 'thrust' },
    );
    const expected = JSON.parse(JSON.stringify(state.activeCombat));

    save();
    state.equipment = { weaponId: null, armorId: null };
    state.mateProgress = {};
    state.combatResults = {};
    state.activeCombat = null;

    expect(load()).toBe(true);
    expect(state.equipment).toEqual({ weaponId: '4', armorId: '18' });
    expect(state.mateProgress).toEqual({
      '1': { battleExperience: 240 },
      'future-mate': { battleExperience: 7 },
    });
    expect(state.combatResults).toEqual({
      'joao.m2.kahn-shipyard': 'victory',
      'future.encounter': 'draw',
    });
    expect(state.activeCombat).toEqual(expected);
  });

  test('clears a loaded unique-encounter conflict without another save or lost progress', () => {
    state.activeCombat = null;
    notifyCombatChanged();
    state.items = ['4', '18'];
    state.storyEvents = ['future.event'];
    state.mateProgress = {
      '1': { battleExperience: 100 },
      'future-mate': { battleExperience: 7 },
    };
    state.combatResults = {
      'joao.m2.kahn-house': 'victory',
      'future.encounter': 'draw',
    };
    state.activeCombat = earnedDuelVictory();
    notifyCombatChanged();
    expect(Input.isSuspended('combat')).toBe(true);
    save();
    const saved = window.localStorage.getItem('savedState');
    const writes = jest.spyOn(Storage.prototype, 'setItem').mockClear();

    expect(load()).toBe(true);

    expect(state.activeCombat).toBeNull();
    expect(Input.isSuspended('combat')).toBe(false);
    expect(state.items).toEqual(['4', '18']);
    expect(state.storyEvents).toEqual(['future.event']);
    expect(state.mateProgress).toEqual({
      '1': { battleExperience: 100 },
      'future-mate': { battleExperience: 7 },
    });
    expect(state.combatResults).toEqual({
      'joao.m2.kahn-house': 'victory',
      'future.encounter': 'draw',
    });
    expect(writes).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('savedState')).toBe(saved);
    writes.mockRestore();
  });

  test.each([
    ['joao.m2.kahn-house', 'draw'],
    ['joao.m2.katarina', 'defeat'],
    ['joao.m3.ottoman-one', 'defeat'],
    ['joao.m3.amazon', 'retreat'],
  ] as const)(
    'loads a pending %s replay result after an allowed %s',
    (encounterId, priorOutcome) => {
      state.activeCombat = null;
      notifyCombatChanged();
      save();
      const saved = JSON.parse(window.localStorage.getItem('savedState')!);
      const pending = pendingReplay(encounterId);
      saved.combatResults = { [encounterId]: priorOutcome };
      saved.activeCombat = pending;
      window.localStorage.setItem('savedState', JSON.stringify(saved));

      expect(load()).toBe(true);
      const restored = state.activeCombat as CombatState | null;
      expect(restored).toEqual(pending);
      expect(restored?.outcome).toBe('victory');
      expect(Input.isSuspended('combat')).toBe(true);

      state.activeCombat = null;
      notifyCombatChanged();
    },
  );

  test('preserves an ongoing naval challenge through a JSON round trip', () => {
    const naval = createNaval({
      encounterId: 'joao.m2.katarina',
      player: { hull: 30, maxHull: 30, crew: 20, guns: 8, shot: 3, lumber: 2 },
      playerDuel: fighter,
    });
    state.activeCombat = advanceNaval(
      { ...naval, range: 0 },
      { type: 'challenge' },
    );
    const expected = JSON.parse(JSON.stringify(state.activeCombat));

    save();
    state.activeCombat = null;

    expect(load()).toBe(true);
    expect(state.activeCombat).toEqual(expected);
  });

  test.each([
    ['joao.m3.ottoman-one', { hull: 46, maxHull: 46, crew: 18, guns: 8 }],
    ['joao.m3.ottoman-two', { hull: 52, maxHull: 52, crew: 20, guns: 8 }],
    ['joao.m3.amazon', { hull: 64, maxHull: 64, crew: 22, guns: 10 }],
  ] as const)(
    'reloads %s only with its own catalog force',
    (encounterId, enemy) => {
      state.combatResults = {};
      state.activeCombat = createNaval({
        encounterId,
        player: {
          hull: 30,
          maxHull: 30,
          crew: 10,
          guns: 10,
          shot: 8,
          lumber: 0,
        },
        playerDuel: fighter,
      });
      save();
      state.activeCombat = null;

      expect(load()).toBe(true);
      expect(state.activeCombat).toMatchObject({ enemy });

      const saved = JSON.parse(window.localStorage.getItem('savedState')!);
      saved.activeCombat.enemy.maxHull = 42;
      window.localStorage.setItem('savedState', JSON.stringify(saved));
      expect(load()).toBe(true);
      expect(state.activeCombat).toBeNull();
    },
  );

  test('reloads the Amazon nested challenge with its distinct captain and rejects substitutions', () => {
    const naval = createNaval({
      encounterId: 'joao.m3.amazon',
      player: {
        hull: 30,
        maxHull: 30,
        crew: 22,
        guns: 10,
        shot: 8,
        lumber: 0,
      },
      playerDuel: fighter,
    });
    state.activeCombat = advanceNaval(
      { ...naval, range: 0 },
      { type: 'challenge' },
    );
    save();
    const expected = JSON.parse(JSON.stringify(state.activeCombat));
    state.activeCombat = null;

    expect(load()).toBe(true);
    expect(state.activeCombat).toEqual(expected);
    expect(
      (state.activeCombat as unknown as Extract<CombatState, { kind: 'naval' }>)
        .boardingDuel?.enemy.stats,
    ).toEqual(encounterCatalog['joao.m3.amazon'].captain);

    const saved = JSON.parse(window.localStorage.getItem('savedState')!);
    saved.activeCombat.boardingDuel.enemy.stats =
      encounterCatalog['joao.m3.ottoman-two'].captain;
    window.localStorage.setItem('savedState', JSON.stringify(saved));
    expect(load()).toBe(true);
    expect(state.activeCombat).toBeNull();
  });

  test.each([
    ['joao.m3.ottoman-one', 'retreat'],
    ['joao.m3.amazon', 'victory'],
  ] as const)(
    'discards a contradictory paid %s active save after %s',
    (encounterId, paidOutcome) => {
      state.combatResults = { [encounterId]: paidOutcome };
      state.activeCombat = createNaval({
        encounterId,
        player: {
          hull: 30,
          maxHull: 30,
          crew: 10,
          guns: 10,
          shot: 8,
          lumber: 0,
        },
        playerDuel: fighter,
      });
      save();

      expect(load()).toBe(true);
      expect(state.combatResults[encounterId]).toBe(paidOutcome);
      expect(state.activeCombat).toBeNull();
    },
  );

  test('discards unsupported active encounter IDs and mismatched outer kinds', () => {
    save();
    const saved = JSON.parse(window.localStorage.getItem('savedState')!);
    const futureDuel = createDuel({
      encounterId: 'future.encounter',
      player: fighter,
      enemy: fighter,
    });
    saved.activeCombat = futureDuel;
    window.localStorage.setItem('savedState', JSON.stringify(saved));
    expect(load()).toBe(true);
    expect(state.activeCombat).toBeNull();

    saved.activeCombat = {
      ...createNaval({
        encounterId: 'joao.m2.katarina',
        player: {
          hull: 30,
          maxHull: 30,
          crew: 20,
          guns: 8,
          shot: 3,
          lumber: 2,
        },
        playerDuel: fighter,
      }),
      encounterId: 'joao.m2.kahn-house',
    };
    window.localStorage.setItem('savedState', JSON.stringify(saved));
    expect(load()).toBe(true);
    expect(state.activeCombat).toBeNull();

    saved.activeCombat = createDuel({
      encounterId: 'joao.m2.katarina',
      player: fighter,
      enemy: fighter,
    });
    window.localStorage.setItem('savedState', JSON.stringify(saved));
    expect(load()).toBe(true);
    expect(state.activeCombat).toBeNull();
  });

  test('discards malformed weapon categories and altered nested captain definitions', () => {
    save();
    const saved = JSON.parse(window.localStorage.getItem('savedState')!);
    const direct = createDuel({
      encounterId: 'joao.m2.kahn-house',
      player: fighter,
      enemy: {
        swordplay: 78,
        level: 3,
        weaponRating: 20,
        armorRating: 10,
        weaponCategory: null,
      },
    });
    (
      direct.player.stats as unknown as { weaponCategory: number }
    ).weaponCategory = 2;
    saved.activeCombat = direct;
    window.localStorage.setItem('savedState', JSON.stringify(saved));
    expect(load()).toBe(true);
    expect(state.activeCombat).toBeNull();

    const naval = createNaval({
      encounterId: 'joao.m2.katarina',
      player: {
        hull: 30,
        maxHull: 30,
        crew: 20,
        guns: 8,
        shot: 3,
        lumber: 2,
      },
      playerDuel: fighter,
    });
    const challenged = advanceNaval(
      { ...naval, range: 0 },
      { type: 'challenge' },
    );
    challenged.boardingDuel!.enemy.stats.swordplay = 1;
    saved.activeCombat = challenged;
    window.localStorage.setItem('savedState', JSON.stringify(saved));
    expect(load()).toBe(true);
    expect(state.activeCombat).toBeNull();
  });

  test('defaults missing v6 fields and discards malformed combat without minting results', () => {
    save();
    const saved = JSON.parse(window.localStorage.getItem('savedState')!);
    delete saved.equipment;
    delete saved.mateProgress;
    saved.combatResults = {
      validUnknown: 'retreat',
      invalidUnknown: 'win',
    };
    saved.activeCombat = {
      kind: 'naval',
      encounterId: 'future.encounter',
      outcome: 'victory',
    };
    window.localStorage.setItem('savedState', JSON.stringify(saved));

    expect(load()).toBe(true);
    expect(state.equipment).toEqual({ weaponId: null, armorId: null });
    expect(state.mateProgress).toEqual({});
    expect(state.combatResults).toEqual({ validUnknown: 'retreat' });
    expect(state.activeCombat).toBeNull();
  });

  test('notifies subscribers after a successful load clears runtime objects', () => {
    save();
    state.world = {} as typeof state.world;
    state.port = {} as typeof state.port;
    const listener = jest.fn(() => {
      expect(state.world).toBeUndefined();
      expect(state.port).toBeUndefined();
    });
    const unsubscribe = subscribeGameLoad(listener);

    expect(load()).toBe(true);

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test('does not advance the load generation for a failed load', () => {
    state.storyEventTimes = { retained: 321 };
    const before = getLoadGeneration();
    const stateBefore = JSON.stringify(state);
    window.localStorage.setItem('savedState', '{broken');

    expect(load()).toBe(false);
    expect(getLoadGeneration()).toBe(before);
    expect(JSON.stringify(state)).toBe(stateBefore);
  });

  test('normalizes v7 clocks on load without mutating storage', () => {
    save();
    const saved = JSON.parse(window.localStorage.getItem('savedState')!);
    saved.timePassed = 700;
    saved.storyEvents = ['completed.missing', 'completed.invalid'];
    saved.storyEventTimes = {
      'unknown.valid': 25,
      'completed.invalid': null,
      'unknown.invalid': 'bad',
    };
    const raw = JSON.stringify(saved);
    window.localStorage.setItem('savedState', raw);

    expect(load()).toBe(true);
    expect(state.storyEventTimes).toEqual({
      'unknown.valid': 25,
      'completed.missing': 700,
      'completed.invalid': 700,
    });
    expect(window.localStorage.getItem('savedState')).toBe(raw);
  });

  test('repairs future calendar anchors on load before evaluating their intended boundaries', () => {
    const waiting = storyEventId('joao.massawa.waiting-for-pietro');
    const martinez = storyEventId('joao.finale.martinez-exposed');
    const current = storyMinutesAt(1522, 6, 20);
    save();
    const saved = JSON.parse(window.localStorage.getItem('savedState')!);
    saved.timePassed = current;
    saved.storyEvents = [waiting, martinez];
    saved.storyEventTimes = {
      [waiting]: current + 100_000,
      [martinez]: current + 200_000,
      'unknown.valid': current - 1,
      'unknown.current': current,
      'unknown.future': current + 1,
    };
    window.localStorage.setItem('savedState', JSON.stringify(saved));

    expect(load()).toBe(true);
    expect(state.storyEventTimes).toEqual({
      [waiting]: current,
      [martinez]: current,
      'unknown.valid': current - 1,
      'unknown.current': current,
    });

    const laterMonth: StoryCondition = {
      type: 'calendarMonthsAfterEvent',
      eventId: waiting,
      minMonths: 1,
      minDay: 11,
    };
    const nextDateAtNine: StoryCondition = {
      type: 'all',
      conditions: [
        {
          type: 'calendarDaysAfterEvent',
          eventId: martinez,
          minDays: 1,
        },
        { type: 'timeWindow', min: 540, max: 900 },
      ],
    };
    expect(conditionSatisfied(laterMonth, clockContext(current))).toBe(false);
    expect(conditionSatisfied(nextDateAtNine, clockContext(current))).toBe(
      false,
    );
    expect(
      conditionSatisfied(laterMonth, clockContext(storyMinutesAt(1522, 7, 11))),
    ).toBe(true);
    expect(
      conditionSatisfied(
        nextDateAtNine,
        clockContext(storyMinutesAt(1522, 6, 21, 9)),
      ),
    ).toBe(true);
  });

  test('uses the same clock normalization during bootstrap and explicit load', () => {
    const raw = JSON.stringify({
      version: 7,
      timePassed: 800,
      storyEvents: ['completed.missing'],
      storyEventTimes: { 'unknown.valid': 50, invalid: -1 },
      items: [],
      equipment: { weaponId: null, armorId: null },
      mateProgress: {},
      combatResults: {},
      activeCombat: null,
    });
    window.localStorage.setItem('savedState', raw);
    let bootstrapTimes: Record<string, number> | undefined;
    jest.isolateModules(() => {
      bootstrapTimes =
        jest.requireActual<typeof import('./state')>('./state').default
          .storyEventTimes;
    });

    expect(load()).toBe(true);
    expect(bootstrapTimes).toEqual(state.storyEventTimes);
    expect(state.storyEventTimes).toEqual({
      'unknown.valid': 50,
      'completed.missing': 800,
    });
  });
});
