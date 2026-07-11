# 决策日志 (Decision Log)

**作用**：项目级决策的**单一真相源**。任何跨文档的方向性选择都记在这里，文档正文只引用、不重述。
**用法**：新决策追加到「已定」；开放问题放「待决」，确定后移到「已定」并划掉对应条目。

> 格式：`Dn — 标题` · 状态 · 日期 · 决策内容 · 影响到的文档。

---

## 已定 (Decided)

### D1 — 两条故事线的关系：新剧本**叠加**在复刻之上
- 日期：2026-06-13 · 来源：用户确认
- `1-baseline/`（原作复刻）是 canon 基线；`3-narrative/`（新剧本）是叠加其上的扩展层，
  扩展叙事深度但**不重写**基线史实（呼应 `3-narrative/world-overview.md` §1.4）。
- 影响：`README.md` 分层模型、`3-narrative/README.md`、所有叙事文档定位。

### D2 — 文档结构：5 层 + 顶层导航，彻底重构
- 日期：2026-06-13 · 来源：用户确认
- `research → 1-baseline + 2-world-design`、`lore → 3-narrative`、`proposal → 4-engineering`、
  `data-governance → 5-data-governance`，`implementation-plan → 顶层 roadmap.md`。
- 编号前缀编码推荐阅读顺序；顶层加 `README` / `DECISIONS` / `glossary`。

### D3 — 剧情副作用：声明式 effect，而非 `() => void` 回调
- 日期：2026-06-13 · 来源：`4-engineering/quest-event-system.md` 评审锁定
- 事件的奖励 / 状态变更用**声明式 `Reward[]`** 描述，由引擎解释执行，保证可序列化、可被编辑器 / AI 撰写。

### D4 — 剧情引擎首个切片 = 纯迁移 ✅ 已实现（2026-06-14）
- 日期：2026-06-13 · 来源：`4-engineering/quest-event-system.md`
- slice 1 把现有 Joao 里斯本流程**逐字节等价**迁移到数据驱动结构，不加新功能；验收 = parity 测试。
- 实现：`src/interface/quest/questEvents.ts`（声明式有序规则表 + 纯引擎 `resolveQuestId`）；
  `getAvailableQuest.ts` 改为读 state 的薄壳；`getAvailableQuest.parity.test.ts` 穷举
  2^10 quest 子集 × 12 建筑 × 5 时间（~6.1 万组合）对拍旧逻辑，全过。全量 59/59 测试绿，
  tsc 0 错误，eslint 干净。`questData.ts` 对话数组未动。

### D5 — 条件 / 奖励模型收敛到 `StoryHooks`
- 日期：2026-06-13 · 来源：`4-engineering/quest-event-system.md` 决策 4
- 不另造模型；采用 `3-narrative/samples/staff-of-the-saint.md` §6 已设计的 `triggers / rewards / crossLinks`
  词汇。**剧情事件、传说事件、宝物发现**三类内容由**同一个 trigger 引擎**驱动。

### D6 — 存档：先落地版本迁移脚手架，再 bump 版本 ✅ 已实现（2026-06-14，随 slice 2a）
- 日期：2026-06-13 · 来源：`4-engineering/save-load-persistence.md`
- 存档 MVP 已实现；下一步在引入第一个新字段（`fame`）时同步加 `migrate()` 链，避免老存档被丢弃。
- 实现：`src/state/saveMigrations.ts`（`SAVE_VERSION=2` + `migrate()` 链，v1→v2 补 `fame:0`，未知/缺版本
  安全回落 null）；`saveLoad.load()` 与 `state.loadSavedState()` 都改走 `migrate()`，老 v1 档不再被丢弃。
  `saveMigrations.test.ts` 覆盖升级/不变/安全回落。

### ~~D7 — L5 终局立意：远古机器 sci-fi~~ ❌ 已否决（2026-06-13 当日反转）
- ~~提出~~：曾考虑把「普世遗产」设为远古自我重启的巨型机器（基于 NotebookLM 50 实体 Chatlog 的 L5 设定）。
- **否决**：日期 2026-06-13 · 来源：用户反转决定。**不接入远古机器**，L4-L5 回到
  `3-narrative/world-overview.md` 的**原始设定**（§4：信标会 / 普世遗产 / 失落基督教王国 / 景教南传假说，
  L5 = 文明级真相「遗产改变所有人对世界的理解」）。`§1.4`「不是奇幻 RPG / 不引入超自然」边界**维持原样，不收窄**。
- 留作记录的边界澄清（仍然成立，与原始方法论一致）：传说事件的「博物」层**可以**给自然 / 人为解释
  （守 P1 与 `methodology.md §4.5`，如圣艾尔摩之火、生物荧光、低压气象），但**不得**归因为「远古机器 /
  海底基站 / 自动重启程序」这类超科技实体。
- 对 50 实体的影响：**风闻 + 记录两层基本可留**（民俗 + 史实）；**博物层凡引用「机器 / 信标会建声呐站 /
  辐射屏蔽 / 自动重启」处需改写**，重新锚定到原始信标会（寻找失落基督教王国 / 普世遗产的温和派 vs 极端派）。

### D8 — 结构化剧情采用 arc 模块 + 显式编译器
- 日期：2026-07-11 · 来源：`docs/superpowers/specs/2026-07-10-structured-story-architecture-design.md`
- 剧情内容采用 TypeScript arc 模块，并由中央 registry 显式注册、编译和校验；不做目录自动发现。
- 角色关系是可查询但不持久化的静态有向图；剧情副作用只允许声明式 effects，内容中禁止任意回调和全局状态导入。
- 里斯本迁移先以 shadow parity 对拍旧解析器、逐字稿和状态变化，确认等价后切换运行时；Save v2 继续通过独立 adapter 读写原有 `state.quests` completion keys，不升级存档版本。
- 本次架构切片只迁移现有 João 里斯本开场，不增加 Domingo 或任何新剧情内容。

---

## 待决 (Open — 需用户拍板)

> 这些原本散落在 `world-overview.md §7` 与 `methodology.md §10`，现集中于此。关一个划一个。

**新剧本世界观（原 world-overview §7）**
- [Q1] 新剧本要不要正式命名？（暂用「新剧本」工作标题）
- [Q2] 暗线组织「信标会 / Beacon Order」这个名字是否保留？是否太「光明会」(Q7 同源)？
- [Q3] L4 暗线是否真的把原作所有传说（Atlantis / Prester John / 圣者之杖 / El Dorado）
  「统一」成同一段景教史？还是保留各传说独立？（D7 否决后回到全开放；远古机器统一方案已弃）
- [Q4] 6 主角关系网拓扑是否需要调整？
- [Q5] 明（中国）的篇幅是否过重？（作者判断这是原作最被低估的部分）
- [Q6] 美洲原住民的呈现方式确认为「真实历史 + 致敬，不神化不丑化」？

**内容方法论（原 methodology §10）**
- [Q7] 三视角自查的「美」是否改为「非欧亚」以涵盖非洲？（注：`world-archive.md` 已写非洲，
  方法论与已入库内容已轻微不一致，需尽快定。）
- [Q8] 「至少 1 剧情钩 + 1 机制入口」是否收紧为「必须 2 个」？
- [Q9] 准入三问的 Q2「异」是否需要差异度评分？
- [Q10] V1 目标 30-50 条是否合理？需 V0 估算每条耗时后定。
- [Q11] 是否需要「内容退役」机制（某条 lore 后与新设定冲突时如何处理）？

**方法论节奏张力（新增）**
- [Q12] `methodology.md` 要求每条内容走完 8 步、满足 8/8 才入库；`roadmap.md` 的「有分寸 /
  1-3 小时小切片」精神可能让 V1 卡死。是否为业余节奏设一个**轻量入库档位**（如 V1 允许 5/8）？

---

**修订日志**
- 2026-06-13：建档，录入 D1-D6，集中 Q1-Q12。
