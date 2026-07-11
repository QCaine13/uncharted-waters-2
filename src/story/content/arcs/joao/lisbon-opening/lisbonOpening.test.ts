import legacyQuestData, {
  type Message,
} from '../../../../../interface/quest/questData';
import { legacyLisbonSnapshot } from '../../../../__fixtures__/legacyLisbonSnapshot';
import { storyCharacters } from '../../../characters';
import { storyRelationships } from '../../../relationships';
import { compiledStoryContent, storyContentSource } from '../../../..';
import type {
  StoryCondition,
  StoryEffect,
  StoryEvent,
  StoryStep,
} from '../../../../core/types';
import {
  joaoLisbonOpening,
  legacyToSemanticEvent,
  lisbonOpeningEvents,
} from '.';

const legacyKeys = [
  'houseBeforeQuest',
  'houseAfterQuest',
  'houseAfterQuestAndPub',
  'houseAfterQuestAndPub2',
  'pubBeforeQuest',
  'pubBeforeQuest2',
  'pubAfterQuest',
  'pubAfterQuest2',
  'lodgeBankGuildBeforeQuestRandom1',
  'lodgeBankGuildBeforeQuestRandom2',
  'lodgeBankGuildBeforeQuestRandom3',
  'lodgeBankGuildAfterQuestRandom1',
  'lodgeBankGuildAfterQuestRandom2',
  'lodgeBankGuildAfterQuestRandom3',
  'palaceBeforeQuest',
  'palaceAfterQuest',
  'itemShopBeforeQuest',
  'itemShopAfterQuest',
  'itemShopAfterQuest2',
  'shipyardBeforeQuest',
  'shipyardAfterQuest',
  'churchBeforeQuest',
  'churchBeforeQuest2',
  'churchAfterQuest',
  'churchAfterEnrico',
  'churchAfterEnricoAfterGift',
  'harborBeforeQuest',
  'harborBeforeShip',
  'harborBeforeEnrico',
  'harborAfterEnrico',
  'harborAfterEnrico2',
  'harborAfterEnricoBeforeMother',
  'harborFinal',
  'marketBeforeQuest',
  'marketAfterQuestBeforeShip',
  'pubCarlottaGreeting',
] as const;

const expectedMapping = {
  houseBeforeQuest: 'joao.lisbon-opening.house-introduction',
  houseAfterQuest: 'joao.lisbon-opening.house-guard-after-introduction',
  houseAfterQuestAndPub: 'joao.lisbon-opening.house-mother-farewell',
  houseAfterQuestAndPub2: 'joao.lisbon-opening.house-guard-after-farewell',
  pubBeforeQuest: 'joao.lisbon-opening.pub-before-introduction',
  pubBeforeQuest2: 'joao.lisbon-opening.pub-before-departure',
  pubAfterQuest: 'joao.lisbon-opening.pub-farewell',
  pubAfterQuest2: 'joao.lisbon-opening.pub-after-farewell',
  lodgeBankGuildBeforeQuestRandom1: 'joao.lisbon-opening.ambient-before-1',
  lodgeBankGuildBeforeQuestRandom2: 'joao.lisbon-opening.ambient-before-2',
  lodgeBankGuildBeforeQuestRandom3: 'joao.lisbon-opening.ambient-before-3',
  lodgeBankGuildAfterQuestRandom1: 'joao.lisbon-opening.ambient-after-1',
  lodgeBankGuildAfterQuestRandom2: 'joao.lisbon-opening.ambient-after-2',
  lodgeBankGuildAfterQuestRandom3: 'joao.lisbon-opening.ambient-after-3',
  palaceBeforeQuest: 'joao.lisbon-opening.palace-before-introduction',
  palaceAfterQuest: 'joao.lisbon-opening.palace-after-introduction',
  itemShopBeforeQuest: 'joao.lisbon-opening.item-shop-before-introduction',
  itemShopAfterQuest: 'joao.lisbon-opening.item-shop-rapier',
  itemShopAfterQuest2: 'joao.lisbon-opening.item-shop-after-rapier',
  shipyardBeforeQuest: 'joao.lisbon-opening.shipyard-before-introduction',
  shipyardAfterQuest: 'joao.lisbon-opening.shipyard-hermes-ii',
  churchBeforeQuest: 'joao.lisbon-opening.church-before-introduction',
  churchBeforeQuest2: 'joao.lisbon-opening.church-before-departure',
  churchAfterQuest: 'joao.lisbon-opening.church-recruit-enrico',
  churchAfterEnrico: 'joao.lisbon-opening.church-enrico-gift',
  churchAfterEnricoAfterGift: 'joao.lisbon-opening.church-after-gift',
  harborBeforeQuest: 'joao.lisbon-opening.harbor-before-introduction',
  harborBeforeShip: 'joao.lisbon-opening.harbor-before-ship',
  harborBeforeEnrico: 'joao.lisbon-opening.harbor-before-enrico',
  harborAfterEnrico: 'joao.lisbon-opening.harbor-enrico-arrival',
  harborAfterEnrico2: 'joao.lisbon-opening.harbor-after-enrico-arrival',
  harborAfterEnricoBeforeMother:
    'joao.lisbon-opening.harbor-before-mother-farewell',
  harborFinal: 'joao.lisbon-opening.harbor-final',
  marketBeforeQuest: 'joao.lisbon-opening.market-before-introduction',
  marketAfterQuestBeforeShip: 'joao.lisbon-opening.market-before-ship',
  pubCarlottaGreeting: 'joao.lisbon-opening.pub-carlotta-greeting',
} as const;

const legacyPassiveMessage = (message: Message) => ({
  body: message.body,
  position: message.position,
  ...('characterId' in message ? { characterId: message.characterId } : {}),
  ...(message.fadeBeforeNext ? { fadeBeforeNext: true } : {}),
  ...(message.completeQuest ? { completeQuest: true } : {}),
  ...(message.exitBuilding ? { exitBuilding: true } : {}),
  ...(message.action ? { hasAction: true } : {}),
});

const snapshotPassiveMessage = (message: {
  readonly body: string;
  readonly position: number;
  readonly characterId?: string;
  readonly fadeBeforeNext?: true;
  readonly completeQuest?: true;
  readonly exitBuilding?: true;
  readonly action?: string;
}) => ({
  body: message.body,
  position: message.position,
  ...(message.characterId ? { characterId: message.characterId } : {}),
  ...(message.fadeBeforeNext ? { fadeBeforeNext: true } : {}),
  ...(message.completeQuest ? { completeQuest: true } : {}),
  ...(message.exitBuilding ? { exitBuilding: true } : {}),
  ...(message.action ? { hasAction: true } : {}),
});

type SnapshotMessage = Parameters<typeof snapshotPassiveMessage>[0];

const normalizeTokens = (body: string): string =>
  body
    .replace(/\$firstName/g, '<firstName>')
    .replace(/\$lastName/g, '<lastName>');

const recursivelyContainsFunction = (value: unknown): boolean => {
  if (typeof value === 'function') return true;
  if (Array.isArray(value)) return value.some(recursivelyContainsFunction);
  if (value && typeof value === 'object') {
    return Object.values(value).some(recursivelyContainsFunction);
  }
  return false;
};

const flattenSteps = (steps: readonly StoryStep[]): readonly StoryStep[] =>
  steps.flatMap((step) =>
    step.type === 'choice'
      ? [step, ...step.options.flatMap((option) => flattenSteps(option.steps))]
      : [step],
  );

const conditionsOf = (condition: StoryCondition): readonly StoryCondition[] =>
  condition.type === 'all' ? condition.conditions : [condition];

const eventById = (id: string): StoryEvent => {
  const event = lisbonOpeningEvents.find((candidate) => candidate.id === id);
  if (!event) throw new Error(`Missing migrated event ${id}`);
  return event;
};

const migratedBodies = (event: StoryEvent): string[] =>
  event.steps.flatMap((step) => {
    if (step.type === 'dialogue') return [normalizeTokens(step.body)];
    if (step.type === 'choice') return [normalizeTokens(step.prompt)];
    return [];
  });

const expectedEffects: Partial<
  Record<typeof legacyKeys[number], Record<number, StoryEffect[]>>
> = {
  houseBeforeQuest: {
    38: [
      { type: 'addCompanion', characterId: 'rocco' as never },
      {
        type: 'completeEvent',
        eventId: expectedMapping.houseBeforeQuest as never,
      },
      { type: 'exitBuilding' },
    ],
  },
  houseAfterQuest: { 0: [{ type: 'exitBuilding' }] },
  houseAfterQuestAndPub: {
    13: [{ type: 'receiveItem', itemId: '53' }],
    16: [
      {
        type: 'completeEvent',
        eventId: expectedMapping.houseAfterQuestAndPub as never,
      },
      { type: 'exitBuilding' },
    ],
  },
  houseAfterQuestAndPub2: { 2: [{ type: 'exitBuilding' }] },
  pubBeforeQuest: {
    6: [
      {
        type: 'completeEvent',
        eventId: expectedMapping.pubBeforeQuest as never,
      },
      { type: 'exitBuilding' },
    ],
  },
  pubBeforeQuest2: { 0: [{ type: 'exitBuilding' }] },
  pubAfterQuest: {
    13: [{ type: 'receiveGold', amount: 1000 }],
    22: [
      {
        type: 'completeEvent',
        eventId: expectedMapping.pubAfterQuest as never,
      },
      { type: 'exitBuilding' },
    ],
  },
  pubAfterQuest2: { 0: [{ type: 'exitBuilding' }] },
  palaceBeforeQuest: { 0: [{ type: 'exitBuilding' }] },
  palaceAfterQuest: { 0: [{ type: 'exitBuilding' }] },
  itemShopBeforeQuest: { 0: [{ type: 'exitBuilding' }] },
  itemShopAfterQuest: {
    3: [
      { type: 'receiveItem', itemId: '4' },
      {
        type: 'completeEvent',
        eventId: expectedMapping.itemShopAfterQuest as never,
      },
    ],
  },
  shipyardBeforeQuest: { 2: [{ type: 'exitBuilding' }] },
  shipyardAfterQuest: {
    3: [
      { type: 'receiveShip', shipId: '6', name: 'Hermes II' },
      {
        type: 'completeEvent',
        eventId: expectedMapping.shipyardAfterQuest as never,
      },
      { type: 'exitBuilding' },
    ],
  },
  churchBeforeQuest: {
    4: [
      {
        type: 'completeEvent',
        eventId: expectedMapping.churchBeforeQuest as never,
      },
      { type: 'exitBuilding' },
    ],
  },
  churchBeforeQuest2: { 0: [{ type: 'exitBuilding' }] },
  churchAfterQuest: {
    20: [
      {
        type: 'completeEvent',
        eventId: expectedMapping.churchAfterQuest as never,
      },
      { type: 'addCompanion', characterId: 'enrico' as never },
    ],
  },
  churchAfterEnrico: {
    1: [{ type: 'receiveGold', amount: 1000 }],
    2: [
      {
        type: 'completeEvent',
        eventId: expectedMapping.churchAfterEnrico as never,
      },
    ],
  },
  harborBeforeQuest: { 1: [{ type: 'exitBuilding' }] },
  harborBeforeShip: { 0: [{ type: 'exitBuilding' }] },
  harborBeforeEnrico: { 1: [{ type: 'exitBuilding' }] },
  marketBeforeQuest: { 3: [{ type: 'exitBuilding' }] },
  marketAfterQuestBeforeShip: { 1: [{ type: 'exitBuilding' }] },
};

const effectsByPreviousMessage = (
  event: StoryEvent,
): Record<number, StoryEffect[]> => {
  let messageIndex = -1;
  return event.steps.reduce<Record<number, StoryEffect[]>>((effects, step) => {
    if (step.type === 'dialogue' || step.type === 'choice') messageIndex += 1;
    if (step.type === 'effect') {
      return { ...effects, [messageIndex]: step.effects };
    }
    return effects;
  }, {});
};

describe('immutable legacy Lisbon oracle', () => {
  test('was generated from every still-authoritative legacy transcript', () => {
    expect(Object.keys(legacyQuestData)).toEqual(legacyKeys);
    expect(Object.keys(legacyLisbonSnapshot.transcripts)).toEqual(legacyKeys);
    legacyKeys.forEach((key) => {
      expect(legacyQuestData[key].map(legacyPassiveMessage)).toEqual(
        legacyLisbonSnapshot.transcripts[key].map(snapshotPassiveMessage),
      );
    });
    expect(recursivelyContainsFunction(legacyLisbonSnapshot)).toBe(false);
  });
});

describe('João Lisbon opening declarative content', () => {
  test('maps each of the exact 36 legacy keys once', () => {
    expect(legacyToSemanticEvent).toEqual(expectedMapping);
    expect(Object.keys(legacyToSemanticEvent)).toEqual(legacyKeys);
    expect(new Set(Object.values(legacyToSemanticEvent)).size).toBe(36);
    legacyKeys.forEach((key) =>
      expect(eventById(expectedMapping[key])).toBeDefined(),
    );
  });

  test('preserves source text, positions, speakers, fades, and effect boundaries', () => {
    legacyKeys.forEach((key) => {
      const event = eventById(expectedMapping[key]);
      const legacyMessages = legacyLisbonSnapshot.transcripts[key];
      expect(migratedBodies(event)).toEqual(
        legacyMessages.map(({ body }) => normalizeTokens(body)),
      );

      const visibleSteps = event.steps.filter((step) => step.type !== 'effect');
      visibleSteps.forEach((step, index) => {
        const legacy = legacyMessages[index] as SnapshotMessage;
        if (step.type === 'dialogue') {
          expect(step.position).toBe(legacy.position);
          expect(step.speaker).toBe(
            legacy.characterId === undefined
              ? undefined
              : storyCharacters.find(
                  (character) =>
                    character.legacyCharacterId === legacy.characterId,
                )?.id,
          );
          expect(step.fadeBeforeNext).toBe(legacy.fadeBeforeNext);
        }
      });

      expect(effectsByPreviousMessage(event)).toEqual(
        expectedEffects[key] ?? {},
      );
    });
  });

  test('declares stable harbor choices and reproduces both legacy branches', () => {
    const harbor = eventById(expectedMapping.harborFinal);
    const choice = harbor.steps.find((step) => step.type === 'choice');
    if (!choice || choice.type !== 'choice')
      throw new Error('Missing harbor choice');

    expect(choice.options.map(({ id }) => id)).toEqual(['yes', 'no']);
    expect(choice.options.map(({ label }) => label)).toEqual(['Yes', 'No']);
    choice.options.forEach((option) => {
      if (option.id !== 'yes' && option.id !== 'no') {
        throw new Error(`Unexpected harbor choice ${option.id}`);
      }
      const expected = legacyLisbonSnapshot.harborFinalBranches[option.id];
      expect(
        option.steps
          .filter((step) => step.type === 'dialogue')
          .map((step) => normalizeTokens((step as { body: string }).body)),
      ).toEqual(expected.map(({ body }) => normalizeTokens(body)));
    });

    const yesEffects = choice.options[0].steps.filter(
      (step) => step.type === 'effect',
    );
    const noEffects = choice.options[1].steps.filter(
      (step) => step.type === 'effect',
    );
    expect(yesEffects).toEqual([
      {
        type: 'effect',
        effects: [
          { type: 'assignMate', characterId: 'rocco', role: 'firstMate' },
          { type: 'assignMate', characterId: 'enrico', role: 'bookKeeper' },
          { type: 'completeEvent', eventId: expectedMapping.harborFinal },
        ],
      },
    ]);
    expect(noEffects).toEqual([
      {
        type: 'effect',
        effects: [
          { type: 'completeEvent', eventId: expectedMapping.harborFinal },
        ],
      },
    ]);
  });

  test('uses only canonical speakers and contains no callback anywhere', () => {
    const characterIds = new Set(storyCharacters.map(({ id }) => id));
    lisbonOpeningEvents.forEach((event) => {
      flattenSteps(event.steps).forEach((step) => {
        if (step.type === 'dialogue' && step.speaker !== undefined) {
          expect(characterIds.has(step.speaker)).toBe(true);
        }
      });
    });
    expect(recursivelyContainsFunction(joaoLisbonOpening)).toBe(false);
  });

  test('preserves trigger gates, rule order, and per-building random candidates', () => {
    lisbonOpeningEvents.forEach((event) => {
      const conditions = conditionsOf(event.trigger);
      expect(conditions).toEqual(
        expect.arrayContaining([
          { type: 'atPort', portId: '1' },
          { type: 'stage', stage: 'building' },
          expect.objectContaining({ type: 'atBuilding' }),
        ]),
      );
    });

    const sceneEvents = (buildingId: string) =>
      lisbonOpeningEvents.filter((event) =>
        conditionsOf(event.trigger).some(
          (condition) =>
            condition.type === 'atBuilding' &&
            condition.buildingId === buildingId,
        ),
      );

    ['5', '7', '9'].forEach((buildingId) => {
      const ambient = sceneEvents(buildingId).filter(
        ({ repeat }) => repeat === 'random-ambient',
      );
      expect(ambient).toHaveLength(6);
      expect(ambient.slice(0, 3).map(({ priority }) => priority)).toEqual([
        10, 10, 10,
      ]);
      expect(ambient.slice(3).map(({ priority }) => priority)).toEqual([
        20, 20, 20,
      ]);
      expect(
        new Set(ambient.slice(0, 3).map(({ randomGroup }) => randomGroup)).size,
      ).toBe(1);
      expect(
        new Set(ambient.slice(3).map(({ randomGroup }) => randomGroup)).size,
      ).toBe(1);
      ambient.forEach((event) => {
        const effects = flattenSteps(event.steps).filter(
          (step) => step.type === 'effect',
        );
        const shouldExit =
          buildingId !== '5' && event.id.includes('ambient-before');
        const expectedAmbientEffects = shouldExit
          ? [{ type: 'effect', effects: [{ type: 'exitBuilding' }] }]
          : [];
        expect(effects).toEqual(expectedAmbientEffects);
      });
    });

    const prioritiesByBuilding = ['8', '2', '6', '10', '3', '11', '1', '4'].map(
      (buildingId) => [
        buildingId,
        sceneEvents(buildingId).map(({ priority }) => priority),
      ],
    );
    expect(prioritiesByBuilding).toEqual([
      ['8', [10, 20, 30, 40]],
      ['2', [10, 20, 30, 40, 50]],
      ['6', [10, 20]],
      ['10', [10, 20, 30]],
      ['3', [10, 20]],
      ['11', [10, 20, 30, 40, 50]],
      ['1', [10, 20]],
      ['4', [10, 20, 30, 40, 50, 60, 70]],
    ]);

    const farewellConditions = conditionsOf(
      eventById(expectedMapping.houseAfterQuestAndPub).trigger,
    );
    expect(farewellConditions).toContainEqual({
      type: 'timeWindow',
      min: 1320,
      max: 0,
    });
  });

  test('gives every once-only event exactly one legacy completion key', () => {
    const once = lisbonOpeningEvents.filter(({ repeat }) => repeat === 'once');
    expect(once.length).toBeGreaterThan(0);
    expect(
      once.every(
        ({ legacyCompletionKey }) => legacyCompletionKey !== undefined,
      ),
    ).toBe(true);
    expect(
      new Set(once.map(({ legacyCompletionKey }) => legacyCompletionKey)).size,
    ).toBe(once.length);
  });

  test('assembles canonical content and compiles a strict, diagnostic-free index', () => {
    expect(joaoLisbonOpening.arc.eventIds).toEqual(
      lisbonOpeningEvents.map(({ id }) => id),
    );
    expect(joaoLisbonOpening.events).toBe(lisbonOpeningEvents);
    expect(storyContentSource).toEqual({
      characters: storyCharacters,
      relationships: storyRelationships,
      arcs: [joaoLisbonOpening.arc],
      events: lisbonOpeningEvents,
    });
    expect(compiledStoryContent.diagnostics).toEqual([]);
    expect(compiledStoryContent.eventsById.size).toBe(
      lisbonOpeningEvents.length,
    );
    expect(compiledStoryContent.charactersById.size).toBe(
      storyCharacters.length,
    );
  });
});
