# Research Implementation Plan

## Phase 1: Reference Foundation

- Keep this folder as the source index and decision log.
- Add a bilingual glossary for UI and data terms.
- Compare existing `src/data/*` values against collected reference sources.
- Avoid large rewrites until we know which data is missing versus merely
  untranslated.

## Phase 2: Save/Load Boundary

- Define which parts of `State` are serializable.
- Exclude live objects such as `world` and `port`; recreate them after load.
- Add explicit save and reset commands.
- Add tests for serialization and restoration.

Why this comes early: trade, investment, story, and discoveries all need durable
progress.

## Phase 3: Localization Layer

- Move hard-coded menu labels and common messages into translation tables.
- Start with Chinese and English.
- Keep original English keys stable for tests.
- Translate data names separately from UI text.

Why this comes early: the current project has English text embedded directly in
React components and quest data.

## Phase 4: Market MVP

- Add `tradeGoodData`.
- Add market building UI.
- Implement buy/sell from ship cargo.
- Use base prices first, then add market fluctuation.
- Add commerce investment unlocks after the basic loop works.

MVP acceptance:

- Player can buy goods in Lisbon.
- Player can sail to Seville.
- Player can sell goods.
- Gold and cargo update correctly.
- Jest covers price/cargo calculations.
- Cypress covers a basic buy/sail/sell loop once LFS assets are available.

## Phase 5: Shipyard Expansion

- Implement new ship purchase.
- Implement repair based on durability.
- Implement remodel after core ship data is verified.
- Add industry investment unlocks.

## Phase 6: Exploration MVP

- Add discovery data.
- Add map-coordinate proximity checks.
- Add discovery reporting and fame rewards.
- Start with a small set around Europe/Africa before filling the world.

## Phase 7: Story Expansion

- Pick one protagonist path first.
- Joao is the easiest fit because the existing quest data already leans that
  way.
- Model event triggers as data, not scattered component logic.
