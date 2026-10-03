import type { CatalogPlant } from '../types/plant';
import { INDIAN_CLASSICS } from './plants/indianClassics';
import { POPULAR_HOUSEPLANTS } from './plants/houseplants';
import { FLOWERING_FRAGRANT } from './plants/floweringFragrant';
import { SUCCULENTS_HERBS } from './plants/succulentsHerbs';
import { EXOTICS_EDIBLES } from './plants/exoticsEdibles';
import { MORE_INDIAN_PLANTS } from './plants/moreIndianPlants';
import { MORE_HOUSEPLANTS_AND_SUCCULENTS } from './plants/moreHouseplantsAndSucculents';
import { FOLIAGE_COLLECTION } from './plants/foliageCollection';
import { SUCCULENT_COLLECTION } from './plants/succulentCollection';
import { FLOWERING_COLLECTION } from './plants/floweringCollection';
import { HERBS_AND_MEDICINALS } from './plants/herbsAndMedicinals';
import { KITCHEN_GARDEN } from './plants/kitchenGarden';
import { TREES_AND_BONSAI } from './plants/treesAndBonsai';

/**
 * The full plant catalog.
 *
 * The first seven collections are hand-written entries with photos. The rest
 * are built from compact rows on top of shared care archetypes (see
 * `careProfiles.ts` and `plants/define.ts`). `tests/catalog.test.ts` enforces
 * unique ids, names and botanical names and valid care data across all of them.
 */
export const PLANT_CATALOG: CatalogPlant[] = [
  ...INDIAN_CLASSICS,
  ...POPULAR_HOUSEPLANTS,
  ...FLOWERING_FRAGRANT,
  ...SUCCULENTS_HERBS,
  ...EXOTICS_EDIBLES,
  ...MORE_INDIAN_PLANTS,
  ...MORE_HOUSEPLANTS_AND_SUCCULENTS,
  ...FOLIAGE_COLLECTION,
  ...SUCCULENT_COLLECTION,
  ...FLOWERING_COLLECTION,
  ...HERBS_AND_MEDICINALS,
  ...KITCHEN_GARDEN,
  ...TREES_AND_BONSAI,
];

export const TOTAL_PLANT_COUNT = PLANT_CATALOG.length;

/** Rounded-down count for UI copy, e.g. 987 plants reads as "950+". */
export const CATALOG_COUNT_LABEL = `${(Math.floor(TOTAL_PLANT_COUNT / 50) * 50).toLocaleString('en-US')}+`;
