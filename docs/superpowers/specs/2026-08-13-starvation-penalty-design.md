# Starvation Penalty — Design

**Status**: Approved for implementation · **Date**: 2026-08-13 · Slice: A (playability track, see DECISIONS D9)

## 1. Problem

`getProvisionSummary` in `src/state/provisions.ts` already computes
`status: 'exhausted'` when water or food reaches zero, and
`Provisions.tsx` renders it in red. **Nothing else happens.** Running out
costs the player nothing.

So "how much water and food do I buy" is not a decision — the answer is
"enough to not see red, and it does not matter if I am wrong". Sailing
carries no risk at all, which also means the provisioning UI, the supply
ports, and cargo space spent on provisions are all decoration.

There is a second, structural defect. `planProvisionConsumption(ships, days)`
computes `required = dailyConsumption * days` **for the whole span at once**
and then drains what it can. It cannot say which days were short, and it
cannot react to a fleet whose crew changes mid-span. Any starvation rule
needs per-day resolution.

## 2. Model

### 2.1 Per-day simulation

Replace the whole-span calculation with an ordered day-by-day simulation.
This is required, not stylistic: crew deaths reduce the crew, which reduces
the next day's consumption, so days are not independent.

For each day of the settled span, in order:

1. `consumption = ceil(crew / 10)` (existing `getDailyProvisionConsumption`).
2. If both water and food cover `consumption`, deduct both. Normal day.
3. Otherwise it is a **starvation day**: deduct whatever is available of
   each (draining to zero), and kill crew.

### 2.2 Deaths

```
deaths = ceil(crew * STARVATION_DEATH_RATE)     // one provision short
deaths = ceil(crew * STARVATION_DEATH_RATE * 2) // both short
```

`STARVATION_DEATH_RATE = 0.1`. Deaths never exceed the current crew.

Because consumption scales with crew, the spiral self-limits rather than
running away — losing crew makes the remaining provisions last longer. That
is intended.

Remove crew from the ship with the **largest crew first**, breaking ties by
ship index. This keeps the fleet balanced and, more importantly, keeps the
result deterministic and testable. Crew must never go negative.

### 2.3 Adrift

`getShipSpeed` computes `navigationCrewFactor = min(1, crew / minimumCrew)`,
so a fleet at zero crew has speed zero — it can never move again. Left alone
that is a soft-lock, not a penalty.

So when total fleet crew reaches zero, the voyage ends immediately:

- stop simulating the remaining days of the span;
- move the fleet to the **nearest port by straight-line distance** from its
  world position (ports carry `position` in `src/data/portData.ts`), breaking
  ties by ascending port id for determinism;
- put the player in that port, as a normal arrival;
- cargo, gold, items, and story progress are untouched.

The penalty is the lost crew and the lost time. Re-hiring costs real gold
through the existing lodge/harbor systems, so no new punishment mechanic is
invented. Do **not** add a salvage fee, damage the ships, or destroy cargo.

### 2.4 Tuning constants

One exported block, marked as tuning values:

```
STARVATION_DEATH_RATE = 0.1
BOTH_SHORT_MULTIPLIER = 2
```

Sanity check: running dry three days from port costs roughly a quarter of the
crew — painful, survivable, and it visibly slows the ship home through the
existing `navigationCrewFactor`. Expect to retune after play.

## 3. Persistence

**No save migration.** Crew lives in `ship.crew` inside `state.fleets` and
fleet position inside `state.fleets['1'].position`; both are already
serialized. Do not bump `SAVE_VERSION` and do not add a field.

## 4. API surface

Keep the rule pure and separate from state mutation, matching the existing
split in `provisions.ts` / `actionsProvisions.ts`:

- Pure (no `state` import): given ships and a day count, return the ordered
  deductions, the number of starvation days, the crew deaths per ship, and
  whether the fleet went adrift.
- `actionsProvisions.ts` applies that plan, updates the interface, and saves.
- Nearest-port selection is its own pure function taking a position and
  returning a port id.

`settleDailyProvisions(days)` keeps its name and its call site in
`src/state/actionsWorld.ts:91`.

## 5. Player feedback

`ProvisionSummary` carries the outcome of the settlement so the world UI can
show it.

`Provisions.tsx` must render crew losses. **Do not change the existing
`data-test="provisionStatus"` element or its text** — `tests/e2e/provisions.cy.ts`
asserts on it. Add a separate element with its own `data-test` attribute for
the starvation report.

## 6. Required tests

- A 5-day span settled at once with 3 days of food produces exactly 2
  starvation days — the per-day resolution the old whole-span math could not
  express.
- Deaths compound correctly across consecutive starvation days as the
  shrinking crew lowers consumption.
- Both-short doubles the death rate; one-short does not.
- Crew removal takes from the largest ship first, is deterministic, and never
  goes negative.
- Reaching zero crew stops the simulation mid-span and reports adrift.
- Nearest-port selection returns the true minimum and breaks ties by
  ascending port id.
- A fleet that is fully provisioned loses no crew and behaves exactly as
  before (regression against the existing provisions tests).
- `getShipSpeed` and `getProvisionSummary` produce finite values at crew 0.

## 7. Out of scope

Morale, scurvy or other illness, mutiny, crew wages, rationing choices, food
spoilage, ship damage, drowning cargo, a salvage fee, game over, and any
change to the market, the story engine, or `SAVE_VERSION`.
