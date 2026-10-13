const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const katarinaVengeanceDialogue = deepFreeze({
  sevilleMutiny: {
    emilioNews:
      'Commander Katarina! Word just reached Seville: your brother Michael and your fiancé Hernan perished in an ambush off the New World.',
    katarinaVow:
      'The Admiralty refuses to investigate and whispers that the Portuguese Franco family was behind the attack. If Spain will not hunt the culprits, I will.',
    emilioPledge:
      'Then commandeer the caravel at the dock, Captain! Rename her the Rebellion—I will sail as your first mate until your vengeance is won.',
  },
  spanishPursuit: {
    challenge:
      'Halt, Katarina Erantzo! By order of the Spanish Armada, return the stolen warship to Seville or be sunk where you stand!',
    katarinaReply:
      'Tell the High Command that the Rebellion answers only to the memory of Michael and Hernan. Man the guns, Emilio!',
  },
  spanishPursuitRetry: {
    recovery:
      'We slipped back into Seville harbor for emergency repairs. The patrol squadron still blockades our path out to sea.',
    prompt: 'Sally forth and break through the Spanish patrol squadron now?',
    accept:
      'We weigh anchor at once. No patrol will keep us from the open sea!',
    defer: 'Refit the ship in Seville first, then return to the harbor.',
  },
  ceutaClash: {
    emilioScout:
      'Captain, a Portuguese expedition flying the Franco crest just resupplied at Ceuta. That must be Young Lord João’s fleet!',
    katarinaOrder:
      'At last! Run out the cannons—we will force João Franco to answer for my brother’s blood!',
  },
  ceutaClashRetry: {
    recovery:
      'Our flagship limped back to Ceuta after the clash. The Franco vanguard is still within reach.',
    prompt: 'Sail out from Ceuta and engage the Franco fleet again?',
    accept:
      'Hoist the black flag! This time they will not escape our broadside.',
    defer: 'Make repairs in Ceuta first, then return to the harbor when ready.',
  },
  massawaTruth: {
    joaoPlea:
      'Hold your blade, Katarina! Neither my father nor I ever attacked Michael’s squadron—we came to Massawa chasing the same shadow.',
    roccoProof:
      'Look at these captured dispatches, Red Hair. Marquis Martinez of Spain forged the orders that lured your brother into his own private armada!',
    katarinaRealization:
      'Martinez... He used me to hunt the Francos while concealing his Neo-Atlantis plot in South America. Then my true quarry lies at Cayenne and the Amazon!',
  },
  cayenneRescue: {
    emilioCaptured:
      'Captain, look out! Martinez’s colonial commandant set a trap at the Cayenne lodge to silence us before we reach the Amazon!',
    katarinaChallenge:
      'Release my first mate at once, Commandant, or taste the steel of a former Spanish Navy officer!',
  },
  cayenneRescueRetry: {
    recovery:
      'The commandant still holds the Cayenne lodge. Check your blade and armor before challenging him again.',
    prompt: 'Challenge the Cayenne commandant to another duel now?',
    accept: 'Draw your sword, Commandant—this duel ends here!',
    defer: 'Prepare in Cayenne first, then return to the lodge.',
  },
  amazonReckoning: {
    martinezTaunt:
      'So the traitor Erantzo tracked me all the way to the Mouth of the Amazon! My flagship will send you to join your brother and Hernan!',
    katarinaCharge:
      'For Michael, for Hernan, and for every sailor you betrayed—fire all batteries and board his flagship!',
  },
  amazonReckoningRetry: {
    recovery:
      'Our fleet regrouped at Cayenne. Martinez’s flagship still commands the Mouth of the Amazon.',
    prompt: 'Sortie from Cayenne and confront Marquis Martinez again?',
    accept: 'All hands to battle stations! Today Martinez falls!',
    defer: 'Repair and resupply in Cayenne first, then return to the harbor.',
  },
  sevilleHomecoming: {
    ezequielPardon:
      'Katarina Erantzo, with Marquis Martinez’s treason exposed at the Amazon, the Crown restores your honor and grants a full royal pardon.',
    emilioSalute:
      'Michael and Hernan can rest in peace, Captain. Whether under Spain’s banner or the free wind, the seven seas are yours to command!',
  },
});

export default katarinaVengeanceDialogue;
