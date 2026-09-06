# Chinese Playable Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the existing game as a playable Chinese-first release with safe sea-save restoration and preserved English behavior.

**Architecture:** Keep the Canvas/React boundary and game IDs. Initialize world-derived state when a world runtime is created; introduce a small locale store and explicit display dictionaries outside game saves. Preserve canonical English story content and localize presentation.

**Tech Stack:** TypeScript 4.8, React 18, Canvas, Jest, Cypress, Webpack, Node.js 22.

**Spec:** `docs/superpowers/specs/2026-09-06-chinese-playable-release-design.md`

## Global Constraints

- 使用 Node.js 22，保留锁文件与现有依赖版本。
- 默认简体中文（zh-CN），可切换英文（en），语言偏好存储于独立的 `uw2.locale`，不改变 savedState 或存档版本。
- 不修改港口/物品/船只/角色 ID、菜单 action value 或剧情事件 ID；仅本地化显示文本。
- 现有英文剧情与等价测试保留，中文采用独立词典；动态文本使用明确参数插值，禁止通过模糊正则猜测整段渲染结果。
- 语言切换不丢进度、不重新开始剧情、不改变金钱/船员/事件结果；中文对话可阅读，不溢出固定窗口。
- 扩充约束：专名与通用界面独立，剧情翻译按章节模块汇总；沿用稳定ID与声明式内容，新章节可分别校验。
- New narrative beyond Lisbon belongs to M1 onward; M0 must be an independently playable foundation.

---

### Task 1: Restore environment and eliminate cold sea-save crash

**Files:**
- Modify: `src/game/world/world.ts`
- Test: `src/game/world/world.test.ts` (create if needed), `tests/e2e/discovery.cy.ts`, `tests/e2e/provisions.cy.ts`
- Read: `src/state/actionsWorld.ts`, `src/state/saveLoad.ts`, `src/app.ts`

**Interfaces:**
- Consumes: `updateWorldStatus(): void`, `createWorld(): World`, state.fleets/player position and state.timePassed.
- Produces: a world whose wind/current are initialized before `characters.update()` and initial sea rendering, both at cold startup and after `load()` discards runtime objects.

- [x] Restore dependencies and tracked LFS assets, verifying hashes/signatures; record asset preflight and baseline results. Controller owns environment.
- [x] Add a regression that restores a sea save at an off-cycle timestamp (240 -> first tick 260), starts the actual world runtime and calls update/draw with minimal canvas/asset test doubles. The failure must come from uninitialized state.wind/current. Also cover startup at 220 and reloading a save in a different sea area with stale prior wind.

```ts
// Behavioral shape: populate persisted sea state, clear nonpersistent values,
// then use the real createWorld boundary, not an explicit test call to updateWorldStatus.
const world = createWorld();
expect(state.wind).toEqual(expect.objectContaining({ direction: expect.any(Number), speed: expect.any(Number) }));
expect(() => world.update()).not.toThrow();
```

- [x] Run the focused regression and observe expected failure.
- [x] Initialize world status at the world creation boundary after valid fleet position is available and after interface mount; avoid storing derived weather or adding fallback guards that hide a missing initialization. Expected minimal production change:

```ts
import { updateWorldStatus, worldTimeTick } from '../../state/actionsWorld';
// Inside createWorld, before characters can update:
updateWorldStatus();
```

- [x] Replace the E2E fixture's safety timestamp workaround with arbitrary persisted times and add a reload assertion using the real browser. Cover both indicators and actual sailing. Maintain the single world creation boundary if existing tests expose additional initialization requirements.
- [x] Run focused tests, typecheck, relevant E2E when environment is ready, self-review and commit only owned files. Report exact commands and RED/GREEN evidence.

### Task 2: Chinese-first locale infrastructure and existing game presentation

**Files:**
- Create: `src/localization/index.ts`, `src/localization/useLocale.ts`, `src/localization/ui.ts`, `src/localization/terms.ts`, `src/localization/dialogue.ts`（汇总入口）、`src/localization/dialogue/joao-lisbon.ts`（章节文本）、`src/localization/localization.test.ts`
- Modify: `src/interface/**` presentation files, `src/homepage/index.html`, `src/app.ts`, display helper call sites in `src/state/selectors.ts` as needed.
- Test: existing presentation tests, dedicated Chinese interface tests, `tests/e2e/localization.cy.ts`, test setup/helpers for explicitly selecting English in the existing regression suite.

**Interfaces:**
- Produces `Locale = 'zh-CN' | 'en'`, `getLocale(): Locale`, `setLocale(locale: Locale): void`, `subscribeLocale(listener: () => void): () => void`, `t(source: string, values?: Record<string, string | number>): string`, `useLocale(): Locale`.
- `t` looks up exact English source/templates in explicit dictionaries, then replaces `{name}` placeholders from passed values. Unknown text falls back to the source, preserving player-entered ship names. Locale reads tolerate absent/unavailable localStorage; invalid stored locale defaults to zh-CN.
- Root Interface subscribes to locale changes without remounting gameplay. Language selector belongs to System and must be reachable immediately. HTML loading/help copy is localized consistently on startup and switch.
- Dialogue lookup uses untouched canonical English body text before `$firstName/$lastName` interpolation; Chinese names use 约翰 / 法雷尔. Choice IDs and effects stay unchanged.

- [ ] Write behavior tests for default Chinese, persisted English, invalid locale fallback, storage failure, parameter interpolation and language changes preserving savedState. Establish English locale explicitly for legacy tests without weakening their assertions.

```ts
setLocale('zh-CN');
expect(t('System')).toBe('系统');
expect(t('Day {day}', { day: 3 })).toBe('航海第 3 天');
setLocale('en');
expect(t('System')).toBe('System');
```

- [ ] Implement locale state/listeners and dictionaries, e.g. `const ui: Record<string, string> = { System: '系统', Save: '保存', Load: '读取', 'Day {day}': '航海第 {day} 天' };`. Storage write failure must not prevent an in-memory language switch.
- [ ] Convert rendering call sites while preserving action values. Example: `options.map(value => ({label: t(value), value}))`; replace dynamic English interpolation at its producer with a dictionary template and named parameters.
- [ ] Populate all existing UI/building messages, data display names (130 ports, all live goods/items/ships/characters and nationalities), discovery names/details, roles and dates. Use the spec's verified Chinese protagonist names; preserve runtime data records and IDs. Separate terms from UI prose for maintainability.
- [ ] Populate Chinese opening dialogue against all canonical Lisbon body/prompt/choice text. Keep English content unchanged and verify every reachable story string has a Chinese entry, all placeholders are preserved and translations do not alter effects.
- [ ] Localize image-based yes/no/submit labels using accessible HTML controls or text overlays with equivalent interaction behavior; preserve keyboard, click and drag support.
- [ ] Translate loading/help/homepage content and adapt CJK font/line height/overflow to fit the existing 800px frame without clipping choices. Render text at display time so open dialogs reflect language switches without resetting state.
- [ ] Add Chinese browser coverage: first launch Chinese, System language switch preserves current game state, page reload persists locale, open one real building, show Chinese dialogue and complete a buy/sell or provision transaction, reload a sea save.
- [ ] Run focused tests during development, then full Jest/typecheck/lint/build and Chinese plus English E2E. Self-review and commit owned files, recording remaining uncertainty precisely.

### Task 3: Integration, playthrough, reference records and handoff

**Files:**
- Modify: `README.md`, `docs/README.md`, `docs/DECISIONS.md`, `docs/glossary.md`, `docs/roadmap.md`
- Create: `docs/1-baseline/chinese-reference-baseline.md`, `docs/superpowers/verification/2026-09-06-chinese-foundation.md`
- Modify tests only for concrete regressions observed in integration.

**Interfaces:** Consumes Tasks 1-2, produces verified M0 acceptance results and an explicit next-M1 handoff.

- [ ] Run `npm run verify:full` (Cypress may use installed Edge locally while CI retains Chrome); resolve failures rather than disabling checks.
- [ ] Manually play through a fresh Chinese Lisbon opening using the actual controls, buy/sell goods, provision, sail, save/reload and switch languages. Check screenshot evidence for dialog and HUD clipping at the supported desktop viewport.
- [ ] Document tested behavior, commands/results, supported viewport/runtime and any unmet requirements; M0 is complete only if its acceptance criteria are met.
- [ ] Record D15: user authorized phased development, canonical Chinese names, default zh-CN, first complete route John/João. Supersede stale roadmap framing; retain previous decisions as history.
- [ ] Produce a whole-branch review package and resolve important findings. Deliver the local preview and paths to the plan/review without claiming later milestones complete.
