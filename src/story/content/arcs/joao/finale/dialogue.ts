const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const finaleDialogue = deepFreeze({
  japanRequest: {
    request:
      'My mission now leads to Japan. Will you carry me to Nagasaki and let me continue my work there?',
    prompt: 'Accept Enrico’s mission to Japan?',
    accept: 'Thank you, João. We will part at the Nagasaki harbor.',
    defer:
      'There is no haste. Ask me again at a pub outside the Far East when you are ready.',
  },
  enricoFarewell: {
    farewell:
      'This is my road now. I will continue from Sakai; your fleet and Rocco must follow the horizon without me.',
  },
  letterNotice: {
    notice: 'A letter from Enrico is waiting at the Lisbon Adventurers’ Guild.',
  },
  enricoLetter: {
    letter:
      'My letter asks you to meet me at the Sakai guild. I have found a lead that reaches far beyond Japan.',
  },
  sakaiLead: {
    lead: 'I will remain in Sakai. Sail to South America: news from a great river there may reveal the force behind Lucia’s disappearance.',
  },
  southAmericaArrival: {
    lead: 'We have reached South America. Ask at this port’s pub about Lucia.',
  },
  rudolphStart: {
    threat:
      'Lucia belongs to our operation now. If you want her freedom, prove yourself against me.',
  },
  luciaRescued: {
    katarina:
      'Enough, Rudolph. Whatever the result of your duel, Lucia is not your prisoner. She leaves with us.',
    lucia:
      'Thank you. Martinez is moving ships under false orders; Katarina found where they gather.',
  },
  martinezExposed: {
    katarina:
      'These orders expose Martinez’s plot. A Spanish officer will meet us at this harbor on the next morning or any later morning.',
    report:
      'Martinez’s written order reads: “Concentrate the fleet at the great river and silence every witness.”',
    agreement:
      'We agree. We will return for the Spanish officer from 09:00 tomorrow morning, or during the same window on a later day.',
  },
  rendezvousWait: {
    guidance:
      'The alliance meeting opens each day from 09:00–14:59. Check in at the lodge; it wakes us at 08:00, then make ordinary facility visits until the window opens. If we miss it, return on a later day.',
  },
  spanishAlliance: {
    pledge:
      'Spain will stand with you against Martinez. Sail east of Cayenne to the Amazon mouth near 0.5°S, 50.0°W; our fleet will meet you there.',
  },
  amazonStart: {
    katarina:
      'Martinez’s fleet is ahead. This battle ends his hold over Lucia.',
    rocco: 'All hands ready, Captain. The Amazon mouth is ours to defend.',
  },
  amazonRetry: {
    recovery:
      'The fleet recovered at Cayenne. We can challenge Martinez’s force immediately from this harbor.',
    prompt: 'Challenge the Amazon fleet again now?',
    accept: 'Then we sail at once. The fleet is ready for the rematch.',
    defer:
      'Prepare here and return to the Cayenne harbor when you want the immediate rematch.',
  },
  amazonVictory: {
    katarina:
      'Martinez’s command is broken. Lucia is safe, and this conflict is finished.',
    rocco:
      'We have seen this voyage through, Captain. Your family waits at the Lisbon residence.',
  },
  homecoming: {
    mother:
      'João, you came home by your own course. I feared the sea would take you from us.',
    father:
      'You restored our name with deeds no title could grant. Welcome home, my son.',
    rocco:
      'The voyage is complete, Captain. Whatever horizon comes next, this route is yours.',
  },
  homeRevisited: {
    welcome:
      'Welcome home, João. Your room is always ready; explore freely whenever the horizon calls.',
  },
});

export default finaleDialogue;
