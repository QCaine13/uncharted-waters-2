// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1700,
  viewportHeight: 1000,
  screenshotsFolder: 'tests/screenshots',
  video: false,
  fixturesFolder: false,
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'tests/e2e/**/*.cy.ts',
    supportFile: 'tests/e2e/support.ts',
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.isHeadless) {
          launchOptions.args = launchOptions.args.filter(
            (argument) => !argument.startsWith('--window-size='),
          );
          launchOptions.args.push('--window-size=1800,1100');
        }
        return launchOptions;
      });
    },
  },
});
