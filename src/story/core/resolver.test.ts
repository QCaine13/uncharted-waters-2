import type { ItemId } from '../../data/itemData';
import type { State } from '../../state/state';
import { compileStoryContent, sceneKey } from './registry';
import {
  characterId,
  legacyQuestId,
  storyArcId,
  storyEventId,
  type CompiledStoryContent,
  type StoryCondition,
  type StoryContentSource,
  type StoryContext,
  type StoryEvent,
} from './types';
import {
  conditionSatisfied,
  createStoryContext,
  resolveStoryEvent,
} from './resolver';

const joao = characterId('joao');
const rocco = characterId('rocco');
const opening = storyArcId('joao.lisbon-opening');

const context = (overrides: Partial<StoryContext> = {}): StoryContext => ({
  stage: 'building',
  portId: '1',
  buildingId: '8',
  timePassed: 0,
  dayAtSea: 0,
  completedEvents: new Set(),
  fame: { adventure: 0, pirate: 0, trade: 0 },
  items: new Set(),
  companions: new Set(),
  discoveries: new Set(),
  reportedDiscoveries: new Set(),
  combatResults: {},
  ...overrides,
});

const at = (timePassed: number): StoryContext => context({ timePassed });

const event = (
  id: string,
  priority: number,
  trigger: StoryCondition = { type: 'stage', stage: 'building' },
  repeat: StoryEvent['repeat'] = 'once',
  randomGroup?: string,
): StoryEvent => ({
  id: storyEventId(id),
  arcId: opening,
  priority,
  trigger,
  repeat,
  randomGroup,
  steps: [{ type: 'dialogue', body: id, position: 0 }],
});

const compiledWith = (
  entries: ReadonlyArray<readonly [string, readonly StoryEvent[]]>,
  events: readonly StoryEvent[],
): CompiledStoryContent => ({
  charactersById: new Map(),
  relationshipsByCharacter: new Map(),
  arcsById: new Map(),
  eventsById: new Map(events.map((candidate) => [candidate.id, candidate])),
  candidatesByScene: new Map(entries),
  eventByLegacyCompletionKey: new Map(),
  legacyCompletionKeyByEvent: new Map(),
  diagnostics: [],
});

describe('conditionSatisfied', () => {
  test('uses inclusive min, exclusive ordinary max, and inclusive midnight', () => {
    expect(
      conditionSatisfied({ type: 'timeWindow', min: 1320, max: 0 }, at(1320)),
    ).toBe(true);
    expect(
      conditionSatisfied({ type: 'timeWindow', min: 1320, max: 0 }, at(0)),
    ).toBe(true);
    expect(
      conditionSatisfied({ type: 'timeWindow', min: 1320, max: 0 }, at(600)),
    ).toBe(false);
    expect(
      conditionSatisfied({ type: 'timeWindow', min: 60, max: 120 }, at(60)),
    ).toBe(true);
    expect(
      conditionSatisfied({ type: 'timeWindow', min: 60, max: 120 }, at(120)),
    ).toBe(false);
    expect(
      conditionSatisfied({ type: 'timeWindow', min: 1320, max: 0 }, at(-120)),
    ).toBe(true);
  });

  test('normalizes multi-day ordinary windows', () => {
    expect(
      conditionSatisfied(
        { type: 'timeWindow', min: 60, max: 120 },
        at(3 * 1440 + 60),
      ),
    ).toBe(true);
    expect(
      conditionSatisfied(
        { type: 'timeWindow', min: 60, max: 120 },
        at(3 * 1440 + 120),
      ),
    ).toBe(false);
  });

  test('uses inclusive min and exclusive max for nonzero wrapping windows', () => {
    const wrapping = { type: 'timeWindow', min: 1320, max: 60 } as const;

    expect(conditionSatisfied(wrapping, at(2 * 1440 + 1320))).toBe(true);
    expect(conditionSatisfied(wrapping, at(2 * 1440))).toBe(true);
    expect(conditionSatisfied(wrapping, at(2 * 1440 + 59))).toBe(true);
    expect(conditionSatisfied(wrapping, at(2 * 1440 + 60))).toBe(false);
    expect(conditionSatisfied(wrapping, at(2 * 1440 + 600))).toBe(false);
  });

  test('checks inclusive elapsed-day bounds', () => {
    expect(
      conditionSatisfied({ type: 'daysElapsed', min: 3 }, at(3 * 1440)),
    ).toBe(true);
    expect(
      conditionSatisfied({ type: 'daysElapsed', max: 3 }, at(4 * 1440)),
    ).toBe(false);
  });

  test('checks fame thresholds exactly', () => {
    expect(
      conditionSatisfied(
        { type: 'fameAtLeast', fame: 'adventure', value: 1000 },
        context({ fame: { adventure: 999, pirate: 0, trade: 0 } }),
      ),
    ).toBe(false);
    expect(
      conditionSatisfied(
        { type: 'fameAtLeast', fame: 'adventure', value: 1000 },
        context({ fame: { adventure: 1000, pirate: 0, trade: 0 } }),
      ),
    ).toBe(true);
  });

  test('matches only recorded combat outcomes allowed by the condition', () => {
    const resolved = {
      type: 'combatResolved',
      encounterId: 'joao.m2.kahn-house',
      outcomes: ['victory', 'draw'],
    } as const;

    expect(
      conditionSatisfied(
        resolved,
        context({ combatResults: { 'joao.m2.kahn-house': 'draw' } }),
      ),
    ).toBe(true);
    expect(
      conditionSatisfied(
        resolved,
        context({ combatResults: { 'joao.m2.kahn-house': 'defeat' } }),
      ),
    ).toBe(false);
    expect(conditionSatisfied(resolved, context())).toBe(false);
  });

  test('evaluates boolean trees and every context membership predicate', () => {
    const completed = storyEventId('completed');
    const item = '1' as ItemId;
    const richContext = context({
      completedEvents: new Set([completed]),
      items: new Set([item]),
      companions: new Set([rocco]),
    });
    const conditions: StoryCondition[] = [
      { type: 'eventCompleted', eventId: completed },
      { type: 'atPort', portId: '1' },
      { type: 'atBuilding', buildingId: '8' },
      { type: 'stage', stage: 'building' },
      { type: 'hasItem', itemId: item },
      { type: 'hasCompanion', characterId: rocco },
    ];

    expect(conditionSatisfied({ type: 'all', conditions }, richContext)).toBe(
      true,
    );
    expect(
      conditionSatisfied(
        {
          type: 'any',
          conditions: [
            { type: 'atPort', portId: 'missing' },
            { type: 'atBuilding', buildingId: '8' },
          ],
        },
        richContext,
      ),
    ).toBe(true);
    expect(
      conditionSatisfied(
        { type: 'not', condition: { type: 'stage', stage: 'world' } },
        richContext,
      ),
    ).toBe(true);
    conditions.forEach((candidate) => {
      expect(conditionSatisfied(candidate, richContext)).toBe(true);
    });
  });

  test('returns false for unmet boolean and context membership predicates', () => {
    const missingEvent = storyEventId('missing');
    const missingItem = '2' as ItemId;
    const falseConditions: StoryCondition[] = [
      {
        type: 'all',
        conditions: [
          { type: 'atPort', portId: '1' },
          { type: 'atBuilding', buildingId: 'missing' },
        ],
      },
      {
        type: 'any',
        conditions: [
          { type: 'atPort', portId: 'missing' },
          { type: 'atBuilding', buildingId: 'missing' },
        ],
      },
      { type: 'not', condition: { type: 'atPort', portId: '1' } },
      { type: 'eventCompleted', eventId: missingEvent },
      { type: 'atPort', portId: 'missing' },
      { type: 'atBuilding', buildingId: 'missing' },
      { type: 'stage', stage: 'world' },
      { type: 'hasItem', itemId: missingItem },
      { type: 'hasCompanion', characterId: characterId('missing') },
    ];

    falseConditions.forEach((candidate) => {
      expect(conditionSatisfied(candidate, context())).toBe(false);
    });
  });
});

describe('resolveStoryEvent', () => {
  test('returns null when no scene candidate matches', () => {
    const candidate = event('only-world', 10, {
      type: 'stage',
      stage: 'world',
    });
    const content = compiledWith([['world:-:-', [candidate]]], [candidate]);

    expect(
      resolveStoryEvent(context(), content, ([first]) => first),
    ).toBeNull();
  });

  test('combines exact and wildcard candidates, de-duplicates, and sorts by priority', () => {
    const exact = event('exact', 20);
    const wildcard = event('wildcard', 10);
    const content = compiledWith(
      [
        [sceneKey('building', '1', '8'), [exact, wildcard]],
        ['-:-:-', [wildcard]],
      ],
      [exact, wildcard],
    );

    expect(resolveStoryEvent(context(), content, ([first]) => first)).toBe(
      wildcard,
    );
  });

  test('uses event ID as the stable tie-breaker', () => {
    const later = event('z-event', 10);
    const earlier = event('a-event', 10);
    const content = compiledWith(
      [[sceneKey('building', '1', '8'), [later, earlier]]],
      [later, earlier],
    );

    expect(resolveStoryEvent(context(), content, ([first]) => first)).toBe(
      earlier,
    );
  });

  test('uses locale-independent lexical event ID ordering', () => {
    const lowerCodeUnit = event('Z-event', 10);
    const localePreferred = event('a-event', 10);
    const content = compiledWith(
      [[sceneKey('building', '1', '8'), [localePreferred, lowerCodeUnit]]],
      [localePreferred, lowerCodeUnit],
    );

    expect(resolveStoryEvent(context(), content, ([first]) => first)).toBe(
      lowerCodeUnit,
    );
  });

  test('excludes completed once events but retains repeatable events', () => {
    const once = event('once', 10);
    const repeatable = event('repeatable', 20, undefined, 'repeatable');
    const content = compiledWith(
      [[sceneKey('building', '1', '8'), [once, repeatable]]],
      [once, repeatable],
    );
    const completedContext = context({
      completedEvents: new Set([once.id, repeatable.id]),
    });

    expect(
      resolveStoryEvent(completedContext, content, ([first]) => first),
    ).toBe(repeatable);
  });

  test('passes a stable random-ambient group to the injected selector', () => {
    const second = event(
      'ambient-b',
      10,
      undefined,
      'random-ambient',
      'greeting',
    );
    const first = event(
      'ambient-a',
      10,
      undefined,
      'random-ambient',
      'greeting',
    );
    const otherGroup = event(
      'ambient-other',
      10,
      undefined,
      'random-ambient',
      'other',
    );
    const chooseRandom = jest.fn(
      (candidates: readonly StoryEvent[]) => candidates[candidates.length - 1],
    );
    const content = compiledWith(
      [[sceneKey('building', '1', '8'), [second, otherGroup, first]]],
      [second, otherGroup, first],
    );

    expect(resolveStoryEvent(context(), content, chooseRandom)).toBe(second);
    expect(chooseRandom).toHaveBeenCalledWith([first, second]);
  });

  test('collects candidates from all eight exact and wildcard scene slots', () => {
    const keys = [
      'building:1:8',
      'building:1:-',
      'building:-:8',
      'building:-:-',
      '-:1:8',
      '-:1:-',
      '-:-:8',
      '-:-:-',
    ];
    const candidates = keys.map((_, index) =>
      event(`slot-${index}`, 10, undefined, 'random-ambient', 'all-slots'),
    );
    const content = compiledWith(
      keys.map((key, index) => [key, [candidates[index]]]),
      candidates,
    );
    const chooseRandom = jest.fn(
      (eligible: readonly StoryEvent[]) => eligible[0],
    );

    expect(resolveStoryEvent(context(), content, chooseRandom)).toBe(
      candidates[0],
    );
    expect(chooseRandom).toHaveBeenCalledWith(candidates);
  });

  test('returns null when the random selector returns undefined', () => {
    const ambient = event(
      'ambient',
      10,
      undefined,
      'random-ambient',
      'greeting',
    );
    const content = compiledWith(
      [[sceneKey('building', '1', '8'), [ambient]]],
      [ambient],
    );

    expect(resolveStoryEvent(context(), content, () => undefined)).toBeNull();
  });

  test('returns an outranking deterministic event without invoking randomness', () => {
    const deterministic = event('deterministic', 5);
    const ambient = event(
      'ambient',
      10,
      undefined,
      'random-ambient',
      'greeting',
    );
    const chooseRandom = jest.fn(
      (eligible: readonly StoryEvent[]) => eligible[0],
    );
    const content = compiledWith(
      [[sceneKey('building', '1', '8'), [ambient, deterministic]]],
      [ambient, deterministic],
    );

    expect(resolveStoryEvent(context(), content, chooseRandom)).toBe(
      deterministic,
    );
    expect(chooseRandom).not.toHaveBeenCalled();
  });

  test('does not mutate context, content, or indexed candidate arrays', () => {
    const later = event('later', 20);
    const earlier = event('earlier', 10);
    const candidates = [later, earlier];
    const content = compiledWith(
      [[sceneKey('building', '1', '8'), candidates]],
      candidates,
    );
    const current = context();
    const beforeContext = JSON.stringify({
      ...current,
      completedEvents: [...current.completedEvents],
      items: [...current.items],
      companions: [...current.companions],
    });
    const beforeCandidates = [...candidates];

    resolveStoryEvent(current, content, ([first]) => first);

    expect(candidates).toEqual(beforeCandidates);
    expect(content.candidatesByScene.get('building:1:8')).toBe(candidates);
    expect(
      JSON.stringify({
        ...current,
        completedEvents: [...current.completedEvents],
        items: [...current.items],
        companions: [...current.companions],
      }),
    ).toBe(beforeContext);
  });
});

describe('createStoryContext', () => {
  const source = (): StoryContentSource => {
    const introduction = event('joao.lisbon-opening.house-introduction', 10);
    introduction.legacyCompletionKey = legacyQuestId('houseBeforeQuest');
    return {
      characters: [
        {
          id: joao,
          names: { en: 'João' },
          role: 'protagonist',
          dialogueStyle: { color: 'blue' },
          sailorId: '1',
        },
        {
          id: rocco,
          names: { en: 'Rocco' },
          role: 'companion',
          dialogueStyle: { color: 'green' },
          sailorId: '19',
        },
      ],
      relationships: [],
      arcs: [
        {
          id: opening,
          protagonist: joao,
          title: 'Opening',
          eventIds: [introduction.id],
        },
      ],
      events: [introduction],
    };
  };

  test.each([
    [{ portId: null, buildingId: null }, 'world'],
    [{ portId: '1', buildingId: null }, 'port'],
    [{ portId: '1', buildingId: '8' }, 'building'],
  ] as const)('derives the %s application stage as %s', (location, stage) => {
    const state = {
      ...location,
      timePassed: 123,
      quests: [],
      items: [],
      mates: [],
      fame: { adventure: 1, pirate: 2, trade: 3 },
    } as unknown as State;

    expect(
      createStoryContext(state, compileStoryContent(source(), 'strict')).stage,
    ).toBe(stage);
  });

  test('maps State completion keys, items, mates, fame, and time into pure sets', () => {
    const content = compileStoryContent(source(), 'strict');
    const state = {
      portId: '1',
      buildingId: '8',
      timePassed: 321,
      dayAtSea: 7,
      quests: ['houseBeforeQuest', 'unknownQuest'],
      storyEvents: ['future.event'],
      storyEventTimes: { 'future.event': 300 },
      fleets: { '1': { position: { x: 600, y: 645 }, ships: [] } },
      items: ['1'],
      mates: [
        { sailorId: '19', role: null },
        { sailorId: 'unknown', role: null },
      ],
      fame: { adventure: 4, pirate: 5, trade: 6 },
      discoveries: ['strait-of-gibraltar'],
      reportedDiscoveries: ['strait-of-gibraltar'],
      combatResults: {
        'joao.m2.kahn-house': 'victory',
        'future.encounter': 'retreat',
      },
    } as unknown as State;

    const result = createStoryContext(state, content);

    expect(result.completedEvents).toEqual(
      new Set([
        storyEventId('future.event'),
        storyEventId('joao.lisbon-opening.house-introduction'),
      ]),
    );
    expect(result.storyEventTimes).toEqual({ 'future.event': 300 });
    expect(result.storyEventTimes).not.toBe(state.storyEventTimes);
    expect(result.worldPosition).toEqual({ x: 600, y: 645 });
    expect(result.worldPosition).not.toBe(state.fleets['1'].position);
    expect(result.items).toEqual(new Set(['1']));
    expect(result.companions).toEqual(new Set([rocco]));
    expect(result.fame).toEqual(state.fame);
    expect(result.timePassed).toBe(321);
    expect(result.dayAtSea).toBe(7);
    expect(result.discoveries).toEqual(new Set(['strait-of-gibraltar']));
    expect(result.reportedDiscoveries).toEqual(
      new Set(['strait-of-gibraltar']),
    );
    expect(result.combatResults).toEqual({
      'joao.m2.kahn-house': 'victory',
      'future.encounter': 'retreat',
    });
    expect(result.combatResults).not.toBe(state.combatResults);
    expect(state.storyEventTimes).toEqual({ 'future.event': 300 });
    expect(state.fleets['1'].position).toEqual({ x: 600, y: 645 });
  });

  test('defaults combat results for contexts created from older state shapes', () => {
    const content = compileStoryContent(source(), 'strict');
    const oldState = {
      portId: '1',
      buildingId: null,
      timePassed: 0,
      quests: [],
      items: [],
      mates: [],
      fame: { adventure: 0, pirate: 0, trade: 0 },
    } as unknown as State;

    expect(createStoryContext(oldState, content).combatResults).toEqual({});
    expect(createStoryContext(oldState, content).storyEventTimes).toEqual({});
    expect(createStoryContext(oldState, content).worldPosition).toBeUndefined();
  });
});
