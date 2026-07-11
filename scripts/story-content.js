const { spawnSync } = require('child_process');

const mode = process.argv[2];

if (mode !== 'validate' && mode !== 'report') {
  console.error('Usage: node scripts/story-content.js <validate|report>');
  process.exit(1);
}

const testName =
  mode === 'report' ? 'prints story content report' : 'validates story content';
const result = spawnSync(
  process.execPath,
  [
    require.resolve('jest/bin/jest'),
    'src/story/contentManifest.test.ts',
    '--runInBand',
    '-t',
    testName,
  ],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
