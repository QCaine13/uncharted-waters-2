import { storyContentSource, storyValidationCatalogs } from './content';
import {
  compileProductionStoryContent,
  compileStoryContent,
  type StoryDiagnosticSink,
} from './core/registry';

export { storyContentSource, storyValidationCatalogs } from './content';
export * from './core/types';

export const reportProductionStoryDiagnostic: StoryDiagnosticSink = (
  diagnostic,
) => {
  // eslint-disable-next-line no-console -- production story fallback must remain observable
  console.error('[story-content]', diagnostic);
};

export const compiledStoryContent =
  process.env.NODE_ENV === 'production'
    ? compileProductionStoryContent(
        storyContentSource,
        storyValidationCatalogs,
        reportProductionStoryDiagnostic,
      )
    : compileStoryContent(storyContentSource, 'strict', storyValidationCatalogs);

export default compiledStoryContent;
