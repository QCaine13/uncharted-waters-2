# Daily Provisions Consumption Verification

**Design and execution date:** 2026-07-10

**Branch:** `codex/daily-provisions`

**Verified pre-evidence commit:**
`1694cf3b6fbb9ae3354ffdfd4c9d806b43f6a897`

## Acceptance gate

The isolated worktree started clean. After removing the production build
output, the following full gate completed successfully against the
pre-evidence commit:

```text
rm -rf build
npm run verify:full
```

The gate ran the asset preflight, every Jest suite, TSX-inclusive TypeScript,
ESLint, the production Webpack build, and every Chrome Cypress spec.
`start-server-and-test` stopped the temporary production server after Cypress
exited.

## Full-gate results

- Git LFS: `git-lfs/3.7.1 (GitHub; darwin arm64; go 1.25.3)`; `git lfs ls-files` listed 38 tracked PNG/OGG/MP3 media files.
- Asset preflight: all 38 PNG/OGG/MP3 assets passed.
- Jest: 21 of 21 suites passed; 107 of 107 tests passed; 0 snapshots.
- TypeScript: `tsc --noEmit` passed with no diagnostics.
- ESLint: `eslint src/ --ext .ts --ext .tsx` passed with no diagnostics.
- Webpack: Webpack 5.74.0 completed the production build with three non-fatal
  performance warnings: assets over the recommended size limit, the `main`
  entrypoint over the recommended size limit, and the code-splitting
  recommendation. Browserslist also reported that `caniuse-lite` is outdated.
- Cypress: Cypress 10.10.0 used headless Chrome 150 and found 10 specs. All 10
  specs and all 46 tests passed, with 0 failures, 0 pending tests, and 0 skipped
  tests.

A fresh verbose focused Jest run also passed 5 of 5 suites and 24 of 24 tests:

- pure fleet provision rules: 8 tests;
- provision state actions: 4 tests;
- world day-boundary orchestration: 4 tests;
- provisions component copy, loaded-state, and live-status rendering: 7 tests;
- persisted and live sea-day display: 1 test.

## Daily-provisions acceptance paths

The Chrome `provisions.cy.ts` spec passed both new production scenarios:

1. An at-sea version-2 save at 23:40 with 11 crew crossed midnight, advanced
   from Day 4 to Day 5, consumed the rounded fleet rate of 2 water and 2 food,
   rendered `Only 3 days remaining` with the orange low-warning class, saved
   `timePassed`, `dayAtSea`, and the settled cargo to local storage, and
   immediately rendered the same day, quantity, and warning after reload.
2. Positive but insufficient water and food were consumed without going
   negative, removed at exhaustion, and rendered `Supplies exhausted` with the
   red exhausted class.

The focused pure, action, world, and component suites additionally passed the
fleet-shared and flagship-first deduction order, duplicate cargo entry,
multi-day aggregation, one final provisions refresh/save per settlement,
unrelated-cargo preservation, normal/low/sub-day/exhausted/zero-crew summary,
sail-time refresh, and persisted initial display paths.

## Persistence and repository hygiene

- `SAVE_VERSION` remains exactly `2` in `src/state/saveMigrations.ts`; no save
  field or migration was added for this slice.
- `lsof -nP -iTCP:8080 -sTCP:LISTEN` produced no output and exited 1 after the
  full gate, confirming that no process remained listening on port 8080.
- The only project-owned workflow file was
  `.github/workflows/baseline.yml`.
- `git diff --check` exited 0.
- The full gate generated the disposable untracked file
  `cypress/downloads/downloads.html`; it was removed, after which the linked
  worktree returned to a clean status before this record was created.
- The linked worktree does not surface the main checkout's untracked files.
  A read-only `git -C /Users/caine/uncharted-waters-2 status --short` showed
  only `docs/Chatlog copy.rtf` in the main checkout. That user-owned file was
  not copied, staged, modified, deleted, or committed.

## Non-fatal environment notices

The successful Chrome run also emitted the following non-fatal notices:

- `Missing baseUrl in compilerOptions. tsconfig-paths will be skipped`;
- the Cypress macOS `term-size` helper reported `Bad CPU type in executable`;
- Node.js v22.23.1 reported the existing `[DEP0066]` deprecation warning for
  `OutgoingMessage.prototype._headers`.

None changed the zero-failure result.

## Deferred and explicitly excluded behavior

This verified MVP does not implement:

- crew injury, death, disease, or morale;
- forced rescue, game-over, or movement penalties;
- per-ship starvation or isolated ship supply rules;
- manual ship-to-ship cargo transfer;
- a generic daily survival or event engine;
- port-side provision consumption;
- localization or replacement of the existing English UI text;
- dependency upgrades or unrelated infrastructure cleanup.

It also adds no modal, confirmation prompt, movement pause, or repeated daily
toast. Lumber, shot, and trade goods remain outside daily consumption. Any
original-game starvation consequence remains deferred until it is researched
and approved as a separate slice.

This file records the full gate against the pre-evidence commit. It cannot
truthfully contain the SHA of the commit that creates the file itself. After
this record is committed, the same full gate is repeated against the evidence
commit; that commit SHA and the post-commit result are recorded in the Task 7
execution report.
