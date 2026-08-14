import { landmarks } from './discoveryData';
import { regularPorts, supplyPorts } from './portData';

// Kept apart from discoveryData.test.ts on purpose. That file tests the
// module's own machinery — the projection, the wrap, the detection radius —
// against criteria the design spec supplied. This file is an acceptance check
// against the outside world, and it exists because the first version of this
// dataset passed every one of those internal tests with ten of fourteen
// landmarks in the wrong place: the spec's criterion ("within 120 units of a
// reference port") and the data were derived from the same source, so their
// agreement proved nothing.
//
// The ground truth here is portData's own coordinates. For each landmark it
// asks which GAME port the landmark actually lands nearest to, and requires
// that to be a port genuinely close to it in the real world. A wrong
// coefficient, a swapped lat/lon, or a missing wrap cannot satisfy it.
// Do not "fix" a failure here by editing the expected neighbours.
const expectedNeighbours: Record<string, string[]> = {
  'strait-of-gibraltar': ['Ceuta', 'Algiers', 'Seville', 'Valencia'],
  azores: ['Santa Cruz', 'Lisbon', 'Madeira'],
  'cape-bojador': ['Santa Cruz', 'Argin', 'Madeira'],
  'cape-verde': ['Bissau', 'Bathurst', 'Argin'],
  'cape-sao-roque': ['Pernambuco', 'Cayenne'],
  'bab-el-mandeb': ['Aden', 'Massawa', 'Mecca'],
  'strait-of-hormuz': ['Hormuz', 'Muscat', 'Quatar', 'Basra'],
  'mouth-of-the-amazon': ['Cayenne', 'Porto Velho', 'Pernambuco'],
  'cape-comorin': ['Cochin', 'Ceylon', 'Calicut'],
  'strait-of-malacca': ['Malacca', 'Pasei', 'Sunda'],
  'galapagos-islands': ['Callao', 'Panama', 'Mollendo'],
  'cape-of-good-hope': ['Cape Town', 'Sofala'],
  'bering-strait': ['Nome', 'Korf', 'Juneau'],
  'strait-of-magellan': ['Valparaiso', 'Montevideo', 'Santiago', 'Mollendo'],
};

const allPorts = [...regularPorts, ...supplyPorts];

test.each(landmarks)(
  'REVIEW: $id lands nearest a port that is genuinely close to it in reality',
  ({ id, position }) => {
    const nearest = allPorts.reduce((best, port) =>
      Math.hypot(port.position.x - position.x, port.position.y - position.y) <
      Math.hypot(best.position.x - position.x, best.position.y - position.y)
        ? port
        : best,
    );

    expect(expectedNeighbours[id]).toContain(nearest.name);
  },
);
