import { legacyLisbonSnapshot } from '../../../../__fixtures__/legacyLisbonSnapshot';
import { storyCharacters } from '../../../characters';
import { storyRelationships } from '../../../relationships';
import { compiledStoryContent, storyContentSource } from '../../../..';
import type {
  StoryChoice,
  StoryCondition,
  StoryEffect,
  StoryEvent,
  StoryStep,
} from '../../../../core/types';
import { legacyToSemanticEvent } from '../../../../legacy/lisbonCompletionKeys';
import {
  joaoLisbonOpening,
  lisbonOpeningDialogue,
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

const expectDeepFrozen = (value: unknown): void => {
  if (!value || typeof value !== 'object') return;
  expect(Object.isFrozen(value)).toBe(true);
  Object.values(value).forEach(expectDeepFrozen);
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

type LegacyKey = typeof legacyKeys[number];
type NormalizedMessage = {
  body: string;
  position: number;
  characterId?: string;
  fadeBeforeNext?: true;
  completeQuest?: true;
  exitBuilding?: true;
  action?: string;
};

const semanticToLegacy = new Map<string, LegacyKey>(
  Object.entries(legacyToSemanticEvent).map(([key, eventId]) => [
    eventId,
    key as LegacyKey,
  ]),
);

const legacyKeyForEventId = (eventId: string): LegacyKey => {
  const semanticId = [...semanticToLegacy.keys()].find(
    (candidate) => eventId === candidate || eventId.startsWith(`${candidate}.`),
  );
  const key = semanticId && semanticToLegacy.get(semanticId);
  if (!key) throw new Error(`No legacy key for semantic event ${eventId}`);
  return key;
};

const legacyCharacterId = (speaker: string | undefined): string | undefined =>
  speaker === undefined
    ? undefined
    : storyCharacters.find(({ id }) => id === speaker)?.legacyCharacterId;

const callbackOperation = (effect: StoryEffect): string | null => {
  switch (effect.type) {
    case 'addCompanion':
      if (effect.characterId === 'rocco') return 'recruitRocco';
      if (effect.characterId === 'enrico') return 'recruitEnrico';
      return null;
    case 'receiveItem':
      return `buyItem(${effect.itemId}, true)`;
    case 'receiveGold':
      return `receiveGold(${effect.amount})`;
    case 'receiveShip':
      return effect.shipId === '6' && effect.name === 'Hermes II'
        ? 'receiveFirstShip'
        : null;
    case 'completeEvent':
    case 'assignMate':
    case 'exitBuilding':
    case 'setPort':
    case 'save':
      return null;
    default: {
      const exhaustive: never = effect;
      throw new Error(`Unhandled effect ${JSON.stringify(exhaustive)}`);
    }
  }
};

const splitAmbientExitExists = (key: LegacyKey): boolean => {
  const baseId = legacyToSemanticEvent[key];
  const variants = lisbonOpeningEvents.filter(
    ({ id }) => id === `${baseId}.bank` || id === `${baseId}.guild`,
  );
  const expectedBoundary =
    lisbonOpeningDialogue[key].filter(
      ({ type }) => type === 'dialogue' || type === 'choice',
    ).length - 1;
  return (
    variants.length === 2 &&
    variants.every(({ steps }) => {
      let messageIndex = -1;
      return steps.some((step) => {
        if (step.type === 'dialogue' || step.type === 'choice') {
          messageIndex += 1;
        }
        return (
          messageIndex === expectedBoundary &&
          step.type === 'effect' &&
          step.effects.some(({ type }) => type === 'exitBuilding')
        );
      });
    })
  );
};

const normalizeTranscript = (
  key: LegacyKey,
  steps: readonly StoryStep[],
): NormalizedMessage[] => {
  const messages: NormalizedMessage[] = [];
  steps.forEach((step) => {
    if (step.type === 'dialogue') {
      messages.push({
        body: step.body,
        position: step.position,
        ...(step.speaker === undefined
          ? {}
          : { characterId: legacyCharacterId(step.speaker) }),
        ...(step.fadeBeforeNext ? { fadeBeforeNext: true } : {}),
      });
      return;
    }
    if (step.type === 'choice') {
      messages.push({
        body: step.prompt,
        position: step.position,
        ...(step.speaker === undefined
          ? {}
          : { characterId: legacyCharacterId(step.speaker) }),
      });
      return;
    }
    const message = messages[messages.length - 1];
    if (!message) throw new Error(`Effect precedes transcript in ${key}`);
    step.effects.forEach((effect) => {
      if (effect.type === 'completeEvent') message.completeQuest = true;
      if (effect.type === 'exitBuilding') message.exitBuilding = true;
      const operation = callbackOperation(effect);
      if (operation) message.action = operation;
    });
  });

  if (
    key.startsWith('lodgeBankGuildBeforeQuestRandom') &&
    splitAmbientExitExists(key)
  ) {
    messages[messages.length - 1].action = 'exitBuildingIfNotLodge';
  }
  return messages;
};

const normalizeBranch = (choice: StoryChoice): NormalizedMessage[] => {
  const messages: NormalizedMessage[] = [];
  choice.steps.forEach((step) => {
    if (step.type === 'dialogue') {
      messages.push({
        body: step.body,
        position: step.position,
        ...(step.speaker === undefined
          ? {}
          : { characterId: legacyCharacterId(step.speaker) }),
        ...(step.fadeBeforeNext ? { fadeBeforeNext: true } : {}),
      });
    } else if (step.type === 'effect') {
      const terminal = messages[messages.length - 1];
      if (!terminal) {
        if (step.effects.some(({ type }) => type === 'completeEvent')) {
          throw new Error(`Completion precedes branch ${choice.id}`);
        }
        return;
      }
      if (step.effects.some(({ type }) => type === 'completeEvent')) {
        terminal.completeQuest = true;
      }
    }
  });
  return messages;
};

const normalizeRule = (events: readonly StoryEvent[]) => {
  const first = events[0];
  const conditions = conditionsOf(first.trigger);
  const building = conditions.find(({ type }) => type === 'atBuilding');
  if (!building || building.type !== 'atBuilding') {
    throw new Error(`Missing building condition for ${first.id}`);
  }
  const blockedBy = conditions.flatMap((condition): LegacyKey[] =>
    condition.type === 'not' && condition.condition.type === 'eventCompleted'
      ? [legacyKeyForEventId(condition.condition.eventId)]
      : [],
  );
  const requires = conditions.flatMap((condition): LegacyKey[] =>
    condition.type === 'eventCompleted'
      ? [legacyKeyForEventId(condition.eventId)]
      : [],
  );
  const time = conditions.find(({ type }) => type === 'timeWindow');
  const result = events.map(({ id }) => legacyKeyForEventId(id));
  return {
    building: building.buildingId,
    blockedBy,
    requires,
    timeWindow: time?.type === 'timeWindow' ? [time.min, time.max] : null,
    result: events.length === 1 ? result[0] : result,
  };
};

const normalizedRules = () => {
  const rules = [];
  for (let index = 0; index < lisbonOpeningEvents.length; index += 1) {
    const event = lisbonOpeningEvents[index];
    if (event.repeat !== 'random-ambient') {
      rules.push(normalizeRule([event]));
    } else {
      const group = lisbonOpeningEvents
        .slice(index)
        .filter(({ randomGroup }) => randomGroup === event.randomGroup);
      rules.push(normalizeRule(group));
      index += group.length - 1;
    }
  }
  return rules;
};

const normalizedOperations = () =>
  legacyKeys.flatMap((key) => {
    const event = eventById(legacyToSemanticEvent[key]);
    const transcript = normalizeTranscript(key, event.steps);
    const actionRows = transcript.flatMap((message, index) =>
      message.action
        ? [
            {
              key,
              callback: `messages[${index}].action`,
              operations: [message.action],
            },
          ]
        : [],
    );
    if (key !== 'harborFinal') return actionRows;
    const choiceIndex = event.steps.findIndex(({ type }) => type === 'choice');
    const choice = event.steps[choiceIndex];
    if (choice.type !== 'choice') throw new Error('Missing harbor choice');
    const choiceRows = choice.options.map((option) => {
      const effects = option.steps.flatMap((step) =>
        step.type === 'effect' ? step.effects : [],
      );
      const hasRoleIntents =
        option.id === 'yes' &&
        effects.some(
          (effect) =>
            effect.type === 'assignMate' &&
            effect.characterId === 'rocco' &&
            effect.role === 'firstMate',
        ) &&
        effects.some(
          (effect) =>
            effect.type === 'assignMate' &&
            effect.characterId === 'enrico' &&
            effect.role === 'bookKeeper',
        );
      return {
        key,
        callback: `messages[${choiceIndex}].confirm.${option.id}`,
        operations: [
          ...(hasRoleIntents ? ['assignFirstRoles'] : []),
          `append${option.id === 'yes' ? 'Yes' : 'No'}Transcript`,
        ],
      };
    });
    return [...actionRows, ...choiceRows];
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

  test('normalizes every main transcript back to the complete legacy oracle', () => {
    legacyKeys.forEach((key) => {
      const event = eventById(expectedMapping[key]);
      expect(
        normalizeTranscript(key, event.steps).map((message) => ({
          ...message,
          body: normalizeTokens(message.body),
        })),
      ).toEqual(
        legacyLisbonSnapshot.transcripts[key].map((message) => ({
          ...message,
          body: normalizeTokens(message.body),
        })),
      );
    });
  });

  test('declares stable harbor choices and reproduces both legacy branches', () => {
    const harbor = eventById(expectedMapping.harborFinal);
    const choice = harbor.steps.find((step) => step.type === 'choice');
    if (!choice || choice.type !== 'choice')
      throw new Error('Missing harbor choice');

    expect(choice.position).toBe(1);
    expect(choice.speaker).toBe('rocco');
    expect(choice.options.map(({ id }) => id)).toEqual(['yes', 'no']);
    expect(choice.options.map(({ label }) => label)).toEqual(['Yes', 'No']);
    choice.options.forEach((option) => {
      if (option.id !== 'yes' && option.id !== 'no') {
        throw new Error(`Unexpected harbor choice ${option.id}`);
      }
      const expected = legacyLisbonSnapshot.harborFinalBranches[option.id];
      expect(normalizeBranch(option)).toEqual(expected);
    });
  });

  test('derives every callback-boundary operation from declarative steps', () => {
    expect(normalizedOperations()).toEqual(legacyLisbonSnapshot.operations);
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

  test('deep-freezes shared dialogue and event content against mutation', () => {
    expectDeepFrozen(lisbonOpeningDialogue);
    expectDeepFrozen(lisbonOpeningEvents);

    const introduction = eventById(expectedMapping.houseBeforeQuest);
    const originalFirstStep = introduction.steps[0];
    expect(
      Reflect.set(introduction.steps, 0, {
        type: 'dialogue',
        body: 'mutated',
        position: 0,
      }),
    ).toBe(false);
    expect(introduction.steps[0]).toBe(originalFirstStep);
  });

  test('normalizes 48 events back to all 36 ordered legacy rule rows', () => {
    lisbonOpeningEvents.forEach((event) => {
      const conditions = conditionsOf(event.trigger);
      expect(conditions.filter(({ type }) => type === 'atPort')).toEqual([
        { type: 'atPort', portId: '1' },
      ]);
      expect(conditions.filter(({ type }) => type === 'stage')).toEqual([
        { type: 'stage', stage: 'building' },
      ]);
    });
    expect(normalizedRules()).toHaveLength(36);
    expect(normalizedRules()).toEqual(legacyLisbonSnapshot.rules);
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
