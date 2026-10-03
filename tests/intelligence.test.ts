import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  checkMissedCare,
  daysSince,
  generateDailyRoutine,
  generateEnvironmentInsights,
  getPlantsNeedingAttention,
  isRose,
  moistureTrend,
  soilCheckIntervalDays,
} from '../src/utils/intelligence';
import { careEvent, daysAgo, makePlant, makeWeather, soil } from './helpers';

const calm = makeWeather();
const taskIds = (plants: Parameters<typeof generateDailyRoutine>[0], weather = calm) =>
  generateDailyRoutine(plants, weather).allTasks.map((t) => t.id);

describe('daysSince', () => {
  it('treats missing and invalid dates as long ago', () => {
    assert.equal(daysSince(undefined), 999);
    assert.equal(daysSince('not a date'), 999);
  });

  it('counts whole days and never goes negative', () => {
    const now = Date.parse('2026-06-10T12:00:00Z');
    assert.equal(daysSince('2026-06-07T12:00:00Z', now), 3);
    assert.equal(daysSince('2026-06-10T11:00:00Z', now), 0);
    assert.equal(daysSince('2026-06-12T12:00:00Z', now), 0);
  });
});

describe('moistureTrend', () => {
  it('needs at least two readings', () => {
    assert.equal(moistureTrend({ soilHistory: soil('moist') }), 'unknown');
  });

  it('reads the last three checks only', () => {
    assert.equal(moistureTrend({ soilHistory: soil('very_dry', 'very_dry', 'moist', 'very_wet', 'moist') }), 'holding_moisture');
    assert.equal(moistureTrend({ soilHistory: soil('moist', 'very_dry', 'slightly_dry', 'very_dry') }), 'drying_fast');
    assert.equal(moistureTrend({ soilHistory: soil('moist', 'slightly_dry', 'very_dry') }), 'balanced');
  });
});

describe('isRose', () => {
  it('recognises the genus Rosa', () => {
    assert.ok(isRose({ name: 'Courtyard Climber', species: 'Rosa rubiginosa' }));
    assert.ok(isRose({ name: 'Iceberg', species: 'Rosa "Iceberg"' }));
  });

  it('accepts a user-named rose with no known species', () => {
    assert.ok(isRose({ name: 'Grandma’s Rose', species: 'Custom Specimen' }));
  });

  it('rejects plants that only have "rose" in their name', () => {
    assert.equal(isRose({ name: 'Rosemary', species: 'Salvia rosmarinus' }), false);
    assert.equal(isRose({ name: 'Adenium (Desert Rose / Impala Lily)', species: 'Adenium obesum' }), false);
    assert.equal(isRose({ name: 'Rose Apple', species: 'Syzygium jambos' }), false);
    assert.equal(isRose({ name: 'Rosemary', species: 'Custom Specimen' }), false);
    assert.equal(isRose({ name: 'My Desert Rose', species: '' }), false);
  });
});

describe('generateDailyRoutine: soil checks', () => {
  it('skips a default indoor plant checked and watered today', () => {
    assert.deepEqual(taskIds([makePlant()]), []);
  });

  it('asks for a first reading on a plant that has never been checked', () => {
    const plant = makePlant({ lastSoilCheck: undefined, lastWatered: undefined });
    const [task] = generateDailyRoutine([plant], calm).soilChecks;
    assert.match(task.whyToday, /No soil check has been logged/);
    assert.doesNotMatch(task.whyToday, /999/);
  });

  it('checks a default indoor plant after three days', () => {
    const plant = makePlant({ lastSoilCheck: daysAgo(3), lastWatered: daysAgo(1) });
    assert.deepEqual(taskIds([plant]), ['soil-plant-1']);
  });

  it('waits longer when the last checks found the soil still moist', () => {
    const base = { soilHistory: soil('moist', 'moist', 'very_wet'), lastWatered: daysAgo(1) };
    assert.deepEqual(taskIds([makePlant({ ...base, lastSoilCheck: daysAgo(4) })]), []);
    assert.deepEqual(taskIds([makePlant({ ...base, lastSoilCheck: daysAgo(5) })]), ['soil-plant-1']);
  });

  it('checks sooner when the soil has been drying fast', () => {
    const plant = makePlant({
      soilHistory: soil('very_dry', 'very_dry', 'slightly_dry'),
      lastSoilCheck: daysAgo(2),
      lastWatered: daysAgo(1),
    });
    assert.deepEqual(taskIds([plant]), ['soil-plant-1']);
  });

  it('leaves low-light plants alone for a week', () => {
    const snake = (days: number) =>
      makePlant({ lightRequirement: 'low_light', lastSoilCheck: daysAgo(days), lastWatered: daysAgo(days) });
    assert.deepEqual(taskIds([snake(6)]), []);
    assert.deepEqual(taskIds([snake(7)]), ['soil-plant-1']);
  });

  it('flags a very dry last reading as urgent', () => {
    const plant = makePlant({ soilHistory: soil('moist', 'very_dry') });
    const [task] = generateDailyRoutine([plant], calm).soilChecks;
    assert.equal(task.urgent, true);
  });

  it('asks for a check before watering outdoor pots when rain is likely', () => {
    const plant = makePlant({ indoorOutdoor: 'outdoor' });
    const [task] = generateDailyRoutine([plant], makeWeather({ rainProbability: 70 })).soilChecks;
    assert.match(task.whyToday, /Rain is expected \(70% chance\)/);
  });

  it('checks outdoor herbs daily', () => {
    const herb = makePlant({ indoorOutdoor: 'outdoor', category: 'herb', lastSoilCheck: daysAgo(1) });
    assert.deepEqual(taskIds([herb]), ['soil-plant-1']);
  });

  it('works without weather and never mentions conditions it does not know', () => {
    const plant = makePlant({ indoorOutdoor: 'outdoor', lastSoilCheck: daysAgo(4), lastWatered: daysAgo(4) });
    const routine = generateDailyRoutine([plant], null);
    assert.equal(routine.soilChecks.length, 1);
    assert.doesNotMatch(routine.soilChecks[0].whyToday, /°C|Rain|humidity/i);
    assert.equal(routine.shelterTasks.length, 0);
  });
});

describe('generateDailyRoutine: grooming', () => {
  const longAgo = { createdAt: daysAgo(60) };

  it('does not ask anyone to deadhead rosemary', () => {
    const rosemary = makePlant({ ...longAgo, name: 'Rosemary', species: 'Salvia rosmarinus', category: 'herb' });
    assert.equal(generateDailyRoutine([rosemary], calm).pruningTasks.length, 0);
  });

  it('gives roses rose-specific deadheading instructions', () => {
    const rose = makePlant({ ...longAgo, name: 'Courtyard Rose', species: 'Rosa rubiginosa' });
    const [task] = generateDailyRoutine([rose], calm).pruningTasks;
    assert.equal(task.id, 'prune-plant-1');
    assert.match(task.description, /5-leaflet/);
  });

  it('gives other flowering plants generic deadheading instructions', () => {
    const petunia = makePlant({ ...longAgo, name: 'Petunia', pruningNeeds: 'Deadhead faded flowers weekly' });
    const [task] = generateDailyRoutine([petunia], calm).pruningTasks;
    assert.doesNotMatch(task.description, /5-leaflet/);
  });

  it('asks at most once a week', () => {
    const rose = (prunedDaysAgo: number) =>
      makePlant({
        ...longAgo,
        species: 'Rosa hybrida',
        careHistory: [careEvent('prune', daysAgo(prunedDaysAgo))],
      });
    assert.equal(generateDailyRoutine([rose(1)], calm).pruningTasks.length, 0);
    assert.equal(generateDailyRoutine([rose(6)], calm).pruningTasks.length, 0);
    assert.equal(generateDailyRoutine([rose(7)], calm).pruningTasks.length, 1);
  });

  it('does not nag about a plant added today', () => {
    const rose = makePlant({ species: 'Rosa hybrida', createdAt: daysAgo(0) });
    assert.equal(generateDailyRoutine([rose], calm).pruningTasks.length, 0);
  });

  it('reminds basil growers to pinch weekly', () => {
    const basil = makePlant({ ...longAgo, name: 'Balcony Sweet Basil', species: 'Ocimum basilicum' });
    assert.deepEqual(generateDailyRoutine([basil], calm).pruningTasks.map((t) => t.id), ['pinch-plant-1']);
  });
});

describe('generateDailyRoutine: light and shelter', () => {
  it('rotates indoor plants every two weeks', () => {
    const fresh = makePlant({ createdAt: daysAgo(13) });
    const due = makePlant({ createdAt: daysAgo(14) });
    assert.equal(generateDailyRoutine([fresh], calm).lightChecks.length, 0);
    assert.deepEqual(generateDailyRoutine([due], calm).lightChecks.map((t) => t.id), ['rotate-plant-1']);
  });

  it('does not rotate low-light or outdoor plants', () => {
    const old = { createdAt: daysAgo(90) };
    assert.equal(generateDailyRoutine([makePlant({ ...old, lightRequirement: 'low_light' })], calm).lightChecks.length, 0);
    assert.equal(generateDailyRoutine([makePlant({ ...old, indoorOutdoor: 'outdoor' })], calm).lightChecks.length, 0);
  });

  it('suggests moving plants kept in a dim hallway toward light', () => {
    const plant = makePlant({ location: 'Hallway Shelf' });
    assert.deepEqual(generateDailyRoutine([plant], calm).lightChecks.map((t) => t.id), ['light-plant-1']);
  });

  it('raises an urgent shelter task for tender outdoor plants on a cold night', () => {
    const cold = makeWeather({ dailyForecast: [{ date: '2026-01-01', tempMax: 18, tempMin: 9, rainProb: 0, uvMax: 2, weatherCode: 1 }] });
    const tender = makePlant({ indoorOutdoor: 'outdoor', humidityPreference: 'high' });
    const hardy = makePlant({ id: 'plant-2', indoorOutdoor: 'outdoor', humidityPreference: 'low' });
    const routine = generateDailyRoutine([tender, hardy], cold);
    assert.deepEqual(routine.shelterTasks.map((t) => t.id), ['shelter-plant-1']);
    assert.equal(routine.shelterTasks[0].urgent, true);
  });
});

describe('generateDailyRoutine: task state and time estimate', () => {
  const plant = makePlant({ lastSoilCheck: daysAgo(5), lastWatered: daysAgo(5) });

  it('reflects completed and snoozed tasks', () => {
    const done = generateDailyRoutine([plant], calm, new Set(['soil-plant-1']));
    const snoozed = generateDailyRoutine([plant], calm, new Set(), new Map([['soil-plant-1', daysAgo(0)]]));
    assert.equal(done.soilChecks[0].status, 'completed');
    assert.equal(snoozed.soilChecks[0].status, 'snoozed');
  });

  it('estimates at least five minutes', () => {
    assert.equal(generateDailyRoutine([], calm).estimatedMinutes, 5);
  });
});

describe('generateEnvironmentInsights', () => {
  it('says so when weather is unavailable instead of inventing conditions', () => {
    const insight = generateEnvironmentInsights(null, [makePlant({ indoorOutdoor: 'outdoor' })]);
    assert.equal(insight.headline, 'Live weather is unavailable');
    assert.deepEqual(insight.alerts, []);
    assert.doesNotMatch(insight.summary + insight.outdoorSynthesis, /\d+°C|\d+%/);
  });

  it('raises heat, cold, rain and UV alerts from real thresholds', () => {
    const weather = makeWeather({
      temperature: 34,
      rainProbability: 60,
      uvIndex: 9,
      dailyForecast: [{ date: '2026-01-01', tempMax: 34, tempMin: 10, rainProb: 60, uvMax: 9, weatherCode: 1 }],
    });
    const types = generateEnvironmentInsights(weather, [makePlant({ indoorOutdoor: 'outdoor' })]).alerts.map((a) => a.type);
    assert.deepEqual(types.sort(), ['cold', 'heat', 'light', 'rain']);
  });

  it('raises nothing on a mild day', () => {
    assert.deepEqual(generateEnvironmentInsights(calm, [makePlant()]).alerts, []);
  });
});

describe('attention and missed care', () => {
  it('surfaces plants whose last reading was very dry', () => {
    const [item] = getPlantsNeedingAttention([makePlant({ soilHistory: soil('very_dry') })]);
    assert.equal(item.badge, 'Dry Soil');
  });

  it('does not count newly added plants as missed care', () => {
    const fresh = (id: string) => makePlant({ id, lastSoilCheck: undefined, lastWatered: undefined, createdAt: daysAgo(0) });
    assert.equal(checkMissedCare([fresh('a'), fresh('b'), fresh('c')]).missedCount, 0);
  });

  it('only calls care "missed" when several plants are overdue', () => {
    const overdue = (id: string) => makePlant({ id, lastSoilCheck: daysAgo(6), lastWatered: daysAgo(8) });
    assert.equal(checkMissedCare([overdue('a')]).hasMissedTasks, false);
    assert.equal(checkMissedCare([overdue('a'), overdue('b')]).hasMissedTasks, true);
  });
});

describe('soilCheckIntervalDays', () => {
  it('matches the cadence the daily routine uses', () => {
    assert.equal(soilCheckIntervalDays(makePlant()), 3);
    assert.equal(soilCheckIntervalDays(makePlant({ lightRequirement: 'low_light' })), 7);
    assert.equal(soilCheckIntervalDays(makePlant({ soilHistory: soil('moist', 'moist') })), 5);
    assert.equal(soilCheckIntervalDays(makePlant({ soilHistory: soil('very_dry', 'very_dry') })), 2);
    assert.equal(soilCheckIntervalDays(makePlant({ indoorOutdoor: 'outdoor' })), 3);
    assert.equal(soilCheckIntervalDays(makePlant({ indoorOutdoor: 'outdoor', category: 'herb' })), 1);
  });
});
