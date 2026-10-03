import type { CatalogPlant } from '../types/plant';

/** Browsing groups shown as filter pills. Several map onto more than one catalog category. */
export const CATALOG_FILTERS = [
  { id: 'all', label: 'All Plants' },
  { id: 'foliage', label: 'Foliage & Tropicals' },
  { id: 'flowering', label: 'Flowering' },
  { id: 'succulent', label: 'Succulents & Cacti' },
  { id: 'herbs', label: 'Herbs & Medicinal' },
  { id: 'edible', label: 'Fruit & Vegetables' },
  { id: 'bonsai', label: 'Bonsai' },
] as const;

export type CatalogFilterId = (typeof CATALOG_FILTERS)[number]['id'];

const FILTER_CATEGORIES: Record<Exclude<CatalogFilterId, 'all'>, ReadonlyArray<CatalogPlant['category']>> = {
  foliage: ['foliage', 'tropical'],
  flowering: ['flowering'],
  succulent: ['succulent'],
  herbs: ['herb', 'medicinal'],
  edible: ['fruit_edible'],
  bonsai: ['bonsai'],
};

export function matchesFilter(plant: CatalogPlant, filter: CatalogFilterId): boolean {
  return filter === 'all' || FILTER_CATEGORIES[filter].includes(plant.category);
}

/**
 * Lowercase, strip Latin diacritics and punctuation, collapse whitespace.
 * Devanagari is left intact (its vowel signs live outside U+0300–036F), so
 * vernacular names stay searchable in their own script.
 */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’‘`]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim();
}

interface IndexEntry {
  name: string;
  species: string;
  vernacular: string;
}

// Normalised strings are computed once per plant object and reused across keystrokes.
const index = new WeakMap<CatalogPlant, IndexEntry>();

function entryFor(plant: CatalogPlant): IndexEntry {
  let entry = index.get(plant);
  if (!entry) {
    entry = {
      name: normalise(plant.name),
      species: normalise(plant.species),
      vernacular: normalise(plant.vernacularName ?? ''),
    };
    index.set(plant, entry);
  }
  return entry;
}

/** How a token sits inside a normalised string. */
function matchKind(haystack: string, token: string): 'word' | 'prefix' | 'inside' | null {
  let from = 0;
  let best: 'prefix' | 'inside' | null = null;
  for (;;) {
    const at = haystack.indexOf(token, from);
    if (at === -1) return best;
    const startsWord = at === 0 || haystack[at - 1] === ' ';
    const end = at + token.length;
    const endsWord = end === haystack.length || haystack[end] === ' ';
    if (startsWord && endsWord) return 'word';
    if (startsWord) best = 'prefix';
    else if (best === null) best = 'inside';
    from = at + 1;
  }
}

/**
 * Lower is better; `null` means the token does not match this plant at all.
 * A whole word beats the start of a longer word ("rose" finds roses before
 * rosemary), which beats a match buried inside a word ("mon" finds monstera
 * before lemon). Common names outrank vernacular names, which outrank
 * botanical names.
 */
function tokenScore(entry: IndexEntry, token: string): number | null {
  const name = matchKind(entry.name, token);
  if (name === 'word') return entry.name.startsWith(token) ? 0 : 1;
  if (name === 'prefix') return entry.name.startsWith(token) ? 2 : 3;

  const vernacular = entry.vernacular ? matchKind(entry.vernacular, token) : null;
  if (vernacular === 'word' || vernacular === 'prefix') return 4;

  const species = matchKind(entry.species, token);
  if (species === 'word' || species === 'prefix') return 5;

  if (name === 'inside') return 6;
  if (vernacular === 'inside') return 7;
  if (species === 'inside') return 8;
  return null;
}

/**
 * Filter and rank the catalog.
 *
 * Every whitespace-separated token in the query must match the plant's common
 * name, botanical name or vernacular name. Results are ranked by how well each
 * token matches (see `tokenScore`); ties keep catalog order. An empty query returns the filtered catalog unchanged.
 */
export function searchCatalog(
  catalog: readonly CatalogPlant[],
  query: string,
  filter: CatalogFilterId = 'all'
): CatalogPlant[] {
  const tokens = normalise(query).split(' ').filter(Boolean);
  const pool = filter === 'all' ? catalog : catalog.filter((plant) => matchesFilter(plant, filter));
  if (tokens.length === 0) return [...pool];

  const scored: Array<{ plant: CatalogPlant; score: number; order: number }> = [];
  pool.forEach((plant, order) => {
    const entry = entryFor(plant);
    let score = 0;
    for (const token of tokens) {
      const s = tokenScore(entry, token);
      if (s === null) return;
      score += s;
    }
    scored.push({ plant, score, order });
  });

  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.map((item) => item.plant);
}
