import state, { PortInvestment, ProtagonistId, Role } from './state';
import generateUsedShips from '../interface/port/shipyard/generateUsedShips';
import type { LegacyQuestCompletionKey } from '../story/legacy/lisbonCompletionKeys';
import { getPortData } from '../game/port/portUtils';
import { regularPorts } from '../data/portData';
import { shipyardsToShips } from '../data/portShipyardData';
import { itemData } from '../data/itemData';
import { getPlayerFleet } from './selectorsFleet';
import createMap from '../map';
import { applyPositionDelta } from '../utils';
import getSailor from '../data/sailorData';
import { Landmark, landmarks } from '../data/discoveryData';
import { t } from '../localization';

export const getTimeOfDay = () => state.timePassed % 1440;

export const isDay = () => {
  const timeOfDay = getTimeOfDay();

  return timeOfDay >= 240 && timeOfDay < 1200;
};

export const shouldUpdateWorldStatus = () => state.timePassed % 240 === 0;

export const positionAdjacentToPort = (portId: string) => {
  const { position } = getPortData(portId);
  const map = createMap([0, 0]);

  const offsetsToCheck = [
    { x: 0, y: -2 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
    { x: -2, y: 0 },
  ];

  const positionNoCollision = offsetsToCheck
    .map((offset) => applyPositionDelta(position, offset))
    .find((p) => !map.collisionAt(p));

  if (!positionNoCollision) {
    throw Error('No available tile was found adjacent to port');
  }

  return positionNoCollision;
};

export const finishedQuest = (id: LegacyQuestCompletionKey) =>
  state.quests.includes(id);

export const canAfford = (cost: number) => state.gold >= cost;

export const getPortInvestment = (
  portId: string = state.portId ?? '1',
): PortInvestment => {
  const entry = state.portInvestments?.[portId];
  return {
    economy: entry?.economy ?? 0,
    industry: entry?.industry ?? 0,
  };
};

export const getPortEconomy = (
  portId: string = state.portId ?? '1',
): number => {
  const port = getPortData(portId);
  if (port.isSupplyPort) return 0;
  const inv = getPortInvestment(portId);
  return Math.min(1000, port.economy + inv.economy);
};

export const getPortIndustry = (
  portId: string = state.portId ?? '1',
): number => {
  const port = getPortData(portId);
  if (port.isSupplyPort) return 0;
  const inv = getPortInvestment(portId);
  return Math.min(1000, port.industry + inv.industry);
};

export const getAvailableNewShips = (
  portId: string = state.portId ?? '1',
): string[] => {
  const port = getPortData(portId);
  if (port.isSupplyPort) return [];
  const industry = getPortIndustry(portId);
  const shipPool = shipyardsToShips[port.industryId] ?? [];
  return shipPool
    .filter(({ industryRequirement }) => industry >= industryRequirement)
    .map(({ shipId }) => shipId);
};

// TODO reset used ships for a given port after some time has passed
export const getUsedShips = () => {
  const exitingUsedShips = state.usedShipsAtPort[state.portId!];

  if (exitingUsedShips) {
    return exitingUsedShips;
  }

  const usedShips = generateUsedShips(
    state.portId!,
    getPortIndustry(state.portId!),
  );
  state.usedShipsAtPort[state.portId!] = usedShips;
  return usedShips;
};

export const getGold = () => state.gold;

export const getSavings = () => state.savings;

const CREDIT_LINE = 1000;

export const getCreditLine = () => Math.max(0, CREDIT_LINE - state.debt);

export const getDebt = () => state.debt;

export const getRepayAmount = () => Math.min(state.debt, state.gold);

export const getAtMosque = () =>
  state.portId && getPortData(state.portId).tileset === 2;

const secretItemShopOpen = () => {
  const timeOfDay = getTimeOfDay();
  return timeOfDay >= 120 && timeOfDay < 180;
};

export const getItemShopStock = () => {
  if (!state.portId) {
    return [];
  }

  const port = getPortData(state.portId);

  if (port.isSupplyPort || !port.itemShop) {
    return [];
  }

  const items = [...port.itemShop.regular];
  const secretItem = port.itemShop.secret;

  if (secretItem && secretItemShopOpen()) {
    items.push(secretItem);
  }

  return items.map((itemId) => ({
    id: itemId,
    name: itemData[itemId].name,
  }));
};

export const getPlayerItems = () =>
  state.items.map((itemId) => ({
    id: itemId,
    name: itemData[itemId].name,
  }));

// state.discoveries stores ids in discovery order (design spec section 5) —
// mapping over it, rather than filtering `landmarks`, is what keeps that
// order intact here.
export const getDiscoveries = (): Landmark[] =>
  state.discoveries.map(
    (id) => landmarks.find((landmark) => landmark.id === id)!,
  );

export const getPlayerItem = (i: number) => itemData[state.items[i]];

export const getMateBattleLevel = (sailorId: string): number => {
  const baseLevel = getSailor(sailorId)?.battleLevel ?? 1;
  const experience = state.mateProgress[sailorId]?.battleExperience ?? 0;
  return baseLevel + Math.floor(experience / 100);
};

export const getMates = () =>
  state.mates.map((mate) => {
    const sailor = getSailor(mate.sailorId);
    return {
      ...mate,
      ...sailor,
      battleExperience:
        state.mateProgress[mate.sailorId]?.battleExperience ?? 0,
      battleLevel: getMateBattleLevel(mate.sailorId),
    };
  });

export const getCaptain = (shipI: Number) => {
  const mate = state.mates.find(({ role }) => role === shipI);

  if (!mate) {
    throw Error('No captain was found for the provided ship');
  }

  return {
    ...getSailor(mate.sailorId),
    battleLevel: getMateBattleLevel(mate.sailorId),
  };
};

export const getRoleDisplay = (role: Role) => {
  const fleet = getPlayerFleet();

  if (!fleet.length) {
    return '';
  }

  const flagshipName = fleet[0].name;

  if (role === null) {
    return t('Navigator of {ship}', { ship: flagshipName });
  }

  if (role === 'firstMate') {
    return t('First Mate of {ship}', { ship: flagshipName });
  }

  if (role === 'bookKeeper') {
    return t('Bookkeeper of {ship}', { ship: flagshipName });
  }

  if (role === 'chiefNavigator') {
    return t('Chief Navigator of {ship}', { ship: flagshipName });
  }

  if (role === 0) {
    return t('Commodore of {ship}', { ship: flagshipName });
  }

  const shipName = fleet[role].name;

  return t('Captain of {ship}', { ship: shipName });
};

export const getProtagonistId = (): ProtagonistId =>
  state.protagonistId ?? 'joao';

export const getProtagonistSailorId = (): string => {
  const id = getProtagonistId();
  if (id === 'katarina') return '2';
  if (id === 'otto') return '3';
  if (id === 'pietro') return '4';
  if (id === 'ernst') return '5';
  if (id === 'ali') return '6';
  return '1';
};

export const getFirstMateId = (): string => {
  const id = getProtagonistId();
  if (id === 'katarina') return '36';
  if (id === 'otto') return '37';
  if (id === 'pietro') return '35';
  if (id === 'ernst') return '38';
  if (id === 'ali') return '40';
  return '32';
};

export const getTotalFame = (): number =>
  (state.fame?.adventure ?? 0) +
  (state.fame?.pirate ?? 0) +
  (state.fame?.trade ?? 0);

export const getTotalInvestment = (): number =>
  Object.values(state.portInvestments ?? {}).reduce(
    (sum, inv) => sum + (inv?.economy ?? 0) + (inv?.industry ?? 0),
    0,
  );

export const getRoyalRank = (): string => {
  const score = getTotalFame() + getTotalInvestment();
  if (score >= 5000) return 'Duke';
  if (score >= 3000) return 'Marquis';
  if (score >= 1800) return 'Earl';
  if (score >= 1000) return 'Viscount';
  if (score >= 500) return 'Baron';
  if (score >= 250) return 'Knight';
  if (score >= 100) return 'Squire';
  if (score >= 30) return 'Page';
  return 'None';
};

export const COUNTRY_NAMES = [
  'Portugal',
  'Spain',
  'Ottoman Empire',
  'Italy',
  'England',
  'Holland',
] as const;

export const getCountrySummary = () =>
  COUNTRY_NAMES.map((country, idx) => {
    const alliedPorts = regularPorts.filter(
      (port) => (port.allegiances[idx] ?? 0) >= 50,
    ).length;
    return {
      country,
      alliedPorts,
    };
  });

export const isLisbon = () => state.portId === '1';
