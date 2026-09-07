import Input from '../src/input';
import { compileStoryContent } from '../src/story/core/registry';
import type { StoryEffectRuntime } from '../src/story/core/effects';
import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryContext,
} from '../src/story/core/types';
import { createSeaStoryController } from '../src/story/seaStory';

export const setupSeaStory = () => {
  const eventId = storyEventId('test.voyage.encounter');
  const arcId = storyArcId('test.voyage');
  const completed = new Set<ReturnType<typeof storyEventId>>();
  const context = {
    stage: 'world',
    portId: null,
    buildingId: null,
    timePassed: 4320,
    dayAtSea: 3,
    completedEvents: completed,
    fame: { adventure: 0, pirate: 0, trade: 0 },
    items: new Set(),
    companions: new Set(),
    discoveries: new Set(),
    reportedDiscoveries: new Set(),
    combatResults: {},
  } as StoryContext;
  const content = compileStoryContent(
    {
      characters: [
        {
          id: characterId('joao'),
          names: { en: 'Joao' },
          role: 'protagonist',
          dialogueStyle: { color: 'blue' },
        },
      ],
      relationships: [],
      arcs: [
        {
          id: arcId,
          protagonist: characterId('joao'),
          title: 'Voyage',
          eventIds: [eventId],
        },
      ],
      events: [
        {
          id: eventId,
          arcId,
          priority: 1,
          repeat: 'repeatable',
          trigger: {
            type: 'all',
            conditions: [
              { type: 'stage', stage: 'world' },
              { type: 'not', condition: { type: 'eventCompleted', eventId } },
            ],
          },
          steps: [
            {
              type: 'dialogue',
              body: 'Someone is aboard.',
              position: 2,
              speaker: characterId('joao'),
            },
            {
              type: 'choice',
              prompt: 'Welcome him?',
              position: 0,
              options: [
                {
                  id: 'yes',
                  label: 'Yes',
                  steps: [
                    {
                      type: 'effect',
                      effects: [
                        { type: 'receiveGold', amount: 500 },
                        { type: 'completeEvent', eventId },
                      ],
                    },
                  ],
                },
                {
                  id: 'no',
                  label: 'No',
                  steps: [
                    {
                      type: 'effect',
                      effects: [{ type: 'completeEvent', eventId }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    'strict',
  );
  let gold = 0;
  let savedGold = 0;
  const runtime: StoryEffectRuntime = {
    canExecute: () => [],
    completeEvent: (id) => {
      completed.add(id);
    },
    receiveGold: (amount) => {
      gold += amount;
    },
    receiveFame: () => {},
    receiveItem: () => {},
    receiveShip: () => {},
    addCompanion: () => {},
    removeCompanion: () => {},
    assignMate: () => {},
    exitBuilding: () => {},
    setPort: () => {},
    startCombat: () => {},
    save: () => {
      savedGold = gold;
    },
  };
  const create = () =>
    createSeaStoryController({
      content,
      getContext: () => context,
      runtime,
      acquirePause: () => Input.suspend('story'),
      canAdvance: () => !Input.isSuspended('overlay'),
    });
  return {
    controller: create(),
    create,
    context,
    completed,
    eventId,
    read: () => ({ gold, savedGold, paused: Input.isSuspended('story') }),
  };
};
