import { SAVED_STATE_KEY, type State } from '../src/state/state';
import { SAVE_VERSION } from '../src/state/saveLoad';
import {
  closeSidebar,
  readVoyageSave,
  saveFromSystem,
  sailGibraltarToLisbon,
  sailLisbonToGibraltar,
} from './firstVoyageUtils';
import {
  advanceModeledPortPosition,
  enterAdjacentPortBuilding,
  enterPortBuilding,
  setModeledPortPosition,
  type PortRoute,
} from './portRouteUtils';
import {
  characterMessageIncludes,
  clickMenu,
  vendorMessageIncludes,
} from './utils';

type OpeningSave = State & { version: number };

const readSavedState = () =>
  cy.window({ log: false }).then((window) => {
    const raw = window.localStorage.getItem(SAVED_STATE_KEY);
    expect(raw !== null, 'savedState exists').to.equal(true);
    return JSON.parse(raw!) as OpeningSave;
  });

const expectCurrentSemanticSave = (saved: OpeningSave) => {
  expect(saved.version).to.equal(SAVE_VERSION);
  expect(saved.storyEvents).to.be.an('array');
  expect(saved.reportedDiscoveries).to.be.an('array');
  expect(saved.quests.every((key) => !key.startsWith('joao.'))).to.equal(true);
};

const currentStoryText = (document: Document) =>
  Array.from(
    document.querySelectorAll(
      '[data-test=vendorMessageBox], [data-test=characterMessageBox1], [data-test=characterMessageBox2]',
    ),
  )
    .map(({ textContent }) => textContent ?? '')
    .join('|');

const advanceStoryUntil = (
  settled: (document: Document) => boolean,
  remaining = 90,
): Cypress.Chainable<Document> => {
  if (!remaining) throw new Error('Story did not settle within 90 frames');
  return cy.document().then<void>((document) => {
    if (settled(document)) return;
    const before = currentStoryText(document);
    cy.get('[data-test=building]').click();
    cy.document().should((next) => {
      expect(settled(next) || currentStoryText(next) !== before).to.equal(true);
    });
    return advanceStoryUntil(settled, remaining - 1);
  });
};

const finishExitingStoryEvent = (legacyKey?: string) => {
  advanceStoryUntil(
    (document) => document.querySelector('[data-test=building]') === null,
  );
  cy.get('[data-test=building]')
    .should('not.exist')
    .then(() => advanceModeledPortPosition('s'));
  if (legacyKey)
    readSavedState().then((saved) =>
      expect(saved.quests).to.include(legacyKey),
    );
};

const finishStoryEventToMenu = (legacyKey?: string) => {
  advanceStoryUntil((document) => {
    const menu = document.querySelector('[data-test=menu]');
    return !!menu && !menu.classList.contains('hidden');
  });
  if (legacyKey)
    readSavedState().then((saved) =>
      expect(saved.quests).to.include(legacyKey),
    );
};

const exitCurrentBuilding = (exitMessage?: string) => {
  cy.get('[data-test=building]').rightclick();
  if (exitMessage) {
    vendorMessageIncludes(exitMessage);
    cy.get('[data-test=building]').click();
  }
  cy.get('[data-test=building]')
    .should('not.exist')
    .then(() => advanceModeledPortPosition('s'));
};

const ensureNightOutsideAdjacentBuilding = (
  exitMessage?: string,
  remaining = 30,
): Cypress.Chainable<OpeningSave> => {
  if (!remaining)
    throw new Error('Adjacent-building loop did not reach nighttime');
  return readSavedState().then<void>((saved) => {
    const minute = saved.timePassed % 1440;
    if (minute < 240 || minute >= 1200) return;
    enterAdjacentPortBuilding('w');
    finishStoryEventToMenu();
    exitCurrentBuilding(exitMessage);
    return ensureNightOutsideAdjacentBuilding(exitMessage, remaining - 1);
  });
};

const advanceAtHarborUntilNight = (
  remaining = 20,
): Cypress.Chainable<OpeningSave> => {
  if (!remaining) throw new Error('Harbor loop did not reach nighttime');
  finishExitingStoryEvent();
  return readSavedState().then<void>((saved) => {
    if (saved.timePassed % 1440 >= 1200) return;
    enterAdjacentPortBuilding('w');
    return advanceAtHarborUntilNight(remaining - 1);
  });
};

const finishHouseFarewellAtNight = (
  availableText: string,
  blockedText: string,
  remaining = 40,
): Cypress.Chainable<JQuery<HTMLElement>> =>
  cy.get('[data-test=building]').then<void>(($building) => {
    const text = $building.text();
    if (text.includes(availableText)) {
      finishExitingStoryEvent('houseAfterQuestAndPub');
      return;
    }
    if (!remaining) throw new Error('House farewell did not become available');
    expect(text).to.include(blockedText);
    cy.wrap($building).click();
    cy.get('[data-test=building]')
      .should('not.exist')
      .then(() => advanceModeledPortPosition('s'));
    enterAdjacentPortBuilding('w');
    finishHouseFarewellAtNight(availableText, blockedText, remaining - 1);
  });

const enter = (route: PortRoute, openingLine?: string) => {
  enterPortBuilding(route, openingLine ?? 'opening journey building');
  if (openingLine)
    cy.get('[data-test=building]').should('include.text', openingLine);
};

const spawnToPub: PortRoute = [
  ['a', 3],
  ['w', 2],
  ['a', 2],
  ['w', 31],
  ['d', 5],
  ['w', 1],
];
const pubToChurch: PortRoute = [
  ['s', 26],
  ['a', 3],
  ['s', 2],
  ['a', 39],
  ['w', 1],
];
const churchToHouse: PortRoute = [
  ['d', 6],
  ['w', 3],
  ['d', 28],
  ['w', 9],
  ['d', 11],
  ['w', 1],
  ['d', 12],
  ['w', 1],
];
const houseToPub: PortRoute = [
  ['a', 11],
  ['w', 11],
  ['a', 4],
  ['w', 5],
];
const spawnToHouse: PortRoute = [
  ['a', 3],
  ['w', 2],
  ['a', 2],
  ['w', 15],
  ['d', 8],
  ['w', 1],
  ['d', 12],
  ['w', 1],
];
const houseToItemShop: PortRoute = [
  ['a', 11],
  ['w', 1],
  ['a', 4],
  ['w', 1],
  ['a', 40],
  ['w', 1],
];
const itemShopToShipyard: PortRoute = [
  ['d', 40],
  ['s', 1],
  ['d', 4],
  ['s', 1],
  ['d', 14],
  ['s', 6],
  ['d', 4],
  ['s', 10],
  ['d', 2],
  ['w', 1],
  ['d', 1],
  ['w', 1],
];
const shipyardToChurch: PortRoute = [
  ['s', 1],
  ['a', 3],
  ['w', 5],
  ['a', 25],
  ['s', 2],
  ['a', 39],
  ['w', 1],
];
const churchToHarbor: PortRoute = [
  ['d', 37],
  ['s', 3],
  ['d', 2],
  ['s', 2],
  ['d', 3],
  ['w', 1],
];
const pubToHarbor: PortRoute = [
  ['s', 26],
  ['a', 3],
  ['s', 2],
  ['a', 2],
  ['s', 3],
  ['d', 2],
  ['s', 2],
  ['d', 3],
  ['w', 1],
];
const harborToGuild: PortRoute = [
  ['a', 3],
  ['w', 2],
  ['a', 2],
  ['w', 30],
  ['a', 11],
  ['w', 1],
];
const guildToHarbor: PortRoute = [
  ['s', 2],
  ['d', 6],
  ['s', 12],
  ['d', 2],
  ['s', 13],
  ['d', 1],
  ['s', 5],
  ['d', 7],
  ['w', 1],
];

export const playFreshChineseOpeningAndFirstVoyage = (
  screenshotPrefix = 'shared',
  { requireNoSavedState = false }: { requireNoSavedState?: boolean } = {},
) => {
  const shot = (name: string) => `${screenshotPrefix}-${name}`;
  cy.visit('', {
    onBeforeLoad(window) {
      window.localStorage.setItem('uw2.e2e.locale', 'zh-CN');
      window.localStorage.setItem('uw2.locale', 'zh-CN');
      if (requireNoSavedState)
        expect(
          window.localStorage.getItem(SAVED_STATE_KEY),
          'fresh journey starts without a savedState',
        ).to.be.null;
      window.localStorage.removeItem(SAVED_STATE_KEY);
    },
  });
  cy.contains('游戏加载中……').should('not.exist');
  cy.contains('里斯本').should('exist');
  cy.then(() => setModeledPortPosition({ x: 54, y: 68 }));

  enterAdjacentPortBuilding('w');
  cy.get('[data-test=building]').should('include.text', '遇到难题就去酒馆吧');
  advanceAtHarborUntilNight();
  enter(spawnToPub, '约翰少爷，真是稀客。');
  finishExitingStoryEvent('pubBeforeQuest');
  enter(pubToChurch, '法雷尔公爵府上可有人能出趟远门？');
  finishExitingStoryEvent('churchBeforeQuest');
  enter(churchToHouse, '父亲，您找我吗？');
  cy.get('#game').screenshot(shot('duke-dialogue'));
  finishExitingStoryEvent('houseBeforeQuest');
  enter(houseToPub, '约翰少爷，出什么事了？');
  finishExitingStoryEvent('pubAfterQuest');

  readSavedState().then((saved) => {
    expectCurrentSemanticSave(saved);
    expect(saved.gold).to.equal(1000);
    expect(saved.quests).to.have.length(4);
  });

  cy.reload();
  cy.contains('里斯本').should('exist');
  cy.then(() => setModeledPortPosition({ x: 54, y: 68 }));
  enter(spawnToHouse);
  finishHouseFarewellAtNight(
    '约翰，我真不明白你父亲为何不准你回家',
    '公爵严令不准您进府',
  );
  enter(houseToItemShop, '欢迎，约翰少爷。我有东西要交给您。');
  finishStoryEventToMenu('itemShopAfterQuest');
  exitCurrentBuilding();
  enter(itemShopToShipyard, '喂，我们的船造好了吗？');
  finishExitingStoryEvent('shipyardAfterQuest');
  enter(shipyardToChurch, '约翰少爷，很高兴您能来。');
  finishStoryEventToMenu('churchAfterQuest');
  exitCurrentBuilding('愿上帝保佑您的旅途！');
  enterAdjacentPortBuilding('w');
  cy.get('[data-test=building]').should(
    'include.text',
    '多谢您答应带恩里克神父同行',
  );
  finishStoryEventToMenu('churchAfterEnrico');
  exitCurrentBuilding('愿上帝保佑您的旅途！');
  ensureNightOutsideAdjacentBuilding('愿上帝保佑您的旅途！');
  enter(churchToHarbor, '那接下来怎么行动？');
  advanceStoryUntil(
    (document) => document.querySelector('[data-test=confirmYes]') !== null,
  );
  cy.get('#game').screenshot(shot('yes-no-choice'));
  cy.get('[data-test=confirmYes]').click();
  finishStoryEventToMenu('harborFinal');

  readSavedState().then((saved) => {
    expect(saved.gold).to.equal(2000);
    expect(saved.items).to.deep.equal(['53', '4']);
    expect(saved.fleets['1'].ships[0]).to.deep.include({
      id: '6',
      name: 'Hermes II',
    });
  });

  exitCurrentBuilding();
  ensureNightOutsideAdjacentBuilding();
  enter(spawnToPub, '约翰，要来杯朗姆酒吗？');
  finishStoryEventToMenu();
  clickMenu('招募水手');
  characterMessageIncludes('要为舰队招募一些水手吗？', 2);
  cy.get('[data-test=confirmYes]').click();
  cy.get('[data-test=building]').click().click();
  exitCurrentBuilding();
  ensureNightOutsideAdjacentBuilding();
  enter(pubToHarbor, '喂，伙计，要出航了吗？');
  clickMenu('补给');
  cy.get('[data-test=harborSupply]').contains(/^0$/).first().click();
  cy.get('[data-test=inputNumberInput]').type('30{enter}');
  cy.get('[data-test=harborSupply]').contains(/^0$/).first().click();
  cy.get('[data-test=inputNumberInput]').type('30{enter}');
  cy.get('[data-test=building]').rightclick();
  exitCurrentBuilding();
  ensureNightOutsideAdjacentBuilding();
  enter(harborToGuild, '工会需要一份最新的直布罗陀海峡海图。');
  advanceStoryUntil(
    (document) => document.querySelector('[data-test=confirmYes]') !== null,
  );
  cy.get('[data-test=confirmYes]').click();
  finishStoryEventToMenu();
  exitCurrentBuilding();
  ensureNightOutsideAdjacentBuilding();
  enter(guildToHarbor, '喂，伙计，要出航了吗？');
  clickMenu('出航');
  characterMessageIncludes('补给可供航行 30 天。要出航吗？', 2);
  cy.get('[data-test=confirmYes]').click();
  cy.get('[data-test=building]').should('not.exist');
  sailLisbonToGibraltar();
  readVoyageSave().then((saved) => {
    expect(saved.discoveries).to.include('strait-of-gibraltar');
    expect(saved.fame.adventure).to.equal(30);
  });
  closeSidebar();
  sailGibraltarToLisbon();
  readVoyageSave().then((saved) => {
    expect(
      saved.mates.filter(({ sailorId }) => sailorId === '34'),
    ).to.have.length(1);
  });
  cy.then(() => setModeledPortPosition({ x: 54, y: 68 }));
  ensureNightOutsideAdjacentBuilding();
  enter(harborToGuild);
  finishStoryEventToMenu();
  clickMenu('上报发现');
  cy.get('[data-test=building]').should(
    'include.text',
    '你的直布罗陀海峡图清楚完整。',
  );
  finishStoryEventToMenu();
  saveFromSystem().then((saved) => {
    expect(saved.version).to.equal(SAVE_VERSION);
    expect(saved.gold).to.equal(1800);
    expect(saved.fame.adventure).to.equal(30);
    expect(saved.reportedDiscoveries).to.deep.equal(['strait-of-gibraltar']);
    expect(saved.storyEvents).to.include('joao.first-voyage.chapter-complete');
  });
  closeSidebar();
  cy.contains('[data-test=left] div', /^日志$/).click();
  cy.get('[data-test=questJournal]').should('include.text', '完成本章');
  cy.get('#game').screenshot(shot('chapter-complete'));
  closeSidebar();
  cy.reload();
  finishStoryEventToMenu();
  saveFromSystem().then((saved) => {
    expect(saved.gold).to.equal(1800);
    expect(
      saved.storyEvents.filter(
        (id) => id === 'joao.first-voyage.chapter-complete',
      ),
    ).to.have.length(1);
    expect(
      saved.mates.filter(({ sailorId }) => sailorId === '34'),
    ).to.have.length(1);
  });
  closeSidebar();
};
