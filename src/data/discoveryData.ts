// Geographic discovery landmarks (design:
// docs/superpowers/specs/2026-08-14-discovery-mvp-design.md). Data and pure
// detection live together here, mirroring marketGoodsData.ts colocating its
// table with the functions that read it — there's no reusable engine
// underneath this one worth splitting out the way marketPricing.ts is.

import { Position } from '../types';
import { WORLD_MAP_COLUMNS } from '../constants';

export interface Landmark {
  id: string;
  name: string;
  // Documentation only (design spec section 3.1, revised 2026-08-14) — does
  // NOT drive placement. The first version of this file anchored position to
  // this port with a hand-written compass offset; ten of fourteen landmarks
  // ended up more than 45 units from their true position that way, and
  // strait-of-magellan landed in the Arctic. Real latitude/longitude below
  // is the only source of truth for position now.
  referencePort: string;
  latitude: number;
  longitude: number;
  position: Position;
  radius: number;
  fame: number;
  gold: number;
}

/*
  Equirectangular projection onto the world map (design spec section 3.1).

  Longitude is NOT fitted: the map is WORLD_MAP_COLUMNS wide and spans a full
  360°, so the scale is exactly 2160 / 360 = 6 units per degree. An earlier
  least-squares fit over Atlantic and Indian Ocean ports produced 6.217, which
  put every Pacific port tens of units east of where it really is — the
  telltale being that those residuals were all negative. Taking the scale from
  the map itself instead lowers the mean error over 29 ports from 14.3 to 11.5
  units and the worst Pacific error from 41 to 28. Only the intercept is
  fitted (median offset, 898.0).

  Latitude IS fitted, because the map is cropped rather than a full ±90°:
  y = 0 sits near 87.6°N and y = 1080 near 60°S. Mean error 10.7 units.

  The wrap uses WORLD_MAP_COLUMNS directly rather than a local copy, so it can
  never drift from the value getXWrapAround() enforces on real fleet
  positions. Longitudes far enough west to project below x = 0 (bering-strait
  at -169° is the only live case) wrap by exactly one map width; the raw
  formula's range over [-180, 180] is [-182, 1978], so a single conditional
  addition always lands inside [0, WORLD_MAP_COLUMNS).
*/
export const MAP_WIDTH = WORLD_MAP_COLUMNS;

// Exported so tests can independently confirm which landmarks actually
// exercise the wrap branch below, without duplicating these two literals.
export const rawProjectedX = (longitude: number): number =>
  6.0 * longitude + 898.0;

export const project = (latitude: number, longitude: number): Position => {
  const rawX = rawProjectedX(longitude);

  return {
    x: rawX < 0 ? rawX + MAP_WIDTH : rawX,
    y: -7.316 * latitude + 640.9,
  };
};

/*
  Tunnelling hazard (design spec section 4.2): world.ts's loop calls
  worldTimeTick() and characters.update() under the same "PercentNextMove
  has reached zero" gate, so exactly one worldPlayer.move() happens between
  any two consecutive worldTimeTick() calls — the discovery radius has to
  clear half of that single move's worst-case displacement, or a
  fast-moving fleet can step clean over a landmark between two detection
  reads without ever registering as "inside" it.

  Deriving that displacement from the real movement code:
    - getShipSpeed (game/world/shipSpeed.ts) caps baseSpeed at 30, and the
      tacking-into-headwind factor never exceeds 1, so speed maxes out at
      baseSpeed * 1 * seamanship/75. Seamanship is a 0-100 stat (see
      sailorData.ts's stats), so that ceiling is 30 * 100/75 = 40 — exactly
      what shipSpeed.test.ts's "is capped at 40" pins down independently.
    - worldPlayer.ts's move() turns speed into a position delta of
      speed/40 world units per call for both cardinal headings (multiplier
      = speed/40) and diagonal ones (multiplier = speed/40/Math.SQRT2 on
      each of two chained axis moves, which recombines to the same
      speed/40 magnitude). At the speed ceiling of 40 that's exactly 1.
  So the worst case is a fleet covering MAX_PER_TICK_DISPLACEMENT world
  units between two consecutive worldTimeTick() calls.
*/
export const MAX_PER_TICK_DISPLACEMENT = 1;

// Comfortably above half of MAX_PER_TICK_DISPLACEMENT (0.5) — a 10x margin,
// not a value sitting right on the boundary that a rounding difference
// could undermine.
export const DEFAULT_DISCOVERY_RADIUS = 5;

type LandmarkSeed = Omit<Landmark, 'position'>;

// Fourteen entries, real Age-of-Exploration geography. Latitude is positive
// north, longitude positive east — real-world ground truth (design spec
// section 3.2); position is never hand-written, only ever produced by
// project() below. Fame scales with how far and how hard the voyage from
// established trade routes is.
const landmarkSeeds: LandmarkSeed[] = [
  {
    id: 'strait-of-gibraltar',
    name: 'Strait of Gibraltar',
    referencePort: 'Ceuta',
    latitude: 35.95,
    longitude: -5.6,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 30,
    gold: 300,
  },
  {
    id: 'azores',
    name: 'The Azores',
    referencePort: 'Santa Cruz',
    latitude: 37.8,
    longitude: -25.5,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 50,
    gold: 500,
  },
  {
    id: 'cape-bojador',
    name: 'Cape Bojador',
    referencePort: 'Argin',
    latitude: 26.13,
    longitude: -14.5,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 60,
    gold: 600,
  },
  {
    id: 'cape-verde',
    name: 'Cape Verde',
    referencePort: 'Bissau',
    latitude: 14.7,
    longitude: -17.5,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 60,
    gold: 600,
  },
  {
    id: 'cape-sao-roque',
    name: 'Cape São Roque',
    referencePort: 'Pernambuco',
    latitude: -5.47,
    longitude: -35.26,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 70,
    gold: 700,
  },
  {
    id: 'bab-el-mandeb',
    name: 'Bab-el-Mandeb',
    referencePort: 'Aden',
    latitude: 12.58,
    longitude: 43.33,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 80,
    gold: 800,
  },
  {
    id: 'strait-of-hormuz',
    name: 'Strait of Hormuz',
    referencePort: 'Hormuz',
    latitude: 26.57,
    longitude: 56.25,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 80,
    gold: 800,
  },
  {
    id: 'mouth-of-the-amazon',
    name: 'Mouth of the Amazon',
    referencePort: 'Cayenne',
    latitude: -0.5,
    longitude: -50.0,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 90,
    gold: 900,
  },
  {
    id: 'cape-comorin',
    name: 'Cape Comorin',
    referencePort: 'Cochin',
    latitude: 8.08,
    longitude: 77.55,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 90,
    gold: 900,
  },
  {
    id: 'strait-of-malacca',
    name: 'Strait of Malacca',
    referencePort: 'Malacca',
    latitude: 2.5,
    longitude: 101.0,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 100,
    gold: 1000,
  },
  {
    id: 'galapagos-islands',
    name: 'The Galápagos Islands',
    referencePort: 'Callao',
    latitude: -0.5,
    longitude: -90.5,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 120,
    gold: 1200,
  },
  {
    id: 'cape-of-good-hope',
    name: 'Cape of Good Hope',
    referencePort: 'Cape Town',
    latitude: -34.36,
    longitude: 18.47,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 150,
    gold: 1500,
  },
  {
    id: 'bering-strait',
    name: 'The Bering Strait',
    referencePort: 'Nome',
    latitude: 65.8,
    longitude: -169.0,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 200,
    gold: 2000,
  },
  {
    // Nearest port changed from Forel to Valparaiso in the 2026-08-14
    // revision — Forel is Arctic (alongside Bergen and Oslo on this map)
    // and was an error in the first version of this table.
    id: 'strait-of-magellan',
    name: 'Strait of Magellan',
    referencePort: 'Valparaiso',
    latitude: -53.5,
    longitude: -70.5,
    radius: DEFAULT_DISCOVERY_RADIUS,
    fame: 200,
    gold: 2000,
  },
];

export const landmarks: Landmark[] = landmarkSeeds.map((seed) => ({
  ...seed,
  position: project(seed.latitude, seed.longitude),
}));

const distanceBetween = (a: Position, b: Position): number =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

// Pure (design spec section 7): no `state` import. `candidates` defaults to
// the real roster above so production callers only ever pass the first two
// arguments; tests inject a synthetic list to exercise cases — like two
// overlapping radii — the real, non-overlapping roster can't produce.
export const getNewlyDiscoveredLandmarks = (
  position: Position,
  discoveredIds: readonly string[],
  candidates: readonly Landmark[] = landmarks,
): Landmark[] =>
  candidates.filter(
    (landmark) =>
      !discoveredIds.includes(landmark.id) &&
      distanceBetween(position, landmark.position) <= landmark.radius,
  );
