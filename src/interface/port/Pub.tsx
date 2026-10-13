import React, { ReactNode, useState } from 'react';
import useBuilding from './hooks/useBuilding';
import {
  CharacterMessageBoxType,
  VendorMessageBoxType,
} from '../quest/getMessageBoxes';
import BuildingMenu from '../common/BuildingMenu';
import BuildingWrapper from './BuildingWrapper';
import {
  getFirstMateId,
  getGold,
  getProtagonistSailorId,
  isLisbon,
} from '../../state/selectors';
import {
  getCrewNeeded,
  getPlayerFleet,
  getTotalCrew,
} from '../../state/selectorsFleet';
import {
  CREW_COST,
  dismissCrew,
  recruitCrew,
  treatPub,
} from '../../state/actionsPort';
import { t } from '../../localization';
import InputNumber from '../common/InputNumber';

const pubOptions = [
  'Recruit Crew',
  'Dismiss Crew',
  'Treat',
  'Meet',
  'Waitress',
  'Gamble',
] as const;
type PubOptions = typeof pubOptions[number];

const enabledPubOptions: PubOptions[] = [
  'Recruit Crew',
  'Dismiss Crew',
  'Treat',
];

export default function Pub() {
  const { selectOption, next, back, reset, state } = useBuilding<PubOptions>();
  const [treatResult, setTreatResult] = useState<{
    cost: number;
    bonusCrew: number;
  } | null>(null);
  const [dismissedCount, setDismissedCount] = useState(0);

  const { option, step } = state;

  let vendorMessage: VendorMessageBoxType = {
    body: 'Hey sailor, you’ll like our wine!',
  };

  // Carlotta greets instead of the regular vendor
  if (isLisbon()) {
    vendorMessage = null;
  }

  let characterMessage: CharacterMessageBoxType = null;

  const menu: ReactNode = (
    <BuildingMenu
      options={pubOptions.map((s) => ({
        label: s,
        value: s,
        disabled: !enabledPubOptions.includes(s) || !getPlayerFleet().length,
      }))}
      onSelect={(s) => selectOption(s)}
      onCancel={back}
      hidden={option !== null || step === -1}
    />
  );

  let children: ReactNode = null;

  if (option === 'Recruit Crew') {
    vendorMessage = null;

    const gold = getGold();
    const crewNeeded = getCrewNeeded();

    if (step === 0) {
      if (!crewNeeded) {
        characterMessage = {
          body: 'We have enough men in our crew.',
          characterId: getFirstMateId(),
          acknowledge: back,
        };
      } else if (gold < CREW_COST) {
        characterMessage = {
          body: 'We don’t have enough gold.',
          characterId: getFirstMateId(),
          acknowledge: back,
        };
      } else {
        characterMessage = {
          body: 'Shall we recruit some men for our crew?',
          characterId: getFirstMateId(),
          confirm: {
            yes: next,
            no: back,
          },
        };
      }
    }

    if (step === 1) {
      characterMessage = {
        body: 'Hey! Do any of you tough sailors want to join our crew?',
        characterId: getProtagonistSailorId(),
        acknowledge: next,
      };
    }

    if (step === 2) {
      let count = 0;

      if (crewNeeded * CREW_COST > gold) {
        count = Math.floor(gold / CREW_COST);
      } else {
        count = crewNeeded;
      }

      characterMessage = {
        body: t(
          'We rounded up {count} men, at the cost of {cost} gold pieces.',
          {
            count,
            cost: count * CREW_COST,
          },
        ),
        characterId: getFirstMateId(),
        acknowledge: () => {
          recruitCrew(count);
          reset();
        },
      };
    }
  }

  if (option === 'Dismiss Crew') {
    vendorMessage = null;
    const totalCrew = getTotalCrew();

    if (step === 0) {
      if (totalCrew <= 0) {
        characterMessage = {
          body: 'We have no crew members to dismiss.',
          characterId: getFirstMateId(),
          acknowledge: back,
        };
      } else {
        characterMessage = {
          body: 'How many crew members should we dismiss?',
          characterId: getFirstMateId(),
        };
        children = (
          <InputNumber
            limit={totalCrew}
            onComplete={(amount) => {
              if (amount > 0 && dismissCrew(amount)) {
                setDismissedCount(amount);
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
      characterMessage = {
        body: t('Dismissed {count} crew members.', { count: dismissedCount }),
        characterId: getFirstMateId(),
        acknowledge: reset,
      };
    }
  }

  if (option === 'Treat') {
    const gold = getGold();

    if (step === 0) {
      if (!gold) {
        vendorMessage = null;
        characterMessage = {
          body: 'We don’t have enough gold.',
          characterId: getFirstMateId(),
          acknowledge: back,
        };
      } else {
        vendorMessage = {
          body: 'Buy a round of drinks for the tavern? (Up to 100g)',
          confirm: {
            yes: () => {
              const res = treatPub();
              setTreatResult(res);
              next();
            },
            no: back,
          },
        };
      }
    }

    if (step === 1) {
      const bonus = treatResult?.bonusCrew ?? 0;
      vendorMessage = {
        body:
          bonus > 0
            ? t(
                'The tavern cheers! {count} eager sailors volunteered to join your flagship!',
                { count: bonus },
              )
            : 'The tavern cheers! Sailors say: "Check the Market Rate and invest in ports to unlock bigger ships!"',
        acknowledge: () => {
          setTreatResult(null);
          reset();
        },
      };
    }
  }

  return (
    <BuildingWrapper
      buildingId="2"
      vendorMessageBox={vendorMessage}
      characterMessageBox={characterMessage}
      menu={menu}
    >
      {children}
    </BuildingWrapper>
  );
}
