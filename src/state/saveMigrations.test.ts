import { migrate, SAVE_VERSION } from './saveMigrations';
import { createDuel } from '../combat/duel';
import { createNaval } from '../combat/naval';
import { encounterCatalog } from '../combat/encounters';

const fighter = {
  swordplay: 82,
  level: 3,
  weaponRating: 15,
  armorRating: 20,
  weaponCategory: '2' as const,
};

describe('save migrations (D6)', () => {
  it('upgrades a v1 save to the current version and defaults new fields', () => {
    const v1 = { version: 1, gold: 500, quests: ['houseBeforeQuest'] };

    const migrated = migrate(v1);

    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(SAVE_VERSION);
    // new field gets a sensible default
    expect(migrated?.fame).toEqual({ adventure: 0, pirate: 0, trade: 0 });
    // existing fields are preserved, not lost
    expect(migrated?.gold).toBe(500);
    expect(migrated?.quests).toEqual(['houseBeforeQuest']);
  });

  it('upgrades a v2 save to v3, adds marketPrices, and preserves quests and fame', () => {
    const v2 = {
      version: 2,
      gold: 250,
      quests: ['houseBeforeQuest'],
      fame: { adventure: 3, pirate: 0, trade: 1 },
    };

    const migrated = migrate(v2);

    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(SAVE_VERSION);
    expect(migrated?.marketPrices).toEqual({});
    expect(migrated?.quests).toEqual(['houseBeforeQuest']);
    expect(migrated?.fame).toEqual({ adventure: 3, pirate: 0, trade: 1 });
  });

  it('upgrades a v3 save to v4, adds discoveries, and preserves quests, fame, and marketPrices', () => {
    const v3 = {
      version: 3,
      gold: 900,
      quests: ['houseBeforeQuest'],
      fame: { adventure: 3, pirate: 0, trade: 1 },
      marketPrices: { '1': { '10': { index: 130, updatedDay: 4 } } },
    };

    const migrated = migrate(v3);

    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(SAVE_VERSION);
    expect(migrated?.discoveries).toEqual([]);
    expect(migrated?.quests).toEqual(['houseBeforeQuest']);
    expect(migrated?.fame).toEqual({ adventure: 3, pirate: 0, trade: 1 });
    expect(migrated?.marketPrices).toEqual({
      '1': { '10': { index: 130, updatedDay: 4 } },
    });
  });

  it('upgrades v4 progress to semantic events and treats paid discoveries as reported', () => {
    const old = {
      version: 4,
      quests: ['houseBeforeQuest', 'future-old-key'],
      discoveries: ['strait-of-gibraltar'],
      gold: 900,
    };

    const upgraded = migrate(old);

    expect(upgraded?.storyEvents).toEqual([
      'joao.lisbon-opening.house-introduction',
    ]);
    expect(upgraded?.reportedDiscoveries).toEqual(['strait-of-gibraltar']);
    expect(upgraded?.quests).toEqual(old.quests);
    expect(upgraded?.gold).toBe(900);
  });

  it('upgrades v5 to v6 combat defaults without changing possessions or progress', () => {
    const old = {
      version: 5,
      items: ['4', 'future-item'],
      mates: [{ sailorId: '1', role: 0 }],
      storyEvents: ['future.event'],
      futureProgress: { retained: true },
    };

    expect(migrate(old)).toEqual({
      ...old,
      version: SAVE_VERSION,
      equipment: { weaponId: null, armorId: null },
      mateProgress: {},
      combatResults: {},
      activeCombat: null,
      storyEventTimes: { 'future.event': 0 },
    });
  });

  it.each([
    createDuel({
      encounterId: 'joao.m2.kahn-house',
      player: fighter,
      enemy: encounterCatalog['joao.m2.kahn-house'].enemy,
    }),
    createNaval({
      encounterId: 'joao.m2.katarina',
      player: {
        hull: 100,
        maxHull: 100,
        crew: 20,
        guns: 10,
        shot: 6,
        lumber: 2,
      },
      playerDuel: fighter,
    }),
  ])(
    'upgrades a complete v6 $kind combat save and anchors all completed event ids',
    (activeCombat) => {
      const old = {
        version: 6,
        timePassed: 24_680,
        items: ['4', '18', 'future-item'],
        equipment: { weaponId: '4', armorId: '18' },
        mates: [{ sailorId: '1', role: 0 }],
        mateProgress: { 'future-mate': { battleExperience: 7 } },
        storyEvents: ['joao.m2.known', 'future.event'],
        combatResults: { 'future.encounter': 'draw' },
        activeCombat,
        futureProgress: { retained: true },
      };

      expect(migrate(old)).toEqual({
        ...old,
        version: SAVE_VERSION,
        storyEventTimes: {
          'joao.m2.known': 24_680,
          'future.event': 24_680,
        },
      });
    },
  );

  it('normalizes malformed v7 clocks without dropping valid unknown ids or minting completions', () => {
    const current = {
      version: 7,
      timePassed: 900,
      storyEvents: ['completed.missing', 'completed.invalid'],
      storyEventTimes: {
        'unknown.valid': 123,
        'completed.invalid': -1,
        'unknown.invalid': Number.NaN,
        'unknown.string': '12',
      },
      items: [],
      equipment: { weaponId: null, armorId: null },
      mateProgress: {},
      combatResults: {},
      activeCombat: null,
    };

    expect(migrate(current)?.storyEventTimes).toEqual({
      'unknown.valid': 123,
      'completed.invalid': 900,
      'completed.missing': 900,
    });
    expect(migrate(current)?.storyEvents).toEqual(current.storyEvents);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, undefined])(
    'uses zero when a completed event needs a clock and current time is %p',
    (timePassed) => {
      expect(
        migrate({
          version: 7,
          timePassed,
          storyEvents: ['completed'],
          storyEventTimes: {},
          items: [],
          equipment: { weaponId: null, armorId: null },
          mateProgress: {},
          combatResults: {},
          activeCombat: null,
        })?.storyEventTimes,
      ).toEqual({ completed: 0 });
    },
  );

  it('returns clocks that are deeply independent from the input save', () => {
    const raw = {
      version: 7,
      storyEvents: [],
      storyEventTimes: { 'unknown.valid': 123 },
      items: [],
      equipment: { weaponId: null, armorId: null },
      mateProgress: {},
      combatResults: {},
      activeCombat: null,
    };
    const migrated = migrate(raw)!;

    expect(migrated.storyEventTimes).not.toBe(raw.storyEventTimes);
    (migrated.storyEventTimes as Record<string, number>)['unknown.valid'] = 456;
    expect(raw.storyEventTimes).toEqual({ 'unknown.valid': 123 });
  });

  it('leaves a current-version save unchanged', () => {
    const current = {
      version: SAVE_VERSION,
      gold: 1,
      fame: { adventure: 9, pirate: 0, trade: 0 },
      equipment: { weaponId: null, armorId: null },
      mateProgress: {},
      combatResults: {},
      activeCombat: null,
      storyEventTimes: {},
    };

    expect(migrate(current)).toEqual(current);
  });

  it('clears unknown, unowned, and wrong-category equipped items', () => {
    const base = {
      version: SAVE_VERSION,
      items: ['4', '18', 'future-item'],
      mateProgress: {},
      combatResults: {},
      activeCombat: null,
    };

    expect(
      migrate({
        ...base,
        equipment: { weaponId: '12', armorId: 'future-item' },
      })?.equipment,
    ).toEqual({ weaponId: null, armorId: null });
    expect(
      migrate({
        ...base,
        equipment: { weaponId: '18', armorId: '4' },
      })?.equipment,
    ).toEqual({ weaponId: null, armorId: null });
    expect(
      migrate({
        ...base,
        equipment: { weaponId: '4', armorId: '18' },
      })?.equipment,
    ).toEqual({ weaponId: '4', armorId: '18' });
  });

  it('fails safe (null) on unknown, missing, or absent version', () => {
    expect(migrate({ version: 99 })).toBeNull();
    expect(migrate({ gold: 1 })).toBeNull();
    expect(migrate(null)).toBeNull();
    expect(migrate(undefined)).toBeNull();
  });
});
