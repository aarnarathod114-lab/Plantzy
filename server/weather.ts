import type { WeatherInfo } from '../src/types/plant';

/**
 * Weather service backed by Open-Meteo (no API key required).
 *
 * Design notes:
 * - Failures surface as errors. Plantzy never substitutes invented weather,
 *   because the care engine turns these numbers into advice.
 * - Responses are cached briefly so repeat visits do not hammer a free API.
 */

export type WeatherErrorCode = 'city_not_found' | 'upstream_unavailable';

export class WeatherError extends Error {
  readonly code: WeatherErrorCode;

  constructor(code: WeatherErrorCode, message: string) {
    super(message);
    this.name = 'WeatherError';
    this.code = code;
  }
}

export interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
  country_code?: string;
}

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export interface WeatherDeps {
  fetch: FetchLike;
  now: () => number;
  timeoutMs: number;
}

/** Split "Pune, MH" / "San Francisco, CA" / "Mumbai, IN" into a place name and a qualifier. */
export function parseCityQuery(input: string): { name: string; qualifier: string } {
  const [name = '', ...rest] = input.split(',').map((part) => part.trim());
  return { name, qualifier: rest.join(' ').trim().toLowerCase() };
}

function initials(text: string): string {
  return text
    .split(/[\s-]+/)
    .map((word) => word[0] ?? '')
    .join('')
    .toLowerCase();
}

/**
 * Pick the best geocoding hit. Open-Meteo orders results by relevance and
 * population, so the first one wins unless the user's qualifier (a country
 * code, country, state or state abbreviation) points at a different one.
 */
export function pickGeoResult(results: GeoResult[], qualifier: string): GeoResult | null {
  if (results.length === 0) return null;
  if (!qualifier) return results[0];

  const matches = (r: GeoResult) => {
    const admin = (r.admin1 ?? '').toLowerCase();
    const country = (r.country ?? '').toLowerCase();
    return (
      (r.country_code ?? '').toLowerCase() === qualifier ||
      country === qualifier ||
      admin === qualifier ||
      (admin !== '' && admin.startsWith(qualifier)) ||
      (admin !== '' && initials(admin) === qualifier)
    );
  };
  return results.find(matches) ?? results[0];
}

interface RawForecast {
  current?: Record<string, number | undefined>;
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    uv_index_max?: number[];
    weather_code?: number[];
    sunrise?: string[];
    sunset?: string[];
  };
}

function required(value: number | undefined, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new WeatherError('upstream_unavailable', `Weather provider response is missing "${field}".`);
  }
  return value;
}

/** Convert an Open-Meteo forecast payload into Plantzy's `WeatherInfo`. */
export function normaliseForecast(raw: unknown, location: string, nowMs: number): WeatherInfo {
  const data = (raw ?? {}) as RawForecast;
  const current = data.current ?? {};
  const daily = data.daily ?? {};
  const days = daily.time ?? [];

  // Temperature and humidity drive the care rules, so they must be real.
  const temperature = Math.round(required(current.temperature_2m, 'current.temperature_2m'));
  const humidity = Math.round(required(current.relative_humidity_2m, 'current.relative_humidity_2m'));

  // Today's daily maximum is the better signal for "will it rain on my balcony today".
  const rainToday = daily.precipitation_probability_max?.[0] ?? current.precipitation_probability ?? 0;

  return {
    location,
    temperature,
    feelsLike: Math.round(current.apparent_temperature ?? temperature),
    humidity,
    uvIndex: Math.round(current.uv_index ?? daily.uv_index_max?.[0] ?? 0),
    rainProbability: Math.round(rainToday),
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    weatherCode: current.weather_code ?? 0,
    sunrise: daily.sunrise?.[0]?.split('T')[1] ?? '',
    sunset: daily.sunset?.[0]?.split('T')[1] ?? '',
    dailyForecast: days.map((date, idx) => ({
      date,
      tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? temperature),
      tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? temperature),
      rainProb: Math.round(daily.precipitation_probability_max?.[idx] ?? 0),
      uvMax: Math.round(daily.uv_index_max?.[idx] ?? 0),
      weatherCode: daily.weather_code?.[idx] ?? 0,
    })),
    timestamp: new Date(nowMs).toISOString(),
  };
}

async function fetchJson(deps: WeatherDeps, url: string): Promise<unknown> {
  let response;
  try {
    response = await deps.fetch(url, { signal: AbortSignal.timeout(deps.timeoutMs) });
  } catch {
    throw new WeatherError('upstream_unavailable', 'Could not reach the weather provider.');
  }
  if (!response.ok) {
    throw new WeatherError('upstream_unavailable', `Weather provider returned ${response.status}.`);
  }
  return response.json();
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

export function createWeatherService(deps: WeatherDeps) {
  const cache = new Map<string, { expires: number; value: WeatherInfo }>();

  function remember(key: string, value: WeatherInfo) {
    if (cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { expires: deps.now() + CACHE_TTL_MS, value });
  }

  async function geocode(city: string): Promise<{ lat: number; lon: number; label: string }> {
    const { name, qualifier } = parseCityQuery(city);
    if (!name) throw new WeatherError('city_not_found', 'Enter a city name.');

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`;
    const body = (await fetchJson(deps, url)) as { results?: GeoResult[] };
    const hit = pickGeoResult(body.results ?? [], qualifier);
    if (!hit) throw new WeatherError('city_not_found', `No place found matching "${city}".`);

    return {
      lat: hit.latitude,
      lon: hit.longitude,
      label: [hit.name, hit.admin1].filter(Boolean).join(', '),
    };
  }

  return {
    async get(query: { city?: string; lat?: number | null; lon?: number | null }): Promise<WeatherInfo> {
      const hasCoords = typeof query.lat === 'number' && typeof query.lon === 'number';
      const city = (query.city ?? '').trim();
      const cacheKey = hasCoords
        ? `geo:${query.lat!.toFixed(2)},${query.lon!.toFixed(2)}`
        : `city:${city.toLowerCase()}`;

      const cached = cache.get(cacheKey);
      if (cached && cached.expires > deps.now()) return cached.value;

      const place = hasCoords
        ? { lat: query.lat!, lon: query.lon!, label: city || 'Your location' }
        : await geocode(city);

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,uv_index,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset' +
        '&timezone=auto&forecast_days=7';

      const weather = normaliseForecast(await fetchJson(deps, url), place.label, deps.now());
      remember(cacheKey, weather);
      return weather;
    },
  };
}
