import type { CatalogPlant } from '../../types/plant';
import { plantArt } from '../../utils/plantArt';
import { CARE_PROFILES, type CareProfileId } from '../careProfiles';

type Category = CatalogPlant['category'];

/** Per-plant overrides on top of the care archetype. */
export type PlantOverrides = Partial<Omit<CatalogPlant, 'id' | 'name' | 'species' | 'careTip'>>;

/** `[common name, botanical name, species-specific care tip, overrides?]` */
export type PlantRow = [name: string, species: string, careTip: string, overrides?: PlantOverrides];

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Expand compact rows into full catalog entries.
 *
 * Every plant in a group shares a care archetype, category and placement;
 * anything that differs for one species goes in that row's overrides.
 */
export function group(
  profile: CareProfileId,
  category: Category,
  indoorOutdoor: CatalogPlant['indoorOutdoor'],
  rows: PlantRow[]
): CatalogPlant[] {
  return rows.map(([name, species, careTip, overrides = {}]) => {
    const id = slugify(name);
    const resolvedCategory = overrides.category ?? category;
    return {
      id,
      name,
      species,
      category: resolvedCategory,
      indoorOutdoor,
      ...CARE_PROFILES[profile],
      image: plantArt(resolvedCategory, id),
      careTip,
      ...overrides,
    };
  });
}
