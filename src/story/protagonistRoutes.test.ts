import { compileStoryContent } from './core/registry';
import { createStoryContext, resolveStoryEvent } from './core/resolver';
import { storyContentSource, storyValidationCatalogs } from './content';
import {
  KATARINA_AMAZON_RECKONING_EVENT_ID,
  KATARINA_CAYENNE_RESCUE_EVENT_ID,
  KATARINA_CEUTA_CLASH_EVENT_ID,
  KATARINA_ENDING_EVENT_ID,
  KATARINA_MASSAWA_TRUTH_EVENT_ID,
  KATARINA_SEVILLE_MUTINY_EVENT_ID,
  KATARINA_SPANISH_PURSUIT_EVENT_ID,
} from './content/arcs/katarina/vengeance';
import {
  PIETRO_ALEXANDRIA_RELIC_EVENT_ID,
  PIETRO_BASRA_STAFF_EVENT_ID,
  PIETRO_CAYENNE_FLEET_EVENT_ID,
  PIETRO_ENDING_EVENT_ID,
  PIETRO_GENOA_DEPARTURE_EVENT_ID,
  PIETRO_LISBON_PATRONAGE_EVENT_ID,
  PIETRO_MASSAWA_HANDOFF_EVENT_ID,
} from './content/arcs/pietro/adventure';
import { getCatalinaJournal } from './catalinaJournal';
import { getPietroJournal } from './pietroJournal';
import { startNewGameAs } from '../state/protagonists';
import state from '../state/state';

const content = compileStoryContent(
  storyContentSource,
  'strict',
  storyValidationCatalogs,
);

const resolveCurrent = () =>
  resolveStoryEvent(
    createStoryContext(state, content),
    content,
    (candidates) => candidates[0],
  );

describe('Catalina and Pietro playable protagonist routes', () => {
  afterEach(() => {
    startNewGameAs('joao');
  });

  test('walks Catalina from Seville mutiny to her royal pardon in Seville without triggering João events', () => {
    startNewGameAs('katarina');
    expect(state.protagonistId).toBe('katarina');
    expect(state.portId).toBe('2');

    // Visiting Lisbon Franco House as Catalina should NOT trigger João's opening
    state.portId = '1';
    state.buildingId = '8';
    expect(resolveCurrent()).toBeNull();

    // Step 1: Seville Harbor mutiny
    state.portId = '2';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(KATARINA_SEVILLE_MUTINY_EVENT_ID);
    state.storyEvents.push(KATARINA_SEVILLE_MUTINY_EVENT_ID);

    // Step 2: Spanish Pursuit at sea
    state.portId = null;
    state.buildingId = null;
    state.dayAtSea = 1;
    expect(resolveCurrent()?.id).toBe(KATARINA_SPANISH_PURSUIT_EVENT_ID);
    state.storyEvents.push(KATARINA_SPANISH_PURSUIT_EVENT_ID);
    state.combatResults['katarina.seville-patrol'] = 'victory';

    // Step 3: Ceuta Pub clash with Franco fleet
    state.portId = '29';
    state.buildingId = '2';
    expect(resolveCurrent()?.id).toBe(KATARINA_CEUTA_CLASH_EVENT_ID);
    state.storyEvents.push(KATARINA_CEUTA_CLASH_EVENT_ID);
    state.combatResults['katarina.joao-fleet'] = 'victory';

    // Step 4: Massawa Pub truth revealed
    state.portId = '75';
    state.buildingId = '2';
    expect(resolveCurrent()?.id).toBe(KATARINA_MASSAWA_TRUTH_EVENT_ID);
    state.storyEvents.push(KATARINA_MASSAWA_TRUTH_EVENT_ID);

    // Step 5: Cayenne Lodge rescue duel
    state.portId = '57';
    state.buildingId = '5';
    expect(resolveCurrent()?.id).toBe(KATARINA_CAYENNE_RESCUE_EVENT_ID);
    state.storyEvents.push(KATARINA_CAYENNE_RESCUE_EVENT_ID);
    state.combatResults['katarina.cayenne-duel'] = 'victory';

    // Step 6: Mouth of the Amazon discovery + Cayenne Harbor final battle
    state.discoveries.push('mouth-of-the-amazon');
    state.portId = '57';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(KATARINA_AMAZON_RECKONING_EVENT_ID);
    state.storyEvents.push(KATARINA_AMAZON_RECKONING_EVENT_ID);
    state.combatResults['katarina.amazon-martinez'] = 'victory';

    // Step 7: Seville Royal Palace homecoming
    state.portId = '2';
    state.buildingId = '6';
    expect(resolveCurrent()?.id).toBe(KATARINA_ENDING_EVENT_ID);
    state.storyEvents.push(KATARINA_ENDING_EVENT_ID);

    const journal = getCatalinaJournal(state);
    expect(journal.every((entry) => entry.completed)).toBe(true);
  });

  test('walks Pietro from Genoa departure to his Lisbon triumph without triggering João events', () => {
    startNewGameAs('pietro');
    expect(state.protagonistId).toBe('pietro');
    expect(state.portId).toBe('4');
    expect(state.debt).toBe(5000);

    // Step 1: Genoa Harbor departure
    state.portId = '4';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(PIETRO_GENOA_DEPARTURE_EVENT_ID);
    state.storyEvents.push(PIETRO_GENOA_DEPARTURE_EVENT_ID);

    // Step 2: Lisbon Franco Residence patronage (must resolve Pietro's event, not João's)
    state.portId = '1';
    state.buildingId = '8';
    expect(resolveCurrent()?.id).toBe(PIETRO_LISBON_PATRONAGE_EVENT_ID);
    state.storyEvents.push(PIETRO_LISBON_PATRONAGE_EVENT_ID);

    // Step 3: Sight Strait of Gibraltar + Alexandria Pub relic clue
    state.discoveries.push('strait-of-gibraltar');
    state.portId = '20';
    state.buildingId = '2';
    expect(resolveCurrent()?.id).toBe(PIETRO_ALEXANDRIA_RELIC_EVENT_ID);
    state.storyEvents.push(PIETRO_ALEXANDRIA_RELIC_EVENT_ID);

    // Step 4: Basra Market duel for Staff of the Saint
    state.portId = '78';
    state.buildingId = '1';
    expect(resolveCurrent()?.id).toBe(PIETRO_BASRA_STAFF_EVENT_ID);
    state.storyEvents.push(PIETRO_BASRA_STAFF_EVENT_ID);
    state.combatResults['pietro.basra-raider'] = 'victory';

    // Step 5: Massawa Harbor handoff to João
    state.portId = '75';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(PIETRO_MASSAWA_HANDOFF_EVENT_ID);
    state.storyEvents.push(PIETRO_MASSAWA_HANDOFF_EVENT_ID);

    // Step 6: Sight Mouth of the Amazon + Cayenne Harbor El Dorado fleet battle
    state.discoveries.push('mouth-of-the-amazon');
    state.portId = '57';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(PIETRO_CAYENNE_FLEET_EVENT_ID);
    state.storyEvents.push(PIETRO_CAYENNE_FLEET_EVENT_ID);
    state.combatResults['pietro.eldorado-fleet'] = 'victory';

    // Step 7: Lisbon Franco Residence triumph
    state.portId = '1';
    state.buildingId = '8';
    expect(resolveCurrent()?.id).toBe(PIETRO_ENDING_EVENT_ID);
    state.storyEvents.push(PIETRO_ENDING_EVENT_ID);

    const journal = getPietroJournal(state);
    expect(journal.every((entry) => entry.completed)).toBe(true);
  });
});
