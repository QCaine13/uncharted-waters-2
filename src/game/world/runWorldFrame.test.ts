import { setupSeaStory } from '../../../tests/seaStoryFixture';
import { runWorldFrame } from './runWorldFrame';
import Input from '../../input';

test('a resolved sea encounter freezes the simulation from the first frame until its choice ends', () => {
  const { controller, context } = setupSeaStory();
  let x = 0;
  let food = 10;
  let drawings = 0;
  const world = {
    update: () => {
      context.timePassed += 20;
      x += 1;
      food -= 1;
    },
    draw: () => {
      drawings += 1;
    },
  };
  const before = context.timePassed;
  runWorldFrame(world, controller.start);
  runWorldFrame(world, controller.start);
  expect([context.timePassed, x, food, drawings]).toEqual([before, 0, 10, 2]);
  controller.advance(controller.getSnapshot()!);
  controller.advance(controller.getSnapshot()!, 'no');
  runWorldFrame(world, controller.start);
  expect([context.timePassed, x, food, drawings]).toEqual([
    before + 20,
    1,
    9,
    3,
  ]);
});

test('reading a sidebar overlay pauses even when no sea event is available', () => {
  let elapsed = 0;
  const world = {
    update: () => {
      elapsed += 20;
    },
    draw: () => {},
  };
  const release = Input.suspend('overlay');
  runWorldFrame(world, () => false);
  expect(elapsed).toBe(0);
  release();
  runWorldFrame(world, () => false);
  expect(elapsed).toBe(20);
});

test('active combat pause prevents both sea-story initiation and simulation', () => {
  const world = { update: jest.fn(), draw: jest.fn() };
  const startStory = jest.fn(() => false);
  const releaseCombat = Input.suspend('combat');

  runWorldFrame(world, startStory);

  expect(startStory).not.toHaveBeenCalled();
  expect(world.update).not.toHaveBeenCalled();
  expect(world.draw).toHaveBeenCalledTimes(1);
  releaseCombat();
});
