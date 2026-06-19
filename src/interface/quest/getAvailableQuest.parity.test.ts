import { sample } from '../../utils';
import { resolveQuestId, QuestContext } from './questEvents';
import type { QuestId } from './questData';

/*
 Characterization / parity test for the data-driven migration of getAvailableQuest.

 `legacyResolve` below is a verbatim port of the ORIGINAL hand-written nested if-else
 (operating on a passed-in context instead of the global state). We then exhaustively
 enumerate every combination of (finished gating quests × building × time-of-day) and
 assert the new engine (`resolveQuestId`) returns exactly the same quest id.

 `sample` is mocked to be deterministic so the random lodge/bank/guild greetings are
 comparable; both the legacy oracle and the engine call the same mocked `sample`.
*/

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  sample: jest.fn(<T>(values: T[]): T => values[0]),
}));

const finished = (ctx: QuestContext, id: QuestId) => ctx.quests.includes(id);

const between22and24 = (timePassed: number) => {
  const timePassedToday = timePassed % 1440;
  return timePassedToday >= 1320 || timePassedToday === 0;
};

// Verbatim port of the original getAvailableQuest gating logic.
const legacyResolve = (ctx: QuestContext): QuestId | null => {
  const { portId, buildingId, timePassed } = ctx;
  const f = (id: QuestId) => finished(ctx, id);

  if (portId !== '1' || !buildingId) {
    return null;
  }

  if (buildingId === '8') {
    if (!f('houseBeforeQuest')) {
      return 'houseBeforeQuest';
    }
    if (!f('houseAfterQuestAndPub')) {
      if (f('pubAfterQuest') && between22and24(timePassed)) {
        return 'houseAfterQuestAndPub';
      }
      return 'houseAfterQuest';
    }
    return 'houseAfterQuestAndPub2';
  }

  if (buildingId === '2') {
    if (!f('houseBeforeQuest')) {
      if (!f('pubBeforeQuest')) {
        return 'pubBeforeQuest';
      }
      return 'pubBeforeQuest2';
    }
    if (!f('pubAfterQuest')) {
      return 'pubAfterQuest';
    }
    if (!f('houseAfterQuestAndPub')) {
      return 'pubAfterQuest2';
    }
    return 'pubCarlottaGreeting';
  }

  if (['5', '7', '9'].includes(buildingId)) {
    if (!f('houseBeforeQuest')) {
      return sample([
        'lodgeBankGuildBeforeQuestRandom1',
        'lodgeBankGuildBeforeQuestRandom2',
        'lodgeBankGuildBeforeQuestRandom3',
      ]);
    }
    return sample([
      'lodgeBankGuildAfterQuestRandom1',
      'lodgeBankGuildAfterQuestRandom2',
      'lodgeBankGuildAfterQuestRandom3',
    ]);
  }

  if (buildingId === '6') {
    if (!f('houseBeforeQuest')) {
      return 'palaceBeforeQuest';
    }
    return 'palaceAfterQuest';
  }

  if (buildingId === '10') {
    if (!f('houseBeforeQuest')) {
      return 'itemShopBeforeQuest';
    }
    if (!f('itemShopAfterQuest')) {
      return 'itemShopAfterQuest';
    }
    return 'itemShopAfterQuest2';
  }

  if (buildingId === '3') {
    if (!f('houseBeforeQuest')) {
      return 'shipyardBeforeQuest';
    }
    if (!f('shipyardAfterQuest')) {
      return 'shipyardAfterQuest';
    }
    return null;
  }

  if (buildingId === '11') {
    if (!f('houseBeforeQuest')) {
      if (!f('churchBeforeQuest')) {
        return 'churchBeforeQuest';
      }
      return 'churchBeforeQuest2';
    }
    if (!f('churchAfterEnrico')) {
      if (!f('churchAfterQuest')) {
        return 'churchAfterQuest';
      }
      return 'churchAfterEnrico';
    }
    return 'churchAfterEnricoAfterGift';
  }

  if (buildingId === '1') {
    if (!f('houseBeforeQuest')) {
      return 'marketBeforeQuest';
    }
    if (!f('shipyardAfterQuest')) {
      return 'marketAfterQuestBeforeShip';
    }
    return null;
  }

  if (buildingId === '4') {
    if (!f('houseBeforeQuest')) {
      return 'harborBeforeQuest';
    }
    if (!f('shipyardAfterQuest')) {
      return 'harborBeforeShip';
    }
    if (!f('churchAfterQuest')) {
      return 'harborBeforeEnrico';
    }
    if (!f('pubAfterQuest')) {
      if (!f('churchAfterEnrico')) {
        return 'harborAfterEnrico';
      }
      return 'harborAfterEnrico2';
    }
    if (!f('houseAfterQuestAndPub')) {
      return 'harborAfterEnricoBeforeMother';
    }
    if (!f('harborFinal')) {
      return 'harborFinal';
    }
  }

  return null;
};

// Every quest id the gating logic inspects via finishedQuest(...).
const gatingQuests: QuestId[] = [
  'houseBeforeQuest',
  'houseAfterQuestAndPub',
  'pubAfterQuest',
  'pubBeforeQuest',
  'churchBeforeQuest',
  'churchAfterQuest',
  'churchAfterEnrico',
  'itemShopAfterQuest',
  'shipyardAfterQuest',
  'harborFinal',
];

// All buildings that have gating logic, plus an unknown one ('99') to cover the null path.
const buildings = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '99'];

// Midnight (0) and 22:00–23:59 are inside the late-night window; the rest are outside.
const times = [0, 600, 1320, 1380, 1439];

// Every subset of the gating quests (2^n), built without bitwise ops.
const powerset = <T>(items: T[]): T[][] =>
  items.reduce<T[][]>(
    (sets, item) => [...sets, ...sets.map((set) => [...set, item])],
    [[]],
  );

describe('getAvailableQuest data-driven migration (parity)', () => {
  it('matches the legacy logic for every quest/building/time combination', () => {
    const mismatches: string[] = [];

    powerset(gatingQuests).forEach((quests) => {
      buildings.forEach((buildingId) => {
        times.forEach((timePassed) => {
          const ctx: QuestContext = { portId: '1', buildingId, timePassed, quests };
          const expected = legacyResolve(ctx);
          const actual = resolveQuestId(ctx);

          if (expected !== actual) {
            mismatches.push(
              `building=${buildingId} time=${timePassed} quests=[${quests.join(
                ',',
              )}] expected=${expected} actual=${actual}`,
            );
          }
        });
      });
    });

    expect(mismatches).toEqual([]);
  });

  it('returns null outside Lisbon and when no building is entered', () => {
    expect(
      resolveQuestId({ portId: '2', buildingId: '8', timePassed: 0, quests: [] }),
    ).toBeNull();
    expect(
      resolveQuestId({ portId: '1', buildingId: null, timePassed: 0, quests: [] }),
    ).toBeNull();
  });
});
