import { SAVED_STATE_KEY, type State } from '../../src/state/state';
import {
  characterMessageIncludes,
  setState,
  vendorMessageIncludes,
} from '../utils';

type SavedState = Pick<State, 'items' | 'mates' | 'quests'> & {
  version: number;
};

const readSavedState = () =>
  cy.window().then((window) => {
    const raw = window.localStorage.getItem(SAVED_STATE_KEY);
    expect(raw).not.to.be.null;
    return JSON.parse(raw as string) as SavedState;
  });

const expectSaveV2LegacyOnly = (saved: SavedState) => {
  expect(saved.version).to.equal(2);
  expect(JSON.stringify(saved)).not.to.include('joao.lisbon-opening.');
};

const clickCharacterLine = (body: string, position: 1 | 2) => {
  characterMessageIncludes(body, position);
  cy.get('[data-test=building]').click();
};

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
  setState({
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
  cy.visit('');

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

describe('Structured story architecture through production assets', () => {
  it('starts a new Save v2 at the exact João opening line', () => {
    setState({ portId: '1', buildingId: '8' });
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');
    characterMessageIncludes('Father, did you send for me?', 2);
    readSavedState().then(expectSaveV2LegacyOnly);
  });

  it('continues a partial Save v2 at the next Lisbon event without repeating it after reload', () => {
    setState({
      portId: '1',
      buildingId: '10',
      quests: ['houseBeforeQuest', 'pubAfterQuest'],
    });
    cy.visit('');

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
      expectSaveV2LegacyOnly(saved);
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
  });

  it('preserves legacy Save v2 mate roles and completion on the harbor Yes branch', () => {
    harborFixture();
    cy.get('[data-test=confirmYes]').click();

    characterMessageIncludes(
      'Not a bad idea. Welcome to the crew, Brother Enrico.',
      2,
    );
    readSavedState().then((saved) => {
      expectSaveV2LegacyOnly(saved);
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
      expectSaveV2LegacyOnly(saved);
      expectSerializedNullMateRoles(saved);
      expect(saved.quests).to.include('harborFinal');
    });
  });

  it('preserves legacy Save v2 mate roles and completion on the harbor No branch', () => {
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
      expectSaveV2LegacyOnly(saved);
      expectSerializedNullMateRoles(saved);
      expect(saved.quests).to.include('harborFinal');
    });
  });
});
