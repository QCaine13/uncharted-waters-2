# Data Governance Mini Database

This directory is a small, version-controlled data governance database for the
current remake.

It is intentionally plain JSON and Markdown instead of SQLite. The data should
be easy to diff, review, translate, and eventually turn into TypeScript data
modules or import scripts.

## Files

- [reference-db.json](reference-db.json): the mini database. It tracks source
  catalogs, entity types, current in-game datasets, quality status, and next
  normalization targets.
- [database.schema.json](database.schema.json): lightweight JSON Schema for the
  mini database shape.
- [current-inventory.md](current-inventory.md): human-readable audit of the
  current `src/data` files.
- [id-policy.md](id-policy.md): stable ID and naming rules for future data.

## Governance Goals

1. Keep canonical IDs stable even if display names change.
2. Separate current implementation data from researched reference data.
3. Track source confidence and source URLs for every future imported dataset.
4. Add Chinese and Japanese names without overwriting English names.
5. Make missing systems explicit before we expand gameplay.

## How To Use This

- Add new reference sources to `reference-db.json.sources`.
- Add new entity families to `reference-db.json.entityTypes`.
- When a data table becomes implementation-ready, create or update the matching
  TypeScript module in `src/data`.
- Keep research notes in `docs/research`; keep normalized governance metadata
  here.
