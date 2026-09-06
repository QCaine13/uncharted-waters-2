import React, { ReactNode, useState } from 'react';

import {
  classNames,
  getCoins,
  getDate,
  getHoursMinutes,
  getIngots,
  hudClass,
} from './interfaceUtils';
import HudReadout from './HudReadout';
import updateInterface from '../state/updateInterface';
import state from '../state/state';
import Sound from './sound/Sound';
import Fleet from './Fleet';
import Popover from './common/Popover';
import Items from './Items';
import Mates from './Mates';
import System from './System';
import Discoveries from './Discoveries';
import FameReadout from './FameReadout';
import QuestJournal from './QuestJournal';
import { t } from '../localization';
import useLocale from '../localization/useLocale';

interface Props {
  portId: string | null;
  buildingId: string | null;
  timePassed: number;
  gold: number;
  children?: ReactNode;
}

export default function Left({
  portId,
  buildingId,
  timePassed,
  gold,
  children = null,
}: Props) {
  const locale = useLocale();
  const [dayAtSea, setDayAtSea] = useState(state.dayAtSea);

  updateInterface.dayAtSea = (d) => {
    setDayAtSea(d);
  };

  const inPort = portId !== null;

  return (
    <div
      className={classNames(hudClass, 'flex flex-col justify-between')}
      data-test="left"
    >
      {/*
        The readouts are the only part of the column allowed to shrink. A
        starving fleet shows two provision warnings at once, each wrapping to
        two or three lines in a 180px column, and in that state the readouts
        no longer fit. Scrolling them keeps the menu below anchored, and keeps
        the warnings themselves in view — it is the rows underneath that go.
       */}
      <div className="p-5 min-h-0 overflow-y-auto" data-test="hudReadouts">
        <div
          className={classNames(
            'font-bold whitespace-nowrap',
            locale === 'zh-CN' ? 'text-xl tracking-tighter' : 'text-2xl',
          )}
          data-test="calendarDate"
        >
          {getDate(timePassed)}
        </div>
        <div className="mb-8" data-test="dayAtSea">
          {inPort
            ? getHoursMinutes(timePassed)
            : t('Day {day}', { day: dayAtSea })}
        </div>
        <div className="mb-4">
          <HudReadout label="Ingots" value={getIngots(gold)} />
          <HudReadout label="Coins" value={getCoins(gold)} />
        </div>
        <FameReadout />
        {Boolean(children) && <div>{children}</div>}
      </div>
      {inPort && (
        <div className="select-none shrink-0">
          <Popover label="Mates">
            <Mates />
          </Popover>
          <Popover label="Fleet">
            <Fleet />
          </Popover>
          <Popover label="Items">
            <Items />
          </Popover>
        </div>
      )}
      {/*
        Not gated on inPort like the group above — a discovery log is
        something the player can check underway, and the discovery e2e
        specs load straight into a sea save and expect it reachable there.
      */}
      <div className="select-none shrink-0">
        <Popover label="Journal">
          <QuestJournal />
        </Popover>
        <Popover label="Discoveries">
          <Discoveries />
        </Popover>
      </div>
      <div className="select-none shrink-0">
        <Popover label="System">
          <System />
        </Popover>
      </div>
      <div className="p-5 text-right shrink-0">
        <Sound portId={portId} buildingId={buildingId} />
      </div>
    </div>
  );
}
