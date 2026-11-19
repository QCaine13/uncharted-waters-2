import { ambientAt } from './lighting';

describe('ambientAt', () => {
  it('is near-white with no darkness through the day', () => {
    [480, 720, 1020].forEach((minutes) => {
      const { tint, darkness } = ambientAt(minutes);
      tint.forEach((channel) => expect(channel).toBeCloseTo(255, 5));
      expect(darkness).toBeCloseTo(0, 5);
    });
  });

  it('is continuous across every keyframe boundary', () => {
    const keyframes = [300, 390, 480, 1020, 1110, 1200, 1320];

    keyframes.forEach((k) => {
      const before = ambientAt(k - 0.01);
      const after = ambientAt(k + 0.01);

      before.tint.forEach((channel, i) => {
        expect(Math.abs(channel - after.tint[i])).toBeLessThan(0.5);
      });
      expect(Math.abs(before.darkness - after.darkness)).toBeLessThan(0.01);
    });
  });

  it('wraps continuously at midnight', () => {
    const before = ambientAt(1439.99);
    const after = ambientAt(0.01);

    before.tint.forEach((channel, i) => {
      expect(Math.abs(channel - after.tint[i])).toBeLessThan(1);
    });
    expect(Math.abs(before.darkness - after.darkness)).toBeLessThan(0.01);
  });

  it('normalizes out-of-range input', () => {
    expect(ambientAt(1440).darkness).toBeCloseTo(ambientAt(0).darkness, 10);
    expect(ambientAt(-60).darkness).toBeCloseTo(ambientAt(1380).darkness, 10);
  });

  it('is darkest at night and warm at dusk', () => {
    expect(ambientAt(1380).darkness).toBeGreaterThan(0.5);
    const dusk = ambientAt(1110);
    expect(dusk.tint[0]).toBeGreaterThan(dusk.tint[1]);
    expect(dusk.tint[1]).toBeGreaterThan(dusk.tint[2]);
  });
});
