import type { ItemId } from '../../data/itemData';
import type { Role, Stage, FameType } from '../../state/state';

declare const storyIdBrand: unique symbol;
type StoryId<Kind extends string> = string & {
  readonly [storyIdBrand]: Kind;
};

export type CharacterId = StoryId<'character'>;
export type RelationshipId = StoryId<'relationship'>;
export type StoryArcId = StoryId<'arc'>;
export type StoryEventId = StoryId<'event'>;
export type LegacyQuestId = StoryId<'legacy-quest'>;

const id = <Kind extends string>(value: string): StoryId<Kind> =>
  value as StoryId<Kind>;

export const characterId = (value: string): CharacterId => id(value);
export const relationshipId = (value: string): RelationshipId => id(value);
export const storyArcId = (value: string): StoryArcId => id(value);
export const storyEventId = (value: string): StoryEventId => id(value);
export const legacyQuestId = (value: string): LegacyQuestId => id(value);

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'mentor'
  | 'student'
  | 'companion'
  | 'friend'
  | 'acquaintance'
  | 'rival'
  | 'enemy'
  | 'employer'
  | 'employee';

export interface StoryCharacter {
  id: CharacterId;
  names: { en: string; zh?: string; ja?: string };
  role: 'protagonist' | 'companion' | 'family' | 'npc' | 'antagonist';
  portraitId?: string;
  dialogueStyle: { color: string };
  sailorId?: string;
  legacyCharacterId?: string;
}

export interface CharacterRelationship {
  id: RelationshipId;
  from: CharacterId;
  to: CharacterId;
  type: RelationshipType;
  reciprocal?: RelationshipType;
  description?: string;
  sourceArc?: StoryArcId;
}

export type StoryCondition =
  | { type: 'all'; conditions: StoryCondition[] }
  | { type: 'any'; conditions: StoryCondition[] }
  | { type: 'not'; condition: StoryCondition }
  | { type: 'eventCompleted'; eventId: StoryEventId }
  | { type: 'atPort'; portId: string }
  | { type: 'atBuilding'; buildingId: string }
  | { type: 'stage'; stage: Stage }
  | { type: 'timeWindow'; min: number; max: number }
  | { type: 'daysElapsed'; min?: number; max?: number }
  | { type: 'fameAtLeast'; fame: FameType; value: number }
  | { type: 'hasItem'; itemId: ItemId }
  | { type: 'hasCompanion'; characterId: CharacterId };

export type StoryEffect =
  | { type: 'completeEvent'; eventId: StoryEventId }
  | { type: 'receiveGold'; amount: number }
  | { type: 'receiveItem'; itemId: ItemId }
  | { type: 'receiveShip'; shipId: string; name: string }
  | { type: 'addCompanion'; characterId: CharacterId }
  | { type: 'assignMate'; characterId: CharacterId; role: Role }
  | { type: 'exitBuilding' }
  | { type: 'setPort'; portId: string | null }
  | { type: 'save' };

export interface DialogueStep {
  type: 'dialogue';
  body: string;
  position: 0 | 1 | 2;
  speaker?: CharacterId;
  fadeBeforeNext?: true;
}

export interface EffectStep {
  type: 'effect';
  effects: StoryEffect[];
}

export interface StoryChoice {
  id: string;
  label: string;
  steps: StoryStep[];
}

export interface ChoiceStep {
  type: 'choice';
  prompt: string;
  options: StoryChoice[];
}

export type StoryStep = DialogueStep | EffectStep | ChoiceStep;

export interface StoryEvent {
  id: StoryEventId;
  arcId: StoryArcId;
  priority: number;
  trigger: StoryCondition;
  repeat: 'once' | 'repeatable' | 'random-ambient';
  steps: StoryStep[];
  legacyCompletionKey?: LegacyQuestId;
  randomGroup?: string;
}

export interface StoryArc {
  id: StoryArcId;
  protagonist: CharacterId;
  title: string;
  eventIds: StoryEventId[];
}

export interface StoryContext {
  stage: Stage;
  portId: string | null;
  buildingId: string | null;
  timePassed: number;
  completedEvents: ReadonlySet<StoryEventId>;
  fame: Record<FameType, number>;
  items: ReadonlySet<ItemId>;
  companions: ReadonlySet<CharacterId>;
}

export interface StoryContentSource {
  characters: StoryCharacter[];
  relationships: CharacterRelationship[];
  arcs: StoryArc[];
  events: StoryEvent[];
}

export interface StoryDiagnostic {
  severity: 'error' | 'warning';
  code: string;
  owner?: string;
  path: string;
  message: string;
}

export interface CompiledStoryContent {
  charactersById: ReadonlyMap<CharacterId, StoryCharacter>;
  relationshipsByCharacter: ReadonlyMap<
    CharacterId,
    readonly CharacterRelationship[]
  >;
  arcsById: ReadonlyMap<StoryArcId, StoryArc>;
  eventsById: ReadonlyMap<StoryEventId, StoryEvent>;
  candidatesByScene: ReadonlyMap<string, readonly StoryEvent[]>;
  eventByLegacyCompletionKey: ReadonlyMap<LegacyQuestId, StoryEventId>;
  legacyCompletionKeyByEvent: ReadonlyMap<StoryEventId, LegacyQuestId>;
  diagnostics: readonly StoryDiagnostic[];
}
