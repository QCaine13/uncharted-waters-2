let generation = 0;
const listeners = new Set<() => void>();

export const getLoadGeneration = (): number => generation;

export const subscribeGameLoad = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Live UI sessions belong to the state they were opened against. A load
// replaces that state, so consumers must discard their transient cursors.
export const notifyGameLoaded = (): void => {
  generation += 1;
  listeners.forEach((listener) => listener());
};
