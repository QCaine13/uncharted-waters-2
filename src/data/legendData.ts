// Repeatable legend / event lore entities (legend_* and event_*).
// These are repeatable rumours / hazard events, modelled with category 'event'.
// Schema: see ./storyHooks.ts. Prose source of truth: docs/lore/entities/<id>.md.
// DATA ONLY — not imported into game logic yet.
//
// archive triage (see docs/DECISIONS.md D7 — ancient-machine REJECTED):
//   [需改写-去机器] entries carry the literal placeholder in textLayers.archive.

import { Relic } from './storyHooks';

const legendData: Record<string, Relic> = {
  legend_adamastor_storm: {
    id: 'legend_adamastor_storm',
    names: { zh: '阿达马斯托的狂怒', en: 'Wrath of Adamastor', ja: 'アダマストルの怒り' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '好望角风暴被具象化的神话巨人，葡萄牙突破印度洋的终极惩罚。',
    textLayers: {
      rumor:
        '别在起风的时候靠近好望角！我发誓，我在黑云里看到了一张巨大的、由岩石和闪电组成的人脸。它要把所有悬挂葡萄牙十字旗的船都拖进海底！',
      record:
        '自达伽马以来，无数满载香料的巨舰（如 São Bento 号）在好望角粉身碎骨。文人们将这片海域的极端洋流和风暴拟人化，称其为巨人“阿达马斯托”（Adamastor）的诅咒。',
      archive:
        '【信标会内参：极端派行动日志】好望角的磁场异常和恶劣气象是天然的防线。我们在里斯本的酒馆里刻意散播、放大了“阿达马斯托”的恐怖神话，以此来恐吓那些贪婪的冒险家。只要能阻止他们大规模进入印度洋发现“普世遗产”，沉几艘帆船的代价是值得的。',
    },
    storyHooks: {
      protagonists: ['joao', 'catalina'],
      factions: ['beacon_order', 'portuguese_crown'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['location.cape_of_good_hope', 'wreck.sao_bento'],
      triggers: [{ location: 'cape_of_good_hope' }],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '卡蒙斯《卢济塔尼亚人之歌》；1554 São Bento 沉没记录 [4,5,6,7]' },
      {
        level: 'L2',
        note: 'Adamastor巨人史诗渊源',
        link: 'https://www.ebsco.com/research-starters/literature-and-writing/lusiads-luis-de-camoes',
      },
    ],
  },

  legend_zaratan_island: {
    id: 'legend_zaratan_island',
    names: { zh: '萨拉坦的沉没', en: 'The Sinking Zaratan', ja: 'ザラタンの沈没' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '被误认为岛屿的巨型海龟/鲸，登岛生火会被拖入深海。',
    textLayers: {
      rumor:
        '如果在大洋中央看到一座长着棕榈树的岛屿，千万别急着上去抛锚生火！那根本不是岛，是萨拉坦！只要你的火把烫到它的背，它就会带着你和你的船一起沉进无底深渊！',
      record:
        '自中世纪起便流传于阿拉伯和欧洲水手间的传说。怪物“Zaratan”被描述为大到足以支撑整个生态系统的海龟或巨鲸。许多失踪的船只被归咎于误登了这种伪装成岛屿的生物。',
      archive:
        '【信标会内参：温和派誊本】萨拉坦（Zaratan）不是神罚，也不是谁布下的陷阱，它是几桩寻常海象在惊惧之心里叠成的怪影。大洋上时有覆满海藻、藤壶与火山浮石的庞然之物浮于水面：或是一头背覆生态、久浮不沉的巨鲸或巨龟，或是一片被洋流聚拢、连缀着浮石与漂木的「漂浮岛」。倦极思陆的水手把它认作小岛，登临、抛锚、生火——火灼之下，伏卧的巨兽受惊潜没，或浮石岛被涌浪一冲而散，于是连人带船一并没入深渊，幸存者归来便说那岛「活了」、把同伴拖下了海。这是博物学能够照亮的恐惧，与海底是否藏着什么、是否有什么在「清理入侵者」全不相干。本会记录它，只为留住这条朴素的道理：大洋里最骇人的怪物，往往是航海者把自己不解的生灵与地质，拼成了一座会沉的岛。',
    },
    storyHooks: {
      protagonists: ['ernst', 'catalina'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.indian_ocean', 'bestiary.zaratan'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '阿拉伯航海神话与欧洲中世纪动物传兽集巨龟传说 [4,5]' },
      { level: 'L2', note: '水手误认岛屿生火致怪物潜海的传说母题 [6,7]' },
      {
        level: 'L3',
        note: 'Zaratan伪装岛屿传说解构',
        link: 'https://news.harvard.edu/gazette/story/2024/10/diving-into-the-myths-and-legends-behind-sea-monsters/',
      },
    ],
  },

  legend_mazu_taboo: {
    id: 'legend_mazu_taboo',
    names: { zh: '绝境中的“妈祖”呼唤', en: "Taboo of Mazu's Formal Titles", ja: '媽祖の忌み名の禁忌' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '海难绝境严禁用“天后/天妃”尊称，只能直呼“妈祖”的禁忌。',
    textLayers: {
      rumor:
        '记住了，起大风浪的时候，千万别喊“天后娘娘救命”！你得用最大的力气喊“妈祖”！你喊天后，她老人家还得回宫里换衣服戴皇冠，等你淹死了她都没下凡！',
      record:
        '南中国海域一项奇特的航海禁忌。在紧急情况下，船员被严禁使用天妃、天后等官方尊称来祈祷。他们认为这会迫使女神换上正式的朝服而延迟援助；相反，直接呼唤“妈祖”能换来如母亲般迅速的解救。',
      archive:
        '【信标会内参：温和派誊本】西方人觉得「神明还要换衣化妆」的说法荒谬，是没听懂这条禁忌真正在说什么。绝境里只许直呼「妈祖」、不许用「天后」「天妃」这些朝廷尊封，道理朴素得很：尊号唤起的是高踞庙堂、需正冠才肯现身的女神，「妈祖」（意为母亲）唤起的，却是听见孩子惨叫便会赤脚奔来的母亲——危难当头，人要的不是一位威严的神祇，而是一位会立刻冲过来的至亲。从声口上说，「妈—祖」两个短促音节，确也比绵长的官称更容易在台风的轰鸣里喊得出、传得开，几十人齐声呼喊时尤其如此；但这只是它好用的缘由，不是海底有什么在应答。这条禁忌真正保存下来的，是民间信仰里一桩动人的事：百姓把至高的海神，亲手改写成了自己的母亲。本会记录它，不为追究什么频率，只为它道破了人神之间最柔软的那层关系。',
    },
    storyHooks: {
      protagonists: ['ali', 'ernst'],
      factions: ['beacon_order', 'mazu_cult'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.south_china_sea', 'faith.mazu'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '明代以来道教航海科仪手稿与闽粤民俗记录' },
      {
        level: 'L2',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读(绝境不呼官称禁忌)',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
    ],
  },

  legend_nao_de_china_route: {
    id: 'legend_nao_de_china_route',
    names: { zh: '“中国船”的太平洋暗流', en: 'The "Nao de China" Pacific Route', ja: '「ナオ・デ・チナ」太平洋航路' },
    category: 'event',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '马尼拉—阿卡普尔科大帆船航线，亚洲商品直连美洲白银。',
    textLayers: {
      rumor:
        '新西班牙的商人们都在盼着那艘被叫做“Nao de China”（中国船）的巨大帆船靠岸。听说它要在大洋上漂泊半年！只要船长找准了那股神秘的向东吹的风，一船的丝绸就能换回整座山的白银。',
      record:
        '马尼拉大帆船（Galeón de Manila），又称“中国船”，是横跨太平洋的皇家贸易船队。它们将亚洲（主要是明朝）的奢侈品运往美洲，再将海量的新大陆白银运回马尼拉。这条航线的发现，奠定了长达两个多世纪的早期全球化经济基础。',
      archive:
        '【信标会内参：温和派誊本】西班牙人自夸是他们「发现」了这条向东折返的跨洋航路，其实他们摸索出的，不过是北太平洋那股早已存在的黑潮（Kuroshio）暖流与高纬西风——大洋的脉络本就在那里，谁肯一次次拿性命去试，谁就能读懂它。「中国船」（Nao de China）由此把马尼拉的大明丝绸瓷器与阿卡普尔科的新大陆白银直接系在一起，跨过了欧洲本土，铸成人类第一条真正环球的贸易纽带。本会留意这条航路，与什么遗产的「能源」毫不相干：散落四海的失落王国遗存，原也是顺着这类季风与洋流，在各文明间漂流、辗转的；当美洲的白银、大明的瓷器、印度洋的香料第一次在同一条航线上彼此交换，那些被各自供奉了几百年的残片，也就被商路一片片送到了彼此眼前。极端派想垄断这条银线、借它的财富抢先搜罗遗产；我们温和派只想如实把它记下来——因为这条航路真正的分量，在于它头一回让相隔半个地球的人，发现自己原来共用着同一片大洋。',
    },
    storyHooks: {
      protagonists: ['catalina', 'ernst'],
      factions: ['beacon_order', 'spanish_crown'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade', 'adventure'],
      crossLinks: ['port.manila', 'port.acapulco', 'region.pacific'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '1565-1815 年马尼拉大帆船贸易航线 [8]' },
      {
        level: 'L2',
        note: '马尼拉大帆船太平洋航线研究（满载明朝丝绸瓷器故称“Nao de China”）',
        link: 'https://scholarspace.manoa.hawaii.edu/items/42c9c452-629f-4ab9-89b9-969e363c4769',
      },
    ],
  },

  legend_banana_curse: {
    id: 'legend_banana_curse',
    names: { zh: '航海禁忌：厄运芭蕉', en: 'The Banana Curse', ja: 'バナナの呪い' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '西方水手恐惧香蕉上船招致厄运/暴毙的著名航海迷信。',
    textLayers: {
      rumor:
        '把那串黄色的恶魔果实给我扔下船！你疯了吗？！你没听说过上个月从几内亚回来的那艘船吗？全船人都死光了，只剩下一底舱烂掉的香蕉！这东西会招来海神的诅咒！',
      record:
        '帆船时代最诡异也最严格的迷信之一：严禁将香蕉带上远洋商船。水手们坚信香蕉会带来厄运，因为历史上有太多装载香蕉的船只遭遇了食物腐败、火灾或船员离奇暴毙的惨剧。',
      archive:
        '【信标会内参：温和派生物档案】水手口中的“诅咒”实为基础的生化反应。香蕉在成熟过程中会释放大量的乙烯气体（Ethylene gas），在通风极差的木制帆船底舱中，乙烯会加速周围所有其他补给的腐烂，导致致命的败血症爆发。此外，香蕉串是剧毒的热带游走蛛（Wandering Spider）最爱的栖息地，夜间爬出的毒蜘蛛才是那些离奇暴毙的真凶。迷信，只是无知者对自然法则的战栗。',
    },
    storyHooks: {
      protagonists: ['catalina', 'ernst'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.caribbean', 'region.west_africa', 'system.crew_morale'],
      triggers: [{ item: 'tropical_fruit_cargo' }],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '欧美帆船时代“十大航海迷信”之一 [6,7,10]' },
      { level: 'L2', note: '香蕉招厄运/暴毙的迷信（乙烯/毒蜘蛛细节需独立核实）' },
      {
        level: 'L3',
        note: '厄运芭蕉禁忌考据',
        link: 'https://www.oldsaltcoffee.com/blogs/deck-log/no-bananas-no-whistling-no-problem-10-nautical-superstitions-that-refused-to-die',
      },
    ],
  },

  legend_scratching_backstay: {
    id: 'legend_scratching_backstay',
    names: { zh: '刮后支索唤风', en: 'Scratching a Backstay', ja: '後部支索を掻く' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'optional',
    description: '无风带里刮擦后支索以“唤来顺风”的西方水手迷信。',
    textLayers: {
      rumor:
        '船已经五天没动了，淡水桶里都长了绿毛。去，拿把刀子，去主桅杆后面轻轻刮那根最粗的缆绳！老水手都说，只要顺着你想去的方向刮，风就会跟着你的刀尖刮过来！',
      record:
        '西方风帆时代一项经典的“唤风”迷信。由于在无风带（Doldrums）滞留意味着败血症与饥渴的死神降临，绝望的水手们迷信地认为，刮擦支撑主桅的“后支索”（Backstay）能够奇迹般地召唤来顺风。',
      archive:
        '【信标会内参：温和派誊本】刮后支索唤风，几乎全是无风带绝境里的一桩心理慰藉，本会以为不必为它强寻什么玄机。船在赤道无风带一连数日动弹不得，淡水生绿、败血症与饥渴步步逼近，绝望的水手总要找件事做——用刀尖顺着想去的方向轻刮那根绷紧的、涂着焦油的后支索，便是把无处安放的焦虑收进一个有方向、有指望的动作里，叫人不至于在死寂中疯掉。至于风偶尔当真起了，那是无风带本就反复无常：它边缘的气流随时在变，刮不刮缆绳都一样。把这偶然的顺风记成「唤来的」，不过是绝处求生的人最自然的幸存者错觉。本会留存此条，与海上的任何异常都无干系，只为记下风帆时代水手面对无风之死时，那一点近乎悲凉的自我安慰——人在彻底的无力面前，仍要为自己留一桩可做的事。',
    },
    storyHooks: {
      protagonists: ['joao', 'catalina'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.doldrums', 'system.crew_morale', 'system.weather'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '欧美风帆时代航海迷信记录' },
      { level: 'L2', note: '无风带刮后支索“唤风”的迷信母题' },
      {
        level: 'L3',
        note: '刮后支索唤风迷信考据',
        link: 'https://www.sunsail.com/blog/old-sailors-superstitions',
      },
    ],
  },

  legend_malay_penanggal: {
    id: 'legend_malay_penanggal',
    names: { zh: '马来飞头蛮诅咒', en: 'Curse of the Penanggal', ja: 'ペナンガルの呪い' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '夜间飞行、头颅带内脏的马来恶灵，红树林夜航恐怖事件。',
    textLayers: {
      rumor:
        '晚上睡觉把船舱的缝隙都给我堵死！如果你在马六甲的红树林边闻到一股浓烈的血腥味，那就是“Penanggal”来了！那是一颗挂着滴血肠子在天上飞的女人头，专门吸活人的血！',
      record:
        '马来文化中最著名的灵异传说之一（Penanggalan）。相传由修炼黑巫术走火入魔的女性变成。其夜间游荡、头颅与内脏与身体分离的诡异形象，构成了前殖民时代东南亚沿海渔民和水手最深层的集体梦魇。',
      archive:
        '【信标会内参：温和派誊本】飞头蛮（Penanggal）的恐怖，是黑夜、瘴疠与无知合谋的产物，与巫术无关，也与海底的任何东西无关。本会在马六甲海峡的红树林深处见过这一带特有的大型夜行吸血蝠蛾：它腹下有半透明的储血囊，受惊或求偶时透出微弱的生物荧光——这本是红树林湿热环境里寻常的发光现象。试想一名水手深夜泊船红树林边，舱中已有人染上产褥热或疟疾、缠绵血污，恰逢一只拖着荧光血囊的飞蛾扑面掠过：恐惧会替他把零碎的影像拼成一颗挂着肠子、滴着血飞行的女人头。把孕妇与婴儿的失血之厄归咎于一个会飞的恶灵，是前殖民时代沿海渔民对难产、寄生虫病这些无从理解的死亡，所能找到的一种解释。本会记录它，不为追查什么泄露或防线，只为留住这条提醒：传说里最骇人的怪物，往往是人对疾病与黑暗的恐惧，借一只寻常生灵显了形。',
    },
    storyHooks: {
      protagonists: ['ali', 'ernst'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.malacca_strait', 'system.disease', 'bestiary.penanggal'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '马来世界鬼神民俗（Ghostlore）' },
      { level: 'L2', note: '飞头蛮（Penanggal）夜飞头颅内脏吸血传说' },
      {
        level: 'L4',
        note: '飞头蛮Penanggalan传闻',
        link: 'https://en.wikipedia.org/wiki/Ghosts_in_Malay_culture',
      },
    ],
  },

  event_whistling_storm: {
    id: 'event_whistling_storm',
    names: { zh: '唤风的口哨', en: 'The Whistling Wind Taboo', ja: '口笛の禁忌' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'optional',
    description: '甲板吹口哨会“唤醒风暴”的西方航海禁忌，士气事件。',
    textLayers: {
      rumor:
        '闭嘴，新来的！把你的嘴唇缝上！在甲板上吹口哨，风神会以为你在挑战他。上一个这么做的白痴，第二天就把全船带进了一场卷走主桅杆的飓风里！',
      record:
        '西方风帆时代最根深蒂固的航海迷信之一。各国海军与商船均有不成文的规定：严禁水手在海上吹口哨，因为这被认为会“召唤风暴”。唯一被允许吹口哨的是船上的炊事兵，因为只要他在吹口哨，就证明他没有偷吃食物。',
      archive:
        '【信标会内参：温和派誊本】「吹口哨会唤来风暴」，根子全在人心，与海上的任何异常无干。一支船队孤悬大洋，性命系于风之有无，水手便把这份无从掌控的焦虑，统统投向了喜怒无常的「风神」：吹哨是轻佻的挑衅，触怒了他便招来灭顶之灾。这是一种典型的幸存者错觉——成千上万次甲板上的口哨之后什么也没发生，无人记得；偏偏某次哨声后果真起了风暴，便被人牢牢记住、辗转相传，禁忌就此铸成。至于唯独炊事兵获准吹哨，更是把禁忌用作了管理之术：只要哨声不断，便知他没在偷吃。本会留存此条，与磁场、共振之类毫不相干，只为记下风帆时代水手的精神图景：在孤立无援的深海里，人需要给不可控的命运安一个可触怒、也可安抚的名字，好让恐惧有处安放。',
    },
    storyHooks: {
      protagonists: ['joao', 'otto'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['system.crew_morale', 'system.weather'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '欧美帆船时代航海禁忌（Nautical superstitions）[8,9]' },
      { level: 'L2', note: '严禁吹口哨“whistling up a storm”的迷信 [8,9]' },
      {
        level: 'L3',
        note: '唤风口哨禁忌考据',
        link: 'https://www.oldsaltcoffee.com/blogs/deck-log/no-bananas-no-whistling-no-problem-10-nautical-superstitions-that-refused-to-die',
      },
    ],
  },

  event_pawang_crocodile_lure: {
    id: 'event_pawang_crocodile_lure',
    names: { zh: '帕旺的巨鳄寻物', en: "Pawang's Crocodile Retrieval", ja: 'パワンの巨鰐回収' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '马来巫师召唤巨鳄从深水寻回失物的灵异寻物事件。',
    textLayers: {
      rumor:
        '你的金表掉进彭亨河里了？别找白人潜水员，去红树林里找个叫“帕旺”（Pawang）的巫师。他只要在岸边念几句咒语，第二天就会有一条三丈长的鳄鱼游过来，把你的表吐在沙滩上！',
      record:
        '马来半岛一种奇特的萨满（Pawang）仪式。据文献记载，巫师通过念诵祈求水魔的真言，能够召唤特定的大型鳄鱼。当地人深信，这些巨鳄受巫师驱使，能够从浑浊的深水中找回失落的物品，甚至是极为细小的铁针。',
      archive:
        '【信标会内参：温和派誊本】欧洲人把帕旺（Pawang）召鳄寻物斥为东方魔术，是既不懂河，也不懂人。彭亨、吉打的河口红树林本就是巨鳄的领地，世代与水为生的 Pawang 比谁都熟悉它们的脾性：哪个深潭住着哪条老鳄、它何时巡游、嗅得见何种气味、会被河岸何处的动静引来——这是一整套靠观察与禁忌累积下来的在地知识，被庄重地包进祈水神的真言里。一件金表沉入浑浊的深水，潜水的番人找不着，惯于在河底翻搅觅食的巨鳄却可能把它连泥带物拱上浅滩；Pawang 知道在何处、以何法诱使它来，于是「巨兽衔物而还」的奇迹便成了。这里没有受什么污染而变异的怪鳄，也没有可号令生灵的秘术，只有一个民族与最凶猛的邻居长久周旋所磨出的本事。本会记录它，不为追查什么控制之法，只为它提醒我们：被斥为「巫术」的，常常不过是别处的人比我们更深地读懂了自己的土地。',
    },
    storyHooks: {
      protagonists: ['pietro', 'ali'],
      factions: ['beacon_order', 'malay_pawang'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.pahang', 'system.salvage'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '马来彭亨/吉打地区 Pawang 口述传统 [7]' },
      {
        level: 'L2',
        note: '召唤鳄鱼巫术（巫师念真言召鳄寻回失物）',
        link: 'https://scholarhub.ui.ac.id/cgi/viewcontent.cgi?article=1408&context=wacana',
      },
    ],
  },

  event_dugong_patrol: {
    id: 'event_dugong_patrol',
    names: { zh: '齐州洋的都公神影', en: 'Lord Du of the Qizhou Sea', ja: '七洲洋の都公神影' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '七洲洋险海须抛彩船呼唤水神“都公”护航的高危环境事件。',
    textLayers: {
      rumor:
        '船长，前面就是七洲洋了！快让人扎好纸船扔下去，然后大喊“都公上船”！那是当年跟着三宝太监下西洋死在那里的老水手。如果你不请他上船掌舵，海水底下就会有巨大的漩涡把我们吞进去！',
      record:
        '南海七洲洋（海南岛东南部）一带特有的航海迷信。文献如《顺风相送》明确指示，航经乌猪岛等海域时必须向一位被称为“都公”（Lord Du）的水神祈祷，并在过境后施放彩船送神。此地水文复杂，事故频发，催生了这一带有强烈安抚性质的祭祀。',
      archive:
        '【信标会内参：温和派誊本】七洲洋（海南岛东南）确是吃人的险海，但杀人的是水文，不是海底的什么机括。这一带暗礁错列、急流交汇、季风季节风暴频仍，《顺风相送》等针经都郑重提醒过往船只在此格外当心——事故频发，本就是它该有的名声。至于水手口中那位「登船掌舵的老水手」都公：远洋帆船上的人长期睡眠不足、惊惧交加，又困在风浪的低频轰鸣与单调摇曳里，本就容易生出幻视与幻听；一船人共处同一份恐惧，一人说「看见了」，旁人也就跟着「看见了」，于是那位据说随郑和下西洋、殉身此海的老水手，被众人的心一同请上了船。抛放彩船、齐呼「都公上船」，真正起的作用是把濒临崩溃的船心重新拢住，叫人各司其职、不致在恐慌里自乱。本会记录它，与海底是否藏着什么无关，只为它道出险海上人心如何把一段集体的恐惧，供成了一位护航的神。',
    },
    storyHooks: {
      protagonists: ['ali', 'joao'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.qizhou_sea', 'region.south_china_sea'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读(七洲洋都公神影)',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
      { level: 'L2', note: '七洲洋须祭“都公”水神的航海迷信 [3]' },
    ],
  },

  event_hua_shuixian: {
    id: 'event_hua_shuixian',
    names: { zh: '划水仙仪式', en: 'Ritual of Rowing the Water Immortals', ja: '划水仙の儀' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '台风倾覆绝境中全船蹲下假装划桨齐吼求生的闽南仪式。',
    textLayers: {
      rumor:
        '如果船快沉了，桅杆断了，别去抱木板！跟着大明的老水手一起蹲在甲板上，手里假装拿着桨，用最大的力气喊着划水！只要你们喊得够齐，“水仙”就会从海底把你们的船托起来！',
      record:
        '闽南水手在绝境中使用的“划水仙”（Rowing of the Water Immortals）仪式。当船只即将倾覆时，全船人会模仿划龙舟的动作并齐声呼喊。这被认为能召唤五位水仙尊王前来平息怒涛。',
      archive:
        '【信标会内参：温和派心理分析】“水仙”并不存在。但在台风的极端摇晃下，全船水手统一蹲低身子，极大降低了船只的重心；而“划水”的齐声嘶吼与规律动作，强制让陷入恐慌的船员建立起心理上的统一焦点，避免了踩踏和骚乱。这并非神明的托举，而是纪律与力学在绝境中的极致闪光。',
    },
    storyHooks: {
      protagonists: ['ali', 'ernst'],
      factions: ['beacon_order'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.south_china_sea', 'system.crew_morale', 'system.weather'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '大英图书馆藏OR12693/18《安船酌献科》解读(划水仙仪轨)',
        link: 'https://www.mdpi.com/2077-1444/15/9/1096',
      },
      { level: 'L2', note: '“划水仙”紧急求生仪式 [1]' },
    ],
  },

  event_hallaniyah_warning: {
    id: 'event_hallaniyah_warning',
    names: { zh: '哈拉尼亚渔民的警告', en: 'The Al Hallaniyah Warning', ja: 'ハッラーニヤ漁師の警告' },
    category: 'event',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '葡萄牙人无视阿拉伯渔民风暴警告致 Esmeralda 号覆灭的事件。',
    textLayers: {
      rumor:
        '那些傲慢的葡萄牙人！当年达伽马的叔舅就停在我们的岛外，村里的老渔民告诉他“黑云吃月”，风暴马上就来，让他们赶紧进港。他居然骂我们是骗子，结果第二天，他的战舰连一块完整的木板都没剩下！',
      record:
        '1503 年 Esmeralda 号在阿曼哈拉尼亚岛覆灭的灾难记录。尽管随船日志佚失，但多方史料印证，葡萄牙指挥官曾收到当地阿拉伯渔民关于夏季极端季风的明确警告。欧洲征服者对本土海洋知识的傲慢与轻视，是导致这次早期航海灾难的直接原因。',
      archive:
        '【信标会内参：温和派地理备忘录】这场沉没被伪装成了自然灾害，但其实是本会阿拉伯分部的一次成功干预。当地的渔民（我们的外围眼线）给出的警告，实则是心理学上的“逆反诱导”。他们深知葡萄牙指挥官极其自大，越是警告危险，对方就越会为了彰显武力而原地驻扎。我们借季风之手，除掉了这艘威胁本会中东补给线的旗舰。',
    },
    storyHooks: {
      protagonists: ['joao', 'ali'],
      factions: ['beacon_order', 'portuguese_crown', 'omani_fishermen'],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure'],
      crossLinks: ['port.al_hallaniyah', 'wreck.esmeralda', 'system.weather'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '同报告(阿曼渔民风暴警告)',
        link: 'https://www.academia.edu/34557728/THE_ESMERALDA_SHIPWRECK_OFF_AL_HALLANIYAH_ISLAND',
      },
      { level: 'L2', note: '1503 年葡萄牙指挥官无视阿拉伯渔民季风警告' },
    ],
  },

  item_iban_gawai_batu: {
    id: 'item_iban_gawai_batu',
    names: { zh: '伊班族播种石祭', en: 'Iban Gawai Batu Ritual', ja: 'イバン族の播種石祭' },
    category: 'event',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '婆罗洲伊班族播种前的石祭仪式，参与可解锁内陆村落。',
    textLayers: {
      rumor:
        '别在六月份去惹那些婆罗洲的猎头族！那时候他们正忙着办“石祭”。所有的萨满都在一边挥着公鸡一边唱歌。如果你敢在那时候踩坏了他们的旱稻田，你的脑袋第二天就会被挂在长屋的门口！',
      record:
        '婆罗洲伊班族（Iban）特有的“石祭”（Gawai Batu）仪式记录。在旱稻播种季，部落萨满会通过复杂的供奉和真言吟唱（Mantera），召唤名为“Petara”的祖灵与农业神，以确保农作物免受病虫害并获得大丰收。这是东南亚内陆农耕文化的典型代表。',
      archive:
        '【信标会内参：温和派誊本】欧洲探险家看见伊班人对着几块石头唱歌杀鸡，便断言是不可理喻的野蛮，这是把自己的无知当成了对方的愚昧。「石祭」（Gawai Batu）所守护的，是一套在严酷雨林里真正管用的农时知识：那段冗长真言并非空咒，它把何时翻土、何时播种、何时祭献的节令一字不差地锁进韵律，使部落世代不致误了旱稻的时令；公鸡之血、石上的供奉，则把这套农业历法郑重托付给祖灵 Petara，让它在没有文字的部落里代代不失传。所谓「神力」，不过是被神话妥帖保存下来的农耕智慧与对土地的长久观察。本会记录它，与失落王国的遗产并无干系，只为留住一件朴素的证据：在远离海岸的雨林深处，人类同样发展出了精密而自洽的知识——值得登记、值得尊重，而非作为「蛮荒」一笔带过。',
    },
    storyHooks: {
      protagonists: ['ernst', 'ali'],
      factions: ['beacon_order', 'iban_dayak'],
      darkLineLayer: 'L4',
      fameTriggers: ['adventure'],
      crossLinks: ['region.sarawak', 'npc.iban_manang'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '砂拉越伊班族口述传统及萨满吟唱文献' },
      { level: 'L2', note: 'Gawai Batu 石祭与 Petara 祖灵农神信仰' },
      {
        level: 'L3',
        note: '伊班族本土仪式档案',
        link: 'https://pemetaanbudaya.jkkn.gov.my/en/senibudaya/detail/850',
      },
    ],
  },
};

export default legendData;
