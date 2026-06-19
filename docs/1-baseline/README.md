# 1 · Baseline — Reference & Faithful Reconstruction

**Status**: Living reference · **Date**: 2026-06-13

This layer is the **canon baseline**: reference material and the faithful
reconstruction of the original game (systems, data shapes, the six-protagonist
story) inspired by Uncharted Waters: New Horizons / Daikoukai Jidai II. The new
narrative ([`3-narrative/`](../3-narrative/README.md)) layers *on top* of this
baseline without rewriting it — see [DECISIONS.md](../DECISIONS.md) D1.

Forward-looking world/map/port expansion lives separately in
[`2-world-design/`](../2-world-design/); the unified roadmap is at
[`roadmap.md`](../roadmap.md).

The goal is not to copy a guide verbatim. Use these notes to identify systems,
data shapes, feature priorities, and translation/reference terms that can be
implemented in this codebase.

## Source Index

### High-value system references

- GCGX, Daikoukai Jidai II strategy and analysis
  - https://gcgx.games/dkj2/
  - Best source found for structured system data.
  - Covers ports, facilities, trade goods, routes, ships, cannons, figureheads,
    items, sailors, battle, discoveries, and character walkthroughs.
- Offline Daikoukai series wiki
  - https://w.atwiki.jp/offlinedaikoukai/pages/48.html
  - Strong player-oriented system explanations and practical advice.
  - Useful for balancing and understanding how players actually optimize the
    original game.
- GameFAQs, New Horizons FAQs and guides
  - https://gamefaqs.gamespot.com/pc/564431-new-horizons/faqs
  - Useful for English-version walkthroughs and cross-checking names.
- Koei Wiki, New Horizons trading data
  - https://koei.fandom.com/wiki/Uncharted_Waters%3A_New_Horizons/Trading_Data
  - Useful for English trading terminology and market-system notes.

### Chinese-language references

- Full Chinese character walkthrough guide
  - https://www.top10bit.com/dai-koukai-jidai-2-guide/
  - Useful for main-character story flows and Chinese terminology.
- Chinese port list
  - https://blog.sina.com.cn/s/blog_590a34ba0100vyut.html
  - Includes port names, specialties, coordinates, facilities, and black-market
    items.
- Marked world map reference
  - https://www.usold.cn/post/333.html
  - Useful for port, supply port, discovery, village, and coordinate references.

### Manuals and guidebook leads

- The Spriters Resource, Wii Virtual Console manual asset
  - https://www.spriters-resource.com/wii/virtualconsole/asset/213920/
  - Contains an extracted manual asset set.
- NostaLibrary, Daikoukai Jidai II complete guidebook listing
  - https://nostalibrary.tzengyuxio.me/guidebooks/csd/028/
  - Bibliographic lead for a 1994 Traditional Chinese guidebook.
- National Diet Library listing for Daikoukai Jidai II Handbook
  - https://ndlsearch.ndl.go.jp/books/R100000002-I000002520435
  - Bibliographic lead for an official/period Japanese handbook.

## Working Documents

In this folder (`1-baseline/`):

- [systems.md](systems.md): top-level gameplay systems and feature gaps.
- [data-targets.md](data-targets.md): data tables we should build or expand.
- [story-outline.md](story-outline.md): six-protagonist (original) story outline
  and current repo coverage.

Moved to sibling layers:

- [`../2-world-design/world-map-modernization.md`](../2-world-design/world-map-modernization.md):
  setting anchors, map expansion layers, and modernization principles.
- [`../2-world-design/port-expansion-strategy.md`](../2-world-design/port-expansion-strategy.md):
  target port count, port classes, and Asia/China expansion priorities.
- [`../roadmap.md`](../roadmap.md): unified phased roadmap (was
  `implementation-plan.md`).

## Immediate Research Priorities

> **Update (2026-06-13)**: A Trade/Market MVP and Save/Load MVP have since
> shipped (commit `9593a11`: `goodsData.ts`, `marketGoodsData.ts`, `Market.tsx`,
> `saveLoad.ts`). Item 2 below is now about *deepening* trade (fluctuation, tax,
> investment unlocks), not building it from zero. See the status panel in
> [../README.md](../README.md).

1. Ports and facilities: normalize port names, coordinates, facilities,
   regions, specialties, and opening hours.
2. Trade: define goods, base prices, regional availability, local specialties,
   tax, market fluctuation, and investment unlocks.
3. Ships: compare original ship stats against `src/data/shipData.ts`, then add
   missing shipyard rules.
4. Characters and story: decide whether to implement one protagonist path first
   or a free-form sandbox with story hooks.
5. Localization: create a bilingual glossary for menus, ports, goods, ships,
   sailors, and story names.
