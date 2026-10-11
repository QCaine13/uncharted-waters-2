# 实施计划：SFC（超任）复古画风与音频质感重塑 (Visual & Audio Retrofit)

- **实施日期**：2026-10-11
- **对应方案**：[设计规格书](../specs/2026-10-11-sfc-visual-and-audio-retrofit-design.md)
- **交付目标**：在保持现有 M0–M3 逻辑与测试 100% 绿色的前提下，全面注入 SFC 16色立绘、羊皮纸木框对话框与 Web Audio 8-bit 打字音效。

---

## 阶段规划与任务清单

### 任务 1：搭建 Web Audio 纯程序化复古音效引擎
- [x] 创建 `src/sound/sfcAudio.ts` 单例模块。
- [x] 实现 `playDialogueBeep(speakerRole)`：根据说话角色动态调整波形频率（莱昂 420Hz、洛克 360Hz、约翰 580Hz、系统 640Hz）。
- [x] 实现 `playConfirmSound()`：经典正弦双频扫频音。
- [x] 提供全局音效开关（默认开启，可在「系统」中关闭并存储至 `localStorage`）。
- [x] 编写配套单元测试 `src/sound/sfcAudio.test.ts`，验证静音判断、频率映射与无 DOM 环境下的安全降级。

### 任务 2：SFC 经典羊皮纸木纹对话框重构
- [x] 改造对话弹窗容器样式：
  * 外层深棕木纹边框（`#2c1a0e`），内嵌双层古典金线（`#d4a742`）。
  * 羊皮纸色背景板（`#eddcc0`）搭配深棕色易读文字（`#22140a`）。
- [x] 在对话打字机输出逻辑中接入 `playDialogueBeep` 音效调用。
- [x] 在每句对话结束时加入 SFC 经典黄色/朱红倒三角跳页提示符（呼吸闪烁动画）。
- [x] 确保测试选择器与点击交互不受任何影响。

### 任务 3：立绘资源全面升级为 SFC 16色水彩高精度微像素
- [x] 对比原有 MD 8 色 `characters.png`，保留 64×80 像素网格对齐规范。
- [x] 提取并合成 SFC 原版 16 色调色板资源，替换现有粗糙对比度色块，赋予约翰、莱昂公爵、洛克、多明戈、卡特琳娜等角色纯正的温润手绘感。
- [x] 确保在 1x、2x 缩放下均启用 `image-rendering: pixelated`。

### 任务 4：「系统」菜单增加 CRT 扫描线复古滤镜开关
- [x] 在 `src/interface/System.tsx` 中添加“CRT 滤镜: 开启/关闭”切换按钮。
- [x] 编写轻量级 CSS 伪元素扫描线样式（`.sfc-crt-scanlines`），仅作用于主视口，不引入任何外部重型着色器库。
- [x] 独立持久化滤镜偏好（`uw2.crt_filter`）。

### 任务 5：全量验证、审查与自动合并推送
- [x] 运行 `npm run verify`：
  * 资产预检通过
  * 剧情声明校验通过
  * TypeScript 0 错误
  * ESLint 0 警告
  * 单元测试 105 套全部通过（921 tests 全绿）
  * 生产构建正常生成
- [x] 遵守 D19 协议：完成提交、合入 `master` 并安全推送至 `origin/master`。
