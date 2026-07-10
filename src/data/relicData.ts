// Relic / document / creature lore entities (relic_*, item_*/equip_* documents, one creature).
// Schema: see ./storyHooks.ts (canonical, from docs/3-narrative/samples/staff-of-the-saint.md §6).
// Prose source of truth: docs/lore/entities/<id>.md.
// DATA ONLY — not imported into game logic yet.
//
// archive triage (see docs/DECISIONS.md D7 — ancient-machine REJECTED):
//   [需改写-去机器] entries carry the literal placeholder in textLayers.archive;
//   original machine text preserved verbatim in the .md file only.

import { Relic } from './storyHooks';

const relicData: Record<string, Relic> = {
  relic_sodre_astrolabe: {
    id: 'relic_sodre_astrolabe',
    names: { zh: '索德雷的航海星盘', en: 'The Sodre Astrolabe', ja: 'ソドレの航海アストロラーベ' },
    category: 'relic',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '已知全球最古老的航海星盘，铸有曼努埃尔一世徽记的军用仪器。',
    textLayers: {
      rumor:
        '达伽马的舰队之所以能在季风中活下来，是因为他们有一种刻着国王印记的黄铜圆盘。据说它能把星星的灵魂锁在里面。',
      record:
        '一件极为罕见的早期航海星盘，打捞自1503年沉没的 Esmeralda 号残骸。盘面隐秘地铸有曼努埃尔一世的徽章，是葡萄牙严禁外流的最高级别军用仪器。',
      archive:
        '【信标会内参：温和派档案】葡萄牙人以为他们掌握了星辰，但这面星盘的铸造比例，实则参考了本会在里斯本暗中放出的古希腊天球仪残卷。我们赋予他们跨越深海的技术，是为了让他们替我们测绘出“普世遗产”的真实坐标。',
    },
    storyHooks: {
      protagonists: ['ernst', 'joao'],
      factions: ['beacon_order', 'portuguese_viceroyalty', 'arab_navigators'],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure'],
      crossLinks: ['wreck.esmeralda', 'faction.beacon_order'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: 'Esmeralda号(1503)水下考古报告',
        link: 'https://www.academia.edu/34557728/THE_ESMERALDA_SHIPWRECK_OFF_AL_HALLANIYAH_ISLAND',
      },
      { level: 'L2', note: '约1496-1501，最古老航海星盘，带曼努埃尔一世徽记 [6]' },
    ],
  },

  relic_saobento_qilin_dish: {
    id: 'relic_saobento_qilin_dish',
    names: { zh: '圣本笃号的麒麟青花盘', en: 'Qilin Porcelain of the São Bento', ja: 'サン・ベント号の麒麟青花皿' },
    category: 'relic',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '1554 圣本笃号沉船出水、绘麒麟的大明外销青花盘。',
    textLayers: {
      rumor:
        '南非那片见鬼的海岸吞噬了无数葡萄牙巨舰。听说最近有人在沙滩上捡到了蓝白相间的瓷片，上面画着长鳞片的东方喷火怪兽。水手们都说，是那种怪兽引来了好望角的风暴！',
      record:
        '一件出水自 1554 年圣本笃号（São Bento）沉船残骸的大明青花瓷盘。盘心绘有被火焰环绕的瑞兽“麒麟”（Ch\'i-lin）。这证明了早在 16 世纪中叶，中国高级瓷器就已成为葡萄牙帝国在印度洋航线上的核心运输财富。',
      archive:
        '【信标会内参：温和派誊本】水手把圣本笃号的覆灭推给盘上的麒麟，是把好望角那段海岸的脾气错记在了一尾瑞兽身上——那一带本就乱流、暗礁、季风骤转，吞过的葡萄牙巨舰何止一艘，与谁的船舱里装着什么并无干系。本会真正在意的，是这尾被火焰环绕的麒麟本身：它是江南民窑应外销之需画给番邦的祥瑞，可那环身的火焰、四向放射的纹路，与我们在东非、印度沿海记录的景教遗物星象母题隐隐相通。极端派据此疑心大明窑工早受过失落王国的余泽，主张把这批瓷器尽数收没封存；我们温和派以为不必如此——东方的窑工、地中海的僧侣，各自膜拜不同的神，却不约而同把光与星辰刻进至贵之物，未必是谁传给了谁，更可能是那些景教传教者走得比帝国史书所愿承认的更早、更远。这只盘子不是死亡坐标，是一段被海水冲散的家书残页。',
    },
    storyHooks: {
      protagonists: ['joao', 'ali'],
      factions: ['beacon_order', 'portuguese_crown'],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure'],
      crossLinks: ['wreck.sao_bento', 'location.cape_of_good_hope'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '圣本笃号(1554)沉船遗址报告',
        link: 'https://emandulo.apc.uct.ac.za/collection/FHYA%20Depot/Journals_newspapers_and_magazines/Auret_and_Maggs_1982_The_Great_Ship_Sao_Bento_Pondoland_coast.pdf',
      },
      { level: 'L2', note: '残骸出水正德/嘉靖麒麟纹外销青花 [5]' },
    ],
  },

  relic_saobento_crane_dish: {
    id: 'relic_saobento_crane_dish',
    names: { zh: '圣本笃号的八卦仙鹤瓷', en: 'Trigram and Crane Porcelain of São Bento', ja: 'サン・ベント号の八卦仙鶴磁' },
    category: 'relic',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '圣本笃号出水、底书“富贵长春”的八卦仙鹤纹青花盘。',
    textLayers: {
      rumor:
        '在南非风暴角的海滩上，有人捡到了刻着奇怪文字的青花瓷片。有个懂大明话的通译看了后吓得脸色发白。他说那盘底写着“富贵长存，永生不死”。哈！永生不死？结果几百个葡萄牙水手全被那些盘子拖进了海底！',
      record:
        '打捞自 1554 年圣本笃号（São Bento）残骸的大明青花瓷盘。盘面绘有道教典型的“八卦”与“仙鹤”图案，底足刻有“富贵长春”的吉语铭文。这些满载东方祈福意象的奢侈品未能庇护这艘巨舰，反而成为了葡萄牙帝国早期航海灾难的最无情见证。',
      archive:
        '【信标会内参：温和派地理备忘录】圣本笃号的覆灭是一场由于文化盲区导致的悲剧。大明官窑绘制在盘面上的八卦与仙鹤，根本不是什么宗教纹饰，而是我们留存在东方的星象与洋流导航罗盘模型。葡萄牙人将其当作单纯的艺术品大量装船，却不知道堆积的含钴釉料干扰了船底的磁罗盘。他们带着东方的导航图，却像瞎子一样撞上了南非的暗礁。',
    },
    storyHooks: {
      protagonists: ['joao', 'pietro'],
      factions: ['beacon_order', 'portuguese_crown'],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure'],
      crossLinks: ['wreck.sao_bento', 'location.cape_of_good_hope'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '圣本笃号(1554)沉船遗址报告(八卦/长春铭文瓷盘)',
        link: 'https://emandulo.apc.uct.ac.za/collection/FHYA%20Depot/Journals_newspapers_and_magazines/Auret_and_Maggs_1982_The_Great_Ship_Sao_Bento_Pondoland_coast.pdf',
      },
      { level: 'L2', note: '八卦/仙鹤纹青花盘，底书“富贵长春” [9]' },
    ],
  },

  relic_saobento_faux_xuande: {
    id: 'relic_saobento_faux_xuande',
    names: { zh: '圣本笃号的“宣德伪款”青花碗', en: 'Faux-Xuande Bowl of the São Bento', ja: 'サン・ベント号の「宣徳偽款」碗' },
    category: 'relic',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '嘉靖工艺却底书“宣德年制”伪款的跨国造假青花碗。',
    textLayers: {
      rumor:
        '想在里斯本发财吗？去果阿港找那些福建来的走私商，专门挑底部写着“宣德”两个字的蓝白瓷碗买。葡萄牙的贵族老爷们对这种号称有一百多年历史的皇家古董毫无抵抗力！',
      record:
        '一件出水自 1554 年圣本笃号（São Bento）残骸的青花瓷碗。经学者鉴定，其烧制工艺属于 16 世纪的嘉靖年间，但底部却带有“大明宣德年制”的伪造款识。这证明在 16 世纪中叶，大明外销瓷市场已经出现了针对欧洲买家的系统性仿古与造假产业链。',
      archive:
        '【信标会内参：温和派经济备忘录】不要把大明工匠想得太庸俗。“宣德”伪款并非单纯的商业欺诈，它是大明沿海走私网络（不受官方朝贡体系控制的私商）用于标记特定批次、甚至隐秘集资的暗号。葡萄牙人用真金白银买走了这些“假古董”，实际上是在不知情的情况下，为远东的地下情报网络提供了源源不断的活动资金。',
    },
    storyHooks: {
      protagonists: ['pietro', 'ali'],
      factions: ['beacon_order', 'ming_private_traders', 'portuguese_crown'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['wreck.sao_bento', 'port.goa'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '圣本笃号(1554)沉船遗址报告(宣德伪款青花瓷)',
        link: 'https://emandulo.apc.uct.ac.za/collection/FHYA%20Depot/Journals_newspapers_and_magazines/Auret_and_Maggs_1982_The_Great_Ship_Sao_Bento_Pondoland_coast.pdf',
      },
      { level: 'L2', note: '明中后期民窑用前朝年号伪款迎合古董市场' },
    ],
  },

  relic_san_diego_ordnance: {
    id: 'relic_san_diego_ordnance',
    names: { zh: '圣迭戈号的超载火炮', en: 'Overloaded Ordnance of the San Diego', ja: 'サン・ディエゴ号の過載火砲' },
    category: 'relic',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '1600 仓促改装超载致重心失衡沉没的西班牙战舰火炮。',
    textLayers: {
      rumor:
        '马尼拉的西班牙总督疯了！为了对付几艘荷兰小船，他们居然把一艘装大明丝绸的胖商船，硬生生塞满了重炮和穿板甲的雇佣兵。结果呢？那艘叫圣迭戈号的废铁，还没开几炮就自己沉到海底去喂鱼了！',
      record:
        '1600 年马尼拉海战的遗迹。圣迭戈号（San Diego）原为大帆船，因遭遇荷兰舰队威胁而被匆忙改装为战舰。考古发掘证实，船舱内装载了与船体结构极不匹配的大量火炮（Ordnance）和沉重的弹药。这是导致其在海战中重心失衡并迅速沉没的直接原因。',
      archive:
        '【信标会内参：极端派行动日志】圣迭戈号的沉没绝非指挥官的单纯失误。我们在马尼拉的总督府内散播了关于荷兰人拥有超级武器的假情报，极大地放大了西班牙人的恐慌，诱使他们超载了这艘商船。通过这次不流血的沉没，我们成功同时削弱了西班牙和荷兰在太平洋的军事投放能力，确保了该海域本会物资运输的绝对安全。',
    },
    storyHooks: {
      protagonists: ['catalina', 'otto'],
      factions: ['beacon_order', 'spanish_crown', 'dutch_privateers'],
      darkLineLayer: 'L3',
      fameTriggers: ['pirate', 'adventure'],
      crossLinks: ['wreck.san_diego', 'port.manila'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '1600 年马尼拉海域 San Diego 号打捞档案 [7,8]' },
      { level: 'L2', note: '仓促改装超载火炮致结构失衡进水沉没 [7]' },
      {
        level: 'L3',
        note: '圣迭戈号(1600)沉没与打捞',
        link: 'https://subliblog.com/2020/01/12/the-sinking-of-san-diego-on-dec-14-1600-and-the-discovery-of-its-wreck/',
      },
    ],
  },

  relic_golden_clove: {
    id: 'relic_golden_clove',
    names: { zh: '德尔纳特黄金丁香', en: 'Golden Clove of Ternate', ja: 'テルナテの黄金丁子' },
    category: 'relic',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '葡西争夺香料群岛时为换独家供货权铸造的纯金丁香信物。',
    textLayers: {
      rumor:
        '想要在德尔纳特买到满船的丁香？你得先让苏丹看一眼传说中的“黄金丁香”。据说那是当年白人传教士为了讨好土王，用纯金一比一打造的。只要拿着它，你就是火山岛上尊贵的客人！',
      record:
        '一枚由高纯度黄金精心雕刻而成的丁香花蕾模型。16世纪初，随着《萨拉戈萨条约》的签订，葡萄牙与西班牙在摩鹿加群岛展开了残酷的香料暗战。这件黄金器物极有可能是双方为了换取德尔纳特苏丹独家供货权而铸造的盟誓信物。',
      archive:
        '【信标会内参：温和派誊本】把这枚黄金丁香说成「讨好土王的贡物」，是低估了德尔纳特苏丹。在葡萄牙与西班牙为丁香撕咬、《萨拉戈萨条约》把摩鹿加群岛劈成两半的年月里，一个火山岛上的小苏丹国能在两大强权之间反复待价而沽、毫发无损地保住独家供货权，靠的不是哪国的恩赏，而是极精明的自主外交——这枚以纯金一比一打造的丁香，正是这种周旋本身的信物：谁想换取排他采购权，就得先在它面前立誓。本会留意它，是因为它的工艺：那向四周绽开的金质花蕾，刻线规整、向心放射，与我们在东非、印度沿海记录的景教遗物星象母题颇有几分神似——或许是经由印度洋商路辗转传入的纹样母题。极端派据此疑心香料群岛也曾沾染失落王国的余泽，主张连同采购权一并掌控；我们温和派以为不必牵强：一枚信物能讲清两件事就够了——东南亚苏丹国在列强夹缝中的外交智慧，以及那些景教纹样比帝国史书所愿承认的，飘散得更远。它不是开启什么的钥匙，是一座小岛守住自己的凭证。',
    },
    storyHooks: {
      protagonists: ['ali', 'ernst'],
      factions: ['beacon_order', 'ternate_sultanate', 'spanish_crown', 'portuguese_crown'],
      darkLineLayer: 'L4',
      fameTriggers: ['trade', 'adventure'],
      crossLinks: ['port.ternate', 'port.banda'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '16 世纪初摩鹿加德尔纳特苏丹国与伊比利亚人接触记录 [8]' },
      { level: 'L2', note: '葡西丁香暗战、重金礼品换排他采购权 [8]' },
      { level: 'L5', note: 'L5 终局推演（基于 world-archive 综合，标注为推测）' },
    ],
  },

  relic_golden_mask_tenochtitlan: {
    id: 'relic_golden_mask_tenochtitlan',
    names: { zh: '特诺奇蒂特兰金面具', en: 'Golden Mask of Tenochtitlan', ja: 'アステカの黄金の仮面' },
    category: 'relic',
    darkLineLayer: 'L5',
    hookPriority: 'required',
    description: '躲过西班牙熔炉、由祭司带入雨林藏匿的阿兹特克纯金面具。',
    textLayers: {
      rumor:
        '那些从新西班牙回来的水手喝醉了都在说胡话。他们说在特诺奇蒂特兰的废墟下，藏着一张属于羽蛇神的金面具。西班牙人曾经抓住过它，把它扔进熔炉里，结果面具不但没化，还在火里发出了恐怖的尖叫！',
      record:
        '一件躲过了 1521 年西班牙征服者大熔炉的阿兹特克纯金面具。根据幸存的纳瓦特尔语抄本记载，城破之日，最高祭司将其带入雨林深处。其造型不仅体现了中美洲极高的冶金工艺，面部线条更是充满了对天文星象的崇拜。',
      archive:
        '【信标会内参：美洲分部考据】（温和派誊本）不要被熔炉里尖叫的传说迷惑——面具未熔，多半因为它并非纯金，而是中美洲常见的「tumbaga」金铜合金，表层富金、内里熔点更高，征服者的炉火不足以化尽。真正让本会驻足的，是它背面的几何纹样：那组以太阳为心、向四方放射的刻线，与我们在东非、印度沿海所记录的景教遗物星象母题惊人相似。极端派据此断言此乃同源文明须收没销毁的铁证；我们温和派以为不必如此惊惧——美洲的祭司、明朝的窑工、地中海的僧侣膜拜着不同的神，却不约而同地把太阳与星辰刻进至圣之物。这未必是谁植入了谁，更可能是那些失落王国的传教者，比任何帝国的史书所愿承认的，走得更早、更远。这面具不是机括，是一封迟到了三百年的家书。',
    },
    storyHooks: {
      protagonists: ['pietro', 'joao'],
      factions: ['beacon_order', 'aztec_priesthood', 'spanish_crown'],
      darkLineLayer: 'L5',
      fameTriggers: ['adventure'],
      crossLinks: ['region.caribbean', 'region.mesoamerica', 'relic.beacon_universal_map'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '1521 特诺奇蒂特兰陷落后纳瓦特尔语残存抄本 [5]' },
      { level: 'L2', note: '科尔特斯熔毁原住民金器，少数最高圣物被祭司藏匿 [5]' },
      { level: 'L5', note: 'L5 终局推演（基于 world-archive 综合，标注为推测）' },
    ],
  },

  relic_belitung_tang_cargo: {
    id: 'relic_belitung_tang_cargo',
    names: { zh: '勿里洞古沉船海图', en: 'Chart of the Belitung Wreck', ja: 'ブリトゥン島の古沈船海図' },
    category: 'relic',
    darkLineLayer: 'L5',
    hookPriority: 'required',
    description: '指向 9 世纪唐代阿拉伯缝合船残骸的残破海图，文明轮回铁证。',
    textLayers: {
      rumor:
        '在爪哇海的泥沙底下，有一艘老得连木头都变成化石的怪船！上面没有用一颗铁钉，全是椰子壳纤维缝起来的。更吓人的是，船肚子里装着几万个大唐皇帝时代的碗！谁要是能捞上来一个，连里斯本的国王都会嫉妒你！',
      record:
        '一份标示着勿里洞岛（Belitung）附近一处异常海床坐标的残破海图。近代早期的探险家在此发现了一艘 9 世纪（中国唐代）的阿拉伯商船残骸。这艘满载中国陶瓷的沉船，是欧洲大航海时代开启前 700 年，亚洲与中东之间已存在成熟“海上丝绸之路”的铁证。',
      archive:
        '【信标会内参：温和派誊本】这艘用椰壳纤维缝合、不见一颗铁钉的阿拉伯商船，本是一段无须任何神秘解释的史实——早在欧洲人扬帆之前七百年，连接广州、室利佛逝与波斯湾的海上丝路便已成熟运转，它满载唐瓷沉没，不过是那条古老航道上一次寻常的海难。本会驻足，是因为这条九世纪的航道，正与我们追索的失落王国遗存相叠：景教（聂斯脱利派）的传教士与商人，恰是顺着这同一片季风与洋流，把信仰、星象典籍与传教信物带往中亚、印中与东南亚的。极端派把这艘沉船说成「文明轮回的铁证」，称每隔数百年便有一批人被同一段历史召回，主张抢先封锁勿里洞海域；我们温和派以为不必如此玄虚——史实本身已足够震撼：所谓「大航海」并非欧洲人的独创，而是踏上了别人铺就千年的旧路。这艘沉船不是谁的牺牲品，是那条古老航道留给后世的一封信，提醒我们：没有谁是世界的起点。',
    },
    storyHooks: {
      protagonists: ['pietro', 'ernst'],
      factions: ['beacon_order'],
      darkLineLayer: 'L5',
      fameTriggers: ['adventure'],
      crossLinks: ['region.java_sea', 'relic.beacon_universal_map'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '印尼勿里洞岛海域 9 世纪唐代沉船考古报告' },
      {
        level: 'L2',
        note: '勿里洞9世纪沉船发掘分析（6 万件唐瓷阿拉伯缝合船，证早期海上丝路；注：博物层 L4/L5 标注在转录中不一致，此处采 L5）',
        link: 'https://smarthistory.org/indian-ocean-belitung-wreck/',
      },
    ],
  },

  relic_swahili_divination_bone: {
    id: 'relic_swahili_divination_bone',
    names: { zh: '斯瓦希里海岸占卜骨', en: 'Swahili Divination Bones', ja: 'スワヒリ海岸の占い骨' },
    category: 'relic',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '东非巫医刻符占卜的兽骨，指向内陆遗迹与祭司王约翰线索。',
    textLayers: {
      rumor:
        '想在索法拉买到黄金？那你得出大价钱去请那些被称为“Waganga”的盲眼巫医。他们会抛洒一把刻着花纹的兽骨。如果骨头指向大海，你就能平安归来；如果指向内陆，你的船长最好赶紧写遗嘱。',
      record:
        '来自东非斯瓦希里海岸的传统占卜用具。这些骨骼上刻有早期的几何符号，融合了本土泛灵论与早期海外贸易的印记。16世纪初寻找“祭司王约翰”的葡萄牙探险家，曾在日记中将其描绘为不可解的异教密码。',
      archive:
        '【信标会内参：温和派誊本】葡萄牙人把这些刻符兽骨当作异教黑魔法，是不肯弯下腰去读它们。Waganga 抛骨问卜，凭的是世代累积的海况、季风与商路经验：骨指向海，是出海的吉时；指向内陆，则是雨季、瘴疠与劫掠横行的凶兆——这是斯瓦希里城邦用占卜的形式保存下来的一部活地理志。本会真正珍视的，是其中混入的几何符号：它们不属于本土泛灵论的旧有纹样，倒与景教遗物上的星象母题暗合。据本会档案，最早把这套符号带到东非内陆的，是一支远早于葡萄牙人的传教队伍——后世欧洲人辗转听闻、以讹传讹，便成了「祭司王约翰」（Prester John）那个失落基督教王国的传说。极端派坚信这些骨头藏着通往遗产的密文，要不惜代价搜罗刻骨；我们温和派以为它们更像一段记忆的容器，记着那条早已湮没、却仍指向内陆王国的路。骨上的不是密码，是一个民族对祖先与海洋的世代叮咛。',
    },
    storyHooks: {
      protagonists: ['pietro', 'ernst'],
      factions: ['beacon_order', 'swahili_city_states', 'portuguese_crown'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['port.mombasa', 'port.sofala', 'legend.prester_john'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '东非斯瓦希里海岸口头传统与前殖民考古遗存' },
      { level: 'L2', note: '巫医（Waganga）刻符兽骨占卜定出海吉日' },
      { level: 'L5', note: 'L5 终局推演（基于 world-archive 综合，标注为推测）' },
    ],
  },

  relic_temasek_14thc_wreck: {
    id: 'relic_temasek_14thc_wreck',
    names: { zh: '淡马锡古沉船', en: 'The Temasek Wreck', ja: 'テマセク古沈船' },
    category: 'relic',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '新加坡水域 14 世纪沉船，击碎“欧洲人发现东方”叙事。',
    textLayers: {
      rumor:
        '里斯本的学者说，是我们葡萄牙人第一个把船开到了香料群岛。但马六甲的老潜水员在海峡底下的泥沙里，摸到了巨大的木头龙骨。那船比我们现在最大的战舰还要大，而且已经在水底躺了一百多年了！',
      record:
        '一份标示着淡马锡（今新加坡）水域坐标的沉船考察报告。该船只残骸及出水文物被证实属于 14 世纪。这艘“淡马锡古沉船”无可辩驳地证明，在欧洲“大航海时代”开启的数个世纪前，一条由亚洲先民建立的“海上丝绸之路”就已经高度成熟并连接着东西方。',
      archive:
        '【信标会内参：温和派誊本】里斯本的学者爱说是葡萄牙人第一个把船开到了香料群岛——这艘比他们最大的战舰还要庞大、却已在海峡底下静卧两百年的十四世纪龙骨，便是对这份傲慢最沉默的反驳。淡马锡从来不是等待被「发现」的蛮荒，而是一座连通中国与印度洋的成熟枢纽：满者伯夷、暹罗、大明海商的货船在此交汇，海上丝路在欧洲扬帆之前数百年便已高度成熟。本会在这片海域反复巡查，并非因为海底藏着什么机括，而是因为这条古老航道，正与我们追索的失落王国遗存的传播路线重合——景教南传的余泽、本土化的传教信物，多半也曾随这些船只在马六甲海峡进出。极端派想把沉船连同船货一并秘密打捞封存，称其中或有同源文明的物证；我们温和派坚持据实登记公开——因为这艘船真正的分量，不在于它指向哪处宝藏，而在于它逼所有自命为「海洋主人」的人承认：他们只是踏上了别人早已铺好的旧路。',
    },
    storyHooks: {
      protagonists: ['pietro', 'ali'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.malacca_strait', 'port.temasek'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '淡马锡14世纪沉船官方发掘',
        link: 'https://www.roots.gov.sg/stories-landing/stories/From-the-Depths-of-the-Seas-Excavating-Clues-to-Singapores-History/Story',
      },
      { level: 'L2', note: '淡马锡作为连接中国与印度洋的海丝关键节点' },
    ],
  },

  relic_beacon_universal_map: {
    id: 'relic_beacon_universal_map',
    names: { zh: '信标会普世星图', en: 'The Universal Blueprint', ja: 'ビコン騎士団の普遍的星図' },
    category: 'relic',
    darkLineLayer: 'L5',
    hookPriority: 'required',
    description: 'L5 终局阵眼：由各洋圣物拼凑、指向地球深处坐标的星图。',
    textLayers: {
      rumor:
        '（酒馆老板压低声音）朋友，你听说了吗？那个找妹妹的葡萄牙贵族、那个红头发的女海盗、还有那个阿拉伯大商人……他们都不见了。有人说他们带着从世界各地找来的神物，去了大洋中心一个地图上没有的旋涡里。那里藏着连上帝都会害怕的秘密！',
      record:
        '一份无法用任何已知制图学解释的星图。它由葡萄牙星盘的刻度、阿兹特克面具的阵列、大明瓷器的暗纹以及波罗的海琥珀的磁性拼凑而成。它不指向任何已知的港口，而是指向地球深处一个似乎超越了人类文明起源的坐标。',
      archive:
        '【信标会内参：最高议会备忘】（温和派誊本）诸位，所谓「普世星图」并非通往某处宝藏的航海图，而是我们三百年来从四海残片中拼回的一段被抹去的历史——12 至 14 世纪，景教的传教士曾把同一套信仰、星象与典籍带到中亚、印度、东南亚与东非，又被各地本土化、与佛教、印度教、原住民信仰交融，最终在黑死病与蒙古衰退中相继湮灭。葡萄牙人拜它为科技、美洲人尊它为太阳、明人记它为海神，却供奉着同一段失落王国的余烬。极端派要将此图永久封入本会密库，称未经准备的世人不配知晓同源；我们温和派坚持登记公开——因为这张图真正的力量，不在于谁先抵达图心，而在于当六大洋的人们发现彼此供奉的本是同一段历史时，便再没有谁能假装自己是世界的中心。',
    },
    storyHooks: {
      protagonists: ['joao', 'catalina', 'otto', 'pietro', 'ernst', 'ali'],
      factions: ['beacon_order_moderates', 'beacon_order_extremists'],
      darkLineLayer: 'L5',
      fameTriggers: ['adventure'],
      crossLinks: [
        'relic.sodre_astrolabe',
        'relic.golden_mask_tenochtitlan',
        'item.baltic_amber_casket',
        'relic.saobento_crane_dish',
        'item.shunji_temple_tablet',
      ],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L5', note: 'L5 终局推演（基于 world-archive 综合，标注为推测）' },
    ],
  },

  // ---- documents (item_*/equip_*) ----

  item_mazu_paper_ship: {
    id: 'item_mazu_paper_ship',
    names: { zh: '妈祖的彩纸海船', en: 'Colorful Paper Ship of Mazu', ja: '媽祖の彩紙海船' },
    category: 'document',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '南海船员航经险礁制作彩纸船投海安抚水鬼的消耗仪式。',
    textLayers: {
      rumor:
        '在大明和马六甲的航线上，如果你遇到狂风，记住在甲板上扎一艘五彩纸船扔进海里。别问为什么，海底的东西吃了饭，就会放你过去。',
      record:
        '大明海商在远洋帆船上常设“香公”（Incense Master）一职。途经危险海域时，他们会制作纸船放入海中进行科仪，祈求妈祖庇护并驱逐邪祟。',
      archive:
        '【信标会内参：温和派誊本】西方船客把闽南水手扎彩纸船投海视作「异教徒的迷信」，是只看见了纸船，没看见船上人此刻的处境。船过危礁、风浪正紧，人力已到尽头，水手便制一艘带帆带舵的小船放入海中——它替整船人向妈祖、向水中无主的孤魂递上一份谦卑：愿以这只小船代一船人受过，求一程平安。这不是要安抚什么深海的守护者，而是闽南航海传统里一套与不可控的大海讲和的方式：把无能为力的恐惧，收拢进一桩郑重、可执行的仪式，让濒临崩溃的船心重新安定下来。本会收录它，与普世遗产无关，只因它与地中海桅下的冥河银币、马来巫师的镇海真言遥相呼应——不同的海、不同的神，同一颗在风浪前学着低头的人心。',
    },
    storyHooks: {
      protagonists: ['ali', 'ernst'],
      factions: ['beacon_order', 'mazu_cult'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.south_china_sea', 'port.yuegang'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读(抛放彩船科仪)',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
      { level: 'L2', note: '南海船员险礁制作彩纸船安抚水鬼 [7]' },
    ],
  },

  item_pawang_sea_mantra: {
    id: 'item_pawang_sea_mantra',
    names: { zh: '帕旺的镇海真言', en: "Pawang's Sea Mantra", ja: 'パワンの鎮海真言' },
    category: 'document',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '马来巫师召唤海灵护船的航海真言，消耗型护身增益。',
    textLayers: {
      rumor:
        '如果在彭亨州（Pahang）的沿海遇到暗礁，赶紧找船上的马来水手念诵那段献给海洋统治者“Sultan Gila”的咒语。哪怕船底已经被撕裂，那些看不见的东西也会托着你的船底撑到靠岸。',
      record:
        '马来半岛的传统航海真言（Mantera）。水手们相信，通过巫师（Pawang）向海魔 Raja Bus 和 Raja Bas 祈求，能够获得“向左七寻、向右七寻”的无形结界，延长船只在海难中的浮力。',
      archive:
        '【信标会内参：温和派誊本】欧洲船长私下默许马来水手念诵 Pawang 的镇海真言，又当众斥之为异教巫术，这份口是心非里藏着实情：这套真言确实「管用」，只是不靠任何海兽或机括。它真正的力量在人不在海——惊涛骇浪、暗礁迫近之际，几十名水手依着 Pawang 的领诵同声祷念那段古老的韵文，散乱的呼吸与桨橹便被收束进一个节拍，恐慌让位于齐心，操船的手于是稳了下来。「向左七寻、向右七寻的无形结界」，结的不是海上的界，是一船人的胆气。这套融合了伊斯兰、印度教与本土泛灵论的航海祷文，是东南亚水手与残酷海况达成的生存契约。本会记录它，不为它能搅动什么深海，而因它与闽南的彩纸船、地中海的桅下银币如出一辙——人在大海面前，总要为自己挣一桩可执行的安心。',
    },
    storyHooks: {
      protagonists: ['ali', 'ernst'],
      factions: ['beacon_order', 'malay_pawang'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['port.malacca', 'port.patani', 'region.pahang'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '马来半岛及刁曼岛 Pawang 口述传统与驱魔祷文 [8]' },
      {
        level: 'L2',
        note: 'Pawang真言(Mantera)研究（召唤 Raja Bus/Raja Bas 海灵保船的真言）',
        link: 'https://scholarhub.ui.ac.id/cgi/viewcontent.cgi?article=1408&context=wacana',
      },
    ],
  },

  item_aczk_manuscript: {
    id: 'item_aczk_manuscript',
    names: { zh: '《安船酌献科》与司香航海日志', en: 'ACZK Maritime Manuscript', ja: '安船酌献科の写本' },
    category: 'document',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '月港道教航海科仪手稿，附录精确南海航线与守护神灵。',
    textLayers: {
      rumor:
        '那些福建来的大帆船上，总有一个什么活都不干、只管烧香念经的人。他们手里有本破书，据说里面画的海图不是看星星的，而是看龙和水鬼的脾气的！',
      record:
        '一本源自大明月港的航海科仪手稿《安船酌献科》。书中详细规定了“香公”在海上应执行的祭祀仪式，其附录更是一份极其精确的南海航线图，标明了每个暗礁和港口对应的神灵。',
      archive:
        '【信标会内参：温和派誊本】欧洲水手讥讽《安船酌献科》是「祈求魔鬼的通行证」，是只看见了香火，没看懂香火背后那本附录。把每一处暗礁、急流与可泊之港，都系在一位守护神的名下，是东方水手用神圣地理学的形式，把世代血泪换来的航路经验编成了便于记诵、不易失传的口诀——「呼唤某位神明」，其实是在提醒舵手：到了该转向、该避礁的水域了。它是一部裹着科仪外衣的南海航路志，未必比我们的罗盘逊色。本会珍藏它，不为它藏着什么深海禁区，而因它印证了一件事：在欧洲制图学用经纬度切分海洋之前，东方早已有另一套同样精密、却以神灵命名的海洋知识体系。极端派想把这类异质航海典籍尽数收入密库、不令外传；我们温和派主张誊录登记——因为这些散落各文明的航海智慧拼到一处，才看得出人类丈量同一片大洋时，本是殊途同归。',
    },
    storyHooks: {
      protagonists: ['ernst', 'ali'],
      factions: ['beacon_order', 'ming_sea_merchants'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure', 'trade'],
      crossLinks: ['port.yuegang', 'region.south_china_sea'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
      { level: 'L2', note: '远洋帆船“香公”科仪 + 附录南海航线神灵 [2,3]' },
    ],
  },

  item_mast_styx_coin: {
    id: 'item_mast_styx_coin',
    names: { zh: '主桅下的冥河银币', en: 'Styx Coin under the Mast', ja: '主檣下のステュクス銀貨' },
    category: 'document',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '竖主桅前压硬币付给冥河渡神的欧洲造船仪式，可选抗沉强化。',
    textLayers: {
      rumor:
        '如果你找那个热那亚的老船匠造船，千万别省那一枚压在主桅杆底下的银币！海洋总是要收过路费的，如果船底没有硬币，它就会收走你们的命来代偿！',
      record:
        '欧洲造船业的一项古老传统。工匠在竖立主桅之前，会在桅座下放置一枚硬币。水手们迷信地认为，如果船只不幸沉没，这枚硬币将作为支付给冥河渡神的船资。',
      archive:
        '【信标会内参：温和派誊本】桅座下那枚硬币，谈不上什么深海的机括或暗中的操弄。它是一条从古罗马一路漂流到风帆时代的旧俗：罗马人为死者口中含币，好让亡魂付得起冥河渡神卡戎的船资；造船的匠人把这念头压进新船的龙骨，便成了一艘船与海洋之间不言自明的契约——倘有沉没的一天，船上人也不至于赤手空拳去见那位摆渡者。本会把它收入档案，不为它能驱动什么，而为它是一面镜子：地中海的水手怕债欠冥河，东方的舵手向妈祖抛纸船，西非的航者另有自己的禳解——天各一方的人，面对同一片吞噬性命的大海，都本能地想用一件小物、一桩仪式，为不可知的命运换得一分体面与安宁。这枚银币不通往任何遗产，它只通往人心那点共通的、对深渊的敬畏。',
    },
    storyHooks: {
      protagonists: ['catalina', 'joao'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['system.shipyard', 'port.genoa'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '欧美帆船 Mast stepping ceremony 传统 [9]' },
      { level: 'L2', note: '源自古罗马含币习俗，付冥河渡神卡戎船资 [10]' },
      {
        level: 'L3',
        note: '主桅压硬币(冥河渡资)传统',
        link: 'https://ussconstitutionmuseum.org/wp-content/uploads/2018/09/List-of-Sailors-Superstitions-Burial-at-Sea.pdf',
      },
    ],
  },

  equip_jianzhen_compass: {
    id: 'equip_jianzhen_compass',
    names: { zh: '监针童子罗经盘', en: 'Compass of the Needle-Supervising Boy', ja: '監針童子の羅経盤' },
    category: 'document',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '神格化指南针、刻向鲁班与监针童子密咒的东方罗经盘。',
    textLayers: {
      rumor:
        '大明的领航员都在船上供奉着一个叫“监针童子”的神仙。他们说罗盘里住着一个小精灵，只要你诚心祈祷，哪怕在连月亮都看不见的浓雾里，它也能带你找到港口！',
      record:
        '一件制作精良的东方水旱罗经盘。盘面上不仅刻有天干地支二十四方位，其外壳还用朱砂写着向“鲁班”和“监针童子”祈求的密咒。这是东方领航员（火长）视若生命的法器。',
      archive:
        '【信标会内参：温和派档案】东方人将地磁偏角的物理现象拟人化为了“监针童子”的调皮。罗盘上刻写的那些冗长祈祷文，实际上是一套严格的倒计时口诀，用于在不同纬度下校准地磁异常。他们用神学的语言，完美封装了最高级别的航海物理学。',
    },
    storyHooks: {
      protagonists: ['ernst'],
      factions: ['ming_navigators'],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure'],
      crossLinks: ['region.east_asia', 'system.navigation'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读(监针童子祈祷文)',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
      { level: 'L2', note: '指南针/造船术神格化，祈鲁班与监针童子 [11,13]' },
    ],
  },

  item_mazu_sentinels: {
    id: 'item_mazu_sentinels',
    names: { zh: '千里眼与顺风耳木雕', en: 'Idols of the Demonic Sentinels', ja: '千里眼と順風耳の木彫' },
    category: 'document',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '妈祖神龛旁的千里眼/顺风耳木雕，舰队视野与预警配件。',
    textLayers: {
      rumor:
        '如果你去大明的帆船上做客，除了拜那位叫妈祖的女神，别忘了给旁边那一红一绿两个妖怪上柱香。水手们说，起雾的时候，这两个怪物能隔着几百里听到暗礁的水声，看到海盗的船帆！',
      record:
        '通常成对放置于东方帆船神龛（Shen tang）内的木雕神像。红色的被称为“千里眼”，绿色的被称为“顺风耳”。神话称他们原是恶魔，被海神降伏后充当了神明的雷达系统，专门在风暴与迷雾中为水手预警灾难。',
      archive:
        '【信标会内参：温和派誊本】西方船客不解：何以要在慈悲的海神身旁，供一红一绿两尊狰狞的护法？这恰是东亚航海神学最务实的一面。传说里，千里眼与顺风耳本是为祸海上的恶魔，被妈祖降伏后，方以其「看得远、听得真」的本事替神明耳目——这分明是把舵手最看重的两桩本领郑重供奉起来：雾里辨帆、浪中听礁。说穿了，「千里眼」供的是瞭望，「顺风耳」敬的是辨音，是闽台水手把生死攸关的预警之能，封进了可膜拜、可叮嘱、可代代相传的神像里。本会留意它，不为木雕里藏着什么失传的机括，而因它又一次印证：无论东西，凡常年与大海周旋的人，都懂得把保命的经验托付给神祇与仪式，好让它不随某个老舵手的离世而失传。它不是器械，是一桩被供奉起来的航海智慧。',
    },
    storyHooks: {
      protagonists: ['ernst'],
      factions: ['beacon_order', 'mazu_cult'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.south_china_sea', 'faith.mazu'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '1409《太上老君说天妃救苦灵验经》；闽台妈祖庙造像 [10,11]' },
      {
        level: 'L2',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读(千里眼/顺风耳护法)',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
    ],
  },

  equip_chuanzai_ma_shrine: {
    id: 'equip_chuanzai_ma_shrine',
    names: { zh: '船仔妈神龛', en: 'The Chuanzai Ma Bow Shrine', ja: '船仔媽の神棚' },
    category: 'document',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '东方帆船主桅后“神堂”内供奉的船仔妈木雕，降灾配件。',
    textLayers: {
      rumor:
        '那些大明来的福船，主桅杆后面总有个小黑屋，里面供着个木雕的女神像。他们叫她“船仔妈”。我见过他们的船被巨浪拍出裂缝，但只要那小屋里的香不断，船就死活不沉！',
      record:
        '东方远洋帆船的标准建制。在主桅后方设有名为“神堂”（shen tang）的专属神龛，内供木雕妈祖像“船仔妈”（chuanzai ma）。船上特设“司香”（Incense Master）一职，确保航行期间香火不断，以此维系全船水手的精神士气。',
      archive:
        '【信标会内参：温和派造船档案】“神堂”的位置绝非随意设定。主桅杆后方正是整艘木制帆船应力最集中的震颤节点。那尊被称为“船仔妈”的木雕，其材质多选用密度极高的铁力木或沉香木。这实际上是一个质量阻尼器。当风暴来袭时，神像的微小位移能有效吸收并抵消桅杆传导下来的致命共振。所谓女神的庇护，是极其高明的力学工程。',
    },
    storyHooks: {
      protagonists: ['ernst'],
      factions: ['beacon_order', 'mazu_cult'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.east_asia', 'system.ship_remodel'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读(船仔妈神龛/司香)',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
      { level: 'L2', note: '主桅后“神堂”供“船仔妈”，专设司香 [6]' },
    ],
  },

  equip_luban_shrine: {
    id: 'equip_luban_shrine',
    names: { zh: '建橹班师父的神龛', en: 'Shrine of Master Ban the Oar-builder', ja: '建櫓班師父の神棚' },
    category: 'document',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '供奉工匠祖师鲁班（建橹班）的龙骨神龛，结构加固配件。',
    textLayers: {
      rumor:
        '想要你的福船在台风里不散架？去船底的龙骨旁边钉一个小神龛，里面供上“建橹班师父”。记住，不能叫他鲁班，得叫他建橹班！只要他老人家高兴，就算桅杆断了，你的船底也绝不会漏水。',
      record:
        '大明远洋帆船底部特有的小型神龛。供奉的并非海神，而是中国古代的工匠祖师鲁班。水手们巧妙地利用了“鲁”与表示船桨的“橹”字的谐音，将其尊为“建橹班师父”，相信这位工匠之神能保佑木制船体在惊涛骇浪中严丝合缝。',
      archive:
        '【信标会内参：温和派工程档案】东方水手的实用主义令人惊叹。这个所谓的神龛，通常被精确地安置在船只龙骨的应力形变临界点上。神龛内部的木质结构实际上是一个早期的形变指示器。当船体受到致命挤压时，神龛内的木牌会因摩擦发出刺耳的异响（被水手视为神明的警告），从而提前预警龙骨断裂。没有法术，只有极其高超的材料力学。',
    },
    storyHooks: {
      protagonists: ['ernst'],
      factions: ['ming_shipwrights'],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure'],
      crossLinks: ['port.quanzhou', 'port.fuzhou', 'system.ship_remodel'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读(建橹班师父祈祷文)',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
      { level: 'L2', note: '鲁班谐音“建橹班”融入航海保护神体系 [1,2]' },
    ],
  },

  item_baltic_amber_casket: {
    id: 'item_baltic_amber_casket',
    names: { zh: '北海琥珀之匣', en: 'Amber Casket of the Baltic', ja: 'バルト海の琥珀匣' },
    category: 'document',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '汉萨同盟传递绝密契约的琥珀公文匣，北海解密类宝物。',
    textLayers: {
      rumor:
        '吕贝克那些戴着高帽子的德国老商人，正眼巴巴地看着他们的商船被荷兰人挤出市场。听说他们把挽救同盟的最后秘密契约，装在了一个由整块波罗的海琥珀雕成的盒子里，正在秘密运往伦敦。',
      record:
        '一件奢华的波罗的海琥珀公文匣，内部带有复杂的黄铜机械锁。大航海时代早期，汉萨同盟的高级代理人常使用此类防潮防腐的贵重容器传递绝密商业契约。这件遗物见证了中世纪商业同盟在面对近代航海国家时的最终败退。',
      archive:
        '【信标会内参：极端派技术档案】琥珀不仅是奢侈品，更是绝佳的静电发生器与绝缘体。汉萨商人的工匠在盒壁内嵌了极细的磁性金属丝。这个盒子实际上是一个静电磁场保护匣，专门用来运输刻有高纬度地区地磁异常偏移数据的微型罗盘。新崛起的英国海军夺走了它，却将其当作首饰盒，愚昧至极。',
    },
    storyHooks: {
      protagonists: ['otto', 'pietro'],
      factions: ['beacon_order', 'hanseatic_league', 'english_crown'],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure'],
      crossLinks: ['port.lubeck', 'port.danzig', 'port.london'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '汉萨同盟商业契约保存习惯 [3]' },
      { level: 'L2', note: '但泽/柯尼斯堡琥珀垄断，16 世纪汉萨衰退 [3]' },
      { level: 'L5', note: 'L5 终局推演（基于 world-archive 综合，标注为推测）' },
    ],
  },

  item_yuegang_smuggling_permit: {
    id: 'item_yuegang_smuggling_permit',
    names: { zh: '月港私商特许状', en: 'Yuegang Smuggling Permit', ja: '月港私商特許状' },
    category: 'document',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '月港地方将领私发的“防倭水饷”凭证，半合法通行文书。',
    textLayers: {
      rumor:
        '想把船开进大明福建的港口？你得先准备好一箱银子，去买一张盖着红色大印的“防倭水饷”凭证。有了它，官军的战船就会对你睁一只眼闭一只眼，把你当成“良民”。',
      record:
        '一张来自大明福建海澄（月港）的非官方出海商帖。在帝国严厉的海禁政策下，地方豪绅与海防将领为了牟取暴利，私下向海商发放此类凭证。它是晚明东南沿海民间走私贸易极其繁荣的物证。',
      archive:
        '【信标会内参：温和派经济备忘录】大明皇帝以为他封锁了海洋，但这纸特许状证明了白银的流向是无法阻挡的。地方官员利用它建立了一个独立于中央的金融池，而本会正是通过大批量伪造和收购此类凭证，暗中维持着穿越宫古海峡的物资补给线。',
    },
    storyHooks: {
      protagonists: ['ali', 'joao'],
      factions: ['beacon_order', 'ming_local_officials', 'wokou'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['port.yuegang', 'port.sakai'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '明福建海澄（月港）地方志与“防倭水饷”凭证记录 [2]' },
      {
        level: 'L2',
        note: '海禁私商走私与通海凭证（Ming Gap 晚期禁令失效、私商勾结官员）',
        link: 'https://lirias.kuleuven.be/retrieve/802727',
      },
    ],
  },

  item_shunji_temple_tablet: {
    id: 'item_shunji_temple_tablet',
    names: { zh: '顺济庙赐匾与红衣幻影', en: 'The Smooth Crossing Tablet', ja: '順済廟の勅額と紅衣の幻影' },
    category: 'document',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '1122 路允迪海难见红衣女神、宋徽宗赐“顺济”匾的官方神迹。',
    textLayers: {
      rumor:
        '几百年前，大宋朝的钦差大臣在海上遇到飓风，八艘船沉了七艘。就在他闭眼等死的时候，桅杆上出现了一个穿红衣服的女人！风一下就停了。后来皇帝亲自写了“顺济”两个字挂在庙里，从那以后，出海的人都只拜这位红衣娘娘！',
      record:
        '记录着北宋宣和四年（1122年）给事中路允迪出使高丽遭遇海难的历史文献。路允迪声称在风暴中目睹红衣女神显灵，宋徽宗据此赐额“顺济”（Smooth Crossing）。这一事件标志着起源于福建莆田的妈祖（Mazu）信仰正式获得了朝廷的官方承认。',
      archive:
        '【信标会内参：温和派誊本】1122 年路允迪在东海风暴里看见的那位端坐桅头的红衣女神，本会以为不必动用任何神迹来解释——风暴之夜，桅杆尖端常有圣艾尔摩之火（St Elmo’s Fire）那样的尖端放电，泛着幽光；东海一带的飓风又每每搅起含发光浮游生物的水沫与气溶胶，被狂风裹挟、被桅顶的电晕牵引，在惊魂未定的人眼里聚成一团红影、隐约如人形，原是再寻常不过的海上光象。至于「风浪随即平息」，低压飓风的过境本就有眼壁与骤歇，绝处逢生的钦差自然把这一切归功于显灵的娘娘。宋徽宗据此赐「顺济」匾、朝廷由是收编了这位民间海神，这是一段可考的史实：皇权如何把民众的信仰纳入自己的秩序。本会留存此案，不为海底藏着什么机括，只为提醒同侪——许多被尊为神迹的，其实是大海如实的物理；而人心需要的，从来不只是解释，还有一个可以叩拜的名字。',
    },
    storyHooks: {
      protagonists: ['ernst', 'joao'],
      factions: ['beacon_order', 'mazu_cult'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.east_asia', 'faith.mazu', 'system.weather'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '《天妃显圣录》；1122 路允迪出使高丽官方航海记录' },
      { level: 'L2', note: '红衣女神显灵、宋徽宗赐“顺济”额、妈祖官方化' },
      {
        level: 'L4',
        note: '1122路允迪红衣幻影获赐顺济匾',
        link: 'https://en.wikipedia.org/wiki/Mazu',
      },
    ],
  },

  item_pateri_houseboat: {
    id: 'item_pateri_houseboat',
    names: { zh: '马来治愈彩船', en: 'Main Pateri Healing Houseboat', ja: 'マレー治癒の屋形船' },
    category: 'document',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '马来 Main Pateri 治愈仪式，雇巫师以音律屋船祛疾的港口事件。',
    textLayers: {
      rumor:
        '船上的人都病倒了？别给他们吃那该死的酸橘子了，去岸上找个马来巫师（Tok Pateri）。他会扎一艘漂亮的小屋船，敲起铜锣唱一晚上的歌。到了第二天早上，那些在甲板上等死的人就会奇迹般地爬起来吃烤肉！',
      record:
        '马来半岛古老的 Main Pateri 治愈仪式。萨满认为疾病由体内不同的“风”（Angin）失调引起。他们通过加美兰音乐、长篇的古老真言以及将疾病转移至带有祭品的微型屋船（Houseboat）中，来完成对疑难杂症的治疗。这种仪式往往持续三到七个夜晚。',
      archive:
        '【信标会内参：温和派医疗档案】医学界对 Main Pateri 的鄙夷源于无知。土著巫师敲击加美兰产生的特定节拍，配合长达数小时的高频咒语吟唱，实则是利用了心理暗示与特定声学频率。这种频率能有效刺激病患下丘脑，触发强烈的安慰剂效应与内啡肽分泌，从而在短时间内重启濒危海员崩溃的免疫系统。“风”不是神明，是神经递质的代名词。',
    },
    storyHooks: {
      protagonists: ['ernst', 'ali'],
      factions: ['beacon_order', 'malay_shamans'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['port.malacca', 'port.patani', 'system.disease'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '马来半岛及刁曼岛原住民口头传统与萨满仪式记录 [4-6]' },
      {
        level: 'L2',
        note: 'Main Pateri治愈仪式（加美兰音乐 + 屋船转移疾病）',
        link: 'https://scholarhub.ui.ac.id/cgi/viewcontent.cgi?article=1408&context=wacana',
      },
    ],
  },

  item_feline_shipmate: {
    id: 'item_feline_shipmate',
    names: { zh: '厄运免疫者：船猫', en: 'The Feline Shipmate', ja: '船乗り猫' },
    category: 'creature',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '各国船上公认带来好运的活体护身符，捕鼠与气压预警宠物。',
    textLayers: {
      rumor:
        '船上没有猫？那你就是在找死！老鼠吃光你的饼干还是小事，只有猫的眼睛能在漆黑的暴风雨里看到桅杆上是不是趴着死人的灵魂！',
      record:
        '无论在欧洲还是阿拉伯的商船上，“船猫”（Ship\'s Cat）都享有极高的地位。这是航海迷信中罕见的代表纯粹好运的象征。水手们深信，猫能预知天气的突变，并为船只带来顺风。',
      archive:
        '【信标会内参：温和派生物档案】水手赋予了猫魔法的属性，但这种依赖完全是基于生物学。猫消灭了携带瘟疫的鼠类，保护了脆弱的远洋补给。更关键的是，猫的内耳结构对气压的急剧下降极其敏感，这使它们能在风暴来临前表现出躁动。它们不是魔法师，它们是长着毛的活体气压计。',
    },
    storyHooks: {
      protagonists: ['joao', 'pietro'],
      factions: [],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure'],
      crossLinks: ['system.supply', 'system.weather'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '欧美及阿拉伯航海日志与航海传统' },
      { level: 'L2', note: '“船猫”作为罕见的好运活体护身符 [2]' },
      {
        level: 'L3',
        note: '船猫护身符民俗考据',
        link: 'https://www.sunsail.com/blog/old-sailors-superstitions',
      },
    ],
  },
};

export default relicData;
