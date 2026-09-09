import type { Role } from '../state/state';
import {
  RELIEF_CAPTAIN_SAILOR_ID,
  SECOND_RELIEF_CAPTAIN_SAILOR_ID,
  planCompanionDeparture,
} from './companionDeparture';

type Mate = { sailorId: string; role: Role };

const mates = (...entries: Array<[string, Role]>): Mate[] =>
  entries.map(([sailorId, role]) => ({ sailorId, role }));

test.each([
  ['unassigned', null],
  ['officer', 'firstMate'],
] as const)(
  'removes a %s companion without changing other roles',
  (_label, role) => {
    const original = mates(['1', 0], ['32', 1], ['33', 2], ['34', role]);

    expect(planCompanionDeparture(original, 3, '34')).toEqual({
      ok: true,
      mates: mates(['1', 0], ['32', 1], ['33', 2]),
    });
    expect(original).toEqual(
      mates(['1', 0], ['32', 1], ['33', 2], ['34', role]),
    );
  },
);

test('moves the first remaining null-role mate into a departing captain role', () => {
  expect(
    planCompanionDeparture(
      mates(['1', 0], ['32', 1], ['33', null], ['34', 2]),
      3,
      '34',
    ),
  ).toEqual({
    ok: true,
    mates: mates(['1', 0], ['32', 1], ['33', 2]),
  });
});

test('creates one relief captain when a four-ship fleet has no spare mate', () => {
  const result = planCompanionDeparture(
    mates(['1', 0], ['32', 1], ['33', 2], ['34', 3]),
    4,
    '34',
  );

  expect(result).toEqual({
    ok: true,
    mates: mates(['1', 0], ['32', 1], ['33', 2], [RELIEF_CAPTAIN_SAILOR_ID, 3]),
  });
  if (!result.ok) throw new Error('expected a departure plan');
  expect(result.mates.filter(({ sailorId }) => sailorId === '1')).toHaveLength(
    1,
  );
  expect(
    [0, 1, 2, 3].filter(
      (role) => result.mates.filter((mate) => mate.role === role).length === 1,
    ),
  ).toHaveLength(4);
});

test('rejects missing companions and João', () => {
  const roster = mates(
    ['1', 0],
    ['32', 1],
    ['33', 2],
    ['34', 3],
    [RELIEF_CAPTAIN_SAILOR_ID, 'firstMate'],
  );

  expect(planCompanionDeparture(roster, 4, 'missing')).toMatchObject({
    ok: false,
    code: 'companion-not-recruited',
  });
  expect(planCompanionDeparture(roster, 4, '1')).toMatchObject({
    ok: false,
    code: 'cannot-remove-protagonist',
  });
});

test('uses the bounded relief pool across sequential four-ship departures', () => {
  const original = mates(['1', 0], ['34', 1], ['32', 2], ['33', 3]);

  const domingoDeparture = planCompanionDeparture(original, 4, '34');
  expect(domingoDeparture).toEqual({
    ok: true,
    mates: mates(['1', 0], ['32', 2], ['33', 3], [RELIEF_CAPTAIN_SAILOR_ID, 1]),
  });
  if (!domingoDeparture.ok) throw new Error('expected Domingo to leave');

  const enricoDeparture = planCompanionDeparture(
    domingoDeparture.mates,
    4,
    '33',
  );
  expect(enricoDeparture).toEqual({
    ok: true,
    mates: mates(
      ['1', 0],
      ['32', 2],
      [RELIEF_CAPTAIN_SAILOR_ID, 1],
      [SECOND_RELIEF_CAPTAIN_SAILOR_ID, 3],
    ),
  });
  if (!enricoDeparture.ok) throw new Error('expected Enrico to leave');
  expect(enricoDeparture.mates.map(({ role }) => role).sort()).toEqual([
    0, 1, 2, 3,
  ]);
  expect(
    enricoDeparture.mates.some(({ sailorId }) =>
      ['33', '34'].includes(sailorId),
    ),
  ).toBe(false);
});

test('uses an existing unassigned mate before creating another relief captain', () => {
  expect(
    planCompanionDeparture(
      mates(
        ['1', 0],
        ['32', 1],
        ['33', 2],
        ['34', 3],
        [RELIEF_CAPTAIN_SAILOR_ID, Number.NaN],
      ),
      4,
      '34',
    ),
  ).toEqual({
    ok: true,
    mates: mates(['1', 0], ['32', 1], ['33', 2], [RELIEF_CAPTAIN_SAILOR_ID, 3]),
  });
});

test('refuses departures when the relief pool is exhausted', () => {
  expect(
    planCompanionDeparture(
      mates(
        ['1', 0],
        ['32', 1],
        ['33', 2],
        ['34', 3],
        [RELIEF_CAPTAIN_SAILOR_ID, 'firstMate'],
        [SECOND_RELIEF_CAPTAIN_SAILOR_ID, 'bookKeeper'],
      ),
      4,
      '34',
    ),
  ).toMatchObject({ ok: false, code: 'relief-captain-unavailable' });
});

test('does not re-add a relief captain who is the departing actor', () => {
  expect(
    planCompanionDeparture(
      mates(['1', 0], [RELIEF_CAPTAIN_SAILOR_ID, 1]),
      2,
      RELIEF_CAPTAIN_SAILOR_ID,
    ),
  ).toEqual({
    ok: true,
    mates: mates(['1', 0], [SECOND_RELIEF_CAPTAIN_SAILOR_ID, 1]),
  });
});

test('rejects missing and duplicate captain slots before removing an officer', () => {
  expect(
    planCompanionDeparture(
      mates(['1', 0], ['32', 1], ['33', 1], ['34', 'firstMate']),
      3,
      '34',
    ),
  ).toMatchObject({ ok: false, code: 'invalid-captain-role' });

  expect(
    planCompanionDeparture(
      mates(['1', 0], ['32', 2], ['34', 'firstMate']),
      3,
      '34',
    ),
  ).toMatchObject({ ok: false, code: 'invalid-captain-role' });
});

test.each([4, 1.5])(
  'rejects invalid numeric captain role %p for a four-ship fleet',
  (role) => {
    expect(
      planCompanionDeparture(
        mates(['1', 0], ['32', 1], ['33', 2], ['34', role]),
        4,
        '34',
      ),
    ).toMatchObject({ ok: false, code: 'invalid-captain-role' });
  },
);
