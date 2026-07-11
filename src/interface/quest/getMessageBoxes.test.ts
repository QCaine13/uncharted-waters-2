import getMessageBoxes, { getMessageBoxesFromFrame } from './getMessageBoxes';
import { CharacterMessage, VendorMessage } from './questData';
import { characterId } from '../../story/core/types';

const vendorMessage: VendorMessage = {
  body: 'Hello, World!',
  position: 0,
};

const characterMessage1: CharacterMessage = {
  body: 'Hello, World!1',
  characterId: '1',
  position: 1,
};

const characterMessage2: CharacterMessage = {
  body: 'Hello, World!2',
  characterId: '2',
  position: 2,
};

describe('When no one has spoken yet', () => {
  test('If vendor message is active, the others should be hidden', () => {
    expect(getMessageBoxes([vendorMessage], 0)).toEqual([
      {
        body: vendorMessage.body,
      },
      null,
      null,
    ]);
  });

  test('If upper message is active, the others should be hidden', () => {
    expect(getMessageBoxes([characterMessage1], 0)).toEqual([
      null,
      {
        body: characterMessage1.body,
        characterId: characterMessage1.characterId,
      },
      null,
    ]);
  });

  test('If lower message is active, the others should be hidden', () => {
    expect(getMessageBoxes([characterMessage2], 0)).toEqual([
      null,
      null,
      {
        body: characterMessage2.body,
        characterId: characterMessage2.characterId,
      },
    ]);
  });
});

describe('Vendor message if not active', () => {
  test('Should still be an empty box if vendor has spoken prior', () => {
    expect(getMessageBoxes([vendorMessage, characterMessage1], 1)).toEqual([
      { body: '' },
      {
        body: characterMessage1.body,
        characterId: characterMessage1.characterId,
      },
      null,
    ]);

    expect(
      getMessageBoxes([vendorMessage, characterMessage2, characterMessage2], 2),
    ).toEqual([
      { body: '' },
      null,
      {
        body: characterMessage2.body,
        characterId: characterMessage2.characterId,
      },
    ]);
  });
});

describe('Upper message if not active', () => {
  test('Should still be an empty box, with characterId matching the last character that used upper', () => {
    expect(getMessageBoxes([characterMessage1, characterMessage2], 1)).toEqual([
      null,
      {
        body: '',
        characterId: characterMessage1.characterId,
      },
      {
        body: characterMessage2.body,
        characterId: characterMessage2.characterId,
      },
    ]);

    expect(
      getMessageBoxes(
        [
          characterMessage1,
          { body: 'Hello, World!3', characterId: '3', position: 1 },
          characterMessage2,
        ],
        2,
      ),
    ).toEqual([
      null,
      {
        body: '',
        characterId: '3',
      },
      {
        body: characterMessage2.body,
        characterId: characterMessage2.characterId,
      },
    ]);
  });
});

describe('Lower message if not active', () => {
  test('Should still be an empty box, with characterId matching the last character that used lower', () => {
    expect(getMessageBoxes([characterMessage2, characterMessage1], 1)).toEqual([
      null,
      {
        body: characterMessage1.body,
        characterId: characterMessage1.characterId,
      },
      {
        body: '',
        characterId: characterMessage2.characterId,
      },
    ]);

    expect(
      getMessageBoxes([characterMessage2, vendorMessage, characterMessage1], 2),
    ).toEqual([
      { body: '' },
      {
        body: characterMessage1.body,
        characterId: characterMessage1.characterId,
      },
      {
        body: '',
        characterId: characterMessage2.characterId,
      },
    ]);
  });
});

test('Substitutes $firstName', () => {
  expect(
    getMessageBoxes([{ body: 'Hello, $firstName!', position: 0 }], 0)[0],
  ).toMatchObject({ body: 'Hello, João!' });
});

test('Substitutes $lastName', () => {
  expect(
    getMessageBoxes([{ body: 'Hello, $lastName!', position: 0 }], 0)[0],
  ).toMatchObject({ body: 'Hello, Franco!' });
});

test('projects interpolated dialogue without modifying frozen source content', () => {
  const frozen = Object.freeze({
    type: 'dialogue' as const,
    body: 'Hello, $firstName $lastName!',
    position: 2 as const,
    speaker: characterId('joao'),
  });

  expect(getMessageBoxesFromFrame([], frozen)[2]).toMatchObject({
    body: 'Hello, João Franco!',
  });
  expect(frozen.body).toBe('Hello, $firstName $lastName!');
});

test('projects a spoken choice prompt and confirmation on the same frame', () => {
  const choose = jest.fn();
  const messageBoxes = getMessageBoxesFromFrame(
    [],
    {
      type: 'choice',
      prompt: 'Captain $firstName, appoint a bookkeeper?',
      position: 1,
      speaker: characterId('rocco'),
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
    },
    choose,
  );

  expect(messageBoxes).toEqual([
    null,
    {
      body: 'Captain João, appoint a bookkeeper?',
      characterId: characterId('rocco'),
      confirm: {
        yes: expect.any(Function),
        no: expect.any(Function),
      },
    },
    null,
  ]);

  messageBoxes[1]?.confirm?.yes();
  messageBoxes[1]?.confirm?.no();
  expect(choose.mock.calls).toEqual([['yes'], ['no']]);
});
