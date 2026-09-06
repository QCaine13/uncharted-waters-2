import state from '../../../../../state/state';
import updateInterface from '../../../../../state/updateInterface';
import { compiledStoryContent, storyContentSource } from '../../../..';
import { advanceQuestSession } from '../../../../advanceSession';
import {
  createStoryContext,
  resolveStoryEvent,
} from '../../../../core/resolver';
import { createStorySession, getStoryFrame } from '../../../../core/runtime';
import type { StoryEvent } from '../../../../core/types';
import { storyRuntimeActions } from '../../../../storyRuntimeActions';
import {
  CHAPTER_COMPLETE_EVENT_ID,
  COMMISSION_ACCEPTED_EVENT_ID,
  DOMINGO_MET_EVENT_ID,
  DOMINGO_RECRUITED_EVENT_ID,
  FIRST_VOYAGE_ARC_ID,
  GIBRALTAR_DISCOVERY_ID,
  firstVoyageEvents,
} from '.';

const HARBOR_FINAL_EVENT_ID = 'joao.lisbon-opening.harbor-final';

const resolve = (): StoryEvent | null =>
  resolveStoryEvent(
    createStoryContext(state, compiledStoryContent),
    compiledStoryContent,
    (events) => events[0],
  );

const finish = (event: StoryEvent, choiceId?: 'yes' | 'no'): void => {
  let session = createStorySession(event);
  for (let guard = 0; guard < 20 && getStoryFrame(session); guard += 1) {
    const frame = getStoryFrame(session);
    session = advanceQuestSession(
      session,
      storyRuntimeActions,
      frame?.type === 'choice' ? choiceId : undefined,
    );
  }
  expect(getStoryFrame(session)).toBeNull();
};

describe('João first voyage chapter', () => {
  beforeEach(() => {
    window.localStorage.clear();
    state.portId = '1';
    state.buildingId = '7';
    state.dayAtSea = 0;
    state.timePassed = 600;
    state.gold = 100;
    state.quests = [];
    state.storyEvents = [HARBOR_FINAL_EVENT_ID];
    state.discoveries = [];
    state.reportedDiscoveries = [];
    state.items = [];
    state.mates = [{ sailorId: '1', role: 0 }];
    state.fame = { adventure: 0, pirate: 0, trade: 0 };
    updateInterface.general = jest.fn();
  });

  test('registers exactly the four public chapter events with valid priorities', () => {
    expect(String(FIRST_VOYAGE_ARC_ID)).toBe('joao.first-voyage');
    expect(firstVoyageEvents.map(({ id }) => String(id))).toEqual([
      'joao.first-voyage.commission-accepted',
      'joao.first-voyage.domingo-met',
      'joao.first-voyage.domingo-recruited',
      'joao.first-voyage.chapter-complete',
    ]);
    expect([
      COMMISSION_ACCEPTED_EVENT_ID,
      DOMINGO_MET_EVENT_ID,
      DOMINGO_RECRUITED_EVENT_ID,
      CHAPTER_COMPLETE_EVENT_ID,
    ]).toEqual(firstVoyageEvents.map(({ id }) => id));
    expect(storyContentSource.arcs.map(({ id }) => String(id))).toContain(
      'joao.first-voyage',
    );
    expect(compiledStoryContent.diagnostics).toEqual([]);
    expect(
      firstVoyageEvents
        .filter(({ trigger }) => {
          const text = JSON.stringify(trigger);
          return text.includes('"atBuilding","buildingId":"7"');
        })
        .map(({ priority }) => priority),
    ).toEqual([3, 2, 1]);
  });

  test('declining the commission leaves it available and accepting completes it', () => {
    const offer = resolve();
    expect(offer?.id).toBe(COMMISSION_ACCEPTED_EVENT_ID);
    expect(offer?.repeat).toBe('repeatable');

    finish(offer!, 'no');
    expect(state.storyEvents).not.toContain(COMMISSION_ACCEPTED_EVENT_ID);
    expect(resolve()?.id).toBe(COMMISSION_ACCEPTED_EVENT_ID);

    finish(resolve()!, 'yes');
    expect(state.storyEvents).toContain(COMMISSION_ACCEPTED_EVENT_ID);
    expect(resolve()?.id).not.toBe(COMMISSION_ACCEPTED_EVENT_ID);
  });

  test('meets Domingo after three consecutive sea days and records a refusal', () => {
    state.portId = null;
    state.buildingId = null;
    state.dayAtSea = 2;
    expect(resolve()).toBeNull();

    state.dayAtSea = 3;
    const meeting = resolve();
    expect(meeting?.id).toBe(DOMINGO_MET_EVENT_ID);
    expect(meeting?.repeat).toBe('once');
    finish(meeting!, 'no');

    expect(state.storyEvents).toContain(DOMINGO_MET_EVENT_ID);
    expect(state.storyEvents).not.toContain(DOMINGO_RECRUITED_EVENT_ID);
    expect(state.mates.map(({ sailorId }) => sailorId)).not.toContain('34');
    expect(resolve()).toBeNull();
  });

  test('lets a refused Domingo reconsider repeatedly at the Lisbon Guild', () => {
    state.storyEvents.push(DOMINGO_MET_EVENT_ID);
    const reconsider = resolve();
    expect(reconsider?.id).toBe(DOMINGO_RECRUITED_EVENT_ID);
    expect(reconsider?.repeat).toBe('repeatable');

    finish(reconsider!, 'no');
    expect(state.storyEvents).not.toContain(DOMINGO_RECRUITED_EVENT_ID);
    expect(resolve()?.id).toBe(DOMINGO_RECRUITED_EVENT_ID);

    finish(resolve()!, 'yes');
    expect(state.storyEvents).toContain(DOMINGO_RECRUITED_EVENT_ID);
    expect(state.mates.filter(({ sailorId }) => sailorId === '34')).toEqual([
      { sailorId: '34', role: null },
    ]);
  });

  test('accepting Domingo at sea completes both events and recruits him once', () => {
    state.portId = null;
    state.buildingId = null;
    state.dayAtSea = 3;

    finish(resolve()!, 'yes');

    expect(state.storyEvents).toEqual([
      HARBOR_FINAL_EVENT_ID,
      DOMINGO_MET_EVENT_ID,
      DOMINGO_RECRUITED_EVENT_ID,
    ]);
    expect(state.mates.filter(({ sailorId }) => sailorId === '34')).toEqual([
      { sailorId: '34', role: null },
    ]);
    expect(resolve()).toBeNull();
  });

  test.each([
    [
      'commission',
      [DOMINGO_RECRUITED_EVENT_ID],
      ['34'],
      [GIBRALTAR_DISCOVERY_ID],
    ],
    [
      'recruitment',
      [COMMISSION_ACCEPTED_EVENT_ID],
      ['34'],
      [GIBRALTAR_DISCOVERY_ID],
    ],
    [
      'companion',
      [COMMISSION_ACCEPTED_EVENT_ID, DOMINGO_RECRUITED_EVENT_ID],
      [],
      [GIBRALTAR_DISCOVERY_ID],
    ],
    [
      'Gibraltar report',
      [COMMISSION_ACCEPTED_EVENT_ID, DOMINGO_RECRUITED_EVENT_ID],
      ['34'],
      [],
    ],
  ])('does not finish without %s', (_missing, events, mateIds, reported) => {
    state.storyEvents.push(...events);
    state.mates.push(
      ...mateIds.map((sailorId) => ({ sailorId, role: null as null })),
    );
    state.reportedDiscoveries = reported;

    expect(resolve()?.id).not.toBe(CHAPTER_COMPLETE_EVENT_ID);
  });

  test('finishes with all prerequisites and grants the 500g reward once', () => {
    state.storyEvents.push(
      COMMISSION_ACCEPTED_EVENT_ID,
      DOMINGO_MET_EVENT_ID,
      DOMINGO_RECRUITED_EVENT_ID,
    );
    state.mates.push({ sailorId: '34', role: null });
    state.reportedDiscoveries = [GIBRALTAR_DISCOVERY_ID];
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    const completion = resolve();
    expect(completion?.id).toBe(CHAPTER_COMPLETE_EVENT_ID);
    finish(completion!);

    expect(state.gold).toBe(600);
    expect(state.storyEvents).toContain(CHAPTER_COMPLETE_EVENT_ID);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(resolve()?.id).not.toBe(CHAPTER_COMPLETE_EVENT_ID);
  });
});
