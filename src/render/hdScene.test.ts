import {
  HD_SCENE_COVERAGE,
  isSceneCovered,
} from '../game/images/hd/hdSceneManifest';

describe('isSceneCovered', () => {
  it('decodes the coverage grid exactly', () => {
    HD_SCENE_COVERAGE.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        expect(isSceneCovered(x, y)).toBe(row[x] === '1');
      }
    });
  });

  it('returns false outside the map', () => {
    expect(isSceneCovered(-1, 0)).toBe(false);
    expect(isSceneCovered(0, -1)).toBe(false);
    expect(isSceneCovered(0, HD_SCENE_COVERAGE.length)).toBe(false);
    expect(isSceneCovered(96, 0)).toBe(false);
  });

  it('has a 96x96 grid', () => {
    expect(HD_SCENE_COVERAGE).toHaveLength(96);
    HD_SCENE_COVERAGE.forEach((row) => expect(row).toHaveLength(96));
  });
});
