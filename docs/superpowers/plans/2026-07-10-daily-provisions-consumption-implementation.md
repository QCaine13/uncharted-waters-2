# Daily Provisions Consumption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consume fleet-shared food and water at each sea-day boundary, show the live duration/warning state, and persist the settled cargo without inventing starvation penalties.

**Architecture:** Put fleet provision math and deduction planning in a pure `provisions.ts` domain module. Apply plans, publish summaries, and save through a focused `actionsProvisions.ts` integration module; `worldTimeTick()` only detects crossed days and delegates settlement. The harbor, world sidebar, tests, and persistence all consume the same `ProvisionSummary` contract.

**Tech Stack:** Node.js 22, TypeScript 4.8, React 18, Jest 29 + jsdom, Cypress 10 + Chrome, Webpack 5, Git LFS.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-10-daily-provisions-consumption-design.md`.
- Daily consumption for water and food is exactly `Math.ceil(totalCrew / 10)`.
- Provisions are fleet-shared and deducted in fleet-array order, flagship first.
- Consume only at sea-day boundaries; port time does not consume provisions.
- Low status means both resources are positive with 0–3 complete days remaining; exhausted means either resource is zero.
- Warnings are non-blocking, textual, and color-supported; do not add a modal or pause movement.
- Keep `SAVE_VERSION = 2`; add no save field or migration.
- Do not implement crew loss, disease, morale, rescue, game-over, movement penalties, per-ship starvation, cargo transfer, localization, or a generic daily-event engine.
- Do not upgrade dependencies or alter the project-owned CI structure.
- Never stage, modify, delete, or commit `docs/Chatlog copy.rtf`.
- Begin each behavior change with an observed focused failing test and finish it with a dedicated commit.
- Execute implementation in an isolated worktree created from commit `c5e130e` or its descendant.

## File Map

**Create:**

- `src/state/provisions.ts` — pure fleet provision totals, rate, summary, and deduction plans.
- `src/state/provisions.test.ts` — pure domain boundary and ordering tests.
- `src/state/actionsProvisions.ts` — apply deductions, refresh the provision UI, and save settlements.
- `src/state/actionsProvisions.test.ts` — state mutation, UI, and persistence tests.
- `src/state/actionsWorld.test.ts` — world-day boundary and set-sail orchestration tests.
- `src/interface/world/Provisions.test.tsx` — status copy, color, and loaded-state rendering tests.
- `tests/e2e/provisions.cy.ts` — real world-loop midnight, persistence, reload, and warning coverage.
- `docs/superpowers/verification/2026-07-10-daily-provisions-consumption-verification.md` — durable final evidence.

**Modify:**

- `src/state/selectorsFleet.ts` — delegate remaining-day calculation to the shared summary.
- `src/state/updateInterface.ts` — publish `ProvisionSummary` instead of bare totals.
- `src/state/actionsWorld.ts` — detect crossed days and delegate settlement/refresh.
- `src/interface/world/Provisions.tsx` — initialize from loaded state and render status text/colors.
- `src/interface/Left.tsx` — initialize/display the persisted sea-day count with a test selector.
- `docs/roadmap.md` — mark daily consumption and already-landed migration/quest status accurately.
- `docs/README.md` — add the implemented daily-consumption status and verification link.

---

### Task 1: Pure Fleet Provision Rules

**Files:**

- Create: `src/state/provisions.ts`
- Create: `src/state/provisions.test.ts`
- Modify: `src/state/selectorsFleet.ts:31-48`

**Interfaces:**

- Produces: `ProvisionStatus`, `ProvisionSummary`, and `ProvisionDeduction`.
- Produces: `getProvisionTotals(ships: Ship[]): ProvisionsType`.
- Produces: `getDailyProvisionConsumption(ships: Ship[]): number`.
- Produces: `getProvisionSummary(ships: Ship[]): ProvisionSummary`.
- Produces: `planProvisionConsumption(ships: Ship[], days: number): ProvisionDeduction[]`.
- Preserves: `getDaysProvisionsWillLast(): number`, now delegating to the shared summary.

- [ ] **Step 1: Write the failing pure-domain tests**

Create `src/state/provisions.test.ts`:

```ts
import type { Ship } from '../game/world/fleets';
import {
  getDailyProvisionConsumption,
  getProvisionSummary,
  getProvisionTotals,
  planProvisionConsumption,
} from './provisions';

const ship = (
  crew: number,
  cargo: Ship['cargo'] = [],
  name = 'Test ship',
): Ship => ({
  id: '6',
  name,
  crew,
  cargo,
  durability: 25,
});

describe('fleet provision rules', () => {
  test.each([
    [0, 0],
    [10, 1],
    [11, 2],
    [20, 2],
  ])('rounds %i crew to %i unit(s) per day', (crew, expected) => {
    expect(getDailyProvisionConsumption([ship(crew)])).toBe(expected);
  });

  test('totals provisions across ships and ignores trade goods', () => {
    const ships = [
      ship(6, [
        { type: 'water', quantity: 2 },
        { type: 'food', quantity: 3 },
        { type: '1', quantity: 9 },
      ]),
      ship(5, [
        { type: 'water', quantity: 5 },
        { type: 'lumber', quantity: 4 },
        { type: 'shot', quantity: 7 },
      ]),
    ];

    expect(getProvisionTotals(ships)).toEqual({
      water: 7,
      food: 3,
      lumber: 4,
      shot: 7,
    });
  });

  test('calculates normal, low, sub-day, exhausted, and zero-crew summaries', () => {
    expect(
      getProvisionSummary([
        ship(10, [
          { type: 'water', quantity: 4 },
          { type: 'food', quantity: 5 },
        ]),
      ]),
    ).toMatchObject({
      dailyConsumption: 1,
      daysRemaining: 4,
      status: 'normal',
    });

    expect(
      getProvisionSummary([
        ship(10, [
          { type: 'water', quantity: 3 },
          { type: 'food', quantity: 8 },
        ]),
      ]),
    ).toMatchObject({ dailyConsumption: 1, daysRemaining: 3, status: 'low' });

    expect(
      getProvisionSummary([
        ship(11, [
          { type: 'water', quantity: 1 },
          { type: 'food', quantity: 1 },
        ]),
      ]),
    ).toMatchObject({ dailyConsumption: 2, daysRemaining: 0, status: 'low' });

    expect(
      getProvisionSummary([ship(10, [{ type: 'food', quantity: 8 }])]),
    ).toMatchObject({ daysRemaining: 0, status: 'exhausted' });

    expect(getProvisionSummary([ship(0)])).toMatchObject({
      dailyConsumption: 0,
      daysRemaining: null,
      status: 'normal',
    });
  });

  test('plans flagship-first deductions and continues to later ships', () => {
    const ships = [
      ship(6, [
        { type: 'water', quantity: 1 },
        { type: 'food', quantity: 4 },
        { type: 'lumber', quantity: 3 },
      ]),
      ship(5, [
        { type: 'water', quantity: 5 },
        { type: 'food', quantity: 5 },
        { type: 'shot', quantity: 2 },
      ]),
    ];

    expect(planProvisionConsumption(ships, 1)).toEqual([
      { shipNumber: 0, provision: 'water', quantity: 1 },
      { shipNumber: 1, provision: 'water', quantity: 1 },
      { shipNumber: 0, provision: 'food', quantity: 2 },
    ]);

    expect(planProvisionConsumption(ships, 3)).toEqual([
      { shipNumber: 0, provision: 'water', quantity: 1 },
      { shipNumber: 1, provision: 'water', quantity: 5 },
      { shipNumber: 0, provision: 'food', quantity: 4 },
      { shipNumber: 1, provision: 'food', quantity: 2 },
    ]);
  });

  test('does not mutate ships while planning', () => {
    const ships = [
      ship(10, [
        { type: 'water', quantity: 2 },
        { type: 'food', quantity: 2 },
      ]),
    ];
    const before = JSON.stringify(ships);

    planProvisionConsumption(ships, 1);

    expect(JSON.stringify(ships)).toBe(before);
  });
});
```

- [ ] **Step 2: Verify the focused tests are red**

Run `npx jest src/state/provisions.test.ts --runInBand`.

Expected: FAIL because `./provisions` does not exist.

- [ ] **Step 3: Implement the pure rules**

Create `src/state/provisions.ts`:

```ts
import { CargoType, Provisions, Ship, provisions } from '../game/world/fleets';
import type { ProvisionsType } from './state';

export const LOW_PROVISIONS_DAYS = 3;

export type ConsumableProvision = 'water' | 'food';
export type ProvisionStatus = 'normal' | 'low' | 'exhausted';

export interface ProvisionSummary {
  provisions: ProvisionsType;
  dailyConsumption: number;
  daysRemaining: number | null;
  status: ProvisionStatus;
}

export interface ProvisionDeduction {
  shipNumber: number;
  provision: ConsumableProvision;
  quantity: number;
}

const consumableProvisions: ConsumableProvision[] = ['water', 'food'];

const emptyProvisions = (): ProvisionsType => ({
  water: 0,
  food: 0,
  lumber: 0,
  shot: 0,
});

const isProvision = (type: CargoType): type is Provisions =>
  (provisions as readonly CargoType[]).includes(type);

export const getProvisionTotals = (ships: Ship[]): ProvisionsType => {
  const totals = emptyProvisions();

  ships.forEach((ship) => {
    ship.cargo.forEach((item) => {
      if (isProvision(item.type)) {
        totals[item.type] += item.quantity;
      }
    });
  });

  return totals;
};

export const getDailyProvisionConsumption = (ships: Ship[]): number => {
  const crew = ships.reduce((total, current) => total + current.crew, 0);
  return Math.ceil(Math.max(0, crew) / 10);
};

export const getProvisionSummary = (ships: Ship[]): ProvisionSummary => {
  const totals = getProvisionTotals(ships);
  const dailyConsumption = getDailyProvisionConsumption(ships);

  if (dailyConsumption === 0) {
    return {
      provisions: totals,
      dailyConsumption,
      daysRemaining: null,
      status: 'normal',
    };
  }

  const daysRemaining = Math.floor(
    Math.min(totals.water, totals.food) / dailyConsumption,
  );
  let status: ProvisionStatus = 'normal';

  if (totals.water === 0 || totals.food === 0) {
    status = 'exhausted';
  } else if (daysRemaining <= LOW_PROVISIONS_DAYS) {
    status = 'low';
  }

  return { provisions: totals, dailyConsumption, daysRemaining, status };
};

export const planProvisionConsumption = (
  ships: Ship[],
  days: number,
): ProvisionDeduction[] => {
  const daysToSettle = Math.max(0, Math.floor(days));
  const required = getDailyProvisionConsumption(ships) * daysToSettle;
  const deductions: ProvisionDeduction[] = [];

  consumableProvisions.forEach((provision) => {
    let remaining = required;

    ships.forEach((ship, shipNumber) => {
      if (remaining === 0) {
        return;
      }

      const available = ship.cargo
        .filter((item) => item.type === provision)
        .reduce((total, item) => total + Math.max(0, item.quantity), 0);
      const quantity = Math.min(available, remaining);

      if (quantity > 0) {
        deductions.push({ shipNumber, provision, quantity });
        remaining -= quantity;
      }
    });
  });

  return deductions;
};
```

- [ ] **Step 4: Delegate the harbor estimate**

Replace `getDaysProvisionsWillLast()` in `src/state/selectorsFleet.ts` and add
the import shown here:

```ts
import { getProvisionSummary } from './provisions';

export const getDaysProvisionsWillLast = () =>
  getProvisionSummary(getPlayerFleet()).daysRemaining ?? 0;
```

- [ ] **Step 5: Run focused and full unit checks**

```bash
npx jest src/state/provisions.test.ts --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: provision tests, existing Jest suites, TypeScript, and ESLint PASS
without warnings or errors.

- [ ] **Step 6: Commit**

```bash
git add src/state/provisions.ts src/state/provisions.test.ts src/state/selectorsFleet.ts
git diff --cached --check
git commit -m "feat: define fleet provision rules"
```

---

### Task 2: Provision State Actions

**Files:**

- Create: `src/state/actionsProvisions.ts`
- Create: `src/state/actionsProvisions.test.ts`
- Modify: `src/state/updateInterface.ts:1-11`
- Modify: `src/interface/world/Provisions.tsx`
- Create: `src/interface/world/Provisions.test.tsx`

**Interfaces:**

- Consumes: `getProvisionSummary()` and `planProvisionConsumption()` from Task 1.
- Produces: `refreshProvisionInterface(): ProvisionSummary`, which never saves.
- Produces: `settleDailyProvisions(days: number): ProvisionSummary`, which applies all deductions, updates the provision UI once, and saves once.
- Changes: `updateInterface.provisions(summary: ProvisionSummary): void` and initializes the sidebar from loaded fleet state.

- [ ] **Step 1: Write failing state-action tests**

Create `src/state/actionsProvisions.test.ts`:

```ts
import type { Ship } from '../game/world/fleets';
import state from './state';
import updateInterface from './updateInterface';
import { save } from './saveLoad';
import {
  refreshProvisionInterface,
  settleDailyProvisions,
} from './actionsProvisions';

jest.mock('./saveLoad', () => ({ save: jest.fn() }));

const mockedSave = save as jest.MockedFunction<typeof save>;

const ships = (): Ship[] => [
  {
    id: '6',
    name: 'Flagship',
    crew: 6,
    durability: 25,
    cargo: [
      { type: 'water', quantity: 1 },
      { type: 'food', quantity: 2 },
      { type: 'lumber', quantity: 4 },
      { type: '1', quantity: 9 },
    ],
  },
  {
    id: '6',
    name: 'Consort',
    crew: 5,
    durability: 25,
    cargo: [
      { type: 'water', quantity: 5 },
      { type: 'food', quantity: 5 },
      { type: 'shot', quantity: 7 },
    ],
  },
];

describe('provision state actions', () => {
  beforeEach(() => {
    state.fleets = {
      '1': { position: { x: 100, y: 100 }, ships: ships() },
    };
    updateInterface.provisions = jest.fn();
    mockedSave.mockReset();
  });

  test('refreshes the summary without mutation or persistence', () => {
    const before = JSON.stringify(state.fleets);

    const summary = refreshProvisionInterface();

    expect(summary).toMatchObject({
      provisions: { water: 6, food: 7, lumber: 4, shot: 7 },
      dailyConsumption: 2,
      daysRemaining: 3,
      status: 'low',
    });
    expect(JSON.stringify(state.fleets)).toBe(before);
    expect(updateInterface.provisions).toHaveBeenCalledTimes(1);
    expect(updateInterface.provisions).toHaveBeenCalledWith(summary);
    expect(mockedSave).not.toHaveBeenCalled();
  });

  test('settles one day in fleet order, updates once, and saves once', () => {
    const summary = settleDailyProvisions(1);

    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: 'lumber', quantity: 4 },
      { type: '1', quantity: 9 },
    ]);
    expect(state.fleets['1'].ships[1].cargo).toEqual([
      { type: 'water', quantity: 4 },
      { type: 'food', quantity: 5 },
      { type: 'shot', quantity: 7 },
    ]);
    expect(summary).toMatchObject({
      provisions: { water: 4, food: 5, lumber: 4, shot: 7 },
      dailyConsumption: 2,
      daysRemaining: 2,
      status: 'low',
    });
    expect(updateInterface.provisions).toHaveBeenCalledTimes(1);
    expect(updateInterface.provisions).toHaveBeenCalledWith(summary);
    expect(mockedSave).toHaveBeenCalledTimes(1);
  });

  test('settles multiple days, clamps shortages, and preserves unrelated cargo', () => {
    const summary = settleDailyProvisions(3);

    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: 'lumber', quantity: 4 },
      { type: '1', quantity: 9 },
    ]);
    expect(state.fleets['1'].ships[1].cargo).toEqual([
      { type: 'food', quantity: 1 },
      { type: 'shot', quantity: 7 },
    ]);
    expect(summary).toMatchObject({
      provisions: { water: 0, food: 1, lumber: 4, shot: 7 },
      status: 'exhausted',
    });
    expect(updateInterface.provisions).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Write the failing loaded-state contract test**

Create `src/interface/world/Provisions.test.tsx`:

```tsx
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import Provisions from './Provisions';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

test('initializes from loaded fleet state and accepts summary updates', () => {
  state.fleets = {
    '1': {
      position: { x: 100, y: 100 },
      ships: [
        {
          id: '6',
          name: 'Flagship',
          crew: 10,
          cargo: [
            { type: 'water', quantity: 2 },
            { type: 'food', quantity: 3 },
          ],
          durability: 25,
        },
      ],
    },
  };
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<Provisions hidden={false} />));
  expect(
    container.querySelector('[data-test=provision-water]')?.textContent,
  ).toBe('2');

  act(() => {
    updateInterface.provisions({
      provisions: { water: 1, food: 2, lumber: 0, shot: 0 },
      dailyConsumption: 1,
      daysRemaining: 1,
      status: 'low',
    });
  });
  expect(
    container.querySelector('[data-test=provision-water]')?.textContent,
  ).toBe('1');

  act(() => root.unmount());
});
```

- [ ] **Step 3: Verify both focused test files are red**

```bash
npx jest src/state/actionsProvisions.test.ts --runInBand
npx jest src/interface/world/Provisions.test.tsx --runInBand
```

Expected: the action test FAILS because `./actionsProvisions` does not exist;
the component test FAILS because the sidebar starts at zero and the old
interface accepts bare totals.

- [ ] **Step 4: Implement the state actions**

Create `src/state/actionsProvisions.ts`:

```ts
import state from './state';
import updateInterface from './updateInterface';
import { save } from './saveLoad';
import {
  getProvisionSummary,
  planProvisionConsumption,
  ProvisionDeduction,
  ProvisionSummary,
} from './provisions';

const getShips = () => state.fleets['1'].ships;

const applyDeduction = ({
  shipNumber,
  provision,
  quantity,
}: ProvisionDeduction): void => {
  const ship = getShips()[shipNumber];
  let remaining = quantity;

  for (let i = 0; i < ship.cargo.length && remaining > 0; i += 1) {
    const item = ship.cargo[i];

    if (item.type === provision) {
      const deduction = Math.min(item.quantity, remaining);
      ship.cargo[i] = { ...item, quantity: item.quantity - deduction };
      remaining -= deduction;
    }
  }

  ship.cargo = ship.cargo.filter(
    (item) => !(item.type === provision && item.quantity === 0),
  );
};

export const refreshProvisionInterface = (): ProvisionSummary => {
  const summary = getProvisionSummary(getShips());
  updateInterface.provisions(summary);
  return summary;
};

export const settleDailyProvisions = (days: number): ProvisionSummary => {
  planProvisionConsumption(getShips(), days).forEach(applyDeduction);
  const summary = refreshProvisionInterface();
  save();
  return summary;
};
```

- [ ] **Step 5: Migrate the interface contract and loaded-state initialization**

In `src/state/updateInterface.ts`, replace the `ProvisionsType` import/use with:

```ts
import type { State } from './state';
import type { ProvisionSummary } from './provisions';

// Inside UpdateInterface:
provisions: (summary: ProvisionSummary) => void;
```

In `src/interface/world/Provisions.tsx`, replace the `ProvisionsType` import,
state initialization, callback, and destructuring with:

```tsx
import { getPlayerFleet } from '../../state/selectorsFleet';
import { getProvisionSummary, ProvisionSummary } from '../../state/provisions';

const [summary, setSummary] = useState<ProvisionSummary>(() =>
  getProvisionSummary(getPlayerFleet()),
);

updateInterface.provisions = (nextSummary) => {
  setSummary(nextSummary);
};

const { water, food, lumber, shot } = summary.provisions;
```

Add `data-test="provision-water"` to the water quantity div and
`data-test="provision-food"` to the food quantity div. Do not add warning copy
or colors yet; Task 4 develops that behavior red-first.

- [ ] **Step 6: Run focused and full checks**

```bash
npx jest src/state/actionsProvisions.test.ts --runInBand
npx jest src/interface/world/Provisions.test.tsx --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: action tests and the complete unit/type/lint gate PASS. The focused
test must directly show one provisions-interface call and one save for each
settlement.

- [ ] **Step 7: Commit**

```bash
git add src/state/actionsProvisions.ts src/state/actionsProvisions.test.ts src/state/updateInterface.ts src/interface/world/Provisions.tsx src/interface/world/Provisions.test.tsx
git diff --cached --check
git commit -m "feat: settle daily fleet provisions"
```

---

### Task 3: World Day-boundary Integration

**Files:**

- Create: `src/state/actionsWorld.test.ts`
- Modify: `src/state/actionsWorld.ts:1-145`

**Interfaces:**

- Consumes: `settleDailyProvisions(days: number)` and `refreshProvisionInterface()` from Task 2.
- Changes: `worldTimeTick(minutes = 20): void`; production callers continue to omit the argument.
- Preserves: `setSail(): void`, with one summary refresh and one existing save.

- [ ] **Step 1: Write failing world-orchestration tests**

Create `src/state/actionsWorld.test.ts`:

```ts
import Assets from '../assets';
import Input from '../input';
import state from './state';
import updateInterface from './updateInterface';
import { updateGeneral } from './actionsPort';
import {
  refreshProvisionInterface,
  settleDailyProvisions,
} from './actionsProvisions';
import { save } from './saveLoad';
import { setSail, worldTimeTick } from './actionsWorld';

jest.mock('../input', () => ({
  __esModule: true,
  default: { reset: jest.fn() },
}));
jest.mock('../game/port/port', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./actionsPort', () => ({ updateGeneral: jest.fn() }));
jest.mock('./actionsProvisions', () => ({
  refreshProvisionInterface: jest.fn(),
  settleDailyProvisions: jest.fn(),
}));
jest.mock('./saveLoad', () => ({ save: jest.fn() }));

const mockedRefresh = refreshProvisionInterface as jest.MockedFunction<
  typeof refreshProvisionInterface
>;
const mockedSettle = settleDailyProvisions as jest.MockedFunction<
  typeof settleDailyProvisions
>;
const mockedSave = save as jest.MockedFunction<typeof save>;
const mockedUpdateGeneral = updateGeneral as jest.MockedFunction<
  typeof updateGeneral
>;

describe('world provision settlement', () => {
  beforeEach(() => {
    jest.spyOn(Assets, 'data').mockReturnValue(new Uint8Array(2700));
    state.portId = null;
    state.buildingId = null;
    state.timePassed = 1400;
    state.dayAtSea = 2;
    state.fleets = {
      '1': {
        position: { x: 100, y: 100 },
        ships: [
          {
            id: '6',
            name: 'Flagship',
            crew: 11,
            cargo: [
              { type: 'water', quantity: 8 },
              { type: 'food', quantity: 8 },
            ],
            durability: 25,
          },
        ],
      },
    };
    updateInterface.dayAtSea = jest.fn();
    updateInterface.indicators = jest.fn();
    mockedRefresh.mockReset();
    mockedSettle.mockReset();
    mockedSave.mockReset();
    mockedUpdateGeneral.mockReset();
    (Input.reset as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not settle before crossing a day boundary', () => {
    worldTimeTick();

    expect(state.timePassed).toBe(1420);
    expect(state.dayAtSea).toBe(2);
    expect(mockedSettle).not.toHaveBeenCalled();
    expect(mockedUpdateGeneral).not.toHaveBeenCalled();
    expect(updateInterface.dayAtSea).not.toHaveBeenCalled();
  });

  test('settles once when the default tick crosses midnight', () => {
    state.timePassed = 1420;

    worldTimeTick();

    expect(state.timePassed).toBe(1440);
    expect(state.dayAtSea).toBe(3);
    expect(mockedSettle).toHaveBeenCalledTimes(1);
    expect(mockedSettle).toHaveBeenCalledWith(1);
    expect(mockedUpdateGeneral).toHaveBeenCalledTimes(1);
    expect(updateInterface.dayAtSea).toHaveBeenCalledTimes(1);
    expect(updateInterface.dayAtSea).toHaveBeenCalledWith(3);
  });

  test('aggregates multiple crossed days into one settlement call', () => {
    state.timePassed = 1420;

    worldTimeTick(2900);

    expect(state.timePassed).toBe(4320);
    expect(state.dayAtSea).toBe(5);
    expect(mockedSettle).toHaveBeenCalledTimes(1);
    expect(mockedSettle).toHaveBeenCalledWith(3);
    expect(mockedUpdateGeneral).toHaveBeenCalledTimes(1);
    expect(updateInterface.dayAtSea).toHaveBeenCalledTimes(1);
  });

  test('refreshes provisions and preserves one save when setting sail', () => {
    state.portId = '1';
    state.buildingId = '4';

    setSail();

    expect(state.portId).toBeNull();
    expect(state.buildingId).toBeNull();
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(Input.reset).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Verify the boundary tests are red**

Run `npx jest src/state/actionsWorld.test.ts --runInBand`.

Expected: FAIL because `worldTimeTick` ignores the supplied duration, does not
delegate provision settlement, and `setSail` does not call the new refresh
action.

- [ ] **Step 3: Replace the local provision updater and integrate crossed days**

In `src/state/actionsWorld.ts`, remove the `Provisions` import and the local
`updateProvisions` function. Add:

```ts
import {
  refreshProvisionInterface,
  settleDailyProvisions,
} from './actionsProvisions';
```

Replace `worldTimeTick` with:

```ts
export const worldTimeTick = (minutes = 20) => {
  const previousDay = Math.floor(state.timePassed / 1440);
  state.timePassed += minutes;

  if (shouldUpdateWorldStatus()) {
    updateWorldStatus();
  }

  const currentDay = Math.floor(state.timePassed / 1440);
  const daysCrossed = currentDay - previousDay;

  if (daysCrossed > 0) {
    updateGeneral();
    state.dayAtSea += daysCrossed;
    updateInterface.dayAtSea(state.dayAtSea);
    settleDailyProvisions(daysCrossed);
  }
};
```

Replace the end of `setSail()` with:

```ts
updateGeneral();
refreshProvisionInterface();
save();
```

- [ ] **Step 4: Run focused, unit, type, and lint checks**

```bash
npx jest src/state/actionsWorld.test.ts --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: boundary orchestration and the full non-build checks PASS. The
midnight test shows exactly one settlement call even though general/day UI
callbacks also run.

- [ ] **Step 5: Commit**

```bash
git add src/state/actionsWorld.ts src/state/actionsWorld.test.ts
git diff --cached --check
git commit -m "feat: consume provisions at sea midnight"
```

---

### Task 4: Loaded-state Sidebar and Warning UI

**Files:**

- Modify: `src/interface/world/Provisions.tsx`
- Modify: `src/interface/world/Provisions.test.tsx`
- Modify: `src/interface/Left.tsx:1-58`

**Interfaces:**

- Consumes: `ProvisionSummary` and `getProvisionSummary()` from Task 1.
- Consumes: `updateInterface.provisions(summary: ProvisionSummary)` from Task 2.
- Produces: `getProvisionStatusText(summary: ProvisionSummary): string | null`.
- Produces stable selectors: `provisions`, `provision-water`, `provision-food`, `provisionStatus`, and `dayAtSea`.

- [ ] **Step 1: Write failing copy/render tests**

Replace `src/interface/world/Provisions.test.tsx` with:

```tsx
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import type { ProvisionSummary } from '../../state/provisions';
import Provisions, { getProvisionStatusText } from './Provisions';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

const summary = (
  status: ProvisionSummary['status'],
  daysRemaining: number | null,
  dailyConsumption = 1,
): ProvisionSummary => ({
  provisions: { water: 3, food: 3, lumber: 0, shot: 0 },
  dailyConsumption,
  daysRemaining,
  status,
});

describe('Provisions', () => {
  test.each([
    [summary('normal', 5), '5 days remaining'],
    [summary('low', 3), 'Only 3 days remaining'],
    [summary('low', 1), 'Only 1 day remaining'],
    [summary('low', 0), 'Less than 1 day remaining'],
    [summary('exhausted', 0), 'Supplies exhausted'],
    [summary('normal', null, 0), null],
  ] as const)('maps a summary to status copy', (value, expected) => {
    expect(getProvisionStatusText(value)).toBe(expected);
  });

  test('initializes from loaded cargo and reacts to an exhausted update', () => {
    state.fleets = {
      '1': {
        position: { x: 100, y: 100 },
        ships: [
          {
            id: '6',
            name: 'Flagship',
            crew: 11,
            cargo: [
              { type: 'water', quantity: 7 },
              { type: 'food', quantity: 7 },
            ],
            durability: 25,
          },
        ],
      },
    };
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<Provisions hidden={false} />));

    expect(
      container.querySelector('[data-test=provision-water]')?.textContent,
    ).toBe('7');
    expect(
      container.querySelector('[data-test=provisionStatus]')?.textContent,
    ).toBe('Only 3 days remaining');
    expect(
      container
        .querySelector('[data-test=provision-water]')
        ?.parentElement?.classList.contains('text-orange-500'),
    ).toBe(true);

    act(() => {
      updateInterface.provisions({
        provisions: { water: 0, food: 3, lumber: 0, shot: 0 },
        dailyConsumption: 2,
        daysRemaining: 0,
        status: 'exhausted',
      });
    });

    expect(
      container.querySelector('[data-test=provisionStatus]')?.textContent,
    ).toBe('Supplies exhausted');
    expect(
      container
        .querySelector('[data-test=provision-food]')
        ?.parentElement?.classList.contains('text-red-600'),
    ).toBe(true);

    act(() => root.unmount());
  });
});
```

- [ ] **Step 2: Verify the UI test is red**

Run `npx jest src/interface/world/Provisions.test.tsx --runInBand`.

Expected: FAIL because `getProvisionStatusText`, the `provisionStatus` selector,
and orange/red warning classes do not exist yet.

- [ ] **Step 3: Implement the summary UI**

Replace `src/interface/world/Provisions.tsx` with:

```tsx
import React, { useState } from 'react';

import Assets from '../../assets';
import { classNames } from '../interfaceUtils';
import updateInterface from '../../state/updateInterface';
import { getPlayerFleet } from '../../state/selectorsFleet';
import { getProvisionSummary, ProvisionSummary } from '../../state/provisions';

const provisionClass = 'flex items-center py-2';
const quantityClass = 'flex-1 text-right text-xl';

interface Props {
  hidden: boolean;
}

export const getProvisionStatusText = ({
  dailyConsumption,
  daysRemaining,
  status,
}: ProvisionSummary): string | null => {
  if (dailyConsumption === 0 || daysRemaining === null) {
    return null;
  }
  if (status === 'exhausted') {
    return 'Supplies exhausted';
  }
  if (daysRemaining === 0) {
    return 'Less than 1 day remaining';
  }
  if (status === 'low') {
    return `Only ${daysRemaining} day${
      daysRemaining === 1 ? '' : 's'
    } remaining`;
  }
  return `${daysRemaining} days remaining`;
};

export default function Provisions({ hidden }: Props) {
  const [summary, setSummary] = useState<ProvisionSummary>(() =>
    getProvisionSummary(getPlayerFleet()),
  );

  updateInterface.provisions = (nextSummary) => {
    setSummary(nextSummary);
  };

  const { water, food, lumber, shot } = summary.provisions;
  let warningClass = '';

  if (summary.status === 'exhausted') {
    warningClass = 'text-red-600';
  } else if (summary.status === 'low') {
    warningClass = 'text-orange-500';
  }
  const statusText = getProvisionStatusText(summary);

  return (
    <div
      className={classNames('mt-20', hidden ? 'hidden' : '')}
      data-test="provisions"
    >
      <div className="text-sm mb-4">Provisions</div>
      {!!statusText && (
        <div
          className={classNames('text-sm mb-2', warningClass)}
          data-test="provisionStatus"
        >
          {statusText}
        </div>
      )}
      <div className={classNames(provisionClass, warningClass)}>
        <img
          src={Assets.images('worldWater').toDataURL()}
          alt="Water"
          className="w-8 h-16"
        />
        <div className={quantityClass} data-test="provision-water">
          {water}
        </div>
      </div>
      <div className={classNames(provisionClass, warningClass)}>
        <img
          src={Assets.images('worldFood').toDataURL()}
          alt="food"
          className="w-8 h-16"
        />
        <div className={quantityClass} data-test="provision-food">
          {food}
        </div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldLumber').toDataURL()}
          alt="Lumber"
          className="w-8 h-16"
        />
        <div className={quantityClass}>{lumber}</div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldShot').toDataURL()}
          alt="Shot"
          className="w-8 h-16"
        />
        <div className={quantityClass}>{shot}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Initialize and expose the persisted sea-day count**

In `src/interface/Left.tsx`, import `state` and replace the current day state and
display with:

```text
import state from '../state/state';

const [dayAtSea, setDayAtSea] = useState(state.dayAtSea);

<div className="mb-20" data-test="dayAtSea">
  {inPort ? getHoursMinutes(timePassed) : `Day ${dayAtSea}`}
</div>
```

- [ ] **Step 5: Run focused and complete non-E2E checks**

```bash
npx jest src/interface/world/Provisions.test.tsx --runInBand
npm run verify
```

Expected: component test, all Jest tests, TypeScript, ESLint, asset preflight,
and Webpack PASS. Only the already-recorded Browserslist/Webpack performance
warnings may remain.

- [ ] **Step 6: Commit**

```bash
git add src/interface/world/Provisions.tsx src/interface/world/Provisions.test.tsx src/interface/Left.tsx
git diff --cached --check
git commit -m "feat: show live provision warnings"
```

---

### Task 5: Chrome Midnight and Reload Coverage

**Files:**

- Create: `tests/e2e/provisions.cy.ts`

**Interfaces:**

- Consumes the stable UI selectors from Task 4 and save version 2 fixture helper.
- Proves the production world loop, action settlement, UI, persistence, and reload path together.

- [ ] **Step 1: Write the production E2E scenarios**

Create `tests/e2e/provisions.cy.ts`:

```ts
import { SAVED_STATE_KEY } from '../../src/state/state';
import { setState } from '../utils';

const setAtSeaState = (quantity: number) =>
  setState({
    portId: null,
    buildingId: null,
    timePassed: 1420,
    dayAtSea: 4,
    fleets: {
      '1': {
        position: { x: 100, y: 100 },
        ships: [
          {
            id: '6',
            name: 'Flagship',
            crew: 11,
            cargo: [
              { type: 'water', quantity },
              { type: 'food', quantity },
              { type: 'lumber', quantity: 4 },
            ],
            durability: 25,
          },
        ],
      },
    },
    mates: [{ sailorId: '1', role: 0 }],
  });

describe('Daily provisions', () => {
  it('consumes rounded fleet provisions, saves, and reloads the low warning', () => {
    setAtSeaState(8);
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');
    cy.get('[data-test=dayAtSea]').should('have.text', 'Day 5');
    cy.get('[data-test=provision-water]').should('have.text', '6');
    cy.get('[data-test=provision-food]').should('have.text', '6');
    cy.get('[data-test=provisionStatus]')
      .should('have.text', 'Only 3 days remaining')
      .and('have.class', 'text-orange-500');

    cy.window().should((win) => {
      const saved = JSON.parse(win.localStorage.getItem(SAVED_STATE_KEY)!);
      expect(saved.dayAtSea).to.equal(5);
      expect(saved.timePassed).to.equal(1440);
      expect(saved.fleets['1'].ships[0].cargo).to.deep.equal([
        { type: 'water', quantity: 6 },
        { type: 'food', quantity: 6 },
        { type: 'lumber', quantity: 4 },
      ]);
    });

    cy.reload();
    cy.get('[data-test=dayAtSea]').should('have.text', 'Day 5');
    cy.get('[data-test=provision-water]').should('have.text', '6');
    cy.get('[data-test=provisionStatus]').should(
      'have.text',
      'Only 3 days remaining',
    );
  });

  it('clamps insufficient provisions to zero and shows exhausted', () => {
    setAtSeaState(1);
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');
    cy.get('[data-test=dayAtSea]').should('have.text', 'Day 5');
    cy.get('[data-test=provision-water]').should('have.text', '0');
    cy.get('[data-test=provision-food]').should('have.text', '0');
    cy.get('[data-test=provisionStatus]')
      .should('have.text', 'Supplies exhausted')
      .and('have.class', 'text-red-600');
  });
});
```

- [ ] **Step 2: Verify the new scenario is green against the integrated code**

Task 5 is an integration acceptance test over behaviors already developed red-
first in Tasks 1–4. Run:

```bash
npm run build
npx start-server-and-test serve:build http://127.0.0.1:8080 \
  "cypress run --browser chrome --spec tests/e2e/provisions.cy.ts"
```

Expected: 2 Chrome tests PASS without fixed sleeps; the server exits after the
spec. If the scenario fails, use `superpowers:systematic-debugging` and fix the
responsible earlier task with a focused regression before changing this spec.

- [ ] **Step 3: Run the single full local/CI gate**

```bash
npm run verify:full
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

Expected: all assets, Jest, TSX-inclusive typecheck, ESLint, Webpack, and all
Chrome specs PASS. `lsof` prints no listener after `start-server-and-test`
returns.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/provisions.cy.ts
git diff --cached --check
git commit -m "test: cover daily provision consumption"
```

---

### Task 6: Synchronize Roadmap and Status Documentation

**Files:**

- Modify: `docs/roadmap.md`
- Modify: `docs/README.md`

**Interfaces:** Documents only behavior verified by Tasks 1–5 and links the
planned Task 7 evidence record.

- [ ] **Step 1: Update the roadmap snapshot and completed slice**

In `docs/roadmap.md`:

1. Change the living-document date to `2026-07-10`.
2. Replace the stale opening snapshot with a concise statement that save/load
   v2 migration, market MVP, quest-engine slice 1, and the project-owned runtime
   baseline are implemented; daily provision consumption is the newly completed
   gameplay slice.
3. Change the Phase 2 heading to:

   ```md
   ## Phase 2: Save/Load Boundary ✅ (MVP + version 2 migration shipped)
   ```

4. In “其他可考虑的小 slice”, replace the daily-consumption bullet with:

   ```md
   - ✅ 海上每日补给消耗：舰队共享、每 10 人或不足 10 人每日消耗 1 水 + 1 食物，
     余量与警告实时显示；原作断粮惩罚仍待考证后另做。
   ```

Do not change the priority or content of localization, exploration, shipyard,
market-depth, story-expansion, or original-game research phases.

- [ ] **Step 2: Add the current-status row**

In `docs/README.md`, update the verification date to 2026-07-10 and add this row
after the world-sailing row:

```md
| **海上每日补给消耗** | ✅ MVP 已实现 | 舰队共享水/食物，按总船员向上取整每日扣减；≤3 天橙色、耗尽红色；[验证记录](superpowers/verification/2026-07-10-daily-provisions-consumption-verification.md) |
```

Keep fame, wider narrative integration, multi-protagonist work, map expansion,
and other pending systems unchanged.

- [ ] **Step 3: Format and verify current claims**

```bash
npx prettier --write docs/roadmap.md docs/README.md
rg -n "migration still TODO|版本迁移.*待做|实现每日消耗" docs/roadmap.md docs/README.md
npm run verify
```

Expected: the stale search finds no pending claim for already-landed migration
or daily consumption; assets, Jest, TypeScript, ESLint, and Webpack PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/roadmap.md docs/README.md
git diff --cached --check
git commit -m "docs: mark daily provisions implemented"
```

---

### Task 7: Durable Full Verification Evidence

**Files:**

- Create: `docs/superpowers/verification/2026-07-10-daily-provisions-consumption-verification.md`

**Interfaces:** Produces the final acceptance record without changing runtime
behavior.

- [ ] **Step 1: Run the full gate from a clean build output**

```bash
rm -rf build
npm run verify:full
```

Expected: asset preflight, every Jest suite, TSX-inclusive TypeScript, ESLint,
Webpack, and every Chrome Cypress spec PASS. Record the actual suite/test/spec
counts and non-fatal warnings rather than copying counts from an earlier phase.

- [ ] **Step 2: Verify lifecycle, workflow, and repository hygiene**

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
find .github/workflows -maxdepth 1 -type f -print | sort
git status --short
git diff --check
git rev-parse HEAD
git lfs version
```

Expected: no listener on 8080; only `.github/workflows/baseline.yml`; only the
new verification record plus the user's untouched `docs/Chatlog copy.rtf` are
untracked; diff check exits 0.

- [ ] **Step 3: Write the verification record from actual output**

Create
`docs/superpowers/verification/2026-07-10-daily-provisions-consumption-verification.md`
with:

- design and execution date `2026-07-10`;
- branch and verified pre-evidence commit SHA;
- Git LFS version and media count;
- Jest suite/test counts, including the pure, action, world, and component tests;
- TypeScript, ESLint, and Webpack outcomes plus non-fatal warnings;
- Chrome version, spec/test counts, and the new daily-provisions scenarios;
- confirmation that the low/exhausted, persistence, and reload acceptance paths passed;
- confirmation that port 8080 has no listener and only `baseline.yml` exists;
- repository status and untouched Chatlog evidence;
- unchanged `SAVE_VERSION = 2`;
- deferred starvation consequences and every other non-goal from the design.

Do not claim a future self-referential commit SHA. State that the full gate will
be repeated after the evidence commit and record that final commit/result in the
task report.

- [ ] **Step 4: Format and commit the evidence**

```bash
npx prettier --write docs/superpowers/verification/2026-07-10-daily-provisions-consumption-verification.md
git add docs/superpowers/verification/2026-07-10-daily-provisions-consumption-verification.md
git diff --cached --check
git commit -m "docs: record daily provisions verification"
```

- [ ] **Step 5: Re-run the gate against the final evidence commit**

```bash
npm run verify:full
lsof -nP -iTCP:8080 -sTCP:LISTEN
git status --short
git log --oneline --decorate -10
```

Expected: full gate PASS; no port listener; only
`docs/Chatlog copy.rtf` remains untracked; history contains the focused Task
1–7 commits after the approved design and plan.
