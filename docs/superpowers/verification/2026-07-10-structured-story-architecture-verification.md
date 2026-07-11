# Structured Story Architecture Verification

**Design date:** 2026-07-10

**Execution date:** 2026-07-11

**Branch:** `codex/story-architecture`

**Verified pre-evidence SHA:** `45322d43408e75e60391d7eab84adf385f48d6ab`

This record verifies the typed structured-story runtime and the
behavior-preserving migration of the existing João Lisbon opening through the
production Webpack assets. It records the checked pre-evidence revision only;
it does not predict or claim the SHA of the commit that contains this file.

## Content report and validation

`npm run story:report` reported:

- 8 characters, 7 declared relationships, 1 arc, and 48 events;
- 0 validation errors and 0 warnings;
- 47 entry events and 47 terminal events under the report's positive
  `eventCompleted` topology definition;
- no cross-arc dependencies, unreferenced characters, or unreferenced
  relationships;
- complete legacy compatibility: all 10 once-only events have Save v2 keys.

`npm run story:validate` passed its selected manifest validation test. The
focused production-safety check, `production mode excludes an invalid event while preserving a valid event`, also passed: 1 selected test passed in 1
suite, with the other 9 registry tests skipped by the name filter.

## Focused runtime suites

Fresh focused Jest runs passed with these exact counts:

| Surface                                                     | Suites |  Tests |
| ----------------------------------------------------------- | -----: | -----: |
| Resolver + exhaustive Lisbon parity                         |      2 |     23 |
| Transcript parity                                           |      1 |      3 |
| Effects + Lisbon state parity + production adapter          |      3 |     24 |
| Immutable story sessions                                    |      1 |      9 |
| Save v2 compatibility + legacy-key adapter                  |      2 |      5 |
| UI projection + session adapter + real React hook lifecycle |      3 |     17 |
| **Combined focused set**                                    | **12** | **81** |

The resolver parity suite includes 368,640 legacy-oracle comparisons. The
transcript suite compares all 48 production event transcripts and both harbor
branches. The effects suites cover legacy final state and persistence timing,
including every migrated nonempty effect group.

## Production browser acceptance

The required focused command rebuilt production assets and ran Chrome against
`tests/e2e/storyArchitecture.cy.ts`. Cypress 10.10.0 used headless Chrome 150;
the focused result was **1 spec, 4 tests, 4 passing, 0 failing**.

The four isolated tests prove observable behavior only, without fixed waits:

1. A new Save v2 at Lisbon house (`portId: '1'`, `buildingId: '8'`) reaches the
   exact opening line `Father, did you send for me?`.
2. A partial Save v2 with the legacy `houseBeforeQuest` and `pubAfterQuest`
   keys resolves the exact item-shop rapier event, receives item `4`, writes
   `itemShopAfterQuest`, reloads, and resolves the non-repeating follow-up line.
3. A fixture immediately before `harborFinal` selects Yes and verifies the
   branch transcript, persistence boundary, legacy mate-role behavior, and
   terminal completion.
4. An isolated copy of that fixture selects No and verifies its distinct
   transcript, the same legacy mate-role behavior, and terminal completion.

The serialized fixture represents real Save v2 data: João has captain role
`0`, while Rocco and Enrico have `null` roles. Both branches preserve those
`null` roles, matching the characterized legacy `Number.isNaN` behavior for a
reloaded Save v2. The Yes branch first persists the role-intent boundary
without completing the event; terminal advancement then persists
`harborFinal`. The No branch persists `harborFinal` at its terminal boundary.

Every inspected browser save retained `version: 2`. Progress remained in the
legacy `state.quests` string array, and no serialized payload contained a
`joao.lisbon-opening.*` semantic event ID.

## Browser-discovered cutover corrections

The first baseline `verify:full` supplied a repeatable RED: the first 9 legacy
Cypress specs passed 45 tests, then `smoke.cy.ts` failed before its assertion
because `createPort()` dereferenced a temporarily absent `#camera` during the
React building-view mount transition. The minimal correction makes the
animation loop defer on the existing DOM condition until the camera is
mounted; it adds no timeout or selector.

That correction exposed a second repeatable RED: structured frames supplied
semantic speakers such as `joao`, while `CharacterMessageBox` still looked up
legacy numeric character and portrait IDs. The rendering boundary now maps
semantic IDs through the compiled character's existing `legacyCharacterId`.
No story content or UI selector changed. A rebuilt focused smoke run then
passed 1 spec / 1 test.

The first run of the new spec also produced a test-harness RED (4 failures)
because a Jest-only `toBeNull` matcher was used under Cypress/Chai. Replacing it
with the Chai null assertion yielded the focused 4/4 GREEN result above.

## Clean full gate

From a removed `build/` directory, `npm run verify:full` exited 0 with:

- asset verification: 38 PNG/OGG/MP3 assets;
- story validation: PASS;
- Jest: **36 suites, 227 tests, 0 failures, 0 snapshots**;
- TypeScript (`tsc --noEmit`): PASS;
- ESLint: PASS with no findings;
- production Webpack: PASS, compiled with 3 warnings;
- Cypress: **11 specs, 50 tests, 50 passing, 0 failing, 0 pending, 0
  skipped**, including the 4 new structured-story tests.

The non-fatal notices were the existing outdated `caniuse-lite` Browserslist
notice; Webpack's asset-size, entrypoint-size, and performance-recommendation
warnings; `Missing baseUrl in compilerOptions. tsconfig-paths will be skipped`;
the Cypress macOS `term-size` helper's `Bad CPU type in executable`; and the
Node.js `[DEP0066]` deprecation for `OutgoingMessage.prototype._headers`. No
dependency was changed to silence them.

## Repository and environment hygiene

- `lsof -nP -iTCP:8080 -sTCP:LISTEN` printed nothing after the gate (exit 1),
  confirming no listener remained on port 8080.
- `.github/workflows/baseline.yml` was the only workflow file. It was not
  modified; its existing `verify:full` command inherits story validation.
- `git diff --check` exited 0.
- Git LFS was available as `git-lfs/3.7.1`.
- Cypress generated `cypress/downloads/downloads.html`; the disposable output
  was removed before staging.
- A read-only main-workspace status showed only the user-owned untracked
  `docs/Chatlog copy.rtf`. Its observed size (418,664 bytes) and modification
  timestamp (`1781418318`) were unchanged before and after verification. It was
  not copied, modified, staged, deleted, or committed.

## Explicitly deferred and excluded

This architecture phase adds no post-Lisbon story. Domingo, the complete João
route, Catalina, Massawa, Zipangu, the final conspiracy, other protagonist
routes, dynamic affinity, Save v3, multi-protagonist selection, dialogue UI
redesign, and external content tooling remain pending. It adds no dependency,
new save field, new production selector, workflow, or unrelated gameplay
change.
