import state from '../state/state';
import { load, save } from '../state/saveLoad';
import updateInterface from '../state/updateInterface';
import Input from '../input';
import {
  advanceSeaStory,
  clearSeaStory,
  getSeaStorySession,
  startSeaStory,
} from './seaStory';

// Inject declarative content at the content boundary. Registry compilation,
// singleton controller, state effects, serialization and load notifications
// are all the production implementations.
jest.mock('./content', () => {
  const actual = jest.requireActual('./content');
  return {
    ...actual,
    storyContentSource: {
      ...actual.storyContentSource,
      arcs: [
        ...actual.storyContentSource.arcs,
        {
          id: 'test.load',
          protagonist: 'joao',
          title: 'Load fixture',
          eventIds: ['test.load.encounter'],
        },
      ],
      events: [
        ...actual.storyContentSource.events,
        {
          id: 'test.load.encounter',
          arcId: 'test.load',
          priority: 0,
          repeat: 'once',
          trigger: { type: 'stage', stage: 'world' },
          steps: [
            { type: 'dialogue', position: 0, body: 'Finish this encounter.' },
            {
              type: 'effect',
              effects: [
                { type: 'receiveGold', amount: 5 },
                { type: 'completeEvent', eventId: 'test.load.encounter' },
              ],
            },
          ],
        },
      ],
    },
  };
});

beforeEach(() => {
  clearSeaStory();
  state.portId = null;
  state.buildingId = null;
  state.quests = [];
  state.storyEvents = [];
  state.discoveries = [];
  state.reportedDiscoveries = [];
  state.gold = 0;
  updateInterface.general = () => {};
  window.localStorage.clear();
});
afterEach(() => clearSeaStory());

test('a real load clears the singleton cursor, rejects its stale button and resumes an unpaid scene', () => {
  save();
  expect(startSeaStory()).toBe(true);
  const stale = getSeaStorySession()!;
  expect(Input.isSuspended('story')).toBe(true);
  expect(load()).toBe(true);
  expect(getSeaStorySession()).toBeNull();
  expect(Input.isSuspended('story')).toBe(false);
  expect(startSeaStory()).toBe(true);
  const restarted = getSeaStorySession()!;
  expect(restarted).not.toBe(stale);
  advanceSeaStory(stale);
  expect(state.gold).toBe(0);
  advanceSeaStory(restarted);
  expect(state.gold).toBe(5);
  expect(getSeaStorySession()).toBeNull();
  expect(load()).toBe(true);
  expect(startSeaStory()).toBe(false);
  expect(state.gold).toBe(5);
  expect(state.storyEvents).toEqual(['test.load.encounter']);
});

test('a failed load leaves the active scene intact', () => {
  startSeaStory();
  const current = getSeaStorySession();
  window.localStorage.setItem('savedState', 'invalid-json');
  expect(load()).toBe(false);
  expect(getSeaStorySession()).toBe(current);
  expect(Input.isSuspended('story')).toBe(true);
});
