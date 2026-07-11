import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

import * as resolver from '../../story/core/resolver';
import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryEvent,
} from '../../story/core/types';
import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import useQuestStep from './useQuestStep';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../story/core/resolver', () => {
  const actual = jest.requireActual('../../story/core/resolver');
  return { ...actual, resolveStoryEvent: jest.fn(actual.resolveStoryEvent) };
});

const mockResolve = resolver.resolveStoryEvent as jest.MockedFunction<
  typeof resolver.resolveStoryEvent
>;

const joao = characterId('joao');
const rocco = characterId('rocco');

const event = (steps: StoryEvent['steps']): StoryEvent => ({
  id: storyEventId('test.hook-event'),
  arcId: storyArcId('test.hook-arc'),
  priority: 1,
  trigger: { type: 'atBuilding', buildingId: '4' },
  repeat: 'repeatable',
  steps,
});

let latest: ReturnType<typeof useQuestStep>;

function Harness() {
  latest = useQuestStep();
  return null;
}

const renderHarness = (): { root: Root; container: HTMLDivElement } => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<Harness />));
  return { root, container };
};

describe('useQuestStep React lifecycle', () => {
  beforeEach(() => {
    mockResolve.mockReset();
    state.portId = '1';
    state.buildingId = '4';
    state.timePassed = 600;
    state.gold = 0;
    state.items = [];
    state.quests = [];
    state.fleets = { '1': { position: undefined, ships: [] } };
    state.mates = [{ sailorId: '1', role: null }];
    state.port = {
      characters: () => ({ spawnNpcs: jest.fn(), despawnNpcs: jest.fn() }),
    } as unknown as typeof state.port;
    updateInterface.general = jest.fn();
    updateInterface.fade = jest.fn();
    window.localStorage.clear();
  });

  afterEach(() => jest.restoreAllMocks());

  test('resolves once across rerenders and returns null when no event resolves', () => {
    mockResolve.mockReturnValue(null);
    const { root } = renderHarness();

    act(() => root.render(<Harness />));

    expect(mockResolve).toHaveBeenCalledTimes(1);
    expect(latest).toBeNull();
    act(() => root.unmount());
  });

  test('projects the spoken choice into branch history and executes a stale confirmation once', () => {
    mockResolve.mockReturnValue(
      event([
        { type: 'dialogue', body: 'Before.', position: 2, speaker: joao },
        {
          type: 'choice',
          prompt: 'Rocco asks?',
          position: 1,
          speaker: rocco,
          options: [
            {
              id: 'yes',
              label: 'Yes',
              steps: [
                {
                  type: 'effect',
                  effects: [{ type: 'receiveGold', amount: 5 }],
                },
                {
                  type: 'dialogue',
                  body: 'João answers.',
                  position: 2,
                  speaker: joao,
                },
              ],
            },
            {
              id: 'no',
              label: 'No',
              steps: [
                { type: 'dialogue', body: 'No.', position: 2, speaker: joao },
              ],
            },
          ],
        },
      ]),
    );
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const { root } = renderHarness();
    act(() => latest?.messageBoxes[2]?.acknowledge?.());
    const staleYes = latest?.messageBoxes[1]?.confirm?.yes;
    expect(staleYes).toEqual(expect.any(Function));

    act(() => staleYes?.());

    expect(latest?.messageBoxes).toEqual([
      null,
      { body: '', characterId: rocco },
      {
        body: 'João answers.',
        characterId: joao,
        acknowledge: expect.any(Function),
      },
    ]);
    expect(state.gold).toBe(5);
    expect(setItem).toHaveBeenCalledTimes(1);
    act(() => staleYes?.());
    expect(state.gold).toBe(5);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(mockResolve).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
  });

  test('waits for fade, then exits once and returns null', () => {
    mockResolve.mockReturnValue(
      event([
        {
          type: 'dialogue',
          body: 'Fade first.',
          position: 2,
          speaker: joao,
          fadeBeforeNext: true,
        },
        { type: 'dialogue', body: 'Exit now.', position: 2, speaker: joao },
        { type: 'effect', effects: [{ type: 'exitBuilding' }] },
      ]),
    );
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const { root } = renderHarness();

    act(() => latest?.messageBoxes[2]?.acknowledge?.());
    expect(updateInterface.fade).toHaveBeenCalledTimes(1);
    expect(latest?.messageBoxes[2]).toMatchObject({ body: 'Fade first.' });
    expect(state.buildingId).toBe('4');
    const onFade = (updateInterface.fade as jest.Mock).mock.calls[0][0];
    act(() => onFade());
    expect(latest?.messageBoxes[2]).toMatchObject({ body: 'Exit now.' });

    const staleExit = latest?.messageBoxes[2]?.acknowledge;
    act(() => staleExit?.());
    act(() => staleExit?.());
    expect(state.buildingId).toBeNull();
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(latest).toBeNull();
    act(() => root.unmount());
  });
});
