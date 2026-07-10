# Runtime Baseline Verification

**Design and plan date:** 2026-07-09

**Execution date:** 2026-07-10

**Branch:** `codex/runtime-baseline`

**Verified pre-evidence commit:** `a3911f7f5282b7d6eed80a72c3282ad8c8d75374`

## Acceptance gate

The worktree started clean. From a removed `build/` directory, the following
gate completed successfully on the pre-evidence commit:

```text
rm -rf build
npm run verify:full
```

The gate exercised the asset preflight, Jest, TypeScript (including the
configured TSX sources), ESLint, the production Webpack build, and all Chrome
Cypress tests. `start-server-and-test` shut down the production server after
Cypress exited.

## Results

- Git LFS: `git-lfs/3.7.1 (GitHub; darwin arm64; go 1.25.3)`.
- Assets: 38 tracked PNG/OGG/MP3 files passed the preflight.
- Jest: 16 of 16 suites passed; 83 of 83 tests passed; 0 snapshots.
- TypeScript: `tsc --noEmit` passed with no diagnostics.
- ESLint: `eslint src/ --ext .ts --ext .tsx` passed with no errors or warnings.
- Webpack: Webpack 5.74.0 completed the production build with three non-fatal
  performance warnings: assets over the recommended size limit, the `main`
  entrypoint over the recommended size limit, and the code-splitting
  recommendation. Browserslist also reported that `caniuse-lite` is outdated.
- Cypress: Cypress 10.10.0 used headless Chrome 150 and found 9 specs. All 44
  tests passed with no failures, pending tests, or skipped tests.
- Server lifecycle: `lsof -nP -iTCP:8080 -sTCP:LISTEN` returned no listener
  after the run (exit status 1).
- Workflow files:

  ```text
  .github/workflows/baseline.yml
  ```

`git diff --check` passed. The isolated worktree was clean before this record
was created. The original checkout remained untouched apart from the user's
untracked `docs/Chatlog copy.rtf`.

## Environment notes

Verification ran on macOS 26.5.2 with Node.js v22.23.1 and npm 10.9.8. Cypress
printed a non-fatal `Missing baseUrl in compilerOptions. tsconfig-paths will be skipped` notice. The temporary `http-server` process also printed Node's
non-fatal `DEP0066` deprecation warning for
`OutgoingMessage.prototype._headers`. Neither notice caused a test failure.

This file records the first full gate against the pre-evidence commit. It
cannot truthfully contain the SHA of the commit that creates the file itself.
After this record is committed, the same full gate is run a second time against
that final evidence commit; its SHA and result are captured in the Task 7
execution report.

## Deferred Phase 1A non-goals

The approved design keeps the following work in separate follow-up slices:

- dependency major-version upgrades;
- quest/story architecture convergence;
- daily food and water consumption;
- timeline or canon decisions;
- localization;
- multi-protagonist support;
- market fluctuation, investment, combat, or exploration work;
- Firefox or Edge CI jobs.
