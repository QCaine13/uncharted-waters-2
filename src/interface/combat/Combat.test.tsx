import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { createDuel } from '../../combat/duel';
import { createNaval } from '../../combat/naval';
import {
  notifyCombatChanged,
  getCombatSnapshot,
} from '../../combat/combatEvents';
import { encounterCatalog } from '../../combat/encounters';
import type { NavalState } from '../../combat/types';
import Input from '../../input';
import { setLocale } from '../../localization';
import state from '../../state/state';
import { startCombatWithoutSave } from '../../state/actionsCombat';
import Popover from '../common/Popover';
import System from '../System';
import Combat from './Combat';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

let root: Root;
let container: HTMLDivElement;

const playerDuel = {
  swordplay: 82,
  level: 1,
  weaponRating: 15,
  armorRating: 10,
  weaponCategory: '2' as const,
};

const click = (label: string) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent === label,
  );
  expect(button).toBeDefined();
  act(() => button!.click());
};

beforeEach(() => {
  setLocale('en');
  state.activeCombat = null;
  notifyCombatChanged();
  state.items = ['4', '17'];
  state.equipment = { weaponId: '4', armorId: '17' };
  state.mateProgress = {};
  state.combatResults = {};
  state.mates = [
    { sailorId: '1', role: 0 },
    { sailorId: '32', role: 'firstMate' },
  ];
  state.fleets = {
    '1': {
      position: undefined,
      ships: [
        {
          id: '6',
          name: 'Esperanza',
          crew: 20,
          durability: 30,
          cargo: [
            { type: 'shot', quantity: 4 },
            { type: 'lumber', quantity: 2 },
          ],
        },
      ],
    },
  };
  localStorage.clear();
  localStorage.setItem('uw2.locale', 'en');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  state.activeCombat = null;
  notifyCombatChanged();
  container.remove();
  setLocale('zh-CN');
});

test('dispatches one legal duel action and rejects a repeated stale click', () => {
  expect(startCombatWithoutSave('joao.m2.kahn-shipyard')).toBe(true);
  act(() => root.render(<Combat />));

  expect(container.textContent).toContain('Kahn at the shipyard');
  expect(container.textContent).toContain('Weapon: Rapier');
  expect(container.textContent).toContain('Armor: Leather Armor');
  const slash = container.querySelector(
    '[data-test=duel-attack-slash]',
  ) as HTMLButtonElement;
  act(() => {
    slash.click();
    slash.click();
  });

  expect(getCombatSnapshot()?.revision).toBe(1);
  expect(container.textContent).toContain('Incoming attack: Thrust');
  expect(container.textContent).toContain('dealing 17 damage');
});

test('shows naval resources, disabled reasons, and runs legal naval actions', () => {
  expect(startCombatWithoutSave('joao.m2.katarina')).toBe(true);
  act(() => root.render(<Combat />));

  expect(container.textContent).toContain('Distance 2 — Cannon range');
  expect(container.textContent).toContain('Effective firepower 10');
  expect(container.textContent).toContain('Cannon shot 4');
  expect(container.textContent).toContain('Repair lumber 2');
  expect(container.textContent).toContain('Move alongside the enemy first.');
  expect(container.textContent).toContain(
    'Reach distance 3 before retreating.',
  );
  expect(
    container.querySelector<HTMLButtonElement>('[data-test=naval-board]')!
      .disabled,
  ).toBe(true);

  click('Approach');
  expect(getCombatSnapshot()?.round).toBe(2);
  expect(container.textContent).toContain('Distance 1 — Close range');
});

test('a system panel stays usable and blocks covered combat actions', () => {
  expect(startCombatWithoutSave('joao.m2.kahn-shipyard')).toBe(true);
  act(() =>
    root.render(
      <>
        <Combat />
        <Popover label="System">
          <System />
        </Popover>
      </>,
    ),
  );
  const before = getCombatSnapshot();
  act(() => {
    Array.from(container.querySelectorAll('div'))
      .find((node) => node.textContent === 'System')!
      .click();
  });
  expect(container.textContent).toContain('Save');
  expect(container.textContent).toContain('Load');
  expect(container.textContent).toContain('Language');
  expect(Input.isSuspended('overlay')).toBe(true);

  click('Slash');
  expect(getCombatSnapshot()).toBe(before);
});

test('rebuilds controls from a replaced combat snapshot', () => {
  expect(startCombatWithoutSave('joao.m2.kahn-shipyard')).toBe(true);
  act(() => root.render(<Combat />));
  const current = getCombatSnapshot();
  expect(current?.kind).toBe('duel');
  state.activeCombat = {
    ...current!,
    phase: 'defend',
    revision: 7,
  } as typeof current;
  act(() => notifyCombatChanged());

  expect(
    container.querySelector('[data-test=duel-defend-parry]'),
  ).not.toBeNull();
  expect(container.textContent).toContain('Incoming attack: Thrust');
});

test('resolves a loaded terminal captain duel back to naval controls', () => {
  const duel = createDuel({
    encounterId: 'joao.m2.katarina',
    player: playerDuel,
    enemy: encounterCatalog['joao.m2.katarina'].captain,
  });
  state.activeCombat = {
    ...createNaval({
      encounterId: 'joao.m2.katarina',
      player: {
        hull: 30,
        maxHull: 30,
        crew: 20,
        guns: 10,
        shot: 4,
        lumber: 2,
      },
      playerDuel,
    }),
    range: 0,
    boardingDuel: { ...duel, outcome: 'draw' },
  } as NavalState;
  notifyCombatChanged();
  act(() => root.render(<Combat />));

  expect(container.textContent).toContain('Duel drawn');
  click('Return to naval battle');
  expect((getCombatSnapshot() as NavalState).boardingDuel).toBeNull();
  expect(container.querySelector('[data-test=naval-fire]')).not.toBeNull();
  expect(container.textContent).toContain('Round 1');
  expect(container.textContent).toContain(
    'The captain’s duel was drawn; the naval battle continues.',
  );
});

test('shows the nested captain-duel round and log while it is active', () => {
  state.fleets['1'].ships[0].crew = 30;
  expect(startCombatWithoutSave('joao.m2.katarina')).toBe(true);
  act(() => root.render(<Combat />));

  click('Approach');
  click('Approach');
  click('Challenge the captain');
  expect(container.textContent).toContain('Round 1');
  click('Slash');
  expect(container.textContent).toContain(
    'Your Slash met the opponent’s Parry, dealing 14 damage.',
  );
  click('Block');
  expect(container.textContent).toContain('Round 2');
  expect(container.textContent).toContain(
    'The opponent’s Thrust met your Block, dealing 20 damage.',
  );
  expect(container.textContent).not.toContain(
    'You challenged the enemy captain to a duel.',
  );
});

test('summarizes earned experience before result confirmation', () => {
  expect(startCombatWithoutSave('joao.m2.kahn-house')).toBe(true);
  state.activeCombat = {
    ...getCombatSnapshot()!,
    outcome: 'victory',
  } as typeof state.activeCombat;
  notifyCombatChanged();
  act(() => root.render(<Combat />));

  expect(container.textContent).toContain('Battle won');
  expect(container.textContent).toContain('João gains 100 battle experience.');
  expect(state.mateProgress['1']).toBeUndefined();
  click('Continue');
  expect(state.activeCombat).toBeNull();
  expect(state.mateProgress['1'].battleExperience).toBe(100);
});
