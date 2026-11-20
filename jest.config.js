module.exports = {
  // ts-jest is much slower and not needed as we run tsc as part of build
  // @swc/jest is faster than Babel
  transform: {
    '\\.tsx?$': '@swc/jest',
  },
  moduleNameMapper: {
    '\\.(bin|ogg|mp3|wasm)$': 'identity-obj-proxy',
    // images are used as <img src>/texture URLs, so they must be strings
    '\\.(png|webp)$': '<rootDir>/tests/fileMock.js',
    '^pixi.js$': '<rootDir>/tests/pixi.stub.ts',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/testSetup.ts'],
  testMatch: ['**/*.test.{ts,tsx}'],
  // Agent worktrees live under .claude/worktrees/ — inside the repo root, so
  // testMatch walks into them and runs a second full copy of the suite. That
  // doubles the run and reports another checkout's results as if they were
  // this one's.
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/\\.claude/',
    '<rootDir>/\\.worktrees/',
  ],
};
