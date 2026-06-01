# Data Targets

These are the datasets worth collecting before expanding gameplay. Prefer
structured TypeScript data that can be tested and reused by UI, simulation, and
save/load code.

## Ports

Current file: `src/data/portData.ts`

Fields to verify or add:

- English name
- Chinese name
- Japanese name
- Region
- Coordinates
- Position on current tilemap
- Economy value
- Industry value
- Price index / market-rate value
- Allegiance values
- Port type: capital, regular, supply port
- Facilities:
  - harbor
  - market
  - shipyard
  - guild
  - lodge
  - bank
  - item shop
  - church/temple
  - fortune teller
  - mansion / specialist facility
- Specialty good
- Black-market item
- Investment thresholds and unlocks

## Trade Goods

New likely file: `src/data/tradeGoodData.ts`

Fields:

- id
- English name
- Chinese name
- Japanese name
- category
- base price
- required commerce value
- common regions
- specialty ports
- tax category or exemption country if applicable

## Market State

New likely file: `src/state/marketState.ts` or additional fields in `State`

Fields:

- per-port goods stock
- per-port price index
- last market refresh time
- player-owned cargo by ship
- visited ports with known prices for bookkeeper support

## Ships

Current file: `src/data/shipData.ts`

Fields to verify or add:

- Chinese/Japanese names
- region availability
- industry requirement
- new-build availability
- used-ship availability weight
- remodel options
- cannon compatibility
- figurehead compatibility

## Items

Current file: `src/data/itemData.ts`

Fields to verify or add:

- Chinese/Japanese names
- item category
- effect
- purchasable locations
- black-market availability
- quest-only flag
- sell restrictions

## Sailors

Current file: `src/data/sailorData.ts`

Fields to verify or add:

- Chinese/Japanese names
- nationality
- starting location
- recruitment conditions
- role affinity
- growth pattern
- loyalty
- unique story restrictions

## Discoveries

New likely file: `src/data/discoveryData.ts`

Fields:

- id
- English/Chinese/Japanese names
- type
- coordinate
- nearest port/region
- discovery condition
- reward
- fame reward
- report target

## Story Events

Current related files: `src/interface/quest/questData.ts`,
`src/interface/quest/getAvailableQuest.ts`

Fields to normalize:

- protagonist
- trigger condition
- trigger location
- required fame type/value
- required date/time
- required companion/item/ship
- event text
- rewards
- state changes
- battle/duel requirements
