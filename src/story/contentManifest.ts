import { storyContentSource, storyValidationCatalogs } from './content';
import { compileStoryContent } from './core/registry';
import type {
  CharacterId,
  StoryCondition,
  StoryContentSource,
  StoryDiagnostic,
  StoryEffect,
  StoryEvent,
  StoryEventId,
  StoryStep,
} from './core/types';
import { validateStoryContent } from './core/validator';

export interface StoryValidationReport {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  diagnostics: StoryDiagnostic[];
}

export interface StoryArcContentReport {
  id: string;
  entryEvents: string[];
  terminalEvents: string[];
  crossArcDependencies: string[];
}

export interface StoryContentReport {
  counts: {
    characters: number;
    relationships: number;
    arcs: number;
    events: number;
  };
  arcs: StoryArcContentReport[];
  unreferencedCharacters: string[];
  unreferencedRelationships: string[];
  legacyCompatibility: {
    onceEvents: number;
    mappedEvents: number;
    coverageComplete: boolean;
    unmappedEvents: string[];
    keys: string[];
  };
  validation: StoryValidationReport;
}

const sorted = <T extends string>(values: Iterable<T>): T[] =>
  [...values].sort((left, right) => left.localeCompare(right));

const visitConditionDependencies = (
  condition: StoryCondition,
  dependencies: Set<StoryEventId>,
  positive = true,
): void => {
  if (condition.type === 'all' || condition.type === 'any') {
    condition.conditions.forEach((child) =>
      visitConditionDependencies(child, dependencies, positive),
    );
  } else if (condition.type === 'not') {
    visitConditionDependencies(condition.condition, dependencies, !positive);
  } else if (condition.type === 'eventCompleted' && positive) {
    dependencies.add(condition.eventId);
  }
};

const visitEffectCharacters = (
  effect: StoryEffect,
  characters: Set<CharacterId>,
): void => {
  if (effect.type === 'addCompanion' || effect.type === 'assignMate') {
    characters.add(effect.characterId);
  }
};

const visitStepCharacters = (
  steps: readonly StoryStep[],
  characters: Set<CharacterId>,
): void => {
  steps.forEach((step) => {
    if (step.type === 'dialogue') {
      if (step.speaker !== undefined) characters.add(step.speaker);
    } else if (step.type === 'effect') {
      step.effects.forEach((effect) =>
        visitEffectCharacters(effect, characters),
      );
    } else {
      if (step.speaker !== undefined) characters.add(step.speaker);
      step.options.forEach((option) =>
        visitStepCharacters(option.steps, characters),
      );
    }
  });
};

const visitConditionCharacters = (
  condition: StoryCondition,
  characters: Set<CharacterId>,
): void => {
  if (condition.type === 'all' || condition.type === 'any') {
    condition.conditions.forEach((child) =>
      visitConditionCharacters(child, characters),
    );
  } else if (condition.type === 'not') {
    visitConditionCharacters(condition.condition, characters);
  } else if (condition.type === 'hasCompanion') {
    characters.add(condition.characterId);
  }
};

const dependenciesFor = (event: StoryEvent): Set<StoryEventId> => {
  const dependencies = new Set<StoryEventId>();
  visitConditionDependencies(event.trigger, dependencies);
  dependencies.delete(event.id);
  return dependencies;
};

export const getStoryValidationReport = (
  source: StoryContentSource = storyContentSource,
): StoryValidationReport => {
  const catalogs =
    source === storyContentSource ? storyValidationCatalogs : undefined;
  const diagnostics = validateStoryContent(source, catalogs).map(
    (diagnostic) => ({
      ...diagnostic,
    }),
  );
  const errorCount = diagnostics.filter(
    ({ severity }) => severity === 'error',
  ).length;
  const warningCount = diagnostics.filter(
    ({ severity }) => severity === 'warning',
  ).length;
  return {
    valid: errorCount === 0,
    errorCount,
    warningCount,
    diagnostics,
  };
};

export const getStoryContentReport = (
  source: StoryContentSource = storyContentSource,
): StoryContentReport => {
  const catalogs =
    source === storyContentSource ? storyValidationCatalogs : undefined;
  const compiled = compileStoryContent(source, 'production', catalogs);
  const validEvents = [...compiled.eventsById.values()];
  const eventArc = new Map(
    validEvents.map((event) => [event.id, String(event.arcId)]),
  );
  const dependencies = new Map(
    validEvents.map((event) => [event.id, dependenciesFor(event)]),
  );

  const arcs = [...compiled.arcsById.values()]
    .map((arc) => {
      const arcEvents = arc.eventIds
        .map((eventId) => compiled.eventsById.get(eventId))
        .filter((event): event is StoryEvent => event !== undefined);
      const arcEventIds = new Set(arcEvents.map(({ id }) => id));
      const dependedUpon = new Set<StoryEventId>();
      const crossArcDependencies = new Set<string>();
      arcEvents.forEach((event) => {
        dependencies.get(event.id)?.forEach((dependency) => {
          if (arcEventIds.has(dependency)) dependedUpon.add(dependency);
          else {
            const dependencyArc = eventArc.get(dependency);
            if (dependencyArc !== undefined)
              crossArcDependencies.add(dependencyArc);
          }
        });
      });

      return {
        id: String(arc.id),
        entryEvents: sorted(
          arcEvents
            .filter((event) =>
              [...(dependencies.get(event.id) ?? [])].every(
                (dependency) => !arcEventIds.has(dependency),
              ),
            )
            .map(({ id }) => String(id)),
        ),
        terminalEvents: sorted(
          arcEvents
            .filter(({ id }) => !dependedUpon.has(id))
            .map(({ id }) => String(id)),
        ),
        crossArcDependencies: sorted(crossArcDependencies),
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const referencedCharacters = new Set<CharacterId>();
  [...compiled.arcsById.values()].forEach(({ protagonist }) =>
    referencedCharacters.add(protagonist),
  );
  validEvents.forEach((event) => {
    visitConditionCharacters(event.trigger, referencedCharacters);
    visitStepCharacters(event.steps, referencedCharacters);
  });

  const onceEvents = validEvents.filter(({ repeat }) => repeat === 'once');
  const legacyCompatibilityEvents =
    catalogs === undefined
      ? onceEvents
      : onceEvents.filter(({ id }) =>
          catalogs.parityManifest.migratedEventIds.has(String(id)),
        );
  const mappedEvents = legacyCompatibilityEvents.filter(
    ({ legacyCompletionKey }) => legacyCompletionKey !== undefined,
  );
  const unreferencedCharacters = sorted(
    [...compiled.charactersById.keys()]
      .filter((id) => !referencedCharacters.has(id))
      .map(String),
  );
  const unreferencedRelationships = sorted(
    source.relationships
      .filter(
        ({ from, to }) =>
          !referencedCharacters.has(from) || !referencedCharacters.has(to),
      )
      .map(({ id }) => String(id)),
  );

  return {
    counts: {
      characters: compiled.charactersById.size,
      relationships: source.relationships.length,
      arcs: compiled.arcsById.size,
      events: compiled.eventsById.size,
    },
    arcs,
    unreferencedCharacters,
    unreferencedRelationships,
    legacyCompatibility: {
      onceEvents: legacyCompatibilityEvents.length,
      mappedEvents: mappedEvents.length,
      coverageComplete:
        mappedEvents.length === legacyCompatibilityEvents.length,
      unmappedEvents: sorted(
        legacyCompatibilityEvents
          .filter(
            ({ legacyCompletionKey }) => legacyCompletionKey === undefined,
          )
          .map(({ id }) => String(id)),
      ),
      keys: sorted(
        mappedEvents.map(({ legacyCompletionKey }) =>
          String(legacyCompletionKey),
        ),
      ),
    },
    validation: getStoryValidationReport(source),
  };
};

const list = (values: readonly string[]): string =>
  values.length === 0 ? 'none' : values.join(', ');

export const formatStoryContentReport = (
  report: StoryContentReport = getStoryContentReport(),
): string => {
  const { counts, legacyCompatibility, validation } = report;
  return [
    `Story content: ${counts.characters} characters, ${
      counts.relationships
    } relationships, ${counts.arcs} arc${counts.arcs === 1 ? '' : 's'}, ${
      counts.events
    } events`,
    `Validation: ${validation.errorCount} error(s), ${validation.warningCount} warning(s)`,
    ...report.arcs.flatMap((arc) => [
      `Arc ${arc.id}`,
      `  Entry events: ${list(arc.entryEvents)}`,
      `  Terminal events: ${list(arc.terminalEvents)}`,
      `  Cross-arc dependencies: ${list(arc.crossArcDependencies)}`,
    ]),
    `Unreferenced characters: ${list(report.unreferencedCharacters)}`,
    `Unreferenced relationships: ${list(report.unreferencedRelationships)}`,
    `Legacy compatibility: ${legacyCompatibility.mappedEvents}/${
      legacyCompatibility.onceEvents
    } once events mapped (${
      legacyCompatibility.coverageComplete ? 'complete' : 'incomplete'
    })`,
    `Legacy keys: ${list(legacyCompatibility.keys)}`,
  ].join('\n');
};
