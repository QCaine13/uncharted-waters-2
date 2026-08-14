# Market Price Dynamics — Design

**Status**: Approved for implementation · **Date**: 2026-08-13 · Slice: B (playability track)

## 1. Problem

Two defects, one fatal.

### 1.1 Same-port arbitrage (fatal, live today)

`getMarketGoods()` in `src/state/actionsMarket.ts` returns every good in
`goodData` with a buy price, and `Market.tsx` renders all of them with no
filter. Prices come from two independent functions:

```
getMarketBuyPrice:  good in market.supplies ? base * 0.6 : base * 1.0
getMarketSellPrice: good in market.demands  ? base * 1.8 : base * 0.8
```

A good that is in `demands` and not in `supplies` therefore has
`sellPrice > buyPrice` **in the same port**. Iberia (`marketId '1'`, Lisbon)
supplies `[3,4,7,2]` and demands `[10,11,8,14,20]`. Pepper (`'10'`,
base 150) buys at 150 and sells at 270. Gold (`'14'`, base 400) buys at 400
and sells at 720. This is an unbounded money printer reachable from the
tutorial port with no sailing.

### 1.2 No price movement

`getMarketBuyPrice` / `getMarketSellPrice` are pure functions of
`(marketId, goodId, basePrice)`. They read no state, time, quantity, or
history. `buyGood` computes `totalCost = unitPrice * quantity` — strictly
linear, so dumping a full hold has the same unit price as selling one unit.
There is no market state anywhere in `State` or in the save payload, and
`PortInfo.tsx:38` hardcodes the string `100%` where the price index belongs.

Consequence: the optimal route is a constant to be solved once, and profit
scales linearly and without limit with cargo capacity. Money stops being a
constraint within roughly twenty minutes of play, which removes the decision
content from the shipyard, crew hiring, provisioning, and investment at the
same time.

## 2. Model

### 2.1 One reference price per (market, good)

Replace the two independent multiplier tables with a single **reference
price**, then derive buy and sell from it with a fixed spread. This makes
`buyPrice > sellPrice` a structural invariant rather than a coincidence, which
kills 1.1 by construction.

```
regionMultiplier(market, good) =
  0.6  if good in market.supplies
  1.8  if good in market.demands
  1.0  otherwise

reference(market, good) = basePrice * regionMultiplier * index / 100

buyPrice  = ceil (reference * (1 + MARGIN))
sellPrice = floor(reference * (1 - MARGIN))
```

`MARGIN = 0.1`. The `ceil`/`floor` asymmetry keeps the invariant intact at
small reference values; both prices have a floor of 1.

A good must not appear in both `supplies` and `demands` of the same market.
Assert this in a test over the whole table.

The buy-cheap-in-supply / sell-dear-in-demand loop is preserved: Iberian wine
buys at `0.66 × base` and sells in Northern Europe at `1.62 × base`. A
same-port round trip now always loses 20%.

### 2.2 Price index

Each `(marketId, goodId)` carries an integer percent **index**, default `100`,
clamped to `[MIN_INDEX, MAX_INDEX] = [40, 200]`.

### 2.3 Trade impact

Buying raises the index; selling lowers it. Every `IMPACT_UNITS_PER_POINT`
units traded moves the index by one point.

Trades must be settled **in chunks of `IMPACT_UNITS_PER_POINT`**, recomputing
the price after each chunk, so that the marginal price moves within a single
transaction. A trade of `q` units must not be settled at one unit price.
This is the property that produces diminishing returns on dumping: selling
`2q` units in one port must yield strictly less than twice the revenue of
selling `q` units (until the index clamps).

### 2.4 Regression toward 100

Indexes decay back to `100` at `REGRESSION_POINTS_PER_DAY` points per elapsed
day, never overshooting.

Compute this **lazily**: store `{ index, updatedDay }` and derive the current
index on read from `currentDay - updatedDay`. Do not add a daily tick hook.
Lazy regression is a pure function, needs no coupling to the world loop, and
behaves correctly across save/load and long time gaps.

`currentDay` is `Math.floor(state.timePassed / 1440)`, consistent with the
`daysElapsed` story condition in `src/story/core/resolver.ts`.

### 2.5 Tuning constants

All of these live together in one exported block in the pricing module, with a
comment marking them as tuning values:

```
MARGIN                  = 0.1
MIN_INDEX               = 40
MAX_INDEX               = 200
IMPACT_UNITS_PER_POINT  = 3
REGRESSION_POINTS_PER_DAY = 1
```

Rationale for the pair `3` / `1`: a ~100-unit hold dumped in one port moves
that good's index by ~33 points and takes ~33 days to recover, against a
typical round trip of ~30 days. The route keeps working but degrades under
over-farming, so rotating two or three destinations is strictly better than
repeating one. Expect to retune after play; keep them in one place.

## 3. State and persistence

Add to `State`:

```ts
marketPrices: MarketPriceState;   // { [marketId]: { [goodId]: { index, updatedDay } } }
```

Sparse — store only entries that have deviated. A missing entry means index
`100`. This keeps saves small and makes new markets and goods default
correctly.

Bump `SAVE_VERSION` to `3` and add the `2 -> 3` step to the existing chain in
`src/state/saveMigrations.ts`, following the `1 -> 2` fame precedent: v2 saves
gain `marketPrices: {}`. Unknown or missing versions keep falling back to
`null`.

**Story compatibility must not regress.** Save v2 story progress lives in the
`state.quests` string array and is read through
`src/story/legacy/lisbonCompletionKeys.ts`. The v3 migration adds a field and
must not touch `quests`, `fame`, or any other existing field. The structured
story tests and `saveV2Compatibility.test.ts` must stay green untouched.

## 4. API surface

Keep the pricing model pure and testable, separate from state mutation:

- Pure module (no `state` import): current index with regression applied,
  buy/sell price from an index, and a settle function that takes an index plus
  a quantity and returns `{ totalPrice, nextIndex }`.
- `actionsMarket.ts` reads `state.marketPrices` and `state.timePassed`, calls
  the pure functions, writes back the new index and `updatedDay`, and saves.

`buyGood` / `sellGood` keep their existing signatures and their existing
gold, cargo-space, and partial-fill behavior. Only the price computation and
the index write-back are new.

## 5. Required tests

- Spread invariant: for every market × good, `buyPrice > sellPrice` at index
  `40`, `100`, and `200`. This is the regression test for the money printer.
- No good appears in both `supplies` and `demands` of the same market.
- Impact direction and clamping: buying raises, selling lowers, both clamp to
  `[40, 200]`.
- Diminishing returns: selling `2q` yields strictly less than `2 ×` selling
  `q` before clamping.
- Chunked settlement: a `q`-unit trade does not settle at a single unit price.
- Regression: converges to exactly `100`, never overshoots, is correct for
  `0` days and for very large day gaps.
- Migration: v2 → v3 adds `marketPrices: {}` and preserves `quests` and
  `fame`; unknown version still returns `null`.
- Save/load round trip preserves `marketPrices`.
- Same-port round trip (buy then immediately sell the same quantity) always
  produces a net gold loss.

## 6. Out of scope

Commerce investment, port tax, supply-port pricing changes, price effects from
story events, the Market UI redesign, and any change to the story engine,
`state.quests`, or `fame`. UI display of the index is a separate follow-up
task.
