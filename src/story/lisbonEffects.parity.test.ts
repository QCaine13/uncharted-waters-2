import { legacyLisbonSnapshot } from './__fixtures__/legacyLisbonSnapshot';
import {
  legacyToSemanticEvent,
  lisbonOpeningEvents,
} from './content/arcs/joao/lisbon-opening';
import { executeStoryEffects } from './core/effects';
import { createStorySession, getStoryFrame } from './core/runtime';
import type { StoryStep } from './core/types';
import { storyRuntimeActions } from './storyRuntimeActions';
import { advanceQuestSession } from '../interface/quest/useQuestStep';
import { load } from '../state/saveLoad';
import state from '../state/state';
import updateInterface from '../state/updateInterface';

type LegacyKey = keyof typeof legacyToSemanticEvent;

const keyFor = (id: string): LegacyKey => {
  const found = (
    Object.entries(legacyToSemanticEvent) as Array<[LegacyKey, string]>
  ).find(([, semantic]) => id === semantic || id.startsWith(`${semantic}.`));
  if (!found) throw new Error(`missing legacy key ${id}`);
  return found[0];
};

const buildingFor = (event: typeof lisbonOpeningEvents[number]): string => {
  const result = JSON.stringify(event.trigger).match(
    /"atBuilding","buildingId":"(\d+)"/,
  )?.[1];
  if (!result) throw new Error(`missing building ${event.id}`);
  return result;
};

const resetState = (buildingId = '4'): void => {
  state.portId = '1';
  state.buildingId = buildingId;
  state.timePassed = 600;
  state.gold = 100;
  state.items = [];
  state.quests = [];
  state.fleets = { '1': { position: undefined, ships: [] } };
  state.mates = [
    { sailorId: '1', role: null },
    { sailorId: '32', role: Number.NaN },
    { sailorId: '33', role: Number.NaN },
  ];
  state.port = {
    characters: () => ({ spawnNpcs: jest.fn(), despawnNpcs: jest.fn() }),
  } as unknown as typeof state.port;
  updateInterface.general = jest.fn();
  window.localStorage.clear();
};

const effectSteps = (steps: readonly StoryStep[]): StoryStep[] =>
  steps.flatMap((step) => {
    if (step.type === 'choice') {
      return step.options.flatMap((option) => effectSteps(option.steps));
    }
    return step.type === 'effect' ? [step] : [];
  });

type Oracle = {
  gold: number;
  items: string[];
  mates: Array<{ sailorId: string; role: unknown }>;
  fleets: Record<
    string,
    { position: undefined; ships: Array<Record<string, unknown>> }
  >;
  quests: string[];
  buildingId: string | null;
};

const oracle = (buildingId: string): Oracle => ({
  gold: 100,
  items: [],
  mates: [
    { sailorId: '1', role: null },
    { sailorId: '32', role: Number.NaN },
    { sailorId: '33', role: Number.NaN },
  ],
  fleets: { '1': { position: undefined, ships: [] } },
  quests: [],
  buildingId,
});

const applyAction = (
  target: Oracle,
  action: string,
  building: string,
): void => {
  const result = target;
  if (action === 'recruitRocco')
    target.mates.push({ sailorId: '32', role: null });
  else if (action === 'recruitEnrico')
    target.mates.push({ sailorId: '33', role: null });
  else if (action === 'receiveFirstShip') {
    target.fleets['1'].ships.push({
      id: '6',
      name: 'Hermes II',
      crew: 0,
      cargo: [],
      durability: 25,
    });
    const mate = target.mates.find(
      ({ role }) => role === null || Number.isNaN(role),
    );
    if (mate) mate.role = 0;
  } else if (action === 'exitBuildingIfNotLodge') {
    if (building !== '5') result.buildingId = null;
  } else {
    const item = /^buyItem\(([^,]+), true\)$/.exec(action);
    const gold = /^receiveGold\((\d+)\)$/.exec(action);
    if (item) target.items.push(item[1]);
    else if (gold) result.gold += Number(gold[1]);
    else throw new Error(`unknown oracle action ${action}`);
  }
};

const expectedForEvent = (key: LegacyKey, building: string): Oracle => {
  const expected = oracle(building);
  legacyLisbonSnapshot.transcripts[key].forEach((message) => {
    if ('action' in message) applyAction(expected, message.action, building);
    if ('completeQuest' in message) expected.quests.push(key);
    if ('exitBuilding' in message) expected.buildingId = null;
  });
  return expected;
};

const relevantState = () => ({
  gold: state.gold,
  items: state.items,
  mates: state.mates,
  fleets: state.fleets,
  quests: state.quests,
  buildingId: state.buildingId,
});

const harborSessionAtChoice = () => {
  const event = lisbonOpeningEvents.find(
    ({ id }) => id === legacyToSemanticEvent.harborFinal,
  );
  if (!event) throw new Error('missing harbor final');
  let session = createStorySession(event);
  while (getStoryFrame(session)?.type === 'dialogue') {
    session = advanceQuestSession(session, storyRuntimeActions);
  }
  return session;
};

describe('Lisbon production effect parity', () => {
  beforeEach(() => jest.spyOn(Math, 'random').mockReturnValue(0));
  afterEach(() => jest.restoreAllMocks());

  test('executes all 48 events to the exact legacy final state', () => {
    lisbonOpeningEvents.forEach((event) => {
      const building = buildingFor(event);
      resetState(building);
      event.steps.forEach((step) => {
        if (step.type === 'effect') {
          expect(
            executeStoryEffects(step.effects, storyRuntimeActions).ok,
          ).toBe(true);
        }
      });
      expect(relevantState()).toEqual(
        expectedForEvent(keyFor(event.id), building),
      );
    });
  });

  test('executes both harbor branches to the exact legacy final state', () => {
    const event = lisbonOpeningEvents.find(
      ({ id }) => id === legacyToSemanticEvent.harborFinal,
    );
    const choice = event?.steps.find(({ type }) => type === 'choice');
    if (!choice || choice.type !== 'choice')
      throw new Error('missing harbor choice');
    choice.options.forEach((option) => {
      resetState('4');
      effectSteps(option.steps).forEach((step) => {
        if (step.type === 'effect')
          executeStoryEffects(step.effects, storyRuntimeActions);
      });
      const expected = oracle('4');
      if (option.id === 'yes') {
        expected.mates[1].role = 'firstMate';
        expected.mates[2].role = 'bookKeeper';
      }
      expected.quests.push('harborFinal');
      expect(relevantState()).toEqual(expected);
    });
  });

  test('preserves the oracle Yes/No save boundaries and mid-branch reload state', () => {
    resetState('4');
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    let yesSession = advanceQuestSession(
      harborSessionAtChoice(),
      storyRuntimeActions,
      'yes',
    );

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(state.mates.slice(1).map(({ role }) => role)).toEqual([
      'firstMate',
      'bookKeeper',
    ]);
    expect(state.quests).toEqual([]);
    state.mates[1].role = Number.NaN;
    state.mates[2].role = Number.NaN;
    state.quests = ['harborFinal'];
    expect(load()).toBe(true);
    expect(state.mates.slice(1).map(({ role }) => role)).toEqual([
      'firstMate',
      'bookKeeper',
    ]);
    expect(state.quests).toEqual([]);

    setItem.mockClear();
    while (getStoryFrame(yesSession) !== null) {
      yesSession = advanceQuestSession(yesSession, storyRuntimeActions);
    }
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(state.quests).toEqual(['harborFinal']);

    resetState('4');
    setItem.mockClear();
    let noSession = advanceQuestSession(
      harborSessionAtChoice(),
      storyRuntimeActions,
      'no',
    );
    expect(setItem).not.toHaveBeenCalled();
    while (getStoryFrame(noSession) !== null) {
      noSession = advanceQuestSession(noSession, storyRuntimeActions);
    }
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(state.quests).toEqual(['harborFinal']);
  });

  test('writes storage once for every migrated nonempty effect step and branch', () => {
    const groups = lisbonOpeningEvents.flatMap((event) =>
      effectSteps(event.steps),
    );
    expect(groups).toHaveLength(35);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    groups.forEach((step) => {
      if (step.type !== 'effect') throw new Error('expected effect');
      resetState();
      setItem.mockClear();
      expect(executeStoryEffects(step.effects, storyRuntimeActions).ok).toBe(
        true,
      );
      expect(setItem).toHaveBeenCalledTimes(1);
    });
  });
});
