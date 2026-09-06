# 三语术语表 (Glossary · 中 / EN / 日)

**作用**：跨文档术语的**单一真相源**。港口名、物品名、NPC 名、势力名、暗线概念，统一在此对照。
**原则**（承 `3-narrative/world-overview.md` §5）：不发明完整虚构语言；英文 key 为代码主键，
中 / 日为显示名，**新增中 / 日字段不覆盖英文 key**。

> 这是从 `world-overview.md §5.3` 提升出来的权威位置。各文档不再内嵌术语表，一律链接到此。

---

## 1. 核心系统概念

| 中文 | English | 日文 | 备注 |
| --- | --- | --- | --- |
| 冒险名声 | Adventure fame | 冒険名声 | 三大名声之一 |
| 海盗名声 | Pirate fame | 海賊名声 | 三大名声之一 |
| 贸易名声 | Trade fame | 交易名声 | 三大名声之一 |
| 补给港 | Supply port | 補給港 | 港口类型 |
| 特产 | Specialty good | 特産品 | 港口经济属性 |
| 投资 | Investment | 投資 | 解锁商品 / 船 / 武器 |

## 2. 六主角与同伴

中文名称采用老 PC 中文玩家惯用译名，证据与异名见 [中文资料基线](1-baseline/chinese-reference-baseline.md)。运行时英文 key 保留，不按英文版改名重新音译。

| 中文 | 当前英文名 | 定位 |
| --- | --- | --- |
| 约翰·法雷尔 | João Franco | 冒险 / 首个完整路线 |
| 卡特琳娜·艾兰茨 | Catalina Erantzo | 复仇 / 海盗 |
| 奥托·斯宾诺拉 | Otto Baynes | 私掠 / 军事 |
| 皮耶德·康迪 | Pietro Conti | 收藏 / 寻宝 |
| 恩斯特·洛佩斯 | Ernst von Bohr | 制图 / 探索 |
| 阿兰·维斯特 | Ali Vezas | 商业 / 政治经济 |
| 洛克 | Rocco | 约翰的导师 |
| 恩里克神父 | Brother Enrico | 传教士 / 同伴 |
| 多明戈 | Domingo | 出海后的关键人物 |
| 路琪亚 | Lucia | 早期攻略异名：鲁茜亚 |

## 3. 新剧本暗线概念（承 world-overview §5.3）

| 中文 | English | 日文 | 备注 |
| --- | --- | --- | --- |
| 信标会 | Beacon Order | ビコン騎士団 | 暗线组织（命名待定，见 DECISIONS Q2） |
| 信标锚 | Beacon Anchor | ビコン錨 | 信标会核心仪式 |
| 海眼 | Sea Eye | 海眼 | Atlantis 别名 |
| 普世遗产 | Universal Relic | 普遍遺産 | 信标会目标 |
| 风信 | Wind Message | 風信 | 信标会情报网 |
| 海岸之眼 | Coast Eye | 海岸の眼 | 斯瓦希里情报人 |
| 圣者之杖 | Staff of the Saint | 聖者の杖 | 原作 Massawa 线关键物（样例见 3-narrative/samples） |

## 4. 探索 / 博物术语（占位，随内容扩展）

| 中文 | English | 日文 | 备注 |
| --- | --- | --- | --- |
| 风闻 | Rumor | 風聞 | 三层文本第一层 |
| 记录 | Record | 記録 | 三层文本第二层 |
| 博物 | Archive | 博物 | 三层文本第三层（终态揭示） |

---

## 待扩展 (TODO)

- [ ] 港口三语名：从 `5-data-governance/reference-db.json` + 原作中文攻略对齐后批量录入。
- [ ] 贸易商品三语名：对齐 `src/data/goodsData.ts` / `marketGoodsData.ts`。
- [ ] 势力 / 国家名三语对照。
- [x] 六主角规范中文译名：已按中文航海士表与早期攻略交叉核对。

**修订日志**
- 2026-06-13：建档，从 world-overview §5.3 提升，补充名声 / 六主角 / 三层文本术语。

- 2026-09-06：核对六主角中文惯用名与同伴称呼，记录英文版本对应和中文异名。
