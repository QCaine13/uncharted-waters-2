import { CardinalDirection, Direction, OrdinalDirection } from './types';
import { isInteractiveTextTarget } from './localization/dom';

type Wasd = 'w' | 'a' | 's' | 'd';

const cardinalKeyMap: { [key in Wasd]: CardinalDirection } = {
  w: 'n',
  d: 'e',
  s: 's',
  a: 'w',
};

const ordinalKeyMap: {
  [key: string]: {
    [key: string]: OrdinalDirection;
  };
} = {
  w: {
    d: 'ne',
    a: 'nw',
  },
  s: {
    d: 'se',
    a: 'sw',
  },
};

export const directionMap: { [key in Direction | '']: number } = {
  n: 0,
  ne: 1,
  e: 2,
  se: 3,
  s: 4,
  sw: 5,
  w: 6,
  nw: 7,
  '': 8,
};

const isWasd = (key: string): key is Wasd => key in cardinalKeyMap;

let pressedWasd: Wasd[] = [];
type Suspension = 'story' | 'overlay';
const suspensions = new Map<symbol, Suspension>();
const suppressedUntilRelease = new Set<string>();

let pressedE = false;

const PRESSED_E_TIME_MARGIN = 250;
let pressedETimeoutId: number;

const onKeydown = (e: KeyboardEvent) => {
  if (isInteractiveTextTarget(e.target)) return;
  const pressedKey = e.key.toLowerCase();

  if (suspensions.size > 0) {
    suppressedUntilRelease.add(pressedKey);
    return;
  }

  if (isWasd(pressedKey) && !pressedWasd.includes(pressedKey)) {
    pressedWasd.unshift(pressedKey);
  }
};

const onKeyup = (e: KeyboardEvent) => {
  const pressedKey = e.key.toLowerCase();

  if (suppressedUntilRelease.delete(pressedKey) || suspensions.size > 0) return;

  if (isWasd(pressedKey)) {
    pressedWasd = pressedWasd.filter((key) => key !== pressedKey);
  }

  if (pressedKey === 'e' && !isInteractiveTextTarget(e.target)) {
    pressedE = true;

    window.clearTimeout(pressedETimeoutId);
    pressedETimeoutId = window.setTimeout(() => {
      pressedE = false;
    }, PRESSED_E_TIME_MARGIN);
  }
};

const Input = {
  isSuspended: (reason?: Suspension): boolean =>
    reason === undefined
      ? suspensions.size > 0
      : [...suspensions.values()].includes(reason),
  suspend: (reason: Suspension = 'overlay'): (() => void) => {
    const token = Symbol(reason);
    suspensions.set(token, reason);
    Input.reset();
    return () => {
      if (suspensions.delete(token)) Input.reset();
    };
  },
  setup: () => {
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('keyup', onKeyup);
  },
  getDirection: (options: { includeOrdinal: boolean }): Direction | '' => {
    if (!pressedWasd.length) {
      return '';
    }

    if (options.includeOrdinal && pressedWasd.length > 1) {
      const direction =
        ordinalKeyMap[pressedWasd[0]]?.[pressedWasd[1]] ||
        ordinalKeyMap[pressedWasd[1]]?.[pressedWasd[0]];

      if (direction) {
        return direction;
      }
    }

    return cardinalKeyMap[pressedWasd[0]];
  },
  getPressedE: () => pressedE,
  reset: () => {
    pressedWasd = [];

    pressedE = false;

    window.clearTimeout(pressedETimeoutId);
  },
};

export default Input;
