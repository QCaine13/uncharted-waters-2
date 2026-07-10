// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validateAssetBuffer } = require('./verify-assets');

describe('asset preflight', () => {
  test('accepts PNG and Ogg signatures', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ogg = Buffer.from('OggS', 'ascii');

    expect(validateAssetBuffer('sprite.png', png)).toBeNull();
    expect(validateAssetBuffer('music.ogg', ogg)).toBeNull();
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
