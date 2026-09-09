import { setLocale, t } from '../localization';
import { storyContentSource } from './content';
import type { StoryEvent, StoryStep } from './core/types';

const massawaEvents = (): StoryEvent[] =>
  storyContentSource.events.filter(({ arcId }) => arcId === 'joao.massawa');

const event = (suffix: string): StoryEvent => {
  const found = massawaEvents().find(
    ({ id }) => id === `joao.massawa.${suffix}`,
  );
  if (!found) throw new Error(`Missing Massawa event ${suffix}`);
  return found;
};

const visibleText = (steps: readonly StoryStep[]): string[] =>
  steps.flatMap((step): string[] => {
    if (step.type === 'dialogue') return [step.body];
    if (step.type === 'choice') {
      return [
        step.prompt,
        ...step.options.flatMap(({ label, steps: optionSteps }) => [
          label,
          ...visibleText(optionSteps),
        ]),
      ];
    }
    return [];
  });

describe('Massawa transcript', () => {
  test('keeps ordered progression ahead of advice without random story groups or roster effects', () => {
    const events = massawaEvents();
    const repeatableAdviceIds = new Set([
      'joao.massawa.waiting-advice',
      'joao.massawa.ottoman-one-retry',
      'joao.massawa.ottoman-two-retry',
    ]);
    const priorities = events.map(({ id, priority }) => ({ id, priority }));
    priorities.forEach(({ id, priority }) => {
      if (repeatableAdviceIds.has(id)) {
        expect(priority).toBeGreaterThanOrEqual(0.3);
        expect(priority).toBeLessThan(0.4);
      } else {
        expect(priority).toBeGreaterThanOrEqual(0.1);
        expect(priority).toBeLessThan(0.2);
      }
    });
    expect(new Set(priorities.map(({ priority }) => priority)).size).toBe(
      events.length,
    );
    expect(events.every(({ randomGroup }) => randomGroup === undefined)).toBe(
      true,
    );

    const effects = (steps: readonly StoryStep[]): string[] =>
      steps.flatMap((step): string[] => {
        if (step.type === 'effect') {
          return step.effects.map(({ type }) => type);
        }
        if (step.type === 'choice') {
          return step.options.flatMap(({ steps: optionSteps }) =>
            effects(optionSteps),
          );
        }
        return [];
      });
    expect(events.flatMap(({ steps }) => effects(steps))).not.toContain(
      'addCompanion',
    );
  });

  test('completes every once event in its own final effect group', () => {
    massawaEvents()
      .filter(({ repeat }) => repeat === 'once')
      .forEach((candidate) => {
        const finalStep = candidate.steps[candidate.steps.length - 1];
        expect(finalStep).toMatchObject({
          type: 'effect',
          effects: expect.arrayContaining([
            { type: 'completeEvent', eventId: candidate.id },
          ]),
        });
      });
  });

  test('states the real facilities, wait rule, geographic sortie direction, and local retry adaptation', () => {
    expect(visibleText(event('ali-massawa-lead').steps).join(' ')).toContain(
      'religious house',
    );
    expect(visibleText(event('religious-lead').steps).join(' ')).toContain(
      'southwest residence',
    );
    expect(visibleText(event('pietro-commissioned').steps).join(' ')).toContain(
      'Massawa',
    );
    expect(visibleText(event('waiting-advice').steps).join(' ')).toContain(
      'day 11 of a later month',
    );
    expect(visibleText(event('first-sortie-ready').steps).join(' ')).toContain(
      'east and slightly south of Massawa',
    );
    expect(visibleText(event('ottoman-one-retry').steps).join(' ')).toContain(
      'immediately from this harbor',
    );
    expect(visibleText(event('ottoman-two-retry').steps).join(' ')).toContain(
      'immediately from this harbor',
    );
    massawaEvents()
      .flatMap(({ steps }) => visibleText(steps))
      .forEach((line) =>
        expect(line).not.toMatch(/\b(?:115[2-6]|52[7-9]|53[0-3])\b/),
      );
  });

  test('settles Pietro and Enrico chronology before Katarina reconciles', () => {
    expect(visibleText(event('chapter-complete').steps)).toEqual([
      'I carried the Staff here as promised; Enrico can confirm when it reached Massawa.',
      'I recorded its arrival before our next voyage. Pietro kept his word, João.',
      'I judged you by your family name. You defended Massawa and returned its Staff; let us part as allies.',
    ]);
  });

  test('provides Chinese for every line and keeps all readiness and retry choices compatible', () => {
    setLocale('zh-CN');
    const events = massawaEvents();
    expect(events).toHaveLength(18);
    const sources = events.flatMap(({ steps }) => visibleText(steps));
    sources.forEach((source) => {
      expect(t(source)).toBeTruthy();
      expect(t(source)).not.toBe(source);
    });

    const choices = events.flatMap(({ steps }) =>
      steps.flatMap((step) => (step.type === 'choice' ? [step] : [])),
    );
    expect(choices).toHaveLength(4);
    choices.forEach(({ options }) => {
      expect(options.map(({ id, label }) => ({ id, label }))).toEqual([
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ]);
    });
  });
});
