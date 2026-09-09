import { describe, expect, it } from '@jest/globals';
import { regularPorts } from '../src/data/portData';
import { classifyDockingCorrectionMovement } from './worldNavigationControl';
import {
  planDockingEntry,
  planPortRoute,
  planWorldRoute,
  planWorldUnblock,
} from './worldRoutePlanner';

describe('world route planner', () => {
  it('finds the collision-safe Nagasaki entry from the fresh journey position', () => {
    expect(
      planDockingEntry({
        position: { x: 1673, y: 403.47255 },
        portId: '100',
      }),
    ).toEqual({
      key: 'd',
      expected: { x: 1675, y: 404 },
      simulatedSteps: 6,
    });
  });

  it('replans after a pending heading moves the Calicut correction away from its requested axis', () => {
    const before = { x: 1345.275, y: 552 };
    const after = { x: 1345, y: 550.775 };

    const movement = classifyDockingCorrectionMovement({
      before,
      after,
      axis: 'x',
      key: 'd',
    });
    expect(movement.outcome).toBe('unexpected-movement');
    expect(movement.requestedAxisMovement).toBeCloseTo(-0.275);
    expect(movement.requestedAxisProgress).toBeCloseTo(-0.275);
    expect(movement.totalMovement).toBeCloseTo(1.5);
    expect(planWorldRoute({ from: after, toPortId: '93' }).route[0][0]).toBe(
      's',
    );
  });

  it('retries only a correction whose saved position did not move', () => {
    expect(
      classifyDockingCorrectionMovement({
        before: { x: 1345, y: 550.775 },
        after: { x: 1345, y: 550.775 },
        axis: 'x',
        key: 'd',
      }).outcome,
    ).toBe('stalled');
    expect(
      classifyDockingCorrectionMovement({
        before: { x: 2159.75, y: 400 },
        after: { x: 0.25, y: 400 },
        axis: 'x',
        key: 'd',
      }).outcome,
    ).toBe('targetward-movement');
  });

  it('finds an ordinary coast correction from the observed first-voyage north stall', () => {
    const position = { x: 857.3516666666662, y: 379 };
    expect(
      planWorldUnblock({
        position,
        axis: 'y',
        key: 'w',
      }),
    ).toEqual({
      key: 'a',
      target: { x: 856.3516666666662, y: 379 },
      steps: 2,
    });
    const correction = planWorldUnblock({
      position,
      axis: 'y',
      key: 'w',
      target: 376,
    });

    expect(correction).toEqual({
      key: 'a',
      target: { x: 856.8516666666662, y: 379 },
      steps: 1,
    });
    expect(
      planWorldRoute({
        from: correction!.target,
        to: { x: 858, y: 376 },
      }).route,
    ).toEqual([
      ['a', 2],
      ['w', 3],
      ['d', 3],
    ]);
  });

  it('rejects a one-step opening that cannot carry the first voyage to its axis target', () => {
    const request = {
      position: { x: 836, y: 373.9912500000004 },
      axis: 'x' as const,
      key: 'd' as const,
      target: 856,
    };

    expect(planWorldUnblock(request)).toEqual({
      key: 's',
      target: { x: 836, y: 374.4912500000004 },
      steps: 1,
    });
  });

  it('routes the daytime Cayenne lodge walk clear of the stationary beggar', () => {
    const start = { x: 35, y: 22 };
    const route = planPortRoute({
      portId: '57',
      from: start,
      toBuildingId: '4',
    }).route;
    const visited = route.flatMap(([key, count]) =>
      Array.from({ length: count }, () => key),
    );
    let position = start;
    const overlapsBeggar = visited.some((key) => {
      position = {
        x: position.x + (key === 'd' ? 1 : key === 'a' ? -1 : 0),
        y: position.y + (key === 's' ? 1 : key === 'w' ? -1 : 0),
      };
      return Math.abs(position.x - 37) < 2 && Math.abs(position.y - 22) < 2;
    });
    expect(overlapsBeggar).toBe(false);
  });

  it('routes the Massawa residence walk clear of fixed NPC footprints', () => {
    const start = { x: 10, y: 87 };
    const route = planPortRoute({
      portId: '75',
      from: start,
      toBuildingId: '4',
    }).route;
    const fixedNpcPositions = [
      { x: 38, y: 52 }, // dog beside the item shop
      { x: 51, y: 52 }, // merchant beside the harbor
    ];
    let position = start;
    const crossesFixedNpc = route
      .flatMap(([key, count]) => Array.from({ length: count }, () => key))
      .some((key) => {
        position = {
          x: position.x + (key === 'd' ? 1 : key === 'a' ? -1 : 0),
          y: position.y + (key === 's' ? 1 : key === 'w' ? -1 : 0),
        };
        return fixedNpcPositions.some(
          (npc) =>
            Math.abs(position.x - npc.x) < 2 &&
            Math.abs(position.y - npc.y) < 2,
        );
      });
    expect(crossesFixedNpc).toBe(false);
  });

  it('does not block Cayenne routes with guards that the port never spawns', () => {
    expect(() =>
      planPortRoute({
        portId: '57',
        from: { x: 55, y: 33 },
        toBuildingId: '2',
      }),
    ).not.toThrow();
  });

  it('keeps every planned full-journey facility route reachable', () => {
    const routes: Record<string, string[]> = {
      '1': [
        '4:8',
        '8:6',
        '6:8',
        '8:10',
        '10:4',
        '4:2',
        '2:4',
        '8:4',
        '4:7',
        '7:4',
      ],
      '2': ['4:2', '2:4'],
      '3': ['4:5'],
      '27': ['2:2', '4:4', '4:2', '2:5', '5:3', '3:4'],
      '57': ['4:4', '4:5', '5:4', '4:2', '2:4', '4:3', '3:4'],
      '75': [
        '5:5',
        '4:11',
        '11:8',
        '8:4',
        '4:8',
        '8:5',
        '5:8',
        '8:8',
        '8:2',
        '2:8',
        '4:10',
        '10:2',
        '2:4',
      ],
      '77': ['4:2', '2:4'],
      '99': ['4:7', '7:4'],
    };
    Object.entries(routes).forEach(([portId, pairs]) => {
      const buildings = regularPorts[Number(portId) - 1].buildings;
      pairs.forEach((pair) => {
        const [fromId, toBuildingId] = pair.split(':');
        const fromBuilding = buildings[fromId];
        expect(fromBuilding).toBeDefined();
        expect(() =>
          planPortRoute({
            portId,
            from: { x: fromBuilding.x, y: fromBuilding.y + 1 },
            toBuildingId,
          }),
        ).not.toThrow();
      });
    });
  });
});
