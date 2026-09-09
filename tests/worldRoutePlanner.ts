import { readFileSync } from 'fs';
import { resolve } from 'path';
import { regularPorts, supplyPorts } from '../src/data/portData';
import { portNpcData } from '../src/data/portCharactersData';
import { calculateDestination } from '../src/game/world/worldUtils';

export type PlannedDirection = 'w' | 'a' | 's' | 'd';
export type PlannedRoute = [PlannedDirection, number][];

type Position = { x: number; y: number };
type WorldRequest = {
  fromPortId?: string;
  from?: Position;
  toPortId?: string;
  to?: Position;
};
type PortRequest = {
  portId: string;
  from: Position;
  toBuildingId: string;
};
type UnblockRequest = {
  position: Position;
  axis: 'x' | 'y';
  key: PlannedDirection;
  target?: number;
};
type DockingEntryRequest = {
  position: Position;
  portId: string;
};
type WorldEscape = {
  key: PlannedDirection;
  expected: Position;
  simulatedSteps: number;
};

const WORLD_COLUMNS = 2160;
const WORLD_ROWS = 1080;
const PORT_COLUMNS = 96;
const PORT_ROWS = 96;
const PORT_AREA = PORT_COLUMNS * PORT_ROWS;
const directions: readonly [PlannedDirection, number, number][] = [
  ['w', 0, -1],
  ['d', 1, 0],
  ['s', 0, 1],
  ['a', -1, 0],
];
const directionDelta = Object.fromEntries(
  directions.map(([key, x, y]) => [key, { x, y }]),
) as Record<PlannedDirection, Position>;

const allPorts = [
  ...regularPorts.map((port, index) => ({
    ...port,
    id: `${index + 1}`,
    tilemap: index,
  })),
  ...supplyPorts.map((port, index) => ({
    ...port,
    id: `${regularPorts.length + index + 1}`,
    tilemap: regularPorts.length,
    tileset: 3,
    buildings: { '4': { x: 62, y: 54 } },
  })),
];

const worldTiles = readFileSync(
  resolve(__dirname, '../src/data/assets/worldTilemap.wasm'),
);
const portTiles = readFileSync(
  resolve(__dirname, '../src/data/assets/portTilemaps.wasm'),
);

const wrapX = (x: number) => (x + WORLD_COLUMNS) % WORLD_COLUMNS;
const worldCollision = ({ x, y }: Position) =>
  y < 0 ||
  y + 1 >= WORLD_ROWS ||
  [
    worldTiles[(y + 1) * WORLD_COLUMNS + wrapX(x)],
    worldTiles[(y + 1) * WORLD_COLUMNS + wrapX(x + 1)],
    worldTiles[y * WORLD_COLUMNS + wrapX(x)],
    worldTiles[y * WORLD_COLUMNS + wrapX(x + 1)],
  ].some((tile) => tile >= 50);

// Browser voyages retain a fractional position after docking. Horizontal
// movement from a fractional y asks the engine to validate the next row too;
// vertical movement does the same for the next column. Require that extra
// perpendicular clearance so an integer A* turn remains traversable without
// snapping the actual ship position.
const lacksFractionalClearance = (
  position: Position,
  direction: PlannedDirection,
) =>
  direction === 'a' || direction === 'd'
    ? worldCollision({ x: position.x, y: position.y + 1 })
    : worldCollision({ x: wrapX(position.x + 1), y: position.y });

const portById = (id: string) => {
  const port = allPorts.find((candidate) => candidate.id === id);
  if (!port) throw new Error(`Unknown route-planning port ${id}`);
  return port;
};

const worldAnchor = (id: string): Position => {
  const { position } = portById(id);
  const candidates = [
    { x: position.x, y: position.y - 2 },
    { x: position.x + 2, y: position.y },
    { x: position.x, y: position.y + 2 },
    { x: position.x - 2, y: position.y },
  ];
  const anchor = candidates.find((candidate) => !worldCollision(candidate));
  if (!anchor) throw new Error(`Port ${id} has no navigable world anchor`);
  return anchor;
};

class MinHeap {
  private values: [number, number][] = [];

  get length() {
    return this.values.length;
  }

  push(value: [number, number]) {
    const values = this.values;
    values.push(value);
    for (let index = values.length - 1; index > 0; ) {
      const parent = (index - 1) >> 1;
      if (values[parent][0] <= value[0]) break;
      values[index] = values[parent];
      index = parent;
      values[index] = value;
    }
  }

  pop(): [number, number] {
    const values = this.values;
    const first = values[0];
    const last = values.pop()!;
    if (values.length) {
      values[0] = last;
      for (let index = 0; ; ) {
        const left = index * 2 + 1;
        if (left >= values.length) break;
        const right = left + 1;
        const child =
          right < values.length && values[right][0] < values[left][0]
            ? right
            : left;
        if (values[index][0] <= values[child][0]) break;
        [values[index], values[child]] = [values[child], values[index]];
        index = child;
      }
    }
    return first;
  }
}

const compress = (steps: PlannedDirection[]): PlannedRoute => {
  const route: PlannedRoute = [];
  steps.forEach((direction) => {
    const last = route[route.length - 1];
    if (last?.[0] === direction) last[1] += 1;
    else route.push([direction, 1]);
  });
  return route;
};

// A* uses the shipped 2x2 collision model. A small turn cost preserves a
// shortest-ish water route while avoiding hundreds of one-tile coastline
// turns that are fragile for continuous player input.
export const planWorldRoute = ({
  fromPortId,
  from,
  toPortId,
  to,
}: WorldRequest) => {
  const rawStart = fromPortId ? worldAnchor(fromPortId) : from;
  if (!rawStart) throw new Error('World route needs a source port or position');
  const rounded = {
    x: wrapX(Math.round(rawStart.x)),
    y: Math.round(rawStart.y),
  };
  let start = !worldCollision(rounded)
    ? rounded
    : [Math.floor(rawStart.x), Math.ceil(rawStart.x)]
        .flatMap((x) =>
          [Math.floor(rawStart.y), Math.ceil(rawStart.y)].map((y) => ({
            x: wrapX(x),
            y,
          })),
        )
        .find((candidate) => !worldCollision(candidate));
  let escape: WorldEscape | undefined;
  if (!start) {
    // A legal dock can retain a fleet on an integer edge cell that the 2x2
    // route grid itself marks as blocked. Find a short ordinary heading whose
    // shipped collision response slides the fleet into an open route origin;
    // the browser executes this prefix and replans from its next visible Save.
    const escapeDirections = (['a', 's', 'd', 'w'] as const).map(
      (key) => directions.find(([candidate]) => candidate === key)!,
    );
    for (const [key, xDelta, yDelta] of escapeDirections) {
      let expected = { ...rawStart };
      for (let simulatedSteps = 1; simulatedSteps <= 8; simulatedSteps += 1) {
        expected = calculateDestination(
          expected,
          xDelta,
          yDelta,
          0.5,
          worldCollision,
        );
        const candidate = {
          x: wrapX(Math.round(expected.x)),
          y: Math.round(expected.y),
        };
        if (!worldCollision(candidate)) {
          start = candidate;
          escape = { key, expected, simulatedSteps };
          break;
        }
      }
      if (escape) break;
    }
  }
  if (!start) throw new Error('No ordinary escape from world-route source');
  const goal = toPortId ? worldAnchor(toPortId) : to;
  if (!goal || worldCollision(goal))
    throw new Error('Invalid world-route goal');
  if (escape) return { start, goal, route: [] as PlannedRoute, escape };
  const routeStart = start;
  const heuristic = (x: number, y: number) =>
    Math.min(Math.abs(x - goal.x), WORLD_COLUMNS - Math.abs(x - goal.x)) +
    Math.abs(y - goal.y);
  const endpointDistance = (position: Position, endpoint: Position) =>
    Math.min(
      Math.abs(position.x - endpoint.x),
      WORLD_COLUMNS - Math.abs(position.x - endpoint.x),
    ) + Math.abs(position.y - endpoint.y);
  const search = (allowConstrainedClearance: boolean) => {
    const stateCount = WORLD_COLUMNS * WORLD_ROWS * directions.length;
    const costs = new Float64Array(stateCount);
    costs.fill(Infinity);
    const previous = new Int32Array(stateCount);
    previous.fill(-1);
    const heap = new MinHeap();
    directions.forEach((_, direction) => {
      const state =
        (routeStart.y * WORLD_COLUMNS + routeStart.x) * 4 + direction;
      costs[state] = 0;
      heap.push([heuristic(routeStart.x, routeStart.y), state]);
    });
    let finalState = -1;
    while (heap.length) {
      const [score, state] = heap.pop();
      const cost = costs[state];
      const cell = state >> 2;
      const direction = state & 3;
      const x = cell % WORLD_COLUMNS;
      const y = Math.floor(cell / WORLD_COLUMNS);
      if (score !== cost + heuristic(x, y)) continue;
      if (x === goal.x && y === goal.y) {
        finalState = state;
        break;
      }
      directions.forEach(([, dx, dy], nextDirection) => {
        const next = { x: wrapX(x + dx), y: y + dy };
        if (worldCollision(next)) return;
        const nextState = (next.y * WORLD_COLUMNS + next.x) * 4 + nextDirection;
        const constrainedClearance = lacksFractionalClearance(
          next,
          directions[nextDirection][0],
        );
        const withinCoastalEndpoint =
          endpointDistance(next, routeStart) <= 30 ||
          endpointDistance(next, goal) <= 30;
        if (
          constrainedClearance &&
          !allowConstrainedClearance &&
          !withinCoastalEndpoint
        )
          return;
        const clearancePenalty = constrainedClearance ? 40 : 0;
        const nextCost =
          cost + 1 + (nextDirection === direction ? 0 : 8) + clearancePenalty;
        if (nextCost >= costs[nextState]) return;
        costs[nextState] = nextCost;
        previous[nextState] = state;
        heap.push([nextCost + heuristic(next.x, next.y), nextState]);
      });
    }
    return { finalState, previous };
  };
  let result = search(false);
  if (result.finalState < 0) result = search(true);
  const { finalState, previous } = result;
  if (finalState < 0)
    throw new Error(
      `No world route from ${fromPortId ?? `${rawStart.x},${rawStart.y}`}`,
    );
  const reversed: PlannedDirection[] = [];
  for (let state = finalState; previous[state] >= 0; state = previous[state])
    reversed.push(directions[state & 3][0]);
  return { start, goal, route: compress(reversed.reverse()), escape };
};

export const planWorldUnblock = ({
  position,
  axis,
  key,
  target,
}: UnblockRequest) => {
  const perpendicular: PlannedDirection[] =
    axis === 'x' ? ['w', 's'] : ['a', 'd'];
  const requested = directionDelta[key];
  const axisDelta = (from: Position) =>
    axis === 'x' ? signedWorldDelta(target!, from.x) : target! - from.y;
  const opensRequestedCourse = (from: Position) => {
    if (target === undefined) {
      const forward = calculateDestination(
        from,
        requested.x,
        requested.y,
        0.5,
        worldCollision,
      );
      const progress =
        axis === 'x'
          ? Math.abs(signedWorldDelta(forward.x, from.x))
          : Math.abs(forward.y - from.y);
      return progress > 0.01;
    }
    // A local correction is useful only if the shipped collision response can
    // carry the requested axis through to its actual waypoint. Two half-steps
    // cover each direct cell; sixteen extra half-steps provide a bounded
    // eight-cell allowance for coastal sliding beyond the direct distance.
    const forwardLimit = Math.ceil(Math.abs(axisDelta(from)) * 2) + 16;
    let forward = { ...from };
    for (let step = 0; step < forwardLimit; step += 1) {
      if (Math.abs(axisDelta(forward)) <= 0.8) return true;
      const next = calculateDestination(
        forward,
        requested.x,
        requested.y,
        0.5,
        worldCollision,
      );
      if (next.x === forward.x && next.y === forward.y) return false;
      forward = next;
    }
    return Math.abs(axisDelta(forward)) <= 0.8;
  };
  for (const correctionKey of perpendicular) {
    const correction = directionDelta[correctionKey];
    let candidate = { ...position };
    for (let steps = 1; steps <= 8; steps += 1) {
      const next = calculateDestination(
        candidate,
        correction.x,
        correction.y,
        0.5,
        worldCollision,
      );
      if (next.x === candidate.x && next.y === candidate.y) break;
      candidate = next;
      if (opensRequestedCourse(candidate))
        return { key: correctionKey, target: candidate, steps };
    }
  }
  return null;
};

export const planDockingEntry = ({ position, portId }: DockingEntryRequest) => {
  const center = portById(portId).position;
  const inDockingDiamond = (candidate: Position) => {
    const deltaX = signedWorldDelta(center.x, candidate.x);
    const deltaY = center.y - candidate.y;
    return (
      Math.abs(deltaX) <= 2 &&
      Math.abs(deltaY) <= 2 &&
      Math.abs(deltaX) + Math.abs(deltaY) <= 3
    );
  };
  for (const [key, xDelta, yDelta] of directions) {
    let candidate = { ...position };
    for (let steps = 1; steps <= 8; steps += 1) {
      const next = calculateDestination(
        candidate,
        xDelta,
        yDelta,
        0.5,
        worldCollision,
      );
      if (next.x === candidate.x && next.y === candidate.y) break;
      candidate = next;
      if (inDockingDiamond(candidate))
        return { key, expected: candidate, simulatedSteps: steps };
    }
  }
  return null;
};

const signedWorldDelta = (target: number, current: number) => {
  const direct = target - current;
  if (direct > WORLD_COLUMNS / 2) return direct - WORLD_COLUMNS;
  if (direct < -WORLD_COLUMNS / 2) return direct + WORLD_COLUMNS;
  return direct;
};

const collisionLimits: Record<
  number,
  { right: number; left: number; either: number }
> = {
  0: { right: 29, left: 34, either: 40 },
  1: { right: 21, left: 26, either: 31 },
  2: { right: 20, left: 25, either: 30 },
  3: { right: 22, left: 26, either: 31 },
  4: { right: 37, left: 42, either: 48 },
  5: { right: 32, left: 37, either: 46 },
  6: { right: 21, left: 22, either: 27 },
};

export const planPortRoute = ({ portId, from, toBuildingId }: PortRequest) => {
  const port = portById(portId);
  const buildings = port.buildings as Record<string, Position>;
  const goal = buildings[toBuildingId];
  if (!goal) throw new Error(`Port ${portId} has no building ${toBuildingId}`);
  // The runtime omits guards. Every other fixed NPC remains an immutable
  // obstacle regardless of which building the player just exited; crossing
  // one makes production choose an alternative direction and desynchronizes a
  // route modeled from requested keys.
  const stationaryNpcPositions = portNpcData.flatMap(
    ({ type, spawn, isStationary }) => {
      const building = buildings[spawn.buildingId];
      if (type === 'GUARD' || !isStationary || !building) return [];
      return [
        {
          x: building.x + spawn.offset.x,
          y: building.y + spawn.offset.y,
        },
      ];
    },
  );
  const limits = collisionLimits[port.tileset];
  const collision = ({ x, y }: Position) => {
    if (x < 0 || x + 1 >= PORT_COLUMNS || y < 0 || y + 1 >= PORT_ROWS)
      return true;
    if (
      Object.entries(port.buildings).some(
        ([buildingId, position]) =>
          buildingId !== toBuildingId && position.x === x && position.y === y,
      )
    )
      return true;
    if (
      stationaryNpcPositions.some(
        (npc) => Math.abs(x - npc.x) < 2 && Math.abs(y - npc.y) < 2,
      )
    )
      return true;
    const offset = port.tilemap * PORT_AREA;
    const left = portTiles[offset + (y + 1) * PORT_COLUMNS + x];
    const right = portTiles[offset + (y + 1) * PORT_COLUMNS + x + 1];
    return (
      left >= limits.either ||
      left >= limits.left ||
      right >= limits.either ||
      (right >= limits.right && right < limits.left)
    );
  };
  const size = PORT_COLUMNS * PORT_ROWS;
  const previous = new Int32Array(size);
  previous.fill(-2);
  const previousDirection = new Int8Array(size);
  previousDirection.fill(-1);
  const queue = new Int32Array(size);
  const startIndex = from.y * PORT_COLUMNS + from.x;
  const goalIndex = goal.y * PORT_COLUMNS + goal.x;
  previous[startIndex] = -1;
  let head = 0;
  let tail = 0;
  queue[tail++] = startIndex;
  while (head < tail && previous[goalIndex] === -2) {
    const index = queue[head++];
    const x = index % PORT_COLUMNS;
    const y = Math.floor(index / PORT_COLUMNS);
    directions.forEach(([, dx, dy], direction) => {
      const next = { x: x + dx, y: y + dy };
      const nextIndex = next.y * PORT_COLUMNS + next.x;
      if (
        nextIndex < 0 ||
        nextIndex >= size ||
        previous[nextIndex] !== -2 ||
        collision(next)
      )
        return;
      previous[nextIndex] = index;
      previousDirection[nextIndex] = direction;
      queue[tail++] = nextIndex;
    });
  }
  if (previous[goalIndex] === -2)
    throw new Error(
      `No port route at ${portId} from ${from.x},${from.y} to ${toBuildingId}`,
    );
  const reversed: PlannedDirection[] = [];
  for (let index = goalIndex; previous[index] >= 0; index = previous[index])
    reversed.push(directions[previousDirection[index]][0]);
  return { goal, route: compress(reversed.reverse()) };
};

export const routePlannerTasks = {
  planWorldRoute,
  planPortRoute,
  readBase64File: (path: string) =>
    readFileSync(resolve(process.cwd(), path)).toString('base64'),
  planWorldUnblock,
  planDockingEntry,
};
