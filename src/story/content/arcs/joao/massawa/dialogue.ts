const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const massawaDialogue = deepFreeze({
  fiveDayVoyage: {
    lead: 'Five uninterrupted days at sea have carried us far. Ask Ali about our course at the next facility we enter.',
  },
  aliMassawaLead: {
    lead: 'Massawa needs help. Sail there and visit its religious house for news of the Christian kingdom.',
  },
  religiousLead: {
    lead: 'Taphiel speaks for the resistance. Find him at the southwest residence in Massawa.',
  },
  staffRequest: {
    request:
      'Our people need the Staff of the Saint. Find Pietro at the Lisbon residence and ask him to recover it.',
  },
  pietroCommissioned: {
    promise:
      'I will find the Staff and carry it to Massawa myself. Meet me there after your return.',
  },
  waitingForPietro: {
    wait: 'Pietro has not reached Massawa. Let time pass, then return to this residence in a later month.',
  },
  waitingAdvice: {
    rule: 'Pietro is still away. Rest at the lodge and return to this residence on day 11 of a later month or after.',
  },
  invasionAuthorized: {
    alarm:
      'A later month has come, but Ottoman warships threaten Massawa. Join our resistance from the harbor.',
  },
  firstSortieReady: {
    arrival:
      'I came to watch you, João, not forgive you. Yet I will help you defend Massawa from the Ottoman fleet.',
    prompt:
      'Sail east and slightly south of Massawa, near 15.2°N, 42.7°E, to meet the vanguard?',
    accept:
      'Then leave by the regular harbor Sail route when your fleet is ready.',
    defer:
      'Prepare your fleet here. Return to this harbor when you are ready for the first sortie.',
  },
  ottomanOneStart: {
    contact:
      'The Ottoman vanguard is ahead. Hold this water and protect Massawa.',
  },
  ottomanOneRetry: {
    recovery:
      'Defeat returned us to Massawa. We can challenge the vanguard immediately from this harbor.',
    prompt: 'Challenge the Ottoman vanguard again now?',
    accept: 'The fleet is recovered. We meet the vanguard again now.',
    defer:
      'Prepare here and return to this harbor when you want the immediate rematch.',
  },
  secondSortieReady: {
    report:
      'The vanguard is clear. A larger Ottoman fleet waits east and slightly south of Massawa.',
    prompt: 'Begin the second sortie after preparing here?',
    accept:
      'Use the regular Sail route and return to the same waters when the fleet is ready.',
    defer:
      'Keep preparing at this harbor. The second sortie remains available here.',
  },
  ottomanTwoStart: {
    contact:
      'The Ottoman main fleet is in sight. This second defense will decide Massawa’s fate.',
  },
  ottomanTwoRetry: {
    recovery:
      'Defeat returned us to Massawa. We can challenge the main fleet immediately from this harbor.',
    prompt: 'Challenge the Ottoman main fleet again now?',
    accept: 'The fleet is recovered. We meet the main fleet again now.',
    defer:
      'Prepare here and return to this harbor when you want the immediate rematch.',
  },
  defenseReported: {
    thanks:
      'Your report confirms both Ottoman forces withdrew. Pietro is waiting with the Staff at the Massawa pub.',
  },
  staffReceived: {
    delivery:
      'I found the Staff of the Saint and kept my promise. Take it to Taphiel at the southwest residence.',
  },
  staffReturned: {
    reward:
      'The Staff is home. Accept this Royal Crown and our thanks for defending Massawa.',
  },
  chapterComplete: {
    pietro:
      'I carried the Staff here as promised; Enrico can confirm when it reached Massawa.',
    enrico:
      'I recorded its arrival before our next voyage. Pietro kept his word, João.',
    katarina:
      'I judged you by your family name. You defended Massawa and returned its Staff; let us part as allies.',
  },
});

export default massawaDialogue;
