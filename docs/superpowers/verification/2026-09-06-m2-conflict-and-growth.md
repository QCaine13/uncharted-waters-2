# M2 冲突与成长验证记录

日期：2026-09-06。M2 实现、验收和最终独立审查已完成；最终功能修补为 `2dc2987`。全量浏览器回归与末次范围回归分别记录，不混淆其版本和范围。

## 工作边界

- 主仓库：`/Users/qsircaine/uncharted-waters-2`。
- M2 工作树：`/Users/qsircaine/uncharted-waters-2/.worktrees/m2-conflict-and-growth`。
- 分支：`codex/m2-conflict-and-growth`；基线：`3cf4a8edc0cfeaa15b07889e732ddd27860eb188`。
- 本阶段不合并、不推送。保留 M0 的 8080 和 M1 的 8081 服务，M2 使用 8082。
- Node.js 22.23.2，锁定依赖；React 18、TypeScript 4.8、Jest 29、Cypress 10.10。

## 已获得的证据

| 范围 | 版本/证据 | 结果 |
| --- | --- | --- |
| M2 开工基线 | `3cf4a8e`，`/tmp/uw2-m2-baseline.log` | 69 组、530 项 Jest 通过 |
| 纯战斗与 v6 初次实现 | `db9eb95`，执行目录 task-1-report.md | 70 组、551 项 Jest；TypeScript 通过 |
| 纯战斗审查修补 | `55e356c`，task-1-fix-1-review.md | 3 组、38 项相关测试；TypeScript、ESLint 通过；复审通过 |
| 战斗状态与准备接口 | `d457629`，task-2-report.md | 74 组、595 项 Jest；TypeScript、ESLint 通过。包含当时未提交的部分界面呈现测试，不能将这个数量当作整个 M2 的最终验收 |
| 回港真实地图测试修补 | `aebea14`，task-2-fix-1-review.md | 2 组、28 项相关测试；TypeScript、ESLint 通过；复审通过 |
| 战斗与整备界面 | `fcfddd2`，task-3-report.md | 79 组、610 项 Jest；TypeScript、ESLint、构建通过 |
| 完整修理结果修补 | `da78aba`，task-3-fix-1-review.md | 完整修理显示实际点数、费用，单次确认返回菜单；相关测试及复审通过 |
| 声明式战斗与伙伴离队 | `4d4e32e`，task-4-report.md | 81 组、626 项 Jest；剧情校验、TypeScript、ESLint 通过；此版本未重新构建 |
| 按效果顺序检查开战条件 | `84476bd`，task-4-report.md 修补段 | 4 组、58 项相关测试；剧情校验、TypeScript、ESLint 通过；复审通过 |
| 战斗、装备、修理浏览器专项 | 稳定 `da78aba` 构建；`/tmp/uw2-m2-naval-tactics-browser.log` | Edge 152，9/9 项通过，0 失败/待定/跳过，13 秒；不包含章节触发或实际航行 |
| 完整 M2 章节和双语日志 | `676cdb7`；文档 `20d76c0`；task-5-report.md | 86 组、654 项 Jest；10/10 章节入口/战斗/整备浏览器检查；任务审查通过 |
| 合成 M1 v5 验收输入 | 控制器调用实际 migrate()，本机只读数据检查 | v6 默认战斗字段正确，金币、物品、伙伴、舰队、名声、旧键与语义进度保留 |
| Task 6 最终静态/单元/构建验证 | 最终功能源；`final-acceptance/scoped-logs/uw2-m2-npm-verify.log` | `npm run verify` 退出 0：38 个资源；剧情校验 1 通过/3 跳过；86 组、655 项 Jest；TypeScript、ESLint、生产构建通过 |
| Task 6 战斗、整备、恢复专项 | `final-acceptance/scoped-logs/uw2-m2-focused-green-attempt.log` | `conflictAndGrowth.cy.ts` 10/10 通过，0 失败/待定/跳过，18 秒；包含零金币、无补给战败、阻断阿兰、码头 No/Yes、立即重试和实点撤退 |
| Task 6 完整章节专项 | `final-acceptance/scoped-logs/uw2-m2-full-chapter-green.log` | `conflictAndGrowthChapter.cy.ts` 2/2 通过，0 失败/待定/跳过，55 秒；包含真实区域航行/靠港及远程地点夹具 |
| 首次全量浏览器回归 | `final-acceptance/cypress-full-initial.log` | Edge 152，18 个规格、80 项：76 通过、4 失败、0 待定/跳过，13 分 44 秒；3 项为旧船厂修理预期及其级联，1 项为长页面滚动时 System 点击的测试动作性竞态 |
| 船厂回归修补专项 | `final-acceptance/scoped-logs/uw2-m2-shipyard-regression-green.log` | `shipyard.cy.ts` 6/6 通过，0 失败/待定/跳过，4 秒；实际修理 5 点、扣除 50 金币、确认耐久 30/金币 750，回执确认后以 1350 金币完成出售 |
| System/实航助手稳定性专项 | `final-acceptance/scoped-logs/uw2-m2-system-scroll-navigation-green.log` | `firstVoyage.cy.ts` 5/5 通过，0 失败/待定/跳过，35 秒；覆盖长页面滚动起点、25 次重复弹层、中文海上事件/读档及里斯本—直布罗陀—里斯本实际航线和靠港保存 |
| 修补后全量浏览器回归 | `08e190d`；`final-acceptance/cypress-full.log` | Edge 152，18 个规格、80 项全部通过，0 失败/待定/跳过，14 分 59 秒；`storyArchitecture.cy.ts` 6/6，含 580157 ms 中文完整旅程 |
| Task 6 审查修补专项 | `final-acceptance/scoped-logs/uw2-m2-helper-refactor-green.log` | 抽取统一剧情推进原语后，两项 M2 规格共 12/12 通过，0 失败/待定/跳过，51 秒；这是全量通过后的纯助手重构，未改产品源码或构建 |
| 最终代码审查修补 | `2dc2987`；`final-fix-verify.log`、`final-fix-green-final.log` | 全量 `npm run verify` 退出 0：86 组、662 项 Jest、38 个资源、剧情/类型/代码检查和构建通过；定向 Jest 3 组、50 项通过 |
| 最终修补后的浏览器范围回归 | `2dc2987`；`final-acceptance/final-fix-browser.log` | Edge 152，4 个规格、23 项声明：21 通过、0 失败、2 pending、0 skipped，89 秒；两条首次开局长旅程按预定范围未重复 |
| 最终定向复审 | `5b767cb..2dc2987`；`final-fix-review.md` | 1 Important 与 1 Minor 已解决，修补范围内未结问题 0、新问题 0；其余 3 项 Minor 明确保留 |

独立任务审查、详细命令和 RED/GREEN 证据保存在工作树的 `.superpowers/sdd/2026-09-06-m2-conflict-and-growth/`。大部分 Task 6 暂存资料不跟踪并仅在本机保留；Task 3–5 报告已经提交。

## 真实地形边界

战败回港代码使用现有 `positionAdjacentToPort('1')`。里斯本坐标为 `(840,358)`；北侧候选 `(840,356)` 在正式地图上碰撞。实际选择西侧 `(838,358)`，2×2 船只占位的 tile 值为 `[0,5,0,5]`，全部低于碰撞阈值 50。修补后的测试直接读取发布资源 `worldTilemap.wasm`，不再用全零地图替代这个边界。

## 浏览器验收结果及声明边界

Task 6 的 `npm run verify` 完成后冻结生产构建，由 PID 70724 在 8082 提供服务；该轮浏览器运行期间没有重建 `build/`。最终修补另行重建并再次冻结，详情见末节。Edge 152 的配置视口为 1700×1000，运行器条带使截图实际为 1700×969，并以 `trashAssetsBeforeRuns=false` 保留证据。

浏览器输入使用合法的合成 M1 v5 完成档与正常、未结算的战斗初始档。所有胜负、平局、撤退、资源损耗、经验和奖励都通过实际 DOM 操作产生，没有写入已赚取的战斗结果。进行中战斗夹具只设置初始资源/战斗快照；章节入口夹具只设置合法 M1 完成状态。

完整章节从 M1 完成档实际完成休达酒馆/旅馆/船厂、第一次卡恩决斗、码头身份揭晓、里斯本宅邸平局和重赛胜利、王宫奖励、四船告别和代理船长交接、塞维尔拒绝后接受、追击及阿兰寻妹闭环。第二条分支从同一 M1 边界实际完成卡恩宅邸战败及预先持有蛇形剑的告别分支。一次性名声、经验、物品和伙伴变更均在存档中核对。

区域航行在接受塞维尔警告后，从塞维尔码头正常出航，沿现有键盘航线实际驶向里斯本；运行时实际推进超过一日、触发首段追击对白、靠港并把 `dayAtSea` 重置为 0。实际靠港后，进入里斯本码头的夹具设置地点、建筑、白天进入时间、航海日计数和安全锚点，同时保留此前实际获得的章节进度；随后再次正常出航并实际航行一日，触发卡特琳娜对白和海战。阿兰之后的里斯本、巴士拉、伊斯坦布尔长距离部分使用明确标注、设置地点、建筑、白天进入时间、航海日计数和安全锚点的夹具，携带此前实际获得的进度；不声称完成环球实航。

另一项专项从未结算、零金币/零炮弹/零木材/无食物和水的海战快照开始，实点产生战败。战败不能触发阿兰；里斯本码头选择 No 后仍无战斗，重新进入选择 Yes 立即生成新战斗，无需购买补给或出航。实点拉开至距离 3 后撤退，才允许非里斯本酒馆触发阿兰。

截图在 `tests/screenshots/conflictAndGrowth*.cy.ts/`，不可提交副本保存在 `.superpowers/sdd/2026-09-06-m2-conflict-and-growth/final-acceptance/screenshots/`。控制器目视检查了中文攻击/防御/海战/资源/物品/修理、选择后的代理船长中性“代理”首字占位和第四船船长身份、四船舰队、追击码头、重试、阿兰、莎夏、最终日志，以及英文系统/决斗/伙伴成长。画面可读；游戏整体固定为 1640×800，主要游玩区为 1280×800，所需控制可见；未发现产品布局缺陷。

最初完整章节运行 1/2 通过，失败原因是测试助手从系统弹窗观察到已开始的海战后没有关闭弹窗，正确的覆盖层阻止了底层 Withdraw。修正助手后第二次运行在最终日志处因测试猜错已发布中文标题而失败；对齐实际本地化后 2/2 通过。两项都属于测试框架修正，没有改动产品代码。原始 RED 日志也保存在 `final-acceptance/scoped-logs/`。

首次全量回归的 4 项失败也属于旧测试和测试框架问题。船厂用例购买的 `Test Balsa` 只有 25/30 耐久，新修理界面正确要求选船；用例现已实点完成 5 点修理、50 金币付款和回执确认，再验证保存的耐久/金币及 1350 金币出售结果。另一个失败发生在中文完整旅程靠港后：失败图显示文档已滚入游戏下方的 About 区，System 触发器本身没有 CSS 动画；Cypress 在长页面和港口/世界重挂载后自动滚动点击目标时把位置变化判为动画。共享助手先回到页面顶部、重新取得可见触发器，再以 `scrollBehavior: false` 点击；没有强制点击、关闭动作性检查或提高全局超时。两个专项修补均已通过，生产源码和 8082 构建未改变。

修补后的全量回归在 `08e190d` 上 80/80 通过。随后 Task 6 独立审查要求合并两个重复的递归剧情推进循环；私有原语按终止谓词、异常状态检查和诊断标签统一驱动，且先判定完成再执行异常/次数守卫，以允许同一效果组同时记录完成并开战。导出的完成事件与重复开战包装器及用例语义保持不变；两项 M2 规格 12/12 通过。按控制器范围，此后不重复运行未受影响的 M1/旧版套件；最终全分支独立审查及其修补处置见下节。

输出包含既有的 3 条 Webpack 体积提示、Browserslist 数据过期提示，以及 Cypress 10 ARM `term-size` 辅助程序架构提示；它们没有掩盖测试或编译失败，也不能称为无警告输出。

## 本项目改编范围

M2 使用直接选择攻击/防御的确定性决斗及四档距离的旗舰海战；伤害、经验阈值与固定敌人难度为本项目平衡。它没有完整复刻原作 HEX 战场、多船作战、昼夜回合上限和缴获系统。

现有内容尚不足以达到原作后续名声门槛，因此本章按已完成的章节里程碑开放。海战战败回里斯本恢复最低航行能力，并允许无钱时在港口直接重试，这是本项目的宽容恢复机制；获胜与成功撤退才能推进追击，战败本身不能推进。

多明戈离队优先由空闲伙伴接替其船长职位；无人可接替时使用没有伪造原作头像的原创“代理船长”，保留舰队。本章结束于阿兰在伊斯坦堡收到妹妹消息，路琪亚绑架事件、马沙华、圣者之杖及后续地区仍属于 M3。

## 最终全分支审查与修补

独立审查范围为 `3cf4a8e..5b767cb`，一次性覆盖 108 个文件和 18 个提交；完整报告保存在本机 `final-review.md`。没有 Critical 问题；发现一个 Important：不一致 v6 存档若同时包含已结算胜利和同场活动战斗快照，载入后再次确认可让经验从 100 增至 200。正常单窗口流程未发现会生成这种存档，但它违反了一次性结算与防御性载入约定。另一项 Minor 是船长决斗显示外层海战回合/日志。两项已在同一修补提交 `2dc2987` 中解决，并通过一次定向复审；最终无未解决的 Critical 或 Important 问题，定向复审未发现新问题。

修补将 `canReplayEncounter` 作为开战、规范化和最终结算的共同规则：不一致活动快照在载入时清理，不重复发放经验，不保留无法确认的战斗界面；合法的宅邸平局重赛和卡特琳娜战败重试仍可载入并结算。载入保持既有不立即改写存储的行为。船长决斗使用自身回合与日志，动作仍由外层海战快照处理，平局后恢复海战呈现。

修补先以实际失败的回归用例复现问题，再通过 3 组、50 项定向 Jest；完整 `npm run verify` 通过 86 组、662 项测试、38 个资源、剧情校验、TypeScript、ESLint 和生产构建。原始 RED/GREEN 及构建日志为 `final-fix-red.log`、`final-fix-ui-red.log`、`final-fix-green-final.log` 和 `final-fix-verify.log`。最终生产构建包含 46 个文件，整个浏览器回归期间哈希未改变，记录为 `final-acceptance/final-fix-build-sha256.json`。

控制器执行末次浏览器范围回归：

```sh
npx cypress run --browser edge \
  --spec 'tests/e2e/conflictAndGrowth.cy.ts,tests/e2e/conflictAndGrowthChapter.cy.ts,tests/e2e/firstVoyage.cy.ts,tests/e2e/storyArchitecture.cy.ts' \
  --env m1FixturesOnly=true \
  --config baseUrl=http://127.0.0.1:8082,trashAssetsBeforeRuns=false,screenshotsFolder=.superpowers/sdd/2026-09-06-m2-conflict-and-growth/final-acceptance/final-fix-screenshots
```

该命令使用交接中的 Node 22 PATH。结果为 M2 战斗/整备 10/10、完整章节 2/2、首次航海/弹层/实航 5/5、旧剧情存档 4/4；共 23 项声明、21 项通过、0 失败、2 pending、0 skipped，89 秒，退出 0。两条首次开局长旅程由既有 `m1FixturesOnly=true` 按预定范围排除，不能称为本轮全量通过；其之前的 80/80 完整结果仍保留。新断言保留实际打赢的终局快照，将其与已支付结果组合后从 System 载入，确认无战斗界面且经验仍是 100；船长决斗通过实际攻击/防御验证第 1/2 回合与伤害日志，平局后恢复海战第 3 回合。

新截图在 `final-acceptance/final-fix-screenshots/`，原证据未覆盖。控制器目视确认船长决斗第 2 回合与 14/0 伤害记录、平局后海战第 3 回合与距离 0、冲突档载入后英文伙伴页的等级 2/经验 100。外层战斗日志仍使用内部滚动；平局条目由 DOM 断言验证。最终复审记录为 `final-fix-review.md`，未重复全分支审查。

其余非阻断项明确保留：经验预览与结算数值目前一致，但政策重复；断粮导致零船员旗舰的新海战须下一次合法操作才判败，不能成功撤退或开启阿兰，免费恢复/重试仍可用；整备建议标题/状态重复。人工构造零耐久新海战的修理回生没有找到正常 M2 进入路径，保留为后续存档约束加固事项。既有依赖和工具警告不在本次修补范围。
