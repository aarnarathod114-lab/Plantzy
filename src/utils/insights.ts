import type { CareEvent, Plant } from '../types/plant';
import { moistureTrend } from './intelligence';

/**
 * Everything on the Insights screen is derived here from what the user has
 * actually logged. If there is no data yet, the numbers are zero.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Care the user performed. Excludes the bookkeeping entry written when a plant is added. */
function loggedCare(plants: Plant[]): CareEvent[] {
  return plants.flatMap((plant) => plant.careHistory.filter((event) => !event.id.startsWith('init-')));
}

export interface CareStats {
  /** Care events logged in the last seven days. */
  completedThisWeek: number;
  /** Consecutive calendar days with at least one care event, ending today or yesterday. */
  streakDays: number;
  /** All care events ever logged. */
  totalCareEvents: number;
}

export function computeCareStats(plants: Plant[], now: number = Date.now()): CareStats {
  const events = loggedCare(plants);
  const times = events.map((event) => new Date(event.date).getTime()).filter((t) => !Number.isNaN(t));

  const completedThisWeek = times.filter((t) => t <= now && now - t < 7 * DAY_MS).length;

  const activeDays = new Set(times.map((t) => dayKey(new Date(t))));
  const today = new Date(now);
  const dayOffset = (offset: number) =>
    dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset));

  // A streak survives until the end of the next day, so start from yesterday if today is still empty.
  let offset = activeDays.has(dayOffset(0)) ? 0 : 1;
  let streakDays = 0;
  while (activeDays.has(dayOffset(offset))) {
    streakDays += 1;
    offset += 1;
  }

  return { completedThisWeek, streakDays, totalCareEvents: times.length };
}

export interface SoilPatterns {
  /** Soil was moist or wet in at least two of the last three checks. */
  holdingMoisture: Plant[];
  /** Soil was very dry in at least two of the last three checks. */
  dryingFast: Plant[];
  /** Plants with fewer than two soil readings, so no pattern can be read yet. */
  needMoreData: Plant[];
  /** Indoor plants whose check interval the engine has lengthened or shortened. */
  schedulesAdapted: number;
}

export function computeSoilPatterns(plants: Plant[]): SoilPatterns {
  const holdingMoisture: Plant[] = [];
  const dryingFast: Plant[] = [];
  const needMoreData: Plant[] = [];

  for (const plant of plants) {
    const trend = moistureTrend(plant);
    if (trend === 'holding_moisture') holdingMoisture.push(plant);
    else if (trend === 'drying_fast') dryingFast.push(plant);
    else if (trend === 'unknown') needMoreData.push(plant);
  }

  const schedulesAdapted = [...holdingMoisture, ...dryingFast].filter(
    (plant) => plant.indoorOutdoor === 'indoor'
  ).length;

  return { holdingMoisture, dryingFast, needMoreData, schedulesAdapted };
}

/** "A", "A and B", "A, B and C", "A, B and 3 more". */
export function listNames(names: string[], max = 3): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length <= max) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${names.slice(0, max - 1).join(', ')} and ${names.length - (max - 1)} more`;
}
