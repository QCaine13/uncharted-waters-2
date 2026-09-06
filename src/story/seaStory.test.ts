import { compileStoryContent } from './core/registry';
import type { StoryEffectRuntime } from './core/effects';
import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryContext,
} from './core/types';
import { createSeaStoryController } from './seaStory';

const setup = () => {
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
            { type: 'dialogue', body: 'Someone is aboard.', position: 0 },
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
  let paused = false;
  const runtime: StoryEffectRuntime = {
    canExecute: () => [],
    completeEvent: (id) => {
      completed.add(id);
    },
    receiveGold: (amount) => {
      gold += amount;
    },
    receiveItem: () => {},
    receiveShip: () => {},
    addCompanion: () => {},
    assignMate: () => {},
    exitBuilding: () => {},
    setPort: () => {},
    save: () => {
      savedGold = gold;
    },
  };
  const create = () =>
    createSeaStoryController({
      content,
      getContext: () => context,
      runtime,
      acquirePause: () => {
        paused = true;
        return () => {
          paused = false;
        };
      },
    });
  return {
    controller: create(),
    create,
    context,
    completed,
    eventId,
    read: () => ({ gold, savedGold, paused }),
  };
};

test('holds one sea session and pays the chosen terminal reward once despite stale controls', () => {
  const { controller, read, completed, eventId } = setup();
  expect(controller.start()).toBe(true);
  const first = controller.getSnapshot()!;
  expect(controller.start()).toBe(true);
  expect(controller.getSnapshot()).toBe(first);
  expect(read()).toEqual({ gold: 0, savedGold: 0, paused: true });
  controller.advance(first);
  const choice = controller.getSnapshot()!;
  controller.advance(first);
  expect(controller.getSnapshot()).toBe(choice);
  controller.advance(choice, 'yes');
  controller.advance(choice, 'yes');
  expect(controller.getSnapshot()).toBeNull();
  expect(read()).toEqual({ gold: 500, savedGold: 500, paused: false });
  expect(completed.has(eventId)).toBe(true);
  expect(controller.start()).toBe(false);
});

test('refusal releases navigation without paying acceptance reward', () => {
  const { controller, read } = setup();
  controller.start();
  controller.advance(controller.getSnapshot()!);
  controller.advance(controller.getSnapshot()!, 'no');
  expect(read()).toEqual({ gold: 0, savedGold: 0, paused: false });
  expect(controller.start()).toBe(false);
});

test('an unfinished dialogue can restart after clear, while a finished event cannot', () => {
  const { controller, create, read } = setup();
  controller.start();
  controller.advance(controller.getSnapshot()!);
  controller.clear();
  expect(read().paused).toBe(false);
  const restarted = create();
  expect(restarted.start()).toBe(true);
  expect(restarted.getSnapshot()?.stepIndex).toBe(0);
  restarted.advance(restarted.getSnapshot()!);
  restarted.advance(restarted.getSnapshot()!, 'yes');
  expect(create().start()).toBe(false);
  expect(read().savedGold).toBe(500);
});

test('does not start at port or advance on a missing or invalid choice', () => {
  const { controller, context, read } = setup();
  context.stage = 'port';
  expect(controller.start()).toBe(false);
  context.stage = 'world';
  controller.start();
  controller.advance(controller.getSnapshot()!);
  const choice = controller.getSnapshot()!;
  controller.advance(choice);
  controller.advance(controller.getSnapshot()!, 'invalid');
  expect(controller.getSnapshot()?.stepIndex).toBe(1);
  expect(read()).toEqual({ gold: 0, savedGold: 0, paused: true });
  controller.clear();
});
