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

继续开发请先读根目录的[交接文档](HANDOFF.md)与[完整复刻蓝图与后续规划](docs/roadmap/full-remake-roadmap.md)：当前 **M0–M3（约翰·法雷尔全线通关）**、**D20（SFC 巅峰画风与音画重塑）** 以及 **M4（全六位主角完整剧情线 + 港口核心建筑功能闭环）** 均已完成并合入 `master`。

- **M0 中文可玩基础**：默认简体中文、中英显示即时切换、里斯本开场与界面全面汉化，以及海上读档修复。
- **M1 首次航海**：双语航行日志、里斯本公会委托、连续出海三天遇见多明戈、探索直布罗陀海峡与返港上报领赏。
- **M2 冲突与成长**：三攻三防剑术决斗与四档距离旗舰海战、装备与战斗等级、船厂修理、多明戈王子身份揭晓、卡特琳娜追击及阿兰寻妹（休达 → 里斯本 → 塞维利亚 → 巴士拉 → 伊斯坦布尔）。
- **M3 约翰归家终章**：马沙华/阿克苏姆圣杖防卫战、王冠与卡特琳娜和解、恩里克长崎告别、堺公会线索、南美路琪亚救援与鲁道夫决斗、西葡联合舰队亚马逊决战及里斯本归家结局（Save v7 首次事件时钟）。
- **D20 SFC 音画重塑**：SNES 原版 ROM 16 色小林智美水彩立绘与地中海港口瓦片无损提取、SFC 双线木纹金边羊皮纸对话框、Web Audio 程序化合成音效及 CRT 扫描线复古滤镜开关。
- **M4 六大主角全线可玩与港口设施闭环**：实装系统菜单主角选择与存档隔离，完整交付 **约翰（葡萄牙）、卡特琳娜（西班牙）、奥托（英格兰）、恩斯特（荷兰）、皮耶德（意大利）、阿兰（奥斯曼帝国）** 六大原作主角的独立开局、同伴招募、海战/单挑、双语航行日志与专属结局；同时补齐市场商业投资、造船厂工业投资/造新船/改炮位、酒馆解雇水手/请客喝酒、旅馆闲聊/港口情报、公会国家势力统计与王宫觐见授勋/远航补助。

后续阶段（Phase 2–5：动态世界 AI 舰队与同盟港争夺、六角格战术海战与接舷夺船、海岸登陆探索与百大发现物、全球酒馆百名航海士与随机公会委托）详见[完整复刻蓝图与后续规划](docs/roadmap/full-remake-roadmap.md)。

使用 WASD 移动，E、Enter 或鼠标左键确认，Escape 或鼠标右键取消。左侧「系统」提供保存、读取、重置、六大主角新航程切换、中英切换、合成音效开关及 CRT 扫描线滤镜；语言与视听偏好独立保存。「日志」给出当前任务、等待日期和返港上报指引，海上对话及侧栏弹窗会暂停航行。新增剧情前请阅读[剧情编写指南](docs/story/authoring-guide.md)中的章节、中文文本和存档约束。

## Features

- **Six Playable Protagonists (`João`, `Katarina`, `Otto`, `Ernst`, `Pietro`, `Ali`)** — each with authentic starting ports, fleets, companions, multi-ocean storylines, naval/sword combat encounters, bilingual voyage journals, and ending banners.
- **Complete Port Facilities & Royal Court** — walk around in any of the 130 ports and interact with Markets (trade & commercial investment), Shipyards (buy/sell used ships, build new ships, remodel cannon capacity, repair, & industrial investment), Pubs (recruit/dismiss crew, gossip, & treat the tavern), Lodges, Item Shops, Churches, Banks, Guilds, and Royal Palaces (rank promotions from Page to Duke & royal subsidies).
- **World Sailing & Navigation** — sail around the world map where speed accounts for wind, current, ship rigging, crew, and daily provision consumption.
- **Save / Load** system (Save v7) — progress is persisted to `localStorage` with auto-save on key actions and a manual System menu (Save / Load / Reset / Protagonist Switch), with full migration support from Save v1–v6.
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
