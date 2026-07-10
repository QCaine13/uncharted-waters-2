# 项目文档总览 (docs/)

本目录是「大航海时代 2 复刻 + 扩展」项目的设计与工程文档库。它不是代码注释，而是
**决定我们做什么、为什么这么做、按什么顺序做**的事实来源。

> 新人 / AI 第一次进来，请按本页「阅读地图」的顺序读，不要随机翻。

---

## 分层模型（最重要的心智模型）

项目有两条叙事轨道，关系是**叠加**而非并列：

```
                ┌─────────────────────────────────────┐
   3-narrative  │  新剧本叙事层（5 层暗线 + 信标会 + 史实深化）  │   ← 扩展层
                └─────────────────────────────────────┘
                              ▲  叠加在…之上
                ┌─────────────────────────────────────┐
   1-baseline   │  原作复刻基线（忠实重建原作 6 路线与系统）       │   ← 基线
                └─────────────────────────────────────┘
```

- **1-baseline** 定义「这个游戏忠实复刻原作的样子」——它是 canon 基础。
- **3-narrative** 是叠加在基线之上的**新剧本**，扩展叙事深度，但**不重写**基线史实
  （见 `3-narrative/world-overview.md` §1.4）。
- **2-world-design**（世界/地图/港口扩展）、**4-engineering**（实现提案）、
  **5-data-governance**（数据治理）是支撑这两层落地的横切关注点。

这条「叠加」定位是已确认的项目决策，见 [DECISIONS.md](DECISIONS.md) D1。

---

## 阅读地图

| 顺序 | 位置                                                                   | 是什么                                                      | 语言 |
| ---- | ---------------------------------------------------------------------- | ----------------------------------------------------------- | ---- |
| 0    | **本文件** + [DECISIONS.md](DECISIONS.md) + [glossary.md](glossary.md) | 导航、决策日志、三语术语                                    | 中文 |
| 0    | [roadmap.md](roadmap.md)                                               | 统一路线图（做什么、按什么节奏）                            | 中英 |
| 1    | [1-baseline/](1-baseline/README.md)                                    | 原作复刻基线：现状审计、原作系统、原作 6 路线故事、数据目标 | 英文 |
| 2    | [2-world-design/](2-world-design/)                                     | 世界扩展设计：地图现代化、港口扩张策略                      | 英文 |
| 3    | [3-narrative/](3-narrative/README.md)                                  | 新剧本叙事层：方法论、世界观总览、全球档案、样例            | 中文 |
| 4    | [4-engineering/](4-engineering/README.md)                              | 实现提案：数据架构、剧情引擎、存档迁移                      | 英文 |
| 5    | [5-data-governance/](5-data-governance/README.md)                      | 数据治理：ID 政策、数据清单、参考数据库                     | 英文 |

---

## 当前状态面板

> 2026-07-10 verified against the checked-out code.

| 系统                                           | 状态                                     | 说明                                                                                                                                                                      |
| ---------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 世界航行 / 港口行走 / 建筑                     | ✅ 已实现                                | 基础骨架                                                                                                                                                                  |
| **海上每日补给消耗**                           | ✅ MVP 已实现                            | 舰队共享水/食物，按总船员向上取整每日扣减；≤3 天橙色、耗尽红色；[验证记录](superpowers/verification/2026-07-10-daily-provisions-consumption-verification.md)              |
| 港口建筑（港务/酒馆/旅馆/银行/商店/教堂/船厂） | ✅ 已实现                                | UI 完成，部分逻辑待深化                                                                                                                                                   |
| **存档 / 读档 / 重置**                         | ✅ MVP + version 2 migration implemented | [`src/state/saveLoad.ts`](../src/state/saveLoad.ts)                                                                                                                       |
| **贸易 / 市场**                                | ✅ MVP 已实现                            | `Market.tsx` + `goodsData.ts` + `marketGoodsData.ts`（原文档曾标「最大阻塞」，已过时）                                                                                    |
| 名声（冒险/海盗/贸易）                         | ⏳ 未实现                                | 剧情引擎 slice 2 引入                                                                                                                                                     |
| 数据驱动剧情引擎                               | ✅ slice 1 implemented                   | [slice 1](../src/interface/quest/questEvents.ts) 已落地；更广的 narrative / lore 集成待完成                                                                               |
| 运行时基线 / CI                                | ✅ 已实现                                | [资产预检](../scripts/verify-assets.js) + [项目 CI](../.github/workflows/baseline.yml) + [验证记录](superpowers/verification/2026-07-09-runtime-baseline-verification.md) |
| 多主角 / 关系网 / 5 层暗线                     | ⏳ 设计中                                | 见 `3-narrative/`                                                                                                                                                         |
| 港口扩张（→270-320 节点）/ 地图现代化          | ⏳ 设计中                                | 见 `2-world-design/`                                                                                                                                                      |

---

## 文档约定

- **语言**：基线 / 世界设计 / 工程 / 治理用**英文**（贴近代码）；新剧本叙事层用**中文**
  （创作语言）。跨层术语统一收在 [glossary.md](glossary.md)。
- **状态头**：每篇文档顶部带 `Status` / `Date`。标记语义：
  `[决策]` 已定 · `[假设]` 暂定 · `[TODO]` 待办 · `[Q]` 开放问题。
- **单一真相源**：
  - 项目级决策 → [DECISIONS.md](DECISIONS.md)
  - 三语术语 → [glossary.md](glossary.md)
  - 数据 ID / 来源 → [5-data-governance/](5-data-governance/README.md)
  - 共享剧情字段 schema → `3-narrative/samples/staff-of-the-saint.md` §6 + `4-engineering/quest-event-system.md`
- **未决问题**：不要散落在各文档结尾——统一汇总到 [DECISIONS.md](DECISIONS.md) 的「待决」区，
  关掉一个划掉一个。
