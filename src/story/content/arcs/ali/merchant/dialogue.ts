const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const aliMerchantDialogue = deepFreeze({
  istanbulWindfall: {
    salimGift:
      'Ali, my friend, I cannot bear to watch a born merchant waste away in Istanbul with nothing but a thousand gold pieces of debt! Take my old dhow, the Hugli, and two thousand gold in seed capital.',
    aliGratitude:
      'Salim, your generosity will be repaid tenfold! With a ship under our feet and the eastern markets before us, we will turn this humble dhow into the greatest trading fleet in the Mediterranean.',
    salimHint:
      'And perhaps along the way we will hear word of your long-lost sister Sasha! Let us sail for the Alexandria Market first—the spice caravans from the Red Sea have just arrived.',
  },
  alexandriaSpice: {
    salimProfit:
      'What a bargain, Ali! Selling Istanbul carpets and buying Alexandria spices at the turn of the tide netted us three thousand five hundred gold in clear profit.',
    pietroClue:
      'Ah, Captain Ali! While I was inquiring after rare maps in the bazaar, a factor mentioned a young woman named Sasha boarding a westward merchantman bound for Lisbon Pub.',
    aliCourse:
      'Sasha was here in Alexandria? Thank you, Signor Pietro! Salim, trim the sails for Lisbon—we can trade across the Mediterranean and follow my sister’s trail at the same time.',
  },
  lisbonSearch: {
    luciaMemory:
      'You are looking for Sasha? She sang here at the Lisbon tavern not a month ago! Every sailor in port was enchanted by her kindness before she joined an eastern spice convoy.',
    joaoCharter:
      'That convoy was chartered to sail around Africa toward Aden and the Persian Gulf port of Basra, Captain Ali. Take this three thousand gold commission for carrying Lisbon trade goods east.',
    aliResolve:
      'Aden and Basra! We will clear our debts, build a fortune in Indian Ocean trade, and bring Sasha safely home. Weigh anchor for Aden Harbor!',
  },
  adenCorsairs: {
    salimAlarm:
      'Ali, look out! Red Sea raiders have cornered the eastern spice convoy outside Aden Harbor, and they are coming for our cargo holds next!',
    aliDefiance:
      'No pirate takes a single dinar from Ali Vezas—or lays a hand on the convoy carrying my sister! Man the guns and defend our merchantmen!',
  },
  adenCorsairsRetry: {
    recovery:
      'Our fleet pulled back into Aden Harbor for repairs. The Red Sea raiders still block the entrance to the Persian Gulf.',
    prompt: 'Sortie from Aden and drive off the Red Sea raiders?',
    accept:
      'At once, Salim! Profit and family both wait in Basra—this time we scatter them!',
    defer: 'Refit our ships in Aden first, then return to the harbor.',
  },
  basraReunion: {
    sashaCry:
      'Ali?! Can it truly be you, brother? When word reached the Basra tavern that a merchant captain from Istanbul had routed the Red Sea raiders, my heart hoped against hope!',
    aliEmbrace:
      'Sasha! Through every market from Alexandria to Lisbon and Aden, I never stopped searching for you. Our days of poverty and separation are over at last.',
    salimSummons:
      'And look at this courier dispatch from the Sublime Porte—the Sultan himself has summoned Ali Vezas to the Royal Palace in Istanbul to honor the greatest merchant of the realm!',
  },
  istanbulGrandVizier: {
    sashaPride:
      'From a penniless youth sleeping by the docks to the Sultan’s Grand Commercial Advisor—and with twenty thousand gold bestowed by the court! Father and Mother would be so proud, Ali.',
    salimToast:
      'Every caravan road and sea lane from Venice to Basra now carries the banner of the Vezas counting house. What more could a merchant prince ask for?',
    aliFinale:
      'Gold is only a measure of trust, Salim—and the truest treasure I found on the seven seas is standing right beside me. Come, Sasha, Salim: our next trade voyage awaits!',
  },
});

export default aliMerchantDialogue;
