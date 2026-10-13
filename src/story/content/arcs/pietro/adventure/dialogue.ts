const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const pietroAdventureDialogue = deepFreeze({
  genoaDeparture: {
    camilloNews:
      'Pietro! Creditors have surrounded the Conti manor again, but a courier just arrived from Lisbon with an urgent letter from Duchess Christiana Franco!',
    pietroResolve:
      'My father’s old patrons in Portugal! If the Franco family is willing to back our expedition, I can pay off every coin of debt and uncover the truth of my father’s final voyage.',
    camilloPledge:
      'I have readied the caravel Sanuto at the Genoa dock, Pietro. Let me serve as your bookkeeper and navigator—we sail for Lisbon at once!',
  },
  lisbonPatronage: {
    christianaOffer:
      'Welcome to Lisbon, Pietro Conti. I have settled the most pressing claims against your house in Genoa, and I will fund your voyages of discovery.',
    marcoInstruction:
      'In return, Her Grace asks two things: chart the unknown wonders of the world, and quietly watch over Young Lord João on the Eastern seas.',
    pietroAccept:
      'You have my word, Your Grace. Camillo and I will sail past the Strait of Gibraltar to Alexandria and follow both my father’s maps and João’s trail!',
  },
  alexandriaRelic: {
    camilloClue:
      'Look at this tablet in the Alexandria tavern, Pietro! Your father’s journal mentioned the Staff of the Saint—and merchants say it surfaced in Basra on the Persian Gulf.',
    pietroPlan:
      'And rumor has it that João Franco is bound for Massawa in the Red Sea. Let us chart a course around Africa to Basra and claim that relic first!',
  },
  basraStaff: {
    camilloWarning:
      'Careful, Pietro! A gang of treasure hunters has cornered the Basra merchant holding the Staff of the Saint!',
    pietroChallenge:
      'That relic belongs to true explorers, not brigands. Step aside or face my blade!',
  },
  basraStaffRetry: {
    recovery:
      'The treasure hunter boss is still in the Basra market with the Staff of the Saint. Check your equipment before challenging him again.',
    prompt:
      'Challenge the treasure hunter boss for the Staff of the Saint now?',
    accept: 'En garde! This time the Staff of the Saint comes with us!',
    defer: 'Prepare in Basra first, then return to the market.',
  },
  massawaHandoff: {
    pietroGreeting:
      'So we finally meet in Massawa, João Franco! Wait—this Staff of the Saint we won in Basra is the very key your expedition needs!',
    joaoGratitude:
      'Pietro Conti! You saved our mission in the Red Sea. Take these charts of the Western Ocean—sailors speak of the Golden Land of El Dorado beyond the Mouth of the Amazon!',
    camilloExcitement:
      'El Dorado, Pietro! That was the ultimate dream in your father’s final logbook. We must sail west to South America and sight the Mouth of the Amazon!',
  },
  cayenneFleet: {
    camilloAlert:
      'Pietro, we have sighted the Mouth of the Amazon, but a heavily armed sanctuary fleet is blockading the approach from Cayenne!',
    pietroOrder:
      'No blockade will stand between a Conti and El Dorado! Clear the decks for action!',
  },
  cayenneFleetRetry: {
    recovery:
      'Our fleet returned to Cayenne for repairs. The sanctuary fleet still guards the approach to El Dorado.',
    prompt: 'Sally forth from Cayenne and engage the guardian fleet again?',
    accept: 'Raise anchor! Today we break through to El Dorado!',
    defer: 'Refit our ships in Cayenne first, then return to the harbor.',
  },
  lisbonTriumph: {
    christianaPraise:
      'Pietro, word of your discoveries from Basra to El Dorado fills every court in Europe! You have honored your father’s name and protected João from afar.',
    leonCommendation:
      'The House of Franco salutes you as the greatest adventurer of the age, Pietro Conti. Every debt is cleared, and the map of the world bears your name!',
    camilloToast:
      'From debtor’s heir in Genoa to prince of explorers in Lisbon—what a voyage, Pietro! Where shall we chart next?',
  },
});

export default pietroAdventureDialogue;
