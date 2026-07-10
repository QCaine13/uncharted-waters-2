# Uncharted Waters: New Horizons

[![Baseline](https://github.com/QCaine13/uncharted-waters-2/actions/workflows/baseline.yml/badge.svg)](https://github.com/QCaine13/uncharted-waters-2/actions/workflows/baseline.yml)

[Uncharted Waters: New Horizons](https://en.wikipedia.org/wiki/Uncharted_Waters#Uncharted_Waters:_New_Horizons)
(大航海時代 II) is an open world RPG and simulation game from 1994, set during
the Age of Exploration. Johan Li began this browser-based remake as a side
project inspired by a childhood favorite.

This repository continues that work as an actively upgraded project. It is not
yet close to a full remake, but its existing game systems, content, and runtime
baseline are being strengthened incrementally.

<p align="center">
  <img src="https://media.githubusercontent.com/media/JohanLi/uncharted-waters-2/readme-assets/uncharted-waters-2.png" alt="Uncharted Waters: New Horizons">
  Screenshots of the original game
</p>

## Features

- Walking around in any of the 130 ports and entering their buildings.
- Sailing around the world map, where your speed takes into account all the
  factors of the original game.
- **Save / Load** system — progress is persisted to `localStorage` with
  auto-save on key actions (trading, docking, buying ships, etc.) and a
  manual System menu (Save / Load / Reset).
- **Market trading** — buy and sell 24 trade goods across 13 market
  regions. Each region has local supply (cheap) and demand (expensive)
  goods, enabling the classic buy-low-sell-high trade routes.

## Development

Requirements: Node.js 22, npm, and Git LFS.

```sh
git lfs install
git lfs pull origin master
npm ci
npm start
```

`npm run verify` runs the asset preflight, Jest tests, TypeScript checks,
ESLint, and the production build. `npm run verify:full` adds the Chrome E2E
suite.

## Architecture

The game is made up of two parts:

- The **game** itself, a canvas element
- An **interface**/GUI, handled by React

The **game loop** reads **State** and **Input**, and updates the canvas element.

During gameplay, **actions** are called to update **State**. Actions themselves
can call **updateInterface**, which wraps React’s `useState` hooks.

**Assets** makes sure the images and game data is loaded before the game starts.

<p align="center">
  <img src="https://media.githubusercontent.com/media/JohanLi/uncharted-waters-2/readme-assets/architecture.png" alt="Architecture" width="560">
</p>

The two parts maintain their own local state, e.g., keeping track of the
active menu item or where the NPCs are in a port. Input can also be handled
locally, particularly when it comes to the interface.

#### Game loop

Uses `requestAnimationFrame()`.

State changes, such as reading Input and translating it to movement, don’t
occur every frame — a check is performed to see if enough time has passed.
Each frame does, however, interpolate movement for smoother graphics.

#### Why isn’t a state management library used?

In contrast to most web apps, the game code is imperative. It doesn’t need
to react to changes because it’s looped non-stop. While using a single
Redux store for both the game and the interface seems to be a clean approach,
it’s too slow if we want to maintain 60 fps.

The interface alone is too simple to warrant using Redux.

#### Future considerations

- Using a service worker so the game can be played offline.
- Pathfinding for NPC fleets.
