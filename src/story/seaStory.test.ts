import { setupSeaStory as setup } from '../../tests/seaStoryFixture';

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
