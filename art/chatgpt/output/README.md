# 法雷尔之子行走试点

角色设定为架空世界中法雷尔的儿子。保留肩长金发、蓝眼和蓝白航海服的家族特征，加入蓝绳束发、左肩贝壳扣与酒红编织腰带。

## 文件

| 文件 | 规格 |
| --- | --- |
| [角色定稿](characters/farrell-son-design.png) | 1182 × 1330 px，正面全身，RGBA PNG |
| [四向八帧行走条图](characters/farrell-son-strip.png) | 2048 × 256 px，8 张 256 × 256 px 透明帧横排 |

条图从左到右为背面两帧、朝右两帧、正面两帧、朝左两帧。帧内坐标从零开始，人物横向居中，最低的靴底像素对齐到 `y = 232`。站地阴影可由引擎添加。

## 模型与输入

各次绘制均使用 ChatGPT 内置 ImageGen，工具未返回具体模型版本。唯一的画风底图为 [概念图](../reference/style-concept.jpg) 右侧的小人。行走图的角色底图为上面的全身定稿，北向第二帧以 ImageGen 首轮生成的北向第一帧为底图。

全身定稿的实际提示词如下。

> Create one original new character for an alternate-world Age of Sail game, a young adult apprentice pilot descended from a noble Portuguese seafarer. Use the provided concept board as the sole STYLE reference and look only at its right-hand roster of tiny sprites: compact THREE-head-tall bodies, round expressive faces, warm brown 1-pixel-style edge outlines, clean chunky hand-placed pixel clusters, subtle sunny highlights and simple color ramps. Character identity: friendly cornflower-blue eyes, shoulder-length sunny straw-blond hair with two sweeping forelocks and the upper section tied back into a tiny short tail with dark blue cord. He has a distinctive salt-blue cropped doublet with a wide asymmetric ivory sea collar, short elbow-length sleeves and little ivory cuffs, a single small aged-brass scallop pin on the left shoulder, an oxblood red woven belt, pale sand trousers tapering into dark warm brown mid-calf boots. Open youthful face and strong blue-and-ivory outfit silhouette. Historically inspired original design, no hat, no jacket tails, no weapon, no long cape, no handheld object. One body only centered, full body visible with both boots, front-facing with very slight raised camera angle typical of a top-down harbor walking game: forehead and shoulders show a little from above. Arms at rest, compact natural stance. No written words, labels, other characters, background props, architectural background, border, decorative grid or shadow on the canvas. Transparent background. Refined game pixel sprite, about 64 native art pixels tall with intentional pixel groupings, integer-sharp enlargement, bright pleasing warm daylight.

八帧行走图的实际提示词如下。

> Produce a final in-game walking sprite atlas of the SAME original character in reference image 2. Image 1 is style-only: its little game sprites on the right, hand-placed crunchy pixels with warm brown contours and a sunny subdued pixel palette. Image 2 is the sole identity/costume model: shoulder-length gold hair with a tiny blue-bound half-tail, blue eyes, cropped salt-blue doublet, big cream asymmetric collar, BRASS SHELL PIN on his own left shoulder, three front buttons, oxblood woven belt, light tan pants, dark brown boots. Preserve this design and about three-heads-tall proportions in every frame. Exactly EIGHT full-body figures on an invisible grid of FOUR equal columns and TWO equal rows on a landscape canvas. Specific order by rows: TOP ROW 1 & 2 face due NORTH, show straight back of hair/head and back of clothing with zero facial features; TOP ROW 3 & 4 face due EAST, with noses and toes pointed RIGHT in strict 90-degree profile. BOTTOM ROW 1 & 2 face due SOUTH, straight front with full face and front of clothing; BOTTOM ROW 3 & 4 face due WEST, with noses and toes pointed LEFT in strict 90-degree profile. Use the same slightly elevated orthographic harbor camera and scale throughout. Each neighboring pair is two opposite full-stride key poses: phase A left-foot forward and right arm swinging forward, phase B right-foot forward and left arm swinging forward. In BOTH sideways directions the stride should point in the direction of travel in BOTH phases; make left and right boots readable through overlaps and stagger, keep different arms clearly leading. In front and back views use one raised heel, open space between legs, and an obvious alternating forward fist so the two frames read at thumbnail size. Keep both images of each pair the same person with the same collar, belt, boots, hair, lighting, and height. Each silhouette is centered in its own cell, with equally large transparent margins especially between both rows, no touching or overlapping silhouettes. All heads and boots visible. Pure genuine transparent background, no ground or cast shadows, no checkerboard drawn into artwork, no panel boundaries, logos, labels, arrows or text. Only the eight complete pixel-art sprites. Crisp artistically clustered pixels, no blurred edge or smudging. Render as clean production-quality 2D pixel artwork.

北向第二帧的补绘提示词如下。

> Create ONE new full-body production sprite frame by editing this exact original back-facing pixel-art navigator into the opposite step of his walk cycle. Preserve his back-facing 180-degree orientation (no visible face, no turning), camera elevation, identical height and body proportions, same blonde pattern and blue-tied short tail, broad ivory collar viewed from the back, blue short tunic, red belt, tan trousers and brown boots, same warm lighting, same crisp pixel scale and outline detail. Change the walk pose visibly so the reverse phase is unmistakable. In screen coordinates for the NEW frame: SCREEN-LEFT boot must now be the long vertical low boot nearest the bottom edge with its heel at the bottom of the body; SCREEN-RIGHT boot is raised and set higher by a visibly shorter lower leg, so its bottom is about 1/14 of total body height above the screen-left boot. SWAP the arms: screen-RIGHT arm now swings back downward toward the viewer as a clearly visible long forearm with fist, screen-LEFT arm swings forward away from the viewer and is foreshortened with its tightly bent, partly hidden forearm. It should feel like the same character took the next step while walking directly AWAY from camera. Preserve head, collar, waist and body design as tightly as possible. Preserve the generous margin around the figure. Genuine transparent background, no ground, no glow, no stage lighting, no text. Exactly one isolated hard-edged chibi pixel-art sprite, all hair and both boots fully visible.

## 裁切和对齐

初稿的两个背面姿势迈的是同一侧，已用 ImageGen 重出第二帧。原始输出的透明边缘有低透明度残留，导出时用 96 的 Alpha 阈值清理背景。每个剪影独立裁切、按比例用最近邻缩放到 208 px 高，再居中装入 256 × 256 帧，最后横排合成。可见像素均来自 ImageGen。

已检查四个朝向、八格边界、透明背景与靴底基线。侧面两帧的摆臂比步幅差更明显，可在引擎的实际缩放和播放速度下再验收。

## 第 1 组建筑

[建筑目录](buildings/)收录任务单的 17 项。每张都是按体量草图宽高分别乘以 2 的 RGBA PNG，周围透明，可独立放到布局上。风格参考为概念图，部分绘制同时使用对应体量草图确定占地和入口。[ImageGen 提示词](imagegen-prompts.md#建筑)

校验了图幅、透明背景和城墙、宫墙的左右边缘。两段墙采用 ImageGen 绘制的连续墙面裁片对称拼接，最左和最右像素列完全一致。两艘船从各自的生成轮廓裁出并放到草图对应的停放位置。教堂已补上铜绿穹顶，旅馆中门与布局对齐，港口办事处改为屋面更明显的紧凑单层楼。

原画的建筑体块与细节有变化，门槛按布局目测定位。开门位置、遮挡和碰撞仍需在地图覆盖时实测。

## 第 2 组小镇居民

[居民条图](characters/)包含 `woman`、`man`、`merchant`、`dog`、`guard`、`beggar`。妇人和水手各 8 帧，其余各 2 帧。已检查每格 256 × 256、透明背景和 `y = 232` 的落地点。狗保持较小体型，柜台、长戟和琴凳均随各自角色进入帧内。

妇人和水手的初稿在几个方向上迈步重复，已用 ImageGen 补绘并逐向检查。导出只做透明背景清理、裁切、等比最近邻缩放和横排装帧。[ImageGen 提示词](imagegen-prompts.md#小镇居民)

## 第 3 组主角团

[主角定稿和条图](characters/)包括红发女船长、私掠舰长、制图学者、落魄冒险家和商人少年，共 5 张全身定稿和 5 张行走条图。条图保留背面、朝右、正面、朝左四向各两帧，每帧 256 × 256，靴底基线 `y = 232`。

制图学者的上下两行在生成图中偏离几何中线，已沿透明空隙正确分开。冒险家和商人少年的重复步态已用 ImageGen 补绘。侧面帧可从摆臂、腿部遮挡和鞋尖位置辨别，实际循环速度留给引擎验收。[ImageGen 提示词](imagegen-prompts.md#主角团)

## 第 4 组地面与植物

[地面材质](ground/)共 5 张 512 × 512 RGB PNG。选取 ImageGen 成图里边缘颜色相近的区域裁切，按最近邻缩放后用同一裁片的边缘像素建立重复边。上下、左右像素完全一致，均做过 2×2 平铺检查。港湾水面和浅水保持低对比，浅水明显更亮。

[植物与小物件](props/)共 9 张 RGBA PNG，物件下缘为落点。橄榄树的第一张初稿带花盆，已用 ImageGen 补绘为落地树。花盆为 128 × 160，木箱为 128 × 128，木桶为 128 × 160，小树、柏树、灌木和路灯按任务单画布尺寸导出。[ImageGen 提示词](imagegen-prompts.md#地面与植物)

## 第 5 组主角胸像

[胸像目录](portraits/)收录法雷尔之子和其余五位主角，每张为 1024 × 1280 RGB PNG，背景纯色 `#D8C9A8`。各图以对应全身定稿锁定发型、服装和道具。导出时裁切透明边缘，等比缩放并置于指定底色上，保留完整头发、帽檐和肩线。[ImageGen 提示词](imagegen-prompts.md#主角胸像)
