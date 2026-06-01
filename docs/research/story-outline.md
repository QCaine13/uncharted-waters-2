# Story Outline

This is a development-oriented story outline for Uncharted Waters: New Horizons
/ Daikoukai Jidai II. It is based on the current repository quest data and the
external walkthrough references listed in [README.md](README.md).

The original game is open-ended: six protagonists have different backgrounds,
goals, fame tracks, and event chains, while the same world simulation continues
around them. This outline should help us decide what to implement first and how
to model story events as data.

## Current Repo Coverage

Current files:

- `src/interface/quest/questData.ts`
- `src/interface/quest/getAvailableQuest.ts`
- `src/data/characterData.ts`
- `src/data/sailorData.ts`

The current project implements only the opening slice of Joao's route:

1. Joao starts in Lisbon.
2. Duke Franco sends him to seek the secret of Atlantis / Prester John.
3. Rocco joins as mentor and first companion.
4. Joao says goodbye to Carlotta and Lucia.
5. The item shop gives Joao a rapier.
6. Father Felippe asks Joao to take Brother Enrico to Zipangu.
7. The shipyard gives Joao the Hermes II.
8. At the harbor, Rocco and Enrico can be assigned as first mate and
   bookkeeper.
9. Joao leaves Lisbon.

This is a strong tutorial arc: it introduces family, companions, shipyard,
church, item shop, pub, harbor, and crew roles.

## Shared Story Structure

The six protagonists are not separate worlds. Their stories interlock:

- Joao is the adventure/tutorial hero.
- Catalina is the revenge pirate whose pursuit of Joao becomes part of the
  wider conspiracy.
- Otto is the English privateer/military route.
- Pietro is the treasure-seeking collector route.
- Ernst is the cartographer/explorer route.
- Ali is the merchant/political-economy route.

Most routes are gated by one of three fame types:

- Adventure fame
- Pirate fame
- Trade fame

For implementation, each route should become a list of story events with:

- protagonist
- required fame type/value
- required port/building/region
- required elapsed days or date window
- required companion/item
- event messages
- rewards
- battle/duel requirement
- state changes

## Protagonist Routes

### Joao Franco / Joao Ferrero

Primary fantasy: young noble leaves Lisbon, learns the world, and becomes
entangled in a global conspiracy.

Core themes:

- Coming-of-age adventure.
- Tutorialization of systems.
- Discovery of Prester John / Atlantis mystery.
- Ties to Catalina, Ali, Pietro, Enrico, and Martinez.

Major beats:

1. Lisbon opening: father sends Joao to sea, Rocco joins, Enrico is recruited,
   Hermes II is received.
2. Domingo stowaway arc: after several days at sea, Domingo appears; later he
   disappears, duels happen, and Joao must clear his father's name.
3. Catalina encounter: Catalina hunts Joao, believing him tied to her family
   tragedy.
4. Sasha/Lucia/Ali thread: Ali asks Joao to find Sasha; Joao searches across
   Middle Eastern ports.
5. Massawa arc: Joao learns of a Christian kingdom, needs the Staff of the
   Saint, and depends on Pietro's treasure-hunting thread.
6. Zipangu arc: Enrico remembers his mission to Japan, opening the Far East.
7. Final conspiracy: Enrico's letter leads Joao from Sakai to South America,
   where Martinez's plot is exposed and defeated in the Amazon region.

Implementation priority: high. This route already exists in miniature and is
the best first full story route.

### Catalina Erantzo

Primary fantasy: naval officer becomes outlaw pirate while pursuing revenge.

Core themes:

- Revenge for missing brother and lover.
- Break with Spain and fall into piracy.
- Pursuit of Joao.
- Gradual discovery that Joao is not the true enemy.

Major beats:

1. Seville opening: Catalina hears that her brother Micael and lover Hernan
   disappeared during anti-pirate operations.
2. She is denied support, leaves the navy, receives the Rebellion, and becomes
   a pirate.
3. Spanish armada pressure begins after early piracy.
4. Catalina tracks Joao through rumors and port events.
5. Lucia kidnapping arc: Catalina's search intersects with Pello and Joao's
   circle.
6. Massawa arc: Catalina learns Joao is helping people rather than conspiring
   against her.
7. Final arc: Catalina and Joao cooperate against Martinez's conspiracy in
   South America/Amazon.

Implementation priority: medium-high. It reuses Joao's world events and gives
the project a combat-forward second route.

### Otto Spinola

Primary fantasy: English privateer builds a fighting fleet and challenges
Spanish naval power.

Core themes:

- Military/privateering.
- English-Spanish conflict.
- Fleet combat and captures.
- Confrontation with the Armada.

Major beats:

1. London opening: Henry VIII grants Otto equipment, a privateering license,
   rank, and orders to command warships.
2. Otto receives the Simpleton and recruits Matthew Roy after a duel.
3. Early route encourages fighting weaker fleets, capturing ships, and building
   naval strength.
4. Catalina cameo/ghost-rumor event appears around pirate fame 5000.
5. Pietro provides intelligence about a Spanish gold fleet before pirate fame
   advances too far.
6. Final route: Henry orders Otto against the Spanish Armada; battles move from
   Europe toward the New World and Amazon region, then end with a duel/challenge
   involving Ezequiel.

Implementation priority: medium. Build after a simple naval combat model
exists.

### Pietro Conti

Primary fantasy: Italian treasure hunter pursues legendary artifacts and El
Dorado.

Core themes:

- Collectors and discovery reporting.
- Treasure maps.
- Golden Mask, Staff of the Saint, El Dorado.
- Cross-route support for Joao.

Major beats:

1. Pietro should quickly go to Lisbon to secure starting funds from the Farrell
   / Franco connection.
2. A foreign-port tavern event sells him a Golden Mask map.
3. Finding the Golden Mask raises adventure fame and points him toward the
   Golden Country.
4. Around adventure fame 10000, Joao asks Pietro to find the Staff of the
   Saint.
5. Pietro follows tavern/fortune-teller clues through Middle Eastern ports,
   finds the staff map, recovers the artifact, and delivers it at Massawa.
6. Around adventure fame 40000, Ali and Ernst-related clues point Pietro toward
   Japan and then South America.
7. Pietro finds the Farrell elder and brings him back to Lisbon.

Implementation priority: medium. It requires discovery, treasure-map, and
collector systems.

### Ernst von Bohr / Ernst Lopez

Primary fantasy: scholar-cartographer maps the world and follows clues to the
Far East.

Core themes:

- Cartography.
- Exploration over combat.
- Laura's backstory.
- Discovery of Japan and Changan.

Major beats:

1. Ernst's route is one of the simpler story structures.
2. He should contract with Mercator; contracting with the wrong mapmaker can
   penalize fame in some versions/guides.
3. At adventure fame milestones, Amsterdam port events with Laura advance the
   story.
4. At high adventure fame, he is pointed toward the Golden Country / Japan.
5. After reaching Japan, clues point farther northeast and then toward Laura's
   homeland and the Yellow River.
6. Discovering Changan and entering the palace closes the route.

Implementation priority: medium-low until mapping/discovery systems exist.

### Ali Vezas

Primary fantasy: indebted Ottoman merchant becomes a great financier and uses
wealth to protect family and community.

Core themes:

- Debt, trade, and credit.
- Ottoman political economy.
- Buying allied ports.
- Sasha and social responsibility.

Major beats:

1. Istanbul opening: Ali starts in debt and scrapes together funds.
2. Paying debts and receiving rank from the Ottoman ruler opens the political
   trade route.
3. Ali is tasked with expanding Ottoman-aligned ports and receives tax-exemption
   support.
4. After gaining great wealth, Ali meets Joao and asks him to find Sasha.
5. A banker-transfer/debt-collection thread sends Ali through Venice, Lisbon,
   and Sakai, intersecting with Pietro.
6. With more than 30 Ottoman allied ports, Ali is praised and rewarded by the
   ruler.
7. At trade fame 40000, Ali sees the social cost of port-buying, helps Sasha
   care for orphans, negotiates with Shylock in Venice, and secures a home for
   them in Istanbul.

Implementation priority: high once market/investment systems exist. This route
is the best narrative driver for trade and port-investment mechanics.

## Cross-route Conspiracy

The common late-game thread appears to involve:

- Martinez as the hidden villain.
- South America / Amazon as the final-stage region for several routes.
- Joao and Catalina moving from conflict to cooperation.
- Ottoman fleet / Massawa events as a mid-game political-religious crisis.
- Far East / Japan as a discovery gateway for Enrico, Pietro, and Ernst.

For our remake, this can be modeled as shared world events rather than copied
dialogue per protagonist.

## Suggested Implementation Order

1. Finish Joao's Lisbon tutorial arc cleanly.
2. Add save/load so story progress persists.
3. Add fame fields: adventure, pirate, trade.
4. Add event trigger engine.
5. Add market/trade MVP.
6. Extend Joao to the Domingo arc.
7. Add Ali as the first non-Joao route once trade and investment work.
8. Add Catalina after naval battle has a minimum viable model.

## Source Notes

- GCGX Joao route:
  https://gcgx.games/dkj2/chart/joao.html
- GCGX Catalina route:
  https://gcgx.games/dkj2/chart/catalina.html
- GCGX Otto route:
  https://gcgx.games/dkj2/chart/otto.html
- Chinese full protagonist walkthrough:
  https://www.top10bit.com/dai-koukai-jidai-2-guide/
