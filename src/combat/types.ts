export type CombatOutcome = 'victory' | 'defeat' | 'draw' | 'retreat';

export type DuelAttack = 'thrust' | 'slash' | 'heavy';
export type DuelDefense = 'parry' | 'block' | 'dodge';
export type WeaponCategory = '1' | '2' | '3' | '4' | null;

export interface Equipment {
  weaponId: string | null;
  armorId: string | null;
}

export type MateProgress = Record<string, { battleExperience: number }>;

export interface CombatLogRecord {
  key: string;
  data: Record<string, string | number | boolean | null>;
}

interface CombatStateBase {
  encounterId: string;
  revision: number;
  round: number;
  outcome: CombatOutcome | null;
  log: CombatLogRecord[];
}

export interface DuelCombatantStats {
  swordplay: number;
  level: number;
  weaponRating: number;
  armorRating: number;
  weaponCategory: WeaponCategory;
}

export interface DuelCombatant {
  stats: DuelCombatantStats;
  hp: number;
  maxHp: number;
}

export interface DuelState extends CombatStateBase {
  kind: 'duel';
  phase: 'attack' | 'defend';
  player: DuelCombatant;
  enemy: DuelCombatant;
  enemyDefense: DuelDefense;
  enemyAttack: DuelAttack;
}

export type DuelAction =
  | { type: 'attack'; attack: DuelAttack }
  | { type: 'defend'; defense: DuelDefense };

export interface NavalForce {
  hull: number;
  maxHull: number;
  crew: number;
  guns: number;
}

export interface PlayerNavalForce extends NavalForce {
  shot: number;
  lumber: number;
}

export type NavalRange = 0 | 1 | 2 | 3;

export interface NavalState extends CombatStateBase {
  kind: 'naval';
  player: PlayerNavalForce;
  enemy: NavalForce;
  range: NavalRange;
  playerDuel: DuelCombatantStats;
  boardingDuel: DuelState | null;
}

export type NavalAction =
  | { type: 'approach' }
  | { type: 'withdraw' }
  | { type: 'fire' }
  | { type: 'board' }
  | { type: 'repair' }
  | { type: 'retreat' }
  | { type: 'challenge' }
  | { type: 'duel'; action: DuelAction }
  | { type: 'resolveChallenge' };

export type CombatState = DuelState | NavalState;

export const combatOutcomes: readonly CombatOutcome[] = [
  'victory',
  'defeat',
  'draw',
  'retreat',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNonNegative = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isNonNegativeInteger = (value: unknown): value is number =>
  isFiniteNonNegative(value) && Number.isInteger(value);

const isStats = (value: unknown): value is DuelCombatantStats => {
  if (!isRecord(value)) return false;
  return (
    isFiniteNonNegative(value.swordplay) &&
    isFiniteNonNegative(value.level) &&
    isFiniteNonNegative(value.weaponRating) &&
    isFiniteNonNegative(value.armorRating) &&
    (value.weaponCategory === null ||
      ['1', '2', '3', '4'].includes(String(value.weaponCategory)))
  );
};

const isCombatant = (value: unknown): value is DuelCombatant => {
  if (!isRecord(value)) return false;
  return (
    isStats(value.stats) &&
    isFiniteNonNegative(value.hp) &&
    isFiniteNonNegative(value.maxHp) &&
    value.hp <= value.maxHp
  );
};

const isLog = (value: unknown): value is CombatLogRecord[] =>
  Array.isArray(value) &&
  value.length <= 8 &&
  value.every(
    (entry) =>
      isRecord(entry) &&
      typeof entry.key === 'string' &&
      isRecord(entry.data) &&
      Object.values(entry.data).every(
        (datum) =>
          datum === null ||
          typeof datum === 'string' ||
          typeof datum === 'number' ||
          typeof datum === 'boolean',
      ),
  );

const hasValidBase = (value: Record<string, unknown>): boolean =>
  typeof value.encounterId === 'string' &&
  isNonNegativeInteger(value.revision) &&
  isNonNegativeInteger(value.round) &&
  value.round >= 1 &&
  (value.outcome === null ||
    combatOutcomes.includes(value.outcome as CombatOutcome)) &&
  isLog(value.log);

const isDuelState = (value: unknown): value is DuelState => {
  if (!isRecord(value) || value.kind !== 'duel' || !hasValidBase(value)) {
    return false;
  }
  return (
    (value.phase === 'attack' || value.phase === 'defend') &&
    isCombatant(value.player) &&
    isCombatant(value.enemy) &&
    ['parry', 'block', 'dodge'].includes(String(value.enemyDefense)) &&
    ['thrust', 'slash', 'heavy'].includes(String(value.enemyAttack))
  );
};

const isNavalForce = (value: unknown, player: boolean): boolean => {
  if (!isRecord(value)) return false;
  const base =
    isFiniteNonNegative(value.hull) &&
    isFiniteNonNegative(value.maxHull) &&
    value.hull <= value.maxHull &&
    isFiniteNonNegative(value.crew) &&
    isFiniteNonNegative(value.guns);
  return (
    base &&
    (!player ||
      (isFiniteNonNegative(value.shot) && isFiniteNonNegative(value.lumber)))
  );
};

export const isCombatState = (value: unknown): value is CombatState => {
  if (!isRecord(value)) return false;
  if (value.kind === 'duel') return isDuelState(value);
  if (value.kind !== 'naval' || !hasValidBase(value)) return false;
  return (
    isNavalForce(value.player, true) &&
    isNavalForce(value.enemy, false) &&
    [0, 1, 2, 3].includes(value.range as number) &&
    isStats(value.playerDuel) &&
    (value.boardingDuel === null || isDuelState(value.boardingDuel))
  );
};
