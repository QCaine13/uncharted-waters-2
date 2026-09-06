import joaoLisbon from './dialogue/joaoLisbon';

// Add each future story arc as its own dictionary, then merge it here. This
// keeps the stable t() API independent from story growth.
export const dialogue: Record<string, string> = {
  ...joaoLisbon,
};

export default dialogue;
