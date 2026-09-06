import { useEffect } from 'react';
import { isSelectTarget } from '../../../localization/dom';

export default function useCancel(onCancel?: () => void) {
  useEffect(() => {
    if (!onCancel) {
      return undefined;
    }

    const onKeydown = (e: KeyboardEvent) => {
      if (isSelectTarget(e.target)) return;
      const pressedKey = e.key.toLowerCase();

      if (pressedKey === 'escape') {
        e.preventDefault();
        onCancel();
      }
    };

    const onContextMenu = () => {
      onCancel();
    };

    window.addEventListener('keydown', onKeydown);
    window.addEventListener('contextmenu', onContextMenu);

    return () => {
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  });
}
