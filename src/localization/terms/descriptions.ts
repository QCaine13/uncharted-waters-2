const descriptions: Record<string, string> = {
  'The Staff entrusted to João for the ruler of Massawa.':
    '皮耶德托付给约翰、须交还马沙华统治者的圣杖。',
  'A short sheathed knife used for protection, wielding an 8 inch blade.':
    '护身用短刀，刀刃长8英寸，配有刀鞘。',
  'A short sword with a 32 inch blade. Light and versatile, it’s often used in close fighting.':
    '刃长32英寸的短剑，轻巧灵活，常用于近身战。',
  'A long sword measuring about 40 inches in length. It was very popular among medieval knights.':
    '全长约40英寸的长剑，曾深受中世纪骑士喜爱。',
  'A light, slender, two-edged sword used only for thrusting. It came into use after guns made armor obsolete.':
    '轻巧纤细的双刃刺剑，只用于突刺。火枪令铠甲式微后开始流行。',
  'A light sword with a sharp-pointed blade but no cutting edge, used only for thrusting in dueling. It’s not very effective when it comes to attacking.':
    '剑尖锐利却无刃的轻剑，决斗时专用于突刺，攻击力较弱。',
  'A sword developed to pierce the armor of a mounted enemy. It has a higher attacking rating than a Rapier.':
    '为刺穿骑兵铠甲而制的破甲剑，攻击力高于刺剑。',
  'A light, slender sword used by cavalry. It’s less effective in an attack than a Saber, but its low price makes it popular.':
    '骑兵使用的轻巧细身刀，攻击力不及骑兵刀，但价格低廉，十分普及。',
  'A curved saber with an outer cutting edge. A great weapon for attacking, it’s used mainly by Arabs and Persians.':
    '外侧开刃的弯刀，攻击力出色，主要为阿拉伯人和波斯人使用。',
  'A very sharp sword made in Japan. It’s especially effective for lashing attacks.':
    '日本打造的锋利刀剑，尤其适合斩击。',
  'A heavy, curved short sword that historically has been used by sailors.':
    '沉重的弯刃短刀，历来为水手所用。',
  'A sword with a wide, straight, single-edged blade. It’s especially effective for striking.':
    '宽身直刃的单刃剑，尤其适合劈砍。',
  'A unique Chinese sword with a wide, crescent-shaped blade. It’s quite good for attacking, especially striking.':
    '中国特有的宽刃月牙形刀剑，攻击力强，尤其擅长劈砍。',
  'A long decorative sword with wavy edges. Its offensive capability is superior to both the Rapier and the Estock.':
    '刃呈波浪形的华丽长剑，攻击力高于刺剑和破甲剑。',
  'A sword with a grip about 7 inches long. Wielded with one or two hands, it’s one of the most destructive and expensive swords around.':
    '剑柄约长7英寸，可单手或双手挥舞，是威力最强、价格最高的剑之一。',
  'A large, two-handed sword from Scotland that may weigh up to 10 pounds. It’s quite effective for striking.':
    '苏格兰双手大剑，重达10磅，劈砍威力出色。',
  'A curved single-edged cavalry sword that is more effective for lashing than for thrusting.':
    '弯曲的单刃骑兵刀，斩击比突刺更有效。',
  'A relatively inexpensive armor made of leather that has been hardened with animal grease. ':
    '以动物油脂硬化皮革制成的防具，价格较低。',
  'An armor made of thousands of tiny interlinked steel rings. While it allows the wearer ease of movement, it doesn’t offer the best protection.':
    '由数千枚细小钢环相扣而成，行动方便，但防护力有限。',
  'An armor with sheets of tough, thin steel plates that cover only the upper body. An improvement on Plate Armor, it’s designed for more active naval combats.':
    '以坚韧薄钢板保护上身，是为灵活海战改良的板甲。',
  'A step up from Chain Mail Armor, this armor is formed by a combination of plate and mail. It offers better protection than Half Plate Armor.':
    '由板甲与锁子甲组合而成，是锁子甲的改良型，防护力高于半身板甲。',
  'A low precision instrument used for celestial navigation. It measures longitude and latitude.':
    '用于天文航海的低精度仪器，可测量经纬度。',
  'A high precision instrument used for celestial navigation. It measures longitude and latitude.':
    '用于天文航海的高精度仪器，可测量经纬度。',
  'The most precise and reliable instrument used for celestial navigation. It measures longitude and latitude.':
    '最精确可靠的天文航海仪器，可测量经纬度。',
  'A handy portable watch. With it, you’ll always know the correct time!':
    '便于携带的怀表，让你随时掌握准确时间。',
  'An optical instrument that will help you find distant objects and ports at sea.':
    '光学仪器，能在海上发现远方目标和港口。',
  'Not only does a cat make a nice pet, but it’ll keep your ship rat-free!':
    '既是可爱的宠物，也能清除船上的老鼠。',
  'A unique Chinese sword with a wide blade. It’s quite effective for striking.':
    '中国特有的宽刃刀剑，劈砍威力出色。',
  Reserve: '备用。',
  'Letter of marque issued by Portugal. It authorizes the bearer to commit acts of piracy against other countries, in the name of Portugal.':
    '葡萄牙颁发的私掠许可证，授权持有者以葡萄牙之名袭击他国船只。',
  'Letter of marque issued by Spain. It authorizes the bearer to commit acts of piracy against other countries, for the glory of Spain.':
    '西班牙颁发的私掠许可证，授权持有者为西班牙袭击他国船只。',
  'Letter of marque issued by the Ottoman Empire. It authorizes the bearer to commit acts of piracy against other countries in the name of the Ottoman Empire.':
    '奥斯曼帝国颁发的私掠许可证，授权持有者以帝国之名袭击他国船只。',
  'Letter of marque issued by England. It authorizes the bearer to commit acts of piracy against other countries, for the glory of England.':
    '英格兰颁发的私掠许可证，授权持有者为英格兰袭击他国船只。',
  'Letter of marque issued by the Governor General of Italy. It authorizes the bearer to commit acts of piracy against other countries in the name of Italy.':
    '意大利总督颁发的私掠许可证，授权持有者以意大利之名袭击他国船只。',
  'Letter of marque issued by Holland. It authorizes the bearer to commit acts of piracy against other countries in the name of Holland.':
    '荷兰颁发的私掠许可证，授权持有者以荷兰之名袭击他国船只。',
  'A permit issued by Portugal. It gives one tax-exempt status when trading in ports allied with Portugal.':
    '葡萄牙颁发的许可证，可在葡萄牙盟国港口免税交易。',
  'A permit issued by Spain. It gives one tax-exempt status when trading in ports allied with Spain.':
    '西班牙颁发的许可证，可在西班牙盟国港口免税交易。',
  'A permit issued by the Ottoman Empire. It gives one tax-exempt status when trading in ports allied with Turkey.':
    '奥斯曼帝国颁发的许可证，可在土耳其盟国港口免税交易。',
  'A permit issued by England. It gives one tax-exempt status when trading in ports allied with England.':
    '英格兰颁发的许可证，可在英格兰盟国港口免税交易。',
  'A permit issued by the Governor-General of Italy. It gives one tax-exempt status when trading in ports allied with Italy.':
    '意大利总督颁发的许可证，可在意大利盟国港口免税交易。',
  'A permit issued by Holland. It gives one tax-exempt status when trading in ports allied with Holland.':
    '荷兰颁发的许可证，可在荷兰盟国港口免税交易。',
  'A poison to get rid of rats on a ship. Those pesky animals will feast on your precious food if you don’t have a way to get rid of them.':
    '消灭船上老鼠的毒药。若不除掉它们，宝贵的食物就会被偷吃。',
  'A perfumed oil believed to calm storms.': '据说能平息风暴的芳香油膏。',
  'A great remedy for scurvy, the disease of poor nutrition that often troubles a crew during long voyages.':
    '治疗坏血病的良药；这种营养不良症常困扰远航船员。',
  'One of the lost treasures of Atlantis. The crown is made of gold and adorned with many precious stones. Quite simply, a priceless work of art.':
    '亚特兰蒂斯失落的宝藏之一。黄金王冠镶满宝石，是无价的艺术珍品。',
  'A soft shawl made of the best silk from China.':
    '以中国上等丝绸制成的柔软披肩。',
  'A beautiful traditional Chinese dress, made of the finest Chinese silk.':
    '以中国顶级丝绸制成的华美传统礼服。',
  'An intricately decorated tiara, set with small but brilliant aquamarine stones.':
    '装饰精巧的头冠，镶有小巧璀璨的海蓝宝石。',
  'A fancy comb made of platinum and decorated with rare gems.':
    '以白金制成、饰有稀有宝石的华丽发梳。',
  'A luxurious fur coat made from the white winter fur of the rare ermine weasel. ':
    '以珍稀白鼬的冬季白毛制成的奢华皮衣。',
  'A beautiful tiara highlighted by a large sapphire in its center.':
    '中央镶有硕大蓝宝石的美丽头环。',
  'A beautiful fan made of many long and colorful peacock feathers.':
    '以众多修长艳丽的孔雀羽毛制成的美丽扇子。',
  'A colorful scarf made of fine silk.': '以优质丝绸制成的彩色围巾。',
  'A velvet coat cut in the latest 16th century fashion.':
    '依照16世纪最新款式剪裁的天鹅绒大衣。',
  'A crown originally made for a queen, set with extremely large diamonds.':
    '原为王后打造的王冠，镶有硕大钻石。',
  'A dazzling gold bracelet decorated with beautiful opals. ':
    '以美丽蛋白石装饰的耀眼金手镯。',
  'A scepter with a huge ruby the size of an egg at the top.':
    '顶端镶有鸡蛋般硕大红宝石的权杖。',
  'An antique candleholder made of brass.': '黄铜制成的古董烛台。',
  'A tiny box carved out of jade.': '以翡翠雕成的小巧盒子。',
  'A gold crown with delicate decorations.': '饰纹精美的黄金王冠。',
  'A wide, heavy, solid gold bracelet set with diamonds.':
    '宽大厚重的纯金手镯，镶有钻石。',
  'A beautiful ring, set with a large sapphire.': '镶有硕大蓝宝石的美丽戒指。',
  'A small box cut of malachite stone.': '以孔雀石雕成的小盒子。',
  'A beautifully designed brooch set with beautiful garnets.':
    '造型精美、镶有石榴石的胸针。',
  'A ring set with a large ruby.': '镶有硕大红宝石的戒指。',
  'A treasured sword made in the 15th century by a famous Japanese swordsmith, Muramasa.':
    '日本名匠村正于15世纪打造的宝刀。',
  'A sword with runes carved on the handle. Its destructive power is second to none.':
    '剑柄刻有如尼文字，威力首屈一指。',
  'Armor that the famous armorer, Montaguinus made-to-order for Affonso, the founding king of Portugal.':
    '名匠蒙塔吉努斯为葡萄牙开国君主阿方索量身打造的铠甲。',
  'A special sword with razor-like sharpness made by the renowned swordsmith, Michelangelo.':
    '名匠米开朗基罗打造的宝剑，锋利如剃刀。',
  'A legendary sword that’s believed to confine the power of Siva, the Hindu god of destruction. A powerful lashing weapon.':
    '传说封有印度教破坏神湿婆之力的宝剑，斩击威力强大。',
  'Half plate armor made by the famous Copenhagen armorer, Errol. It provides greater protection than plate mail armor.':
    '哥本哈根名匠艾罗尔打造的半身板甲，防护力高于板链甲。',
  'This one was popular in Lisbon - about 100 years ago! However, it’s very easy to maneuver.':
    '大约100年前曾风靡里斯本。不过操纵起来十分容易。',
  'This classic vessel was first built about two centuries ago. Unfortunately, it doesn’t stack up to today’s ships.':
    '约两个世纪前问世的经典船型，可惜性能已不及当代船只。',
  'This durable craft’s shallow hull makes it easy to maneuver, but its cargo capacity is limited.':
    '船体坚固，吃水浅而易操纵，但载货量有限。',
  'It’s large and durable, but I wouldn’t use it on the open seas.':
    '船体庞大而坚固，但不适合远洋航行。',
  'It used to be popular in Venice, as even the smallest crew can navigate it with ease.':
    '曾盛行于威尼斯，即使人数很少也能轻松操船。',
  'This is a well-balanced lateen ship. It’s perfect for a novice sailor.':
    '性能均衡的三角帆船，非常适合航海新手。',
  'This one is easy to handle and makes for smooth sailing over the ocean.':
    '操纵容易，适合平稳的远洋航行。',
  'This may be a bit expensive, but it’s worth the cost when trading around coastal seas.':
    '价格稍高，但用于近海贸易很划算。',
  'This is a mid-size ship with a large cargo space. It’s easy to maneuver and suitable for adventurous voyages.':
    '货舱宽敞的中型船，容易操纵，适合冒险远航。',
  'This large trading ship is for the experienced navigator.':
    '适合经验丰富航海家的大型商船。',
  'This is a battleship, but it’s also useful for trading if its payload is kept low. Not for the unseasoned sailor.':
    '本是战船，少载货物时也适合贸易。新手难以驾驭。',
  'For such a large ship, this is quite easy to maneuver. I highly recommend it.':
    '以大型船而言相当容易操纵，值得推荐。',
  'It’s quite durable for its size. Ye can even use it when fighting pirates if ye manuever it carefully.':
    '以其大小而言十分坚固，谨慎操纵甚至能与海盗交战。',
  'A small, high-performance sailing ship. It has the capacity to carry guns for battles.':
    '高性能小型帆船，能搭载火炮投入战斗。',
  'We are proud of this great ship. It combines the storage capacity of a galleon with the mobility of a caravel. A true work of art!':
    '本船结合西班牙大帆船的载货量与多桅帆船的机动性，堪称杰作！',
  'Only a few shipyards have the ability to build this ship. Ye’ll never regret buying it.':
    '只有少数造船厂能建造此船，买下绝不会后悔。',
  'This is the ultimate ship, but it’s only for highly skilled navigators.':
    '性能顶尖的船只，但只有技艺高超的航海家才能驾驭。',
  'Well, this is the only type of ship built in China.':
    '这是中国唯一建造的船型。',
  'This small ship can’t withstand rough waves, so it’s pretty useless on the high seas.':
    '这种小船经不起风浪，在远洋上几乎派不上用场。',
  'This ship isn’t bad. Just remember the payload is high...':
    '这船性能不错，只是载重量很大……',
  'No other ship can overcome this floating bastion in close combat.':
    '近身战中，没有船能击败这座海上堡垒。',
  'Galleys are normally battleships, but this one is fast enough to be used for trading, as well.':
    '桨帆船通常用于作战，但此船速度够快，也可用于贸易。',
  'This huge rowing ship is armored with steel, and has space for lots of guns.':
    '巨型桨船覆有钢甲，并能搭载大量火炮。',
  'This ship was made for many Japanese warlords. Ye may want to own one, too.':
    '许多日本大名都曾订造此船，你或许也会想拥有一艘。',
  'This is only a mid-sized ship. I don’t think ye can make it home in this one.':
    '这只是一艘中型船，恐怕无法靠它航行回乡。',
};

export default descriptions;
