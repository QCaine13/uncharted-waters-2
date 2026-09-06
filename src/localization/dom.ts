export const isInteractiveTextTarget = (
  target: EventTarget | null,
): boolean => {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(
    element?.closest('input, select, textarea, [contenteditable="true"]'),
  );
};

export const isSelectTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && Boolean(target.closest('select'));
