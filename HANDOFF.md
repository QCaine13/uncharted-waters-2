# 开发交接：M3 约翰归家终章

更新：2026-09-08。约翰路线已从中文新游戏连续完成 M0–M3，并通过任务审查与最终独立审查。准确提交、命令和证据分类见 [M3 验证记录](docs/superpowers/verification/2026-09-07-m3-joao-finale.md)。执行中的范围、接口与验证判断见 [实施裁决记录](docs/superpowers/verification/2026-09-07-m3-joao-finale-rulings.md)。先读本文件，再读 [M3 设计](docs/superpowers/specs/2026-09-07-m3-joao-finale-design.md)、[实现计划](docs/superpowers/plans/2026-09-07-m3-joao-finale.md)及 D18。

## 工作位置

- 当前集成工作区：`/Users/qsircaine/uncharted-waters-2`；主分支：`master`；推送目标：`origin/master`。M3 工作树 `.worktrees/m3-joao-finale` 保留原始验收证据。
- M2 `1002d9e` 与 M3 `3f7cf45` 已通过合并提交 `33a3942bdc6c84220fd2a033b6327c79e4842729` 一并合入 `master`，没有冲突。最终生产代码提交仍为 `0ad24ed6dd1622a0e0d311fb04b1400efe8cfc46`。
- M1 已在主仓库合并推送；M0/M1/M2/M3 工作树和本机证据均保留。M2 历史边界见 [M2 验证记录](docs/superpowers/verification/2026-09-06-m2-conflict-and-growth.md)，不要将它的地点夹具追溯写成真实远航。
- 本机证据入口：M3 工作树内 `.superpowers/sdd/2026-09-07-m3-joao-finale/`；当前整合状态以主工作区的本文件与 `git log` 为准。日志、原始检查点和截图没有随 Git 分发。
- 持续交付约定（用户明确要求，见 D19）：每个阶段完成后，自动完成提交、合并到 `master`、验证并推送 `origin/master`；不能以仅本地完成作为收尾。

## 已完成的主线

M2 伊斯坦堡报告 → 连续五个海上日期 → 下一设施的阿兰线索 → 马沙华宗教设施与西南住宅 → 里斯本委托皮耶德 → 返回马沙华等待 → 两轮奥斯曼出击 → 酒馆领取并在住宅交还圣杖 → 宝冠与和解 → 恩里克赴日请求及长崎离队 → 里斯本来信 → 堺公会线索 → 南美救援与鲁道夫决斗 → 次日码头联盟 → 亚马逊胜利 → 里斯本住宅归家。

归家标记是 `joao.finale.homecoming`。结局保留在日志中，可以继续探索、保存、读取和切换语言；再次进入住宅显示欢迎对白，不重发奖励。其他五位主角尚未交付，属于 M4。

重要操作与规则：

- 五日资格在海上达成后先记录，靠港不会丢失。马沙华以返程住宅事件起算，必须到更晚月份且当月 11 日及以后；后续月份的 1–10 日也不能跳过。旅馆入住在次日 08:00 醒来。
- 两轮奥斯曼战各有独立码头准备。实际获胜或主动撤退推进，战败回马沙华重试；两战后先去住宅报告，再去酒馆取杖。委托皮耶德时不会提前得到圣杖。
- 圣杖（物品名“圣者之杖”）不能出售，交还会实际消费一件，并一次性获得宝冠（物品名“王冠”）与 5000 冒险名声。港口75显示为阿克苏姆，地图身份和市场不变。宝冠可正常出售筹资，后续不要求继续持有。
- 恩里克在长崎永久离队并奖励 1000 冒险名声。优先安排现有空闲伙伴接任船长，否则使用有界的原创代理船长，保留全部船只。堺会面是 NPC 对话，不重新入队。
- 鲁道夫决斗胜、负、平都由卡特琳娜介入救出路琪亚。马丁内斯事件后的下一日期起，每天 09:00–14:59 可在南美码头会合；错过后可在之后同一时段恢复，原始事件时钟不重写。
- 亚马逊只有实际胜利才能推进。败北、撤退或平局可在开云（Cayenne）准备重试；最终撤退不给经验。初始船可在船厂修至30耐久并购买8发炮弹，通过8次炮击获胜，真实消耗后剩2耐久。恢复不补送木材或炮弹。

## 引擎与地图边界

沿用 M2 的三攻三防决斗、旗舰距离海战、装备、经验和修理机制；船厂每点耐久10金币，每100战斗经验升一级。当前酒馆招募只补足船型最低船员，不能建议不存在的任意加员操作。恢复港口由遭遇定义区分：卡特琳娜为里斯本、奥斯曼为马沙华、亚马逊为开云。

里程碑替代原作名声积累门槛、确定性数值、宽容回港恢复和代理船长属于本项目改编。尚未复刻完整六角战场、多舰指令、昼夜战斗上限、缴获或马丁内斯必打决斗。新 NPC 不伪造原版头像，圣杖使用中性徽记。

马沙华使用逻辑宗教设施11和西南住宅8；宗教界面的头像资源13与逻辑设施ID不同。堺（Sakai，现有通用港口译名显示为“界”）没有可用教堂门，使用公会7。南美实际验收使用开云，Pernambuco 原有隔离靠港水域仍属 M5 地图事项。没有苏伊士捷径；好望角和塔马达夫补给港没有修理或招募服务。

## 存档与扩充入口

当前存档 v7，键为 `savedState`，语言独立使用 `uw2.locale`。新增 `storyEventTimes` 保存事件首次完成的游戏分钟数。合法时钟必须有限、非负且不晚于存档当前时间。已完成事件的时钟缺失、无效或错误地指向未来时，保守使用存档当前时间（无效则0），可能延长等待，不发明完成事件；没有完成标记的无效或未来时钟直接移除。运行时重复完成也遵守相同边界，并保留合法的首次时间。未知事件、合法未知时钟和结果、旧任务键、物品与合法进行中战斗继续保留；载入不立即改写存储，下次保存才持久化规范化结果。

效果整组预检查，再按顺序执行，最后只保存一次。圣杖消费、奖励与完成标记保持一致。`receiveFame` 更新名声后立即通知 HUD；通知仍位于已预检查的效果组内，最终保持一次保存，避免已到账但界面仍显示旧值。重试时日志优先显示匹配的活动战斗，不能被历史结果抢占。

| 工作 | 入口 |
| --- | --- |
| 日历和存档时钟 | `src/time/calendar.ts`、`src/state/saveMigrations.ts`、`src/story/core/` |
| 事件条件、效果与预检查 | `src/story/core/`、`src/story/storyRuntimeActions.ts` |
| 马沙华与终章声明式内容 | `src/story/content/arcs/joao/massawa/`、`src/story/content/arcs/joao/finale/` |
| 日志、港名与结局 | `src/story/joaoFinaleJournal.ts`、`src/story/portStoryNames.ts`、`src/interface/JoaoEnding.tsx` |
| 战斗与伙伴保全 | `src/combat/encounters.ts`、`src/state/actionsCombat.ts`、`src/story/companionDeparture.ts` |
| 双语对白 | `src/localization/dialogue/joaoMassawa.ts`、`src/localization/dialogue/joaoFinale.ts` |
| 实际完整旅程 | `tests/e2e/joaoFullJourney.cy.ts`、`tests/joaoOpeningJourney.ts`、`tests/worldJourneyUtils.ts` |
| 导航与分支验证 | `tests/portRouteUtils.ts`、`tests/worldRoutePlanner.ts`、`tests/worldNavigationControl.ts`、`tests/e2e/m3Massawa.cy.ts`、`tests/e2e/m3Finale.cy.ts` |

新增内容继续遵守[剧情编写指南](docs/story/authoring-guide.md)与[存档约定](docs/4-engineering/save-load-persistence.md)，使用稳定 ID 和声明式条件/效果。新剧情使用互异小数优先级，避免被旧常驻对白抢占；不要插入状态回调或自动胜利对白。

## 验证与预览

合并验证（2026-09-08）：主工作区 `npm run verify` 退出0，102套/899项测试、38个资源、剧情校验、类型检查、ESLint和生产构建通过，保留3项原有Webpack提示。合并后的396个代码、测试和配置输入与最终M3验收版本逐文件SHA一致；本次没有重新执行约四小时的完整浏览器旅程。日志保留于M3工作树证据目录的 `master-merge-verify.log`。

| 验证范围 | 实际结果 |
| --- | --- |
| 最终代码静态检查 | `npm run verify`：102套/899项单元测试、38项资源、剧情、类型、ESLint和构建全部通过；测试TypeScript独立通过 |
| 完整验收（`9d41336`） | Edge 21文件/99项全部通过，3:56:52；其中中文新档从M0连续归家、读取、双语结局与重访通过，3:42:16 |
| 测试辅助修补（`6e54d2e`） | 超时清理2/2、首航9/9、开场兼容6/6通过；加强实际按键断言后首航9/9再次通过 |
| 未来时钟修补（`0ad24ed`） | 马沙华5/5、终章12/12，合计17项通过；30份原始通关存档的新旧时钟规范化结果一致 |
| 独立审查 | Sol任务审查及复核、Astra整分支审查及最终定向复核均通过，无未解决的Critical/Important事项 |

完整远航、合成分支、原样存档恢复和后续修补分别记录。后续新增3项用例，当前完整套件共102项；未声称重新执行了四小时全套。准确命令、输入散列、审查结论及非阻断维护项见[M3验证记录](docs/superpowers/verification/2026-09-07-m3-joao-finale.md)。

预览使用 [8083](http://127.0.0.1:8083/)，旧8080/8081/8082分别保留 M0/M1/M2。使用锁定依赖和 Node.js 22：

```sh
export PATH="/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH"
cd /Users/qsircaine/uncharted-waters-2/.worktrees/m3-joao-finale
npm run verify
npx tsc -p tests/tsconfig.json --noEmit
npx cypress run --browser edge --config baseUrl=http://127.0.0.1:8083,trashAssetsBeforeRuns=false
```

完整 Cypress 套件包含实际远航，本次约四小时；日常定向调试可显式使用 `--spec`，完整旅程仍保持默认启用。

8083 服务已经运行，不重复占用端口。只有在没有浏览器测试运行时才更新生产构建；需要重启服务时使用 `npx http-server build -a127.0.0.1 -p8083 --silent -c-1`。不同来源隔离浏览器存档，旧端口存档不会自动出现。游戏固定1640×800，主游玩区1280×800；小窗口需要滚动。

Webpack 三项原有体积/性能建议及 Cypress10 ARM 辅助程序提示保留，未升级依赖。旧 M2 非阻断事项仍保留：未来平衡修改需同步结果预览；多船断粮的零船员判败恢复边界；整备建议标题重复；人工构造零耐久快照的约束加固。

## 接续位置

下一阶段是 M4 其他五位主角。先核对中文交付方案、D15–D18、v7存档约定和本次验证记录，再结合可复用经济、战斗和探索系统确定下一条独立路线。不要重做 M0–M3，也不要将约翰归家当成全部六线完成。M4 尚未开始；M2/M3 已合入主分支，后续阶段继续遵守 D19 的提交、合并、验证和推送约定。
