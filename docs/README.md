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

## 当前执行入口

2026-09-06：用户已授权接手与分阶段开发。请先读 [中文交付方案](superpowers/specs/2026-09-06-chinese-playable-release-design.md)、[M0 实施计划](superpowers/plans/2026-09-06-chinese-foundation.md)和[中文资料基线](1-baseline/chinese-reference-baseline.md)。M0 正在执行，尚不代表约翰完整路线已经完成。

## 当前状态面板

> 2026-07-11 verified against the checked-out code.

| 系统                                           | 状态                                     | 说明                                                                                                                                                                                                                       |
| ---------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 世界航行 / 港口行走 / 建筑                     | ✅ 已实现                                | 基础骨架                                                                                                                                                                                                                   |
| **海上每日补给消耗 + 断粮惩罚**                 | ✅ 已实现                                | 舰队共享水/食物，按总船员向上取整每日扣减；≤3 天橙色、耗尽红色。断粮**逐日**减员（10%，两缺翻倍），归零则拖回最近港口，见 [D11](DECISIONS.md) 与 [设计](superpowers/specs/2026-08-13-starvation-penalty-design.md) |
| 港口建筑（港务/酒馆/旅馆/银行/商店/教堂/船厂） | ✅ 已实现                                | UI 完成，部分逻辑待深化                                                                                                                                                                                                    |
| **存档 / 读档 / 重置**                         | ✅ MVP + version 2 migration implemented | [`src/state/saveLoad.ts`](../src/state/saveLoad.ts)                                                                                                                                                                        |
| **贸易 / 市场**                                | ✅ MVP + 价格动态已实现                  | 相场指数（每市场×商品）、交易冲击、惰性回归、Save v3；同港套利已由结构性价差消除。见 [D10](DECISIONS.md) 与 [设计](superpowers/specs/2026-08-13-market-price-dynamics-design.md)。税 / 商业投资仍待做                     |
| 名声（冒险/海盗/贸易）                         | 🔶 冒险名声已激活并显示                  | 发现地标授予冒险名声，三条均在 HUD 显示（[D12](DECISIONS.md) / [D13](DECISIONS.md)）；海盗 / 贸易名声仍无来源                                                                                                              |
| **探索发现**                                   | ✅ 已实现（含界面）                      | 14 条史实地标，坐标由真实经纬度经投影推导；发现横幅、发现列表、Save v4 记录。见 [D12](DECISIONS.md)、[D13](DECISIONS.md) 与设计 [MVP](superpowers/specs/2026-08-14-discovery-mvp-design.md) / [UI](superpowers/specs/2026-08-14-discovery-ui-design.md) |
| 结构化剧情架构 / João 里斯本迁移               | ✅ 已实现并验证                          | 类型化 registry、validator、resolver、effects 与 runtime 已运行完整的既有 João 里斯本开场；[验证记录](superpowers/verification/2026-07-10-structured-story-architecture-verification.md)。Domingo 与完整 João 路线仍待实现 |
| 运行时基线 / CI                                | ✅ 已实现                                | [资产预检](../scripts/verify-assets.js) + [项目 CI](../.github/workflows/baseline.yml) + [验证记录](superpowers/verification/2026-07-09-runtime-baseline-verification.md)                                                  |
| 多主角 / 关系网 / 5 层暗线                     | ⏳ 设计中                                | 见 `3-narrative/`                                                                                                                                                                                                          |
| 港口扩张（→270-320 节点）/ 地图现代化          | ⏳ 设计中                                | 见 `2-world-design/`                                                                                                                                                                                                       |

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
