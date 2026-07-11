import fs from 'fs';
import path from 'path';

describe('Lisbon Save v2 compatibility boundary', () => {
  test('owns the legacy mapping without depending on arc internals', () => {
    const adapterPath = path.resolve(__dirname, 'lisbonCompletionKeys.ts');
    const dialoguePath = path.resolve(
      __dirname,
      '../content/arcs/joao/lisbon-opening/dialogue.ts',
    );
    const fixturePath = path.resolve(
      __dirname,
      '../__fixtures__/legacyLisbonSnapshot.ts',
    );
    const adapterSource = fs.readFileSync(adapterPath, 'utf8');
    const dialogueSource = fs.readFileSync(dialoguePath, 'utf8');
    const fixtureSource = fs.readFileSync(fixturePath, 'utf8');

    expect(adapterSource).not.toMatch(/content\/arcs/);
    expect(adapterSource).toMatch(
      /export const legacyToSemanticEvent\s*=\s*\{/,
    );
    expect(adapterSource).toMatch(
      /export type LegacyLisbonKey\s*=\s*keyof typeof legacyToSemanticEvent/,
    );
    expect(dialogueSource).not.toMatch(
      /export const legacyToSemanticEvent|export type LegacyLisbonKey/,
    );
    expect(fixtureSource).toMatch(
      /from ['"]\.\.\/legacy\/lisbonCompletionKeys['"]/,
    );
  });
});
