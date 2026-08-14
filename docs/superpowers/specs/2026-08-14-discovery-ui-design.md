# Discovery UI and Fame Readout — Design

**Status**: Approved for implementation · **Date**: 2026-08-14 · Slice: C2 (follows C1, see DECISIONS D12)

## 1. Problem

C1 made discovery real: fourteen landmarks, detection while sailing, adventure
fame and gold awarded once, persisted in Save v4. **None of it is visible.**

A player who sails past the Cape of Good Hope right now sees nothing happen.
Their gold changes with no explanation, their fame changes invisibly, and
there is no way to find out what they have discovered. The loop technically
runs and is worth nothing, because the reward is unobservable.

`state.fame` in particular has been serialized since Save v2 and is still
displayed nowhere at all.

## 2. Scope

Three surfaces, all reading state that already exists. **No gameplay rule
changes**: no new landmarks, no changes to detection, radius, fame or gold
values, no reporting system, no story effects.

## 3. The discovery banner

When a landmark is discovered, name it on screen.

- Rendered over the world view — the centre column in `Interface.tsx` is
  already `relative` and sized, so an absolutely positioned overlay belongs
  there alongside `Camera`.
- Content: the landmark name and what it granted, e.g.
  `Discovered: Cape of Good Hope — +150 adventure fame, +1500g`.
- If several landmarks are discovered in the same tick, show them all. C1's
  detection already returns a list and the existing tests cover the
  simultaneous case.

**No timers.** The banner persists until it is replaced by a later discovery
or until the player docks, and it is cleared on docking so it can never
reappear stale on the next voyage. A `setTimeout`-driven auto-dismiss would
make the e2e test time-dependent, which this repo's specs avoid everywhere
else — there is not a single fixed wait in `tests/e2e`.

New `updateInterface.discovery` channel, mirroring how `provisions` works.

## 4. The fame readout

Show all three fame tracks in the left HUD panel, under Coins, using the same
label-above / right-aligned-number pattern as Ingots and Coins.

Show all three even though only `adventure` currently has a source. They are
all real persisted state, and a track that appears the moment it first
changes would read as a bug.

Fame reaches the UI through a new `updateInterface.fame` channel, mirroring
`provisions`. **Do not add `fame` to the `general` payload** — `general` is
`Pick<State, 'portId' | 'buildingId' | 'timePassed' | 'gold'>` and is called
from many places, so widening it is a large diff for no benefit, and existing
tests assert its shape.

The readout must update without a reload when a discovery grants fame.

## 5. The discoveries list

A `Popover label="Discoveries"` in `Left.tsx`, in the same group as Mates,
Fleet and Items, following `src/interface/Items.tsx` as the template
(`MessageBox` + `Menu`).

- Lists the names of discovered landmarks, in discovery order —
  `state.discoveries` already stores ids in insertion order.
- Empty state when nothing is discovered yet, matching the wording style of
  `Items.tsx`'s "You have no items."
- Selecting an entry shows its detail: name, the fame and gold it granted,
  and its real latitude/longitude formatted conventionally (`34.4° S`,
  `18.5° E`) — C1 stores both on each landmark.

## 6. Required tests

Jest:

- The banner renders the landmark name and reward for one discovery, and for
  several at once.
- The banner clears on docking and does not reappear at sea afterwards.
- The fame readout renders all three tracks and re-renders on the `fame`
  channel without a remount.
- The discoveries list renders discovered names in insertion order, renders
  the empty state when there are none, and formats latitude/longitude with
  the correct hemisphere letters — including a negative value, which is where
  a sign bug would show.

Cypress — add to `tests/e2e/market.cy.ts`'s sibling set as
`tests/e2e/discovery.cy.ts`:

- A save seeded at sea with existing `discoveries` shows them in the list and
  shows the matching fame in the HUD.
- A save seeded at sea just outside a landmark's radius, sailed into it
  through the real production UI, shows the banner and raises the displayed
  fame. Use the existing movement helpers and selector conventions; **no
  fixed waits**. If this proves unreachable within the spec's constraints,
  say so in your report rather than adding a wait — do not weaken it silently.

## 7. Out of scope

Reporting discoveries to a patron, gold moving to the report step, titles or
ranks, fame-gated content, pirate and trade fame sources, a world map screen,
landmark art or portraits, and any change to C1's data, detection, or save
format.
