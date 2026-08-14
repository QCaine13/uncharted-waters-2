import { migrate, SAVE_VERSION } from './saveMigrations';

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

  it('leaves a current-version save unchanged', () => {
    const current = {
      version: SAVE_VERSION,
      gold: 1,
      fame: { adventure: 9, pirate: 0, trade: 0 },
    };

    expect(migrate(current)).toEqual(current);
  });

  it('fails safe (null) on unknown, missing, or absent version', () => {
    expect(migrate({ version: 99 })).toBeNull();
    expect(migrate({ gold: 1 })).toBeNull();
    expect(migrate(null)).toBeNull();
    expect(migrate(undefined)).toBeNull();
  });
});
