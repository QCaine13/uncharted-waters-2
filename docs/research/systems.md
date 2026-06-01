# System Notes

## Current Codebase Coverage

The current remake already has a useful skeleton:

- World map sailing with wind/current-aware ship speed.
- Port map walking, collision, NPC spawning, and building entry.
- Several port buildings implemented as React UI:
  - Harbor: supply and sail.
  - Pub: recruit crew.
  - Lodge: basic rest flow.
  - Bank: deposit, withdraw, borrow, repay.
  - Item shop: buy/sell items.
  - Church: pray/donate shell.
  - Shipyard: used ships and selling ships.
- Static data tables for ports, ships, sailors, items, buildings, and regions.
- Early Joao-oriented quest/dialogue flow.

## Major Original-game Systems To Reconstruct

### Ports

Reference pages:

- https://gcgx.games/dkj2/city.html
- https://blog.sina.com.cn/s/blog_590a34ba0100vyut.html

Important mechanics:

- Facility opening hours matter.
- Leaving most facilities advances time by a small random amount.
- Ports expose economy, industry, prices, allegiance, region, and facility
  availability.
- Investment changes available trade goods, ships, weapons, and figureheads.
- Item shops have special late-night black-market windows.

### Trade

Reference pages:

- https://gcgx.games/dkj2/trade.html
- https://gcgx.games/dkj2/route.html
- https://koei.fandom.com/wiki/Uncharted_Waters%3A_New_Horizons/Trading_Data

Important mechanics:

- Regions define common goods.
- Each port can also have a specialty.
- Goods have base values and required commerce levels.
- Market prices fluctuate over time.
- Some purchases include tax unless the player has the relevant tax-exemption
  item.
- Recommended routes are mostly two-port loops early on, then long-range
  high-value goods later.

### Ships And Shipyards

Reference pages:

- https://gcgx.games/dkj2/ship.html
- https://w.atwiki.jp/offlinedaikoukai/pages/72.html

Important mechanics:

- Ship availability depends on region and industrial level.
- Ship stats include durability, tacking, propulsion, crew, capacity, cannons,
  sail type, and price.
- Remodel/new ship/investment are still mostly missing in this repo.
- Practical balance matters: player guides distinguish exploration, piracy, and
  trade usefulness.

### Sailors And Crew

Reference pages:

- https://gcgx.games/dkj2/sailor.html
- https://w.atwiki.jp/offlinedaikoukai/pages/74.html

Important mechanics:

- Mates have roles and stats that affect navigation, bookkeeping, combat, and
  other commands.
- Crew assignment affects speed, battle, lookout, and resource consumption.
- Pub recruitment should depend on port economy, time, and daily availability.

### Exploration And Discoveries

Reference pages:

- https://gcgx.games/dkj2/treasure.html
- https://www.usold.cn/post/333.html

Important mechanics:

- Discoveries are a major adventure-fame loop.
- Discoveries include natural wonders, ruins, animals, artifacts, and villages.
- Map coordinates and reporting rewards need their own data model.

### Combat

Reference pages:

- https://gcgx.games/dkj2/battle.html
- https://gcgx.games/dkj2/duel.html

Important mechanics:

- Naval combat has cannon fire and boarding.
- Duel mechanics matter for some story branches, but guides suggest many story
  duels do not require winning.
- For an MVP, battle can be simplified while keeping the strategic identity:
  fleet composition, crew allocation, durability, cannon count, boarding risk.

## Design Implication For This Repo

The most valuable next systems are trade and save/load. Trade gives the player
a repeatable loop; save/load makes every deeper system worth building. A
localization layer should happen early, before hard-coded English text spreads
further.
