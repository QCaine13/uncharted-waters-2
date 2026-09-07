import { createDuel, advanceDuel } from './duel';
import { encounterCatalog } from './encounters';
import type {
  CombatLogRecord,
  DuelCombatantStats,
  NavalAction,
  NavalRange,
  NavalState,
  PlayerNavalForce,
} from './types';

export interface CreateNavalParams {
  encounterId: string;
  player: PlayerNavalForce;
  playerDuel: DuelCombatantStats;
}

const appendLog = (
  log: readonly CombatLogRecord[],
  record: CombatLogRecord,
): CombatLogRecord[] => [...log, record].slice(-8);

export const createNaval = ({
  encounterId,
  player,
  playerDuel,
}: CreateNavalParams): NavalState => ({
  kind: 'naval',
  encounterId,
  revision: 0,
  round: 1,
  outcome: null,
  log: [],
  player: { ...player },
  enemy: { ...encounterCatalog['joao.m2.katarina'].enemy },
  range: 2,
  playerDuel: { ...playerDuel },
  boardingDuel: null,
});

const resolvedOutcome = (state: NavalState): NavalState['outcome'] => {
  if (state.player.hull === 0 || state.player.crew === 0) return 'defeat';
  if (state.enemy.hull === 0 || state.enemy.crew === 0) return 'victory';
  return null;
};

const withEnemyResponse = (state: NavalState): NavalState => {
  if (resolvedOutcome(state))
    return { ...state, outcome: resolvedOutcome(state) };
  const player = { ...state.player };
  let { range } = state;
  let response = 'none';
  let damage = 0;
  if (range === 1 || range === 2) {
    damage = 4;
    player.hull = Math.max(0, player.hull - damage);
    response = 'fire';
  } else if (range === 0) {
    damage = 3;
    player.crew = Math.max(0, player.crew - damage);
    response = 'board';
  } else {
    range = 2;
    response = 'approach';
  }
  const next = { ...state, player, range };
  return {
    ...next,
    outcome: resolvedOutcome(next),
    log: appendLog(next.log, {
      key: 'combat.naval.enemy-response',
      data: { round: state.round, response, damage, range },
    }),
  };
};

const finishChallenge = (
  state: NavalState,
  incrementRevision = true,
): NavalState => {
  const duelOutcome = state.boardingDuel?.outcome;
  if (!duelOutcome) return state;
  let outcome: NavalState['outcome'] = null;
  if (duelOutcome === 'victory') outcome = 'victory';
  if (duelOutcome === 'defeat') outcome = 'defeat';
  return {
    ...state,
    revision: state.revision + (incrementRevision ? 1 : 0),
    outcome,
    range: 0,
    boardingDuel: null,
    log: appendLog(state.log, {
      key: 'combat.naval.challenge-result',
      data: { duelOutcome },
    }),
  };
};

export const advanceNaval = (
  state: NavalState,
  action: NavalAction,
): NavalState => {
  if (state.outcome !== null) return state;

  if (state.boardingDuel) {
    if (action.type === 'resolveChallenge') return finishChallenge(state);
    if (action.type !== 'duel') return state;
    const duel = advanceDuel(state.boardingDuel, action.action);
    if (duel === state.boardingDuel) return state;
    const advanced = {
      ...state,
      revision: state.revision + 1,
      boardingDuel: duel,
    };
    return duel.outcome ? finishChallenge(advanced, false) : advanced;
  }

  if (action.type === 'resolveChallenge' || action.type === 'duel')
    return state;

  if (action.type === 'retreat') {
    if (state.range !== 3) return state;
    return {
      ...state,
      revision: state.revision + 1,
      outcome: 'retreat',
      log: appendLog(state.log, {
        key: 'combat.naval.retreat',
        data: { round: state.round, range: state.range },
      }),
    };
  }

  if (action.type === 'challenge') {
    if (state.range !== 0 || state.player.crew < state.enemy.crew) return state;
    return {
      ...state,
      revision: state.revision + 1,
      boardingDuel: createDuel({
        encounterId: 'joao.m2.katarina',
        player: state.playerDuel,
        enemy: encounterCatalog['joao.m2.katarina'].captain,
      }),
      log: appendLog(state.log, {
        key: 'combat.naval.challenge',
        data: { round: state.round },
      }),
    };
  }

  let next: NavalState;
  const actionData: Record<string, string | number | boolean | null> = {
    round: state.round,
    rangeBefore: state.range,
  };
  if (action.type === 'approach') {
    if (state.range === 0) return state;
    next = { ...state, range: (state.range - 1) as NavalRange };
  } else if (action.type === 'withdraw') {
    if (state.range === 3) return state;
    next = { ...state, range: (state.range + 1) as NavalRange };
  } else if (action.type === 'fire') {
    if (state.player.guns <= 0 || state.player.shot <= 0 || state.range > 2) {
      return state;
    }
    const cannonDamage = 6 + Math.floor(state.player.guns / 4);
    actionData.shotCost = 1;
    actionData.damage = cannonDamage;
    next = {
      ...state,
      player: { ...state.player, shot: state.player.shot - 1 },
      enemy: {
        ...state.enemy,
        hull: Math.max(0, state.enemy.hull - cannonDamage),
      },
    };
  } else if (action.type === 'board') {
    if (state.range !== 0 || state.player.crew <= 0) return state;
    const enemyLoss = Math.max(2, Math.floor(state.player.crew / 3));
    const playerLoss = Math.max(1, Math.floor(state.enemy.crew / 5));
    actionData.enemyCrewLoss = enemyLoss;
    actionData.playerCrewLoss = playerLoss;
    next = {
      ...state,
      player: {
        ...state.player,
        crew: Math.max(0, state.player.crew - playerLoss),
      },
      enemy: {
        ...state.enemy,
        crew: Math.max(0, state.enemy.crew - enemyLoss),
      },
    };
  } else {
    if (
      action.type !== 'repair' ||
      state.player.lumber <= 0 ||
      state.player.hull >= state.player.maxHull
    ) {
      return state;
    }
    next = {
      ...state,
      player: {
        ...state.player,
        lumber: state.player.lumber - 1,
        hull:
          state.player.hull +
          Math.min(8, state.player.maxHull - state.player.hull),
      },
    };
    actionData.lumberCost = 1;
    actionData.hullRestored = next.player.hull - state.player.hull;
  }

  actionData.rangeAfter = next.range;

  const changed = {
    ...next,
    revision: state.revision + 1,
    round: state.round + 1,
    player: { ...next.player },
    enemy: { ...next.enemy },
    playerDuel: { ...next.playerDuel },
    log: appendLog(next.log, {
      key: `combat.naval.${action.type}`,
      data: actionData,
    }),
  };

  if (action.type === 'withdraw' && changed.range === 3) {
    return { ...changed, outcome: resolvedOutcome(changed) };
  }
  return withEnemyResponse(changed);
};
