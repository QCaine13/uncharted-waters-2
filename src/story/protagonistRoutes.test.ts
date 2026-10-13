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
  OTTO_CEUTA_SKIRMISH_EVENT_ID,
  OTTO_ENDING_EVENT_ID,
  OTTO_LONDON_COMMISSION_EVENT_ID,
  OTTO_NANTES_SHOWDOWN_EVENT_ID,
  OTTO_SANTO_DOMINGO_RAID_EVENT_ID,
  OTTO_SEVILLE_INFILTRATION_EVENT_ID,
} from './content/arcs/otto/armada';
import {
  ERNST_AMSTERDAM_COMMISSION_EVENT_ID,
  ERNST_CAPE_SURVEY_EVENT_ID,
  ERNST_ENDING_EVENT_ID,
  ERNST_LISBON_INTERPRETER_EVENT_ID,
  ERNST_MALACCA_STRAITS_EVENT_ID,
  ERNST_NAGASAKI_HOMELAND_EVENT_ID,
} from './content/arcs/ernst/worldmap';
import {
  PIETRO_ALEXANDRIA_RELIC_EVENT_ID,
  PIETRO_BASRA_STAFF_EVENT_ID,
  PIETRO_CAYENNE_FLEET_EVENT_ID,
  PIETRO_ENDING_EVENT_ID,
  PIETRO_GENOA_DEPARTURE_EVENT_ID,
  PIETRO_LISBON_PATRONAGE_EVENT_ID,
  PIETRO_MASSAWA_HANDOFF_EVENT_ID,
} from './content/arcs/pietro/adventure';
import {
  ALI_ADEN_CORSAIRS_EVENT_ID,
  ALI_ALEXANDRIA_SPICE_EVENT_ID,
  ALI_BASRA_REUNION_EVENT_ID,
  ALI_ENDING_EVENT_ID,
  ALI_ISTANBUL_WINDFALL_EVENT_ID,
  ALI_LISBON_SEARCH_EVENT_ID,
} from './content/arcs/ali/merchant';
import { getCatalinaJournal } from './catalinaJournal';
import { getOttoJournal } from './ottoJournal';
import { getErnstJournal } from './ernstJournal';
import { getPietroJournal } from './pietroJournal';
import { getAliJournal } from './aliJournal';
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

describe('Playable protagonist routes across all six canonical captains', () => {
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
    state.portId = '27';
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

  test('walks Otto from London Royal Palace commission to defeating the Invincible Armada', () => {
    startNewGameAs('otto');
    expect(state.protagonistId).toBe('otto');
    expect(state.portId).toBe('30');

    // Step 1: London Royal Palace commission
    state.portId = '30';
    state.buildingId = '6';
    expect(resolveCurrent()?.id).toBe(OTTO_LONDON_COMMISSION_EVENT_ID);
    state.storyEvents.push(OTTO_LONDON_COMMISSION_EVENT_ID);

    // Step 2: Seville Shipyard infiltration
    state.portId = '2';
    state.buildingId = '3';
    expect(resolveCurrent()?.id).toBe(OTTO_SEVILLE_INFILTRATION_EVENT_ID);
    state.storyEvents.push(OTTO_SEVILLE_INFILTRATION_EVENT_ID);

    // Step 3: Ceuta Harbor skirmish
    state.portId = '27';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(OTTO_CEUTA_SKIRMISH_EVENT_ID);
    state.storyEvents.push(OTTO_CEUTA_SKIRMISH_EVENT_ID);
    state.combatResults['otto.spanish-vanguard'] = 'victory';

    // Step 4: Santo Domingo Harbor raid
    state.portId = '49';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(OTTO_SANTO_DOMINGO_RAID_EVENT_ID);
    state.storyEvents.push(OTTO_SANTO_DOMINGO_RAID_EVENT_ID);
    state.combatResults['otto.caribbean-convoy'] = 'victory';

    // Step 5: Nantes Harbor showdown with the Invincible Armada
    state.portId = '29';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(OTTO_NANTES_SHOWDOWN_EVENT_ID);
    state.storyEvents.push(OTTO_NANTES_SHOWDOWN_EVENT_ID);
    state.combatResults['otto.invincible-armada'] = 'victory';

    // Step 6: London Royal Palace triumph
    state.portId = '30';
    state.buildingId = '6';
    expect(resolveCurrent()?.id).toBe(OTTO_ENDING_EVENT_ID);
    state.storyEvents.push(OTTO_ENDING_EVENT_ID);

    const journal = getOttoJournal(state);
    expect(journal.every((entry) => entry.completed)).toBe(true);
  });

  test('walks Ernst from Amsterdam cartography commission to completing the World Atlas', () => {
    startNewGameAs('ernst');
    expect(state.protagonistId).toBe('ernst');
    expect(state.portId).toBe('34');

    // Step 1: Amsterdam Residence commission
    state.portId = '34';
    state.buildingId = '8';
    expect(resolveCurrent()?.id).toBe(ERNST_AMSTERDAM_COMMISSION_EVENT_ID);
    state.storyEvents.push(ERNST_AMSTERDAM_COMMISSION_EVENT_ID);

    // Step 2: Lisbon Harbor interpreter Laura
    state.portId = '1';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(ERNST_LISBON_INTERPRETER_EVENT_ID);
    state.storyEvents.push(ERNST_LISBON_INTERPRETER_EVENT_ID);

    // Step 3: Cape of Good Hope discovery + Massawa Guild survey
    state.discoveries.push('cape-of-good-hope');
    state.portId = '75';
    state.buildingId = '7';
    expect(resolveCurrent()?.id).toBe(ERNST_CAPE_SURVEY_EVENT_ID);
    state.storyEvents.push(ERNST_CAPE_SURVEY_EVENT_ID);

    // Step 4: Strait of Malacca discovery + Malacca Harbor corsair battle
    state.discoveries.push('strait-of-malacca');
    state.portId = '87';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(ERNST_MALACCA_STRAITS_EVENT_ID);
    state.storyEvents.push(ERNST_MALACCA_STRAITS_EVENT_ID);
    state.combatResults['ernst.eastern-corsairs'] = 'victory';

    // Step 5: Nagasaki Residence Laura's homeland
    state.portId = '100';
    state.buildingId = '8';
    expect(resolveCurrent()?.id).toBe(ERNST_NAGASAKI_HOMELAND_EVENT_ID);
    state.storyEvents.push(ERNST_NAGASAKI_HOMELAND_EVENT_ID);

    // Step 6: Mouth of the Amazon discovery + Amsterdam Residence world atlas
    state.discoveries.push('mouth-of-the-amazon');
    state.portId = '34';
    state.buildingId = '8';
    expect(resolveCurrent()?.id).toBe(ERNST_ENDING_EVENT_ID);
    state.storyEvents.push(ERNST_ENDING_EVENT_ID);

    const journal = getErnstJournal(state);
    expect(journal.every((entry) => entry.completed)).toBe(true);
  });

  test('walks Pietro from Genoa departure to his Lisbon triumph without triggering João events', () => {
    startNewGameAs('pietro');
    expect(state.protagonistId).toBe('pietro');
    expect(state.portId).toBe('9');
    expect(state.debt).toBe(5000);

    // Step 1: Genoa Harbor departure
    state.portId = '9';
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
    state.portId = '19';
    state.buildingId = '2';
    expect(resolveCurrent()?.id).toBe(PIETRO_ALEXANDRIA_RELIC_EVENT_ID);
    state.storyEvents.push(PIETRO_ALEXANDRIA_RELIC_EVENT_ID);

    // Step 4: Basra Market duel for Staff of the Saint
    state.portId = '77';
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

  test('walks Ali from Istanbul dhow windfall to reuniting with Sasha and becoming Grand Commercial Advisor', () => {
    startNewGameAs('ali');
    expect(state.protagonistId).toBe('ali');
    expect(state.portId).toBe('3');
    expect(state.debt).toBe(1000);

    // Step 1: Istanbul Harbor windfall
    state.portId = '3';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(ALI_ISTANBUL_WINDFALL_EVENT_ID);
    state.storyEvents.push(ALI_ISTANBUL_WINDFALL_EVENT_ID);

    // Step 2: Alexandria Market spice deal & Pietro's clue
    state.portId = '19';
    state.buildingId = '1';
    expect(resolveCurrent()?.id).toBe(ALI_ALEXANDRIA_SPICE_EVENT_ID);
    state.storyEvents.push(ALI_ALEXANDRIA_SPICE_EVENT_ID);

    // Step 3: Lisbon Pub search for Sasha
    state.portId = '1';
    state.buildingId = '2';
    expect(resolveCurrent()?.id).toBe(ALI_LISBON_SEARCH_EVENT_ID);
    state.storyEvents.push(ALI_LISBON_SEARCH_EVENT_ID);

    // Step 4: Aden Harbor corsair ambush
    state.portId = '73';
    state.buildingId = '4';
    expect(resolveCurrent()?.id).toBe(ALI_ADEN_CORSAIRS_EVENT_ID);
    state.storyEvents.push(ALI_ADEN_CORSAIRS_EVENT_ID);
    state.combatResults['ali.red-sea-raiders'] = 'victory';

    // Step 5: Basra Pub reunion with Sasha
    state.portId = '77';
    state.buildingId = '2';
    expect(resolveCurrent()?.id).toBe(ALI_BASRA_REUNION_EVENT_ID);
    state.storyEvents.push(ALI_BASRA_REUNION_EVENT_ID);

    // Step 6: Istanbul Royal Palace Grand Commercial Advisor
    state.portId = '3';
    state.buildingId = '6';
    expect(resolveCurrent()?.id).toBe(ALI_ENDING_EVENT_ID);
    state.storyEvents.push(ALI_ENDING_EVENT_ID);

    const journal = getAliJournal(state);
    expect(journal.every((entry) => entry.completed)).toBe(true);
  });
});
