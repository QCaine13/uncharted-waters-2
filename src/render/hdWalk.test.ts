import { stepProgress, walk16Frame } from './hdWalk';

describe('walk16Frame', () => {
  it('maps each direction to its block of four frames', () => {
    // dir = floor(local/2): N=0, E=1, S=2, W=3
    expect(walk16Frame(0, 0.25)).toBe(0); // N stride A
    expect(walk16Frame(2, 0.25)).toBe(4); // E stride A
    expect(walk16Frame(4, 0.25)).toBe(8); // S stride A
    expect(walk16Frame(6, 0.25)).toBe(12); // W stride A
  });

  it('uses stride in the first half and passing in the second', () => {
    expect(walk16Frame(0, 0.4)).toBe(0);
    expect(walk16Frame(0, 0.5)).toBe(1);
    expect(walk16Frame(0, 0.9)).toBe(1);
  });

  it('respects the alternate leg', () => {
    expect(walk16Frame(1, 0.4)).toBe(2); // stride B
    expect(walk16Frame(1, 0.6)).toBe(3); // passing
    expect(walk16Frame(5, 0.4)).toBe(10); // S stride B
  });

  it('shows the standing pose when settled', () => {
    expect(walk16Frame(0, 0)).toBe(1);
    expect(walk16Frame(4, 1)).toBe(9);
    expect(walk16Frame(6, -0.1)).toBe(13);
  });
});

describe('stepProgress', () => {
  const makeCharacter = (position: Position, destination?: Position) => ({
    position: () => position,
    destination: () => destination,
  });

  interface Position {
    x: number;
    y: number;
  }

  it('is 0 when the character has no destination', () => {
    expect(stepProgress(makeCharacter({ x: 3, y: 3 }), 0.5)).toBe(0);
  });

  it('is 1-distance from the target tile mid step', () => {
    // interpolated to 40% of the way towards the east destination
    expect(
      stepProgress(makeCharacter({ x: 3.4, y: 3 }, { x: 4, y: 3 }), 0.4),
    ).toBeCloseTo(0.4);
  });

  it('works for negative directions', () => {
    // 30% of the way towards the west destination
    expect(
      stepProgress(makeCharacter({ x: 3.7, y: 3 }, { x: 3, y: 3 }), 0.3),
    ).toBeCloseTo(0.3);
  });

  it('is settled once the step lands', () => {
    // destination reached: both agree, so the pose stands
    expect(
      stepProgress(makeCharacter({ x: 4, y: 3 }, { x: 4, y: 3 }), 0.9),
    ).toBe(1);
  });
});
