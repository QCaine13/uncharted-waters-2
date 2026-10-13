import React, { useState } from 'react';

import {
  getPendingDiscoveryReports,
  reportDiscoveries,
  type DiscoveryReportResult,
} from '../../state/actionsDiscovery';
import { getCountrySummary } from '../../state/selectors';
import state from '../../state/state';
import { getLocale, t } from '../../localization';
import BuildingMenu from '../common/BuildingMenu';
import type { VendorMessageBoxType } from '../quest/getMessageBoxes';
import BuildingWrapper from './BuildingWrapper';
import useBuilding from './hooks/useBuilding';

const guildOptions = [
  'Job Assignment',
  'Report Discoveries',
  'Country Info',
] as const;
type GuildOption = typeof guildOptions[number];

const hasOpenStoryAssignment = (): boolean => {
  const completed = new Set(state.storyEvents ?? []);
  return (
    completed.has('joao.lisbon-opening.harbor-final') ||
    completed.has('katarina.seville-mutiny.departed-seville') ||
    completed.has('pietro.genoa-departure.lisbon-patronage')
  );
};

export default function Guild() {
  const {
    selectOption,
    back,
    reset,
    state: buildingState,
  } = useBuilding<GuildOption>();
  const [storyRevision, setStoryRevision] = useState(0);
  const [report, setReport] = useState<DiscoveryReportResult | null>(null);
  const [showingCountryInfo, setShowingCountryInfo] = useState(false);
  const pendingReports = getPendingDiscoveryReports();

  const select = (option: GuildOption) => {
    if (option === 'Job Assignment') {
      setReport(null);
      setShowingCountryInfo(false);
      setStoryRevision((revision) => revision + 1);
      return;
    }
    if (option === 'Report Discoveries') {
      setShowingCountryInfo(false);
      setReport(reportDiscoveries());
      selectOption(option);
      setStoryRevision((revision) => revision + 1);
      return;
    }
    if (option === 'Country Info') {
      setReport(null);
      setShowingCountryInfo(true);
      selectOption(option);
    }
  };

  let vendorMessage: VendorMessageBoxType = {
    body: 'Welcome to the Guild. What can I do for you?',
  };
  if (report !== null) {
    vendorMessage = {
      body:
        report.ids.length === 1
          ? t('Reported {count} discovery. The Guild pays {gold}g.', {
              count: report.ids.length,
              gold: report.gold,
            })
          : t('Reported {count} discoveries. The Guild pays {gold}g.', {
              count: report.ids.length,
              gold: report.gold,
            }),
      acknowledge: () => {
        setReport(null);
        reset();
      },
    };
  } else if (showingCountryInfo) {
    const separator = getLocale() === 'zh-CN' ? '，' : ', ';
    const summaryText = getCountrySummary()
      .map(({ country, alliedPorts }) =>
        t('{country}: {count} ports', {
          country: t(country),
          count: alliedPorts,
        }),
      )
      .join(separator);

    vendorMessage = {
      body: t('Allied ports by maritime power — {summary}.', {
        summary: summaryText,
      }),
      acknowledge: () => {
        setShowingCountryInfo(false);
        reset();
      },
    };
  }

  const menu = (
    <BuildingMenu
      options={guildOptions.map((option) => ({
        label: option,
        value: option,
        disabled:
          (option === 'Job Assignment' && !hasOpenStoryAssignment()) ||
          (option === 'Report Discoveries' && pendingReports.length === 0),
      }))}
      onSelect={select}
      onCancel={back}
      hidden={buildingState.option !== null}
    />
  );
  const reportTestId = report === null ? undefined : 'guild-report-receipt';

  return (
    <div data-test="guild">
      <div data-test={reportTestId}>
        <BuildingWrapper
          key={storyRevision}
          buildingId="7"
          vendorMessageBox={vendorMessage}
          menu={menu}
        />
      </div>
    </div>
  );
}
