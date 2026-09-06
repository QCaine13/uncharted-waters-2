import Input from '../../input';
import { startSeaStory } from '../../story/seaStory';
import type { World } from './world';

export const runWorldFrame = (
  world: Pick<World, 'update' | 'draw'>,
  startStory: () => boolean = startSeaStory,
): void => {
  if (!Input.isSuspended() && !startStory()) world.update();
  world.draw();
};

export default runWorldFrame;
