import Input from './input';

beforeAll(() => Input.setup());
afterEach(() => Input.reset());

const key = (type: 'keydown' | 'keyup', value: string) =>
  document.dispatchEvent(
    new KeyboardEvent(type, { key: value, bubbles: true }),
  );

test('nested overlays keep navigation suspended until both close', () => {
  key('keydown', 'w');
  const releaseStory = Input.suspend();
  const releaseJournal = Input.suspend();
  expect(Input.isSuspended()).toBe(true);
  expect(Input.getDirection({ includeOrdinal: true })).toBe('');
  releaseJournal();
  releaseJournal();
  expect(Input.isSuspended()).toBe(true);
  releaseStory();
  expect(Input.isSuspended()).toBe(false);
});

test('a dialogue confirmation key released after closing never docks the ship', () => {
  const release = Input.suspend();
  key('keydown', 'e');
  release();
  key('keyup', 'e');
  expect(Input.getPressedE()).toBe(false);
  key('keydown', 'w');
  expect(Input.getDirection({ includeOrdinal: true })).toBe('n');
  key('keyup', 'w');
  key('keydown', 'e');
  key('keyup', 'e');
  expect(Input.getPressedE()).toBe(true);
});

test('losing focus during a held dialog key does not latch the next sailing direction', () => {
  const release = Input.suspend();
  key('keydown', 'w');
  window.dispatchEvent(new Event('blur'));
  release();
  key('keydown', 'w');
  key('keyup', 'w');
  expect(Input.getDirection({ includeOrdinal: true })).toBe('');
});

test('a held overlay key cannot autorepeat into navigation after mouse dismissal', () => {
  const release = Input.suspend();
  key('keydown', 'w');
  release();
  key('keydown', 'w');
  key('keyup', 'w');
  expect(Input.getDirection({ includeOrdinal: true })).toBe('');
  key('keydown', 'w');
  expect(Input.getDirection({ includeOrdinal: true })).toBe('n');
  key('keyup', 'w');
});

test('combat suspension remains observable until its token is released', () => {
  const releaseCombat = Input.suspend('combat');
  expect(Input.isSuspended()).toBe(true);
  expect(Input.isSuspended('combat')).toBe(true);
  expect(Input.isSuspended('overlay')).toBe(false);

  releaseCombat();
  expect(Input.isSuspended('combat')).toBe(false);
});
