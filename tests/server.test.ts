import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { offlineAnswer } from '../server/offlineAssistant';
import { createRateLimiter } from '../server/rateLimit';
import { TimeoutError, firstSuccessful, uniqueInOrder, withTimeout } from '../server/resilience';
import {
  LIMITS,
  ValidationError,
  boundedJson,
  cleanText,
  normaliseHealthAnalysis,
  normaliseIdentification,
  parseCoordinate,
  parseImage,
} from '../server/validation';
import {
  WeatherError,
  createWeatherService,
  normaliseForecast,
  parseCityQuery,
  pickGeoResult,
  type GeoResult,
} from '../server/weather';

describe('rate limiter', () => {
  it('allows up to the limit, then blocks until the window resets', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    assert.equal(limiter.check('ip', 0).allowed, true);
    assert.deepEqual(limiter.check('ip', 1_000), { allowed: true, remaining: 0, retryAfterSec: 59 });
    const blocked = limiter.check('ip', 30_000);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfterSec, 30);
    assert.equal(limiter.check('ip', 60_000).allowed, true);
  });

  it('tracks each key separately', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    assert.equal(limiter.check('a', 0).allowed, true);
    assert.equal(limiter.check('b', 0).allowed, true);
    assert.equal(limiter.check('a', 1).allowed, false);
  });

  it('never tracks more keys than its cap', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 5, maxKeys: 100 });
    for (let i = 0; i < 1_000; i++) limiter.check(`ip-${i}`, i);
    assert.ok(limiter.size() <= 100);
  });

  it('drops expired windows before evicting live ones', () => {
    const limiter = createRateLimiter({ windowMs: 1_000, max: 5, maxKeys: 2 });
    limiter.check('old-1', 0);
    limiter.check('old-2', 0);
    limiter.check('new', 5_000);
    assert.equal(limiter.size(), 1);
  });
});

describe('cleanText', () => {
  it('trims, collapses whitespace and strips control characters', () => {
    assert.equal(cleanText('  hello\n\tworld\u0000  ', 50), 'hello world');
  });

  it('enforces the length cap and rejects non-strings', () => {
    assert.equal(cleanText('abcdef', 3), 'abc');
    assert.equal(cleanText(42, 10), '');
    assert.equal(cleanText({ toString: () => 'x' }, 10), '');
  });
});

describe('parseImage', () => {
  const png = Buffer.from('fake image bytes').toString('base64');

  it('returns null when no image was sent', () => {
    assert.equal(parseImage(undefined), null);
    assert.equal(parseImage(''), null);
  });

  it('reads the MIME type from a data URL', () => {
    assert.deepEqual(parseImage(`data:image/png;base64,${png}`), { mimeType: 'image/png', data: png });
  });

  it('accepts bare base64 with a MIME hint, defaulting to JPEG', () => {
    assert.equal(parseImage(png, 'image/webp')?.mimeType, 'image/webp');
    assert.equal(parseImage(png)?.mimeType, 'image/jpeg');
  });

  it('rejects types that are not photos', () => {
    assert.throws(() => parseImage(`data:image/svg+xml;base64,${png}`), ValidationError);
    assert.throws(() => parseImage(`data:text/html;base64,${png}`), ValidationError);
  });

  it('rejects data that is not base64', () => {
    assert.throws(() => parseImage('data:image/png;base64,<script>'), ValidationError);
    assert.throws(() => parseImage(123), ValidationError);
  });

  it('rejects images over the size limit', () => {
    const tooBig = 'A'.repeat(Math.ceil((LIMITS.imageBytes * 4) / 3) + 8);
    assert.throws(() => parseImage(tooBig), /too large/);
  });
});

describe('boundedJson and parseCoordinate', () => {
  it('serialises small values and drops oversized or circular ones', () => {
    assert.equal(boundedJson({ a: 1 }), '{"a":1}');
    assert.equal(boundedJson({ big: 'x'.repeat(100) }, 50), '{}');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    assert.equal(boundedJson(circular), '{}');
    assert.equal(boundedJson(undefined), '{}');
  });

  it('accepts only in-range numeric coordinates', () => {
    assert.equal(parseCoordinate('19.07', -90, 90), 19.07);
    assert.equal(parseCoordinate('91', -90, 90), null);
    assert.equal(parseCoordinate('abc', -90, 90), null);
    assert.equal(parseCoordinate(undefined, -90, 90), null);
    assert.equal(parseCoordinate('', -90, 90), null);
  });
});

describe('normaliseIdentification', () => {
  it('returns null when the model did not name a plant', () => {
    assert.equal(normaliseIdentification({ name: '' }), null);
    assert.equal(normaliseIdentification(null), null);
    assert.equal(normaliseIdentification('Monstera'), null);
    assert.equal(normaliseIdentification([{ name: 'Monstera' }]), null);
  });

  it('clamps confidence and coerces unknown enum values to safe defaults', () => {
    const plant = normaliseIdentification({
      name: ' Monstera ',
      species: 'Monstera deliciosa',
      confidence: 140,
      indoorOutdoor: 'greenhouse',
      lightRequirement: 'full_moon',
    });
    assert.ok(plant);
    assert.equal(plant.name, 'Monstera');
    assert.equal(plant.confidence, 100);
    assert.equal(plant.indoorOutdoor, 'indoor');
    assert.equal(plant.lightRequirement, 'bright_indirect');
  });

  it('treats a missing or non-numeric confidence as zero, not as certainty', () => {
    assert.equal(normaliseIdentification({ name: 'Fern' })?.confidence, 0);
    assert.equal(normaliseIdentification({ name: 'Fern', confidence: 'high' })?.confidence, 0);
  });

  it('keeps valid values', () => {
    const plant = normaliseIdentification({ name: 'Rose', confidence: 71.6, indoorOutdoor: 'outdoor', lightRequirement: 'direct_sun' });
    assert.deepEqual(
      [plant?.confidence, plant?.indoorOutdoor, plant?.lightRequirement],
      [72, 'outdoor', 'direct_sun']
    );
  });
});

describe('normaliseHealthAnalysis', () => {
  it('returns null for an empty or malformed analysis', () => {
    assert.equal(normaliseHealthAnalysis({}), null);
    assert.equal(normaliseHealthAnalysis({ observedSigns: 'yellow leaves' }), null);
  });

  it('keeps only string list items and caps list length', () => {
    const analysis = normaliseHealthAnalysis({
      observedSigns: ['Yellow leaves', 7, null, '  '],
      actionChecklist: Array.from({ length: 20 }, (_, i) => `Step ${i}`),
      summary: 'May indicate overwatering.',
    });
    assert.deepEqual(analysis?.observedSigns, ['Yellow leaves']);
    assert.equal(analysis?.actionChecklist.length, 8);
    assert.deepEqual(analysis?.potentialFactors, []);
  });
});

describe('city parsing and geocoding choice', () => {
  const places: GeoResult[] = [
    { name: 'San Francisco', latitude: -31.4, longitude: -62.1, admin1: 'Córdoba', country: 'Argentina', country_code: 'AR' },
    { name: 'San Francisco', latitude: 37.77, longitude: -122.42, admin1: 'California', country: 'United States', country_code: 'US' },
  ];

  it('splits a place name from its qualifier', () => {
    assert.deepEqual(parseCityQuery('San Francisco, CA'), { name: 'San Francisco', qualifier: 'ca' });
    assert.deepEqual(parseCityQuery('Pune'), { name: 'Pune', qualifier: '' });
    assert.deepEqual(parseCityQuery('  '), { name: '', qualifier: '' });
  });

  it('uses the qualifier to choose between places with the same name', () => {
    assert.equal(pickGeoResult(places, 'ca')?.admin1, 'California');
    assert.equal(pickGeoResult(places, 'us')?.admin1, 'California');
    assert.equal(pickGeoResult(places, 'argentina')?.admin1, 'Córdoba');
  });

  it('matches multi-word state abbreviations', () => {
    const springfields: GeoResult[] = [
      { name: 'Springfield', latitude: 1, longitude: 1, admin1: 'Illinois', country_code: 'US' },
      { name: 'Springfield', latitude: 2, longitude: 2, admin1: 'New Jersey', country_code: 'US' },
    ];
    assert.equal(pickGeoResult(springfields, 'nj')?.admin1, 'New Jersey');
  });

  it('falls back to the most relevant result when the qualifier matches nothing', () => {
    assert.equal(pickGeoResult(places, 'zz')?.admin1, 'Córdoba');
    assert.equal(pickGeoResult(places, '')?.admin1, 'Córdoba');
    assert.equal(pickGeoResult([], 'ca'), null);
  });
});

const FORECAST = {
  current: {
    temperature_2m: 31.6, relative_humidity_2m: 71.2, apparent_temperature: 36.4,
    precipitation_probability: 20, weather_code: 3, uv_index: 7.4, wind_speed_10m: 11.2,
  },
  daily: {
    time: ['2026-06-15', '2026-06-16'],
    temperature_2m_max: [33.2, 32.1],
    temperature_2m_min: [26.4, 25.9],
    precipitation_probability_max: [65, 80],
    uv_index_max: [9.1, 8.2],
    weather_code: [3, 61],
    sunrise: ['2026-06-15T06:01', '2026-06-16T06:01'],
    sunset: ['2026-06-15T19:15', '2026-06-16T19:16'],
  },
};

describe('normaliseForecast', () => {
  it('maps an Open-Meteo payload onto WeatherInfo', () => {
    const weather = normaliseForecast(FORECAST, 'Mumbai, Maharashtra', Date.parse('2026-06-15T05:00:00Z'));
    assert.equal(weather.location, 'Mumbai, Maharashtra');
    assert.equal(weather.temperature, 32);
    assert.equal(weather.feelsLike, 36);
    assert.equal(weather.humidity, 71);
    assert.equal(weather.uvIndex, 7);
    assert.equal(weather.sunrise, '06:01');
    assert.equal(weather.dailyForecast.length, 2);
    assert.deepEqual(weather.dailyForecast[1], { date: '2026-06-16', tempMax: 32, tempMin: 26, rainProb: 80, uvMax: 8, weatherCode: 61 });
    assert.equal(weather.timestamp, '2026-06-15T05:00:00.000Z');
  });

  it('uses today’s peak rain chance rather than the chance this hour', () => {
    assert.equal(normaliseForecast(FORECAST, 'x', 0).rainProbability, 65);
  });

  it('refuses to invent temperature or humidity when the provider omits them', () => {
    assert.throws(() => normaliseForecast({ current: { relative_humidity_2m: 50 } }, 'x', 0), WeatherError);
    assert.throws(() => normaliseForecast({ current: { temperature_2m: 20 } }, 'x', 0), WeatherError);
    assert.throws(() => normaliseForecast(null, 'x', 0), WeatherError);
  });
});

describe('weather service', () => {
  function fakeFetch(routes: Record<string, { ok?: boolean; status?: number; body?: unknown } | Error>) {
    const calls: string[] = [];
    const fetch = async (url: string) => {
      calls.push(url);
      const key = Object.keys(routes).find((k) => url.includes(k));
      const route = key ? routes[key] : undefined;
      if (!route) throw new Error(`unexpected fetch: ${url}`);
      if (route instanceof Error) throw route;
      return { ok: route.ok ?? true, status: route.status ?? 200, json: async () => route.body };
    };
    return { fetch, calls };
  }

  const geo = { results: [{ name: 'Mumbai', latitude: 19.07, longitude: 72.88, admin1: 'Maharashtra', country_code: 'IN' }] };

  it('geocodes the city, fetches the forecast and labels the result', async () => {
    const { fetch, calls } = fakeFetch({ 'geocoding-api': { body: geo }, 'api.open-meteo.com': { body: FORECAST } });
    const service = createWeatherService({ fetch, now: () => 1_000, timeoutMs: 1_000 });
    const weather = await service.get({ city: 'Mumbai, IN' });
    assert.equal(weather.location, 'Mumbai, Maharashtra');
    assert.equal(calls.length, 2);
    assert.match(calls[0], /name=Mumbai&/);
    assert.match(calls[1], /latitude=19\.07&longitude=72\.88/);
  });

  it('serves repeat requests from cache until the entry expires', async () => {
    const { fetch, calls } = fakeFetch({ 'geocoding-api': { body: geo }, 'api.open-meteo.com': { body: FORECAST } });
    let now = 0;
    const service = createWeatherService({ fetch, now: () => now, timeoutMs: 1_000 });
    await service.get({ city: 'Mumbai' });
    await service.get({ city: 'mumbai' });
    assert.equal(calls.length, 2, 'second request should not hit the network');
    now = 11 * 60 * 1000;
    await service.get({ city: 'Mumbai' });
    assert.equal(calls.length, 4);
  });

  it('skips geocoding when coordinates are supplied', async () => {
    const { fetch, calls } = fakeFetch({ 'api.open-meteo.com': { body: FORECAST } });
    const service = createWeatherService({ fetch, now: () => 0, timeoutMs: 1_000 });
    const weather = await service.get({ lat: 12.97, lon: 77.59 });
    assert.equal(calls.length, 1);
    assert.equal(weather.location, 'Your location');
  });

  it('reports an unknown city instead of substituting another place', async () => {
    const { fetch } = fakeFetch({ 'geocoding-api': { body: {} } });
    const service = createWeatherService({ fetch, now: () => 0, timeoutMs: 1_000 });
    await assert.rejects(service.get({ city: 'Qwertyville' }), (err: WeatherError) => err.code === 'city_not_found');
  });

  it('reports provider failures instead of returning made-up weather', async () => {
    const down = fakeFetch({ 'geocoding-api': { body: geo }, 'api.open-meteo.com': { ok: false, status: 503 } });
    const offline = fakeFetch({ 'geocoding-api': new Error('network down') });
    for (const { fetch } of [down, offline]) {
      const service = createWeatherService({ fetch, now: () => 0, timeoutMs: 1_000 });
      await assert.rejects(service.get({ city: 'Mumbai' }), (err: WeatherError) => err.code === 'upstream_unavailable');
    }
  });

  it('does not cache failures', async () => {
    let healthy = false;
    const calls: string[] = [];
    const fetch = async (url: string) => {
      calls.push(url);
      if (url.includes('geocoding-api')) return { ok: true, status: 200, json: async () => geo };
      return { ok: healthy, status: healthy ? 200 : 500, json: async () => FORECAST };
    };
    const service = createWeatherService({ fetch, now: () => 0, timeoutMs: 1_000 });
    await assert.rejects(service.get({ city: 'Mumbai' }));
    healthy = true;
    assert.equal((await service.get({ city: 'Mumbai' })).temperature, 32);
  });
});

describe('offlineAnswer', () => {
  it('routes common questions to the matching guidance', () => {
    assert.match(offlineAnswer('What should I do before my vacation?'), /Plant Sitter/);
    assert.match(offlineAnswer('Why is my basil drooping?'), /Drooping/);
    assert.match(offlineAnswer('Leaves have brown spots'), /discolouration/);
    assert.match(offlineAnswer('Can I move my aloe outside?'), /acclimatise/);
    assert.match(offlineAnswer('Should I water today?'), /feel the soil/);
  });

  it('always gives a usable general answer', () => {
    assert.ok(offlineAnswer('asdf').length > 50);
  });
});

describe('model fallback', () => {
  const overloaded = Object.assign(new Error('high demand'), { status: 503 });
  const options = { budgetMs: 1_000, perAttemptMs: 200 };

  it('returns the first model that succeeds and stops there', async () => {
    const tried: string[] = [];
    const result = await firstSuccessful(['a', 'b', 'c'], async (model) => {
      tried.push(model);
      if (model === 'a') throw overloaded;
      return `answer from ${model}`;
    }, options);
    assert.equal(result, 'answer from b');
    assert.deepEqual(tried, ['a', 'b']);
  });

  it('reports each failure and throws the last error when every model fails', async () => {
    const failures: string[] = [];
    await assert.rejects(
      firstSuccessful(['a', 'b'], async () => { throw overloaded; }, { ...options, onFailure: (model) => failures.push(model) }),
      (err: Error & { status?: number }) => err.status === 503
    );
    assert.deepEqual(failures, ['a', 'b']);
  });

  it('moves on when a model is too slow', async () => {
    const result = await firstSuccessful(['slow', 'fast'], (model) =>
      model === 'slow' ? new Promise<string>(() => {}) : Promise.resolve('fast answer'),
      { budgetMs: 1_000, perAttemptMs: 20 });
    assert.equal(result, 'fast answer');
  });

  it('stops trying once the overall budget is spent', async () => {
    let clock = 0;
    const tried: string[] = [];
    await assert.rejects(
      firstSuccessful(['a', 'b', 'c'], async (model) => {
        tried.push(model);
        clock += 600;
        throw overloaded;
      }, { budgetMs: 1_000, perAttemptMs: 500, now: () => clock }),
      TimeoutError
    );
    assert.deepEqual(tried, ['a', 'b']);
  });

  it('rejects an empty model list', async () => {
    await assert.rejects(firstSuccessful([], async () => 'x', options), /No candidates/);
  });

  it('times out a promise that never settles', async () => {
    await assert.rejects(withTimeout(new Promise(() => {}), 10), TimeoutError);
    assert.equal(await withTimeout(Promise.resolve(7), 10), 7);
  });

  it('builds the model list without duplicates or blanks', () => {
    assert.deepEqual(uniqueInOrder(['gemini-a', ' gemini-b ', '', 'gemini-a']), ['gemini-a', 'gemini-b']);
  });
});
