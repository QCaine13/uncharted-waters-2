import state from './state';
import updateInterface from './updateInterface';
import {
  buyNewShip,
  completeLegacyQuestOnce,
  dismissCrew,
  getRemodelQuote,
  getSupplyLimit,
  investInMarket,
  investInShipyard,
  remodelShip,
  requestRoyalFunding,
  supplyShip,
  treatPub,
} from './actionsPort';
import {
  getAvailableNewShips,
  getCountrySummary,
  getPortEconomy,
  getPortIndustry,
  getPortInvestment,
  getRoyalRank,
} from './selectors';

const ship = () => ({
  id: '6',
  name: 'Hermes II',
  crew: 10,
  cargo: [],
  durability: 25,
});

describe('harbor supply transactions', () => {
  beforeEach(() => {
    state.gold = 100;
    state.fleets = { '1': { position: undefined, ships: [ship()] } };
    updateInterface.general = jest.fn();
    window.localStorage.clear();
  });

  test('limits paid supplies by funds and water only by capacity', () => {
    expect(getSupplyLimit(0, 'food')).toBe(5);
    expect(getSupplyLimit(0, 'water')).toBe(110);
  });

  test.each([0, -1, 1.5, Number.NaN])(
    'rejects invalid quantity %s without mutation',
    (quantity) => {
      const before = JSON.stringify(state.fleets);
      expect(supplyShip(0, 'food', quantity)).toBe(false);
      expect(JSON.stringify(state.fleets)).toBe(before);
      expect(state.gold).toBe(100);
      expect(window.localStorage.length).toBe(0);
    },
  );

  test('rejects unaffordable or over-capacity quantities atomically', () => {
    expect(supplyShip(0, 'food', 6)).toBe(false);
    expect(supplyShip(0, 'water', 111)).toBe(false);
    expect(state.fleets['1'].ships[0].cargo).toEqual([]);
    expect(state.gold).toBe(100);
  });

  test('applies a valid purchase once and persists it', () => {
    expect(supplyShip(0, 'food', 5)).toBe(true);
    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: 'food', quantity: 5 },
    ]);
    expect(state.gold).toBe(0);
    expect(window.localStorage.length).toBe(1);
  });
});

describe('legacy quest completion', () => {
  beforeEach(() => {
    state.quests = [];
    window.localStorage.clear();
  });

  test('records a completion marker only once', () => {
    completeLegacyQuestOnce('houseBeforeQuest');
    completeLegacyQuestOnce('houseBeforeQuest');

    expect(state.quests).toEqual(['houseBeforeQuest']);
    expect(window.localStorage.length).toBe(0);
  });
});

describe('port investments, shipyard new ships & remodeling, pub crew/treat, and palace', () => {
  beforeEach(() => {
    state.portId = '1'; // Lisbon: economy 780, industry 770, industryId '1'
    state.gold = 5000;
    state.fame = { adventure: 0, pirate: 0, trade: 0 };
    state.portInvestments = {};
    state.usedShipsAtPort = {};
    state.fleets = { '1': { position: undefined, ships: [ship()] } };
    state.mates = [
      { sailorId: '1', role: 0 },
      { sailorId: '32', role: null },
    ];
    updateInterface.general = jest.fn();
    window.localStorage.clear();
  });

  test('investing in market and shipyard raises effective economy/industry, awards trade fame, and unlocks higher-tier ships', () => {
    expect(getPortEconomy('1')).toBe(780);
    expect(getPortIndustry('1')).toBe(770);
    // Galleon ('11', req 800) is not unlocked yet at Lisbon (industry 770)
    expect(getAvailableNewShips('1')).not.toContain('11');

    expect(investInMarket(500)).toBe(true);
    expect(getPortInvestment('1').economy).toBe(50);
    expect(getPortEconomy('1')).toBe(830);
    expect(state.fame.trade).toBe(5);
    expect(state.gold).toBe(4500);

    expect(investInShipyard(500)).toBe(true);
    expect(getPortInvestment('1').industry).toBe(50);
    expect(getPortIndustry('1')).toBe(820);
    expect(state.fame.trade).toBe(10);
    expect(getAvailableNewShips('1')).toContain('11');
  });

  test('buying a new ship builds it at full durability and assigns an available captain', () => {
    expect(buyNewShip('1', 'Swift Balsa')).toBe(true);
    expect(state.fleets['1'].ships).toHaveLength(2);
    expect(state.fleets['1'].ships[1]).toMatchObject({
      id: '1',
      name: 'Swift Balsa',
      durability: 30,
      guns: 5,
    });
    expect(state.mates[1].role).toBe(1);
    expect(state.gold).toBe(3800);
  });

  test('remodeling a ship upgrades its cannon ports to maximumGuns', () => {
    const quote = getRemodelQuote(0);
    expect(quote).toEqual({
      currentGuns: 10,
      maxGuns: 20,
      addedGuns: 10,
      cost: 500,
    });

    expect(remodelShip(0)).toBe(true);
    expect(state.fleets['1'].ships[0].guns).toBe(20);
    expect(state.gold).toBe(4500);
    expect(getRemodelQuote(0).addedGuns).toBe(0);
  });

  test('treating in the pub recruits eager sailors up to usedCrew and dismissCrew reduces crew', () => {
    const res = treatPub();
    expect(res).toEqual({ cost: 100, bonusCrew: 5 });
    expect(state.fleets['1'].ships[0].crew).toBe(15);
    expect(state.gold).toBe(4900);

    expect(dismissCrew(5)).toBe(true);
    expect(state.fleets['1'].ships[0].crew).toBe(10);
  });

  test('royal rank and expedition funding respond to fame and port investments', () => {
    expect(getRoyalRank()).toBe('None');
    state.fame.adventure = 50;
    expect(getRoyalRank()).toBe('Page');

    state.gold = 100;
    expect(requestRoyalFunding()).toBe(500);
    expect(state.gold).toBe(600);
    // Cannot request again while gold >= 500
    expect(requestRoyalFunding()).toBe(0);

    const countries = getCountrySummary();
    expect(countries).toHaveLength(6);
    expect(countries[0].country).toBe('Portugal');
    expect(countries[0].alliedPorts).toBeGreaterThan(0);
  });
});
