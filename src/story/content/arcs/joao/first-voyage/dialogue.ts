const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const firstVoyageDialogue = deepFreeze({
  commission: {
    introduction: 'The Guild needs a fresh chart of the Strait of Gibraltar.',
    prompt: 'Will you take the 500g commission?',
    accept:
      'Sail east along the south Iberian coast, toward Seville and Ceuta.',
    decline: 'Very well. The commission will remain open.',
  },
  domingoMeeting: {
    introduction: 'Three days at sea, and you still hold a steady course.',
    question: 'Who are you, and why have you followed us?',
    answer: 'Call me Domingo. I know these waters and can earn my berth.',
    prompt: 'Will you take me aboard?',
    accept: 'Then I sail with you, Captain.',
    decline: 'Fair enough. Ask at the Lisbon Guild if you change your mind.',
  },
  domingoReconsideration: {
    introduction: 'We meet again. I am still ready to sail.',
    prompt: 'Will you take Domingo aboard?',
    accept: 'You have my word, Captain.',
    decline: 'I will wait at the Guild.',
  },
  chapterComplete: {
    chart: 'Your Gibraltar chart is clear and complete.',
    reward: 'Commission fulfilled. Here is the promised 500g.',
  },
});

export default firstVoyageDialogue;
