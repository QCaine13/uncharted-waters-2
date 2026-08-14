import {
  landmarks,
  getNewlyDiscoveredLandmarks,
  project,
  rawProjectedX,
  MAP_WIDTH,
  MAX_PER_TICK_DISPLACEMENT,
  Landmark,
} from './discoveryData';
import { regularPorts, supplyPorts } from './portData';
import { Position } from '../types';

const allPorts = [...regularPorts, ...supplyPorts];

const findPortPosition = (name: string): Position => {
  const port = allPorts.find((candidate) => candidate.name === name);

  if (!port) {
    throw new Error(`No port named "${name}" in portData.ts`);
  }

  return port.position;
};

const distanceBetween = (a: Position, b: Position): number =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

// Real-world latitude/longitude — external ground truth, not derived from
// anything in this repo — for a spread of unambiguous ports drawn from the
// 24 the projection was fit against (design spec section 3.1). This is
// what makes the test below meaningful: it catches the projection itself
// drifting, which an internally-consistent-only check never could.
const groundTruthPorts: { name: string; latitude: number; longitude: number }[] =
  [
    { name: 'Lisbon', latitude: 38.72, longitude: -9.14 },
    { name: 'London', latitude: 51.51, longitude: -0.13 },
    { name: 'Bergen', latitude: 60.39, longitude: 5.32 },
    { name: 'Istanbul', latitude: 41.01, longitude: 28.98 },
    { name: 'Alexandria', latitude: 31.2, longitude: 29.92 },
    { name: 'Cape Town', latitude: -33.92, longitude: 18.42 },
    { name: 'Aden', latitude: 12.78, longitude: 45.03 },
    { name: 'Havana', latitude: 23.13, longitude: -82.38 },
    { name: 'Callao', latitude: -12.05, longitude: -77.15 },
    { name: 'Montevideo', latitude: -34.9, longitude: -56.19 },
    { name: 'Valparaiso', latitude: -33.05, longitude: -71.62 },
    { name: 'Rio de Janeiro', latitude: -22.91, longitude: -43.17 },
    { name: 'Luanda', latitude: -8.84, longitude: 13.23 },
    { name: 'Mombasa', latitude: -4.05, longitude: 39.67 },
  ];

// The world map is hand-drawn, so no linear projection fits it exactly; the
// worst residual over 29 ports spanning every ocean is ~48 (Rio de Janeiro).
// That is a property of the source art, not slack in the formula. 50 stays
// two orders of magnitude below the error a real regression (wrong
// coefficient, swapped lat/lon, missing wrap) would produce, so it still
// catches drift.
const PROJECTION_TOLERANCE = 50;

describe('project (design spec 3.1)', () => {
  test.each(groundTruthPorts)(
    `reproduces $name's real portData.ts position within ${PROJECTION_TOLERANCE} units`,
    ({ name, latitude, longitude }) => {
      const projected = project(latitude, longitude);
      const real = findPortPosition(name);

      expect(distanceBetween(projected, real)).toBeLessThanOrEqual(
        PROJECTION_TOLERANCE,
      );
    },
  );

  describe('longitude wrapping', () => {
    test('every landmark position lands inside [0, MAP_WIDTH)', () => {
      landmarks.forEach((landmark) => {
        expect(landmark.position.x).toBeGreaterThanOrEqual(0);
        expect(landmark.position.x).toBeLessThan(MAP_WIDTH);
      });
    });

    test('bering-strait is the live wrap case: its raw projection is negative and wraps by exactly MAP_WIDTH', () => {
      const beringStrait = landmarks.find(
        (landmark) => landmark.id === 'bering-strait',
      )!;
      const rawX = rawProjectedX(beringStrait.longitude);

      expect(rawX).toBeLessThan(0);
      expect(beringStrait.position.x).toBe(rawX + MAP_WIDTH);
      expect(beringStrait.position.x).toBeGreaterThanOrEqual(0);
      expect(beringStrait.position.x).toBeLessThan(MAP_WIDTH);
    });

    test('bering-strait is the only landmark whose raw (pre-wrap) projection is negative', () => {
      const negative = landmarks.filter(
        (landmark) => rawProjectedX(landmark.longitude) < 0,
      );

      expect(negative.map((landmark) => landmark.id)).toEqual([
        'bering-strait',
      ]);
    });
  });
});

describe('discovery landmark data', () => {
  test('every landmark’s stored position equals its declared latitude/longitude run through the projection', () => {
    landmarks.forEach((landmark) => {
      expect(landmark.position).toEqual(
        project(landmark.latitude, landmark.longitude),
      );
    });
  });

  test('ids are unique', () => {
    const ids = landmarks.map((landmark) => landmark.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('fame and gold are positive finite numbers', () => {
    landmarks.forEach((landmark) => {
      expect(Number.isFinite(landmark.fame)).toBe(true);
      expect(landmark.fame).toBeGreaterThan(0);
      expect(Number.isFinite(landmark.gold)).toBe(true);
      expect(landmark.gold).toBeGreaterThan(0);
    });
  });

  test('no two landmarks are close enough that their radii overlap', () => {
    for (let i = 0; i < landmarks.length; i += 1) {
      for (let j = i + 1; j < landmarks.length; j += 1) {
        const a = landmarks[i];
        const b = landmarks[j];

        expect(distanceBetween(a.position, b.position)).toBeGreaterThan(
          a.radius + b.radius,
        );
      }
    }
  });
});

describe('getNewlyDiscoveredLandmarks', () => {
  test.each(landmarks)(
    '$id discovers exactly at the radius boundary, not just outside it',
    (landmark) => {
      const onBoundary = {
        x: landmark.position.x + landmark.radius,
        y: landmark.position.y,
      };
      const justOutside = {
        x: landmark.position.x + landmark.radius + 0.001,
        y: landmark.position.y,
      };

      expect(
        getNewlyDiscoveredLandmarks(onBoundary, []).map((match) => match.id),
      ).toContain(landmark.id);
      expect(
        getNewlyDiscoveredLandmarks(justOutside, []).map((match) => match.id),
      ).not.toContain(landmark.id);
    },
  );

  // Design spec section 4.2: a fleet stepping at the maximum per-tick
  // displacement along a straight line through a landmark's centre must
  // discover it. The samples are offset by half a step so none of them
  // ever lands exactly on the centre — the worst-case phase alignment the
  // tunnelling hazard describes.
  test.each(landmarks)(
    '$id is discovered by a fleet stepping at the max per-tick displacement through its centre',
    (landmark) => {
      const steps = 40;
      const startX =
        landmark.position.x -
        (steps / 2) * MAX_PER_TICK_DISPLACEMENT +
        MAX_PER_TICK_DISPLACEMENT / 2;

      let discovered: string[] = [];

      for (let i = 0; i < steps; i += 1) {
        const position = {
          x: startX + i * MAX_PER_TICK_DISPLACEMENT,
          y: landmark.position.y,
        };
        const newlyDiscovered = getNewlyDiscoveredLandmarks(
          position,
          discovered,
        );

        discovered = [...discovered, ...newlyDiscovered.map((m) => m.id)];
      }

      expect(discovered).toContain(landmark.id);
    },
  );

  test('an already-discovered landmark is never returned again', () => {
    const [first] = landmarks;

    const result = getNewlyDiscoveredLandmarks(first.position, [first.id]);

    expect(result.map((match) => match.id)).not.toContain(first.id);
  });

  test('two landmarks discoverable at the same position both fire', () => {
    // The real roster can never produce this case — the no-overlap test
    // above guarantees it — so this exercises the pure function directly
    // against a synthetic pair via the candidates override.
    const shared: Position = { x: 0, y: 0 };
    const a: Landmark = {
      id: 'test-landmark-a',
      name: 'Test Landmark A',
      referencePort: 'Lisbon',
      latitude: 0,
      longitude: 0,
      position: shared,
      radius: 5,
      fame: 1,
      gold: 1,
    };
    const b: Landmark = {
      id: 'test-landmark-b',
      name: 'Test Landmark B',
      referencePort: 'Lisbon',
      latitude: 0,
      longitude: 0,
      position: shared,
      radius: 5,
      fame: 1,
      gold: 1,
    };

    const result = getNewlyDiscoveredLandmarks(shared, [], [a, b]);

    expect(result.map((match) => match.id).sort()).toEqual([
      'test-landmark-a',
      'test-landmark-b',
    ]);
  });
});
