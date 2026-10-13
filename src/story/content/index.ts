import type { StoryContentSource } from '../core/types';
import { joaoLisbonOpening } from './arcs/joao/lisbon-opening';
import { joaoFirstVoyage } from './arcs/joao/first-voyage';
import { joaoConflictAndGrowth } from './arcs/joao/conflict-and-growth';
import { joaoMassawa } from './arcs/joao/massawa';
import { joaoFinale } from './arcs/joao/finale';
import { katarinaVengeance } from './arcs/katarina/vengeance';
import { ottoArmada } from './arcs/otto/armada';
import { ernstWorldmap } from './arcs/ernst/worldmap';
import { pietroAdventure } from './arcs/pietro/adventure';
import { aliMerchant } from './arcs/ali/merchant';
import { storyCharacters } from './characters';
import { storyRelationships } from './relationships';

export { joaoLisbonOpening } from './arcs/joao/lisbon-opening';
export { joaoFirstVoyage } from './arcs/joao/first-voyage';
export { joaoConflictAndGrowth } from './arcs/joao/conflict-and-growth';
export { joaoMassawa } from './arcs/joao/massawa';
export { joaoFinale } from './arcs/joao/finale';
export { katarinaVengeance } from './arcs/katarina/vengeance';
export { ottoArmada } from './arcs/otto/armada';
export { ernstWorldmap } from './arcs/ernst/worldmap';
export { pietroAdventure } from './arcs/pietro/adventure';
export { aliMerchant } from './arcs/ali/merchant';
export { storyCharacters } from './characters';
export { storyRelationships } from './relationships';
export { storyValidationCatalogs } from './catalogs';

export const storyContentSource: StoryContentSource = {
  characters: storyCharacters,
  relationships: storyRelationships,
  arcs: [
    joaoLisbonOpening.arc,
    joaoFirstVoyage.arc,
    joaoConflictAndGrowth.arc,
    joaoMassawa.arc,
    joaoFinale.arc,
    katarinaVengeance.arc,
    ottoArmada.arc,
    ernstWorldmap.arc,
    pietroAdventure.arc,
    aliMerchant.arc,
  ],
  events: [
    ...joaoLisbonOpening.events,
    ...joaoFirstVoyage.events,
    ...joaoConflictAndGrowth.events,
    ...joaoMassawa.events,
    ...joaoFinale.events,
    ...katarinaVengeance.events,
    ...ottoArmada.events,
    ...ernstWorldmap.events,
    ...pietroAdventure.events,
    ...aliMerchant.events,
  ],
};

export default storyContentSource;
