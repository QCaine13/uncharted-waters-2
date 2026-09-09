import { compiledStoryContent, storyContentSource } from '../../../..';
import { getStoryContentReport } from '../../../../contentManifest';
import { CONFLICT_AND_GROWTH_ARC_ID, conflictAndGrowthEvents } from '.';

const expectedEventIds = [
  'joao.conflict-and-growth.domingo-missing',
  'joao.conflict-and-growth.lodge-search',
  'joao.conflict-and-growth.kahn-shipyard-start',
  'joao.conflict-and-growth.identity-revealed',
  'joao.conflict-and-growth.kahn-house-start',
  'joao.conflict-and-growth.kahn-house-rematch',
  'joao.conflict-and-growth.father-cleared',
  'joao.conflict-and-growth.domingo-farewell',
  'joao.conflict-and-growth.domingo-farewell-flamberge-owned',
  'joao.conflict-and-growth.katarina-warning',
  'joao.conflict-and-growth.pursuit-first-sea',
  'joao.conflict-and-growth.pursuit-first-port',
  'joao.conflict-and-growth.katarina-battle-start',
  'joao.conflict-and-growth.katarina-retry',
  'joao.conflict-and-growth.ali-request',
  'joao.conflict-and-growth.lisbon-inquiry',
  'joao.conflict-and-growth.sasha-found',
  'joao.conflict-and-growth.chapter-complete',
];

describe('João conflict and growth chapter registration', () => {
  test('registers the stable arc and complete ordered milestone inventory', () => {
    expect(String(CONFLICT_AND_GROWTH_ARC_ID)).toBe('joao.conflict-and-growth');
    expect(conflictAndGrowthEvents.map(({ id }) => String(id))).toEqual(
      expectedEventIds,
    );
    expect(storyContentSource.arcs.map(({ id }) => String(id))).toContain(
      'joao.conflict-and-growth',
    );
    expect(compiledStoryContent.diagnostics).toEqual([]);
  });

  test('keeps M2 new-semantic-only and reports the Istanbul closure as terminal', () => {
    expect(
      conflictAndGrowthEvents.every(
        ({ legacyCompletionKey }) => legacyCompletionKey === undefined,
      ),
    ).toBe(true);
    const report = getStoryContentReport();
    expect(
      report.arcs.find(({ id }) => id === 'joao.conflict-and-growth'),
    ).toEqual({
      id: 'joao.conflict-and-growth',
      entryEvents: ['joao.conflict-and-growth.domingo-missing'],
      terminalEvents: [
        'joao.conflict-and-growth.chapter-complete',
        'joao.conflict-and-growth.domingo-farewell-flamberge-owned',
        'joao.conflict-and-growth.kahn-house-rematch',
        'joao.conflict-and-growth.katarina-retry',
      ],
      crossArcDependencies: ['joao.first-voyage'],
    });
  });

  test('uses only yes/no choice IDs and leaves every combat start terminal', () => {
    const choices = conflictAndGrowthEvents.flatMap(({ steps }) =>
      steps.flatMap((step) => (step.type === 'choice' ? [step] : [])),
    );
    expect(choices.map(({ options }) => options.map(({ id }) => id))).toEqual([
      ['yes', 'no'],
      ['yes', 'no'],
    ]);

    const combatGroups = conflictAndGrowthEvents.flatMap(({ steps }) =>
      steps
        .flatMap((step) => (step.type === 'effect' ? [step.effects] : []))
        .filter((effects) =>
          effects.some((effect) => effect.type === 'startCombat'),
        ),
    );
    expect(combatGroups).toHaveLength(4);
    combatGroups.forEach((effects) => {
      const nonSave = effects.filter(({ type }) => type !== 'save');
      expect(nonSave[nonSave.length - 1]?.type).toBe('startCombat');
    });
  });
});
