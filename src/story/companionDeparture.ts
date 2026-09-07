import type { State } from '../state/state';

export const RELIEF_CAPTAIN_SAILOR_ID = 'm2-relief-captain';
const JOAO_SAILOR_ID = '1';

type Mate = State['mates'][number];

export type CompanionDeparturePlan =
  | { ok: true; mates: Mate[] }
  | {
      ok: false;
      code:
        | 'companion-not-recruited'
        | 'cannot-remove-protagonist'
        | 'invalid-captain-role'
        | 'relief-captain-unavailable';
      message: string;
    };

export const planCompanionDeparture = (
  currentMates: readonly Mate[],
  fleetLength: number,
  sailorId: string,
): CompanionDeparturePlan => {
  if (sailorId === JOAO_SAILOR_ID) {
    return {
      ok: false,
      code: 'cannot-remove-protagonist',
      message: 'João cannot leave the player fleet.',
    };
  }

  const departing = currentMates.find((mate) => mate.sailorId === sailorId);
  if (!departing) {
    return {
      ok: false,
      code: 'companion-not-recruited',
      message: `Companion ${sailorId} is not in the player fleet.`,
    };
  }

  const remaining = currentMates
    .filter((mate) => mate !== departing)
    .map((mate) => ({ ...mate }));
  if (typeof departing.role !== 'number' || Number.isNaN(departing.role)) {
    return { ok: true, mates: remaining };
  }
  if (
    !Number.isInteger(departing.role) ||
    departing.role < 0 ||
    departing.role >= fleetLength
  ) {
    return {
      ok: false,
      code: 'invalid-captain-role',
      message: `Companion ${sailorId} has an invalid captain role.`,
    };
  }

  const replacement = remaining.find(({ role }) => role === null);
  if (replacement) {
    replacement.role = departing.role;
    return { ok: true, mates: remaining };
  }

  if (
    remaining.some(
      (mate) => mate.sailorId === RELIEF_CAPTAIN_SAILOR_ID,
    )
  ) {
    return {
      ok: false,
      code: 'relief-captain-unavailable',
      message: 'The relief captain is already assigned.',
    };
  }

  remaining.push({
    sailorId: RELIEF_CAPTAIN_SAILOR_ID,
    role: departing.role,
  });
  return { ok: true, mates: remaining };
};

export const applyCompanionDeparture = (
  target: Pick<State, 'mates'>,
  plan: Extract<CompanionDeparturePlan, { ok: true }>,
): void => {
  Object.assign(target, {
    mates: plan.mates.map((mate) => ({ ...mate })),
  });
};
