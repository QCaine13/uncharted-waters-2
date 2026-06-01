# ID Policy

Stable IDs matter because we will add translations, source references, save
data, and future game systems.

## Rules

- Never use display names as IDs.
- Preserve current numeric IDs when mapping existing game data.
- Add a typed prefix when creating new canonical datasets:
  - `port:1`
  - `building:4`
  - `ship:6`
  - `item:21`
  - `good:rock-salt`
  - `discovery:stonehenge`
  - `event:joao-adv-08000`
- Use lowercase kebab-case for new non-numeric IDs.
- Keep localization under `names`, for example:

```json
{
  "id": "port:1",
  "sourceId": "1",
  "names": {
    "en": "Lisbon",
    "zh": "里斯本",
    "ja": "リスボン"
  }
}
```

## Source References

Every researched value that does not come from current source code should carry
a source reference when practical:

```json
{
  "field": "specialtyGoodId",
  "value": "good:rock-salt",
  "sourceRefs": ["cn-port-list", "gcgx-dkj2"]
}
```

## Save Data Compatibility

Implementation IDs stored in player saves should be stable. If an ID must
change, add a migration table rather than rewriting old saves in place.
