const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const ottoArmadaDialogue = deepFreeze({
  londonCommission: {
    matthewSummons:
      'Commander Otto! His Majesty King Henry VIII has summoned us to the London Royal Palace for a confidential naval commission.',
    ottoPledge:
      'Spain’s Invincible Armada dominates the seas while England’s fleet is still young. With this Royal Letter of Marque, we will forge a fleet strong enough to break their hegemony!',
    matthewReady:
      'I have provisioned our flagship at the London dock, Captain. Let us sail south to Seville and strike at the very heart of Spain’s shipyards!',
  },
  sevilleInfiltration: {
    matthewWhisper:
      'Captain, the Spanish guards at the Seville shipyard are asleep! Look—a brand-new Spanish Galleon is moored right at the slipway.',
    ottoCommand:
      'A fine prize for the English Crown! Cut the mooring lines and hoist our sails before the harbour fortress sounds the alarm!',
  },
  ceutaSkirmish: {
    ezequielWarning:
      'Otto Baynes of England! Did you truly think you could steal a royal galleon from Seville and slip past our Gibraltar squadron at Ceuta?',
    ottoReply:
      'Commander Ezequiel! Your galleon handles splendidly—allow us to demonstrate her broadside in battle!',
  },
  ceutaSkirmishRetry: {
    recovery:
      'We pulled back into Ceuta harbor for repairs. The Spanish Gibraltar squadron still holds the strait.',
    prompt:
      'Sortie from Ceuta and engage the Spanish Gibraltar squadron again?',
    accept: 'Run out the guns! We break through the strait today!',
    defer: 'Refit our fleet in Ceuta first, then return to the harbor.',
  },
  santoDomingoRaid: {
    matthewScout:
      'Captain! The Spanish New World treasure convoy is assembling off Santo Domingo, loaded with silver and artillery for the Armada!',
    ottoOrder:
      'If that bullion reaches Europe, England will face twice as many warships. Intercept the convoy and seize their flagship!',
  },
  santoDomingoRaidRetry: {
    recovery:
      'Our ships regrouped at Santo Domingo. The Spanish treasure convoy is still preparing to sail east.',
    prompt: 'Sail from Santo Domingo and attack the treasure convoy again?',
    accept: 'All hands on deck! Strike before they clear the Caribbean!',
    defer: 'Make repairs in Santo Domingo first, then return to the harbor.',
  },
  nantesShowdown: {
    ezequielChallenge:
      'At last we meet in full force off Nantes, Sir Otto! The Invincible Armada of Spain will decide mastery of the northern seas here and now!',
    ottoSpeech:
      'Steady, men of England! Today we shatter the myth of the Invincible Armada—fire at will!',
  },
  nantesShowdownRetry: {
    recovery:
      'Our fleet recovered at Nantes harbor. Commander Ezequiel’s Invincible Armada still awaits us in the Bay of Biscay.',
    prompt: 'Sortie from Nantes for the decisive battle against the Armada?',
    accept: 'Hoist the St. George cross! To victory!',
    defer: 'Prepare the fleet in Nantes first, then return to the harbor.',
  },
  londonTriumph: {
    ezequielSalute:
      'You fought with true chivalry, Admiral Otto Baynes. Even in defeat, I am honored to have crossed blades and broadsides with you.',
    matthewCheer:
      'All of London is cheering, Captain! With the Invincible Armada defeated, King Henry names you Lord High Admiral of the Royal Navy!',
  },
});

export default ottoArmadaDialogue;
