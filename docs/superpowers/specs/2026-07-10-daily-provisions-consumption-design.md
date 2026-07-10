# Daily Provisions Consumption Design

**Status:** Approved design

**Date:** 2026-07-10

**Scope:** Daily food/water consumption MVP for the world-sailing loop

## 1. Objective

Complete the currently partial provisions loop by consuming food and water at
each sea-day boundary, updating the world sidebar immediately, and persisting
the resulting time, day count, and cargo state.

The slice must reuse the existing fleet-wide departure estimate and harbor
supply model. It must not invent undocumented starvation, disease, morale,
rescue, or crew-loss mechanics.

## 2. Current State

The checked-out game already:

- buys and displays water, food, lumber, and shot at the harbor;
- totals provisions across the player fleet for the world sidebar;
- computes a fleet-wide estimated sailing duration;
- blocks departure when the estimate is zero and warns below ten days;
- advances `timePassed` by 20 minutes per world tick;
- increments and persists `dayAtSea` at midnight;
- persists ship cargo in save version 2.

It does not deduct food or water at midnight. The sidebar therefore displays a
static quantity while sailing, and a save loaded at sea initially renders zero
provisions until an explicit interface update occurs.

## 3. Confirmed Gameplay Rules

### 3.1 Fleet-wide daily consumption

All player ships share food and water. Daily consumption is based on total
assigned crew across the fleet:

```text
daily consumption per resource = ceil(total crew / 10)
```

Examples:

| Total crew | Water per day | Food per day |
| ---------: | ------------: | -----------: |
|          0 |             0 |            0 |
|       1–10 |             1 |            1 |
|      11–20 |             2 |            2 |
|      21–30 |             3 |            3 |

Using integer quantities avoids hidden fractional state and keeps the harbor,
cargo, save, and UI models consistent.

### 3.2 Deterministic deduction order

For each resource, consume from ships in the current fleet-array order,
starting with the flagship. If one ship lacks enough, continue with the next
ship until the daily requirement is satisfied or the fleet is out of that
resource.

Water and food are settled independently. An exhausted cargo entry is removed.
Quantities are clamped at zero and never become negative. Lumber, shot, and
trade goods are not modified.

### 3.3 Sea-day boundary

Consumption occurs only while sailing and only when a world tick crosses into a
new calendar day. The boundary check compares the whole-day index before and
after the 20-minute increment rather than depending on an exact
`timePassed % 1440 === 0` value.

If a future tick crosses more than one day, settle one consumption event per day
crossed, increment `dayAtSea` by the same count, update the interface once, and
save once after all settlements.

Port time advances do not consume ship provisions. Docking continues to reset
`dayAtSea` without changing cargo.

## 4. Architecture and Interfaces

### 4.1 Pure provisions rules

Create `src/state/provisions.ts`. It has no UI or persistence dependency and
provides the domain vocabulary for both harbor and world code:

```ts
export type ProvisionStatus = 'normal' | 'low' | 'exhausted';

export interface ProvisionSummary {
  provisions: ProvisionsType;
  dailyConsumption: number;
  daysRemaining: number | null;
  status: ProvisionStatus;
}

export interface ProvisionDeduction {
  shipNumber: number;
  provision: 'water' | 'food';
  quantity: number;
}
```

The module exposes pure operations to:

- total all four provision types across a supplied ship list;
- calculate `ceil(total crew / 10)`;
- calculate remaining complete days and warning status;
- produce an ordered deduction plan for one or more sea days without mutating
  the supplied ships.

When daily consumption is zero, `daysRemaining` is `null` and status is
`normal`. Otherwise, remaining days are the floor of the smaller food/water
total divided by daily consumption.

For positive daily consumption, status rules are:

- `exhausted` when water or food is zero;
- `low` when both resources are positive but fewer than four complete days
  remain, including less than one complete day;
- `normal` otherwise.

### 4.2 State integration

Create `src/state/actionsProvisions.ts`. It owns the imperative integration:

- read the player fleet from `state`;
- request a deduction plan from `provisions.ts`;
- apply each planned deduction to the real cargo arrays;
- remove zero-quantity water/food entries;
- compute the post-settlement summary;
- update the world provisions interface once;
- save once after the caller has updated time and `dayAtSea`.

The module also exposes a non-mutating interface-refresh action used when
sailing begins. `setSail()` refreshes the sidebar and retains its existing
single save instead of invoking a second save through the refresh action.

### 4.3 World integration

Refactor `worldTimeTick()` to:

1. capture the current whole-day index;
2. add 20 minutes;
3. update wind/current on the existing cadence;
4. calculate the number of day boundaries crossed;
5. when positive, update general time, increment `dayAtSea`, settle provisions,
   update the day and provisions UI, and persist the completed daily state once.

The harbor's existing `getDaysProvisionsWillLast()` becomes a thin delegate to
the new summary calculation so departure logic and the sidebar cannot drift.

### 4.4 Interface contract

Change `updateInterface.provisions` to consume `ProvisionSummary` instead of a
bare `ProvisionsType`. `src/interface/world/Provisions.tsx` initializes its
state from the already-loaded player fleet and then accepts action-driven
updates.

This fixes at-sea reloads without adding a save field or migration.

## 5. Player-facing UI

The existing world provisions panel remains non-blocking and gains a textual
duration/status line. Both the text and color communicate risk so the design is
not color-only:

- `normal`: default colors and `N days remaining`;
- `low`, 1–3 complete days: orange water/food area and
  `Only N day(s) remaining`;
- `low`, less than one complete day but both resources positive: orange and
  `Less than 1 day remaining`;
- `exhausted`: red water/food area and `Supplies exhausted`;
- zero crew consumption: no warning or duration line.

No modal, confirmation prompt, movement pause, or repeated daily toast is
introduced.

The harbor keeps its current departure messaging: zero complete days blocks
departure; one through nine days gives the existing short-voyage warning; ten
or more days reports the estimate normally.

## 6. Persistence and Error Handling

The existing save payload already includes `timePassed`, `dayAtSea`, and fleet
cargo, so `SAVE_VERSION` remains 2 and no migration is added.

At a sea-day boundary, the order is:

1. advance time and `dayAtSea`;
2. apply all food/water deductions;
3. compute and publish the new summary;
4. save once.

If a fleet has less than the required amount, consume what exists, remove the
depleted entry, and report the resulting warning state. Missing provision
entries and an empty/no-crew fleet are valid inputs. The settlement does not
throw merely because supplies are insufficient.

## 7. Testing Strategy

### 7.1 Pure Jest tests

Add focused tests for:

- daily consumption at 0, 10, 11, and 20 crew;
- totals across multiple ships;
- flagship-first deductions and continuation to later ships;
- independent food/water depletion;
- removal planning without negative quantities;
- preservation of lumber, shot, and trade goods;
- `normal`, `low`, sub-day, `exhausted`, and zero-crew summaries;
- multi-day deduction planning.

### 7.2 State/action Jest tests

Verify that:

- a non-boundary world tick does not consume or save;
- crossing a sea-day boundary consumes each resource once;
- `dayAtSea`, time, cargo, interface summary, and saved data agree;
- the provisions-interface refresh and save each occur exactly once per
  completed settlement, in addition to the existing general/day UI updates;
- insufficient supplies clamp to zero without mutation outside water/food;
- beginning a voyage refreshes the summary but preserves `setSail()`'s single
  save.

### 7.3 Component and Chrome coverage

Add component coverage for the normal, low, sub-day, exhausted, and zero-crew
labels/classes, including initialization from loaded state.

Add a Chrome production E2E scenario starting from an at-sea save at 23:40.
The world loop advances 20 in-game minutes approximately every 67ms. Cypress
must retry against observable state rather than use an arbitrary sleep. The
scenario verifies:

- the next tick crosses midnight;
- the day count increments;
- visible food/water quantities decrease using the rounded fleet rate;
- orange/red warning text and styling are correct;
- `localStorage` contains the post-consumption cargo and day count;
- a reload immediately renders the same summary.

The complete `verify:full` gate must remain green.

## 8. Acceptance Criteria

The slice is complete only when:

- 11 total crew consume exactly 2 water and 2 food per sea day;
- provisions are shared and deducted in deterministic fleet order;
- one day boundary produces one settlement, one provisions UI update, and one
  save while retaining the existing general/day UI updates;
- multiple crossed days settle correctly without repeated final updates/saves;
- cargo never becomes negative and unrelated cargo is unchanged;
- loaded at-sea saves immediately display their real summary;
- 1–3 days are orange, zero resource is red, and warnings are textual;
- harbor and world estimates use the same calculation;
- Jest, TypeScript, ESLint, Webpack, asset verification, and Chrome E2E pass;
- implementation results and any deferred issue are recorded in the repository;
- `docs/Chatlog copy.rtf` remains untouched.

## 9. Non-goals

This slice does not include:

- crew injury, death, disease, or morale;
- forced rescue, game-over, or movement penalties;
- per-ship starvation or isolated ship supply rules;
- manual ship-to-ship cargo transfer;
- a generic daily survival/event engine;
- port-side consumption;
- localization or replacement of existing English UI text;
- dependency upgrades or unrelated infrastructure cleanup.

These remain separate slices, and any original-game starvation consequence must
be researched and approved before implementation.

## 10. Documentation Updates on Completion

After implementation and verification:

- update `docs/roadmap.md` to mark daily consumption implemented and correct
  already-landed save-migration/quest status text encountered in the same
  status block;
- update the docs status panel only where this slice changes current behavior;
- store the detailed implementation plan and final verification evidence under
  `docs/superpowers/`;
- record any newly discovered gameplay decision in `docs/DECISIONS.md` only if
  it affects later slices beyond this approved MVP.
