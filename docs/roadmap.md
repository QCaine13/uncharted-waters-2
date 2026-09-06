# 统一路线图 (Roadmap)

**Status**: Living · **Date**: 2026-09-06

> **当前执行方向（D15）**：用户已授权按“全中文可玩基础 → 出海新章节 → 冲突与成长 → 约翰全线通关 → 其他主角 → 扩展内容”连续推进。完整目标与验收见 [交付方案](superpowers/specs/2026-09-06-chinese-playable-release-design.md)，首批任务见 [M0 实施计划](superpowers/plans/2026-09-06-chinese-foundation.md)。下方旧 Phase 保留为历史规划；与当前方案冲突时，以 D15 和当前计划为准。

首批 M0 正在实施：资源恢复和海上读档修复已完成并通过独立审查，50 套 / 443 项单元测试及 14 组 / 57 项英文浏览器回归通过。默认简体中文、英文切换、现有界面及开场汉化正在实现，完成实际中文游玩验收后再标记 M0 完成。

## 历史规划（保留背景）

> **进度快照（2026-07-11）**：Save/Load v2 migration、Market MVP、结构化剧情架构、
> 既有 João 里斯本开场的行为等价迁移与项目自有 runtime baseline 均已实现；详见
> [验证记录](superpowers/verification/2026-07-10-structured-story-architecture-verification.md)。
> 这没有增加 Lisbon 之后的新剧情；Domingo 与完整 João 路线仍待实现。完整状态见
> [`README.md`](README.md) 状态面板。下方 Phase 文本保留原始规划，已完成项以 ✅ 标注。

**有分寸的扩展原则（spare-time / measured expansion）**  
这个项目是爱好者复刻 + 代码展示性质的 side project。我们采用“小而完整、可在 1-3 小时内完成一个垂直 slice、始终保持可测试和可回滚”的方式扩展。  
优先级：质量 > 进度 > 范围。每次改动都应该让游戏“更像原作一点点”，而不是堆功能。  
决策、数据来源、取舍理由都记录在这里、[`DECISIONS.md`](DECISIONS.md) 和 `5-data-governance/` 里。

现有 Phase 保持不变，但我们会把每个 Phase 拆成更小的、可单独验收的 spare-time slices。

## Phase 1: Reference Foundation

- Keep this folder as the source index and decision log.
- Add a bilingual glossary for UI and data terms.
- Compare existing `src/data/*` values against collected reference sources.
- Avoid large rewrites until we know which data is missing versus merely
  untranslated.

## Phase 2: Save/Load Boundary ✅ (MVP + version 2 migration shipped)

- Define which parts of `State` are serializable.
- Exclude live objects such as `world` and `port`; recreate them after load.
- Add explicit save and reset commands.
- Add tests for serialization and restoration.

Why this comes early: trade, investment, story, and discoveries all need durable
progress.

## Phase 3: Localization Layer

- Move hard-coded menu labels and common messages into translation tables.
- Start with Chinese and English.
- Keep original English keys stable for tests.
- Translate data names separately from UI text.

Why this comes early: the current project has English text embedded directly in
React components and quest data.

## Phase 4: Market MVP ✅ (shipped) + price dynamics ✅ (tax/investment still TODO)

- Add `tradeGoodData`.
- Add market building UI.
- Implement buy/sell from ship cargo.
- Use base prices first, then add market fluctuation.
- Add commerce investment unlocks after the basic loop works.

MVP acceptance:

- Player can buy goods in Lisbon.
- Player can sail to Seville.
- Player can sell goods.
- Gold and cargo update correctly.
- Jest covers price/cargo calculations.
- Cypress covers a basic buy/sail/sell loop once LFS assets are available.

## Phase 5: Shipyard Expansion

- Implement new ship purchase.
- Implement repair based on durability.
- Implement remodel after core ship data is verified.
- Add industry investment unlocks.

## Phase 6: Exploration MVP ✅ (sighting + fame shipped — reporting still TODO)

- ✅ Add discovery data — 14 historical landmarks, positions projected from
  real latitude/longitude (see [D12](DECISIONS.md)).
- ✅ Add map-coordinate proximity checks, with the radius derived from the
  maximum per-tick displacement so a fleet cannot tunnel past a landmark.
- ✅ Fame rewards on sighting; adventure fame is now a live field.
- ⏳ Discovery **reporting** to a patron for a bonus is not built. Gold is
  granted on sighting as a stand-in and moves to the report step when it
  lands.
- The set spans the whole world rather than starting with Europe/Africa,
  since fame scales with voyage distance and that is what makes the far
  landmarks worth reaching.

## Phase 7: Story Expansion (architecture + Lisbon migration ✅; new story pending)

- Pick one protagonist path first.
- Joao is the easiest fit because the existing quest data already leans that
  way.
- Model event triggers as data, not scattered component logic.

The typed, validated runtime and the behavior-preserving migration of the
existing João Lisbon opening are implemented. This completes the architecture
slice only: the Domingo beat and the rest of the full João route remain
pending, along with every other post-Lisbon chapter.

## Spare-time Slice Suggestions (推荐小切片)

这些是按“有分寸”原则拆出来的小垂直切片，适合抽空完成。每个都应该有：

- 数据/模型变更（如有）
- 最小可玩/可见效果
- Jest（必要时 Cypress）覆盖
- 在本文件或 data-governance 里记录决策

**强烈推荐的第一个小 slice（基础）** ✅ 已完成（commit `9593a11`）：

- **Save/Load 最小可用版**（Phase 2 的子集）
  - 定义可序列化的 State 子集（排除 world/port 等 live 对象）。
  - 重要操作后（出港、进出建筑、买/卖后）或手动触发保存。
  - 支持 reset / clear save。
  - 简单测试。
  - 理由：所有后续持久系统（贸易、故事进度、投资）都依赖这一基础；原先只有加载没有保存的缺口已由本 slice 补齐。

**高价值、玩家立刻能感受到的 slice** ✅ 已完成（实际文件为 `goodsData.ts` / `marketGoodsData.ts` / `Market.tsx`）：

- **Market 极小 MVP**（Phase 4 的严格子集，只做 Lisbon–Seville 岩盐/瓷器回路）
  - 新建 `src/data/tradeGoodData.ts`（用 gcgx + koei wiki 数据，对齐 data-governance 的 trade-good schema，先做 5-8 个商品，双语 names）。
  - 扩展 Cargo 支持一般 goods（fleets.ts 里已有注释）。
  - Market 建筑基础 UI（复用 ItemShop/Pub 模式）。
  - 买/卖逻辑 + 容量检查 + 金钱更新。
  - Jest 覆盖计算。
  - 验收：里斯本买岩盐 → 塞维利亚卖掉 → 赚钱（quest 对话里已经有这个例子，可以联动）。
  - 后续再加价格波动、投资、税、更多商品。

其他可考虑的小 slice：

- 把 PortInfo 里的硬编码 100% Price Index + 重复 Investment 标签换成真实占位（为市场做准备）。
- 给现有数据（ports, ships, items）加中文名（不改英文 key，符合 Phase 3）。
- ✅ 海上每日补给消耗：舰队共享、每 10 人或不足 10 人每日消耗 1 水 + 1 食物，
  余量与警告实时显示。
- ✅ 断粮惩罚（slice A）：逐日结算，缺水或缺粮当日按 10% 减员（两者皆缺翻倍），
  船员归零则拖回最近港口。见 [D11](DECISIONS.md)。

当前进行中探索/准备（AI 已完成只读部分）：

- 已从 gcgx.games/dkj2/trade.html 和 Koei Trading Data 拉取真实商品列表、区域售价、商业价值要求。
- State mutation surface 已完整映射。
- ItemShop 的 secret/black-market 时间窗口模式可直接复用于 Market。
- Cargo 模型已有“will be both Provisions and Goods”的前向设计。

当前不再按零散的临时 slice 选题，执行上方 M0–M5 交付顺序。
