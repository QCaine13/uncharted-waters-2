# Runtime Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a fresh checkout restore real media assets, load João's opening scene, and pass one project-owned local/CI validation pipeline while fixing the three confirmed baseline defects.

**Architecture:** Keep the current Canvas/React architecture intact. Add a small Node asset preflight at the repository boundary, make npm scripts the single source of truth for validation, replace the inherited GitHub Actions workflow, and isolate each correctness fix behind a failing regression test.

**Tech Stack:** Node.js 22, npm, Git LFS, TypeScript 4.8, React 18, Jest 29, Cypress 10, Webpack 5, GitHub Actions, `http-server`, `start-server-and-test`.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-09-runtime-baseline-design.md`.
- Do not perform dependency major-version upgrades; the only new dependency is `start-server-and-test@^2.0.8`.
- CI runs only Chrome E2E in this phase.
- Do not change quest/story architecture, daily provisions consumption, timeline/canon, localization, combat, exploration, or investment behavior.
- Never stage, modify, delete, or commit `docs/Chatlog copy.rtf`.
- Begin every production behavior change with a focused failing test and finish it with a dedicated commit.
- Run commands from `/Users/caine/uncharted-waters-2`.

## File Map

**Create:**

- `scripts/verify-assets.js` — validate tracked PNG/OGG content.
- `scripts/verify-assets.test.ts` — preflight unit tests.
- `.github/workflows/baseline.yml` — project-owned CI.
- `tests/e2e/smoke.cy.ts` — production/João smoke test.
- `src/state/selectors.test.ts` — affordability regression.
- `src/state/actionsPort.test.ts` — supply transaction regressions.
- `src/interface/common/Confirm.test.tsx` — listener lifecycle regression.
- `docs/superpowers/verification/2026-07-09-runtime-baseline-verification.md` — final evidence.

**Modify:** `package.json`, `package-lock.json`, `tests/utils.ts`,
`src/state/selectors.ts`, `src/state/actionsPort.ts`,
`src/interface/port/harbor/HarborSupplyInput.tsx`,
`src/interface/common/Confirm.tsx`, `README.md`, `docs/README.md`,
`docs/4-engineering/README.md`, and
`docs/5-data-governance/current-inventory.md`.

**Delete:** `.github/workflows/tests.yml`.

---

### Task 1: Asset Preflight and Git LFS Hydration

**Files:**

- Create: `scripts/verify-assets.js`
- Create: `scripts/verify-assets.test.ts`
- Modify: `package.json`

**Interfaces:**

- Produces: `validateAssetBuffer(filePath: string, buffer: Buffer): string | null`.
- Produces: `getTrackedAssetPaths(): string[]`.
- Produces: `main(paths?: string[]): number`, where `0` is valid and `1` is invalid.
- Produces: npm command `verify:assets`.

- [ ] **Step 1: Write the failing asset-signature tests**

Create `scripts/verify-assets.test.ts`:

```ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validateAssetBuffer } = require('./verify-assets');

describe('asset preflight', () => {
  test('accepts PNG and Ogg signatures', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ogg = Buffer.from('OggS', 'ascii');

    expect(validateAssetBuffer('sprite.png', png)).toBeNull();
    expect(validateAssetBuffer('music.ogg', ogg)).toBeNull();
  });

  test('rejects pointers and invalid signatures', () => {
    const pointer = Buffer.from(
      'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:abc\nsize 123\n',
    );

    expect(validateAssetBuffer('sprite.png', pointer)).toContain(
      'Git LFS pointer',
    );
    expect(validateAssetBuffer('sprite.png', Buffer.from('not png'))).toContain(
      'invalid PNG signature',
    );
    expect(validateAssetBuffer('music.ogg', Buffer.from('not ogg'))).toContain(
      'invalid Ogg signature',
    );
  });
});
```

- [ ] **Step 2: Verify the red state**

Run `npx jest scripts/verify-assets.test.ts --runInBand`.

Expected: FAIL because `./verify-assets` does not exist.

- [ ] **Step 3: Implement the validator**

Create `scripts/verify-assets.js`:

```js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const LFS_SIGNATURE = 'version https://git-lfs.github.com/spec/v1';
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const OGG_SIGNATURE = Buffer.from('OggS', 'ascii');

const validateAssetBuffer = (filePath, buffer) => {
  if (buffer.subarray(0, LFS_SIGNATURE.length).toString() === LFS_SIGNATURE) {
    return `${filePath}: Git LFS pointer was not hydrated`;
  }
  if (
    path.extname(filePath) === '.png' &&
    !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    return `${filePath}: invalid PNG signature`;
  }
  if (
    path.extname(filePath) === '.ogg' &&
    !buffer.subarray(0, OGG_SIGNATURE.length).equals(OGG_SIGNATURE)
  ) {
    return `${filePath}: invalid Ogg signature`;
  }
  return null;
};

const getTrackedAssetPaths = () =>
  execFileSync('git', ['ls-files', '-z', '--', '*.png', '*.ogg'])
    .toString()
    .split('\0')
    .filter(Boolean);

const main = (paths = getTrackedAssetPaths()) => {
  const errors = paths.flatMap((filePath) => {
    if (!fs.existsSync(filePath)) return [`${filePath}: missing file`];
    const error = validateAssetBuffer(filePath, fs.readFileSync(filePath));
    return error ? [error] : [];
  });

  if (errors.length) {
    process.stderr.write(`${errors.join('\n')}\n`);
    return 1;
  }

  process.stdout.write(`Verified ${paths.length} PNG/OGG assets.\n`);
  return 0;
};

if (require.main === module) process.exitCode = main();

module.exports = { validateAssetBuffer, getTrackedAssetPaths, main };
```

- [ ] **Step 4: Expose and test the preflight**

Add `"verify:assets": "node scripts/verify-assets.js"` to `package.json`.

Run `npx jest scripts/verify-assets.test.ts --runInBand`.

Expected: 2 tests PASS.

- [ ] **Step 5: Prove the current checkout is rejected before hydration**

Run `npm run verify:assets`.

Expected: non-zero exit with every pointer reported as `Git LFS pointer was not hydrated`.

- [ ] **Step 6: Install and hydrate Git LFS**

```bash
brew install git-lfs
git lfs install
git lfs pull origin master
```

Expected: `git lfs version` succeeds and no object is missing.

- [ ] **Step 7: Verify hydration and repository hygiene**

```bash
npm run verify:assets
git status --short
```

Expected: preflight exits 0; assets are not modified; `docs/Chatlog copy.rtf` remains untracked.

- [ ] **Step 8: Commit**

```bash
git add package.json scripts/verify-assets.js scripts/verify-assets.test.ts
git diff --cached --check
git commit -m "build: verify hydrated media assets"
```

---

### Task 2: Project-owned CI and Reliable Chrome E2E

**Files:**

- Modify: `package.json`, `package-lock.json`, `tests/utils.ts`
- Create: `tests/e2e/smoke.cy.ts`, `.github/workflows/baseline.yml`
- Delete: `.github/workflows/tests.yml`

**Interfaces:**

- Consumes: `verify:assets` from Task 1.
- Produces: npm commands `build:webpack`, `typecheck`, `serve:build`,
  `cypress:run`, `test:e2e:built`, `test:e2e`, `verify`, and `verify:full`.
- Produces: `setState(state: Partial<State>): void` with `SAVE_VERSION`.

- [ ] **Step 1: Write the smoke test**

Create `tests/e2e/smoke.cy.ts`:

```ts
import { characterMessageIncludes, setState } from '../utils';

describe('Production smoke', () => {
  before(() => {
    setState({ portId: '1', buildingId: '8' });
    cy.visit('');
  });

  it('loads real assets and reaches João opening dialogue', () => {
    cy.contains('Game is loading...').should('not.exist');
    cy.get('#camera').should('exist');
    characterMessageIncludes('Father, did you send for me?', 2);
  });
});
```

- [ ] **Step 2: Verify the smoke test is red**

In separate terminals run:

```bash
npm run build
npx http-server build --silent
npx cypress run --browser chrome --spec tests/e2e/smoke.cy.ts
```

Expected: FAIL because `tests/utils.ts` writes an unversioned save, so building
`8` is not restored. Stop the manual server after the failure.

- [ ] **Step 3: Version Cypress state fixtures**

Change the start of `tests/utils.ts` to:

```ts
import { SAVED_STATE_KEY, State } from '../src/state/state';
import { SAVE_VERSION } from '../src/state/saveLoad';
import { Position } from '../src/interface/port/CharacterMessageBox';

export const setState = (state: Partial<State>) =>
  window.localStorage.setItem(
    SAVED_STATE_KEY,
    JSON.stringify({ version: SAVE_VERSION, ...state }),
  );
```

- [ ] **Step 4: Add the server lifecycle dependency**

Run `npm install --save-dev start-server-and-test@^2.0.8`.

Expected: only `package.json` and `package-lock.json` change for dependency installation.

- [ ] **Step 5: Replace package scripts with the shared pipeline**

Use these script values in `package.json`:

```json
"cypress:run": "cypress run --browser chrome",
"typecheck": "tsc --noEmit",
"verify:assets": "node scripts/verify-assets.js",
"build:webpack": "rm -rf build/ && webpack --mode production",
"build": "npm run verify:assets && npm run build:webpack",
"serve:build": "http-server build --silent",
"test:e2e:built": "start-server-and-test serve:build http://127.0.0.1:8080 cypress:run",
"test:e2e": "npm run build && npm run test:e2e:built",
"verify": "npm run verify:assets && npm test -- --runInBand && npm run typecheck && npm run lint && npm run build:webpack",
"verify:full": "npm run verify && npm run test:e2e:built"
```

Keep `start`, `cypress`, `lint`, `prettier`, and `test`. Extend `prettier` to
`prettier --write src/ tests/ scripts/`. Remove the inherited Firefox and Edge scripts.

- [ ] **Step 6: Replace inherited CI**

Delete `.github/workflows/tests.yml`. Create `.github/workflows/baseline.yml`:

```yaml
name: Baseline

on:
  push:
  pull_request:
  workflow_dispatch:

jobs:
  baseline:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository and LFS assets
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Use Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run full baseline verification
        run: npm run verify:full
```

- [ ] **Step 7: Run Chrome E2E and the non-E2E gate**

```bash
npm run test:e2e
npm run verify
```

Expected: smoke and existing Cypress specs PASS; the server terminates; asset,
Jest, TypeScript, ESLint, and Webpack stages exit 0. Diagnose any existing-spec
failure with `superpowers:systematic-debugging` before changing behavior.

- [ ] **Step 8: Commit**

```bash
git add .github/workflows/baseline.yml .github/workflows/tests.yml package.json package-lock.json tests/utils.ts tests/e2e/smoke.cy.ts
git diff --cached --check
git commit -m "ci: establish project-owned baseline checks"
```

---

### Task 3: Exact-funds Affordability Boundary

**Files:**

- Create: `src/state/selectors.test.ts`
- Modify: `src/state/selectors.ts:45`

**Interfaces:** Produces unchanged `canAfford(cost: number): boolean` with inclusive semantics.

- [ ] **Step 1: Write the failing boundary tests**

Create `src/state/selectors.test.ts`:

```ts
import state from './state';
import { canAfford } from './selectors';

describe('canAfford', () => {
  beforeEach(() => {
    state.gold = 2400;
  });

  test('allows a purchase costing exactly all available gold', () => {
    expect(canAfford(2400)).toBe(true);
  });

  test('rejects a purchase costing one gold too much', () => {
    expect(canAfford(2401)).toBe(false);
  });
});
```

- [ ] **Step 2: Verify the exact-funds test is red**

Run `npx jest src/state/selectors.test.ts --runInBand`.

Expected: first test FAILS with `Expected: true, Received: false`; second passes.

- [ ] **Step 3: Implement inclusive affordability**

```ts
export const canAfford = (cost: number) => state.gold >= cost;
```

- [ ] **Step 4: Run focused and full unit tests**

```bash
npx jest src/state/selectors.test.ts --runInBand
npm test -- --runInBand
```

Expected: focused 2/2 PASS and full Jest suite PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/selectors.ts src/state/selectors.test.ts
git diff --cached --check
git commit -m "fix: allow purchases with exact funds"
```

---

### Task 4: Atomic Harbor Supply Transactions

**Files:**

- Create: `src/state/actionsPort.test.ts`
- Modify: `src/state/actionsPort.ts:122-159`
- Modify: `src/interface/port/harbor/HarborSupplyInput.tsx:29-47`

**Interfaces:**

- Produces: `getSupplyLimit(shipNumber: number, provision: Provisions): number`.
- Changes: `supplyShip(shipNumber: number, provision: Provisions, quantity: number): boolean`.

- [ ] **Step 1: Write failing transaction tests**

Create `src/state/actionsPort.test.ts`:

```ts
import state from './state';
import updateInterface from './updateInterface';
import { getSupplyLimit, supplyShip } from './actionsPort';

const ship = () => ({
  id: '6',
  name: 'Hermes II',
  crew: 10,
  cargo: [],
  durability: 25,
});

describe('harbor supply transactions', () => {
  beforeEach(() => {
    state.gold = 100;
    state.fleets = { '1': { position: undefined, ships: [ship()] } };
    updateInterface.general = jest.fn();
    window.localStorage.clear();
  });

  test('limits paid supplies by funds and water only by capacity', () => {
    expect(getSupplyLimit(0, 'food')).toBe(5);
    expect(getSupplyLimit(0, 'water')).toBe(110);
  });

  test.each([0, -1, 1.5, Number.NaN])(
    'rejects invalid quantity %s without mutation',
    (quantity) => {
      const before = JSON.stringify(state.fleets);
      expect(supplyShip(0, 'food', quantity)).toBe(false);
      expect(JSON.stringify(state.fleets)).toBe(before);
      expect(state.gold).toBe(100);
      expect(window.localStorage.length).toBe(0);
    },
  );

  test('rejects unaffordable or over-capacity quantities atomically', () => {
    expect(supplyShip(0, 'food', 6)).toBe(false);
    expect(supplyShip(0, 'water', 111)).toBe(false);
    expect(state.fleets['1'].ships[0].cargo).toEqual([]);
    expect(state.gold).toBe(100);
  });

  test('applies a valid purchase once and persists it', () => {
    expect(supplyShip(0, 'food', 5)).toBe(true);
    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: 'food', quantity: 5 },
    ]);
    expect(state.gold).toBe(0);
    expect(window.localStorage.length).toBe(1);
  });
});
```

- [ ] **Step 2: Verify the red state**

Run `npx jest src/state/actionsPort.test.ts --runInBand`.

Expected: FAIL because `getSupplyLimit` is absent and `supplyShip` neither
validates nor returns a boolean.

- [ ] **Step 3: Implement the authoritative limit and atomic action**

Import `getAvailableSpace` with the existing fleet selectors, then replace the
supply implementation in `src/state/actionsPort.ts` with:

```ts
export const provisionCost: { [key in Provisions]: number } = {
  water: 0,
  food: 20,
  lumber: 90,
  shot: 120,
};

export const getSupplyLimit = (
  shipNumber: number,
  provision: Provisions,
): number => {
  const ship = state.fleets['1']?.ships[shipNumber];
  if (!ship) return 0;

  const availableSpace = getAvailableSpace(shipNumber);
  const unitCost = provisionCost[provision];
  const affordable =
    unitCost === 0 ? availableSpace : Math.floor(state.gold / unitCost);

  return Math.max(0, Math.min(availableSpace, affordable));
};

export const supplyShip = (
  shipNumber: number,
  provision: Provisions,
  quantity: number,
): boolean => {
  if (
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > getSupplyLimit(shipNumber, provision)
  ) {
    return false;
  }

  const targetShip = state.fleets['1'].ships[shipNumber];
  const existing = targetShip.cargo.find((item) => item.type === provision);

  if (existing) existing.quantity += quantity;
  else targetShip.cargo.push({ type: provision, quantity });

  state.gold -= provisionCost[provision] * quantity;
  updateGeneral();
  save();
  return true;
};
```

- [ ] **Step 4: Route the UI through the same limit**

In `HarborSupplyInput.tsx`, import `getSupplyLimit` and use:

```tsx
const limit = getSupplyLimit(shipNumber, provision);

<InputNumber
  limit={limit}
  onComplete={(quantity) => {
    if (supplyShip(shipNumber, provision, quantity)) onComplete();
  }}
  onCancel={onCancel}
  inlined
/>;
```

Remove the old `getAvailableSpace` import from this component.

- [ ] **Step 5: Run focused, full unit, and harbor E2E checks**

```bash
npx jest src/state/actionsPort.test.ts --runInBand
npm test -- --runInBand
npm run build
npx start-server-and-test serve:build http://127.0.0.1:8080 \
  "cypress run --browser chrome --spec tests/e2e/harbor.cy.ts"
```

Expected: focused and full Jest suites PASS, then harbor Cypress PASS; the
temporary server exits when Cypress finishes.

- [ ] **Step 6: Commit**

```bash
git add src/state/actionsPort.ts src/state/actionsPort.test.ts src/interface/port/harbor/HarborSupplyInput.tsx
git diff --cached --check
git commit -m "fix: enforce harbor supply limits"
```

---

### Task 5: Confirm Dialog Listener Lifecycle

**Files:**

- Create: `src/interface/common/Confirm.test.tsx`
- Modify: `src/interface/common/Confirm.tsx:98-108`

**Interfaces:** Preserves the `Confirm` component props and behavior while making
its document-level drag listeners mount/unmount symmetric.

- [ ] **Step 1: Write the failing cleanup test**

Create `src/interface/common/Confirm.test.tsx`:

```tsx
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import Confirm from './Confirm';

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

describe('Confirm listener lifecycle', () => {
  test('removes the same document drag handlers on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <Confirm
          onYes={jest.fn()}
          onNo={jest.fn()}
          initialPosition={{ x: 10, y: 20 }}
        />,
      );
    });

    const mousemove = addSpy.mock.calls.find(([type]) => type === 'mousemove');
    const mouseup = addSpy.mock.calls.find(([type]) => type === 'mouseup');

    expect(mousemove).toBeDefined();
    expect(mouseup).toBeDefined();

    act(() => root.unmount());

    expect(removeSpy).toHaveBeenCalledWith('mousemove', mousemove?.[1]);
    expect(removeSpy).toHaveBeenCalledWith('mouseup', mouseup?.[1]);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Verify the cleanup test is red**

Run `npx jest src/interface/common/Confirm.test.tsx --runInBand`.

Expected: FAIL because unmount calls `document.addEventListener` again instead
of removing the two handlers.

- [ ] **Step 3: Make cleanup symmetric**

Change only the cleanup body in `Confirm.tsx`:

```ts
return () => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
};
```

- [ ] **Step 4: Run focused and full unit checks**

```bash
npx jest src/interface/common/Confirm.test.tsx --runInBand
npm test -- --runInBand
```

Expected: focused lifecycle test and full Jest suite PASS.

- [ ] **Step 5: Commit**

```bash
git add src/interface/common/Confirm.tsx src/interface/common/Confirm.test.tsx
git diff --cached --check
git commit -m "fix: clean up confirm drag listeners"
```

---

### Task 6: Synchronize Public and Internal Status Documentation

**Files:**

- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `docs/4-engineering/README.md`
- Modify: `docs/5-data-governance/current-inventory.md`

**Interfaces:** Documents Node 22 + Git LFS setup, the shared verification
commands, the project-owned CI, and the code state verified on 2026-07-09.

- [ ] **Step 1: Update the public README identity and setup path**

In `README.md`:

1. Replace the inherited build badge with:

   ```md
   [![Baseline](https://github.com/QCaine13/uncharted-waters-2/actions/workflows/baseline.yml/badge.svg)](https://github.com/QCaine13/uncharted-waters-2/actions/workflows/baseline.yml)
   ```

2. Preserve the original-game attribution and architecture explanation, but
   describe this repository as the actively upgraded project rather than the
   original author's consulting showcase.
3. Remove the claim that the current project is playable at the original
   author's hosted URL.
4. Remove the stale “Next up” entries for shipyard purchasing and pub crew
   recruitment, which already exist in code.
5. Add a `Development` section with these exact prerequisites and commands:

   ```md
   Requirements: Node.js 22, npm, and Git LFS.

   git lfs install
   git lfs pull origin master
   npm ci
   npm start
   ```

6. Explain that `npm run verify` runs assets + Jest + TypeScript + ESLint +
   production build, while `npm run verify:full` adds Chrome E2E.

- [ ] **Step 2: Correct the documentation status panel**

In `docs/README.md`:

- replace the old commit/date status line with “2026-07-09 verified against
  the checked-out code” without hard-coding a soon-stale implementation SHA;
- change save/load to “MVP + version 2 migration implemented” and link to
  `src/state/saveLoad.ts`;
- change the quest engine row to “slice 1 implemented; wider narrative/lore
  integration pending”;
- add a row for “runtime baseline / CI” pointing to the asset preflight,
  `baseline.yml`, and the verification record;
- keep large narrative, map expansion, fame, and non-baseline systems pending.

- [ ] **Step 3: Correct engineering proposal statuses**

In `docs/4-engineering/README.md`:

- change `quest-event-system.md` from “slice 1 planned/pure migration” to
  “slice 1 implemented; next slices pending”;
- change `save-load-persistence.md` from “migration pending” to “MVP + v2
  migration implemented; future schema evolution remains”;
- clarify that the data architecture convention has begun landing with quest
  slice 1 rather than remaining wholly unimplemented;
- preserve D3–D6 as historical locked decisions and annotate D4/D6 as landed.

- [ ] **Step 4: Replace the stale data-inventory disclaimer and counts**

In `docs/5-data-governance/current-inventory.md`, set the audit date to
2026-07-09, remove the “counts predate those files” disclaimer, and add these
verified runtime rows:

| Dataset                    | File                            | Count | Status                  |
| -------------------------- | ------------------------------- | ----: | ----------------------- |
| Trade goods                | `src/data/goodsData.ts`         |    24 | Implemented             |
| Market definitions         | `src/data/marketGoodsData.ts`   |    13 | Implemented             |
| Relics / discoveries       | `src/data/relicData.ts`         |    24 | Implemented data        |
| Legend / event definitions | `src/data/legendData.ts`        |    13 | Implemented data        |
| Lore trade-good records    | `docs/lore/entities/trade_*.md` |    13 | Documentation data only |

Also state that `docs/lore/entities/` contains 50 data-only records not yet wired
into runtime progression. Keep the governance boundary between `src/data` and
`reference-db.json`.

- [ ] **Step 5: Check for the known stale claims**

Run:

```bash
rg -n "JohanLi/.*/build.yml|johan\.li/uncharted-waters-2|版本迁移.*待做|slice 1 = 纯迁移|counts below predate|Shipyards|Recruit crew" README.md docs
```

Expected: no obsolete status claim remains. Historical descriptions that are
clearly labelled as historical may remain only if needed to explain a decision.

- [ ] **Step 6: Run formatting and the non-E2E baseline**

```bash
npx prettier --write README.md docs/README.md docs/4-engineering/README.md docs/5-data-governance/current-inventory.md
npm run verify
```

Expected: documentation is formatted and assets, Jest, TypeScript, ESLint, and
Webpack all PASS.

- [ ] **Step 7: Commit**

```bash
git add README.md docs/README.md docs/4-engineering/README.md docs/5-data-governance/current-inventory.md
git diff --cached --check
git commit -m "docs: align status with runtime baseline"
```

---

### Task 7: Full Verification and Durable Evidence

**Files:**

- Create: `docs/superpowers/verification/2026-07-09-runtime-baseline-verification.md`

**Interfaces:** Produces the durable acceptance record for Phase 1A without
changing runtime behavior.

- [ ] **Step 1: Start from a clean build output and run the single full gate**

```bash
rm -rf build
npm run verify:full
```

Expected: asset preflight, Jest, TypeScript, ESLint, Webpack, smoke Cypress,
and all existing Chrome Cypress specs PASS; `start-server-and-test` terminates
the server when Cypress exits.

- [ ] **Step 2: Verify no server or inherited workflow remains**

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
find .github/workflows -maxdepth 1 -type f -print | sort
git status --short
git diff --check
```

Expected: `lsof` prints no listener; the workflow list contains only
`.github/workflows/baseline.yml`; status contains only the intended verification
record plus the user's untouched `docs/Chatlog copy.rtf`; diff check exits 0.

- [ ] **Step 3: Write the verification record using actual command output**

Create `docs/superpowers/verification/2026-07-09-runtime-baseline-verification.md`
with:

- date, branch, and verified commit SHA;
- `git lfs version` and the actual PNG/OGG asset count;
- Jest suite/test counts;
- TypeScript, ESLint, and Webpack outcomes, including non-fatal warnings;
- Cypress browser, spec count, and test count;
- confirmation that port 8080 has no listener after the run;
- the exact workflow file list;
- any environment-specific caveat;
- the deferred Phase 1A non-goals from the design document.

Do not copy the expected counts from this plan if actual output differs; record
and investigate the real output.

- [ ] **Step 4: Commit the evidence**

```bash
git add docs/superpowers/verification/2026-07-09-runtime-baseline-verification.md
git diff --cached --check
git commit -m "docs: record runtime baseline verification"
```

- [ ] **Step 5: Re-run the acceptance gate against the final commit**

```bash
npm run verify:full
lsof -nP -iTCP:8080 -sTCP:LISTEN
git status --short
git log --oneline --decorate -8
```

Expected: full gate PASS; no server listener; only
`docs/Chatlog copy.rtf` remains untracked; log contains the focused commits from
Tasks 1–7 after the approved design and implementation-plan commits.
