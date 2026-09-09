import React, { useEffect } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { notifyCombatChanged } from '../combat/combatEvents';
import type { DuelState } from '../combat/types';
import state from '../state/state';
import updateInterface from '../state/updateInterface';
import { Interface } from './Interface';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let mockBuildingMounts = 0;
jest.mock('./global.css', () => ({}));
jest.mock('./port/Building', () => ({
  __esModule: true,
  default: () => {
    useEffect(() => {
      mockBuildingMounts += 1;
    }, []);
    return <div data-test="building-stub" />;
  },
}));
jest.mock('./Camera', () => ({
  __esModule: true,
  default: () => <div data-test="camera-stub" />,
}));
jest.mock('./world/SeaStory', () => ({
  __esModule: true,
  default: () => <div data-test="sea-story-stub" />,
}));
jest.mock('./combat/Combat', () => ({
  __esModule: true,
  default: () => (state.activeCombat ? <div data-test="combat-stub" /> : null),
}));
jest.mock('./Left', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock('./Right', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock('./port/PortInfo', () => ({ __esModule: true, default: () => null }));
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
jest.mock('./port/hooks/useFade', () => ({
  __esModule: true,
  default: () => ({ fade: false, onAnimationEnd: () => undefined }),
}));

const duel = {
  kind: 'duel',
  encounterId: 'joao.m2.kahn-shipyard',
  revision: 0,
  round: 1,
  outcome: null,
  log: [],
  phase: 'attack',
  player: {
    hp: 82,
    maxHp: 82,
    stats: {
      swordplay: 82,
      level: 1,
      weaponRating: 0,
      armorRating: 0,
      weaponCategory: null,
    },
  },
  enemy: {
    hp: 84,
    maxHp: 84,
    stats: {
      swordplay: 66,
      level: 2,
      weaponRating: 10,
      armorRating: 0,
      weaponCategory: null,
    },
  },
  enemyDefense: 'parry',
  enemyAttack: 'thrust',
} as DuelState;

test('combat keeps the camera mounted, removes background handlers, and remounts the building after resolution', () => {
  mockBuildingMounts = 0;
  state.activeCombat = null;
  notifyCombatChanged();
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<Interface resolve={() => undefined} />));
  act(() =>
    updateInterface.general({
      portId: '1',
      buildingId: '3',
      timePassed: 0,
      gold: 0,
    }),
  );
  expect(container.querySelector('[data-test=building-stub]')).not.toBeNull();
  expect(mockBuildingMounts).toBe(1);

  state.activeCombat = duel;
  act(() => notifyCombatChanged());
  expect(container.querySelector('[data-test=camera-stub]')).not.toBeNull();
  expect(container.querySelector('[data-test=combat-stub]')).not.toBeNull();
  expect(container.querySelector('[data-test=building-stub]')).toBeNull();

  state.activeCombat = null;
  act(() => notifyCombatChanged(true));
  expect(container.querySelector('[data-test=combat-stub]')).toBeNull();
  expect(container.querySelector('[data-test=building-stub]')).not.toBeNull();
  expect(mockBuildingMounts).toBe(2);

  act(() => root.unmount());
  container.remove();
});

test('combat removes and then restores sea-story input UI at sea', () => {
  state.activeCombat = null;
  notifyCombatChanged();
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<Interface resolve={() => undefined} />));
  act(() =>
    updateInterface.general({
      portId: null,
      buildingId: null,
      timePassed: 0,
      gold: 0,
    }),
  );
  expect(container.querySelector('[data-test=sea-story-stub]')).not.toBeNull();

  state.activeCombat = duel;
  act(() => notifyCombatChanged());
  expect(container.querySelector('[data-test=sea-story-stub]')).toBeNull();

  state.activeCombat = null;
  act(() => notifyCombatChanged(true));
  expect(container.querySelector('[data-test=sea-story-stub]')).not.toBeNull();

  act(() => root.unmount());
  container.remove();
});
