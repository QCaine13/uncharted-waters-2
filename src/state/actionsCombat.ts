import { createDuel, advanceDuel } from '../combat/duel';
import { encounterCatalog, type CombatEncounterId } from '../combat/encounters';
import { getCombatSnapshot, notifyCombatChanged } from '../combat/combatEvents';
import { createNaval, advanceNaval } from '../combat/naval';
import { createPlayerDuelStats } from '../combat/stats';
import type {
  CombatOutcome,
  CombatState,
  DuelAction,
  NavalAction,
  NavalState,
} from '../combat/types';
import { shipData } from '../data/shipData';
import type { Cargo, Provisions, Ship } from '../game/world/fleets';
import Input from '../input';
import { positionAdjacentToPort, getMateBattleLevel } from './selectors';
import { getProvisionSummary } from './provisions';
import { save } from './saveLoad';
import state, { type State } from './state';
import updateInterface from './updateInterface';

export type CombatAction = DuelAction | NavalAction;

const hasEncounter = (encounterId: string): encounterId is CombatEncounterId =>
  Object.prototype.hasOwnProperty.call(encounterCatalog, encounterId);

const canReplay = (
  encounterId: CombatEncounterId,
  combatResults: Readonly<Record<string, CombatOutcome>>,
): boolean => {
  const outcome = combatResults[encounterId];
  if (outcome === undefined) return true;
  if (encounterId === 'joao.m2.kahn-house') return outcome === 'draw';
  if (encounterId === 'joao.m2.katarina') return outcome === 'defeat';
  return false;
};

const provisionTotal = (ship: Ship, provision: Provisions): number =>
  ship.cargo.reduce(
    (total, item) => (item.type === provision ? total + item.quantity : total),
    0,
  );

const setProvisionTotal = (
  ship: Ship,
  provision: Provisions,
  requested: number,
): Cargo[] => {
  let remaining = Math.min(requested, provisionTotal(ship, provision));
  const cargo: Cargo[] = [];

  ship.cargo.forEach((item) => {
    if (item.type !== provision) {
      cargo.push(item);
      return;
    }

    const quantity = Math.min(item.quantity, remaining);
    remaining -= quantity;
    if (quantity > 0) cargo.push({ ...item, quantity });
  });

  return cargo;
};

const getPlayerDuelStats = () =>
  createPlayerDuelStats({
    sailorId: '1',
    equipment: state.equipment,
    ownedItemIds: state.items,
    mateProgress: state.mateProgress,
  });

const createNavalState = (
  encounterId: CombatEncounterId,
): NavalState | null => {
  const flagship = state.fleets['1']?.ships[0];
  const model = flagship && shipData[flagship.id];
  const captain = state.mates.find(({ role }) => role === 0);
  if (!flagship || !model || !captain) return null;

  const levelBonus = Math.floor(getMateBattleLevel(captain.sailorId) / 10);
  const guns =
    model.usedGuns === 0
      ? 0
      : Math.min(model.maximumGuns, model.usedGuns + levelBonus);

  return createNaval({
    encounterId,
    player: {
      hull: flagship.durability,
      maxHull: model.durability,
      crew: flagship.crew,
      guns,
      shot: provisionTotal(flagship, 'shot'),
      lumber: provisionTotal(flagship, 'lumber'),
    },
    playerDuel: getPlayerDuelStats(),
  });
};

export interface CombatStartEligibility {
  activeCombat: boolean;
  overlaySuspended: boolean;
  combatResults: Readonly<Record<string, CombatOutcome>>;
  ships: ReadonlyArray<Pick<Ship, 'id'>>;
  mates: ReadonlyArray<Pick<State['mates'][number], 'role'>>;
}

export const isCombatStartEligible = (
  encounterId: string,
  eligibility: CombatStartEligibility,
): boolean => {
  if (
    eligibility.activeCombat ||
    eligibility.overlaySuspended ||
    !hasEncounter(encounterId) ||
    !canReplay(encounterId, eligibility.combatResults)
  ) {
    return false;
  }

  if (encounterCatalog[encounterId].kind === 'naval') {
    const flagship = eligibility.ships[0];
    return (
      flagship !== undefined &&
      shipData[flagship.id] !== undefined &&
      eligibility.mates.some(({ role }) => role === 0)
    );
  }
  return true;
};

type CombatRoster = Pick<CombatStartEligibility, 'ships' | 'mates'>;

export const canStartCombatWithRoster = (
  encounterId: string,
  roster: CombatRoster,
): boolean =>
  isCombatStartEligible(encounterId, {
    ...roster,
    activeCombat: state.activeCombat !== null,
    overlaySuspended: Input.isSuspended('overlay'),
    combatResults: state.combatResults,
  });

export const canStartCombat = (encounterId: string): boolean =>
  canStartCombatWithRoster(encounterId, {
    ships: state.fleets['1']?.ships ?? [],
    mates: state.mates,
  });

export const startCombatWithoutSave = (encounterId: string): boolean => {
  if (!canStartCombat(encounterId) || !hasEncounter(encounterId)) return false;
  const encounter = encounterCatalog[encounterId];

  const combat =
    encounter.kind === 'duel'
      ? createDuel({
          encounterId,
          player: getPlayerDuelStats(),
          enemy: encounter.enemy,
        })
      : createNavalState(encounterId);

  if (!combat) return false;
  state.activeCombat = combat;
  notifyCombatChanged();
  return true;
};

export const startCombat = (encounterId: string): boolean => {
  if (!startCombatWithoutSave(encounterId)) return false;
  save();
  return true;
};

const syncFlagship = (combat: NavalState): void => {
  const flagship = state.fleets['1']?.ships[0];
  if (!flagship) return;
  flagship.durability = combat.player.hull;
  flagship.crew = combat.player.crew;
  flagship.cargo = setProvisionTotal(flagship, 'shot', combat.player.shot);
  flagship.cargo = setProvisionTotal(flagship, 'lumber', combat.player.lumber);
  updateInterface.provisions?.(getProvisionSummary(state.fleets['1'].ships));
};

export const actCombat = (
  expected: CombatState,
  action: CombatAction,
): boolean => {
  const current = getCombatSnapshot();
  if (
    current === null ||
    current !== expected ||
    Input.isSuspended('overlay') ||
    current.outcome !== null
  ) {
    return false;
  }

  const next =
    current.kind === 'duel'
      ? advanceDuel(current, action as DuelAction)
      : advanceNaval(current, action as NavalAction);
  if (next === current) return false;

  state.activeCombat = next;
  if (next.kind === 'naval') syncFlagship(next);
  notifyCombatChanged();
  save();
  return true;
};

const grantExperience = (sailorId: string, amount: number): void => {
  if (!state.mates.some((mate) => mate.sailorId === sailorId)) return;
  const current = state.mateProgress[sailorId]?.battleExperience ?? 0;
  state.mateProgress[sailorId] = { battleExperience: current + amount };
};

const settleExperience = (combat: CombatState): void => {
  if (
    combat.encounterId === 'joao.m2.kahn-house' &&
    combat.outcome === 'victory'
  ) {
    grantExperience('1', 100);
  }

  if (combat.kind !== 'naval') return;
  if (combat.outcome === 'victory') {
    grantExperience('1', 100);
    new Set(state.mates.map(({ sailorId }) => sailorId)).forEach((sailorId) => {
      if (sailorId !== '1') grantExperience(sailorId, 50);
    });
  } else if (combat.outcome === 'retreat') {
    new Set(state.mates.map(({ sailorId }) => sailorId)).forEach((sailorId) =>
      grantExperience(sailorId, 25),
    );
  }
};

const recoverFromNavalDefeat = (): void => {
  const fleet = state.fleets['1'];
  const flagship = fleet?.ships[0];
  const model = flagship && shipData[flagship.id];
  if (!fleet || !flagship || !model) return;

  flagship.durability = Math.max(
    flagship.durability,
    Math.ceil(model.durability / 2),
  );
  flagship.crew = Math.max(flagship.crew, model.minimumCrew);
  fleet.position = positionAdjacentToPort('1');
  state.portId = '1';
  state.buildingId = null;
  state.dayAtSea = 0;
  state.world = undefined as unknown as State['world'];
  state.port = undefined as unknown as State['port'];

  updateInterface.general?.({
    portId: state.portId,
    buildingId: state.buildingId,
    timePassed: state.timePassed,
    gold: state.gold,
  });
  updateInterface.dayAtSea?.(0);
  updateInterface.provisions?.(getProvisionSummary(fleet.ships));
  updateInterface.discovery?.([]);
};

export const finishCombat = (expected: CombatState): boolean => {
  const current = getCombatSnapshot();
  if (
    current === null ||
    current !== expected ||
    current.outcome === null ||
    Input.isSuspended('overlay')
  ) {
    return false;
  }

  state.combatResults[current.encounterId] = current.outcome;
  settleExperience(current);
  if (current.kind === 'naval' && current.outcome === 'defeat') {
    recoverFromNavalDefeat();
  }
  state.activeCombat = null;
  notifyCombatChanged(true);
  save();
  return true;
};
