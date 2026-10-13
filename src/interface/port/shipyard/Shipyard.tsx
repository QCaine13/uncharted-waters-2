import React, { ReactNode, useState } from 'react';

import BuildingMenu from '../../common/BuildingMenu';
import {
  buyNewShip,
  buyUsedShip,
  getAvailableSailorId,
  getRemodelQuote,
  investInShipyard,
  remodelShip,
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
import {
  canAfford,
  getAvailableNewShips,
  getGold,
  getUsedShips,
} from '../../../state/selectors';
import { t } from '../../../localization';
import {
  getRepairQuote,
  repairShip,
  type RepairQuote,
} from '../../../state/actionsRepair';
import InputNumber from '../../common/InputNumber';

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

export default function Shipyard() {
  const { selectOption, back, next, reset, state } =
    useBuilding<ShipyardOptions>();

  const [newShipId, setNewShipId] = useState<string>();
  const [usedShipId, setUsedShipId] = useState<string>();

  const [selectedShipNumberToSell, setSelectedShipNumberToSell] =
    useState<number>();
  const [selectedShipNumberToRemodel, setSelectedShipNumberToRemodel] =
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
      }))}
      onSelect={(s) => selectOption(s)}
      onCancel={back}
      hidden={option !== null}
    />
  );

  let menu2: ReactNode;

  let children: ReactNode;

  if (option === 'New Ship') {
    const availableNewShips = getAvailableNewShips();

    if (availableNewShips.length === 0) {
      vendorMessage = {
        body: 'We cannot build any new ships here yet.',
        acknowledge: back,
      };
    } else {
      menu2 = (
        <BuildingMenu
          title="Ship Model"
          options={availableNewShips.map((shipId) => ({
            label: shipData[shipId].name,
            value: shipId,
          }))}
          onSelect={(shipId) => {
            setNewShipId(shipId);
            next();
          }}
          onCancel={back}
          level2
          hidden={step !== 0}
        />
      );

      if (step === 0) {
        vendorMessage = {
          body: 'Which model would you like us to build?',
        };
      }

      if (newShipId) {
        children = <ShipyardShipBox shipId={newShipId} />;

        if (step === 1) {
          vendorMessage = {
            body: shipData[newShipId].description,
            acknowledge: next,
          };
        }

        if (step === 2) {
          vendorMessage = {
            body: t(
              'We can build this ship for {price} gold pieces. What do ye say?',
              { price: shipData[newShipId].basePrice },
            ),
            confirm: {
              yes: next,
              no: () => {
                setNewShipId(undefined);
                back(2);
              },
            },
          };
        }

        if (step === 3) {
          if (!canAfford(shipData[newShipId].basePrice)) {
            vendorMessage = {
              body: 'I’m afraid you don’t have enough gold.',
              acknowledge: () => {
                setNewShipId(undefined);
                back(3);
              },
            };
          } else if (!getAvailableSailorId()) {
            vendorMessage = {
              body: 'You don’t have a sailor available to captain this ship.',
              acknowledge: () => {
                setNewShipId(undefined);
                back(3);
              },
            };
          } else {
            vendorMessage = {
              body: 'All right, it’s yers. Time to name yer ship.',
            };

            children = (
              <ShipyardShipInputName
                onSubmit={(shipName) => {
                  buyNewShip(newShipId, shipName);
                  setNewShipId(undefined);
                  back(3);
                }}
                onCancel={() => {
                  setNewShipId(undefined);
                  back(3);
                }}
              />
            );
          }
        }
      }
    }
  }

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
          <ShipyardShipBox
            shipId={ship.id}
            customShipName={ship.name}
            currentGuns={ship.guns}
          />
        );
      }
    }
  }

  if (option === 'Remodel') {
    const remodelableShips = getPlayerFleet()
      .map((ship, index) => ({ ship, index, quote: getRemodelQuote(index) }))
      .filter(({ quote }) => quote.addedGuns > 0);

    if (step === 2 && selectedShipNumberToRemodel !== undefined) {
      const ship = getPlayerFleetShip(selectedShipNumberToRemodel);
      const quote = getRemodelQuote(selectedShipNumberToRemodel);
      vendorMessage = {
        body: t('Refitted {name} to {guns} guns.', {
          name: ship?.name ?? t('Ship'),
          guns: quote.currentGuns,
        }),
        acknowledge: () => {
          setSelectedShipNumberToRemodel(undefined);
          reset();
        },
      };
    } else if (remodelableShips.length === 0) {
      vendorMessage = {
        body: 'Your ships are already fitted with maximum cannon ports.',
        acknowledge: back,
      };
    } else {
      menu2 = (
        <BuildingMenu
          title="Your Ships"
          options={remodelableShips.map(({ ship, index, quote }) => ({
            label: `${ship.name} (${quote.currentGuns}/${quote.maxGuns})`,
            value: index,
          }))}
          onSelect={(index) => {
            setSelectedShipNumberToRemodel(index);
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
          body: 'Which ship would you like to remodel?',
        };
      }

      if (step === 1 && selectedShipNumberToRemodel !== undefined) {
        const ship = getPlayerFleetShip(selectedShipNumberToRemodel);
        const quote = getRemodelQuote(selectedShipNumberToRemodel);

        children = (
          <ShipyardShipBox
            shipId={ship.id}
            customShipName={ship.name}
            currentGuns={quote.currentGuns}
          />
        );

        if (!canAfford(quote.cost)) {
          vendorMessage = {
            body: 'I’m afraid you don’t have enough gold.',
            acknowledge: () => {
              setSelectedShipNumberToRemodel(undefined);
              back();
            },
          };
        } else {
          vendorMessage = {
            body: t(
              'Refit {name} from {current} to {max} guns for {cost} gold?',
              {
                name: ship.name,
                current: quote.currentGuns,
                max: quote.maxGuns,
                cost: quote.cost,
              },
            ),
            confirm: {
              yes: () => {
                if (remodelShip(selectedShipNumberToRemodel)) {
                  next();
                }
              },
              no: () => {
                setSelectedShipNumberToRemodel(undefined);
                back();
              },
            },
          };
        }
      }
    }
  }

  if (option === 'Invest') {
    const gold = getGold();

    if (step === 0) {
      if (!gold) {
        vendorMessage = {
          body: 'I’m afraid you don’t have enough gold.',
          acknowledge: back,
        };
      } else {
        vendorMessage = {
          body: 'Investing in our shipyard will advance our shipbuilding industry. How much will you invest?',
        };

        children = (
          <InputNumber
            limit={gold}
            onComplete={(amount) => {
              if (amount > 0 && investInShipyard(amount)) {
                next();
              } else {
                reset();
              }
            }}
            onCancel={reset}
          />
        );
      }
    }

    if (step === 1) {
      vendorMessage = {
        body: 'Much obliged! With these funds, our yard can build finer vessels.',
        acknowledge: reset,
      };
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
