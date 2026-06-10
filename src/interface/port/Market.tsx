import React, { ReactNode, useRef, useState } from 'react';
import useBuilding from './hooks/useBuilding';
import { VendorMessageBoxType } from '../quest/getMessageBoxes';
import BuildingMenu from '../common/BuildingMenu';
import BuildingWrapper from './BuildingWrapper';
import {
  getMarketGoods,
  getCargoGoods,
  getAvailableCargoSpace,
  buyGood,
  sellGood,
} from '../../state/actionsMarket';
import { getGold } from '../../state/selectors';
import { goodData, GoodId } from '../../data/goodsData';

const marketOptions = ['Buy Goods', 'Sell Goods', 'Market Rate'] as const;
type MarketOption = typeof marketOptions[number];

const QUANTITY_PRESETS = [1, 5, 10, 25, 50];

const getQuantityOptions = (max: number) => {
  const presets = QUANTITY_PRESETS.filter((q) => q <= max);
  if (!presets.length || presets[presets.length - 1] < max) {
    presets.push(max);
  }
  return [...new Set(presets)];
};

export default function Market() {
  const { selectOption, next, back, reset, state } =
    useBuilding<MarketOption>();

  const hasBought = useRef(false);
  const hasSold = useRef(false);

  const [selectedGoodId, setSelectedGoodId] = useState<GoodId>();
  const [selectedGoodPrice, setSelectedGoodPrice] = useState(0);
  const [selectedBuyQty, setSelectedBuyQty] = useState(1);

  const [selectedCargoIdx, setSelectedCargoIdx] = useState<number>();
  const [selectedCargoShip, setSelectedCargoShip] = useState(0);
  const [selectedSellPrice, setSelectedSellPrice] = useState(0);
  const [selectedSellQty, setSelectedSellQty] = useState(1);

  const { option, step } = state;

  let vendorMessage: VendorMessageBoxType = {
    body: 'Welcome to the market. What can I do for you?',
  };

  const menu: ReactNode = (
    <BuildingMenu
      options={marketOptions.map((s) => ({
        label: s,
        value: s,
      }))}
      onSelect={(s) => selectOption(s)}
      onCancel={back}
      hidden={option !== null || step === -1}
    />
  );

  let menu2: ReactNode;

  if (option === 'Buy Goods') {
    const gold = getGold();
    const cargoSpace = getAvailableCargoSpace();

    if (!gold) {
      vendorMessage = {
        body: "You don't have any gold.",
        acknowledge: back,
      };
    } else if (cargoSpace <= 0) {
      vendorMessage = {
        body: "Your ships have no cargo space available.",
        acknowledge: back,
      };
    } else {
      const goods = getMarketGoods();

      vendorMessage = {
        body: !hasBought.current
          ? 'Take a look at our wares.'
          : 'Anything else catch your eye?',
      };

      menu2 = (
        <BuildingMenu
          title="Buy"
          options={goods.map((good) => ({
            label: `${good.name} (${good.buyPrice}g)${
              good.isSupply ? ' *' : ''
            }`,
            value: good.id,
          }))}
          onSelect={(goodId) => {
            const good = goods.find((g) => g.id === goodId);
            if (!good) return;
            setSelectedGoodId(goodId);
            setSelectedGoodPrice(good.buyPrice);
            next();
          }}
          onCancel={back}
          level2
          hidden={step !== 0}
        />
      );

      if (selectedGoodId && step === 1) {
        const maxAffordable = Math.floor(gold / selectedGoodPrice);
        const maxCanBuy = Math.min(maxAffordable, cargoSpace);
        const qtyOptions = getQuantityOptions(maxCanBuy);

        vendorMessage = {
          body: `${goodData[selectedGoodId].name} at ${selectedGoodPrice}g each. How many?`,
        };

        menu2 = (
          <BuildingMenu
            title="Qty"
            options={qtyOptions.map((q) => ({
              label: `${q} (${q * selectedGoodPrice}g)`,
              value: q,
            }))}
            onSelect={(qty) => {
              setSelectedBuyQty(qty);
              next();
            }}
            onCancel={() => {
              setSelectedGoodId(undefined);
              back();
            }}
            level2
            hidden={step !== 1}
          />
        );
      }

      if (selectedGoodId && step === 2) {
        const totalCost = selectedBuyQty * selectedGoodPrice;

        vendorMessage = {
          body: `${selectedBuyQty} ${
            goodData[selectedGoodId].name
          } for ${totalCost}g. Deal?`,
          confirm: {
            yes: () => {
              const success = buyGood(selectedGoodId, selectedBuyQty);
              if (success) {
                hasBought.current = true;
                setSelectedGoodId(undefined);
                back(2);
              } else {
                next();
              }
            },
            no: () => {
              back();
            },
          },
        };
      }

      if (step === 3) {
        vendorMessage = {
          body: "I'm afraid you can't buy that many.",
          acknowledge: () => back(2),
        };
      }
    }
  }

  if (option === 'Sell Goods') {
    const cargoGoods = getCargoGoods();

    if (!cargoGoods.length) {
      vendorMessage = {
        body: "You don't have any trade goods to sell.",
        acknowledge: back,
      };
    } else {
      vendorMessage = {
        body: !hasSold.current
          ? "What are you selling?"
          : 'Got anything else?',
      };

      menu2 = (
        <BuildingMenu
          title="Sell"
          options={cargoGoods.map((good) => ({
            label: `${good.name} x${good.quantity} (${good.sellPrice}g)`,
            value: cargoGoods.indexOf(good),
          }))}
          onSelect={(idx) => {
            const good = cargoGoods[idx];
            setSelectedCargoIdx(good.cargoIndex);
            setSelectedCargoShip(good.shipNumber);
            setSelectedSellPrice(good.sellPrice);
            next();
          }}
          onCancel={back}
          level2
          hidden={step !== 0}
        />
      );

      if (selectedCargoIdx !== undefined && step === 1) {
        const cargoGood = cargoGoods.find(
          (g) =>
            g.cargoIndex === selectedCargoIdx &&
            g.shipNumber === selectedCargoShip,
        );
        const maxQty = cargoGood?.quantity ?? 1;
        const qtyOptions = getQuantityOptions(maxQty);

        vendorMessage = {
          body: `${cargoGood?.name ?? 'Goods'} at ${selectedSellPrice}g each. How many?`,
        };

        menu2 = (
          <BuildingMenu
            title="Qty"
            options={qtyOptions.map((q) => ({
              label: `${q} (${q * selectedSellPrice}g)`,
              value: q,
            }))}
            onSelect={(qty) => {
              setSelectedSellQty(qty);
              next();
            }}
            onCancel={() => {
              setSelectedCargoIdx(undefined);
              back();
            }}
            level2
            hidden={step !== 1}
          />
        );
      }

      if (selectedCargoIdx !== undefined && step === 2) {
        const totalRevenue = selectedSellQty * selectedSellPrice;
        const cargoGood = cargoGoods.find(
          (g) =>
            g.cargoIndex === selectedCargoIdx &&
            g.shipNumber === selectedCargoShip,
        );

        vendorMessage = {
          body: `${selectedSellQty} ${
            cargoGood?.name ?? 'goods'
          } for ${totalRevenue}g. Deal?`,
          confirm: {
            yes: () => {
              const success = sellGood(
                selectedCargoShip,
                selectedCargoIdx,
                selectedSellQty,
              );
              if (success) {
                hasSold.current = true;
                setSelectedCargoIdx(undefined);

                if (getCargoGoods().length) {
                  back(2);
                } else {
                  reset();
                }
              }
            },
            no: () => {
              back();
            },
          },
        };
      }
    }
  }

  if (option === 'Market Rate') {
    const goods = getMarketGoods();
    const supplyGoods = goods.filter((g) => g.isSupply);
    const demandGoods = goods.filter((g) => g.isDemand);

    const supplyNames =
      supplyGoods.map((g) => g.name).join(', ') || 'None';
    const demandNames =
      demandGoods.map((g) => g.name).join(', ') || 'None';

    vendorMessage = {
      body: `Abundant (cheap): ${supplyNames}\nScarce (expensive): ${demandNames}`,
      acknowledge: back,
    };
  }

  return (
    <BuildingWrapper
      buildingId="1"
      vendorMessageBox={vendorMessage}
      menu={menu}
      menu2={menu2}
    />
  );
}
