import { CardinalDirection, directionToChanges, Position } from '../../types';

const CARDINALS: CardinalDirection[] = ['n', 'e', 's', 'w'];

const directionBetween = (from: Position, to: Position): CardinalDirection => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const direction = CARDINALS.find(
    (d) =>
      directionToChanges[d].xDelta === dx &&
      directionToChanges[d].yDelta === dy,
  );

  if (!direction) {
    throw Error(
      `Positions are not cardinally adjacent: ${JSON.stringify({ from, to })}`,
    );
  }

  return direction;
};

const keyOf = ({ x, y }: Position) => `${x},${y}`;

/*
  BFS over 4-connected player positions (the top-left tile of the 2x2
  character footprint). Returns the directions to walk, or null when the
  goal cannot be reached within the node budget.
 */
export const findPath = (
  start: Position,
  goal: Position,
  isBlocked: (p: Position) => boolean,
  bounds: { columns: number; rows: number },
): CardinalDirection[] | null => {
  if (start.x === goal.x && start.y === goal.y) {
    return [];
  }

  if (isBlocked(goal)) {
    return null;
  }

  const nodeBudget = bounds.columns * bounds.rows;
  const visited = new Set<string>([keyOf(start)]);
  const cameFrom = new Map<
    string,
    { position: Position; direction: CardinalDirection }
  >();
  let frontier: Position[] = [start];

  while (frontier.length) {
    const next: Position[] = [];

    for (let i = 0; i < frontier.length; i += 1) {
      const position = frontier[i];

      for (let j = 0; j < CARDINALS.length; j += 1) {
        const direction = CARDINALS[j];
        const { xDelta, yDelta } = directionToChanges[direction];
        const candidate = {
          x: position.x + xDelta,
          y: position.y + yDelta,
        };
        const key = keyOf(candidate);

        if (
          candidate.x >= 0 &&
          candidate.y >= 0 &&
          candidate.x < bounds.columns &&
          candidate.y < bounds.rows &&
          !visited.has(key)
        ) {
          // Each distinct node is seen once; blocked nodes are marked too so
          // they cannot be recounted from another neighbour.
          visited.add(key);
          if (visited.size > nodeBudget) {
            return null;
          }

          if (candidate.x === goal.x && candidate.y === goal.y) {
            const directions: CardinalDirection[] = [direction];
            let step = position;

            while (step.x !== start.x || step.y !== start.y) {
              const previous = cameFrom.get(keyOf(step))!;
              directions.unshift(previous.direction);
              step = previous.position;
            }

            return directions;
          }

          if (!isBlocked(candidate)) {
            cameFrom.set(key, { position, direction });
            next.push(candidate);
          }
        }
      }
    }

    frontier = next;
  }

  return null;
};

export interface ClickTargetOptions {
  buildings: Position[];
  isBlocked: (p: Position) => boolean;
  bounds: { columns: number; rows: number };
}

const inBounds = (p: Position, bounds: { columns: number; rows: number }) =>
  p.x >= 0 && p.y >= 0 && p.x < bounds.columns && p.y < bounds.rows;

const chebyshev = (a: Position, b: Position) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const isWalkable = (
  p: Position,
  isBlocked: (p: Position) => boolean,
  bounds: { columns: number; rows: number },
) => inBounds(p, bounds) && !isBlocked(p);

/*
  Resolves a clicked map tile to the player position (top-left of the 2x2
  footprint) to path towards.

  - A building within Chebyshev distance 3 of the clicked tile becomes the
    goal, so clicking a building walks into it.
  - Otherwise the player's feet should land on the clicked tile.
  - A blocked non-building goal snaps to the nearest walkable position
    within radius 3.
  - Returns null when nothing usable is found (the click is ignored).
 */
export const resolveClickTarget = (
  clickedTile: Position,
  { buildings, isBlocked, bounds }: ClickTargetOptions,
): Position | null => {
  let nearestBuilding: Position | null = null;
  let nearestDistance = Infinity;

  buildings.forEach((building) => {
    const distance = chebyshev(building, clickedTile);

    if (distance <= 3 && distance < nearestDistance) {
      nearestBuilding = building;
      nearestDistance = distance;
    }
  });

  if (nearestBuilding) {
    return nearestBuilding;
  }

  const feetTarget = { x: clickedTile.x, y: clickedTile.y - 1 };
  const candidates = [feetTarget, { x: feetTarget.x - 1, y: feetTarget.y }];

  const target = candidates.find((candidate) =>
    isWalkable(candidate, isBlocked, bounds),
  );

  if (target) {
    return target;
  }

  for (let radius = 1; radius <= 3; radius += 1) {
    let best: Position | null = null;
    let bestDistance = Infinity;

    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === radius) {
          const candidate = { x: feetTarget.x + dx, y: feetTarget.y + dy };

          if (isWalkable(candidate, isBlocked, bounds)) {
            const distance = Math.abs(dx) + Math.abs(dy);

            if (distance < bestDistance) {
              best = candidate;
              bestDistance = distance;
            }
          }
        }
      }
    }

    if (best) {
      return best;
    }
  }

  return null;
};

interface PortPathOptions {
  isBlocked: (p: Position) => boolean;
  bounds: { columns: number; rows: number };
}

const MAX_BLOCKED_TICKS = 10;

/*
  Holds click-to-move state for one port visit. Plans with static
  collision only; dynamic blockers (NPCs) make the player wait, then
  trigger a single re-plan treating that tile as blocked.
 */
const createPortPath = ({ isBlocked, bounds }: PortPathOptions) => {
  let goal: Position | null = null;
  let waypoints: Position[] = [];
  let extraBlocked = new Set<string>();
  let blockedTicks = 0;
  let replanned = false;

  const blockedForPlanning = (p: Position) =>
    isBlocked(p) || extraBlocked.has(keyOf(p));

  const plan = (start: Position): boolean => {
    const directions = findPath(start, goal!, blockedForPlanning, bounds);

    if (directions === null) {
      return false;
    }

    let position = { ...start };
    waypoints = directions.map((direction) => {
      const { xDelta, yDelta } = directionToChanges[direction];
      position = { x: position.x + xDelta, y: position.y + yDelta };
      return { ...position };
    });

    return true;
  };

  const cancel = () => {
    goal = null;
    waypoints = [];
    extraBlocked = new Set();
    blockedTicks = 0;
    replanned = false;
  };

  return {
    setGoal: (position: Position) => {
      cancel();
      goal = { ...position };
    },
    cancel,
    goal: () => goal,
    /*
      Returns the direction to walk this tick, or '' to wait. The caller
      must pass the live collision check (including other characters) so a
      blocked step never reaches player.move()'s slide behaviour.
     */
    nextDirection: (
      position: Position,
      isBlockedNow: (p: Position) => boolean,
    ): CardinalDirection | '' => {
      if (!goal) {
        return '';
      }

      if (!waypoints.length && !plan(position)) {
        cancel();
        return '';
      }

      if (
        waypoints.length &&
        waypoints[0].x === position.x &&
        waypoints[0].y === position.y
      ) {
        waypoints.shift();
      }

      if (!waypoints.length) {
        cancel();
        return '';
      }

      const next = waypoints[0];

      if (isBlockedNow(next)) {
        blockedTicks += 1;

        if (blockedTicks >= MAX_BLOCKED_TICKS) {
          if (replanned) {
            cancel();
            return '';
          }

          replanned = true;
          blockedTicks = 0;
          extraBlocked = new Set([keyOf(next)]);
          waypoints = [];
        }

        return '';
      }

      blockedTicks = 0;
      return directionBetween(position, next);
    },
  };
};

export type PortPath = ReturnType<typeof createPortPath>;

export default createPortPath;
