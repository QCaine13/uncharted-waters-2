// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'cypress';
import { routePlannerTasks } from './tests/worldRoutePlanner';

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
      on('task', routePlannerTasks);
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.isHeadless) {
          const args = launchOptions.args.filter(
            (argument) => !argument.startsWith('--window-size='),
          );
          args.push('--window-size=1800,1100');
          return { ...launchOptions, args };
        }
        return launchOptions;
      });
    },
  },
});
