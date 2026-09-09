import { conflictAndGrowthEvents } from './content/arcs/joao/conflict-and-growth';
import type { StoryStep } from './core/types';

const visibleText = (steps: readonly StoryStep[]): string[] =>
  steps.flatMap((step) => {
    if (step.type === 'dialogue') return [step.body];
    if (step.type === 'choice') {
      return [
        step.prompt,
        ...step.options.flatMap((option) => visibleText(option.steps)),
      ];
    }
    return [];
  });

const event = (suffix: string) => {
  const found = conflictAndGrowthEvents.find(
    ({ id }) => id === `joao.conflict-and-growth.${suffix}`,
  );
  if (!found) throw new Error(`Missing event ${suffix}`);
  return found;
};

describe('conflict and growth transcript', () => {
  test('carries the identity, pursuit, Lucia, and sister-report story beats', () => {
    expect(visibleText(event('identity-revealed').steps)).toEqual([
      'Enough, Kahn. João deserves the truth: my name is Alberto. I am a prince.',
      'You stood beside me when you knew nothing of my title. Let us return to Lisbon and speak with your father.',
    ]);
    expect(visibleText(event('katarina-battle-start').steps)).toEqual([
      'João Franco! Your family owes mine an answer. You will not slip away today.',
      'I do not know what happened to your family. But I must protect my crew.',
    ]);
    expect(visibleText(event('ali-request').steps)).toEqual([
      'Lucia has been taken. I also seek my sister, Sasha. Will you ask after her at the Lisbon pub?',
    ]);
    expect(visibleText(event('chapter-complete').steps)).toEqual([
      'Sasha is safe in Basra... Thank you, João. At last I know where to find her.',
      'We have crossed swords and crossed seas. Now we can set our next course with our friends in mind.',
    ]);
  });

  test('makes both deferrals explicit and keeps them journal-discoverable', () => {
    const warningChoice = event('katarina-warning').steps.find(
      (step) => step.type === 'choice',
    );
    const retryChoice = event('katarina-retry').steps.find(
      (step) => step.type === 'choice',
    );
    expect(warningChoice).toMatchObject({
      type: 'choice',
      prompt:
        'Shall we sail on and face whoever follows? We can prepare our ship and supplies here first.',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
    });
    expect(retryChoice).toMatchObject({
      type: 'choice',
      prompt: 'Sail out and face Katarina again?',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
    });
    if (!warningChoice || warningChoice.type !== 'choice') {
      throw new Error('Missing warning choice');
    }
    if (!retryChoice || retryChoice.type !== 'choice') {
      throw new Error('Missing retry choice');
    }
    expect(visibleText(warningChoice.options[1].steps)).toEqual([
      'Then we will prepare in Seville. Return to this pub when you are ready.',
    ]);
    expect(visibleText(retryChoice.options[1].steps)).toEqual([
      'Then we will prepare here. Find me at the harbor when you are ready.',
    ]);
  });

  test('keeps every visible box concise and every choice compatible with the adapter', () => {
    const allText = conflictAndGrowthEvents.flatMap(({ steps }) =>
      visibleText(steps),
    );
    expect(allText.length).toBeGreaterThanOrEqual(28);
    allText.forEach((text) => expect(text.length).toBeLessThanOrEqual(120));
    conflictAndGrowthEvents.forEach(({ steps }) => {
      steps
        .flatMap((step) => (step.type === 'choice' ? [step] : []))
        .forEach(({ options }) =>
          expect(options.map(({ id, label }) => ({ id, label }))).toEqual([
            { id: 'yes', label: 'Yes' },
            { id: 'no', label: 'No' },
          ]),
        );
    });
  });
});
