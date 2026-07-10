const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const LFS_SIGNATURE = 'version https://git-lfs.github.com/spec/v1';
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const OGG_SIGNATURE = Buffer.from('OggS', 'ascii');
const MP3_ID3_SIGNATURE = Buffer.from('ID3', 'ascii');

const validateAssetBuffer = (filePath, buffer) => {
  if (buffer.subarray(0, LFS_SIGNATURE.length).toString() === LFS_SIGNATURE) {
    return `${filePath}: Git LFS pointer was not hydrated`;
  }
  if (
    path.extname(filePath) === '.png' &&
    !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    return `${filePath}: invalid PNG signature`;
  }
  if (
    path.extname(filePath) === '.ogg' &&
    !buffer.subarray(0, OGG_SIGNATURE.length).equals(OGG_SIGNATURE)
  ) {
    return `${filePath}: invalid Ogg signature`;
  }
  if (
    path.extname(filePath) === '.mp3' &&
    !buffer.subarray(0, MP3_ID3_SIGNATURE.length).equals(MP3_ID3_SIGNATURE) &&
    !(buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  ) {
    return `${filePath}: invalid MP3 signature`;
  }
  return null;
};

const getTrackedAssetPaths = () =>
  execFileSync('git', ['ls-files', '-z', '--', '*.png', '*.ogg', '*.mp3'])
    .toString()
    .split('\0')
    .filter(Boolean);

const main = (paths = getTrackedAssetPaths()) => {
  const errors = paths.flatMap((filePath) => {
    if (!fs.existsSync(filePath)) return [`${filePath}: missing file`];
    const error = validateAssetBuffer(filePath, fs.readFileSync(filePath));
    return error ? [error] : [];
  });

  if (errors.length) {
    process.stderr.write(`${errors.join('\n')}\n`);
    return 1;
  }

  process.stdout.write(`Verified ${paths.length} PNG/OGG/MP3 assets.\n`);
  return 0;
};

if (require.main === module) process.exitCode = main();

module.exports = { validateAssetBuffer, getTrackedAssetPaths, main };
