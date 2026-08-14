# Geographic Discovery MVP — Design

**Status**: Approved for implementation · **Date**: 2026-08-14 · Slice: C1 (playability track, see DECISIONS D9)

## 1. Problem

Sailing has exactly one purpose: carrying trade goods between markets. Once a
player knows a profitable route there is no reason to ever visit an unvisited
part of the map — the world is 131 ports of decoration around a two-port loop.

Meanwhile `state.fame` (`{adventure, pirate, trade}`) exists, is serialized,
and is a valid story trigger condition (`fameAtLeast` in
`src/story/core/resolver.ts`), but **nothing in the game awards it and nothing
displays it**. There is no `receiveFame` effect. It is a dead field.

This slice gives sailing a second reason to exist and turns fame on, which is
also the hard prerequisite for João's mid-route and all of Pietro's route.

## 2. Scope note

This slice uses a **new, small, purely historical landmark dataset**, not the
50 lore entities in `src/data/relicData.ts` / `legendData.ts` /
`tradeGoodData.ts`. Those carry unresolved rewrite debt (archive layers built
on the rejected D7 machine premise) and empty `triggers`/`rewards`. Wiring
them is a separate content decision and is explicitly out of scope here.

## 3. Data

New `src/data/discoveryData.ts`. Each entry:

```
id            stable, kebab-case, permanent
name          English display name
referencePort the name of an existing port in portData.ts
position      world coordinates
radius        discovery radius in world units
fame          adventure fame awarded
gold          gold awarded
```

### 3.1 Positions come from real latitude/longitude, not compass offsets

**Revised 2026-08-14 after the first implementation.** The original version of
this section asked for a compass direction from a reference port and gave no
distance. That produced offsets of 60–70 world units, which on this map is
roughly 10° of latitude — about a thousand kilometres. Ten of the fourteen
landmarks landed more than 45 units from their true position and one
(`strait-of-magellan`, anchored to Forel, which is Arctic) landed in the wrong
hemisphere. Compass-and-vibes placement is not recoverable by review, so it is
replaced by an explicit projection.

The world map is essentially equirectangular. Fitting 24 unambiguous ports
(Lisbon, London, Bergen, Istanbul, Alexandria, Cape Town, Sakai, Macao,
Malacca, Calicut, Goa, Aden, Havana, Callao, Montevideo, Valparaiso, Rio de
Janeiro, Luanda, Mombasa and others) by least squares gives:

```
x = 6.217 * longitude + 887.1   (wrapping, map width 2238 = 360 * 6.217)
y = -7.316 * latitude  + 640.9
```

Worst residual across those 24 ports is 30 units; Pacific ports reach ~60
because that part of the map is slightly compressed.

So: **each landmark entry declares its real-world `latitude` and `longitude`,
and the map position is derived by a documented pure projection function.**
Do not hand-write x/y. `referencePort` stays in the data as documentation
only — it no longer drives placement.

Required tests replacing the old anchor-distance check:

- The projection reproduces the real `portData.ts` position of at least eight
  named, geographically unambiguous ports spanning several continents, within
  a stated tolerance. This is what stops the projection itself from silently
  drifting.
- Every landmark's stored position equals its declared latitude/longitude run
  through that projection.
- Longitudes that project below zero wrap by the map width exactly once, and
  the result lands inside `[0, 2238)`. `bering-strait` is the live case.

### 3.2 The landmark set

Fourteen entries. Fame scales with how far and how hard the voyage is.

Latitude is positive north, longitude positive east. These are the ground
truth; the map position is whatever the projection makes of them.

| id | name | latitude | longitude | nearest port (doc only) | fame | gold |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| `strait-of-gibraltar` | Strait of Gibraltar | 35.95 | -5.60 | Ceuta | 30 | 300 |
| `azores` | The Azores | 37.80 | -25.50 | Santa Cruz | 50 | 500 |
| `cape-bojador` | Cape Bojador | 26.13 | -14.50 | Argin | 60 | 600 |
| `cape-verde` | Cape Verde | 14.70 | -17.50 | Bissau | 60 | 600 |
| `cape-sao-roque` | Cape São Roque | -5.47 | -35.26 | Pernambuco | 70 | 700 |
| `bab-el-mandeb` | Bab-el-Mandeb | 12.58 | 43.33 | Aden | 80 | 800 |
| `strait-of-hormuz` | Strait of Hormuz | 26.57 | 56.25 | Hormuz | 80 | 800 |
| `mouth-of-the-amazon` | Mouth of the Amazon | -0.50 | -50.00 | Cayenne | 90 | 900 |
| `cape-comorin` | Cape Comorin | 8.08 | 77.55 | Cochin | 90 | 900 |
| `strait-of-malacca` | Strait of Malacca | 2.50 | 101.00 | Malacca | 100 | 1000 |
| `galapagos-islands` | The Galápagos Islands | -0.50 | -90.50 | Callao | 120 | 1200 |
| `cape-of-good-hope` | Cape of Good Hope | -34.36 | 18.47 | Cape Town | 150 | 1500 |
| `bering-strait` | The Bering Strait | 65.80 | -169.00 | Nome | 200 | 2000 |
| `strait-of-magellan` | Strait of Magellan | -53.50 | -70.50 | Valparaiso | 200 | 2000 |

Note `strait-of-magellan`'s nearest port changed from Forel to Valparaiso.
Forel sits at `(660, 190)` — Arctic latitude on this map, alongside Bergen and
Oslo. That was an error in the first version of this table.

All fourteen are real Age-of-Exploration geography. Do not add, rename, or
editorialise them, and do not write flavour prose — this dataset is
deliberately factual, unlike the lore entities.

## 4. Detection

### 4.1 Where

Inside `worldTimeTick` in `src/state/actionsWorld.ts`, which the world loop
calls from `src/game/world/world.ts:29`. Detection reads the player fleet's
current position and runs only while at sea.

### 4.2 The tunnelling hazard — read this before choosing a radius

`worldTimeTick` advances the clock in fixed steps and the fleet moves between
calls. If the fleet's maximum displacement between two consecutive detection
runs exceeds the landmark's discovery **diameter**, the fleet can pass
straight through a landmark without ever being inside its radius, and the
discovery silently never fires. A player would experience this as "I sailed
right over it and nothing happened".

So: derive the maximum per-tick displacement from the real movement code
(`getShipSpeed` caps `baseSpeed` at 30; see how speed converts to position in
`src/game/world/worldPlayer.ts` and `worldCharacters.ts`), then set
`DEFAULT_DISCOVERY_RADIUS` comfortably above half of it. State the derivation
in a comment.

**Required test**: a fleet stepping at the maximum per-tick displacement
along a straight line that passes through a landmark's centre must discover
it. Write it as a loop over simulated positions, not as a single distance
assertion.

### 4.3 Rule

For each landmark not already discovered, if
`distance(fleetPosition, landmark.position) <= landmark.radius`, discover it.
Multiple landmarks may be discovered in the same tick; award each. A
landmark is discovered at most once, permanently.

## 5. Rewards

On discovery: add `landmark.fame` to `state.fame.adventure` and
`landmark.gold` to `state.gold`, then save.

Note for later: when the report-to-a-patron system lands, gold moves to the
report step and sighting keeps fame only. Gold is granted on sighting now so
the loop pays off without a second system.

## 6. Persistence

Add `discoveries: string[]` to `State` (discovered landmark ids, insertion
order). Bump `SAVE_VERSION` to `4` and add the `3 -> 4` step to the chain in
`src/state/saveMigrations.ts`, following the `2 -> 3` precedent: v3 saves gain
`discoveries: []`.

Do not touch `quests`, `fame`'s shape, or `marketPrices`. The Save v2 story
compatibility boundary must be unaffected.

**Two version assertions read `SAVE_VERSION` rather than a literal**
(`src/story/saveV2Compatibility.test.ts`, `tests/e2e/storyArchitecture.cy.ts`)
— they were fixed during the v3 bump and must keep passing untouched. If
either goes red you have changed something you should not have.

## 7. API surface

- Pure module (no `state` import): given a position and the set of already
  discovered ids, return the landmarks newly discovered at that position.
- `actionsWorld.ts` applies the result: appends ids, adds fame and gold,
  updates the interface, saves.

## 8. Required tests

- Every landmark is within `MAX_ANCHOR_DISTANCE` of its reference port's real
  position in `portData.ts`.
- Landmark ids are unique; fame and gold are positive finite numbers.
- No two landmarks are close enough that their radii overlap.
- Detection returns a landmark exactly at the radius boundary and not just
  outside it.
- The tunnelling test from section 4.2.
- An already-discovered landmark is never returned again.
- Two landmarks discoverable at the same position both fire.
- Applying a discovery adds exactly the stated fame and gold once, and a
  second detection at the same position adds nothing.
- Migration: v3 → v4 adds `discoveries: []` and preserves `quests`, `fame`,
  and `marketPrices`; unknown version still returns `null`.
- Save/load round trip preserves `discoveries`.

## 9. Out of scope

All UI (that is slice C2: the discovery banner, the fame readout, the
discovery list), reporting discoveries to a patron for a bonus, treasure
maps, the 50 lore entities, `receiveFame` as a story effect, fame-gated story
content, titles and ranks, and any change to the market, provisions, or the
story engine.
