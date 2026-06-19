import state from '../../state/state';
import { QuestId } from './questData';
import { resolveQuestId } from './questEvents';

// Thin wrapper over the data-driven engine in questEvents.ts. The gating logic
// (previously a hand-written nested if-else here) now lives as declarative rules.
const getAvailableQuest = (): QuestId | null =>
  resolveQuestId({
    portId: state.portId,
    buildingId: state.buildingId,
    timePassed: state.timePassed,
    quests: state.quests,
    fame: state.fame,
  });

export default getAvailableQuest;
