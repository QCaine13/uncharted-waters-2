import Input from './input';

describe('localized form keyboard isolation', () => {
  beforeAll(() => Input.setup());

  beforeEach(() => {
    Input.reset();
    document.body.innerHTML =
      '<div id="game"></div><select><option>English</option></select>';
  });

  test('releasing a movement key over the language select clears held movement', () => {
    const game = document.querySelector('#game')!;
    const select = document.querySelector('select')!;
    game.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', bubbles: true }),
    );
    expect(Input.getDirection({ includeOrdinal: true })).toBe('n');

    select.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'w', bubbles: true }),
    );
    expect(Input.getDirection({ includeOrdinal: true })).toBe('');
  });

  test('typing a game action key in the language select does not confirm', () => {
    const select = document.querySelector('select')!;
    select.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'e', bubbles: true }),
    );
    expect(Input.getPressedE()).toBe(false);
  });
});
