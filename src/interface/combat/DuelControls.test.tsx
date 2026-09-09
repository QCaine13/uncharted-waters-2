import React, { useState } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, Root } from 'react-dom/client';
import { createDuel, advanceDuel } from '../../combat/duel';
import { encounterCatalog } from '../../combat/encounters';
import { setLocale } from '../../localization';
import DuelControls from './DuelControls';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  setLocale('en');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  setLocale('zh-CN');
});

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [duel, setDuel] = useState(() =>
    createDuel({
      encounterId: 'joao.m2.kahn-shipyard',
      player: encounterCatalog['joao.m2.kahn-shipyard'].enemy,
      enemy: encounterCatalog['joao.m2.kahn-shipyard'].enemy,
    }),
  );
  return (
    <div>
      <output>
        {duel.player.hp}/{duel.enemy.hp}/{duel.round}
      </output>
      <DuelControls
        duel={duel}
        disabled={disabled}
        onAction={(action) =>
          setDuel((current) => advanceDuel(current, action))
        }
      />
    </div>
  );
}

const click = (label: string) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent === label,
  );
  expect(button).toBeDefined();
  act(() => button!.click());
};

test('uses real attack and defense choices to change the duel and advance its round', () => {
  act(() => root.render(<Harness />));
  expect(container.querySelectorAll('button')).toHaveLength(3);
  expect(container.textContent).toContain('Opponent’s defense: Parry');
  click('Slash');
  expect(container.querySelector('output')!.textContent).toBe('84/69/1');
  expect(container.textContent).toContain('Incoming attack: Thrust');
  click('Parry');
  expect(container.querySelector('output')!.textContent).toBe('84/69/2');
  expect(container.textContent).toContain('Choose your attack');
});

test('covered controls cannot change the duel', () => {
  act(() => root.render(<Harness disabled />));
  expect(
    Array.from(container.querySelectorAll('button')).every(
      (button) => button.disabled,
    ),
  ).toBe(true);
  click('Slash');
  expect(container.querySelector('output')!.textContent).toBe('84/84/1');
});

test('presents Chinese choices and defense guidance', () => {
  setLocale('zh-CN');
  act(() => root.render(<Harness />));
  click('挥砍');
  expect(container.textContent).toContain('对手将要使出：突刺');
  expect(container.textContent).toContain('招架可挡住突刺');
  click('招架');
  expect(container.querySelector('output')!.textContent).toBe('84/69/2');
});
