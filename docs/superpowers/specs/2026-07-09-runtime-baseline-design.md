# Runtime Baseline Design

**Status:** Approved design

**Date:** 2026-07-09

**Scope:** Phase 1A — trustworthy local and CI runtime baseline

## 1. Objective

Make the current game reliably runnable and verifiable before larger gameplay,
story, state, localization, or world-design work begins.

The completed baseline must let a fresh checkout restore the real media assets,
load the production game into João's opening scene, and run one shared validation
pipeline locally and in this repository's own GitHub Actions workflow.

## 2. Scope

This phase includes:

1. Restore the PNG and OGG objects managed by Git LFS.
2. Add an explicit asset preflight that rejects Git LFS pointer files.
3. Replace the inherited CI workflow with a new project-owned baseline workflow.
4. Replace the broken E2E shell command with a reliable server lifecycle.
5. Fix three confirmed correctness defects:
   - exact-funds ship purchases are incorrectly rejected;
   - paid harbor supplies can exceed the player's available gold;
   - `Confirm` adds global listeners during unmount instead of removing them.
6. Add focused Jest regression tests and a Chrome production smoke test.
7. Bring the README and baseline status documentation in line with the verified
   repository state.
8. Record the implementation plan and final verification evidence in the
   repository.

## 3. Non-goals

This phase does not include:

- dependency major-version upgrades;
- quest/story architecture convergence;
- daily food and water consumption;
- timeline or canon decisions;
- localization;
- multi-protagonist support;
- market fluctuation, investment, combat, or exploration work;
- Firefox or Edge CI jobs.

These remain separate follow-up slices so that infrastructure repair and gameplay
expansion do not become one unreviewable change.

## 4. Asset Restoration and Validation

### 4.1 Local restoration

Git LFS will be installed through Homebrew, initialized for the current user, and
used to pull the objects referenced by the current `origin` remote. Tracked asset
paths and `.gitattributes` remain unchanged.

The restored resources are local working-tree content, not new binary revisions.
They must not appear as modified files after hydration.

### 4.2 Asset preflight

Add `scripts/verify-assets.js` and expose it as `npm run verify:assets`.

The verifier will:

- enumerate tracked `.png` and `.ogg` files used by the application;
- reject files beginning with the Git LFS pointer signature;
- verify the PNG magic bytes for `.png` files;
- verify an Ogg container header for `.ogg` files;
- report every invalid path in one run;
- exit non-zero if any asset is missing or invalid.

Production build and E2E entry points will run this preflight first. This prevents
Webpack from reporting a successful build that merely copied 130-byte pointer
files.

## 5. Project-owned CI

Delete the inherited `.github/workflows/tests.yml`. Create
`.github/workflows/baseline.yml` owned by this repository.

The workflow will:

1. run on pushes, pull requests, and manual dispatch;
2. use Ubuntu and Node.js 22;
3. check out this repository with Git LFS enabled;
4. run `npm ci`;
5. run `npm run verify:full`, the same full validation entry point used locally;
6. fail on asset, unit-test, type, lint, build, or E2E failure.

The workflow contains no inherited deployment job, no missing `needs` target, and
no references to the original author's repository. The README badge will point to
the new `baseline.yml` workflow under `QCaine13/uncharted-waters-2`.

## 6. E2E Server Lifecycle

Use `start-server-and-test` as a development dependency instead of maintaining a
fragile background-process expression in `package.json`.

The command flow will be:

1. validate assets;
2. produce a clean production build;
3. start `http-server` for the build directory;
4. wait until the configured URL responds;
5. run Cypress in Chrome;
6. terminate the server on success, test failure, or interruption.

Local and CI execution will use the same npm script. The existing building E2E
specifications remain in place.

## 7. Correctness Fixes

### 7.1 Exact-funds purchases

Affordability means `gold >= cost`. A ship costing exactly all available gold must
be purchasable; one gold less must be rejected.

### 7.2 Harbor supply transactions

The maximum selectable quantity is the lesser of:

- remaining cargo capacity; and
- the affordable quantity for the selected provision.

Water remains free and is limited only by capacity.

The action layer will also validate ship existence, finite positive integer
quantity, capacity, and funds before mutating state. Invalid requests return
`false` and must not change cargo, gold, UI state, or persisted save data. Successful
requests return `true`, mutate once, update the interface, and save once.

This action-level validation is required even though the UI constrains input,
because future callers must not be able to bypass the transaction rules.

### 7.3 Confirm listener cleanup

`Confirm` will remove its `mousemove` and `mouseup` listeners when it unmounts.
The handler identity used for removal must match the identity registered during
mount. The change must not alter drag, keyboard, confirm, or cancel behavior.

## 8. Testing Strategy

### 8.1 Jest regressions

Add focused tests proving:

- exact gold permits a ship purchase and insufficient gold does not;
- paid supplies are bounded by both funds and capacity;
- invalid, fractional, negative, or excessive supply requests are atomic no-ops;
- successful supply requests update cargo and gold once;
- `Confirm` registers and removes matching global listeners;
- the asset verifier accepts valid fixture headers and rejects LFS pointer data.

Tests will be written before the corresponding production change and observed
failing for the intended reason.

### 8.2 Chrome E2E

Add a production smoke specification proving that:

- the game exits the loading state;
- the camera canvas is present;
- João's opening dialogue is rendered.

Run the existing building E2E suite unchanged unless a test itself is proven stale.

### 8.3 Full local gate

Expose two local validation commands:

`npm run verify` runs:

1. asset preflight;
2. Jest;
3. TypeScript checking;
4. ESLint;
5. production build.

`npm run verify:full` runs `verify` and then Chrome E2E against that production
build.

CI invokes `verify:full` rather than duplicating test logic in YAML.

## 9. Documentation and Records

Update the README with:

- Git LFS installation and hydration instructions;
- supported Node version;
- local development, build, and validation commands;
- the new project-owned CI badge;
- accurate current feature and test statements.

Update only status statements directly affected by this phase in `docs/`. Do not
rewrite narrative or roadmap decisions.

Store the implementation plan under
`docs/superpowers/plans/2026-07-09-runtime-baseline-implementation.md`.
Store final command results and deferred issues in
`docs/superpowers/verification/2026-07-09-runtime-baseline-verification.md`.

## 10. Acceptance Criteria

The phase is complete only when:

- all tracked PNG/OGG files are hydrated and pass the asset verifier;
- a production browser session reaches João's opening scene;
- all existing and new Jest tests pass;
- TypeScript and ESLint pass with zero errors;
- the production build succeeds using real assets;
- all Chrome Cypress tests pass without a leaked server process;
- `.github/workflows/baseline.yml` is the only project test workflow;
- the README badge and setup instructions reference this repository;
- the implementation and verification records are committed;
- no unrelated or user-owned files, including `docs/Chatlog copy.rtf`, are staged
  or modified.

## 11. Rollback and Failure Handling

- LFS hydration does not change tracked content and can be retried safely.
- Each correctness fix is isolated behind its own failing regression test.
- If an existing E2E test fails after real assets are restored, diagnose the failure
  before changing either the test or behavior.
- If the remote LFS store lacks an object, stop and record the missing object ID;
  do not substitute or generate replacement art in this phase.
- The inherited CI workflow is removed only in the same change that adds the new
  baseline workflow, so the repository never intentionally lands without CI.
