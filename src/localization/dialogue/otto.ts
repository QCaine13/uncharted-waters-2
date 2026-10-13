import { ottoArmadaDialogue as d } from '../../story/content/arcs/otto/armada/dialogue';

const otto: Record<string, string> = {
  [d.londonCommission.matthewSummons]:
    '奥托舰长！亨利八世陛下召我们前往伦敦王宫，授予一项机密的海军委任。',
  [d.londonCommission.ottoPledge]:
    '西班牙的无敌舰队称霸海洋，而英格兰的舰队尚且年轻。凭着这份皇家私掠许可证，我们定要打造出一支足以打破其霸权的舰队！',
  [d.londonCommission.matthewReady]:
    '船长，我已经为伦敦码头的旗舰补给完毕。让我们南下塞维尔，直捣西班牙造船厂的心脏！',
  [d.sevilleInfiltration.matthewWhisper]:
    '船长，塞维尔造船厂的西班牙卫兵全都睡着了！快看——船台上正停泊着一艘崭新的西班牙大帆船。',
  [d.sevilleInfiltration.ottoCommand]:
    '真是献给英格兰王室的绝佳战利品！趁港口要塞还没拉响警报，砍断缆绳，立刻扬帆起航！',
  [d.ceutaSkirmish.ezequielWarning]:
    '英格兰的奥托·斯宾诺拉！你真以为从塞维尔盗走皇家大帆船后，还能逃过我们在休达的直布罗陀分舰队吗？',
  [d.ceutaSkirmish.ottoReply]:
    '埃泽奎尔司令！贵国的大帆船操控起来极为顺手——就让我们在实战中为您演示一下她的舷侧齐射吧！',
  [d.ceutaSkirmishRetry.recovery]:
    '我们退回休达港整修完毕。西班牙的直布罗陀分舰队依然封锁着海峡。',
  [d.ceutaSkirmishRetry.prompt]:
    '要从休达出击，再次迎战西班牙直布罗陀分舰队吗？',
  [d.ceutaSkirmishRetry.accept]: '推出火炮！今天我们一定要突破海峡！',
  [d.ceutaSkirmishRetry.defer]: '先在休达整备舰队，稍后再回码头出航。',
  [d.santoDomingoRaid.matthewScout]:
    '船长！西班牙的新大陆运宝船队正在圣多明尼各外海集结，船舱里装满了运往无敌舰队的白银与火炮！',
  [d.santoDomingoRaid.ottoOrder]:
    '要是让这批金银运回欧洲，英格兰面对的战舰数量将会翻倍。立即拦截船队，夺下他们的旗舰！',
  [d.santoDomingoRaidRetry.recovery]:
    '我们的船队在圣多明尼各重新集结。西班牙运宝船队仍在准备向东启航。',
  [d.santoDomingoRaidRetry.prompt]: '要从圣多明尼各出航，再次袭击运宝船队吗？',
  [d.santoDomingoRaidRetry.accept]:
    '全员就位！在他们驶离加勒比海之前发动突袭！',
  [d.santoDomingoRaidRetry.defer]: '先在圣多明尼各修理船只，稍后再回码头出航。',
  [d.nantesShowdown.ezequielChallenge]:
    '我们终于在南特外海主力相见了，奥托爵士！西班牙无敌舰队将在此地与你决出北海的霸权！',
  [d.nantesShowdown.ottoSpeech]:
    '稳住阵脚，英格兰的勇士们！今天我们要亲手粉碎无敌舰队的神话——全炮门自由射击！',
  [d.nantesShowdownRetry.recovery]:
    '我们的舰队已在南特港恢复元气。埃泽奎尔司令的无敌舰队仍在比斯开湾严阵以待。',
  [d.nantesShowdownRetry.prompt]: '要从南特出击，与无敌舰队展开决战吗？',
  [d.nantesShowdownRetry.accept]: '升起圣乔治十字旗！向胜利前进！',
  [d.nantesShowdownRetry.defer]: '先在南特整顿舰队，稍后再回码头迎战。',
  [d.londonTriumph.ezequielSalute]:
    '你展现出了真正的骑士风范，奥托·斯宾诺拉提督。即便战败，能与你交锋也是我的荣耀。',
  [d.londonTriumph.matthewCheer]:
    '船长，整个伦敦都在为你欢呼！随着无敌舰队被击溃，亨利国王正式册封你为皇家海军最高统帅！',
};

export default otto;
