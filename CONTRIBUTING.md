# Contributing to Plantzy

Thanks for helping. This guide covers the two most common contributions: adding plants and changing care rules.

## Setup

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # typecheck + tests + production build; run before opening a PR
```

## Adding a plant

Most plants are one line. Open the collection that fits in `src/data/plants/` and add a row to the group whose care archetype matches:

```ts
...group('aroidClimber', 'foliage', 'indoor', [
  ['Philodendron Micans', 'Philodendron hederaceum "Micans"', 'Velvet leaves mark easily; avoid misting and handle little.'],
]),
```

A row is `[common name, botanical name, care tip, overrides?]`.

- **Common name** must be unique in the catalog. The id is derived from it.
- **Botanical name** must be unique and start with the genus. Put cultivars in double quotes.
- **Care tip** is one or two sentences specific to this plant. Say what a grower would otherwise get wrong. Do not repeat the archetype.
- **Overrides** change any field for this plant only, for example `{ humidityPreference: 'high' }` or `{ vernacularName: 'तुलसी / Tulsi' }`.

If no archetype fits, add one to `src/data/careProfiles.ts` rather than overriding most fields on every row.

Run `npm test`. The catalog tests reject duplicate names, missing fields, invalid enum values and unparseable temperature ranges.

### Accuracy

- Only add plants you can verify against a horticultural reference.
- Mention toxicity in the care tip when a plant is dangerous to people or pets.
- Do not make health claims. Traditional uses can be mentioned as context, never as advice.

## Changing care rules

The rules live in `src/utils/intelligence.ts` and are pure functions of plants and weather. Every rule change needs a test in `tests/intelligence.test.ts` that fails without the change.

Two principles to keep:

1. **Check before you water.** Plantzy prompts a soil check and explains why. It does not tell people to water on a timer.
2. **Never invent data.** If weather or AI is unavailable, the app says so. It does not substitute plausible-looking values.

## Pull requests

- Keep PRs focused on one change.
- Describe what you changed and how you checked it.
- CI must pass.
