# 3 · 新剧本叙事层 (Narrative Expansion)

**定位**：本层是叠加在 [`1-baseline/`](../1-baseline/README.md)（原作复刻基线）之上的**新剧本**——
扩展叙事深度（5 层暗线、信标会、史实深化），但**不重写**基线史实。
（叠加关系见 [DECISIONS.md](../DECISIONS.md) D1。）

> 语言：本层为创作语言**中文**。跨层术语统一在 [glossary.md](../glossary.md)。

## 文件清单

| 文件 | 是什么 | 状态 |
| --- | --- | --- |
| [methodology.md](methodology.md) | 内容填充方法论：准入三问 + 八步流程 + 八条质量门槛 + 三层过滤 | V0 |
| [world-overview.md](world-overview.md) | 新剧本世界观总览：5 层暗线、6 主角关系网、种族分层、信标会、叙事纪律 P1-P5 | V0 |
| [world-archive.md](world-archive.md) | 全球断代史实档案：6 大贸易圈 + 4 个走完完整 8 步流程的深度实体 | V1（部分） |
| [samples/staff-of-the-saint.md](samples/staff-of-the-saint.md) | 「圣者之杖」样例：用一件宝物完整跑通 8 步流程；其 §6 是共享剧情字段 `StoryHooks` 的真相源 | 样例 |

## 阅读顺序

1. 先读 **world-overview.md**（懂世界观与叙事纪律）
2. 再读 **methodology.md**（懂内容怎么入库）
3. 用 **samples/staff-of-the-saint.md** 看方法论怎么落到一件具体内容
4. **world-archive.md** 是已按流程产出的档案库，持续扩充

## 与其他层的关系

- 共享剧情字段 schema（`triggers / rewards / crossLinks`）的真相源在 `samples/staff-of-the-saint.md` §6，
  由 [`4-engineering/quest-event-system.md`](../4-engineering/quest-event-system.md) 的引擎消费——二者**不得分叉**。
- 暗线 / 关系网 / 名声落地依赖 4-engineering 的剧情引擎与 5-data-governance 的数据建模。
- 所有未决创作问题集中在 [DECISIONS.md](../DECISIONS.md) 待决区（Q1-Q12），不要散落回本层文档结尾。
