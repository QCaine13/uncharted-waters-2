import React, { ReactNode, useState } from 'react';

import BuildingMenu from '../../common/BuildingMenu';
import {
  buyUsedShip,
  getAvailableSailorId,
  SELL_SHIP_MODIFIER,
  sellShipNumber,
} from '../../../state/actionsPort';
import ShipyardShipBox from './ShipyardShipBox';
import { shipData } from '../../../data/shipData';
import {
  getPlayerFleet,
  getPlayerFleetShip,
} from '../../../state/selectorsFleet';
import BuildingWrapper from '../BuildingWrapper';
import useBuilding from '../hooks/useBuilding';
import { VendorMessageBoxType } from '../../quest/getMessageBoxes';
import ShipyardShipInputName from './ShipyardShipInputName';
import { canAfford, getUsedShips } from '../../../state/selectors';
import { t } from '../../../localization';
import {
  getRepairQuote,
  repairShip,
  type RepairQuote,
} from '../../../state/actionsRepair';

const shipyardOptions = [
  'New Ship',
  'Used Ship',
  'Repair',
  'Sell',
  'Remodel',
  'Invest',
] as const;
type ShipyardOptions = typeof shipyardOptions[number];

interface RepairSelection {
  index: number;
  quote: RepairQuote;
}

const shipyardDisabledOptions: ShipyardOptions[] = [
  'New Ship',
  'Remodel',
  'Invest',
];

export default function Shipyard() {
  const { selectOption, back, next, state } = useBuilding<ShipyardOptions>();

  const [usedShipId, setUsedShipId] = useState<string>();

  const [selectedShipNumberToSell, setSelectedShipNumberToSell] =
    useState<number>();
  const [repairSelection, setRepairSelection] = useState<RepairSelection>();
  const [repairResult, setRepairResult] = useState<RepairQuote>();

  const { option, step } = state;

  let vendorMessage: VendorMessageBoxType = {
    body: 'What brings you to this shipyard?',
  };

  const menu = (
    <BuildingMenu
      options={shipyardOptions.map((s) => ({
        label: s,
        value: s,
        disabled: shipyardDisabledOptions.includes(s),
      }))}
      onSelect={(s) => selectOption(s)}
      onCancel={back}
      hidden={option !== null}
    />
  );

  let menu2: ReactNode;

  let children: ReactNode;

  if (option === 'Used Ship') {
    const usedShips = getUsedShips();

    menu2 = (
      <BuildingMenu
        title="Ship Model"
        options={Object.entries(usedShips).map(([id, shipId]) => ({
          label: shipData[shipId].name,
          value: id,
        }))}
        onSelect={(shipId) => {
          setUsedShipId(shipId);
          next();
        }}
        onCancel={back}
        level2
        hidden={step !== 0}
      />
    );

    if (usedShipId) {
      children = <ShipyardShipBox shipId={usedShips[usedShipId]} />;

      if (step === 1) {
        vendorMessage = {
          body: shipData[usedShips[usedShipId]].description,
          acknowledge: next,
        };
      }

      if (step === 2) {
        vendorMessage = {
          body: t(
            'I’d sell this ship for {price} gold pieces. What do ye say?',
            { price: shipData[usedShips[usedShipId]].basePrice },
          ),
          confirm: {
            yes: next,
            no: () => {
              setUsedShipId(undefined);
              back(2);
            },
          },
        };
      }

      if (step === 3) {
        if (!canAfford(shipData[usedShips[usedShipId]].basePrice)) {
          vendorMessage = {
            body: 'I’m afraid you don’t have enough gold.',
            acknowledge: () => {
              setUsedShipId(undefined);
              back(3);
            },
          };
        } else if (!getAvailableSailorId()) {
          // the original game offers you to swap ship
          vendorMessage = {
            body: 'You don’t have a sailor available to captain this ship.',
            acknowledge: () => {
              setUsedShipId(undefined);
              back(3);
            },
          };
        } else {
          vendorMessage = {
            body: 'All right, it’s yers. Time to name yer ship.',
          };

          children = (
            <ShipyardShipInputName
              onSubmit={(usedShipName) => {
                buyUsedShip(usedShipId, usedShipName);
                setUsedShipId(undefined);
                back(3);
              }}
              onCancel={() => {
                setUsedShipId(undefined);
                back(3);
              }}
            />
          );
        }
      }
    }
  }

  if (option === 'Repair') {
    const repairableShips = getPlayerFleet()
      .map((ship, index) => ({ ship, index, quote: getRepairQuote(index) }))
      .filter(({ quote }) => quote.missing > 0);

    if (step === 2 && repairResult) {
      vendorMessage = {
        body: t('Repaired {points} hull for {cost} gold.', {
          points: repairResult.points,
          cost: repairResult.cost,
        }),
        acknowledge: () => {
          setRepairSelection(undefined);
          setRepairResult(undefined);
          back(3);
        },
      };
    } else if (repairableShips.length === 0) {
      vendorMessage = {
        body: 'Your fleet’s already in tiptop shape, matey!',
        acknowledge: back,
      };
    } else {
      menu2 = (
        <BuildingMenu
          title="Your Ships"
          options={repairableShips.map(({ ship, index, quote }) => ({
            label: t('{name} — {missing} damage — {points} affordable', {
              name: ship.name,
              missing: quote.missing,
              points: quote.points,
            }),
            value: index,
          }))}
          onSelect={(index) => {
            setRepairSelection({ index, quote: getRepairQuote(index) });
            next();
          }}
          onCancel={back}
          level2
          hidden={step !== 0}
          translateLabels={false}
        />
      );

      if (step === 0) {
        vendorMessage = { body: 'Which ship needs repairs?' };
      }

      if (step === 1 && repairSelection) {
        const { quote } = repairSelection;
        if (quote.points === 0) {
          vendorMessage = {
            body: 'You need at least 10 gold to repair one hull point.',
            acknowledge: () => {
              setRepairSelection(undefined);
              back();
            },
          };
        } else {
          vendorMessage = {
            body: `${t(
              'You can afford {points} of the {missing} damaged hull points.',
              { points: quote.points, missing: quote.missing },
            )} ${t('Repair {points} hull for {cost} gold?', {
              points: quote.points,
              cost: quote.cost,
            })}`,
            confirm: {
              yes: () => {
                if (repairShip(repairSelection.index)) {
                  setRepairResult(quote);
                  next();
                }
              },
              no: () => {
                setRepairSelection(undefined);
                back();
              },
            },
          };
        }
      }
    }
  }

  if (option === 'Sell') {
    if (getPlayerFleet().length === 1) {
      if (step === 0) {
        vendorMessage = {
          body: 'We only have the flag ship.',
          acknowledge: back,
        };
      }
    } else {
      menu2 = (
        <BuildingMenu
          title="Your Ships"
          options={getPlayerFleet().map((ship, i) => ({
            label: ship.name,
            value: i,
          }))}
          onSelect={(value) => {
            setSelectedShipNumberToSell(value);
            next();
          }}
          onCancel={back}
          level2
          hidden={step !== 0}
          translateLabels={false}
        />
      );

      if (step === 0) {
        vendorMessage = {
          body: 'Which one is for sale?',
        };
      }

      if (step === 1 && selectedShipNumberToSell !== undefined) {
        /*
          TODO
            As you currently cannot modify ships and there are no hull types,
            we can just use the defaults for the ship model in question.
         */
        const ship = getPlayerFleetShip(selectedShipNumberToSell);

        vendorMessage = {
          body: t('For this ship, I’ll give you {price} gold pieces. OK?', {
            price: shipData[ship.id].basePrice * SELL_SHIP_MODIFIER,
          }),
          confirm: {
            yes: () => {
              sellShipNumber(selectedShipNumberToSell);
              setSelectedShipNumberToSell(undefined);
              back();
            },
            no: () => {
              setSelectedShipNumberToSell(undefined);
              back();
            },
          },
        };

        children = (
          <ShipyardShipBox shipId={ship.id} customShipName={ship.name} />
        );
      }
    }
  }

  return (
    <BuildingWrapper
      buildingId="3"
      vendorMessageBox={vendorMessage}
      menu={menu}
      menu2={menu2}
    >
      {children}
    </BuildingWrapper>
  );
}
