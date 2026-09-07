// Source strings remain the English presentation, alongside the existing UI
// vocabulary. Keep action labels distinct from banking and item-stat labels.
const combatCatalog: Record<string, string> = {
  'Attack move': '攻击招式',
  'Defense move': '防御动作',
  Duel: '决斗',
  'Naval battle': '海战',
  'Antonio Kahn': '安东尼奥·卡恩',
  'Katarina Erantzo': '卡特琳娜·艾兰茨',
  'Kahn at the shipyard': '船厂的卡恩',
  'Kahn at the Franco house': '宅邸的卡恩',
  'Katarina’s pursuit': '卡特琳娜的追击',
  'Round {round}': '第 {round} 回合',
  'HP {current}/{maximum}': '生命 {current}/{maximum}',
  'Battle level {level}': '战斗等级 {level}',
  'Battle log': '战斗记录',
  Battle: '战斗',
  'Your move': '选择你的行动',
  'Choose your attack': '选择攻击招式',
  'Choose your defense': '选择防御方式',
  Thrust: '突刺',
  Slash: '挥砍',
  'Heavy strike': '重击',
  Parry: '招架',
  Block: '格挡',
  Dodge: '闪避',
  'Opponent’s defense: {defense}': '对手防御：{defense}',
  'Incoming attack: {attack}': '对手将要使出：{attack}',
  'Parry stops thrusts. Block stops slashes. Dodge stops heavy strikes.':
    '招架可挡住突刺，格挡可挡住挥砍，闪避可避开重击。',
  'Avoid the attack your opponent is prepared to stop.':
    '观察对手的姿态，避开他正在防备的招式。',
  'Ten rounds without a winner end in a draw.':
    '十回合仍未分出胜负，本次决斗以平局结束。',
  'Battle experience': '战斗经验',
  'Weapon: {name}': '武器：{name}',
  'Armor: {name}': '防具：{name}',
  'No weapon equipped': '尚未装备武器',
  'No armor equipped': '尚未装备防具',
  'Fencing swords favor thrusts; heavy swords favor heavy strikes; straight and curved swords favor slashes.':
    '刺剑擅长突刺，重剑擅长重击，直剑与弯刀擅长挥砍。',
  'Your flagship': '我方旗舰',
  'Enemy flagship': '敌方旗舰',
  'Hull {current}/{maximum}': '耐久 {current}/{maximum}',
  'Crew {count}': '船员 {count}',
  'Cannon shot {count}': '炮弹 {count}',
  'Repair lumber {count}': '修补木材 {count}',
  'Effective firepower {count}': '有效火力 {count}',
  'Firepower includes the captain’s battle experience.':
    '有效火力包含船长战斗等级带来的加成。',
  'Distance {range}': '距离 {range}',
  Adjacent: '接舷距离',
  'Close range': '近距离',
  'Cannon range': '炮击距离',
  'Retreat edge': '撤离边缘',
  Approach: '靠近',
  'Increase distance': '拉开距离',
  'Fire cannons': '开炮',
  Board: '接舷战',
  'Repair hull': '修补船体',
  'Challenge the captain': '挑战敌船长',
  Retreat: '撤退',
  'Already alongside the enemy.': '已经贴近敌船。',
  'Already at the retreat edge.': '已经到达撤离边缘。',
  'Your ship has no cannons.': '这艘船没有火炮。',
  'No cannon shot remains.': '炮弹已经用尽。',
  'Move within cannon range first.': '先靠近至炮击距离。',
  'Move alongside the enemy first.': '先靠近至接舷距离。',
  'You need at least as many crew as the enemy to challenge its captain.':
    '我方船员人数至少与敌方相当，才能挑战敌船长。',
  'No repair lumber remains.': '修补木材已经用尽。',
  'The hull is already fully repaired.': '船体已修复完好。',
  'Reach distance 3 before retreating.': '拉开到距离 3 后才能撤退。',
  'Cannon fire costs one shot. Repairs cost one unit of lumber.':
    '每次开炮消耗一发炮弹，每次修补消耗一份木材。',
  'Victory or a successful retreat ends Katarina’s pursuit. Defeat requires another attempt.':
    '获胜或成功撤退可以摆脱卡特琳娜的追击。战败后需要再次迎战。',
  'Close the open panel to continue the battle.':
    '关闭当前弹窗后，便可继续战斗。',
  'Battle won': '战斗胜利',
  'Battle lost': '战斗失利',
  'Duel drawn': '决斗平局',
  'Retreat successful': '成功撤退',
  'The shipyard duel is over. Meet Domingo at Ceuta’s harbor.':
    '船厂的决斗结束了。去休达码头与多明戈会合。',
  'Visit the Lisbon palace to continue your family’s story.':
    '前往里斯本王宫，继续查清家族的事情。',
  'Return to the Franco house for another duel.':
    '回到法雷尔宅邸，再与卡恩较量一次。',
  'Your fleet will return safely to Lisbon. The flagship will receive emergency repairs and replacement crew.':
    '船队将安全返回里斯本。旗舰会获得紧急修复，并补齐最低出航船员。',
  'Prepare at the port, or try again immediately from the Lisbon harbor.':
    '可以先在港内整备，也可以到里斯本码头立即再次迎战。',
  'Your ships, items and gold are retained.': '现有舰船、物品与金币会保留。',
  'The enemy captain yields.': '敌船长认输了。',
  'The captains break apart. The naval battle continues.':
    '双方船长暂时分开，海战继续。',
  'João gains {amount} battle experience.': '约翰获得 {amount} 点战斗经验。',
  'Each companion gains {amount} battle experience.':
    '每位同行伙伴获得 {amount} 点战斗经验。',
  'Every current mate gains {amount} battle experience.':
    '每位当前伙伴获得 {amount} 点战斗经验。',
  'No experience is awarded for this encounter.': '本次交锋不增加战斗经验。',
  'Equip weapon': '装备武器',
  'Equip armor': '装备防具',
  Unequip: '卸下',
  Equipped: '已装备',
  'Equipment cannot be changed during combat.': '战斗中无法更换装备。',
  'Repairs are unavailable during combat.': '战斗中无法使用船厂修理。',
  'Repair {points} hull for {cost} gold?':
    '花费 {cost} 金币，修复 {points} 点耐久吗？',
  'You can afford {points} of the {missing} damaged hull points.':
    '船体缺损 {missing} 点耐久，现有资金可修复 {points} 点。',
  'Repaired {points} hull for {cost} gold.':
    '已修复 {points} 点耐久，花费 {cost} 金币。',
  '{name} — {missing} damage — {points} affordable':
    '{name} — 损伤 {missing} — 可修复 {points}',
  'Which ship needs repairs?': '哪艘船需要修理？',
  'Return to naval battle': '返回海战',
  Continue: '继续',
  'You need at least 10 gold to repair one hull point.':
    '至少需要 10 金币，才能修复一点耐久。',
  'Your {attack} met the opponent’s {defense}, dealing {damage} damage.':
    '你使出{attack}，对手用{defense}应对，受到 {damage} 点伤害。',
  'The opponent’s {attack} met your {defense}, dealing {damage} damage.':
    '对手使出{attack}，你用{defense}应对，受到 {damage} 点伤害。',
  'Closed to distance {range}.': '靠近至距离 {range}。',
  'Pulled back to distance {range}.': '拉开至距离 {range}。',
  'Spent {shot} shot; the enemy lost {damage} hull.':
    '消耗 {shot} 发炮弹，敌船损失 {damage} 点耐久。',
  'Boarding: the enemy lost {enemy} crew; you lost {player} crew.':
    '接舷交战：敌方损失 {enemy} 名船员，我方损失 {player} 名船员。',
  'Spent {lumber} lumber; restored {hull} hull.':
    '消耗 {lumber} 份木材，恢复 {hull} 点耐久。',
  'Enemy cannon fire cost you {damage} hull.':
    '敌船开炮，我方损失 {damage} 点耐久。',
  'Enemy boarding cost you {damage} crew.':
    '敌方接舷攻击，我方损失 {damage} 名船员。',
  'The enemy closed the distance.': '敌船追近了。',
  'You challenged the enemy captain to a duel.': '你向敌船长发起决斗。',
  'You won the captain’s duel and the naval battle.':
    '你赢得船长决斗，海战获胜。',
  'You lost the captain’s duel and the naval battle.':
    '你在船长决斗中落败，海战失利。',
  'The captain’s duel was drawn; the naval battle continues.':
    '船长决斗未分胜负，海战继续。',
  'Your flagship escaped beyond the retreat edge.':
    '旗舰越过撤离边缘，成功脱身。',
  'An action was completed.': '完成了一次行动。',
};

export default combatCatalog;
