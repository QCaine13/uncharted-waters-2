/* eslint-disable no-bitwise, no-nested-ternary, no-restricted-syntax */
import fs from 'fs';
import path from 'path';

import { legacyLisbonSnapshot } from './__fixtures__/legacyLisbonSnapshot';
import { compiledStoryContent } from '.';
import { resolveStoryEvent } from './core/resolver';
import { storyEventId, type StoryContext } from './core/types';
import { legacyToSemanticEvent } from './legacy/lisbonCompletionKeys';

const gatingKeys = [
  'houseBeforeQuest',
  'houseAfterQuestAndPub',
  'pubBeforeQuest',
  'pubAfterQuest',
  'itemShopAfterQuest',
  'shipyardAfterQuest',
  'churchBeforeQuest',
  'churchAfterQuest',
  'churchAfterEnrico',
  'harborFinal',
] as const;

const semantic = (legacy: string): string =>
  legacyToSemanticEvent[legacy as keyof typeof legacyToSemanticEvent];

const legacyCandidates = (
  completed: ReadonlySet<string>,
  buildingId: string | null,
  timePassed: number,
  portId: string | null,
  stage: 'building' | 'world',
): string[] => {
  if (portId !== '1' || buildingId === null || stage !== 'building') return [];
  const minute = ((timePassed % 1440) + 1440) % 1440;
  const rule = legacyLisbonSnapshot.rules.find((candidate) => {
    if (candidate.building !== buildingId) return false;
    if (candidate.blockedBy.some((key) => completed.has(key))) return false;
    if (candidate.requires.some((key) => !completed.has(key))) return false;
    if (candidate.timeWindow) {
      const [min, max] = candidate.timeWindow;
      if (
        !(min > max
          ? minute >= min || minute <= max
          : minute >= min && minute < max)
      ) {
        return false;
      }
    }
    return true;
  });
  if (!rule) return [];
  const results = (
    Array.isArray(rule.result) ? rule.result : [rule.result]
  ) as readonly string[];
  return results.map(semantic);
};

describe('Lisbon resolver legacy-oracle parity', () => {
  test('matches every gating subset, scene, time, port, and stage including random candidate sets', () => {
    let comparisons = 0;
    for (let mask = 0; mask < 2 ** gatingKeys.length; mask += 1) {
      const completedLegacy = new Set(
        gatingKeys.filter((_, index) => (mask & (1 << index)) !== 0),
      );
      const completedEvents = new Set(
        [...completedLegacy].map((key) => storyEventId(semantic(key))),
      );
      for (const buildingId of [
        ...Array.from({ length: 11 }, (_, i) => String(i + 1)),
        null,
      ]) {
        for (const timePassed of [0, 600, 1319, 1320, 1439]) {
          for (const portId of ['1', '2', null]) {
            for (const stage of ['building', 'world'] as const) {
              const expected = legacyCandidates(
                completedLegacy,
                buildingId,
                timePassed,
                portId,
                stage,
              );
              let randomCandidates: string[] = [];
              const actual = resolveStoryEvent(
                {
                  stage,
                  portId,
                  buildingId,
                  timePassed,
                  completedEvents,
                  fame: { adventure: 0, pirate: 0, trade: 0 },
                  items: new Set(),
                  companions: new Set(),
                } as StoryContext,
                compiledStoryContent,
                (candidates) => {
                  randomCandidates = candidates.map(({ id }) => id);
                  return candidates[0];
                },
              );
              expect(
                randomCandidates.length
                  ? randomCandidates
                  : actual
                  ? [actual.id]
                  : [],
              ).toEqual(
                expected.map((id) =>
                  buildingId === '7'
                    ? `${id}.bank`
                    : buildingId === '9'
                    ? `${id}.guild`
                    : id,
                ),
              );
              comparisons += 1;
            }
          }
        }
      }
    }
    expect(comparisons).toBe(368640);
  });

  test('production entry dependency graph never imports test fixtures', () => {
    const root = path.resolve(__dirname, 'index.ts');
    const visited = new Set<string>();
    const walk = (file: string): void => {
      if (visited.has(file)) return;
      visited.add(file);
      const source = fs.readFileSync(file, 'utf8');
      expect(source).not.toMatch(/__fixtures__/);
      for (const match of source.matchAll(
        /(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g,
      )) {
        const base = path.resolve(path.dirname(file), match[1]);
        const candidate = [
          `${base}.ts`,
          `${base}.tsx`,
          path.join(base, 'index.ts'),
        ].find(fs.existsSync);
        if (candidate) walk(candidate);
      }
    };
    walk(root);
    expect(visited.size).toBeGreaterThan(1);
  });
});
