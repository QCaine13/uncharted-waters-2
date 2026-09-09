import type {
  CombatLogRecord,
  DuelAction,
  DuelAttack,
  DuelCombatant,
  DuelCombatantStats,
  DuelDefense,
  DuelState,
} from './types';

export interface CreateDuelParams {
  encounterId: string;
  player: DuelCombatantStats;
  enemy: DuelCombatantStats;
}

const defenses: readonly DuelDefense[] = ['parry', 'block', 'dodge'];
const attacks: readonly DuelAttack[] = ['thrust', 'slash', 'heavy'];
const matchingDefense: Record<DuelAttack, DuelDefense> = {
  thrust: 'parry',
  slash: 'block',
  heavy: 'dodge',
};

const intentForRound = (round: number) => ({
  enemyDefense: defenses[(round - 1) % defenses.length],
  enemyAttack: attacks[(round - 1) % attacks.length],
});

const combatant = (stats: DuelCombatantStats): DuelCombatant => {
  const maxHp = 80 + 2 * stats.level;
  return { stats: { ...stats }, hp: maxHp, maxHp };
};

const appendLog = (
  log: readonly CombatLogRecord[],
  record: CombatLogRecord,
): CombatLogRecord[] => [...log, record].slice(-8);

const preferredAttack = (
  attack: DuelAttack,
  category: DuelCombatantStats['weaponCategory'],
): boolean =>
  (category === '2' && attack === 'thrust') ||
  ((category === '1' || category === '3') && attack === 'slash') ||
  (category === '4' && attack === 'heavy');

const damage = (
  attacker: DuelCombatantStats,
  defender: DuelCombatantStats,
  attack: DuelAttack,
): number => {
  const power =
    8 +
    Math.floor(attacker.swordplay / 12) +
    Math.floor(attacker.weaponRating / 4) +
    Math.floor(attacker.level / 3);
  const preference = preferredAttack(attack, attacker.weaponCategory)
    ? 1.25
    : 1;
  return Math.max(
    1,
    Math.floor(power * preference) - Math.floor(defender.armorRating / 5),
  );
};

export const createDuel = ({
  encounterId,
  player,
  enemy,
}: CreateDuelParams): DuelState => ({
  kind: 'duel',
  encounterId,
  revision: 0,
  round: 1,
  outcome: null,
  log: [],
  phase: 'attack',
  player: combatant(player),
  enemy: combatant(enemy),
  ...intentForRound(1),
});

export const advanceDuel = (
  state: DuelState,
  action: DuelAction,
): DuelState => {
  if (state.outcome !== null) return state;

  if (state.phase === 'attack') {
    if (action.type !== 'attack' || !attacks.includes(action.attack))
      return state;
    const blocked = matchingDefense[action.attack] === state.enemyDefense;
    const dealt = blocked
      ? 0
      : damage(state.player.stats, state.enemy.stats, action.attack);
    const enemyHp = Math.max(0, state.enemy.hp - dealt);
    const outcome = enemyHp === 0 ? 'victory' : null;
    return {
      ...state,
      revision: state.revision + 1,
      phase: outcome ? state.phase : 'defend',
      outcome,
      player: { ...state.player, stats: { ...state.player.stats } },
      enemy: { ...state.enemy, stats: { ...state.enemy.stats }, hp: enemyHp },
      log: appendLog(state.log, {
        key: 'combat.duel.attack',
        data: {
          round: state.round,
          attack: action.attack,
          enemyDefense: state.enemyDefense,
          damage: dealt,
        },
      }),
    };
  }

  if (action.type !== 'defend' || !defenses.includes(action.defense))
    return state;
  const blocked = matchingDefense[state.enemyAttack] === action.defense;
  const received = blocked
    ? 0
    : damage(state.enemy.stats, state.player.stats, state.enemyAttack);
  const playerHp = Math.max(0, state.player.hp - received);
  const defeated = playerHp === 0;
  const drawn = !defeated && state.round === 10;
  let outcome: DuelState['outcome'] = null;
  if (defeated) outcome = 'defeat';
  if (drawn) outcome = 'draw';
  const nextRound = outcome ? state.round : state.round + 1;
  return {
    ...state,
    revision: state.revision + 1,
    round: nextRound,
    phase: outcome ? state.phase : 'attack',
    outcome,
    player: { ...state.player, stats: { ...state.player.stats }, hp: playerHp },
    enemy: { ...state.enemy, stats: { ...state.enemy.stats } },
    ...intentForRound(nextRound),
    log: appendLog(state.log, {
      key: 'combat.duel.defend',
      data: {
        round: state.round,
        defense: action.defense,
        enemyAttack: state.enemyAttack,
        damage: received,
      },
    }),
  };
};
