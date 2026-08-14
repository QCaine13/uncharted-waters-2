import { getPortData } from '../game/port/portUtils';
import { regularPorts, supplyPorts } from '../data/portData';
import { nearestPortId } from './provisions';

// provisions.test.ts mocks portData to test the search itself. This file
// deliberately does not: it runs against the real atlas and round-trips the
// returned id back through the production getPortData lookup, so that
// nearestPortId agreeing with the real "regularPorts then supplyPorts,
// 1-indexed" id scheme is proven rather than assumed. A drift there would
// silently strand an adrift fleet at the wrong port.
describe('nearestPortId against the real atlas', () => {
  const allPorts = [...regularPorts, ...supplyPorts];

  const distanceTo = (
    port: { position: { x: number; y: number } },
    position: { x: number; y: number },
  ) => Math.hypot(port.position.x - position.x, port.position.y - position.y);

  test.each([
    { x: 0, y: 0 },
    { x: 840, y: 400 },
    { x: 1500, y: 900 },
    { x: 300, y: 1200 },
    { x: 2047, y: 2047 },
  ])('resolves $x,$y to a port that is genuinely the closest', (position) => {
    const chosen = getPortData(nearestPortId(position));
    const trueMinimum = Math.min(
      ...allPorts.map((port) => distanceTo(port, position)),
    );

    expect(distanceTo(chosen, position)).toBeCloseTo(trueMinimum, 6);
  });
});
