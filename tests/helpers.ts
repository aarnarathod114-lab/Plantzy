import type { CareEvent, Plant, SoilCondition, WeatherInfo } from '../src/types/plant';

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO timestamp `days` days before `now`. */
export function daysAgo(days: number, now: number = Date.now()): string {
  return new Date(now - days * DAY_MS).toISOString();
}

export function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'plant-1',
    name: 'Test Plant',
    species: 'Testus plantus',
    image: '',
    location: 'Living Room Window',
    indoorOutdoor: 'indoor',
    potSize: 'Medium',
    soilType: 'Potting mix',
    drainage: 'has_drainage',
    lightRequirement: 'bright_indirect',
    waterGuidance: 'Water when the top inch is dry',
    temperatureRange: '18°C–28°C',
    humidityPreference: 'medium',
    fertilizingSchedule: 'Monthly',
    pruningNeeds: 'Remove yellow leaves',
    soilHistory: [],
    careHistory: [],
    createdAt: daysAgo(1),
    status: 'healthy',
    lastSoilCheck: daysAgo(0),
    lastWatered: daysAgo(0),
    ...overrides,
  };
}

export function soil(...conditions: SoilCondition[]): Plant['soilHistory'] {
  return conditions.map((condition, i) => ({ date: daysAgo(conditions.length - i), condition }));
}

export function careEvent(taskType: CareEvent['taskType'], date: string, id = `care-${taskType}-${date}`): CareEvent {
  return { id, plantId: 'plant-1', plantName: 'Test Plant', taskType, date, action: 'Logged' };
}

export function makeWeather(overrides: Partial<WeatherInfo> = {}): WeatherInfo {
  return {
    location: 'Testville',
    temperature: 22,
    feelsLike: 22,
    humidity: 55,
    uvIndex: 3,
    rainProbability: 10,
    windSpeed: 5,
    weatherCode: 1,
    sunrise: '06:30',
    sunset: '18:30',
    dailyForecast: [{ date: '2026-01-01', tempMax: 26, tempMin: 16, rainProb: 10, uvMax: 4, weatherCode: 1 }],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}
