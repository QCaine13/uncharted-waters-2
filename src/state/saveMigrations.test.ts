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
