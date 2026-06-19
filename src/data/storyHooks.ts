// Shared lore-entity schema (canonical).
// Source of truth: docs/3-narrative/samples/staff-of-the-saint.md §6.
// These types are the contract for relicData.ts / legendData.ts / tradeGoodData.ts.
// NOTE: This is *data only* — nothing here is wired into the running game yet.

export type FameType = 'adventure' | 'pirate' | 'trade';

export type DarkLineLayer = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type ProtagonistId =
  | 'joao'
  | 'catalina'
  | 'otto'
  | 'pietro'
  | 'ernst'
  | 'ali';

export interface StoryHooks {
  protagonists: ProtagonistId[];
  factions: string[];
  darkLineLayer: DarkLineLayer;
  fameTriggers: FameType[];
  crossLinks: string[];
  triggers: Array<{
    location?: string;
    item?: string;
    fame?: { type: FameType; min: number };
    daysElapsed?: number;
  }>;
  rewards: Array<
    | { type: 'fame'; fame: FameType; amount: number }
    | { type: 'unlock'; target: string }
  >;
}

export interface SourceCitation {
  level: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  note: string;
  link?: string;
}

export interface TextLayers {
  rumor: string; // 风闻 / gossip — first encounter
  record: string; // 记录 — unlocked by intimacy / fame
  archive: string; // 博物 / exhibit — terminal reveal
}

export type RelicCategory =
  | 'relic'
  | 'natural_wonder'
  | 'document'
  | 'creature'
  | 'trade_good'
  | 'event'
  | 'npc';

export interface Relic {
  id: string;
  names: { zh: string; en: string; ja: string };
  category: RelicCategory;
  darkLineLayer: DarkLineLayer;
  hookPriority: 'required' | 'optional';
  description: string;
  textLayers: TextLayers;
  storyHooks: StoryHooks;
  sources: SourceCitation[];
}
