import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import { setLocale } from '../localization';
import { advanceQuestSession } from '../story/advanceSession';
import { compiledStoryContent } from '../story';
import { createStorySession, getStoryFrame } from '../story/core/runtime';
import { STAFF_RETURNED_EVENT_ID } from '../story/content/arcs/joao/massawa';
import { storyRuntimeActions } from '../story/storyRuntimeActions';
import { load, save } from '../state/saveLoad';
import state from '../state/state';
import updateInterface from '../state/updateInterface';
import { Interface } from './Interface';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('./global.css', () => ({}));
jest.mock('./port/Building', () => ({
  __esModule: true,
  default: () => <div data-test="building-stub" />,
}));
jest.mock('./Camera', () => ({ __esModule: true, default: () => null }));
jest.mock('./world/SeaStory', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./combat/Combat', () => ({ __esModule: true, default: () => null }));
jest.mock('./world/Provisions', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./world/Indicators', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./world/DiscoveryBanner', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./sound/Sound', () => ({ __esModule: true, default: () => null }));
jest.mock('./port/hooks/useFade', () => ({
  __esModule: true,
  default: () => ({ fade: false, onAnimationEnd: () => undefined }),
}));
jest.mock('../assets', () => ({
  __esModule: true,
  default: { images: () => ({ toDataURL: () => 'data:image/png;base64,' }) },
}));

const setBaseState = (): void => {
  state.portId = '75';
  state.buildingId = '8';
  state.timePassed = 100_000;
  state.dayAtSea = 0;
  state.gold = 1200;
  state.quests = [];
  state.items = [];
  state.mates = [{ sailorId: '1', role: 0 }];
  state.fame = { adventure: 30, pirate: 0, trade: 0 };
  state.marketPrices = {};
  state.usedShipsAtPort = {};
  state.savings = 0;
  state.debt = 0;
  state.discoveries = [];
  state.reportedDiscoveries = [];
  state.storyEventTimes = {};
  state.equipment = { weaponId: null, armorId: null };
  state.mateProgress = {};
  state.combatResults = {};
  state.activeCombat = null;
  state.fleets = {
    '1': {
      position: { x: 1154, y: 530 },
      ships: [
        {
          id: '6',
          name: 'Hermes II',
          crew: 10,
          durability: 30,
          cargo: [],
        },
      ],
    },
  };
};

const finishStaffHandIn = (): void => {
  const event = compiledStoryContent.eventsById.get(STAFF_RETURNED_EVENT_ID);
  if (!event) throw new Error('Missing Staff hand-in');
  let session = createStorySession(event);
  while (getStoryFrame(session)) {
    session = advanceQuestSession(session, storyRuntimeActions);
  }
};

const clickJournal = (container: HTMLElement): void => {
  const label = Array.from(container.querySelectorAll('div')).find(
    (element) => element.textContent === 'Journal',
  );
  if (!label) throw new Error('Missing Journal control');
  label.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

describe('Interface story progress notifications', () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale('en');
    setBaseState();
  });

  afterEach(() => jest.restoreAllMocks());

  test('the real Staff hand-in refreshes Massawa to Axum when every general scalar is unchanged', () => {
    state.storyEvents = ['joao.massawa.staff-received'];
    state.items = ['m3-staff-of-the-saint'];
    const scalarsBefore = {
      portId: state.portId,
      buildingId: state.buildingId,
      timePassed: state.timePassed,
      gold: state.gold,
    };
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(<Interface resolve={() => undefined} />));
    act(() => updateInterface.general(scalarsBefore));
    expect(container.querySelector('[data-test=portName]')?.textContent).toBe(
      'Massawa',
    );

    act(() => finishStaffHandIn());

    expect(state).toMatchObject(scalarsBefore);
    expect(state.storyEvents).toContain(STAFF_RETURNED_EVENT_ID);
    expect(container.querySelector('[data-test=portName]')?.textContent).toBe(
      'Axum',
    );
    act(() => root.unmount());
  });

  test('a real completed-to-incomplete load remounts the sidebar and removes the ending when Journal reopens', () => {
    state.storyEvents = [
      'joao.first-voyage.chapter-complete',
      'joao.conflict-and-growth.chapter-complete',
    ];
    save();
    state.storyEvents.push('joao.finale.homecoming');
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(<Interface resolve={() => undefined} />));
    act(() =>
      updateInterface.general({
        portId: state.portId,
        buildingId: state.buildingId,
        timePassed: state.timePassed,
        gold: state.gold,
      }),
    );

    act(() => clickJournal(container));
    expect(container.querySelector('[data-test=joaoEnding]')).not.toBeNull();
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });
    expect(container.querySelector('[data-test=questJournal]')).toBeNull();

    let loaded = false;
    act(() => {
      loaded = load();
    });
    expect(loaded).toBe(true);
    expect(container.querySelector('[data-test=questJournal]')).toBeNull();
    act(() => clickJournal(container));
    expect(container.querySelector('[data-test=questJournal]')).not.toBeNull();
    expect(container.querySelector('[data-test=joaoEnding]')).toBeNull();
    expect(container.textContent).toContain('Sail for five uninterrupted days');

    act(() => root.unmount());
  });
});
