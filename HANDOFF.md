# 开发交接：M2 冲突与成长

更新：2026-09-06。M2 功能与专项验收已完成；全量浏览器回归及最终全分支审查状态以 [M2 验证记录](docs/superpowers/verification/2026-09-06-m2-conflict-and-growth.md)为准。先读本文件，再读 [M2 设计](docs/superpowers/specs/2026-09-06-m2-conflict-and-growth-design.md)和[实现计划](docs/superpowers/plans/2026-09-06-m2-conflict-and-growth.md)。

## 工作位置与进度

- 主仓库 `/Users/qsircaine/uncharted-waters-2` 的 M1 已合并推送，M2 基线为 `3cf4a8e`。M1 原有交付证据见 [M1 验收记录](docs/superpowers/verification/2026-09-06-m1-first-voyage.md)。
- M2 工作树：`/Users/qsircaine/uncharted-waters-2/.worktrees/m2-conflict-and-growth`；分支：`codex/m2-conflict-and-growth`。本轮计划保留工作分支，不合并、不推送。
- Task 1–5 已实现并通过各自独立审查：纯战斗和存档 v6、战斗结算及整备动作、战斗/装备/修理界面、声明式开战与伙伴离队，以及完整双语章节和日志。Task 5 功能提交为 `676cdb7`，本阶段文档提交为 `20d76c0`。
- Task 6 增加浏览器验收辅助、10 项战斗/整备/章节入口检查及 2 项完整章节分支检查，并修正两处旧 Cypress 用例对当前存档版本的硬编码。未发现需要修改产品代码的验收缺陷。
- 本机执行记录在 `.superpowers/sdd/2026-09-06-m2-conflict-and-growth/ledger.md`，包含任务报告、独立审查、修补裁定和接续位置。恢复会话时先核对它与 `git log`，不要重做已完成任务。

## 已实现的机制

决斗可选择突刺、挥砍、重击及对应防御，显示敌人意图，十回合未决为平局。海战通过距离、炮击、接舷、船长决斗、修补和撤退操作，实际消耗旗舰耐久、船员、炮弹和木材。装备和战斗经验参与数值计算；系统菜单仍可存读档和切换中英，弹窗、战斗和海上对白会暂停底层输入与模拟。

船厂每点耐久收取 10 金币，可以按现有资金部分修理。物品窗可以装备已持有武器或防具；每 100 战斗经验增加一级。当前酒馆招募只补足船型最低船员，初始 Hermes II 不能通过现有招募操作增加到 21 人；炮击和撤退可在初始船上完成，船长挑战需要足够船员的旗舰。

海战败退会回里斯本，旗舰恢复至少一半最大耐久和最低船员；成功撤退与战败是不同结果。伙伴离队时优先由空闲伙伴接替船长，无人可接任时才添加原创“代理船长”，保留全部船只。无原版头像的新人物使用姓名占位图，不伪造资源 ID。

## 本章目标与改编边界

已实现的流程是：M1 完成且多明戈在队 → 白天 08:00–16:00 休达酒馆 → 旅馆 → 船厂卡恩决斗 → 码头揭晓身份 → 里斯本宅邸再战 → 王宫洗清父亲嫌疑 → 宅邸告别 → 塞维利亚酒馆接受追击 → 连续海上一日、靠港访问码头、再次出海一日 → 卡特琳娜海战 → 非里斯本酒馆找阿兰 → 里斯本调查 → 巴士拉酒馆找到莎夏 → 伊斯坦布尔旅馆回报。

第一场卡恩决斗任何结果都能继续且无经验奖励；宅邸平局重赛，胜败均能继续，胜利给约翰 100 经验。王宫和告别按事件一次性发放 1000 冒险名声、1000 海盗名声及蛇形剑。卡特琳娜胜利或主动撤退才能继续；战败后在里斯本码头直接重试，不依赖再次购买补给出航。

确定性伤害、四档距离、宽容回港恢复、代理船长及以章节里程碑替代原作 2000/8000 名声门槛，均为本项目调整。尚未实现完整六角海战、多舰指令、昼夜战斗上限及缴获。本章止于阿兰寻妹报告，不声称路琪亚获救或与卡特琳娜和解；马萨瓦、圣者之杖、日本、南美及最终战属于 M3。依据与取舍见 D17 和设计文档。

## 存档与代码入口

当前存档 v6，键为 `savedState`，语言偏好独立使用 `uw2.locale`。M1 的 v5 存档升级后保留金币、舰船、物品、伙伴及旧键和语义进度，新增默认装备、经验、战斗结果和进行中快照。未知历史事件及有效结果 ID 保留；无效装备槽和不支持的进行中战斗会被清理。一次性奖励与结果确认必须和保存保持一致。

| 工作 | 入口 |
| --- | --- |
| 战斗规则与敌人定义 | `src/combat/` |
| 战斗动作、经验、恢复 | `src/state/actionsCombat.ts` |
| 装备与修理 | `src/state/actionsEquipment.ts`、`src/state/actionsRepair.ts` |
| 战斗界面 | `src/interface/combat/` |
| 剧情条件、效果和预检查 | `src/story/core/`、`src/story/storyRuntimeActions.ts` |
| 离队与头像占位 | `src/story/companionDeparture.ts`、`src/interface/common/CharacterPortrait.tsx` |
| M2 章节及日志 | `src/story/content/arcs/joao/conflict-and-growth/`、`src/story/conflictAndGrowthJournal.ts` |
| 存档兼容 | `src/state/saveMigrations.ts`、`src/state/saveLoad.ts` |
| 浏览器验收 | `tests/e2e/conflictAndGrowth.cy.ts`、`tests/e2e/conflictAndGrowthChapter.cy.ts`、`tests/conflictAndGrowthUtils.ts` |

扩充时遵循[剧情编写指南](docs/story/authoring-guide.md)和[存档约定](docs/4-engineering/save-load-persistence.md)。先对整组效果做预检查，再按序执行；开战必须是最后一个非 save 效果，最后只保存一次。新内容保持声明式，不插入状态回调或自动胜利对白。

## 验证现状

完整记录见 [M2 验证文档](docs/superpowers/verification/2026-09-06-m2-conflict-and-growth.md)。最终 `npm run verify` 通过 86 组、655 项 Jest，剧情校验、TypeScript、ESLint、资源校验和生产构建均成功。Edge 专项中 `conflictAndGrowth.cy.ts` 为 10/10、`conflictAndGrowthChapter.cy.ts` 为 2/2，均无失败、待定或跳过。

首次全量 Edge 回归共 18 个规格、80 项，76 通过、4 失败、0 待定/跳过；3 项来自旧船厂用例仍期待无需修理及其菜单级联，1 项来自中文长旅程靠港后 Cypress 在长页面自动滚动 System 触发器的动作性竞态。船厂修补专项已 6/6 通过，实际确认 5 点/50 金币修理、30 耐久/750 金币存档及 1350 金币出售；共享 System 助手回到页面顶部并点击重新取得的可见触发器，不使用强制点击。包含长页面起点、25 次重复弹层和真实往返航行的 `firstVoyage.cy.ts` 已 5/5 通过。修补后的 18 规格全量重跑由控制器在本提交后执行，当前不提前声明全过。

8082 的 PID 70724 当前服务最终功能源的生产构建；8080/8081 保留既有 M0/M1 预览。章节用例从合法合成 M1 v5 完成档进入，所有战斗结果、经验和奖励均由可见操作产生。塞维尔至里斯本一段使用实际键盘航行、时间推进与靠港重置；巴士拉和伊斯坦布尔等远距离阶段明确使用地点、建筑及白天进入时间夹具，因此不能称为完整环球实航。

1700×1000 Edge 视口的中文战斗、整备、代理船长、四船、追击、阿兰/莎夏和最终日志，以及英文战斗/伙伴成长截图均已目视检查。游戏整体固定为 1640×800，主要游玩区为 1280×800；所需控制可见，无产品布局缺陷。Cypress 截图因运行器条带实际为 1700×969。

## 本机预览与命令

使用 Node.js 22 和已安装的锁定依赖：

```sh
export PATH="/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH"
cd /Users/qsircaine/uncharted-waters-2/.worktrees/m2-conflict-and-growth
npm run verify
```

8080 保留 M0，8081 保留 M1，8082 用于 M2。现有 8082 服务已经运行，不要重复占用端口；在没有浏览器测试运行时才更新生产构建。需要重新启动服务时执行：

```sh
npx http-server build -a127.0.0.1 -p8082 --silent -c-1
```

完整浏览器回归：

```sh
npx cypress run --browser edge --config baseUrl=http://127.0.0.1:8082,trashAssetsBeforeRuns=false
```

仅 M2：追加 `--spec 'tests/e2e/conflictAndGrowth.cy.ts,tests/e2e/conflictAndGrowthChapter.cy.ts'`。浏览器按域名和端口隔离存档，旧预览端口的存档不会自动出现在 8082；同一来源载入旧存档才会经过 v6 迁移。固定画面为 1640×800，验收视口 1700×1000，小窗口需要滚动。

保留 M0、M1、M2 工作树及本机证据目录里的唯一日志和截图，附件没有随 Git 提交分发。大部分任务暂存资料不跟踪，但 Task 3–5 报告已经提交。已知 Webpack 体积、Browserslist 与 Cypress 10 ARM 辅助程序提示须在最终记录中如实说明。
