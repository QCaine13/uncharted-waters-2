import {
  characterId,
  storyEventId,
  type StoryStep,
} from '../../../../core/types';
import type { LegacyLisbonKey } from '../../../../legacy/lisbonCompletionKeys';

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const lisbonOpeningDialogue: Record<LegacyLisbonKey, StoryStep[]> = {
  houseBeforeQuest: [
    {
      type: 'dialogue',
      body: 'Father, did you send for me?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Ah, $firstName, I’ve been wanting to ask you a few questions.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'First, has your fencing improved?',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Yes, compared to before. But I think I’d be lucky to get just one point out of five if I were fighting you, Father.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'And have you studied your sailing lessons?',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Well, I finished my studies at school. But I can’t think of anything more useless than an education without practical experience. ',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'I see. Well then, have you mastered geography?',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Well, since I’ve never been allowed to leave Lisbon, I only know what I’ve learned in books.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: '$firstName, don’t knock textbooks. The advice of others can prove to be invaluable.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Yes sir.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Remember that, $firstName. And finally, how’s that lute coming along?',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'It’s just a hobby, Father. I’m not really good enough to play for audiences.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Really? Your mother has mentioned that you have a fairly good reputation with her friends.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'You must be kidding.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Ha, ha, ha. I’ll have to have you play for me sometime.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Anyway $firstName, to get down to business...',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Yes sir?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'I have something very important to tell you today.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'What is it, Father?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'As you already know, when I was your age, I was already out on the open seas, fighting pirates and scoundrels.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'I have heard the tales. (Here he goes again!)',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Up until now, I have forbidden you to leave this harbor, due to your youth and inexperience.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'However, the $lastName men cannot live on land forever.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'You already have enough knowledge. What you need now is experience.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'I want you to search for adventure, to live a life on the edge, like I did.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Yes sir!',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Along with that I have an important task for you: Go and find the secret of Atlantis.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'The secret of Atlantis? What do you mean?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Well, that’s something you’ll have to discover on your own, son!',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'It’s a difficult task, and there may be hardships along the way, but it’s urgent that you find it.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Furthermore, I’ve ordered the townspeople to treat you like a commoner from now on, so prepare yourself for that as well.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Your ship is being built even now. You’ll be leaving soon, so you’d better get ready at once. Good luck son, make me proud!',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Rocco! Rocco! Where are you?!',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Ahoy, sir, I’m right here.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'I’m leaving you in charge of his education. Teach him how to be a true sailor.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Righto Cap’n, I mean, Duke, sir.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Don’t go easy on him because he’s my son. Forge him into a man, Rocco.',
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: 'Come along now, swabbie, let’s get to the shipyard.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Righto, Rocco, but first I’ve got to say good-bye to Lucia and Carlotta.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'addCompanion', characterId: characterId('rocco') },
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.house-introduction'),
        },
        { type: 'exitBuilding' },
      ],
    },
  ],
  houseAfterQuest: [
    {
      type: 'dialogue',
      body: 'I’m awfully sorry, but the Duke’s orders were quite specific. You are not to enter the house.',
      position: 1,
      speaker: characterId('butler-marco'),
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  houseAfterQuestAndPub: [
    {
      type: 'dialogue',
      body: 'Oh $firstName, I just can’t understand why your father must forbid you from coming in the house.',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: 'Please don’t worry, Mother. I promise that I’ll find the secret of Atlantis, and then I’ll be back.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Aye, me lady, all members of the $lastName family have got to go to sea at one time or another.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Besides, me thinks there’s trouble brewing between the Captain, I mean the Duke, and some other noble.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'I agree. He’s had several arguments with that noble, Martinez.',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: 'That’s the problem. If it weren’t for Martinez, the Duke could search for the secret of Atlantis himself, and $firstName could stay here.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'And that’s why he wants another Captain to take his place.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Oh, dear Rocco, you’re a lot brighter than you look. It’s like you’re reading the Duke’s mind!',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: 'That’s because I’ve known the Duke since he was kneehigh to a grasshopper!',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'And whether foul or fair cause, I’m all for sending the boy out to learn the ways of the world.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'There’s nothing better than a hardy stint at sea to toughen a lad up.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'If that’s the case, then I trust you’ll look out for $firstName, my only son.',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: '$firstName, I heard from Lucia that there’s not too much money for the voyage.',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: 'This was all so sudden, I couldn’t get everything ready, but please take this.',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    { type: 'effect', effects: [{ type: 'receiveItem', itemId: '53' }] },
    {
      type: 'dialogue',
      body: 'This is the aquamarine tiara your father gave to me.',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: 'Sell this for however much you can. But don’t tell your father.',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: 'Now $firstName, my only son, please be very careful! May fair weather be with you on your voyage.',
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'effect',
      effects: [
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.house-mother-farewell'),
        },
        { type: 'exitBuilding' },
      ],
    },
  ],
  houseAfterQuestAndPub2: [
    {
      type: 'dialogue',
      body: 'I’m awfully sorry, but the Duke’s orders were quite specific. You are not to enter the house.',
      position: 1,
      speaker: characterId('butler-marco'),
    },
    {
      type: 'dialogue',
      body: 'I know that. I just thought that I’d say good-bye before I got started on my trip.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Well then, Master $firstName, please be careful. The sea’s a fickle lady. She can change unexpectedly. ',
      position: 1,
      speaker: characterId('butler-marco'),
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  pubBeforeQuest: [
    {
      type: 'dialogue',
      body: 'Well isn’t this a rare treat, Master $firstName.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'Hey $firstName, how about playing a tune for me on that lute of yours? I feel like singing!',
      position: 1,
      speaker: characterId('lucia'),
    },
    {
      type: 'dialogue',
      body: 'Lucia! You should be more polite to the son of a noble.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'Oh, don’t worry, Lucia and I have been friends forever!',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'By the way, $firstName, Rocco came by here looking for you. He said the Duke was calling for you.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'My father? Well then, I apologize, but I’d better be going.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Oh, $firstName! You’re leaving already?!',
      position: 1,
      speaker: characterId('lucia'),
    },
    {
      type: 'effect',
      effects: [
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.pub-before-introduction'),
        },
        { type: 'exitBuilding' },
      ],
    },
  ],
  pubBeforeQuest2: [
    {
      type: 'dialogue',
      body: 'Master $firstName, I think you’d better be heading home now.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  pubAfterQuest: [
    {
      type: 'dialogue',
      body: 'Master $firstName, what’s going on? The whole town is in an uproar.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'Are you really going to leave on a sea voyage?',
      position: 1,
      speaker: characterId('lucia'),
    },
    {
      type: 'dialogue',
      body: 'I’m afraid so. It’s the $lastName tradition, after all.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Except, I’m not sure what we’re going to do about money.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Why not become a traveling band? I’d be happy to sing for you!',
      position: 1,
      speaker: characterId('lucia'),
    },
    {
      type: 'dialogue',
      body: 'Come now, Lucia, stop your nonsense.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'Master $firstName, here is 1000 gold pieces. Please, take it.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'Here I thought this pub wasn’t popular at all, but ye’ve managed to save up quite a little bit.',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Thanks. Sorry we’re not up to your standards, Rocco.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'Master $firstName, please, accept this gift.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'No, I’m sorry, but I can’t. I wouldn’t be able to return it to you.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Don’t worry about that. Actually, I’m not supposed to say this, but this money is really from your father, the Duke.',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'He said, ’Please give this to $firstName if he stops by to see you.’',
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'dialogue',
      body: 'My father...?',
      position: 2,
      speaker: characterId('joao'),
    },
    { type: 'effect', effects: [{ type: 'receiveGold', amount: 1000 }] },
    {
      type: 'dialogue',
      body: 'This is all well and good, but we’ll be needing a little more money if ye wants to get further than Lisbon...',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Shiver me timbers! Why didn’t I think of this earlier? Ye mother will help ye!',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'But how? I’m not even allowed inside the house.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Don’t worry. I’ll take a message for you.',
      position: 2,
      speaker: characterId('lucia'),
    },
    {
      type: 'dialogue',
      body: 'Lucia!',
      position: 2,
      speaker: characterId('joao'),
      fadeBeforeNext: true,
    },
    {
      type: 'dialogue',
      body: 'I’m back.',
      position: 1,
      speaker: characterId('lucia'),
    },
    {
      type: 'dialogue',
      body: 'So, missie, how’d it go?',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'She wants you to come to the house between 10 and 12 at night.',
      position: 1,
      speaker: characterId('lucia'),
    },
    {
      type: 'dialogue',
      body: 'Thanks for the advice Carlotta. Thank you Lucia.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'effect',
      effects: [
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.pub-farewell'),
        },
        { type: 'exitBuilding' },
      ],
    },
  ],
  pubAfterQuest2: [
    {
      type: 'dialogue',
      body: 'I heard that your mother wants you to come to the house between 10 and 12 at night.',
      position: 1,
      speaker: characterId('lucia'),
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  lodgeBankGuildBeforeQuestRandom1: [
    {
      type: 'dialogue',
      body: 'Well this is a surprise, Master $firstName. Are you avoiding something?',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'You’re part of the $lastName family, so I guess you’ll be taking a trip soon, right?',
      position: 0,
    },
  ],
  lodgeBankGuildBeforeQuestRandom2: [
    {
      type: 'dialogue',
      body: 'Welcome Master $lastName. You know, your father’s one of my best customers.',
      position: 0,
    },
    { type: 'dialogue', body: 'Rocco came here looking for you.', position: 0 },
  ],
  lodgeBankGuildBeforeQuestRandom3: [
    {
      type: 'dialogue',
      body: 'Just a little advice, Master $firstName- visit the pub whenever you’ve got a problem.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'The pub owner, Carlotta, helped out your father, the Duke, quite a bit when he was your age.',
      position: 0,
    },
  ],
  lodgeBankGuildAfterQuestRandom1: [
    {
      type: 'dialogue',
      body: 'Master $firstName, is it true that everyone’s to treat you as a commoner?',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Yes that’s right. So just treat me like a regular sailor, OK?',
      position: 2,
      speaker: characterId('joao'),
    },
  ],
  lodgeBankGuildAfterQuestRandom2: [
    {
      type: 'dialogue',
      body: 'Master $firstName, I’m sure you’ll find the secret of Atlantis.',
      position: 0,
    },
  ],
  lodgeBankGuildAfterQuestRandom3: [
    {
      type: 'dialogue',
      body: 'Say, Master $firstName, you’re leaving pretty soon, aren’t you?',
      position: 0,
    },
  ],
  palaceBeforeQuest: [
    {
      type: 'dialogue',
      body: 'Welcome Master $firstName. Duke $lastName was here looking for you.',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  palaceAfterQuest: [
    {
      type: 'dialogue',
      body: 'Master $firstName, the Duke has ordered everyone to treat you as a commoner. So, I’m afraid I must ask you not to enter the Palace anymore.',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  itemShopBeforeQuest: [
    {
      type: 'dialogue',
      body: 'Hello there Master $firstName. Rocco was here earlier looking for you.',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  itemShopAfterQuest: [
    {
      type: 'dialogue',
      body: 'Welcome Master $firstName. I have something for you.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'For me?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Your Butler Marco came by here and asked me to give this rapier to you if you stopped by.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'It’s already been paid for, so please take it.',
      position: 0,
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveItem', itemId: '4' },
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.item-shop-rapier'),
        },
      ],
    },
    {
      type: 'dialogue',
      body: 'Be careful out there. And remember, a weapon’s useless if you don’t equip yourself with it.',
      position: 0,
    },
  ],
  itemShopAfterQuest2: [
    {
      type: 'dialogue',
      body: 'Be careful out there. And remember, a weapon’s useless if you don’t equip yourself with it.',
      position: 0,
    },
  ],
  shipyardBeforeQuest: [
    {
      type: 'dialogue',
      body: 'Say, there’s a ship being built by Duke $lastName’s orders! I wonder who’s going to use it?',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Rocco, probably.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'That reminds me, Rocco was in here looking for you.',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  shipyardAfterQuest: [
    {
      type: 'dialogue',
      body: 'Ahoy there, is our ship finished yet?',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Why if it isn’t Rocco! Aye, mate, she’s all finished.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'I built ’er exactly as Duke Leon ordered. A Latin, just like the one he first sailed on.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Her name’s the Hermes II. She’s got a triangle sail, easy for landlubbers to control.',
      position: 0,
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveShip', shipId: '6', name: 'Hermes II' },
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.shipyard-hermes-ii'),
        },
        { type: 'exitBuilding' },
      ],
    },
  ],
  churchBeforeQuest: [
    {
      type: 'dialogue',
      body: 'Master $firstName, is there anyone in the Duke $lastName’s household that could possibly take a trip?',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'I’m afraid not. My father is too busy, and I’ve no experience.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'I’m looking for a reliable man to... Well, never mind.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Oh, that reminds me, Rocco was here looking for you.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'I see. Well then, I guess I’ll go back to the house.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'effect',
      effects: [
        {
          type: 'completeEvent',
          eventId: storyEventId(
            'joao.lisbon-opening.church-before-introduction',
          ),
        },
        { type: 'exitBuilding' },
      ],
    },
  ],
  churchBeforeQuest2: [
    {
      type: 'dialogue',
      body: 'Master $firstName, are you going to go to the house now?',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  churchAfterQuest: [
    {
      type: 'dialogue',
      body: 'I’m glad you could make it, Master $firstName.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'I heard you had something on your mind. What is it?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Well, actually, I have something to ask of you.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Wait a minute. You’re looking for a sailor, right?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Yes. And I have heard rumors about you, Master $firstName. About your voyage.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'My colleagues and I have long been fascinated by the riddle of the existence of Atlantis. We admire your endeavor.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'And along with that, I have a favor to ask of you, young Master.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Enrico, Brother Enrico! Over here please.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Yes sir!',
      position: 2,
      speaker: characterId('enrico'),
    },
    {
      type: 'dialogue',
      body: 'Brother Enrico is a Franciscan missionary.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Master $firstName, we’d like to spread the teachings of the Christian faith in the East.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'I know this may be a great deal to ask, but we want you to take him to the land of Zipangu.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Did you say Zipangu?! I heard from my father that it’s a beautiful island in the far east, that Marco Polo wrote about, but...',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'There’s no way I could do that now. I’ve never even left the land of Iberia!',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'But I want to exchange knowledge with them, and teach them my faith.',
      position: 2,
      speaker: characterId('enrico'),
    },
    {
      type: 'dialogue',
      body: 'The Vatican commissioned me to go there as a missionary.',
      position: 2,
      speaker: characterId('enrico'),
    },
    {
      type: 'dialogue',
      body: 'Please. Take me to Zipangu.',
      position: 2,
      speaker: characterId('enrico'),
    },
    {
      type: 'dialogue',
      body: 'Well, since you’re willing to go that far, I guess I can’t refuse. But I really can’t say how many years it will take.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Are ye sure ye want to do this? I mean, a promise like that, well...',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Well, Zipangu is certainly far away, but if we take it day by day, and make progress little by little, we’ll make it.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Aye, ye’ve got a point there.',
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'addCompanion', characterId: characterId('enrico') },
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.church-recruit-enrico'),
        },
      ],
    },
  ],
  churchAfterEnrico: [
    {
      type: 'dialogue',
      body: 'Oh Master $firstName. Thank you so much for agreeing to take Brother Enrico.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'I managed to get together some gold for you. Please use it wisely.',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'receiveGold', amount: 1000 }] },
    {
      type: 'dialogue',
      body: 'Thank you very much. I promise to put it to good use.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'effect',
      effects: [
        {
          type: 'completeEvent',
          eventId: storyEventId('joao.lisbon-opening.church-enrico-gift'),
        },
      ],
    },
  ],
  churchAfterEnricoAfterGift: [
    {
      type: 'dialogue',
      body: 'Oh Master $firstName. Thank you so much for agreeing to take Brother Enrico.',
      position: 0,
    },
  ],
  harborBeforeQuest: [
    {
      type: 'dialogue',
      body: 'Master $firstName, whenever you have a problem, just go on over to the pub.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'The pub owner, Carlotta, helped out the Duke quite a bit when he was your age.',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  harborBeforeShip: [
    {
      type: 'dialogue',
      body: 'We can’t sail the seas without a ship, now can we? Let’s go to the shipyard.',
      position: 1,
      speaker: characterId('rocco'),
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  harborBeforeEnrico: [
    {
      type: 'dialogue',
      body: 'Hey Master $firstName, Father Felippe of the church in Lisbon was looking for you.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Hmm, I wonder what he wants.',
      position: 2,
      speaker: characterId('joao'),
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  harborAfterEnrico: [
    {
      type: 'dialogue',
      body: 'We’ll be food for the whales if we don’t get our hands on a bit o’ gold. Why don’t ye go to the pub and ask Carlotta for help?',
      position: 1,
      speaker: characterId('rocco'),
    },
  ],
  harborAfterEnrico2: [
    {
      type: 'dialogue',
      body: 'We’re running pretty low on gold, mate. Ye should go ask Carlotta at the pub. She helped the Duke out when he was younger.',
      position: 1,
      speaker: characterId('rocco'),
    },
  ],
  harborAfterEnricoBeforeMother: [
    {
      type: 'dialogue',
      body: 'Cap’n, don’t ye think we could use a little bit more money?',
      position: 1,
      speaker: characterId('rocco'),
    },
  ],
  harborFinal: [
    {
      type: 'dialogue',
      body: 'So what’s the plan of action?',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Well, I thought we’d just sail around from port to port.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Hah! That’s not a very bright plan.',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Why not?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Gold. It takes a heap o’ gold to keep a ship like this afloat.',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Water’s free, but ye’d be amazed at how much it costs to feed a crew.',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'So are you saying that this money won’t be enough?',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Well, it ought to last us about a month. But resting on that fact won’t get us any more!',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'But ye’re on the right track. Sailing around from port to port is a good beginning because...',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'Ah! You figure we can trade and make a profit along the way, right?',
      position: 1,
      speaker: characterId('enrico'),
    },
    {
      type: 'dialogue',
      body: 'Ah, now here’s a mate who’s using his noggin!',
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: 'But even if we decide to trade, I don’t know what to buy where and where to sell what.',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'Well, for example, we should buy goods particular to each port. Like Lisbon’s rock salt.',
      position: 1,
      speaker: characterId('enrico'),
    },
    {
      type: 'dialogue',
      body: 'Hmmm...',
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: 'I’m a missionary, but the subject of economics fascinates me. It’s been a hobby of mine to study the market.',
      position: 1,
      speaker: characterId('enrico'),
    },
    {
      type: 'dialogue',
      body: 'If we buy rock salt for 40 gold pieces here, we should be able to sell it for at least 60 gold pieces in Seville.',
      position: 1,
      speaker: characterId('enrico'),
    },
    {
      type: 'choice',
      prompt:
        'Captain, Brother Enrico seems to have a head for numbers, so why don’t ye make him the bookkeeper on our ship?',
      position: 1,
      speaker: characterId('rocco'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'effect',
              effects: [
                {
                  type: 'assignMate',
                  characterId: characterId('rocco'),
                  role: 'firstMate',
                },
                {
                  type: 'assignMate',
                  characterId: characterId('enrico'),
                  role: 'bookKeeper',
                },
              ],
            },
            {
              type: 'dialogue',
              body: 'Not a bad idea. Welcome to the crew, Brother Enrico.',
              position: 2,
              speaker: characterId('joao'),
            },
            {
              type: 'dialogue',
              body: 'Oh, and I’d like you to be first mate, Rocco.',
              position: 2,
              speaker: characterId('joao'),
            },
            {
              type: 'dialogue',
              body: 'Well, I do have a pretty good idea of prices at the ports I’ve read about.',
              position: 1,
              speaker: characterId('enrico'),
            },
            {
              type: 'dialogue',
              body: 'If we check our log of goods, I should be able to figure out which port will pay the most for each item.',
              position: 1,
              speaker: characterId('enrico'),
            },
            {
              type: 'effect',
              effects: [
                {
                  type: 'completeEvent',
                  eventId: storyEventId('joao.lisbon-opening.harbor-final'),
                },
              ],
            },
          ],
        },
        {
          id: 'no',
          label: 'No',
          steps: [
            {
              type: 'dialogue',
              body: 'No, it’s not right to ask Brother Enrico to do such work.',
              position: 2,
              speaker: characterId('joao'),
            },
            {
              type: 'dialogue',
              body: 'Well, actually, I wouldn’t mind it in the least. I’d be glad to help!',
              position: 1,
              speaker: characterId('enrico'),
            },
            {
              type: 'dialogue',
              body: 'Well then, perhaps I’ll ask you again when we start to trade.',
              position: 2,
              speaker: characterId('joao'),
            },
            {
              type: 'effect',
              effects: [
                {
                  type: 'completeEvent',
                  eventId: storyEventId('joao.lisbon-opening.harbor-final'),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  marketBeforeQuest: [
    {
      type: 'dialogue',
      body: 'Welcome Master $lastName. It’s always a pleasure to see the son of my favorite customer, the Duke.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Rocco was just here looking for you.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'By the way, you can sell our rock salt for a pretty profit in the Mediterranean.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Furthermore, a trade route between here and Seville, with their porcelain, turns a nice profit as well.',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  marketAfterQuestBeforeShip: [
    {
      type: 'dialogue',
      body: 'Master $firstName, my apologies, but you don’t have a ship yet to store any goods.',
      position: 0,
    },
    {
      type: 'dialogue',
      body: 'Come back once you’ve gotten your ship. Thank you, I’m looking forward to doing business with you soon!',
      position: 0,
    },
    { type: 'effect', effects: [{ type: 'exitBuilding' }] },
  ],
  pubCarlottaGreeting: [
    {
      type: 'dialogue',
      body: 'Hello $firstName, would you like some rum?',
      position: 2,
      speaker: characterId('carlotta'),
    },
  ],
};

deepFreeze(lisbonOpeningDialogue);

export default lisbonOpeningDialogue;
