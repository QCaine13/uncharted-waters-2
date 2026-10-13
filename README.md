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

继续开发请先读根目录的[交接文档](HANDOFF.md)：当前 **M0–M3（约翰·法雷尔全线通关）** 与 **D20（SFC 巅峰画风与音画重塑）** 已完成并合入 `master`，下一阶段从 **M4 其他五位主角** 接续，附启动方式、验证证据及存档约束。

- **M0 中文可玩基础**：默认简体中文、中英显示即时切换、里斯本开场与界面全面汉化，以及海上读档修复。
- **M1 首次航海**：双语航行日志、里斯本公会委托、连续出海三天遇见多明戈、探索直布罗陀海峡与返港上报领赏。
- **M2 冲突与成长**：三攻三防剑术决斗与四档距离旗舰海战、装备与战斗等级、船厂修理、多明戈王子身份揭晓、卡特琳娜追击及阿兰寻妹（休达 → 里斯本 → 塞维利亚 → 巴士拉 → 伊斯坦布尔）。
- **M3 约翰归家终章**：马沙华/阿克苏姆圣杖防卫战、王冠与卡特琳娜和解、恩里克长崎告别、堺公会线索、南美路琪亚救援与鲁道夫决斗、西葡联合舰队亚马逊决战及里斯本归家结局（Save v7 首次事件时钟）。
- **D20 SFC 音画重塑**：SNES 原版 ROM 16 色小林智美水彩立绘与地中海港口瓦片无损提取、SFC 双线木纹金边羊皮纸对话框、Web Audio 程序化合成音效及 CRT 扫描线复古滤镜开关。

首个完整交付目标 **约翰·法雷尔全线通关** 已达成。后续按独立章节继续加入其他五位主角及扩展剧情，沿用稳定内容 ID、声明式条件/奖励和兼容旧存档的迁移。参见[交付方案](docs/superpowers/specs/2026-09-06-chinese-playable-release-design.md)、[M3设计方案](docs/superpowers/specs/2026-09-07-m3-joao-finale-design.md)、[SFC音画重塑方案](docs/superpowers/specs/2026-10-11-sfc-visual-and-audio-retrofit-design.md)、[中文资料基线](docs/1-baseline/chinese-reference-baseline.md)及[M3验收记录](docs/superpowers/verification/2026-09-07-m3-joao-finale.md)。

使用 WASD 移动，E、Enter 或鼠标左键确认，Escape 或鼠标右键取消。左侧「系统」提供保存、读取、重置、中英切换、合成音效开关及 CRT 扫描线滤镜；语言与视听偏好独立保存。「日志」给出当前任务、等待日期和返港上报指引，海上对话及侧栏弹窗会暂停航行。新增剧情前请阅读[剧情编写指南](docs/story/authoring-guide.md)中的章节、中文文本和存档约束。

## Features

- Walking around in any of the 130 ports and entering their buildings, rendered with authentic SFC 16-color Mediterranean tiles and portraits.
- Sailing around the world map, where your speed takes into account all the factors of the original game, plus daily provision consumption and starvation penalties.
- **Save / Load** system (Save v7) — progress is persisted to `localStorage` with auto-save on key actions and a manual System menu (Save / Load / Reset), with full migration support from Save v1–v6.
- **João Franco complete storyline (M0–M3)** — a bilingual voyage journal, declarative story engine, sea encounters, sword duels, flagship naval combat, companion handovers, and a playable homecoming ending.
- **Market trading & Discoveries** — buy and sell 24 trade goods across 13 market regions with dynamic price indices (`[40, 200]`), discover historical landmarks for Adventure Fame, and report discoveries for gold.

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
