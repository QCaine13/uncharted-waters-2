import { setLocale, t } from '../localization';
import { storyContentSource } from './content';
import { characterId, type StoryEvent, type StoryStep } from './core/types';

const finaleEvents = (): StoryEvent[] =>
  storyContentSource.events.filter(({ arcId }) => arcId === 'joao.finale');

const event = (suffix: string): StoryEvent => {
  const found = finaleEvents().find(({ id }) => id === `joao.finale.${suffix}`);
  if (!found) throw new Error(`Missing finale event ${suffix}`);
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

const effectTypes = (steps: readonly StoryStep[]): string[] =>
  steps.flatMap((step): string[] => {
    if (step.type === 'effect') return step.effects.map(({ type }) => type);
    if (step.type === 'choice') {
      return step.options.flatMap(({ steps: optionSteps }) =>
        effectTypes(optionSteps),
      );
    }
    return [];
  });

const combatEncounterIds = (steps: readonly StoryStep[]): string[] =>
  steps.flatMap((step): string[] => {
    if (step.type === 'effect') {
      return step.effects.flatMap((effect) =>
        effect.type === 'startCombat' ? [effect.encounterId] : [],
      );
    }
    if (step.type === 'choice') {
      return step.options.flatMap(({ steps: optionSteps }) =>
        combatEncounterIds(optionSteps),
      );
    }
    return [];
  });

describe('João finale transcript', () => {
  test('registers the three story-only actors with exact bilingual names and no invented portraits', () => {
    expect(storyContentSource.characters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: characterId('rudolph'),
          names: { en: 'Rudolph', zh: '鲁道夫' },
        }),
        expect.objectContaining({
          id: characterId('ezequiel'),
          names: { en: 'Ezequiel', zh: '艾泽格' },
        }),
        expect.objectContaining({
          id: characterId('martinez'),
          names: { en: 'Martinez', zh: '马丁内斯' },
        }),
      ]),
    );
    ['rudolph', 'ezequiel', 'martinez'].forEach((id) => {
      const actor = storyContentSource.characters.find(
        ({ id: candidate }) => candidate === id,
      );
      expect(actor).toBeDefined();
      expect(actor).not.toHaveProperty('portraitId');
      expect(actor).not.toHaveProperty('sailorId');
      expect(actor).not.toHaveProperty('legacyCharacterId');
    });
  });

  test('uses unique progression and advice priorities without random groups or roster additions', () => {
    const events = finaleEvents();
    const advice = new Set([
      'joao.finale.rendezvous-wait',
      'joao.finale.amazon-retry',
    ]);
    events.forEach(({ id, priority }) => {
      if (advice.has(id)) {
        expect(priority).toBeGreaterThanOrEqual(0.4);
        expect(priority).toBeLessThan(0.5);
      } else {
        expect(priority).toBeGreaterThanOrEqual(0.2);
        expect(priority).toBeLessThan(0.3);
      }
    });
    expect(new Set(events.map(({ priority }) => priority)).size).toBe(
      events.length,
    );
    expect(events.every(({ randomGroup }) => randomGroup === undefined)).toBe(
      true,
    );
    expect(events.flatMap(({ steps }) => effectTypes(steps))).not.toContain(
      'addCompanion',
    );
  });

  test('completes every once event in its own final effect group', () => {
    finaleEvents()
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

  test('gives usable facilities, the real rolling clock, and geographic Amazon directions', () => {
    expect(visibleText(event('letter-notice').steps).join(' ')).toContain(
      'Lisbon Adventurers’ Guild',
    );
    expect(visibleText(event('enrico-letter').steps).join(' ')).toContain(
      'Sakai guild',
    );
    expect(visibleText(event('sakai-lead').steps).join(' ')).toContain(
      'South America',
    );
    const waiting = visibleText(event('rendezvous-wait').steps).join(' ');
    expect(waiting).toContain('lodge');
    expect(waiting).toContain('08:00');
    expect(waiting).toContain('09:00–14:59');
    const alliance = visibleText(event('spanish-alliance').steps).join(' ');
    expect(alliance).toContain('east of Cayenne');
    expect(alliance).toContain('0.5°S, 50.0°W');
    finaleEvents()
      .flatMap(({ steps }) => visibleText(steps))
      .forEach((line) =>
        expect(line).not.toMatch(/\b(?:59[4-9]|60[0-2]|64[1-9])\b/),
      );
  });

  test('keeps Enrico in Sakai as a later speaker and Martinez within an attributed report', () => {
    expect(
      event('sakai-lead').steps.some(
        (step) => step.type === 'dialogue' && step.speaker === 'enrico',
      ),
    ).toBe(true);
    expect(effectTypes(event('sakai-lead').steps)).not.toContain(
      'addCompanion',
    );
    const martinezLines = event('martinez-exposed').steps.filter(
      (step) => step.type === 'dialogue' && step.speaker === 'martinez',
    );
    expect(martinezLines).toHaveLength(1);
    expect(martinezLines[0]).toMatchObject({
      body: expect.stringMatching(/written (?:order|report)/i),
    });
    expect(effectTypes(event('martinez-exposed').steps)).toEqual([
      'completeEvent',
    ]);
    const combatIds = finaleEvents().flatMap(({ steps }) =>
      combatEncounterIds(steps),
    );
    expect(new Set(combatIds)).toEqual(
      new Set(['joao.m3.rudolph', 'joao.m3.amazon']),
    );
  });

  test('makes Katarina and Rocco confirm victory and reunites João with family without an item hand-in', () => {
    const victorySpeakers = event('amazon-victory').steps.flatMap((step) =>
      step.type === 'dialogue' ? [step.speaker] : [],
    );
    expect(victorySpeakers).toEqual(
      expect.arrayContaining([characterId('katarina'), characterId('rocco')]),
    );
    expect(visibleText(event('amazon-victory').steps).join(' ')).toContain(
      'Lisbon residence',
    );
    const homecomingSpeakers = event('homecoming').steps.flatMap((step) =>
      step.type === 'dialogue' ? [step.speaker] : [],
    );
    expect(homecomingSpeakers).toEqual(
      expect.arrayContaining([
        characterId('duke-franco'),
        characterId('duchess-christiana'),
      ]),
    );
    ['enrico-letter', 'homecoming'].forEach((suffix) => {
      expect(effectTypes(event(suffix).steps)).not.toContain('consumeItem');
      expect(effectTypes(event(suffix).steps)).not.toContain('receiveItem');
    });
  });

  test('provides Chinese for every visible line and keeps both choices compatible', () => {
    setLocale('zh-CN');
    const events = finaleEvents();
    expect(events).toHaveLength(15);
    events
      .flatMap(({ steps }) => visibleText(steps))
      .forEach((source) => {
        expect(t(source)).toBeTruthy();
        expect(t(source)).not.toBe(source);
      });

    const choices = events.flatMap(({ steps }) =>
      steps.flatMap((step) => (step.type === 'choice' ? [step] : [])),
    );
    expect(choices).toHaveLength(2);
    choices.forEach(({ options }) => {
      expect(options.map(({ id, label }) => ({ id, label }))).toEqual([
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ]);
    });
  });
});
