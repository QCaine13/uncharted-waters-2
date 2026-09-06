import { landmarks } from '../data/discoveryData';
import { updateGeneral } from './actionsPort';
import { save } from './saveLoad';
import state from './state';

export interface DiscoveryReportResult {
  ids: string[];
  gold: number;
}

export const getPendingDiscoveryReports = (): string[] => {
  const knownIds = new Set(landmarks.map(({ id }) => id));
  const reported = new Set(state.reportedDiscoveries ?? []);
  return [...new Set(state.discoveries ?? [])].filter(
    (id) => knownIds.has(id) && !reported.has(id),
  );
};

export const reportDiscoveries = (): DiscoveryReportResult => {
  if (state.portId !== '1' || state.buildingId !== '7') {
    return { ids: [], gold: 0 };
  }

  const ids = getPendingDiscoveryReports();
  if (ids.length === 0) return { ids: [], gold: 0 };

  const rewards = new Map(landmarks.map(({ id, gold }) => [id, gold]));
  const gold = ids.reduce((total, id) => total + (rewards.get(id) ?? 0), 0);
  state.reportedDiscoveries.push(...ids);
  state.gold += gold;
  updateGeneral();
  save();
  return { ids, gold };
};

export default reportDiscoveries;
