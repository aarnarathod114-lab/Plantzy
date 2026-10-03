import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDemoPlants, DEMO_PLANTS } from '../src/data/demoData';
import { fitWithin } from '../src/utils/image';
import { computeCareStats, computeSoilPatterns, listNames } from '../src/utils/insights';
import { careLoggedOn, dayKey, projectSchedule, summariseUpcoming } from '../src/utils/schedule';
import { careEvent, makePlant, soil } from './helpers';

// Local noon keeps day arithmetic stable in every timezone and across DST changes.
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();
const at = (daysBack: number) => new Date(2026, 5, 15 - daysBack, 9, 0, 0).toISOString();
const keyAhead = (days: number) => dayKey(new Date(2026, 5, 15 + days));

describe('computeCareStats', () => {
  it('reports zeros for a collection with no logged care', () => {
    assert.deepEqual(computeCareStats([makePlant()], NOW), { completedThisWeek: 0, streakDays: 0, totalCareEvents: 0 });
  });

  it('ignores the bookkeeping entry written when a plant is added', () => {
    const plant = makePlant({ careHistory: [careEvent('observation', at(0), 'init-123')] });
    assert.equal(computeCareStats([plant], NOW).totalCareEvents, 0);
  });

  it('counts a streak of consecutive days ending today', () => {
    const plant = makePlant({ careHistory: [0, 1, 2, 4].map((d) => careEvent('soil_check', at(d))) });
    assert.equal(computeCareStats([plant], NOW).streakDays, 3);
  });

  it('keeps yesterday’s streak alive until today is over', () => {
    const plant = makePlant({ careHistory: [1, 2].map((d) => careEvent('soil_check', at(d))) });
    assert.equal(computeCareStats([plant], NOW).streakDays, 2);
  });

  it('resets the streak after a missed day', () => {
    const plant = makePlant({ careHistory: [2, 3, 4].map((d) => careEvent('soil_check', at(d))) });
    assert.equal(computeCareStats([plant], NOW).streakDays, 0);
  });

  it('counts only the last seven days as this week, across all plants', () => {
    const a = makePlant({ careHistory: [0, 3, 6].map((d) => careEvent('soil_check', at(d))) });
    const b = makePlant({ id: 'plant-2', careHistory: [1, 9, 30].map((d) => careEvent('water', at(d))) });
    const stats = computeCareStats([a, b], NOW);
    assert.equal(stats.completedThisWeek, 4);
    assert.equal(stats.totalCareEvents, 6);
  });
});

describe('computeSoilPatterns', () => {
  it('groups plants by what their recent soil checks show', () => {
    const wet = makePlant({ id: 'wet', soilHistory: soil('moist', 'very_wet', 'moist') });
    const dry = makePlant({ id: 'dry', soilHistory: soil('very_dry', 'very_dry'), indoorOutdoor: 'outdoor' });
    const fresh = makePlant({ id: 'new', soilHistory: soil('moist') });
    const mixed = makePlant({ id: 'mixed', soilHistory: soil('moist', 'slightly_dry', 'very_dry') });

    const patterns = computeSoilPatterns([wet, dry, fresh, mixed]);
    assert.deepEqual(patterns.holdingMoisture.map((p) => p.id), ['wet']);
    assert.deepEqual(patterns.dryingFast.map((p) => p.id), ['dry']);
    assert.deepEqual(patterns.needMoreData.map((p) => p.id), ['new']);
    // Only indoor plants have their check interval adapted by the engine.
    assert.equal(patterns.schedulesAdapted, 1);
  });
});

describe('listNames', () => {
  it('joins names readably', () => {
    assert.equal(listNames([]), '');
    assert.equal(listNames(['A']), 'A');
    assert.equal(listNames(['A', 'B']), 'A and B');
    assert.equal(listNames(['A', 'B', 'C']), 'A, B and C');
    assert.equal(listNames(['A', 'B', 'C', 'D', 'E']), 'A, B and 3 more');
  });
});

describe('projectSchedule', () => {
  it('repeats soil checks at the plant’s baseline interval', () => {
    const plant = makePlant({ lastSoilCheck: at(1), createdAt: at(1) });
    const schedule = projectSchedule([plant], NOW, 10);
    const soilDays = [...schedule.entries()]
      .filter(([, tasks]) => tasks.some((t) => t.taskType === 'soil_check'))
      .map(([key]) => key)
      .sort();
    assert.deepEqual(soilDays, [keyAhead(2), keyAhead(5), keyAhead(8)]);
  });

  it('assumes overdue tasks are done today and schedules the next one after that', () => {
    const plant = makePlant({ lastSoilCheck: at(20), createdAt: at(1) });
    const schedule = projectSchedule([plant], NOW, 4);
    assert.equal(schedule.has(keyAhead(1)), false);
    assert.deepEqual(schedule.get(keyAhead(3))?.map((t) => t.taskType), ['soil_check']);
  });

  it('never schedules anything for today or the past', () => {
    const schedule = projectSchedule([makePlant({ lastSoilCheck: at(30), createdAt: at(90) })], NOW, 30);
    assert.ok([...schedule.keys()].every((key) => key > keyAhead(0)));
  });

  it('includes rotations and weekly grooming where they apply', () => {
    const rose = makePlant({
      species: 'Rosa hybrida',
      indoorOutdoor: 'outdoor',
      createdAt: at(3),
      lastSoilCheck: at(0),
    });
    const fern = makePlant({ id: 'plant-2', createdAt: at(10), lastSoilCheck: at(0) });
    const schedule = projectSchedule([rose, fern], NOW, 14);
    assert.ok(schedule.get(keyAhead(4))?.some((t) => t.taskType === 'pruning' && t.plantId === 'plant-1'));
    assert.ok(schedule.get(keyAhead(4))?.some((t) => t.taskType === 'light_rotate' && t.plantId === 'plant-2'));
  });

  it('summarises the week ahead without double counting plants', () => {
    const herb = makePlant({ indoorOutdoor: 'outdoor', category: 'herb', lastSoilCheck: at(0), createdAt: at(0) });
    const [tomorrow, soon, later] = summariseUpcoming(projectSchedule([herb], NOW, 7), NOW);
    assert.deepEqual([tomorrow.taskCount, soon.taskCount, later.taskCount], [1, 2, 4]);
    assert.deepEqual(tomorrow.plantNames, ['Test Plant']);
    assert.deepEqual(later.plantNames, ['Test Plant']);
  });
});

describe('careLoggedOn', () => {
  it('returns what was logged on that local day, newest first', () => {
    const plant = makePlant({
      careHistory: [
        careEvent('soil_check', new Date(2026, 5, 14, 8).toISOString(), 'morning'),
        careEvent('prune', new Date(2026, 5, 14, 18).toISOString(), 'evening'),
        careEvent('water', new Date(2026, 5, 13, 8).toISOString(), 'earlier'),
        careEvent('observation', new Date(2026, 5, 14, 9).toISOString(), 'init-1'),
      ],
    });
    const logged = careLoggedOn([plant], dayKey(new Date(2026, 5, 14)));
    assert.deepEqual(logged.map((t) => t.taskType), ['pruning', 'soil_check']);
  });
});

describe('getDemoPlants', () => {
  it('keeps the demo current by shifting every date relative to now', () => {
    const now = Date.parse('2030-03-01T08:00:00.000Z');
    const plants = getDemoPlants(now);
    const newest = Math.max(...plants.flatMap((p) => p.careHistory.map((c) => Date.parse(c.date))));
    assert.ok(now - newest >= 0 && now - newest < 2 * 24 * 60 * 60 * 1000, 'latest demo activity should be within two days');
    assert.equal(plants.length, DEMO_PLANTS.length);
    assert.ok(plants.every((p) => Date.parse(p.createdAt) < now));
  });

  it('does not mutate the source dataset', () => {
    const before = JSON.stringify(DEMO_PLANTS);
    getDemoPlants(Date.parse('2031-01-01T00:00:00.000Z'));
    assert.equal(JSON.stringify(DEMO_PLANTS), before);
  });
});

describe('fitWithin', () => {
  it('scales the long edge down and keeps the aspect ratio', () => {
    assert.deepEqual(fitWithin(4000, 3000, 1280), { width: 1280, height: 960 });
    assert.deepEqual(fitWithin(3000, 4000, 1280), { width: 960, height: 1280 });
  });

  it('never enlarges a small image', () => {
    assert.deepEqual(fitWithin(640, 480, 1280), { width: 640, height: 480 });
  });

  it('never returns a zero-sized canvas', () => {
    assert.deepEqual(fitWithin(10000, 2, 480), { width: 480, height: 1 });
    assert.deepEqual(fitWithin(0, 0, 480), { width: 1, height: 1 });
  });
});
