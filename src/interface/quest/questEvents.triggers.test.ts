import { triggerSatisfied, QuestContext } from './questEvents';

const ctx = (over: Partial<QuestContext> = {}): QuestContext => ({
  portId: '1',
  buildingId: '8',
  timePassed: 0,
  quests: [],
  fame: { adventure: 0, pirate: 0, trade: 0 },
  ...over,
});

describe('triggerSatisfied', () => {
  it('honours blockedBy / requires (slice 1 conditions)', () => {
    expect(triggerSatisfied({ blockedBy: ['houseBeforeQuest'] }, ctx())).toBe(true);
    expect(
      triggerSatisfied(
        { blockedBy: ['houseBeforeQuest'] },
        ctx({ quests: ['houseBeforeQuest'] }),
      ),
    ).toBe(false);
    expect(triggerSatisfied({ requires: ['pubAfterQuest'] }, ctx())).toBe(false);
    expect(
      triggerSatisfied({ requires: ['pubAfterQuest'] }, ctx({ quests: ['pubAfterQuest'] })),
    ).toBe(true);
  });

  it('gates on fame thresholds (all tracks must meet their minimum)', () => {
    const adventureGate = { fame: { adventure: 1000 } };
    expect(
      triggerSatisfied(adventureGate, ctx({ fame: { adventure: 999, pirate: 0, trade: 0 } })),
    ).toBe(false);
    expect(
      triggerSatisfied(adventureGate, ctx({ fame: { adventure: 1000, pirate: 0, trade: 0 } })),
    ).toBe(true);

    const twoTrackGate = { fame: { adventure: 100, trade: 50 } };
    expect(
      triggerSatisfied(twoTrackGate, ctx({ fame: { adventure: 100, pirate: 0, trade: 49 } })),
    ).toBe(false);
    expect(
      triggerSatisfied(twoTrackGate, ctx({ fame: { adventure: 100, pirate: 0, trade: 50 } })),
    ).toBe(true);
  });

  it('treats missing fame in context as zero', () => {
    expect(triggerSatisfied({ fame: { adventure: 1 } }, ctx({ fame: undefined }))).toBe(false);
  });

  it('gates on elapsed game-days (floor(timePassed / 1440))', () => {
    const minGate = { daysElapsed: { min: 3 } };
    expect(triggerSatisfied(minGate, ctx({ timePassed: 2 * 1440 + 100 }))).toBe(false);
    expect(triggerSatisfied(minGate, ctx({ timePassed: 3 * 1440 }))).toBe(true);

    const windowGate = { daysElapsed: { min: 1, max: 2 } };
    expect(triggerSatisfied(windowGate, ctx({ timePassed: 0 }))).toBe(false);
    expect(triggerSatisfied(windowGate, ctx({ timePassed: 1440 }))).toBe(true);
    expect(triggerSatisfied(windowGate, ctx({ timePassed: 3 * 1440 }))).toBe(false);
  });

  it('an empty trigger matches anything', () => {
    expect(triggerSatisfied({}, ctx())).toBe(true);
  });
});
