import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CARE_PROFILES } from '../src/data/careProfiles';
import { CATALOG_COUNT_LABEL, PLANT_CATALOG, TOTAL_PLANT_COUNT } from '../src/data/plantCatalog';
import { slugify } from '../src/data/plants/define';
import { plantArt } from '../src/utils/plantArt';

const CATEGORIES = ['foliage', 'succulent', 'herb', 'flowering', 'tropical', 'medicinal', 'fruit_edible', 'bonsai'];
const LIGHT = ['low_light', 'medium_light', 'bright_indirect', 'direct_sun'];
const HUMIDITY = ['low', 'medium', 'high'];
const TEXT_FIELDS = [
  'name', 'species', 'image', 'lightLabel', 'waterGuidance', 'soilPreference',
  'temperatureRange', 'potSize', 'pruningNotes', 'fertilizingNotes', 'careTip',
] as const;

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (seen.has(key)) dupes.add(value);
    seen.add(key);
  }
  return [...dupes];
}

describe('plant catalog integrity', () => {
  it('contains more than 1,000 plants', () => {
    assert.ok(TOTAL_PLANT_COUNT >= 1000, `only ${TOTAL_PLANT_COUNT} plants`);
    assert.equal(TOTAL_PLANT_COUNT, PLANT_CATALOG.length);
  });

  it('has no duplicate ids, common names or botanical names', () => {
    assert.deepEqual(duplicates(PLANT_CATALOG.map((p) => p.id)), [], 'duplicate ids');
    assert.deepEqual(duplicates(PLANT_CATALOG.map((p) => p.name)), [], 'duplicate names');
    assert.deepEqual(duplicates(PLANT_CATALOG.map((p) => p.species)), [], 'duplicate species');
  });

  it('gives every plant complete, valid care data', () => {
    for (const plant of PLANT_CATALOG) {
      const where = `${plant.id} (${plant.name})`;
      assert.match(plant.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `id is not a slug: ${where}`);
      assert.ok(CATEGORIES.includes(plant.category), `bad category: ${where}`);
      assert.ok(LIGHT.includes(plant.lightRequirement), `bad light: ${where}`);
      assert.ok(HUMIDITY.includes(plant.humidityPreference), `bad humidity: ${where}`);
      assert.ok(['indoor', 'outdoor'].includes(plant.indoorOutdoor), `bad placement: ${where}`);
      for (const field of TEXT_FIELDS) {
        const value = plant[field];
        assert.ok(typeof value === 'string' && value.trim().length > 0, `empty ${field}: ${where}`);
        assert.equal(value, value.trim(), `untrimmed ${field}: ${where}`);
      }
      assert.ok(plant.careTip.length >= 20, `care tip too short to be useful: ${where}`);
    }
  });

  it('uses a parseable temperature range with min below max', () => {
    for (const plant of PLANT_CATALOG) {
      const match = /^(-?\d+)°C\s*[–-]\s*(-?\d+)°C/.exec(plant.temperatureRange);
      assert.ok(match, `unparseable temperature range "${plant.temperatureRange}" on ${plant.id}`);
      assert.ok(Number(match[1]) < Number(match[2]), `inverted temperature range on ${plant.id}`);
    }
  });

  it('writes botanical names with a capitalised genus', () => {
    for (const plant of PLANT_CATALOG) {
      assert.match(plant.species, /^[A-Z][a-z]+/, `species should start with a genus: ${plant.id} -> ${plant.species}`);
    }
  });

  it('rounds the UI count label down so it never overstates the catalog', () => {
    const shown = Number(CATALOG_COUNT_LABEL.replace(/[+,]/g, ''));
    assert.ok(CATALOG_COUNT_LABEL.endsWith('+'));
    assert.ok(shown <= TOTAL_PLANT_COUNT && TOTAL_PLANT_COUNT - shown < 50);
  });

  it('defines complete care archetypes', () => {
    for (const [id, profile] of Object.entries(CARE_PROFILES)) {
      assert.ok(LIGHT.includes(profile.lightRequirement), `bad light on profile ${id}`);
      assert.ok(HUMIDITY.includes(profile.humidityPreference), `bad humidity on profile ${id}`);
    }
  });
});

describe('slugify', () => {
  it('produces stable, URL-safe ids', () => {
    assert.equal(slugify('Echeveria Perle von Nürnberg'), 'echeveria-perle-von-nurnberg');
    assert.equal(slugify('Bird’s Nest Fern'), 'birds-nest-fern');
    assert.equal(slugify('Monstera Deliciosa (Swiss Cheese Plant)'), 'monstera-deliciosa-swiss-cheese-plant');
  });
});

describe('plantArt', () => {
  it('is deterministic and returns a well-formed SVG data URI', () => {
    const a = plantArt('succulent', 'ghost-plant');
    assert.equal(a, plantArt('succulent', 'ghost-plant'));
    assert.ok(a.startsWith('data:image/svg+xml,'));
    const svg = decodeURIComponent(a.slice('data:image/svg+xml,'.length));
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
  });

  it('draws a different tile for every category', () => {
    const tiles = new Set(CATEGORIES.map((category) => plantArt(category as never, 'same-seed')));
    assert.equal(tiles.size, CATEGORIES.length);
  });
});
