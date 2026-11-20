# Agent notes

## Environment

- Use Node 22 via PATH prefix (do not change system node):
  `export PATH="$HOME/.local/opt/node-v22.20.0-darwin-arm64/bin:$HOME/.local/bin:$PATH"`
- Git LFS binary lives in `$HOME/.local/bin` (same PATH prefix covers it).

## Verify

- `npm run verify` runs the full gate: typecheck, lint, jest, webpack build.
- Narrow checks while iterating: `npx tsc --noEmit`, `npx eslint <files>`,
  `npx jest <test>`.

## Cypress

- Cypress must run with the Electron env var unset:
  `env -u ELECTRON_RUN_AS_NODE npx cypress run --browser chrome --spec <spec>`
- `ELECTRON_RUN_AS_NODE=1` is exported in some shells and makes Cypress's
  Electron start in Node mode ("bad option: --no-sandbox").

## HD Lisbon art pipeline

- `scripts/art/import-hd.py [--art DIR]` imports whatever art exists under
  `art/chatgpt/output` (default: the main checkout's copy) into
  `src/game/images/hd/` and regenerates `hdManifest.ts`. Idempotent — re-run
  after new art lands. Requires Python with Pillow (`/tmp/uw2-venv/bin/python`).
- `scripts/art/import-scene.py [--scene DIR]` stitches the district paintings
  under `art/chatgpt/scene/output` (default: the main checkout's copy) into
  WebP chunks under `src/game/images/hd/scene/` plus `hdSceneManifest.ts`.
  The pilot `district-quay-market.png` is used only while `output/C2.png`
  does not exist. Same Pillow venv (needs numpy).
- Debug query params (work in production builds, only with `hddebug=1`):
  - `?hddebug=1&time=<0-1439>` — visual time-of-day only, game state unchanged
  - `?hddebug=1&weather=clear|cloudy|rain|fog`
  - `?hddebug=1&zoom=<1-2>`
