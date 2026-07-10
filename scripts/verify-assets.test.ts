// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validateAssetBuffer } = require('./verify-assets');

describe('asset preflight', () => {
  test('accepts PNG and Ogg signatures', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ogg = Buffer.from('OggS', 'ascii');

    expect(validateAssetBuffer('sprite.png', png)).toBeNull();
    expect(validateAssetBuffer('music.ogg', ogg)).toBeNull();
  });

  test('accepts an MP3 ID3 header', () => {
    expect(
      validateAssetBuffer('music.mp3', Buffer.from('ID3', 'ascii')),
    ).toBeNull();
  });

  test('accepts an MP3 MPEG frame sync', () => {
    expect(
      validateAssetBuffer('music.mp3', Buffer.from([0xff, 0xe0])),
    ).toBeNull();
  });

  test('rejects an invalid MP3 signature', () => {
    expect(validateAssetBuffer('music.mp3', Buffer.from('not mp3'))).toContain(
      'invalid MP3 signature',
    );
  });

  test('rejects an MP3 Git LFS pointer before format validation', () => {
    const pointer = Buffer.from(
      'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:abc\nsize 123\n',
    );

    expect(validateAssetBuffer('music.mp3', pointer)).toContain(
      'Git LFS pointer',
    );
  });

  test('rejects pointers and invalid signatures', () => {
    const pointer = Buffer.from(
      'version https://git-lfs.github.com/spec/v1\n' +
        'oid sha256:abc\nsize 123\n',
    );

    expect(validateAssetBuffer('sprite.png', pointer)).toContain(
      'Git LFS pointer',
    );
    expect(validateAssetBuffer('sprite.png', Buffer.from('not png'))).toContain(
      'invalid PNG signature',
    );
    expect(validateAssetBuffer('music.ogg', Buffer.from('not ogg'))).toContain(
      'invalid Ogg signature',
    );
  });
});
