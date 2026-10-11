import React, { ReactNode } from 'react';

import Assets from '../../assets';
import { classNames } from '../interfaceUtils';

const cornerClasses = [
  'top-0 left-0',
  'top-0 right-0 rotate-90',
  'bottom-0 right-0 rotate-180',
  'bottom-0 left-0 rotate-[270deg]',
];

export interface MessageBoxProps {
  children: ReactNode;
  className?: string;
}

export default function MessageBox({
  children,
  className = '',
}: MessageBoxProps) {
  return (
    <div
      className={classNames(
        'relative p-4 text-[#22140a] rounded-[2px]',
        className,
      )}
      style={{
        background:
          'linear-gradient(180deg, #f5ecd9 0%, #eddcc0 50%, #e3ceb0 100%)',
        boxShadow: `
          inset 0 0 0 3px #2c1a0e,
          inset 0 0 0 5px #d4a742,
          inset 0 0 0 7px #2c1a0e,
          inset 0 0 0 8px #d4a742,
          0 4px 12px rgba(44, 26, 14, 0.35)
        `,
      }}
    >
      {cornerClasses.map((cornerClass) => (
        <img
          className={classNames(
            'w-4 h-4 absolute bg-no-repeat pointer-events-none opacity-80',
            cornerClass,
          )}
          src={Assets.images('dialogCorner').toDataURL()}
          alt=""
          key={cornerClass}
        />
      ))}
      {children}
    </div>
  );
}
