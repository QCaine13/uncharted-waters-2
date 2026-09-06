// Existing regression specs assert the canonical English presentation. Keep
// that language explicit while the localization spec exercises first-launch
// Chinese and live switching.
Cypress.on('window:before:load', (window) => {
  if (Cypress.spec.name !== 'localization.cy.ts') {
    const requestedLocale = window.localStorage.getItem('uw2.e2e.locale');
    window.localStorage.setItem(
      'uw2.locale',
      requestedLocale === 'zh-CN' ? 'zh-CN' : 'en',
    );
  }
});

beforeEach(() => {
  if (Cypress.spec.name !== 'localization.cy.ts') {
    cy.window({ log: false }).then((window) => {
      const requestedLocale = window.localStorage.getItem('uw2.e2e.locale');
      window.localStorage.setItem(
        'uw2.locale',
        requestedLocale === 'zh-CN' ? 'zh-CN' : 'en',
      );
    });
  }
});
