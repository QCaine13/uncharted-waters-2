# Current Data Inventory

This is an audit of the current implementation data. Counts are based on the
checked-out source as of 2026-06-01.

> **Update (2026-06-13)**: Since this audit a trade/market MVP shipped
> (`goodsData.ts`, `marketGoodsData.ts`) along with `saveLoad.ts` and
> `portCharactersData.ts`. The counts below predate those files and should be
> re-run before the next data expansion.

## Summary

| Dataset | File | Count | Status |
| --- | --- | ---: | --- |
| Regular ports | `src/data/portData.ts` | 100 | Implemented |
| Supply ports | `src/data/portData.ts` | 30 | Implemented |
| Buildings | `src/data/buildingData.ts` | 12 | Partial UI |
| Regions | `src/data/portExtraData.ts` | 8 | Implemented |
| Markets | `src/data/portExtraData.ts` | 13 | Labels only |
| Ships | `src/data/shipData.ts` | 25 | Implemented |
| Shipyard types | `src/data/portShipyardData.ts` | 11 | Implemented |
| Items | `src/data/itemData.ts` | 70 | Partial effects |
| Sailors | `src/data/sailorData.ts` | 3 | Minimal |
| Dialog characters | `src/data/characterData.ts` | 8 | Minimal |

## Main Findings

- The existing data is already strong enough for movement, ports, ship speed,
  basic items, and a Joao-focused early story.
- Most names are English only. Chinese and Japanese names need separate fields,
  not replacement of English names.
- Trade goods now exist as first-class datasets (`goodsData.ts`,
  `marketGoodsData.ts`, shipped 2026-06-13). The remaining work is depth (price
  fluctuation, tax, investment unlocks), not the missing-dataset blocker noted
  in the original audit.
- Port data has tilemap position and gameplay economy/industry values, but not
  original-world coordinates or normalized facility metadata.
- Building opening hours are documented in references but are not yet encoded.
- Story data is embedded in UI-oriented quest structures; it is usable, but not
  yet a clean event database.

## Recommended Governance Boundary

Treat `src/data` as the current implementation truth and
`docs/5-data-governance/reference-db.json` as the planning/index truth.

When a researched table becomes stable:

1. Add source metadata to `reference-db.json`.
2. Add or update a catalog in `docs/5-data-governance/entities/` if it is still
   being reviewed.
3. Promote it into `src/data` only when the game can consume it or tests can
   validate it.
