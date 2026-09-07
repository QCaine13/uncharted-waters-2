import type { Role } from '../state/state';
import {
  RELIEF_CAPTAIN_SAILOR_ID,
  planCompanionDeparture,
} from './companionDeparture';

type Mate = { sailorId: string; role: Role };

const mates = (...entries: Array<[string, Role]>): Mate[] =>
  entries.map(([sailorId, role]) => ({ sailorId, role }));

test.each([
  ['unassigned', null],
  ['officer', 'firstMate'],
] as const)('removes a %s companion without changing other roles', (_label, role) => {
  const original = mates(['1', 0], ['32', 1], ['33', 2], ['34', role]);

  expect(planCompanionDeparture(original, 3, '34')).toEqual({
    ok: true,
    mates: mates(['1', 0], ['32', 1], ['33', 2]),
  });
  expect(original).toEqual(
    mates(['1', 0], ['32', 1], ['33', 2], ['34', role]),
  );
});

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
    mates: mates(
      ['1', 0],
      ['32', 1],
      ['33', 2],
      [RELIEF_CAPTAIN_SAILOR_ID, 3],
    ),
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

test('rejects missing companions, João, and a second relief captain', () => {
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
  expect(planCompanionDeparture(roster, 4, '34')).toMatchObject({
    ok: false,
    code: 'relief-captain-unavailable',
  });
});
