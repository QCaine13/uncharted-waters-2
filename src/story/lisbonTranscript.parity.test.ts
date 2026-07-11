import { legacyLisbonSnapshot } from './__fixtures__/legacyLisbonSnapshot';
import { storyCharacters } from './content/characters';
import {
  legacyToSemanticEvent,
  lisbonOpeningEvents,
} from './content/arcs/joao/lisbon-opening';
import type { StoryEffect, StoryStep } from './core/types';

interface NormalizedBeat {
  body?: string;
  position?: 0 | 1 | 2;
  legacyCharacterId?: string;
  fade?: boolean;
  effects: Array<{ type: string; payload?: unknown }>;
  choiceOptions?: string[];
}

type LegacyKey = keyof typeof legacyToSemanticEvent;

const legacyKeyFor = (eventId: string): LegacyKey => {
  const match = (
    Object.entries(legacyToSemanticEvent) as Array<[LegacyKey, string]>
  ).find(
    ([, semantic]) =>
      eventId === semantic || eventId.startsWith(`${semantic}.`),
  );
  if (!match) throw new Error(`No legacy key for ${eventId}`);
  return match[0];
};

const legacySpeaker = (speaker: string | undefined): string | undefined =>
  storyCharacters.find(({ id }) => id === speaker)?.legacyCharacterId;

const normalizeEffect = (effect: StoryEffect) => {
  const { type, ...payload } = effect;
  return Object.keys(payload).length === 0 ? { type } : { type, payload };
};

const normalizeSteps = (steps: readonly StoryStep[]): NormalizedBeat[] => {
  const beats: NormalizedBeat[] = [];
  steps.forEach((step) => {
    if (step.type === 'dialogue') {
      beats.push({
        body: step.body,
        position: step.position,
        ...(step.speaker
          ? { legacyCharacterId: legacySpeaker(step.speaker) }
          : {}),
        ...(step.fadeBeforeNext ? { fade: true } : {}),
        effects: [],
      });
    } else if (step.type === 'choice') {
      beats.push({
        body: step.prompt,
        position: step.position,
        ...(step.speaker
          ? { legacyCharacterId: legacySpeaker(step.speaker) }
          : {}),
        effects: [],
        choiceOptions: step.options.map(({ label }) => label),
      });
    } else {
      const previous = beats[beats.length - 1];
      if (!previous) throw new Error('effect before visible beat');
      previous.effects.push(...step.effects.map(normalizeEffect));
    }
  });
  return beats;
};

const expectedActionEffects = (
  action: string | undefined,
  building: string,
): NormalizedBeat['effects'] => {
  if (!action) return [];
  if (action === 'recruitRocco') {
    return [{ type: 'addCompanion', payload: { characterId: 'rocco' } }];
  }
  if (action === 'recruitEnrico') {
    return [{ type: 'addCompanion', payload: { characterId: 'enrico' } }];
  }
  if (action === 'receiveFirstShip') {
    return [
      { type: 'receiveShip', payload: { shipId: '6', name: 'Hermes II' } },
    ];
  }
  if (action === 'exitBuildingIfNotLodge') {
    return building === '5' ? [] : [{ type: 'exitBuilding' }];
  }
  const item = /^buyItem\(([^,]+), true\)$/.exec(action);
  if (item) return [{ type: 'receiveItem', payload: { itemId: item[1] } }];
  const gold = /^receiveGold\((\d+)\)$/.exec(action);
  if (gold)
    return [{ type: 'receiveGold', payload: { amount: Number(gold[1]) } }];
  throw new Error(`Unhandled legacy action ${action}`);
};

const expectedMain = (key: LegacyKey, building: string): NormalizedBeat[] =>
  legacyLisbonSnapshot.transcripts[key].map((message, index, messages) => ({
    body: message.body,
    position: message.position,
    ...('characterId' in message
      ? { legacyCharacterId: message.characterId }
      : {}),
    ...('fadeBeforeNext' in message ? { fade: true } : {}),
    effects: [
      ...expectedActionEffects(
        'action' in message ? message.action : undefined,
        building,
      ),
      ...('completeQuest' in message
        ? [
            {
              type: 'completeEvent',
              payload: { eventId: legacyToSemanticEvent[key] },
            },
          ]
        : []),
      ...('exitBuilding' in message ? [{ type: 'exitBuilding' }] : []),
    ],
    ...(key === 'harborFinal' && index === messages.length - 1
      ? { choiceOptions: ['Yes', 'No'] }
      : {}),
  })) as NormalizedBeat[];

describe('Lisbon transcript parity', () => {
  test('normalizes all 48 production event transcripts to the immutable oracle', () => {
    expect(lisbonOpeningEvents).toHaveLength(48);
    lisbonOpeningEvents.forEach((event) => {
      const key = legacyKeyFor(event.id);
      const building = JSON.stringify(event.trigger).match(
        /"atBuilding","buildingId":"(\d+)"/,
      )?.[1];
      if (!building) throw new Error(`missing building for ${event.id}`);
      expect(normalizeSteps(event.steps)).toEqual(expectedMain(key, building));
    });
  });

  test('normalizes both harbor-final branches including exact role intents', () => {
    const harbor = lisbonOpeningEvents.find(
      ({ id }) => id === legacyToSemanticEvent.harborFinal,
    );
    const choice = harbor?.steps.find(({ type }) => type === 'choice');
    if (!choice || choice.type !== 'choice')
      throw new Error('missing harbor choice');

    choice.options.forEach((option) => {
      const actual = normalizeSteps(option.steps);
      const expected = legacyLisbonSnapshot.harborFinalBranches[
        option.id as 'yes' | 'no'
      ].map((message) => ({
        body: message.body,
        position: message.position,
        ...('characterId' in message
          ? { legacyCharacterId: message.characterId }
          : {}),
        ...('fadeBeforeNext' in message ? { fade: true } : {}),
        effects: [],
      })) as NormalizedBeat[];
      expected[expected.length - 1].effects = [
        ...(option.id === 'yes'
          ? [
              {
                type: 'assignMate',
                payload: { characterId: 'rocco', role: 'firstMate' },
              },
              {
                type: 'assignMate',
                payload: { characterId: 'enrico', role: 'bookKeeper' },
              },
            ]
          : []),
        {
          type: 'completeEvent',
          payload: { eventId: legacyToSemanticEvent.harborFinal },
        },
      ];
      expect(actual).toEqual(expected);
    });
  });
});
