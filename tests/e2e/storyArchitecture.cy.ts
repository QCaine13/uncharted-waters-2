import { SAVED_STATE_KEY, type State } from '../../src/state/state';
import { SAVE_VERSION } from '../../src/state/saveLoad';
import { playFreshChineseOpeningAndFirstVoyage } from '../joaoOpeningJourney';
import { closeSidebar, saveFromSystem } from '../firstVoyageUtils';
import {
  characterMessageIncludes,
  clickMenu,
  vendorMessageIncludes,
} from '../utils';

type SavedState = Pick<
  State,
  'items' | 'mates' | 'quests' | 'storyEvents' | 'reportedDiscoveries'
> & {
  version: number;
  buildingId?: State['buildingId'];
  fleets?: State['fleets'];
  gold?: State['gold'];
  portId?: State['portId'];
  timePassed?: State['timePassed'];
};

type DirectionKey = 'w' | 'a' | 's' | 'd';
type Route = readonly (readonly [DirectionKey, number])[];
type MapPosition = { x: number; y: number };

let modeledPosition: MapPosition = { x: 54, y: 68 };

const visitLegacyState = (state: Partial<State>) =>
  cy.visit('', {
    onBeforeLoad(window) {
      window.localStorage.setItem(
        SAVED_STATE_KEY,
        JSON.stringify({ version: 2, ...state }),
      );
    },
  });

const readSavedState = (): Cypress.Chainable<SavedState> =>
  cy.window().then((window) => {
    const raw = window.localStorage.getItem(SAVED_STATE_KEY);
    expect(raw).not.to.be.null;
    const saved = JSON.parse(raw as string) as SavedState;
    if (saved.version === SAVE_VERSION) return saved;
    // Inspect a real v5 save after the UI loads and migrates the v2 fixture.
    return saveFromSystem().then((upgraded) => {
      closeSidebar();
      return cy.wrap(upgraded, { log: false });
    });
    // Cypress 10's overload retains the returned command in the subject union;
    // Cypress runtime flattens it, and both branches yield SavedState.
  }) as unknown as Cypress.Chainable<SavedState>;

const expectCompatibleSemanticSave = (saved: SavedState) => {
  expect(saved.version).to.equal(SAVE_VERSION);
  expect(saved.storyEvents).to.be.an('array');
  expect(saved.reportedDiscoveries).to.be.an('array');
  expect(saved.quests.every((key) => !key.startsWith('joao.'))).to.equal(true);
  if (saved.quests.includes('houseBeforeQuest'))
    expect(saved.storyEvents).to.include(
      'joao.lisbon-opening.house-introduction',
    );
};

const clickCharacterLine = (body: string, position: 1 | 2) => {
  characterMessageIncludes(body, position);
  cy.get('[data-test=building]').click();
};

// Weather, water shimmer and other animated overlays repaint only a few
// pixels per frame, while a walking character repaints thousands, so
// movement is detected by counting substantially-changed bytes instead of
// comparing exact checksums (measured on the HD build: rain ≤ ~270
// bytes/frame, a one-tile move leaves ~1900+ bytes).
const PIXEL_DELTA = 8;
const MOVED_BYTES = 1200;
const QUIET_BYTES = 400;

const countChangedBytes = (
  before: Uint8ClampedArray,
  after: Uint8ClampedArray,
) => {
  let changed = 0;
  for (let i = 0; i < before.length; i += 1) {
    if (Math.abs(before[i] - after[i]) > PIXEL_DELTA) changed += 1;
  }
  return changed;
};

const screenPosition = ({ x, y }: MapPosition) => {
  const cameraX = Math.max(0, Math.min(x + 1 - 20, 56));
  const cameraY = Math.max(0, Math.min(y + 1 - 12.5, 71));
  return {
    x: Math.floor((x - cameraX) * 32),
    y: Math.floor((y - cameraY) * 32),
  };
};

// The port scene renders to the WebGL #camera-port canvas, so pixels are
// read back through a 2D snapshot.
const snapshot2d = (canvas: HTMLCanvasElement) => {
  const snapshot = canvas.ownerDocument.createElement('canvas');
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  const context = snapshot.getContext('2d')!;
  context.drawImage(canvas, 0, 0);
  return context;
};

const playerPixels = (canvas: HTMLCanvasElement, position: MapPosition) => {
  const context = snapshot2d(canvas);
  const screen = screenPosition(position);
  return context.getImageData(screen.x, screen.y, 64, 64).data;
};

const movementPixels = (
  canvas: HTMLCanvasElement,
  from: MapPosition,
  to: MapPosition,
) => {
  const context = snapshot2d(canvas);
  const fromScreen = screenPosition(from);
  const toScreen = screenPosition(to);
  const x = Math.min(fromScreen.x, toScreen.x);
  const y = Math.min(fromScreen.y, toScreen.y);
  const width = Math.abs(fromScreen.x - toScreen.x) + 64;
  const height = Math.abs(fromScreen.y - toScreen.y) + 64;
  return context.getImageData(x, y, width, height).data;
};

const nextPosition = (
  { x, y }: MapPosition,
  key: DirectionKey,
): MapPosition => ({
  x: x + (key === 'd' ? 1 : key === 'a' ? -1 : 0),
  y: y + (key === 's' ? 1 : key === 'w' ? -1 : 0),
});

const moveOneTile = (key: DirectionKey, context: string) =>
  cy.window().then(
    (window) =>
      new Cypress.Promise<void>((resolve, reject) => {
        const canvas = window.document.getElementById(
          'camera-port',
        ) as HTMLCanvasElement;
        const from = { ...modeledPosition };
        const to = nextPosition(from, key);
        const startingPlayerPixels = playerPixels(canvas, from);
        const startingMovementPixels = movementPixels(canvas, from, to);
        window.document.dispatchEvent(
          new window.KeyboardEvent('keydown', { key, bubbles: true }),
        );

        const waitUntilSettled = (
          previousMovementPixels: Uint8ClampedArray,
          stableFrames: number,
          remainingFrames = 600,
        ) => {
          window.requestAnimationFrame(() => {
            if (remainingFrames === 0) {
              window.document.dispatchEvent(
                new window.KeyboardEvent('keyup', { key, bubbles: true }),
              );
              reject(new Error(`Movement ${key} did not settle at ${context}`));
              return;
            }
            const currentMovementPixels = movementPixels(canvas, from, to);
            const nextStableFrames =
              countChangedBytes(previousMovementPixels, currentMovementPixels) <
              QUIET_BYTES
                ? stableFrames + 1
                : 0;
            if (nextStableFrames >= 6) {
              if (
                countChangedBytes(
                  startingMovementPixels,
                  currentMovementPixels,
                ) < MOVED_BYTES
              ) {
                reject(new Error(`Movement ${key} was blocked at ${context}`));
              } else {
                modeledPosition = to;
                resolve();
              }
              return;
            }
            waitUntilSettled(
              currentMovementPixels,
              nextStableFrames,
              remainingFrames - 1,
            );
          });
        };

        const waitUntilHandled = (remainingFrames = 600) => {
          window.requestAnimationFrame(() => {
            if (remainingFrames === 0) {
              window.document.dispatchEvent(
                new window.KeyboardEvent('keyup', { key, bubbles: true }),
              );
              reject(
                new Error(`Movement ${key} was not handled at ${context}`),
              );
              return;
            }
            if (
              window.document.querySelector('[data-test=building]') !== null
            ) {
              reject(new Error(`Entered a building during ${context}`));
              return;
            }
            if (
              countChangedBytes(
                startingPlayerPixels,
                playerPixels(canvas, from),
              ) < MOVED_BYTES
            ) {
              waitUntilHandled(remainingFrames - 1);
              return;
            }
            window.document.dispatchEvent(
              new window.KeyboardEvent('keyup', { key, bubbles: true }),
            );
            waitUntilSettled(movementPixels(canvas, from, to), 0);
          });
        };

        waitUntilHandled();
      }),
  );

const enterAdjacentBuilding = (key: DirectionKey) => {
  cy.document().trigger('keydown', { key });
  cy.get('[data-test=building]')
    .should('exist')
    .then(() => {
      modeledPosition = nextPosition(modeledPosition, key);
    });
  cy.document().trigger('keyup', { key });
};

const enterBuilding = (route: Route, openingLine?: string) => {
  const steps = route.flatMap(([key, count]) => Array(count).fill(key));
  const doorKey = steps.pop();
  steps.forEach((key, step) =>
    moveOneTile(key, `${openingLine ?? 'building'} approach tile ${step}`),
  );
  if (!doorKey)
    throw new Error(`Route for ${openingLine ?? 'building'} is empty`);
  enterAdjacentBuilding(doorKey);
  if (openingLine)
    cy.get('[data-test=building]').should('include.text', openingLine);
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
  if (remaining === 0) throw new Error('Story did not settle within 90 frames');
  return cy.document().then<void>((document) => {
    if (settled(document)) return;
    const before = currentStoryText(document);
    cy.get('[data-test=building]').click();
    cy.document().should((nextDocument) => {
      expect(
        settled(nextDocument) || currentStoryText(nextDocument) !== before,
      ).to.equal(true);
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
    .then(() => {
      modeledPosition = nextPosition(modeledPosition, 's');
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
    .then(() => {
      modeledPosition = nextPosition(modeledPosition, 's');
    });
};

const ensureNightOutsideAdjacentBuilding = (
  exitMessage?: string,
  remaining = 30,
): Cypress.Chainable<SavedState> => {
  if (remaining === 0)
    throw new Error('Adjacent-building loop did not reach nighttime');
  return readSavedState().then((saved) => {
    const minute = (saved.timePassed ?? 0) % 1440;
    if (minute < 240 || minute >= 1200) return;
    enterAdjacentBuilding('w');
    finishStoryEventToMenu();
    exitCurrentBuilding(exitMessage);
    return ensureNightOutsideAdjacentBuilding(exitMessage, remaining - 1);
  }) as unknown as Cypress.Chainable<SavedState>;
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

const spawnToPub: Route = [
  ['a', 3],
  ['w', 2],
  ['a', 2],
  ['w', 31],
  ['d', 5],
  ['w', 1],
];
const pubToChurch: Route = [
  ['s', 26],
  ['a', 3],
  ['s', 2],
  ['a', 39],
  ['w', 1],
];
const churchToHouse: Route = [
  ['d', 6],
  ['w', 3],
  ['d', 28],
  ['w', 9],
  ['d', 11],
  ['w', 1],
  ['d', 12],
  ['w', 1],
];
const houseToPub: Route = [
  ['a', 11],
  ['w', 11],
  ['a', 4],
  ['w', 5],
];
const spawnToHouse: Route = [
  ['a', 3],
  ['w', 2],
  ['a', 2],
  ['w', 15],
  ['d', 8],
  ['w', 1],
  ['d', 12],
  ['w', 1],
];
const houseToItemShop: Route = [
  ['a', 11],
  ['w', 1],
  ['a', 4],
  ['w', 1],
  ['a', 40],
  ['w', 1],
];
const itemShopToShipyard: Route = [
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
const shipyardToChurch: Route = [
  ['s', 1],
  ['a', 3],
  ['w', 5],
  ['a', 25],
  ['s', 2],
  ['a', 39],
  ['w', 1],
];
const churchToHarbor: Route = [
  ['d', 37],
  ['s', 3],
  ['d', 2],
  ['s', 2],
  ['d', 3],
  ['w', 1],
];
const pubToHarbor: Route = [
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

const harborPrelude = [
  ['So what’s the plan of action?', 1],
  ['Well, I thought we’d just sail around from port to port.', 2],
  ['Hah! That’s not a very bright plan.', 1],
  ['Why not?', 2],
  ['Gold. It takes a heap o’ gold to keep a ship like this afloat.', 1],
  ['Water’s free, but ye’d be amazed at how much it costs to feed a crew.', 1],
  ['So are you saying that this money won’t be enough?', 2],
  [
    'Well, it ought to last us about a month. But resting on that fact won’t get us any more!',
    1,
  ],
  [
    'But ye’re on the right track. Sailing around from port to port is a good beginning because...',
    1,
  ],
  ['Ah! You figure we can trade and make a profit along the way, right?', 1],
  ['Ah, now here’s a mate who’s using his noggin!', 1],
  [
    'But even if we decide to trade, I don’t know what to buy where and where to sell what.',
    2,
  ],
  [
    'Well, for example, we should buy goods particular to each port. Like Lisbon’s rock salt.',
    1,
  ],
  ['Hmmm...', 2],
  [
    'I’m a missionary, but the subject of economics fascinates me. It’s been a hobby of mine to study the market.',
    1,
  ],
  [
    'If we buy rock salt for 40 gold pieces here, we should be able to sell it for at least 60 gold pieces in Seville.',
    1,
  ],
] as const;

const harborFixture = () => {
  visitLegacyState({
    portId: '1',
    buildingId: '4',
    quests: [
      'houseBeforeQuest',
      'pubAfterQuest',
      'shipyardAfterQuest',
      'churchAfterQuest',
      'churchAfterEnrico',
      'houseAfterQuestAndPub',
    ],
    mates: [
      { sailorId: '1', role: 0 },
      { sailorId: '32', role: null },
      { sailorId: '33', role: null },
    ],
  });

  harborPrelude.forEach(([body, position]) =>
    clickCharacterLine(body, position),
  );
  characterMessageIncludes(
    'Captain, Brother Enrico seems to have a head for numbers, so why don’t ye make him the bookkeeper on our ship?',
    1,
  );
};

const expectSerializedNullMateRoles = (saved: SavedState) => {
  expect(saved.mates).to.deep.equal([
    { sailorId: '1', role: 0 },
    { sailorId: '32', role: null },
    { sailorId: '33', role: null },
  ]);
};

const advanceAtHarborUntilNight = (
  remaining = 20,
): Cypress.Chainable<SavedState> => {
  if (remaining === 0) throw new Error('Harbor loop did not reach nighttime');
  finishExitingStoryEvent();
  return readSavedState().then((saved) => {
    const minute = (saved.timePassed ?? 0) % 1440;
    if (minute >= 1200) return;
    enterAdjacentBuilding('w');
    return advanceAtHarborUntilNight(remaining - 1);
  }) as unknown as Cypress.Chainable<SavedState>;
};

const finishHouseFarewellAtNight = (
  availableText = 'Oh João, I just can’t understand',
  blockedText = 'the Duke’s orders were quite specific',
  remaining = 40,
): Cypress.Chainable<JQuery<HTMLElement>> =>
  cy.get('[data-test=building]').then(($building) => {
    const text = $building.text();
    if (text.includes(availableText)) {
      finishExitingStoryEvent('houseAfterQuestAndPub');
      return;
    }
    if (remaining === 0)
      throw new Error(
        'House farewell did not become available before midnight',
      );
    expect(text).to.include(blockedText);
    cy.wrap($building).click();
    cy.get('[data-test=building]')
      .should('not.exist')
      .then(() => {
        modeledPosition = nextPosition(modeledPosition, 's');
      });
    readSavedState().then((saved) => {
      expect((saved.timePassed ?? 0) % 1440).to.be.lessThan(1440);
    });
    enterAdjacentBuilding('w');
    finishHouseFarewellAtNight(availableText, blockedText, remaining - 1);
  });

const regressionTest = it;
const openingJourneyTest = it;
const firstVoyageJourneyTest = it;

describe('Structured story architecture through production assets', () => {
  openingJourneyTest(
    'plays a real new game through the complete Lisbon tutorial and departs',
    () => {
      cy.visit('');
      cy.contains('System').click();
      cy.contains('button', 'Reset').click();
      cy.contains('button', 'Confirm Reset?').click();
      cy.contains('Game is loading...').should('not.exist');
      cy.contains('Lisbon').should('exist');
      cy.then(() => {
        modeledPosition = { x: 54, y: 68 };
      });

      enterAdjacentBuilding('w');
      cy.get('[data-test=building]').should(
        'include.text',
        'whenever you have a problem, just go on over to the pub',
      );
      advanceAtHarborUntilNight();

      enterBuilding(spawnToPub, 'Well isn’t this a rare treat, Master João.');
      finishExitingStoryEvent('pubBeforeQuest');
      enterBuilding(
        pubToChurch,
        'Master João, is there anyone in the Duke Franco’s household',
      );
      finishExitingStoryEvent('churchBeforeQuest');
      enterBuilding(churchToHouse, 'Father, did you send for me?');
      finishExitingStoryEvent('houseBeforeQuest');
      enterBuilding(houseToPub, 'Master João, what’s going on?');
      finishExitingStoryEvent('pubAfterQuest');

      readSavedState().then((saved) => {
        expectCompatibleSemanticSave(saved);
        expect(saved.gold).to.equal(1000);
        expect(saved.quests).to.deep.equal([
          'pubBeforeQuest',
          'churchBeforeQuest',
          'houseBeforeQuest',
          'pubAfterQuest',
        ]);
        expect(saved.mates).to.deep.equal([
          { sailorId: '1', role: null },
          { sailorId: '32', role: null },
        ]);
      });

      cy.reload();
      cy.contains('Lisbon').should('exist');
      cy.then(() => {
        modeledPosition = { x: 54, y: 68 };
      });
      enterBuilding(spawnToHouse);
      finishHouseFarewellAtNight();
      enterBuilding(houseToItemShop, 'Welcome Master João. I have something');
      finishStoryEventToMenu('itemShopAfterQuest');
      exitCurrentBuilding();
      enterBuilding(
        itemShopToShipyard,
        'Ahoy there, is our ship finished yet?',
      );
      finishExitingStoryEvent('shipyardAfterQuest');
      enterBuilding(
        shipyardToChurch,
        'I’m glad you could make it, Master João.',
      );
      finishStoryEventToMenu('churchAfterQuest');
      exitCurrentBuilding('May God bless you in your travels!');
      enterAdjacentBuilding('w');
      cy.get('[data-test=building]').should(
        'include.text',
        'Thank you so much for agreeing to take Brother Enrico',
      );
      finishStoryEventToMenu('churchAfterEnrico');
      exitCurrentBuilding('May God bless you in your travels!');
      ensureNightOutsideAdjacentBuilding('May God bless you in your travels!');
      enterBuilding(churchToHarbor, 'So what’s the plan of action?');
      advanceStoryUntil(
        (document) => document.querySelector('[data-test=confirmYes]') !== null,
      );
      cy.get('[data-test=confirmYes]').click();
      finishStoryEventToMenu('harborFinal');

      readSavedState().then((saved) => {
        expectCompatibleSemanticSave(saved);
        expect(saved.gold).to.equal(2000);
        expect(saved.items).to.deep.equal(['53', '4']);
        expect(saved.mates).to.deep.equal([
          { sailorId: '1', role: 0 },
          { sailorId: '32', role: null },
          { sailorId: '33', role: null },
        ]);
        expect(saved.fleets?.['1'].ships).to.deep.equal([
          {
            id: '6',
            name: 'Hermes II',
            crew: 0,
            cargo: [],
            durability: 25,
          },
        ]);
        expect(saved.quests).to.deep.equal([
          'pubBeforeQuest',
          'churchBeforeQuest',
          'houseBeforeQuest',
          'pubAfterQuest',
          'houseAfterQuestAndPub',
          'itemShopAfterQuest',
          'shipyardAfterQuest',
          'churchAfterQuest',
          'churchAfterEnrico',
          'harborFinal',
        ]);
      });

      exitCurrentBuilding();
      ensureNightOutsideAdjacentBuilding();
      enterBuilding(spawnToPub, 'Hello João');
      finishStoryEventToMenu();
      clickMenu('Recruit Crew');
      characterMessageIncludes('Shall we recruit some men for our crew?', 2);
      cy.get('[data-test=confirmYes]').click();
      clickCharacterLine('Hey! Do any of you tough sailors want to join', 2);
      clickCharacterLine('We rounded up 10 men, at the cost of 400 gold', 2);
      cy.get('[data-test=menu]').should('exist');
      exitCurrentBuilding();
      ensureNightOutsideAdjacentBuilding();
      enterBuilding(pubToHarbor, 'Ahoy there, matey, will ye be shoving off?');
      clickMenu('Supply');
      cy.get('[data-test=harborSupply]').contains(/^0$/).first().click();
      cy.get('[data-test=inputNumberInput]').type('10{enter}');
      cy.get('[data-test=harborSupply]').contains(/^0$/).first().click();
      cy.get('[data-test=inputNumberInput]').type('10{enter}');
      readSavedState().then((saved) => {
        expect(saved.gold).to.equal(1400);
        expect(saved.fleets?.['1'].ships[0].cargo).to.deep.equal([
          { type: 'water', quantity: 10 },
          { type: 'food', quantity: 10 },
        ]);
      });
      cy.get('[data-test=building]').rightclick();
      clickMenu('Sail');
      characterMessageIncludes(
        'We can sail for 10 days. Shall we cast off?',
        2,
      );
      cy.get('[data-test=confirmYes]').click();
      cy.get('[data-test=building]').should('not.exist');
      cy.contains('Lisbon').should('not.exist');

      readSavedState().then((saved) => {
        expectCompatibleSemanticSave(saved);
        expect(saved.portId).to.be.null;
        expect(saved.buildingId).to.be.null;
        expect(saved.gold).to.equal(1400);
        expect(saved.items).to.deep.equal(['53', '4']);
        expect(saved.mates).to.deep.equal([
          { sailorId: '1', role: 0 },
          { sailorId: '32', role: null },
          { sailorId: '33', role: null },
        ]);
        expect(saved.fleets?.['1'].ships[0]).to.deep.include({
          id: '6',
          name: 'Hermes II',
          crew: 10,
          cargo: [
            { type: 'water', quantity: 10 },
            { type: 'food', quantity: 10 },
          ],
          durability: 25,
        });
        expect(saved.quests).to.have.length(10);
      });
    },
  );

  regressionTest('starts a new Save v2 at the exact João opening line', () => {
    visitLegacyState({ portId: '1', buildingId: '8' });

    cy.contains('Game is loading...').should('not.exist');
    characterMessageIncludes('Father, did you send for me?', 2);
    readSavedState().then(expectCompatibleSemanticSave);
  });

  regressionTest(
    'continues a partial Save v2 at the next Lisbon event without repeating it after reload',
    () => {
      visitLegacyState({
        portId: '1',
        buildingId: '10',
        quests: ['houseBeforeQuest', 'pubAfterQuest'],
      });

      vendorMessageIncludes('Welcome Master João. I have something for you.');
      cy.get('[data-test=building]').click();
      clickCharacterLine('For me?', 2);
      vendorMessageIncludes(
        'Your Butler Marco came by here and asked me to give this rapier to you if you stopped by.',
      );
      cy.get('[data-test=building]').click();
      vendorMessageIncludes('It’s already been paid for, so please take it.');
      cy.get('[data-test=building]').click();
      vendorMessageIncludes(
        'Be careful out there. And remember, a weapon’s useless if you don’t equip yourself with it.',
      );

      readSavedState().then((saved) => {
        expectCompatibleSemanticSave(saved);
        expect(saved.quests).to.deep.equal([
          'houseBeforeQuest',
          'pubAfterQuest',
          'itemShopAfterQuest',
        ]);
        expect(saved.items).to.include('4');
      });

      cy.reload();
      vendorMessageIncludes(
        'Be careful out there. And remember, a weapon’s useless if you don’t equip yourself with it.',
      );
      cy.get('[data-test=vendorMessageBox]').should(
        'not.include.text',
        'Welcome Master João. I have something for you.',
      );
    },
  );

  regressionTest(
    'preserves legacy Save v2 mate roles and completion on the harbor Yes branch',
    () => {
      harborFixture();
      cy.get('[data-test=confirmYes]').click();

      characterMessageIncludes(
        'Not a bad idea. Welcome to the crew, Brother Enrico.',
        2,
      );
      readSavedState().then((saved) => {
        expectCompatibleSemanticSave(saved);
        expectSerializedNullMateRoles(saved);
        expect(saved.quests).not.to.include('harborFinal');
      });

      clickCharacterLine(
        'Not a bad idea. Welcome to the crew, Brother Enrico.',
        2,
      );
      clickCharacterLine('Oh, and I’d like you to be first mate, Rocco.', 2);
      clickCharacterLine(
        'Well, I do have a pretty good idea of prices at the ports I’ve read about.',
        1,
      );
      clickCharacterLine(
        'If we check our log of goods, I should be able to figure out which port will pay the most for each item.',
        1,
      );

      readSavedState().then((saved) => {
        expectCompatibleSemanticSave(saved);
        expectSerializedNullMateRoles(saved);
        expect(saved.quests).to.include('harborFinal');
      });
    },
  );

  regressionTest(
    'preserves legacy Save v2 mate roles and completion on the harbor No branch',
    () => {
      harborFixture();
      cy.get('[data-test=confirmNo]').click();

      clickCharacterLine(
        'No, it’s not right to ask Brother Enrico to do such work.',
        2,
      );
      clickCharacterLine(
        'Well, actually, I wouldn’t mind it in the least. I’d be glad to help!',
        1,
      );
      clickCharacterLine(
        'Well then, perhaps I’ll ask you again when we start to trade.',
        2,
      );

      readSavedState().then((saved) => {
        expectCompatibleSemanticSave(saved);
        expectSerializedNullMateRoles(saved);
        expect(saved.quests).to.include('harborFinal');
      });
    },
  );

  firstVoyageJourneyTest(
    'plays a fresh Chinese game through the opening and first voyage chapter',
    () => {
      playFreshChineseOpeningAndFirstVoyage('m1-chinese');
    },
  );
});
