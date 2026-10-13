const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const ernstWorldmapDialogue = deepFreeze({
  amsterdamCommission: {
    mercatorCommission:
      'Ernst, Europe has charts of familiar coasts, yet most of the oceans remain guesswork and rumor. Take my finest astrolabe, two thousand five hundred gold pieces, and the caravel Golden Hind.',
    hansExcitement:
      'I have the sextant and blank parchment packed, Professor Ernst! Still, if we are going to question pilots in foreign ports, we should stop at Lisbon Harbor first to hire an interpreter.',
    ernstVow:
      'Thank you, Master Mercator. I swear we will measure every strait and cape with our own eyes and bring back a complete atlas of the world. Make ready to sail for Lisbon, Hans!',
  },
  lisbonInterpreter: {
    lauraGreeting:
      'Pardon me, Captain—did I hear your mate say you are surveying the entire globe? I speak six languages and grew up among seafarers, though I have never known where my true homeland lies.',
    hansApproval:
      'Six languages? That settles it, Professor! With Laura translating port records and keeping our logs, no harbor from Africa to the Indies will be closed to us.',
    ernstWelcome:
      'Welcome aboard the Golden Hind, Laura. Our first major geographic milestone is to round the southern tip of Africa—discover the Cape of Good Hope, then chart the Red Sea at Massawa Guild.',
  },
  capeSurvey: {
    hansReport:
      'The bearings around the Cape of Good Hope match our celestial sightings to the minute! The cartographers at the Massawa Guild paid three thousand gold for a copy of our southern sheets.',
    ernstNextCourse:
      'Now the Indian Ocean opens before us. Let us sail east, chart the Strait of Malacca, and put into Malacca Harbor to link the eastern trade winds to Mercator’s projection.',
  },
  malaccaStraits: {
    hansAlert:
      'Professor, look ahead! Eastern Sea corsairs are blockading the narrows outside Malacca Harbor and demanding our survey charts as tribute!',
    ernstResolve:
      'These charts belong to all who sail the seas, not to extortionists. Clear the deck for action—we will force our way through the strait!',
  },
  malaccaStraitsRetry: {
    recovery:
      'Our expedition regrouped at Malacca Harbor. The Eastern Sea corsairs are still blockading the strait.',
    prompt: 'Sail from Malacca and break through the corsair blockade?',
    accept:
      'Check our rigging and cannons—this time we clear the Strait of Malacca for good!',
    defer:
      'Repair the Golden Hind in Malacca first, then return to the harbor.',
  },
  nagasakiHomeland: {
    lauraRecognition:
      'Those lullabies the townsfolk are singing... and the crest on that merchant house! Ernst, Hans—this port of Nagasaki is where I was born before the storms carried my cradle ship away!',
    ernstKindness:
      'I am glad our survey brought you home at last, Laura. If you wish to stay in Nagasaki with your kin, no one aboard would fault you.',
    lauraPromise:
      'Stay behind before our world map is finished? Never! Come—once we also survey the Mouth of the Amazon in the New World, let us return together to Master Mercator in Amsterdam!',
  },
  amsterdamAtlas: {
    mercatorPraise:
      'Magnificent, Ernst! From the Cape of Good Hope and the Strait of Malacca to Nagasaki and the Mouth of the Amazon, every coastline on your charts fits together in a single unbroken projection!',
    lauraReflection:
      'Look how small the distances seem once they are drawn on paper—and yet every league holds a memory of the winds we weathered together.',
    ernstHorizon:
      'Our atlas is complete, Master Mercator, yet a map is only an invitation. As long as there is open water beyond the horizon, Laura, Hans, and I will keep sailing.',
  },
});

export default ernstWorldmapDialogue;
