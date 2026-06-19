# 4 · 实现提案 (Engineering Proposals)

**定位**：把 baseline 与 narrative 两层落地为代码的工程设计。每篇提案都对照**真实代码**撰写，
带 `Status` / `Date` 头，决策已锁定的条目同步登记在 [DECISIONS.md](../DECISIONS.md)。

> 语言：英文（贴近代码）。

## 文件清单

| 文件 | 解决什么 | 状态 |
| --- | --- | --- |
| [quest-event-system.md](quest-event-system.md) | 把硬编码的 Joao 剧情迁移成**数据驱动的剧情引擎**；一个引擎服务剧情 / 传说 / 宝物三类内容 | 决策已锁定，slice 1 = 纯迁移 |
| [save-load-persistence.md](save-load-persistence.md) | 存档 / 读档；MVP 已 ship，剩**版本迁移**与单一序列化真相源 | MVP 已实现，迁移待做 |
| [data-architecture.md](data-architecture.md) | 撰写数据（港口 / 商品 / 剧情）集中 vs 分文件管理策略 | 约定随 Quest slice 1 落地 |

## 阅读顺序

三篇互为伴随文档，建议一起读：先 **quest-event-system**（剧情引擎是后续叙事的承载），
再 **save-load-persistence**（持久化是一切进度的前提），最后 **data-architecture**（数据怎么放）。

## 关键锁定决策（详见 DECISIONS.md）

- **D3** 声明式 `Reward[]`，不用 `() => void` 回调。
- **D4** 剧情引擎 slice 1 = Joao 里斯本流程逐字节等价的纯迁移。
- **D5** 条件 / 奖励模型收敛到 `StoryHooks`（真相源在 `3-narrative/samples/staff-of-the-saint.md` §6）。
- **D6** 先落地存档迁移脚手架，再 bump 版本。

## 治理对接

ID 规范（`{protagonist}-{seq}-{slug}`）、序列化字段清单、schema 演化规则记录在
[`5-data-governance/`](../5-data-governance/README.md)。提案中提到的
`story-events.md` / `save-format.md` / `data-schema-evolution.md` 为**待建**治理文档。
