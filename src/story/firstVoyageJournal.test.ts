import {
  CHAPTER_COMPLETE_EVENT_ID,
  COMMISSION_ACCEPTED_EVENT_ID,
  DOMINGO_MET_EVENT_ID,
  DOMINGO_RECRUITED_EVENT_ID,
  GIBRALTAR_DISCOVERY_ID,
} from './content/arcs/joao/first-voyage';
import { getFirstVoyageJournal } from './firstVoyageJournal';
import state from '../state/state';

const opening = {
  house: 'joao.lisbon-opening.house-introduction',
  pub: 'joao.lisbon-opening.pub-farewell',
  shipyard: 'joao.lisbon-opening.shipyard-hermes-ii',
  church: 'joao.lisbon-opening.church-recruit-enrico',
  mother: 'joao.lisbon-opening.house-mother-farewell',
  harbor: 'joao.lisbon-opening.harbor-final',
};

const firstIncomplete = () =>
  getFirstVoyageJournal(state).find(({ completed }) => !completed);

describe('first voyage journal', () => {
  beforeEach(() => {
    state.storyEvents = [];
    state.discoveries = [];
    state.reportedDiscoveries = [];
    state.mates = [{ sailorId: '1', role: 0 }];
  });

  test('lists every concrete opening stop in playable order', () => {
    const entries = getFirstVoyageJournal(state);

    expect(entries.slice(0, 6).map(({ id }) => id)).toEqual([
      'opening-house',
      'opening-pub',
      'opening-shipyard',
      'opening-church',
      'opening-mother',
      'opening-harbor',
    ]);
    expect(entries.slice(0, 6).map(({ body }) => body)).toEqual([
      'Visit your father at the Franco house in Lisbon.',
      'Visit Carlotta at the Lisbon pub.',
      'Collect Hermes II at the Lisbon shipyard.',
      'Meet Father Felippe and Enrico at the Lisbon church.',
      'Return to your mother at the Franco house from 22:00 to midnight.',
      'Finish preparations with Rocco at the Lisbon harbor.',
    ]);
    expect(firstIncomplete()?.id).toBe('opening-house');

    Object.values(opening).forEach((eventId, index) => {
      state.storyEvents.push(eventId);
      expect(firstIncomplete()?.id).toBe(
        [
          'opening-pub',
          'opening-shipyard',
          'opening-church',
          'opening-mother',
          'opening-harbor',
          'commission',
        ][index],
      );
    });
  });

  test('guides commission, sea days, Domingo, Gibraltar, report, and reward', () => {
    state.storyEvents = [...Object.values(opening)];
    expect(firstIncomplete()).toMatchObject({
      id: 'commission',
      body: 'Accept the first-voyage commission at the Lisbon Guild.',
    });

    state.storyEvents.push(COMMISSION_ACCEPTED_EVENT_ID);
    expect(firstIncomplete()).toMatchObject({
      id: 'domingo',
      body: 'Sail for 3 consecutive days to meet the sailor following your wake.',
    });

    state.storyEvents.push(DOMINGO_MET_EVENT_ID);
    expect(firstIncomplete()).toMatchObject({
      id: 'domingo',
      body: 'Reconsider Domingo’s offer at the Lisbon Guild.',
    });

    state.storyEvents.push(DOMINGO_RECRUITED_EVENT_ID);
    state.mates.push({ sailorId: '34', role: null });
    expect(firstIncomplete()).toMatchObject({
      id: 'gibraltar',
      body: 'Sail south from Lisbon around Iberia’s southwest coast, then east toward Seville and Ceuta. Chart Gibraltar near 36° N, 5.6° W.',
    });

    state.discoveries.push(GIBRALTAR_DISCOVERY_ID);
    expect(firstIncomplete()).toMatchObject({
      id: 'report',
      body: 'Return to the Lisbon Guild and report the Strait of Gibraltar.',
    });

    state.reportedDiscoveries.push(GIBRALTAR_DISCOVERY_ID);
    expect(firstIncomplete()).toMatchObject({
      id: 'chapter',
      body: 'Collect the 500g commission reward at the Lisbon Guild.',
    });

    state.storyEvents.push(CHAPTER_COMPLETE_EVENT_ID);
    expect(
      getFirstVoyageJournal(state).every(({ completed }) => completed),
    ).toBe(true);
  });
});
