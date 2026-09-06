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

## 中文版开发进度

继续开发请先读根目录的[交接文档](HANDOFF.md)：当前 M1 已完成，下一阶段从 M2 冲突与成长接续，附启动方式、验证证据及存档约束。

首批中文可玩基础（M0）已完成并通过验收与审查：默认简体中文、中英显示切换、现有里斯本开场与界面汉化，以及海上读档修复。M1 在此基础上加入首次航海一章：工会委托、连续出海三天后遇见多明戈、探索直布罗陀海峡、返港上报与一次性委托奖励。约翰完整主线、战斗与结局仍在路线图中。

首个完整交付目标是 **约翰·法雷尔全线通关**。后续按独立章节继续加入其他主角及扩展剧情，沿用稳定内容ID、声明式条件/奖励和兼容旧存档的迁移。参见[交付方案](docs/superpowers/specs/2026-09-06-chinese-playable-release-design.md)、[M1实施计划](docs/superpowers/plans/2026-09-06-m1-first-voyage.md)、[中文资料基线](docs/1-baseline/chinese-reference-baseline.md)及[M1验收记录](docs/superpowers/verification/2026-09-06-m1-first-voyage.md)。

使用 WASD 移动，E、Enter 或鼠标左键确认，Escape 或鼠标右键取消。左侧「系统」提供保存、读取、重置及中英切换；语言偏好独立保存。「日志」给出当前任务和返港上报指引，海上对话及侧栏弹窗会暂停航行。完成开场后先到里斯本工会接取委托；发现增加名声，上报才领取发现物金币。拒绝多明戈后可在里斯本工会重新邀请。新增剧情前请阅读[剧情编写指南](docs/story/authoring-guide.md)中的章节、中文文本和存档约束。

## Features

- Walking around in any of the 130 ports and entering their buildings.
- Sailing around the world map, where your speed takes into account all the
  factors of the original game.
- **Save / Load** system — progress is persisted to `localStorage` with
  auto-save on key actions (trading, docking, buying ships, etc.) and a
  manual System menu (Save / Load / Reset).
- **First voyage** — a bilingual journal, sea encounters, Domingo recruitment and a Lisbon Guild commission. Save v5 preserves semantic chapter progress and migrates previously paid discoveries safely.
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

`npm run verify` runs the asset preflight, story-content validation, Jest tests, TypeScript checks,
ESLint, and the production build. `npm run verify:full` adds the Chrome E2E
suite. For local verification with an installed Microsoft Edge, run
`npm run verify`, serve `build/` with `npm run serve:build`, then run
`npx cypress run --browser edge` in another terminal.

The current game uses a fixed 1640×800 desktop layout; browser acceptance is
performed at 1700×1000. A smaller window can scroll horizontally.

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
