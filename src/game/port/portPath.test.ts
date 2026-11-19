import createPortPath, { findPath, resolveClickTarget } from './portPath';
import { Position } from '../../types';

const bounds = { columns: 96, rows: 96 };
const open = () => false;

describe('findPath', () => {
  it('finds a straight line', () => {
    expect(findPath({ x: 4, y: 4 }, { x: 4, y: 8 }, open, bounds)).toEqual([
      's',
      's',
      's',
      's',
    ]);
  });

  it('returns [] when start equals goal', () => {
    expect(findPath({ x: 4, y: 4 }, { x: 4, y: 4 }, open, bounds)).toEqual([]);
  });

  it('detours around a wall', () => {
    // Vertical wall at x=6 for y <= 9, gap at y=10.
    const isBlocked = ({ x, y }: Position) => x === 6 && y <= 9;

    const path = findPath({ x: 5, y: 5 }, { x: 7, y: 5 }, isBlocked, bounds);

    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(2);

    // Replay and confirm every step is unblocked and reaches the goal.
    const position = { x: 5, y: 5 };
    const deltas = {
      n: { x: 0, y: -1 },
      e: { x: 1, y: 0 },
      s: { x: 0, y: 1 },
      w: { x: -1, y: 0 },
    } as const;

    let crossedAtGap = false;
    path!.forEach((direction) => {
      const { x, y } = deltas[direction];
      position.x += x;
      position.y += y;
      expect(isBlocked(position)).toBe(false);
      if (position.x === 6 && position.y === 10) {
        crossedAtGap = true;
      }
    });

    expect(position).toEqual({ x: 7, y: 5 });
    expect(crossedAtGap).toBe(true);
  });

  it('returns null for an unreachable goal', () => {
    // Goal fully enclosed.
    const isBlocked = ({ x, y }: Position) =>
      Math.abs(x - 10) <= 1 && Math.abs(y - 10) <= 1 && !(x === 10 && y === 10);

    expect(
      findPath({ x: 5, y: 5 }, { x: 10, y: 10 }, isBlocked, bounds),
    ).toBeNull();
  });

  it('returns null when the goal itself is blocked', () => {
    const isBlocked = ({ x, y }: Position) => x === 8 && y === 8;

    expect(
      findPath({ x: 5, y: 5 }, { x: 8, y: 8 }, isBlocked, bounds),
    ).toBeNull();
  });

  it('respects bounds', () => {
    expect(findPath({ x: 0, y: 0 }, { x: -1, y: 0 }, open, bounds)).toBeNull();
  });

  it('works with a 2x2-footprint style blocked predicate', () => {
    // Mimics map.collisionAt: blocked when either tile of the bottom row
    // of the footprint is a wall tile (x in [20..22] at any y).
    const wallTiles = new Set(['20,30', '21,30', '22,30']);
    const isBlocked = ({ x, y }: Position) =>
      wallTiles.has(`${x},${y + 1}`) || wallTiles.has(`${x + 1},${y + 1}`);

    // From above the wall row to below it, footprint must route around
    // x=20..22 (bottom row y+1 = 30 blocked for x in [19..23]).
    const path = findPath(
      { x: 21, y: 28 },
      { x: 21, y: 32 },
      isBlocked,
      bounds,
    );

    expect(path).not.toBeNull();

    const position = { x: 21, y: 28 };
    const deltas = {
      n: { x: 0, y: -1 },
      e: { x: 1, y: 0 },
      s: { x: 0, y: 1 },
      w: { x: -1, y: 0 },
    } as const;

    path!.forEach((direction) => {
      const { x, y } = deltas[direction];
      position.x += x;
      position.y += y;
      expect(isBlocked(position)).toBe(false);
    });

    expect(position).toEqual({ x: 21, y: 32 });
  });
});

describe('resolveClickTarget', () => {
  const noBuildings: Position[] = [];

  it('places the player feet on the clicked tile', () => {
    expect(
      resolveClickTarget(
        { x: 10, y: 10 },
        {
          buildings: noBuildings,
          isBlocked: open,
          bounds,
        },
      ),
    ).toEqual({ x: 10, y: 9 });
  });

  it('falls back to x-1 when the primary target is blocked', () => {
    const isBlocked = ({ x, y }: Position) => x === 10 && y === 9;

    expect(
      resolveClickTarget(
        { x: 10, y: 10 },
        {
          buildings: noBuildings,
          isBlocked,
          bounds,
        },
      ),
    ).toEqual({ x: 9, y: 9 });
  });

  it('snaps to a building within Chebyshev distance 3', () => {
    const building = { x: 12, y: 8 };

    expect(
      resolveClickTarget(
        { x: 10, y: 10 },
        {
          buildings: [building],
          isBlocked: open,
          bounds,
        },
      ),
    ).toEqual(building);
  });

  it('ignores a building further than 3 tiles away', () => {
    const isBlocked = ({ x, y }: Position) => x === 10 && y === 9;

    expect(
      resolveClickTarget(
        { x: 10, y: 10 },
        {
          buildings: [{ x: 16, y: 10 }],
          isBlocked,
          bounds,
        },
      ),
    ).toEqual({ x: 9, y: 9 });
  });

  it('snaps a fully blocked goal to the nearest walkable position', () => {
    // Both feet candidates blocked; ring search must find a walkable tile.
    const isBlocked = ({ x, y }: Position) => y === 9 && (x === 9 || x === 10);

    const target = resolveClickTarget(
      { x: 10, y: 10 },
      {
        buildings: noBuildings,
        isBlocked,
        bounds,
      },
    );

    expect(target).not.toBeNull();
    expect(isBlocked(target!)).toBe(false);
    expect(
      Math.max(Math.abs(target!.x - 10), Math.abs(target!.y - 9)),
    ).toBeLessThanOrEqual(3);
  });

  it('returns null when nothing within radius 3 is walkable', () => {
    const isBlocked = ({ x, y }: Position) =>
      Math.abs(x - 10) <= 4 && Math.abs(y - 9) <= 4;

    expect(
      resolveClickTarget(
        { x: 10, y: 10 },
        {
          buildings: noBuildings,
          isBlocked,
          bounds,
        },
      ),
    ).toBeNull();
  });
});

describe('portPath controller', () => {
  it('walks the player to the goal step by step', () => {
    const path = createPortPath({ isBlocked: open, bounds });
    path.setGoal({ x: 5, y: 5 });

    const position = { x: 3, y: 5 };
    const steps: string[] = [];

    for (let i = 0; i < 5 && path.goal(); i += 1) {
      const direction = path.nextDirection(position, () => false);
      if (direction === '') {
        break;
      }
      steps.push(direction);
      if (direction === 'e') position.x += 1;
    }

    expect(steps).toEqual(['e', 'e']);
    expect(path.goal()).toBeNull();
  });

  it('waits when the next step is blocked dynamically, then re-plans once', () => {
    // Wall everywhere except a corridor; dynamic blocker on the only route.
    const path = createPortPath({ isBlocked: open, bounds });
    path.setGoal({ x: 5, y: 5 });

    const blocker = ({ x, y }: Position) => x === 4 && y === 5;

    // 10 blocked ticks trigger a re-plan treating that tile as blocked.
    for (let i = 0; i < 10; i += 1) {
      expect(path.nextDirection({ x: 3, y: 5 }, blocker)).toBe('');
    }

    // The re-planned path resumes via another route.
    expect(path.nextDirection({ x: 3, y: 5 }, blocker)).not.toBe('');
  });
});
