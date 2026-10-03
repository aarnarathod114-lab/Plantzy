import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PLANT_CATALOG } from '../src/data/plantCatalog';
import { CATALOG_FILTERS, matchesFilter, normalise, searchCatalog } from '../src/utils/catalogSearch';

const names = (query: string, filter?: Parameters<typeof searchCatalog>[2]) =>
  searchCatalog(PLANT_CATALOG, query, filter).map((p) => p.name);

describe('searchCatalog', () => {
  it('returns the whole catalog, in order, for an empty query', () => {
    assert.deepEqual(searchCatalog(PLANT_CATALOG, '   '), PLANT_CATALOG);
  });

  it('matches common names', () => {
    assert.ok(names('monstera').some((n) => n.startsWith('Monstera Deliciosa')));
  });

  it('matches botanical names', () => {
    const results = searchCatalog(PLANT_CATALOG, 'ocimum');
    assert.ok(results.length >= 5);
    assert.ok(results.every((p) => /ocimum/i.test(p.species) || /ocimum/i.test(p.name)));
  });

  it('matches vernacular names in Devanagari and in Roman script', () => {
    assert.ok(names('तुलसी').length > 0);
    assert.ok(names('tamatar').includes('Tomato'));
  });

  it('ignores accents and apostrophes', () => {
    assert.ok(names('nurnberg').includes('Echeveria Perle von Nürnberg'));
    assert.ok(names('birds nest fern').includes('Bird’s Nest Fern'));
  });

  it('requires every token to match', () => {
    const results = names('neon pothos');
    assert.ok(results.includes('Neon Pothos'));
    assert.ok(results.every((n) => /neon/i.test(n)));
  });

  it('ranks whole-word matches above longer words that merely start with the query', () => {
    const results = names('rose');
    const rosemary = results.indexOf('Rosemary');
    const hybridTea = results.indexOf('Hybrid Tea Rose');
    assert.ok(rosemary > 0 && hybridTea >= 0);
    assert.ok(hybridTea < rosemary, 'a rose should come before rosemary');
    assert.match(results[0], /^Rose\b/);
  });

  it('ranks word-prefix matches above matches buried inside a word', () => {
    const results = names('mon');
    const firstBuried = results.findIndex((n) => !/\bmon/i.test(n));
    const lastPrefix = results.reduce((last, n, i) => (/^mon/i.test(n) ? i : last), -1);
    assert.match(results[0], /^Mon/);
    assert.ok(firstBuried === -1 || lastPrefix < firstBuried);
  });

  it('prefers common-name matches over botanical-name matches', () => {
    const results = searchCatalog(PLANT_CATALOG, 'ficus');
    const firstSpeciesOnly = results.findIndex((p) => !/ficus/i.test(p.name));
    const lastNamed = results.reduce((last, p, i) => (/\bficus/i.test(p.name) ? i : last), -1);
    assert.ok(firstSpeciesOnly === -1 || lastNamed < firstSpeciesOnly);
  });

  it('returns nothing for a query that matches no plant', () => {
    assert.deepEqual(names('zzzzqqqq'), []);
  });

  it('applies category filters', () => {
    const succulents = searchCatalog(PLANT_CATALOG, '', 'succulent');
    assert.ok(succulents.length > 100);
    assert.ok(succulents.every((p) => p.category === 'succulent'));
    assert.ok(searchCatalog(PLANT_CATALOG, 'tomato', 'succulent').length === 0);
  });

  it('places every plant in exactly one non-"all" filter group', () => {
    const groups = CATALOG_FILTERS.filter((f) => f.id !== 'all');
    for (const plant of PLANT_CATALOG) {
      const hits = groups.filter((g) => matchesFilter(plant, g.id));
      assert.equal(hits.length, 1, `${plant.name} is in ${hits.length} filter groups`);
    }
  });

  it('stays fast enough to run on every keystroke', () => {
    searchCatalog(PLANT_CATALOG, 'warm-up');
    const started = performance.now();
    for (const query of ['a', 'ro', 'fern', 'ficus elastica', 'तु', 'philodendron pink']) {
      searchCatalog(PLANT_CATALOG, query);
    }
    const perQueryMs = (performance.now() - started) / 6;
    assert.ok(perQueryMs < 16, `search took ${perQueryMs.toFixed(2)} ms per query`);
  });
});

describe('normalise', () => {
  it('keeps Devanagari vowel signs intact', () => {
    assert.equal(normalise('तुलसी'), 'तुलसी');
  });

  it('lowercases, strips Latin accents and collapses punctuation', () => {
    assert.equal(normalise('  Perle von NÜRNBERG!! '), 'perle von nurnberg');
    assert.equal(normalise('Rosa "Iceberg"'), 'rosa iceberg');
  });
});
