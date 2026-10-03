import type { Plant, PlantTask } from '../types/plant';
import {
  GROOMING_INTERVAL_DAYS,
  ROTATION_INTERVAL_DAYS,
  isBasil,
  isInLowLightSpot,
  needsRotation,
  soilCheckIntervalDays,
  wantsDeadheading,
} from './intelligence';

/**
 * Forward projection of the care schedule.
 *
 * Today's tasks come from the routine engine, which reacts to live weather.
 * Future days cannot know the weather or what tomorrow's soil check will find,
 * so they are projected from each plant's baseline interval and labelled as a
 * projection in the UI.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ProjectedTask {
  id: string;
  plantId: string;
  plantName: string;
  taskType: PlantTask['taskType'];
  title: string;
  indoorOutdoor: Plant['indoorOutdoor'];
}

/** Local calendar day as `YYYY-MM-DD`. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole calendar days from today to the given ISO date (negative = in the past). */
function dayOffset(iso: string | undefined, today: number): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((startOfDay(t) - today) / DAY_MS);
}

function lastOf(plant: Plant, type: Plant['careHistory'][number]['taskType']): string {
  return plant.careHistory.find((event) => event.taskType === type)?.date ?? plant.createdAt;
}

/**
 * Project tasks for each of the next `horizonDays` days (tomorrow onwards).
 * Keys are local `YYYY-MM-DD` day keys.
 */
export function projectSchedule(
  plants: Plant[],
  now: number = Date.now(),
  horizonDays = 31
): Map<string, ProjectedTask[]> {
  const today = startOfDay(now);
  const schedule = new Map<string, ProjectedTask[]>();

  const add = (offset: number, task: ProjectedTask) => {
    const d = new Date(today);
    const key = dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset));
    const list = schedule.get(key);
    if (list) list.push(task);
    else schedule.set(key, [task]);
  };

  const repeat = (
    lastIso: string | undefined,
    interval: number,
    make: (offset: number) => ProjectedTask
  ) => {
    const last = dayOffset(lastIso, today);
    const due = last === null ? 0 : last + interval;
    // Anything due today or earlier is on today's routine; assume it gets done today.
    for (let offset = due <= 0 ? interval : due; offset <= horizonDays; offset += interval) {
      add(offset, make(offset));
    }
  };

  for (const plant of plants) {
    const base = { plantId: plant.id, plantName: plant.name, indoorOutdoor: plant.indoorOutdoor };

    repeat(plant.lastSoilCheck ?? plant.createdAt, soilCheckIntervalDays(plant), (offset) => ({
      ...base,
      id: `proj-soil-${plant.id}-${offset}`,
      taskType: 'soil_check',
      title: 'Check soil moisture',
    }));

    if (!isInLowLightSpot(plant) && needsRotation(plant)) {
      repeat(lastOf(plant, 'light_rotate'), ROTATION_INTERVAL_DAYS, (offset) => ({
        ...base,
        id: `proj-rotate-${plant.id}-${offset}`,
        taskType: 'light_rotate',
        title: 'Quarter-turn light rotation',
      }));
    }

    if (wantsDeadheading(plant)) {
      repeat(lastOf(plant, 'prune'), GROOMING_INTERVAL_DAYS, (offset) => ({
        ...base,
        id: `proj-prune-${plant.id}-${offset}`,
        taskType: 'pruning',
        title: 'Deadhead spent blooms',
      }));
    } else if (isBasil(plant)) {
      repeat(lastOf(plant, 'prune'), GROOMING_INTERVAL_DAYS, (offset) => ({
        ...base,
        id: `proj-pinch-${plant.id}-${offset}`,
        taskType: 'pruning',
        title: 'Pinch top shoots',
      }));
    }
  }

  return schedule;
}

/** Care the user logged on a given local day, newest first. */
export function careLoggedOn(plants: Plant[], key: string): ProjectedTask[] {
  const items: Array<ProjectedTask & { at: number }> = [];
  for (const plant of plants) {
    for (const event of plant.careHistory) {
      if (event.id.startsWith('init-')) continue;
      const at = new Date(event.date).getTime();
      if (Number.isNaN(at) || dayKey(new Date(at)) !== key) continue;
      items.push({
        at,
        id: `log-${plant.id}-${event.id}`,
        plantId: plant.id,
        plantName: plant.name,
        taskType:
          event.taskType === 'prune'
            ? 'pruning'
            : event.taskType === 'light_rotate'
            ? 'light_rotate'
            : 'soil_check',
        title: event.action,
        indoorOutdoor: plant.indoorOutdoor,
      });
    }
  }
  return items.sort((a, b) => b.at - a.at).map(({ at: _at, ...task }) => task);
}

export interface UpcomingWindow {
  label: string;
  taskCount: number;
  /** Distinct plant names with something due in this window, in schedule order. */
  plantNames: string[];
}

/** Tomorrow, days 2–3 and days 4–7, for the dashboard's "Upcoming" card. */
export function summariseUpcoming(schedule: Map<string, ProjectedTask[]>, now: number = Date.now()): UpcomingWindow[] {
  const today = new Date(startOfDay(now));
  const window = (label: string, from: number, to: number): UpcomingWindow => {
    const names = new Set<string>();
    let taskCount = 0;
    for (let offset = from; offset <= to; offset++) {
      const key = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
      for (const task of schedule.get(key) ?? []) {
        taskCount += 1;
        names.add(task.plantName);
      }
    }
    return { label, taskCount, plantNames: [...names] };
  };
  return [window('Tomorrow', 1, 1), window('In 2–3 days', 2, 3), window('In 4–7 days', 4, 7)];
}
