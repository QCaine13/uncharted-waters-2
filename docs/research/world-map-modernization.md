# World And Map Modernization

This document defines a practical direction for expanding the remake's world
view and map before deeper trade, story, combat, and discovery systems are
implemented.

The goal is not just to add more ports. The world should become easier to
understand, richer to navigate, and more respectful of the many cultures that
appear in an Age of Exploration setting.

## Design Goals

- Preserve the recognizable identity of Uncharted Waters: New Horizons.
- Keep the six-protagonist world structure as a major fixed element.
- Make regions feel different through geography, politics, economy, routes,
  rumors, dangers, and discoveries.
- Add modern worldbuilding depth without turning the game into a history
  textbook.
- Build data layers that can support future systems: trade, investment,
  discoveries, story triggers, save/load, and localization.
- Avoid changing the raster world map asset first. Start with metadata overlays
  and data catalogs, then change art only when the design is stable.

## Fixed Setting Elements To Preserve

These are anchor points from the original game's identity. They can be expanded
or reinterpreted, but should not be casually replaced.

- The year range and Age of Exploration premise.
- Six protagonists with different fantasies:
  - Joao: adventure and tutorial.
  - Catalina: piracy, revenge, and pursuit.
  - Otto: privateering and military conflict.
  - Pietro: treasure and collectors.
  - Ernst: cartography and scholarship.
  - Ali: trade, debt, and political economy.
- Fame as the main reputation language:
  - Adventure fame.
  - Pirate fame.
  - Trade fame.
- Ports as the main social and economic nodes.
- Sea travel as the emotional center of the game.
- Wind, currents, supplies, crew, and ship choice as meaningful travel factors.
- Distinct port facilities: harbor, market, shipyard, pub, lodge, bank, item
  shop, palace/guild, church/temple/mosque, fortune teller, and special
  buildings.
- Historic political blocs and alliances, while allowing more local nuance.
- Discoveries, villages, treasures, ruins, natural wonders, and rumors as the
  core exploration loop.
- Cross-route story intersections, especially around Joao, Catalina, Ali,
  Pietro, Enrico, Massawa, Japan, and South America.

## Modernization Principles

### Make The World Less Flat

Ports should not only be lists of facilities. Each major port should eventually
have a compact dossier:

- Canonical names in English, Chinese, and Japanese.
- Region and sea zone.
- Political allegiance and local influence.
- Trade identity and specialty goods.
- Shipbuilding identity.
- Religious/cultural building type.
- Nearby hazards, rumors, discoveries, and route hooks.
- Story relevance by protagonist.

### Give Local Places Agency

The original game often treats faraway places as route stops or prize
locations. The remake can keep the adventure fantasy while making regions feel
more alive:

- Local rulers, merchant houses, pilots, scholars, sailors, priests, and
  informants can give context.
- Port events should sometimes respond to local concerns rather than only to
  European expansion.
- Discovery rewards can include knowledge, reputation, maps, contacts, and
  permissions, not only gold.

### Keep Systems Playable

Modernization should make the game clearer, not heavier. Important historical
texture should appear through:

- Short port descriptions.
- Rumors and tavern talk.
- Route notes.
- Quest hooks.
- Map annotations.
- Trade and discovery consequences.

Long exposition should be avoided inside ordinary building flows.

### Separate Lore From Implementation

Worldbuilding should live in structured data before it becomes UI. This keeps
future localization, save/load, and quest logic manageable.

Recommended future data families:

- `portCatalogData`: canonical names, coordinates, facilities, identities.
- `seaRegionData`: sea areas, route risk, currents/winds, labels.
- `worldLoreData`: region summaries, rumors, and route notes.
- `discoveryData`: discoveries, villages, coordinates, rewards, reports.
- `factionData`: countries, local powers, merchant houses, religious/political
  influences.

## Map Expansion Layers

### Layer 1: Current Playable Map

This is the existing world tilemap and port positions. It is already usable for
movement, docking, and wind/current-aware sailing.

Immediate work:

- Audit regular and supply port counts.
- Normalize port IDs and names.
- Add original-world coordinates where available.
- Mark each port as capital, regular port, supply port, or special location.
- Add display labels for region/market/sea zone.

### Layer 2: Region And Sea Zone Model

The current code has markets and broad regions, but the map needs a richer
travel vocabulary.

Possible sea zone fields:

- id
- names
- map bounds or tile areas
- nearby ports
- usual route role
- weather/wind/current notes
- hazard profile
- common fleet types
- discovery themes
- story relevance

Example zone concepts:

- Iberian approaches.
- Western Mediterranean.
- Eastern Mediterranean.
- North Sea and Baltic.
- West African coast.
- Cape route.
- Indian Ocean monsoon routes.
- South China Sea.
- Caribbean basin.
- South Atlantic.
- Pacific island route.

### Layer 3: Port Dossiers

Start with a small number of high-value ports rather than all ports at once.

First dossier set:

- Lisbon
- Seville
- Istanbul
- Venice
- London
- Amsterdam
- Alexandria
- Massawa
- Aden
- Goa
- Malacca
- Macao
- Sakai
- Nagasaki
- Havana
- Santo Domingo
- Rio de Janeiro
- Timbuktu

Each dossier should answer:

- Why would a player care about this port?
- What goods, ships, people, rumors, or story hooks are found here?
- Which protagonist naturally visits it?
- What nearby route or discovery does it introduce?

### Layer 4: Discoveries And Villages

Discoveries should turn the map into a search space instead of a connector
between ports.

Initial discovery categories:

- Natural wonder.
- Ruin.
- Sacred or ceremonial site.
- Animal or plant.
- Artifact.
- Village or local settlement.
- Geographic landmark.

Modernized rewards:

- Gold.
- Adventure fame.
- Local reputation.
- Map knowledge.
- Reportable knowledge.
- New route hint.
- Story trigger.
- Trade or shipbuilding contact.

### Layer 5: Knowledge Map

A modern UI can support exploration by distinguishing known, rumored, and
confirmed information.

Possible states:

- Unknown.
- Rumored.
- Sighted.
- Docked.
- Surveyed.
- Reported.

This can later drive map labels, logs, bookkeeper support, and discovery
progress without needing to redraw the base world map immediately.

## Worldbuilding Tone

The tone should stay adventurous, brisk, and playable. The remake can add more
texture while keeping the original's bright open-world momentum.

Avoid:

- Treating non-European regions as only exotic treasure spaces.
- Making every port feel like the same menu with a different name.
- Adding historical density that blocks play.
- Overwriting original-game terms before localization is planned.

Prefer:

- Small, specific regional details.
- Route rumors that teach the player how the world works.
- Local characters with practical motives.
- Ports that change through investment, story, and reputation.
- Discoveries that create curiosity rather than only checklist completion.

## Suggested First Milestone

Build a Europe-to-West-Africa world expansion slice.

Why this slice:

- It starts near Joao's Lisbon tutorial.
- It supports early trade routes.
- It introduces discovery and supply-port travel without overwhelming the
  player.
- It can connect Joao, Catalina, Pietro, and Ali story hooks later.

Milestone data:

- Port dossiers for Lisbon, Seville, Madeira, Santa Cruz, Ceuta, Argin,
  Bissau, San Jorge, Abidjan, Timbuktu, and Cape Town.
- Sea zone entries for Iberian approaches, Canary/Madeira route, Northwest
  Africa, Gulf of Guinea, and Cape route.
- A small discovery set around Europe and West Africa.
- A small rumor table for pubs, lodges, guilds, and item shops.
- A map knowledge state design that can be serialized.

Milestone acceptance:

- Data exists as structured files or governance drafts.
- Every new researched value has source references where practical.
- The current map asset remains playable.
- Future market and discovery systems can consume the new IDs.
- The player can understand why different ports and routes matter.

