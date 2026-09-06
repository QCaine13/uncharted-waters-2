import React, { ReactNode, useRef } from 'react';
import useBuilding from '../hooks/useBuilding';
import { VendorMessageBoxType } from '../../quest/getMessageBoxes';
import BuildingMenu from '../../common/BuildingMenu';
import BuildingWrapper from '../BuildingWrapper';
import { borrow, deposit, repay, withdraw } from '../../../state/actionsPort';
import {
  getCreditLine,
  getDebt,
  getSavings,
  getGold,
  getRepayAmount,
} from '../../../state/selectors';
import InputNumber from '../../common/InputNumber';
import { t } from '../../../localization';

const bankOptions = ['Deposit', 'Withdraw', 'Borrow', 'Repay'] as const;
type BankOptions = typeof bankOptions[number];

export default function Bank() {
  const { selectOption, next, back, reset, state } =
    useBuilding<BankOptions>(true);

  const depositAmount = useRef(0);
  const withdrawAmount = useRef(0);
  const borrowAmount = useRef(0);

  const { option, step } = state;

  let vendorMessage: VendorMessageBoxType = {
    body: 'Welcome to our regional branch of the Marco Polo Bank.',
  };

  const menu = (
    <BuildingMenu
      options={bankOptions.map((s) => ({
        label: s,
        value: s,
      }))}
      onSelect={(s) => selectOption(s)}
      onCancel={back}
      hidden={option !== null || step === -1}
    />
  );

  let children: ReactNode;

  if (option === 'Deposit') {
    const gold = getGold();
    const savings = getSavings();

    if (step === 0) {
      if (!gold) {
        vendorMessage = {
          body: 'You don’t have any gold to deposit.',
          acknowledge: reset,
        };
      } else if (!savings) {
        vendorMessage = {
          body: 'You don’t have any gold in your account.',
          acknowledge: next,
        };
      } else {
        vendorMessage = {
          body: t('Now you have {amount} gold pieces in your savings account.', { amount: savings }),
          acknowledge: next,
        };
      }
    }

    if (step === 1) {
      vendorMessage = {
        body: t('How much would you like to deposit? (0-{limit})', { limit: gold }),
      };

      children = (
        <InputNumber
          limit={gold}
          onComplete={(amount) => {
            deposit(amount);
            depositAmount.current = amount;
            next();
          }}
          onCancel={reset}
        />
      );
    }

    if (step === 2) {
      vendorMessage = {
        body: t('We’ll deposit {amount} gold pieces into your account. The monthly interest rate is 3%', { amount: depositAmount.current }),
        acknowledge: next,
      };
    }

    if (step === 3) {
      vendorMessage = {
        body: t('Now you have {amount} gold pieces in your savings account.', { amount: savings }),
        acknowledge: reset,
      };
    }
  }

  if (option === 'Withdraw') {
    const savings = getSavings();

    if (step === 0) {
      if (!savings) {
        vendorMessage = {
          body: 'You don’t have any gold in your account.',
          acknowledge: reset,
        };
      } else {
        vendorMessage = {
          body: t('Now you have {amount} gold pieces in your savings account.', { amount: savings }),
          acknowledge: next,
        };
      }
    }

    if (step === 1) {
      vendorMessage = {
        body: t('How much would you like to withdraw? (0-{limit})', { limit: savings }),
      };

      children = (
        <InputNumber
          limit={savings}
          onComplete={(amount) => {
            withdraw(amount);
            withdrawAmount.current = amount;
            next();
          }}
          onCancel={reset}
        />
      );
    }

    if (step === 2) {
      vendorMessage = {
        body: t('Here is {amount} gold from your account.', { amount: withdrawAmount.current }),
        acknowledge: next,
      };
    }

    if (step === 3) {
      vendorMessage = {
        body: t('Now you have {amount} gold pieces in your savings account.', { amount: savings }),
        acknowledge: reset,
      };
    }
  }

  if (option === 'Borrow') {
    const creditLine = getCreditLine();

    if (step === 0) {
      if (creditLine > 0) {
        vendorMessage = {
          body: t('Your credit line is {amount} gold pieces.', { amount: creditLine }),
          acknowledge: next,
        };
      } else {
        vendorMessage = {
          body: 'With your poor credit history, there’s no way we can give you a loan.',
          acknowledge: reset,
        };
      }
    }

    if (step === 1) {
      vendorMessage = {
        body: t('How much gold do you need to borrow? (0-{limit})', { limit: creditLine }),
      };

      children = (
        <InputNumber
          limit={creditLine}
          onComplete={(amount) => {
            borrow(amount);
            borrowAmount.current = amount;
            next();
          }}
          onCancel={reset}
        />
      );
    }

    if (step === 2) {
      vendorMessage = {
        body: t('Then we’ll lend you {amount} gold pieces.', { amount: borrowAmount.current }),
        acknowledge: next,
      };
    }

    if (step === 3) {
      vendorMessage = {
        body: 'The monthly interest rate is 10%. Please invest our loan wisely.',
        acknowledge: reset,
      };
    }
  }

  if (option === 'Repay') {
    const debt = getDebt();

    if (step === 0) {
      if (!debt) {
        vendorMessage = {
          body: 'You don’t owe us any money.',
          acknowledge: reset,
        };
      } else {
        vendorMessage = {
          body: t('Now your debt is {amount} gold.', { amount: debt }),
          acknowledge: next,
        };
      }
    }

    if (step === 1) {
      const repayAmount = getRepayAmount();

      if (!repayAmount) {
        // this condition is not handled in the original game, and you get (0-0)
        vendorMessage = {
          body: 'You don’t have any gold to pay back your loan with.',
          acknowledge: reset,
        };
      } else {
        vendorMessage = {
          body: t('How much of your loan will you be paying back? (0-{limit})', { limit: repayAmount }),
        };

        children = (
          <InputNumber
            limit={repayAmount}
            onComplete={(amount) => {
              repay(amount);
              next();
            }}
            onCancel={reset}
          />
        );
      }
    }

    if (step === 2) {
      vendorMessage = {
        body: 'Thank you for your payment.',
        acknowledge: next,
      };
    }

    if (step === 3) {
      if (!debt) {
        vendorMessage = {
          body: 'Well, that takes care of your debt! Thank you for using Marco Polo Bank.',
          acknowledge: reset,
        };
      } else {
        vendorMessage = {
          body: t('Now your debt is {amount} gold.', { amount: debt }),
          acknowledge: next,
        };
      }
    }

    if (step === 4) {
      vendorMessage = {
        body: 'The monthly interest rate is 10%. Please invest our loan wisely.',
        acknowledge: reset,
      };
    }
  }

  if (step === -1) {
    vendorMessage = {
      body: 'Thank you for choosing Marco Polo Bank.',
      acknowledge: back,
    };
  }

  return (
    <BuildingWrapper
      buildingId="9"
      vendorMessageBox={vendorMessage}
      menu={menu}
    >
      {children}
    </BuildingWrapper>
  );
}
