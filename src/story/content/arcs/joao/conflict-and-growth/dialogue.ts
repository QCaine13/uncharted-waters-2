const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const conflictAndGrowthDialogue = deepFreeze({
  domingoMissing: {
    lead: 'Domingo was here a moment ago. The innkeeper may have seen where he went.',
  },
  lodgeSearch: {
    lead: 'Your young companion never came in. I heard a quarrel by the shipyard.',
  },
  kahnShipyard: {
    threat: 'Domingo, come with me. Stand aside, boy!',
    defense: 'He is sailing with us. I will not let you take him by force.',
  },
  identity: {
    reveal:
      'Enough, Kahn. João deserves the truth: my name is Alberto. I am a prince.',
    returnHome:
      'You stood beside me when you knew nothing of my title. Let us return to Lisbon and speak with your father.',
  },
  kahnHouse: {
    challenge: 'We have unfinished business, João. Draw your sword.',
    rematch: 'Neither of us has yielded. Take your stance again.',
  },
  fatherCleared: {
    report:
      'Prince Alberto has spoken for your family. The accusation against Duke Franco is withdrawn.',
  },
  domingoFarewell: {
    gift: 'Keep this Flamberge close. There is still a wide world beyond this harbor.',
    giftOwned:
      'You already carry a Flamberge. Keep it close on the voyage ahead.',
    departure:
      "My duties call me home. I will arrange the captain's handover so your fleet can sail on.",
  },
  katarinaWarning: {
    warning:
      'A captain named Katarina is asking for João Franco. She says she has a family debt to settle.',
    prompt:
      'Shall we sail on and face whoever follows? We can prepare our ship and supplies here first.',
    accept: 'Then we sail when you are ready.',
    defer:
      'Then we will prepare in Seville. Return to this pub when you are ready.',
  },
  pursuitFirstSea: {
    spotted:
      'That sail is following our wake. Put into a harbor; we may learn what she wants.',
  },
  pursuitFirstPort: {
    watched:
      'She is still watching the harbor. Prepare carefully; another day at sea will bring her alongside.',
  },
  katarinaBattle: {
    accusation:
      'João Franco! Your family owes mine an answer. You will not slip away today.',
    response:
      'I do not know what happened to your family. But I must protect my crew.',
  },
  katarinaRetry: {
    recovery:
      'The fleet is safe in Lisbon. We can face Katarina again just outside the harbor.',
    prompt: 'Sail out and face Katarina again?',
    accept: 'Hold fast. We meet her now.',
    defer:
      'Then we will prepare here. Find me at the harbor when you are ready.',
  },
  aliRequest: {
    request:
      'Lucia has been taken. I also seek my sister, Sasha. Will you ask after her at the Lisbon pub?',
  },
  lisbonInquiry: {
    lead: 'I heard of a girl named Sasha in Basra. Ask at the pub there; ships carry news as well as cargo.',
  },
  sashaFound: {
    answer:
      'Ali is my brother! Please tell him I am safe here. I have been hoping for news of him.',
    promise:
      'He is waiting in Istanbul. I will take your message to the inn there.',
  },
  chapterComplete: {
    report:
      'Sasha is safe in Basra... Thank you, João. At last I know where to find her.',
    close:
      'We have crossed swords and crossed seas. Now we can set our next course with our friends in mind.',
  },
});

export default conflictAndGrowthDialogue;
