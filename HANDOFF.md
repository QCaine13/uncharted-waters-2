# 开发交接：M1 完成，下一阶段 M2

更新：2026-09-06。下一次继续开发先读本文件，再读[路线图](docs/roadmap.md)与[中文交付方案](docs/superpowers/specs/2026-09-06-chinese-playable-release-design.md)。

## 当前状态与本次收口

- M0 中文基础、M1 首次航海已完成并通过验收；约翰完整主线、战斗和结局尚未完成。
- 用户本次要求“写交接文档，合并提交推送，回头接着干”。本次将 M1 与交接文档合入 `master`，推送到 `origin/master`；M2 留待继续开发时启动。此前 M1 计划中的“不合并、不推送”约束仅限当时验收阶段，已被本次明确授权更新。
- 主仓库：`/Users/qsircaine/uncharted-waters-2`；自己的远端为 `origin`（`QCaine13/uncharted-waters-2`）。`upstream` 是原作者仓库。
- M1 分支：`codex/m1-first-voyage`；实现最终修补 `c07b34d`，完整验收记录 `7af63e5`，基线 M0 为 `87e3319`。合并提交可用 `git log --first-parent --oneline -5` 定位。
- M1 工作树暂留在 `.worktrees/m1-first-voyage`，用于现有预览和本机验收附件。后续以更新后的 `master` 为基线建立新的 `codex/` 工作分支，不要在旧 M1 工作树继续堆 M2。

## 已经可以玩的内容

中文新游戏可走完里斯本开场、招募水手和补给，到工会接受首航委托，连续出海三天后遇见多明戈，探索直布罗陀海峡，返港上报并领取本章奖励。拒绝委托可以重新接取，拒绝多明戈可以在里斯本工会重新邀请。

发现海峡时增加 30 冒险名声，上报支付 300 金币，委托完成另付 500 金币。500 金币委托是项目原创设计。实测完整流程：开场 2000 → 招募 10 人花 400 → 30 份食物花 600 → 出航 1000 → 上报与委托奖励后 1800；读取后金币、伙伴和完成事件均不重复。

日志提供步骤、航向和坐标；海上剧情及侧栏弹窗暂停航行、时钟和补给消耗。四名伙伴完整显示，舰队超过三艘时使用四列可滚动布局。默认简体中文，系统菜单可切换英文。

## 存档和扩展边界

- 当前存档 v5，浏览器键为 `savedState`；语言偏好独立使用 `uw2.locale`。
- `quests` 保留旧任务键，`storyEvents` 保存语义事件，`reportedDiscoveries` 保存已上报发现。未知进度 ID 保留。
- v4 的发现物已经领取过金币，升级后视为已上报，不能重新支付。新增事件不能再塞入里斯本旧键映射。
- 关键事件为 `joao.first-voyage.commission-accepted`、`domingo-met`、`domingo-recruited`、`chapter-complete`（后面三个同样带 `joao.first-voyage.` 前缀）。地点 ID：里斯本 `1`、工会 `7`、海峡 `strait-of-gibraltar`；多明戈 sailor ID 为 `34`。
- 出海条件读取 `dayAtSea`，靠港会重置；开局经过天数不能替代连续海上天数。
- 对话游标不写入存档，未完成对话读取后重新开始；奖励、招募和完成标记在末尾效果组提交。海上会话使用快照身份拒绝过期控件，成功读取会清理旧会话。
- 保留声明式章节、条件、效果与显式注册，增加条件/效果时同步修改类型、校验器、执行器和行为测试。中英词典合并检查冲突，所有分支都要覆盖。

## 代码入口

| 工作 | 入口 |
| --- | --- |
| M1 剧情与角色 | `src/story/content/arcs/joao/first-voyage/`、`src/story/content/characters/domingo.ts` |
| 章节注册与内容校验 | `src/story/content/index.ts`、`src/story/contentManifest.ts`、`src/story/core/` |
| 海上会话与暂停 | `src/story/seaStory.ts`、`src/story/advanceSession.ts`、`src/game/world/runWorldFrame.ts` |
| 存档迁移及读档通知 | `src/state/saveMigrations.ts`、`src/state/saveLoad.ts`、`src/state/saveEvents.ts` |
| 发现上报与工会 | `src/state/actionsDiscovery.ts`、`src/interface/port/Guild.tsx` |
| 日志与中文内容 | `src/story/firstVoyageJournal.ts`、`src/interface/QuestJournal.tsx`、`src/localization/dialogue/joaoFirstVoyage.ts` |
| 输入、弹窗、舰队 | `src/input.ts`、`src/interface/common/Popover.tsx`、`src/interface/Fleet.tsx` |
| 实际浏览器旅程 | `tests/e2e/storyArchitecture.cy.ts`、`tests/e2e/firstVoyage.cy.ts`、`tests/firstVoyageUtils.ts` |

编写新章前阅读[剧情编写指南](docs/story/authoring-guide.md)和[中文资料基线](docs/1-baseline/chinese-reference-baseline.md)。

## 验证证据与已解决问题

详细版本和命令见 [M1 验收记录](docs/superpowers/verification/2026-09-06-m1-first-voyage.md)。最终 `npm run verify` 通过：38 项资源预检、剧情校验、69 组 530 项 Jest、TypeScript、ESLint、生产构建。交接合并前再次运行全部 Jest，同为 530 项通过，日志 `/tmp/uw2-m1-premerge-jest.log`。

浏览器证据需按版本区分：`325c882` 的全量运行有 16 份规格、67 项，66 项通过，中文长旅程发现退场遮罩仍拦截鼠标；`c07b34d` 修补后，8 项相关回归通过，包括连续 25 次弹窗开关及约 10 分钟的中文空存档完整首航。5 项刚通过的英文/旧档用例未在该专项重复运行。不能把这份专项报告描述成最终提交的全量浏览器重跑。

各任务及整分支独立审查均完成。下列问题已修补并复审：

- 弹窗键盘输入穿透到底层建筑，Escape/右键连带退出建筑。
- 按住方向键跨越弹窗关闭，自动重复输入造成移动锁住。
- 多明戈允许购买第 4 艘船，旧 Fleet 只有三个坐标而崩溃。
- 退场动画遗留透明遮罩拦截点击；现由 `active` 立即控制指针输入，不等待动画节点卸载。

本机附件在 M1 工作树的 `.superpowers/sdd/2026-09-06-m1-first-voyage/final-acceptance/`，包含日志及中文开场、补给、海上、领奖、四名伙伴和四艘船截图。附件位于忽略目录，不随推送分发；不要在备份前删除工作树。独立审查报告与执行记录在其上级目录。

## 本机启动与验收

使用 Node.js 22、锁定依赖和 Git LFS 资源。当前机器的可用命令环境：

```sh
export PATH="/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH"
cd /Users/qsircaine/uncharted-waters-2
node --version
```

新环境先执行 `git lfs pull origin master` 与 `npm ci`，然后运行：

```sh
npm run verify
npx http-server build -a127.0.0.1 -p8081 --silent -c-1
```

交接时 8081 已有 M1 生产服务；先访问现有服务，端口被占用时不要重复启动。8080 仍为旧 M0 预览。浏览器按域名和端口隔离 `localStorage`，8080 的存档不会自动出现在 8081。不要把切换预览端口后的空档误判为迁移丢档。

在另一终端运行完整浏览器测试：

```sh
npx cypress run --browser edge --config baseUrl=http://127.0.0.1:8081,trashAssetsBeforeRuns=false
```

只查中文完整首航：追加 `--spec tests/e2e/storyArchitecture.cy.ts --env m1Only=true`。快速查 M1 分支、读档、领奖、四艘船和海上往返：追加 `--spec tests/e2e/firstVoyage.cy.ts`。浏览器测试期间使用稳定生产构建，不要并行重建或让 HMR 重载页面。

固定游戏画面为 1640×800，验收视口 1700×1000，小窗口需要滚动。已有 Webpack 体积提示及 Cypress 10 在本机 ARM macOS 上的旧辅助程序架构提示，详见验收记录。新 UI 内容注意侧栏高度、列表滚动和弹窗边界。

## 下次从 M2 接续

M2 的既定范围是冲突与成长：可操作的海战/决斗、失败恢复、修理/装备/伙伴成长、多明戈身份事件，以及卡特琳娜和阿兰的交汇。尚未编写 M2 详细实现计划，也未实现这些新内容。

建议接续顺序：

1. 更新 `master`，阅读本文件、D15/D16、中文资料基线和交付方案，确认 M1 完成状态能作为 M2 入口。
2. 核对多明戈身份事件的名声、地点、时段、前置及两次决斗的胜败出口；区分原版资料与重制版设计调整。
3. 写 M2 详细计划，先定义一个可操作且可恢复的决斗/冲突闭环，再接身份剧情和成长。不要用不可操作的胜利对白代替战斗系统。
4. 新增名声门槛必须核算现有可获得奖励：当前 14 处发现物合计 1380 冒险名声，不能直接套用原版 2000 及更高门槛造成主线不可达。
5. 从新工作分支实现，继续按明确边界使用 Sol 子 agent，主 agent 负责整合、实际浏览器验收与审查。保留 M1 的拒绝重试、奖励一次性、旧档兼容及输入隔离回归。

本次交接停在 M1 合并推送；下次用户继续时，从上述 M2 计划与资料核对开始。
