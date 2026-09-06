import { compiledStoryContent } from '.';
import { createStoryContext, resolveStoryEvent } from './core/resolver';
import { executeStoryEffects } from './core/effects';
import { legacyLisbonSnapshot } from './__fixtures__/legacyLisbonSnapshot';
import { legacyToSemanticEvent } from './legacy/lisbonCompletionKeys';
import { storyRuntimeActions } from './storyRuntimeActions';
import state, { SAVED_STATE_KEY } from '../state/state';
import { load, save } from '../state/saveLoad';
import { SAVE_VERSION } from '../state/saveMigrations';
import updateInterface from '../state/updateInterface';

const completedKeys = [
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
];

const fixture = (quests: string[], buildingId: string, timePassed = 600) => ({
  version: 2,
  portId: '1',
  buildingId,
  timePassed,
  fleets: { '1': { ships: [], position: undefined } },
  dayAtSea: 0,
  gold: 0,
  quests,
  usedShipsAtPort: {},
  savings: 0,
  debt: 0,
  items: [],
  mates: [{ sailorId: '1', role: null }],
  fame: { adventure: 0, pirate: 0, trade: 0 },
});

const legacyNext = (
  quests: readonly string[],
  buildingId: string | null,
  timePassed: number,
): string | null => {
  if (buildingId === null) return null;
  const minute = timePassed % 1440;
  const rule = legacyLisbonSnapshot.rules.find(
    (candidate) =>
      candidate.building === buildingId &&
      (candidate.blockedBy as readonly string[]).every(
        (key) => !quests.includes(key),
      ) &&
      (candidate.requires as readonly string[]).every((key) =>
        quests.includes(key),
      ) &&
      (candidate.timeWindow === null ||
        minute >= candidate.timeWindow[0] ||
        minute <= candidate.timeWindow[1]),
  );
  if (!rule) return null;
  const result = Array.isArray(rule.result) ? rule.result[0] : rule.result;
  return legacyToSemanticEvent[result as keyof typeof legacyToSemanticEvent];
};

describe('Save v2 Lisbon compatibility', () => {
  beforeEach(() => {
    updateInterface.general = jest.fn();
  });

  test.each([
    ['empty', fixture([], '8')],
    [
      'partial',
      fixture(
        ['houseBeforeQuest', 'pubAfterQuest', 'unknown.mod.quest'],
        '8',
        1320,
      ),
    ],
    ['complete', fixture([...completedKeys, 'unknown.mod.quest'], '4')],
  ] as const)(
    'loads, resolves, completes when applicable, and resaves %s progress',
    (_label, raw) => {
      window.localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(raw));
      expect(load()).toBe(true);
      const originalQuests = [...state.quests];
      const context = createStoryContext(state, compiledStoryContent);
      const event = resolveStoryEvent(
        context,
        compiledStoryContent,
        ([first]) => first,
      );
      expect(event?.id ?? null).toBe(
        legacyNext(originalQuests, state.buildingId, state.timePassed),
      );

      const completion = event?.steps
        .flatMap((step) => (step.type === 'effect' ? step.effects : []))
        .find(({ type }) => type === 'completeEvent');
      if (completion?.type === 'completeEvent') {
        executeStoryEffects([completion], storyRuntimeActions);
      } else {
        save();
      }

      const saved = JSON.parse(
        window.localStorage.getItem(SAVED_STATE_KEY) ?? '{}',
      );
      const expectedStoryEvents = new Set<string>(
        originalQuests.reduce<string[]>((eventIds, key) => {
          const id =
            legacyToSemanticEvent[key as keyof typeof legacyToSemanticEvent];
          if (id !== undefined) eventIds.push(id);
          return eventIds;
        }, []),
      );
      if (completion?.type === 'completeEvent') {
        expectedStoryEvents.add(completion.eventId);
      }
      expect(saved.version).toBe(SAVE_VERSION);
      expect(saved.quests.slice(0, originalQuests.length)).toEqual(
        originalQuests,
      );
      expect(saved.quests).not.toContain(event?.id);
      expect(saved.storyEvents).toEqual([...expectedStoryEvents]);
      const next = resolveStoryEvent(
        createStoryContext(state, compiledStoryContent),
        compiledStoryContent,
        ([first]) => first,
      );
      expect(next?.id ?? null).toBe(
        legacyNext(state.quests, state.buildingId, state.timePassed),
      );
    },
  );
});
