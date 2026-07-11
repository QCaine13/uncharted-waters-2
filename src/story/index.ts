import { storyContentSource } from './content';
import { compileStoryContent } from './core/registry';

export { storyContentSource } from './content';
export * from './core/types';

export const compiledStoryContent = compileStoryContent(
  storyContentSource,
  process.env.NODE_ENV === 'production' ? 'production' : 'strict',
);

export default compiledStoryContent;
