// Trade-good lore entities (trade_*).
// Schema: see ./storyHooks.ts (canonical, from docs/3-narrative/samples/staff-of-the-saint.md §6).
// Prose source of truth: docs/lore/entities/<id>.md.
// DATA ONLY — not imported into game logic yet.
//
// archive triage (see docs/DECISIONS.md D7 — ancient-machine REJECTED):
//   [需改写-去机器] entries carry the literal placeholder string in textLayers.archive;
//   the original machine text is preserved verbatim in the .md file only.

import { Relic } from './storyHooks';

const tradeGoodData: Record<string, Relic> = {
  trade_brunei_tin_ingot: {
    id: 'trade_brunei_tin_ingot',
    names: { zh: '吉打锡币/锡锭', en: 'Kedah Tin Ingots', ja: 'ケダ錫貨/錫塊' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '15-16 世纪马来半岛特有的锡质硬通货，文莱沉船出水的区域信用货币。',
    textLayers: {
      rumor:
        '如果你想在文莱或者亚齐买到最上等的胡椒，光有西班牙的银币可不行。你得先去找本地商人换那种沉甸甸的、刻着奇怪花纹的锡块。',
      record:
        '15至16世纪马来半岛及周边广泛流通的锡质货币。它们不仅是商品，更是连接南中国海各个苏丹国与部落的金融命脉，大航海初期的贸易均以此为锚定物。',
      archive:
        '【信标会内参：温和派经济备忘录】欧洲人以为凭借火炮和白银就能控制香料，但东南亚本土的锡币系统是一堵无形的金融高墙。本会早年正是利用铸造这些锡锭的隐秘配方，在东南亚诸国中建立起了深厚的情报网。',
    },
    storyHooks: {
      protagonists: ['ali', 'pietro'],
      factions: ['beacon_order', 'southeast_asian_sultanates', 'european_monopoly_guilds'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['port.brunei', 'port.malacca', 'faction.beacon_order'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '文莱(1500)沉船锡锭货币',
        link: 'https://edspace.american.edu/silkroadjournal/wp-content/uploads/sites/984/2017/09/Brunei-Shipwreck.pdf',
      },
      { level: 'L2', note: '128 枚 15-16 世纪马来半岛锡币/锡锭 [9]' },
    ],
  },

  trade_manila_kraak_porcelain: {
    id: 'trade_manila_kraak_porcelain',
    names: { zh: '马尼拉的克拉克定制瓷', en: 'Manila Kraak Porcelain', ja: 'マニラのクラーク注文磁' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '景德镇为伊比利亚买家定制的欧洲器型青花瓷，太平洋大帆船贸易巅峰物。',
    textLayers: {
      rumor:
        '新西班牙的贵族们全疯了。他们用成吨的波托西白银，在马尼拉换取一种画着蓝花的盘子。听说大明的工匠专门照着欧洲酒壶的形状烧制它们，轻得像纸一样！',
      record:
        '打捞自 San Diego 号的特制青花瓷。器壁极薄，器型完全是为了适应欧洲人的餐饮习惯而定制的，但图案依然是中国传统的鹿与花卉。这是太平洋贸易巅峰期的标志物。',
      archive:
        '【信标会内参：温和派经济备忘录】当西班牙人以为他们用火炮和白银征服了世界时，东方的窑火正在用这种极具欺骗性的定制瓷器悄悄抽干美洲的银矿。这不仅仅是贸易，这是东方文明在未动一兵一卒的情况下进行的底层经济反制，而本会的远洋资金链正是借此网络在暗中洗白。',
    },
    storyHooks: {
      protagonists: ['pietro', 'ali'],
      factions: ['beacon_order', 'spanish_crown', 'ming_private_traders'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['port.manila', 'wreck.san_diego'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '1600 年 San Diego 号出水文物清单 [1,2]' },
      { level: 'L2', note: '景德镇为伊比利亚市场定制的混血“克拉克瓷” [2]' },
    ],
  },

  trade_swatow_porcelain: {
    id: 'trade_swatow_porcelain',
    names: { zh: '漳州窑“汕头器”飞禽纹盘', en: 'Swatow Ware with Duck Motif', ja: '漳州窯「汕頭器」' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '福建漳州私窑面向下沉市场量产的粗砂底青花瓷，利润率极高。',
    textLayers: {
      rumor:
        '想靠精美的景德镇瓷器发财？别傻了！现在马六甲最抢手的是那种底部粘着沙子的漳州盘子。虽然粗糙，但老百姓买得起，跑一趟能翻五倍的利润！',
      record:
        '西方人称为“汕头器”（Swatow）的中国南方民窑瓷器。为了追求极致的量产速度，窑工直接将瓷坯放在铺满粗砂的地上烧制，导致底部粘砂。它们以水禽和花卉纹为主，主打东南亚和欧洲的下沉市场。',
      archive:
        '【信标会内参：经济备忘录】底部的粗砂是东方民间资本冲破帝国管制的证明。当欧洲王室还在为高档瓷器惊叹时，这种廉价瓷器已经像病毒一样渗透了全球的平民贸易网。本会的诸多外围情报人员，正是伪装成这种廉价粗瓷的推销商在各国流窜。',
    },
    storyHooks: {
      protagonists: ['ali', 'pietro'],
      factions: ['beacon_order', 'ming_private_kilns'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['port.malacca', 'port.manila'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '1600 年 San Diego 号出水文物 [6]' },
      {
        level: 'L2',
        note: '菲律宾外销粗瓷研究（漳州私窑“砂垫法”量产下沉市场瓷）',
        link: 'https://journals.openedition.org/moussons/3529',
      },
    ],
  },

  trade_santacruz_defective_porcelain: {
    id: 'trade_santacruz_defective_porcelain',
    names: { zh: '圣克鲁斯异色青花瓷', en: 'Santa Cruz Atypical Blue-and-White', ja: 'サンタクルス異色青花' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '大明海禁时期需求井喷下，私窑次品也被投入出口的瑕疵青花瓷。',
    textLayers: {
      rumor:
        '想在马尼拉赚钱？别去等那些完美的景德镇官窑了。去黑市找那些颜色发灰、釉面有气泡的福建瓷盘。虽然长得丑，但南洋的土王们照样愿意用成箱的香料来换！',
      record:
        '一批打捞自 Santa Cruz 沉船的 15 世纪青花瓷。其特征是普遍存在烧制温度不均导致的釉面缺陷与发色异常。这印证了大明帝国实施“海禁”期间，海外市场极度饥渴，促使大量未经品控的民间私窑产品涌入南中国海。',
      archive:
        '【信标会内参：温和派经济备忘录】不要嘲笑这些瑕疵品。当大明的皇帝试图用一纸禁令封锁海洋时，正是这些带着气泡的粗劣瓷器维系着整个亚洲的白银与商品流转。它们是民间资本冲破帝国壁垒的粗糙切面，而我们的远洋情报网，正是靠着这些走私船得以存续。',
    },
    storyHooks: {
      protagonists: ['ali', 'pietro'],
      factions: ['beacon_order', 'ming_private_kilns'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['port.manila', 'wreck.santa_cruz'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: 'Santa Cruz 沉船（15 世纪中叶，海禁期）水下考古报告 [1]' },
      {
        level: 'L2',
        note: '圣克鲁斯瑕疵青花瓷分析（釉面缺陷与色彩变异，反映 Ming Gap 供需失衡）',
        link: 'https://www.nature.com/articles/s40494-023-00953-0',
      },
    ],
  },

  trade_champa_celadon: {
    id: 'trade_champa_celadon',
    names: { zh: '占婆亡国青瓷', en: 'Champa Celadon of Pandanan', ja: 'チャンパ亡国青磁' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '占婆王国覆灭前最后一批商船所载的青瓷，文明绝唱。',
    textLayers: {
      rumor:
        '你见过那种绿色的粗陶罐吗？卖它的人自称来自一个叫“占城”的古老王国。听说北方来的大军已经烧毁了他们的首都，这可能是他们运出来的最后一船货物了。',
      record:
        '15世纪中叶的占婆青瓷，发现于 Pandanan 沉船。由于明代海禁导致中国瓷器出口锐减，占婆和越南的窑口曾短暂地统治了南洋市场。这批青瓷品质上乘，被认为是占婆王国覆灭前最后的贸易遗存。',
      archive:
        '【信标会内参：极端派日志】大明帝国的贸易禁令不仅影响了白银，更间接导致了中南半岛的文明更迭。占婆试图用这些青瓷填补市场以换取军费，但失败了。这提醒我们，干预全球供应链的流向，就足以在不开一枪一弹的情况下抹除一个王国。这正是我们渴望掌握的力量。',
    },
    storyHooks: {
      protagonists: ['pietro', 'ernst'],
      factions: ['beacon_order', 'champa_kingdom', 'dai_viet'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['wreck.pandanan', 'region.indochina'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: 'Pandanan 沉船（约15世纪中叶）考古报告 [1]' },
      { level: 'L2', note: 'Ming Gap 期间占婆/越南瓷填补市场空白 [2]' },
    ],
  },

  trade_borneo_ancestral_jar: {
    id: 'trade_borneo_ancestral_jar',
    names: { zh: '婆罗洲祖灵陶罐', en: 'Borneo Ancestral Magic Jar', ja: 'ボルネオ祖霊の壺' },
    category: 'trade_good',
    darkLineLayer: 'L4',
    hookPriority: 'required',
    description: '婆罗洲部落将舶来陶罐神圣化为祖灵居所的传家圣物。',
    textLayers: {
      rumor:
        '在文莱的丛林里，如果你拿出一个普通的广东粗陶罐，那些浑身刺青的猎头族会跪下来亲吻它，甚至愿意用一整袋黄金来跟你换。他们说，那种罐子能把死人的灵魂装进去。',
      record:
        '打捞自文莱海域沉船的大型粗陶罐。对于婆罗洲的内陆部落来说，这些跨海而来的陶瓷容器极其罕见。它们脱离了最初的储物功能，被原住民整合进丧葬与魔法仪式中，成为象征部落权力与祖灵庇佑的传家圣物。',
      archive:
        '【信标会内参：温和派誊本】婆罗洲内陆部落肯用一整袋砂金去换一只广东粗陶罐，欧洲商贩当作不可思议的暴利，本会却以为这崇拜里藏着务实的道理。这些越洋而来的高温釉陶，胎体致密、釉面光洁、口可严封——在湿热的雨林里，它远比竹木、葛布更能隔绝潮气、虫蚁与霉腐，用来盛放骨殖、收藏圣物或封存种粮，实在是当地稀缺的耐久容器。一件能让祖先遗骨经久不坏的器皿，被尊为祖灵的居所、世代相传的传家宝，再自然不过：所谓「魔法」，多半是这层朴素的防腐与耐用，在没有窑业的部落眼中显出的神异。本会记录它，与失落王国的遗产并无关联，只为留住跨海陶器如何在异乡被赋予全新神圣意义这桩文化交融的实例——同一只罐子，在产地是寻常炊具，在雨林深处却成了沟通生死的圣器。',
    },
    storyHooks: {
      protagonists: ['ernst', 'pietro'],
      factions: ['beacon_order', 'borneo_tribes'],
      darkLineLayer: 'L4',
      fameTriggers: ['trade', 'adventure'],
      crossLinks: ['port.brunei', 'npc.borneo_headhunters'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '文莱(1500)沉船报告(祖灵陶罐)',
        link: 'https://edspace.american.edu/silkroadjournal/wp-content/uploads/sites/984/2017/09/Brunei-Shipwreck.pdf',
      },
      { level: 'L2', note: '婆罗洲部落对舶来陶罐的魔法/丧葬神圣化 [2]' },
    ],
  },

  trade_islamic_kendi: {
    id: 'trade_islamic_kendi',
    names: { zh: '景德镇伊斯兰纹军持', en: 'Islamic Motif Blue-and-White Kendi', ja: 'イスラム紋様の軍持' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '景德镇为穆斯林市场定制、绘伊斯兰几何纹的青花军持。',
    textLayers: {
      rumor:
        '你以为阿拉伯的大商人会喜欢画着中国龙的盘子？错啦！大明景德镇的窑工早就学会了把波斯地毯上的几何花纹画在青花瓷的酒壶上。只要带上一船这种壶去巴斯拉，你就能换回成箱的乳香！',
      record:
        '打捞自 Lena Shoal 沉船的 15 世纪明代青花瓷军持（Kendi Pouring Vessel）。其表面装饰着大量中东风格的“伊斯兰几何纹饰”（Islamic Motif）。这证明了在欧洲人到达之前，东亚与伊斯兰世界已经建立起了高度成熟、甚至支持深度定制的跨洋贸易网络。',
      archive:
        '【信标会内参：温和派经济备忘录】这不仅仅是商人迎合主顾的把戏。我们早年利用这些融合了伊斯兰神圣几何学的瓷器作为信息载体，绕过了大明帝国的海防审查。表面上，这些几何图形是中东的审美；但在信标会学者的眼中，它们是标示着印度洋隐秘安全航线与接头点的加密洋流图。',
    },
    storyHooks: {
      protagonists: ['ali', 'pietro'],
      factions: ['beacon_order', 'ottoman', 'ming_jingdezhen'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['wreck.lena_shoal', 'port.malacca'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: 'Lena Shoal(1490)军持瓷器图录',
        link: 'https://www.academia.edu/28280348/Identifying_Islamic_Motif_on_Chinese_blue_and_white_Porcelain_recovered_from_the_15th_century_shipwrecks_in_the_Philippines',
      },
      { level: 'L2', note: '景德镇为中东市场定制伊斯兰几何纹外销瓷 [4,6]' },
    ],
  },

  trade_annamese_monster_jar: {
    id: 'trade_annamese_monster_jar',
    names: { zh: '安南兽首青花罐', en: 'Annamese Blue-and-White Monster-Head Jar', ja: '安南獣首青花壺' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '大明海禁期越南窑口崛起、加模印兽首的本土青花罐。',
    textLayers: {
      rumor:
        '老兄，别在大明的水军眼皮底下走私景德镇的瓷器了！去占城或者交趾（越南），那里的工匠现在也能烧出蓝白相间的瓷罐。他们在罐子上捏了面目狰狞的怪兽脑袋，南洋的苏丹们对这种威风的罐子爱不释手！',
      record:
        '一件出水自文莱海域的 15 世纪末安南（越南）青花罐。大明帝国实施海禁导致的“明代断层”（Ming Gap），促使东南亚诸国的窑口迅速崛起。这件瓷罐在模仿中国青花技法的同时，肩部粗犷地模印了狰狞的兽首，展现了强烈的东南亚本土艺术风格与市场适应性。',
      archive:
        '【信标会内参：温和派经济备忘录】大明皇帝的禁海令没有饿死海商，反而硬生生催生了中南半岛的新兴工业。不过，安南工匠在罐子上加装凸起的兽首，并非纯粹为了美观。这些兽首突起增加了罐体厚度，改变了陶瓷在船舶底舱互相挤压时的受力结构，极大降低了远洋颠簸中的破碎率。这是一种极其粗糙却极具智慧的暴力抗压设计。',
    },
    storyHooks: {
      protagonists: ['ali', 'pietro'],
      factions: ['dai_viet', 'ming_empire'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['port.brunei', 'region.indochina'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '文莱(1500)沉船报告(安南兽首青花罐)',
        link: 'https://edspace.american.edu/silkroadjournal/wp-content/uploads/sites/984/2017/09/Brunei-Shipwreck.pdf',
      },
      { level: 'L2', note: 'Ming Gap 期间安南青花模印兽首本土风格 [11,12]' },
    ],
  },

  trade_twante_celadon_dish: {
    id: 'trade_twante_celadon_dish',
    names: { zh: '团特窑缅甸绿釉盘', en: 'Twante Green-Glazed Dish', ja: 'トワンテ窯ビルマ緑釉皿' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '大明海禁期缅甸团特窑接管南海陶瓷供应链的绿釉盘。',
    textLayers: {
      rumor:
        '马六甲的商人都说大明的皇帝封锁了海岸，买不到龙泉的青瓷了。别担心，去缅甸的勃固（Pegu），往南走有个叫团特的地方。那里的土窑现在也能烧出漂亮的绿盘子，而且价格只要大明瓷器的一半！',
      record:
        '一件发现于 16 世纪初文莱沉船的缅甸绿釉盘。曾被误认为泰国产品，后确认为缅甸团特（Twante）窑口制造。在大明严厉执行海禁的“明代断层”（Ming Gap）期间，缅甸与越南、泰国一起，接管了南中国海的陶瓷供应链。',
      archive:
        '【信标会内参：温和派誊本】这只曾被错认成泰国货、实则出自缅甸团特（Twante）窑口的绿釉盘，本身就是一桩无须任何神秘解释的经济史标本。大明厉行海禁的「明代断层」（Ming Gap）里，龙泉青瓷一时断供，南海市场出现了巨大的空缺；缅甸、越南、泰国的本土窑口顺势接管了这条陶瓷供应链，团特的炉火日夜不息，烧出的绿盘以大明瓷器一半的价钱填满了南洋诸王的餐桌。这是「制裁」催生替代产业、贸易网络自行改道的活教材——大明的缺席，恰成了周边窑业崛起的契机。本会留意它，与什么站点或涂层毫不相干，只为提醒同侪：所谓「正统」产地的中断，从不会让需求消失，只会把利润与手艺转移到别处。极端派惯于相信封锁能掌控一切；这只缅甸绿盘却说，水总会找到自己的出路。',
    },
    storyHooks: {
      protagonists: ['ali', 'ernst'],
      factions: ['beacon_order', 'burma_kilns'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['port.pegu', 'region.indochina'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '文莱(1500)沉船报告(缅甸团特绿釉盘)',
        link: 'https://edspace.american.edu/silkroadjournal/wp-content/uploads/sites/984/2017/09/Brunei-Shipwreck.pdf',
      },
      { level: 'L2', note: '成分分析确认缅甸团特窑口，填补 Ming Gap 市场' },
    ],
  },

  trade_javanese_bronze_gong: {
    id: 'trade_javanese_bronze_gong',
    names: { zh: '爪哇青铜锣', en: 'Javanese Bronze Gongs', ja: 'ジャワの青銅ゴング' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '东南亚部落视为财富与权力象征的青铜锣硬通货与礼器。',
    textLayers: {
      rumor:
        '满载大明瓷器去满者伯夷？你这外乡人真是不懂行情。在那群岛礁里，土王们更看重那些沉甸甸的爪哇青铜锣！一面敲得响的好锣，能换来一整座岛的香料采摘权！',
      record:
        '大航海时代早期东南亚海域的关键本土贸易品。沉船考古证明，除了瓷器，商船底舱常装载大量的锡锭、铜线与青铜锣。这些金属器具在婆罗洲和菲律宾的部落中被视作财富与权力的终极象征。',
      archive:
        '【信标会内参：温和派誊本】大明商贩笑话土王肯用成箱胡椒去换笨重的铜盘子，是只算了金属的斤两，没算它在群岛里的分量。在婆罗洲与菲律宾的部落中，青铜锣从来不是寻常乐器：一面音色醇厚的好锣，是土王身份的凭证、部落间议婚定盟的礼器、可代币流通的硬通货，铸锣的工艺与好锣的来历更被层层神圣化。它那浑厚悠长、能传出极远的低频锣声，在加美兰（Gamelan）合奏里被视作沟通祖先与神明的桥梁——人在那震彻胸腔的余韵里生出敬畏，本是声音之于人心最自然的感染，与海底是否有什么在共鸣毫不相干。本会记录它，与失落王国的遗产无涉，只为留住东南亚内部一张被「大航海只有香料与瓷器」的成见所遮蔽的繁荣金属礼器贸易网：在欧洲人到来之前，这片群岛早有自己的财富、自己的硬通货、自己的神圣之声。',
    },
    storyHooks: {
      protagonists: ['ali', 'ernst'],
      factions: ['beacon_order', 'majapahit', 'southeast_asian_sultanates'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade'],
      crossLinks: ['wreck.lena_shoal', 'wreck.brunei', 'region.java_sea'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: '文莱(1500)沉船报告(爪哇青铜锣)',
        link: 'https://edspace.american.edu/silkroadjournal/wp-content/uploads/sites/984/2017/09/Brunei-Shipwreck.pdf',
      },
      { level: 'L2', note: '铜锣作为东南亚硬通货与礼器（加美兰核心）' },
    ],
  },

  trade_lena_elephant_tusks: {
    id: 'trade_lena_elephant_tusks',
    names: { zh: '莱纳滩走私象牙', en: 'Lena Shoal Elephant Tusks', ja: 'レナ礁の密輸象牙' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: 'Lena Shoal 沉船所载、走私入大明的高价值象牙原木。',
    textLayers: {
      rumor:
        '听说巴拉望岛附近沉了一艘大船。别管那些碎瓷片了！船舱最底下压着几十根比人还高的象牙！只要能捞上一根偷偷运回大明，你下半辈子就可以在江南买座园子享福了！',
      record:
        '打捞自 15 世纪末 Lena Shoal 沉船的象牙原木。大航海时代早期的南中国海不仅流通着陶瓷和香料，同样存在着庞大且残酷的野生动物制品贸易。这些象牙通常由东南亚或印度洋沿岸产出，作为顶级奢侈品走私进入大明帝国。',
      archive:
        '【信标会内参：温和派誊本】奢侈品的流向，就是资本的流向。大明的贵族摩挲着精雕的象牙佛像与印章，多半不曾想，把这些象牙从东南亚内陆、从东非海岸一路偷运进帝国的走私网，有一段正握在本会手里。本会无意洗白这桩贸易：为满足远方帝国的贪欲，丛林里倒下了无数巨兽，这是用鲜血浇筑的生意。本会借这笔见不得光的暴利，在马六甲与月港之间悄然维系着一支不挂任何国王旗号、不受任何海关盘查的船队——它存在的理由，是为追索那些散落四海、随时可能被列强抢夺或损毁的失落王国遗存，留一条不受帝国掣肘的转运暗线。极端派主张干脆用这支船队垄断、劫夺遗产；我们温和派只想让它在风暴里护住几片残片、把它们安然送抵能被登记、被后世看见的地方。这堆象牙照见的，是全球化最初的血腥，也是本会自己难以摆脱的两难。',
    },
    storyHooks: {
      protagonists: ['ali', 'catalina'],
      factions: ['beacon_order', 'ming_luxury_market'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade', 'pirate'],
      crossLinks: ['wreck.lena_shoal', 'port.malacca', 'port.yuegang'],
      triggers: [],
      rewards: [],
    },
    sources: [
      {
        level: 'L1',
        note: 'Lena Shoal(1490)图录(底层象牙)',
        link: 'https://www.academia.edu/28280348/Identifying_Islamic_Motif_on_Chinese_blue_and_white_Porcelain_recovered_from_the_15th_century_shipwrecks_in_the_Philippines',
      },
      { level: 'L2', note: '15 世纪末南海野生动物制品（象牙）走私贸易' },
    ],
  },

  trade_potosi_quinto_silver: {
    id: 'trade_potosi_quinto_silver',
    names: { zh: '波托西“五一税”银锭', en: 'Potosi "Quinto Real" Silver Ingot', ja: 'ポトシ「五分一税」銀塊' },
    category: 'trade_good',
    darkLineLayer: 'L2',
    hookPriority: 'required',
    description: '打有西班牙王室“五一税”戳记的银锭，大帆船贸易硬通货。',
    textLayers: {
      rumor:
        '看到上面那个皇冠印记了吗？在波托西那座“吃人山”里挖出来的每一块白银，都要分出五分之一交给西班牙国王。听说他们要把这些银子装上大帆船，跨过整个大洋去换大明的丝绸。',
      record:
        '一块沉重的长条形银锭，表面打有西班牙王室的“五一税”（Quinto Real）戳记，证明其已合法纳税。这种银锭是马尼拉大帆船贸易的绝对硬通货，支撑着早期全球化贸易的运转。',
      archive:
        '【信标会内参：温和派经济备忘录】西班牙国王以为他用这 20% 的税金买下了半个欧洲，但他根本不明白货币超发的后果。我们正暗中引导这些印着皇家印记的白银疯狂涌入大明，用不了几十年，输入性通胀就会同时摧毁美洲的开采者和东方的接盘者，而我们只需在灰烬中重塑秩序。',
    },
    storyHooks: {
      protagonists: ['catalina', 'ali'],
      factions: ['beacon_order', 'spanish_crown'],
      darkLineLayer: 'L2',
      fameTriggers: ['trade', 'pirate'],
      crossLinks: ['route.manila_galleon', 'region.americas'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '西班牙帝国税收法案 Quinto Real 与大帆船贸易记录 [6,15]' },
      {
        level: 'L2',
        note: '马尼拉系统与波托西白银（波托西白银三分之一横跨太平洋流入亚洲）',
        link: 'https://lirias.kuleuven.be/retrieve/802727',
      },
    ],
  },

  trade_frobisher_fool_gold: {
    id: 'trade_frobisher_fool_gold',
    names: { zh: '巴芬岛的“愚人金”矿石', en: "Baffin Island 'Fool's Gold' Ore", ja: 'バフィン島の「愚者の黄金」' },
    category: 'trade_good',
    darkLineLayer: 'L3',
    hookPriority: 'required',
    description: '弗罗比舍误认为金矿运回英国的无价值角闪石/黄铁矿，企业欺诈。',
    textLayers: {
      rumor:
        '伦敦港的股票交易所彻底疯了！那个叫弗罗比舍的船长在冰天雪地的西北方挖到了一座金山！女王陛下亲自投资了他的船队。快去买他公司的股份吧，听说他们拉回来的黑色矿石，里面全都是纯金！',
      record:
        '1578 年由马丁·弗罗比舍从巴芬岛（Baffin Island）运回英国的矿石标本。这些曾引发全英国狂热投资、被误认为高纯度金矿的石头，最终被皇家冶炼厂证实为毫无价值的角闪石与黄铁矿。它标志着英国早期向美洲扩张时遭遇的一次惨痛金融与探险教训。',
      archive:
        '【信标会内参：温和派誊本】关于弗罗比舍那一千吨黑石头，本会的结论与皇家冶炼厂别无二致：那确确实实只是毫无价值的角闪石与黄铁矿——后者金灿灿、压手沉，恰是水手口中「愚人金」（Fool’s Gold），千百年来骗倒过无数贪心的眼睛。这桩闹剧里没有任何阴谋，也没有谁在暗中诱导：是伊丽莎白一世的英格兰急于追赶西班牙在新大陆的金银霸业，整个伦敦陷入了集体的财富臆想，连女王都拿真金白银押注一座并不存在的金山。它是早期股份制探险最惨痛的一记教训。本会之所以把这堆废石郑重存档，正因为它是一面镜子：当一群人被「那里有无尽财宝」的念头点燃，便会把矿渣看成黄金、把冻土看成宝库。本会内部，极端派同样为追索遗产而近乎癫狂——巴芬岛的教训，本会自己也当引以为戒：贪欲面前，最先被蒙蔽的，往往是最聪明的人。',
    },
    storyHooks: {
      protagonists: ['otto', 'ernst'],
      factions: ['beacon_order', 'english_crown', 'london_investors'],
      darkLineLayer: 'L3',
      fameTriggers: ['adventure', 'trade'],
      crossLinks: ['region.arctic', 'port.london'],
      triggers: [],
      rewards: [],
    },
    sources: [
      { level: 'L1', note: '1578 年弗罗比舍寻找西北航道的航海日志与财务记录' },
      { level: 'L2', note: '矿石最终证实为角闪石/黄铁矿，早期企业欺诈灾难' },
      {
        level: 'L4',
        note: '1578 Frobisher极地探险欺诈',
        link: 'https://en.wikipedia.org/wiki/List_of_shipwrecks_in_the_16th_century',
      },
    ],
  },
};

export default tradeGoodData;
