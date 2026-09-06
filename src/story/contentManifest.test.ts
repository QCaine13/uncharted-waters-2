import { storyContentSource } from './content';
import {
  formatStoryContentReport,
  getStoryContentReport,
  getStoryValidationReport,
} from './contentManifest';
import {
  characterId,
  legacyQuestId,
  relationshipId,
  storyArcId,
  storyEventId,
  type StoryContentSource,
} from './core/types';

const multiArcFixture = (): StoryContentSource => {
  const joao = characterId('joao');
  const rocco = characterId('rocco');
  const unusedOne = characterId('unused-one');
  const unusedTwo = characterId('unused-two');
  const firstArc = storyArcId('joao.first');
  const secondArc = storyArcId('joao.second');
  const firstEntry = storyEventId('joao.first.entry');
  const beforeFirst = storyEventId('joao.second.before-first');
  const afterFirst = storyEventId('joao.second.after-first');
  const afterAfterFirst = storyEventId('joao.second.after-after-first');

  return {
    characters: [
      {
        id: joao,
        names: { en: 'João' },
        role: 'protagonist',
        dialogueStyle: { color: 'blue' },
      },
      {
        id: rocco,
        names: { en: 'Rocco' },
        role: 'companion',
        dialogueStyle: { color: 'green' },
      },
      {
        id: unusedOne,
        names: { en: 'Unused One' },
        role: 'npc',
        dialogueStyle: { color: 'gray' },
      },
      {
        id: unusedTwo,
        names: { en: 'Unused Two' },
        role: 'npc',
        dialogueStyle: { color: 'gray' },
      },
    ],
    relationships: [
      {
        id: relationshipId('unused-one.unused-two.friend'),
        from: unusedOne,
        to: unusedTwo,
        type: 'friend',
        reciprocal: 'friend',
      },
    ],
    arcs: [
      {
        id: secondArc,
        protagonist: joao,
        title: 'Second',
        eventIds: [beforeFirst, afterFirst, afterAfterFirst],
      },
      {
        id: firstArc,
        protagonist: joao,
        title: 'First',
        eventIds: [firstEntry],
      },
    ],
    events: [
      {
        id: firstEntry,
        arcId: firstArc,
        priority: 10,
        trigger: { type: 'stage', stage: 'building' },
        repeat: 'repeatable',
        steps: [{ type: 'dialogue', body: 'First.', position: 0 }],
      },
      {
        id: beforeFirst,
        arcId: secondArc,
        priority: 20,
        trigger: {
          type: 'not',
          condition: { type: 'eventCompleted', eventId: firstEntry },
        },
        repeat: 'repeatable',
        steps: [
          {
            type: 'choice',
            prompt: 'Sail?',
            position: 0,
            options: [
              {
                id: 'yes',
                label: 'Yes',
                steps: [
                  {
                    type: 'effect',
                    effects: [{ type: 'addCompanion', characterId: rocco }],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: afterFirst,
        arcId: secondArc,
        priority: 30,
        trigger: { type: 'eventCompleted', eventId: firstEntry },
        repeat: 'once',
        legacyCompletionKey: legacyQuestId('afterFirst'),
        steps: [{ type: 'dialogue', body: 'After.', position: 0 }],
      },
      {
        id: afterAfterFirst,
        arcId: secondArc,
        priority: 40,
        trigger: {
          type: 'not',
          condition: {
            type: 'not',
            condition: { type: 'eventCompleted', eventId: afterFirst },
          },
        },
        repeat: 'repeatable',
        steps: [{ type: 'dialogue', body: 'After after.', position: 0 }],
      },
    ],
  };
};

describe('story content manifest', () => {
  test('validates story content', () => {
    const report = getStoryValidationReport();

    expect(report).toEqual({
      valid: true,
      errorCount: 0,
      warningCount: 0,
      diagnostics: [],
    });
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });

  test('reports invalid injected content with error counts and field paths', () => {
    const invalid: StoryContentSource = {
      ...storyContentSource,
      characters: [...storyContentSource.characters],
      relationships: storyContentSource.relationships.map((relationship) => ({
        ...relationship,
      })),
      arcs: [...storyContentSource.arcs],
      events: [...storyContentSource.events],
    };
    invalid.relationships[0].to = characterId('missing-character');

    const report = getStoryValidationReport(invalid);

    expect(report.valid).toBe(false);
    expect(report.errorCount).toBeGreaterThan(0);
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing-relationship-character',
          path: 'relationships[0].to',
        }),
      ]),
    );
  });

  test('prints story content report', () => {
    const report = getStoryContentReport();
    const lisbonEventIds = storyContentSource.events
      .filter(({ arcId }) => String(arcId) === 'joao.lisbon-opening')
      .map(({ id }) => String(id))
      .sort();

    expect(report.counts).toEqual({
      characters: 9,
      relationships: 8,
      arcs: 2,
      events: 52,
    });
    expect(report.arcs).toEqual([
      {
        id: 'joao.first-voyage',
        entryEvents: [
          'joao.first-voyage.commission-accepted',
          'joao.first-voyage.domingo-met',
        ],
        terminalEvents: ['joao.first-voyage.chapter-complete'],
        crossArcDependencies: ['joao.lisbon-opening'],
      },
      {
        id: 'joao.lisbon-opening',
        entryEvents: lisbonEventIds.filter(
          (id) => id !== 'joao.lisbon-opening.house-mother-farewell',
        ),
        terminalEvents: lisbonEventIds.filter(
          (id) => id !== 'joao.lisbon-opening.pub-farewell',
        ),
        crossArcDependencies: [],
      },
    ]);
    expect(report.unreferencedCharacters).toEqual([]);
    expect(report.unreferencedRelationships).toEqual([]);
    expect(report.legacyCompatibility).toEqual({
      onceEvents: 10,
      mappedEvents: 10,
      coverageComplete: true,
      unmappedEvents: [],
      keys: [
        'churchAfterEnrico',
        'churchAfterQuest',
        'churchBeforeQuest',
        'harborFinal',
        'houseAfterQuestAndPub',
        'houseBeforeQuest',
        'itemShopAfterQuest',
        'pubAfterQuest',
        'pubBeforeQuest',
        'shipyardAfterQuest',
      ],
    });
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);

    const formatted = formatStoryContentReport(report);
    expect(formatted).toContain(
      'Story content: 9 characters, 8 relationships, 2 arcs, 52 events',
    );
    expect(formatted).toContain(
      'Legacy compatibility: 10/10 once events mapped (complete)',
    );
    // eslint-disable-next-line no-console -- the report command emits through Jest
    if (process.env.STORY_REPORT === '1') console.log(formatted);
  });

  test('reports exact multi-arc topology and unused records', () => {
    const report = getStoryContentReport(multiArcFixture());

    expect(report.arcs).toEqual([
      {
        id: 'joao.first',
        entryEvents: ['joao.first.entry'],
        terminalEvents: ['joao.first.entry'],
        crossArcDependencies: [],
      },
      {
        id: 'joao.second',
        entryEvents: ['joao.second.after-first', 'joao.second.before-first'],
        terminalEvents: [
          'joao.second.after-after-first',
          'joao.second.before-first',
        ],
        crossArcDependencies: ['joao.first'],
      },
    ]);
    expect(report.unreferencedCharacters).toEqual(['unused-one', 'unused-two']);
    expect(report.unreferencedRelationships).toEqual([
      'unused-one.unused-two.friend',
    ]);
    expect(report.legacyCompatibility).toEqual({
      onceEvents: 1,
      mappedEvents: 1,
      coverageComplete: true,
      unmappedEvents: [],
      keys: ['afterFirst'],
    });
  });
});
