# Proposal: Data Architecture & Management Strategy

**Status**: Revised — reframed as conventions to lock *during* the Quest slice, not a standalone task  
**Date**: 2026-06-13  

> **Revision note**: This doc is the least independently actionable of the three. Its
> conclusion ("centralized now, split into domain/protagonist folders later") is sound, but it
> should not be executed as its own task. Instead, the concrete decisions it implies — file
> location and ID convention for story events — get **locked when we build Quest slice 1**,
> and recorded in `docs/5-data-governance/story-events.md`. A path inaccuracy in the original
> draft is corrected in §2.

**Related Documents**:
- `docs/5-data-governance/` (existing)
- `docs/roadmap.md`
- `docs/1-baseline/story-outline.md`
- `docs/1-baseline/data-targets.md`
- `docs/3-narrative/world-overview.md`

## 1. The Question

As we move from the current small demo toward the rich multi-protagonist story + systems described in your research documents, we need to decide:

> Should authoring data (ports, trade goods, story events, characters, discoveries, etc.) be managed in a **centralized** way (few large files or a single barrel) or in a **decentralized / file-based** way (one file or folder per logical domain or per protagonist)?

This decision affects:
- Developer (and future AI-assistant) productivity
- Git merge conflicts
- Ability to load only what is needed
- Validation, tooling, and long-term maintainability
- How easily new story arcs from `story-outline.md` and `lore/` can be added

## 2. Current Situation

- Most **reference** game data lives in `src/data/` as individual `.ts` modules
  (`portData.ts`, `shipData.ts`, `sailorData.ts`, `itemData.ts`, `characterData.ts`,
  `marketGoodsData.ts`, etc.).
- **Story/quest data is the exception**: it lives under `src/interface/quest/`
  (`questData.ts` — one big keyed object of `Message[]`, and `getAvailableQuest.ts` — the
  procedural gating logic). This is the most centralized and most code-coupled of all the data.
- There is already a `docs/5-data-governance/` folder with `id-policy.md`,
  `current-inventory.md`, etc. — data hygiene is already being thought about.
- Player progress (`gold`, `quests`, `fleets`, …) is handled separately by the Save/Load
  layer (`src/state/saveLoad.ts`) and is **not** authoring data — see the persistence proposal.

## 3. Recommendation: Hybrid / Evolutionary Approach

**Start mostly centralized for the next 1–2 small steps, then evolve toward domain-based folders as volume and number of contributors (human or AI) grow.**

Do **not** jump straight to a fully decentralized structure while the schemas are still stabilizing.

### 3.1 Phase 1 (Now – next 4–6 weeks)

**Centralized with clear boundaries**

- Keep one file per major domain:
  - `src/data/ports/portData.ts`
  - `src/data/trade/tradeGoodData.ts` (new)
  - `src/data/story/storyEventData.ts` (new, from the quest proposal)
  - `src/data/characters/characterData.ts`
  - etc.

- Use a light `src/data/index.ts` barrel that re-exports the domains you actually need.
- All new story/event data starts here.
- Add a simple runtime schema guard (Zod or a small validation function) when loading data in development.

**Why centralized now?**
- The story schema is still being invented (you have a great outline, but the exact `StoryEventCondition` shape will evolve in the first implementation).
- Fewer files = easier to do global refactors and keep consistency.
- Easier to run "find all events that reference port X" kinds of queries.
- Matches the spirit of your existing `data-governance/` thinking.

### 3.2 Phase 2 (when we have ~80–120 events or multiple parallel story writers)

**Move to domain + protagonist folders**

Example structure:

```
src/data/
  core/                    # shared across everything
    ports.ts
    tradeGoods.ts
    ships.ts
  story/
    events/
      joao/
        001-lisbon-opening.ts
        010-domingo-stowaway.ts
        ...
      catalina/
        ...
    shared-events.ts       # cross-protagonist conspiracy beats
  characters/
    ...
  discoveries/
    ...
```

With a small `src/data/story/index.ts` that collects everything the engine needs.

This gives:
- Good git isolation (two people can work on Joao and Catalina stories at the same time with low conflict risk).
- Natural place to put per-protagonist metadata.
- Still allows cross-cutting queries via the index.

### 3.3 Data Governance (enhance what you already started)

Create or expand:
- `docs/5-data-governance/story-events.md` — ID naming convention (`{protagonist}-{sequence}-{slug}`), condition schema, when to use `storyHooks`, localization rules.
- `docs/5-data-governance/data-schema-evolution.md` — how we handle breaking changes in data shapes (especially important once saves exist).

This centralized governance document stays even if the physical files become decentralized.

## 4. Trade-offs Summary

| Aspect                    | Centralized (Phase 1)          | Decentralized Folders (Phase 2)     | Winner for this project |
|---------------------------|--------------------------------|-------------------------------------|-------------------------|
| Merge conflicts           | Higher when many people edit   | Much lower                          | Decentralized later    |
| Discoverability           | Excellent (grep one file)      | Good if you have good indexes       | Centralized early      |
| Load performance          | Slightly worse (load everything) | Easy to lazy-load per protagonist  | Decentralized          |
| Schema consistency        | Easier to enforce globally     | Requires governance + tooling       | Centralized early      |
| Parallel authoring        | Painful                        | Excellent                           | Decentralized          |
| AI-assisted writing       | Harder (one huge context)      | Much easier (give AI one file)      | Decentralized          |

## 5. Concrete Recommendation for the Next Three Small Steps

1. **Quest/Event System (see companion proposal)**  
   → Start with a single centralized `storyEventData.ts`. **Location decision to lock in slice 1**:
   either keep it next to its consumers in `src/interface/quest/` (lowest-churn, matches where
   quest data lives today) or move story data to `src/data/story/`. Recommendation: keep it in
   `src/interface/quest/` for slice 1 (pure migration), promote to `src/data/story/` only when
   the engine is decoupled from the interface and a 2nd protagonist appears.  
   → Document the schema + ID convention (`{protagonist}-{seq}-{slug}`) in
   `docs/5-data-governance/story-events.md`.  
   → Only split into folders when we actually have events from 2+ protagonists.

2. **Save/Load MVP (see companion proposal)**  
   → The save format should be **centralized** (one `SerializableState` shape). This is orthogonal to authoring data.

3. **First real story expansion** (e.g. Domingo arc or basic fame + one cross event)  
   → Add the data in the centralized file first.  
   → Only refactor the folder structure after the first 15–20 events are working and the schema feels stable.

## 6. Practical Rules of Thumb

- If a data type is **player progress** (quests completed, fame, relationships, discovered relics) → keep it **centralized** in the save blob.
- If a data type is **authoring content** (event definitions, port descriptions, trade good stats) → start centralized, split when it hurts.
- When in doubt, put a new data file next to the code that first consumes it, then promote it to `src/data/` when it stabilizes.
- Always keep a single source of truth for IDs and schemas (`data-governance/` is already the right place).

## 7. Open Questions for You

- Do you expect other people (or heavy AI pair-programming) to write story events in the near future? (This strongly pushes toward earlier decentralization.)
- How important is being able to load only one protagonist's data at a time? (Affects whether we need folder structure soon.)
- Would you like a small script later that can validate the entire data set against a schema (great for both centralized and decentralized phases)?

---

**Next action suggestion**: After we agree on the shape in the Quest/Event System proposal, we can create the initial `storyEventData.ts` (centralized) + the governance document in one go. This gives you a clean foundation that can evolve into the folder structure you will eventually want without painful refactors later.

This proposal, together with the other two, gives you a coherent "how we grow the data and the game" playbook that matches the high-quality thinking already visible in your `docs/1-baseline/` and `docs/3-narrative/` folders.
