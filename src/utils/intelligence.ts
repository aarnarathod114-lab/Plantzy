import { Plant, PlantTask, WeatherInfo, SoilCondition } from '../types/plant';

export interface GroupedRoutine {
  soilChecks: PlantTask[];
  lightChecks: PlantTask[];
  pruningTasks: PlantTask[];
  shelterTasks: PlantTask[];
  fertilizerTasks: PlantTask[];
  allTasks: PlantTask[];
  estimatedMinutes: number;
}

export interface EnvironmentInsight {
  headline: string;
  summary: string;
  alerts: Array<{
    type: 'heat' | 'cold' | 'rain' | 'humidity' | 'light';
    title: string;
    description: string;
    affectedPlants: string[];
  }>;
  outdoorSynthesis: string;
  indoorSynthesis: string;
}

export interface MissedCareSummary {
  hasMissedTasks: boolean;
  missedCount: number;
  prioritySteps: Array<{
    plantName: string;
    task: string;
    reason: string;
  }>;
}

/** Whole days since an ISO date. A missing or unparseable date counts as "long ago". */
export function daysSince(dateStr?: string, now: number = Date.now()): number {
  if (!dateStr) return 999;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return 999;
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

export type MoistureTrend = 'holding_moisture' | 'drying_fast' | 'balanced' | 'unknown';

/**
 * What the last three soil checks say about how this pot behaves.
 * This is the "learning" in Plantzy: it changes how often a plant is checked.
 */
export function moistureTrend(plant: Pick<Plant, 'soilHistory'>): MoistureTrend {
  const recent = plant.soilHistory.slice(-3);
  if (recent.length < 2) return 'unknown';
  const wet = recent.filter((h) => h.condition === 'moist' || h.condition === 'very_wet').length;
  const dry = recent.filter((h) => h.condition === 'very_dry').length;
  if (wet >= 2) return 'holding_moisture';
  if (dry >= 2) return 'drying_fast';
  return 'balanced';
}

const hasWord = (text: string | undefined, word: string) =>
  new RegExp(`\\b${word}\\b`, 'i').test(text ?? '');

/**
 * True roses only. A plain substring test on "rose" also matches Rosemary,
 * Desert Rose, Moss Rose and Rose Apple, none of which are deadheaded like a rose.
 */
export function isRose(plant: Pick<Plant, 'name' | 'species'>): boolean {
  const species = plant.species.trim();
  if (/^rosa\b/i.test(species)) return true;
  const speciesUnknown = species === '' || /^custom specimen$/i.test(species);
  return speciesUnknown && /\broses?\b/i.test(plant.name) && !/\b(desert|moss|sun)\s+rose\b|\brose\s+(apple|of sharon|geranium)\b/i.test(plant.name);
}

export function isBasil(plant: Pick<Plant, 'name' | 'species'>): boolean {
  return hasWord(plant.name, 'basil') || /^ocimum\s+basilicum\b/i.test(plant.species.trim());
}

function lastEventDate(plant: Plant, type: Plant['careHistory'][number]['taskType']): string {
  // careHistory is stored newest-first. Fall back to when the plant was added so a
  // brand-new plant is not immediately "overdue" for everything.
  return plant.careHistory.find((c) => c.taskType === type)?.date ?? plant.createdAt;
}

export const ROTATION_INTERVAL_DAYS = 14;
export const GROOMING_INTERVAL_DAYS = 7;

/** Plants kept somewhere dim get a "move toward light" prompt instead of a routine rotation. */
export function isInLowLightSpot(plant: Pick<Plant, 'location' | 'notes'>): boolean {
  const location = plant.location.toLowerCase();
  return (
    location.includes('hallway') ||
    location.includes('dark') ||
    Boolean(plant.notes?.toLowerCase().includes('low hallway light'))
  );
}

/** Indoor plants lean toward their light source; anything not in deep shade benefits from a turn. */
export function needsRotation(plant: Plant): boolean {
  return (
    (plant.indoorOutdoor === 'indoor' && plant.lightRequirement !== 'low_light') ||
    hasWord(plant.name, 'monstera') ||
    hasWord(plant.name, 'aloe')
  );
}

export function wantsDeadheading(plant: Plant): boolean {
  return (
    isRose(plant) ||
    plant.pruningNeeds.toLowerCase().includes('deadhead') ||
    Boolean(plant.notes?.toLowerCase().includes('spent bloom'))
  );
}

/**
 * Baseline days between soil checks, ignoring today's weather. The daily
 * routine tightens this in heat, rain and dry air; the calendar uses it to
 * project ahead.
 */
export function soilCheckIntervalDays(plant: Plant): number {
  if (plant.indoorOutdoor === 'outdoor') {
    return plant.category === 'herb' || isBasil(plant) ? 1 : 3;
  }
  const trend = moistureTrend(plant);
  if (trend === 'holding_moisture') return 5;
  if (trend === 'drying_fast') return 2;
  if (plant.lightRequirement === 'low_light') return 7;
  return 3;
}

// Generate the personalized daily routine
export function generateDailyRoutine(
  plants: Plant[],
  weather: WeatherInfo | null,
  completedTaskIds: Set<string> = new Set(),
  snoozedTaskIds: Map<string, string> = new Map()
): GroupedRoutine {
  const currentTemp = weather?.temperature ?? 22;
  const currentHumidity = weather?.humidity ?? 55;
  const rainProb = weather?.rainProbability ?? 15;
  const isHot = currentTemp >= 28;
  const isCold = currentTemp <= 13;
  const isRainy = rainProb >= 40;

  const soilChecks: PlantTask[] = [];
  const lightChecks: PlantTask[] = [];
  const pruningTasks: PlantTask[] = [];
  const shelterTasks: PlantTask[] = [];
  const fertilizerTasks: PlantTask[] = [];

  plants.forEach((plant) => {
    const daysSinceWatered = daysSince(plant.lastWatered);
    const daysSinceSoilCheck = daysSince(plant.lastSoilCheck);
    const lastSoil = plant.soilHistory[plant.soilHistory.length - 1]?.condition;

    // What recent observations say about this particular pot
    const trend = moistureTrend(plant);

    // 1. Water / Soil Check Recommendation Logic
    let needsSoilCheck = false;
    let soilCheckWhy = '';

    if (!plant.lastSoilCheck) {
      // A plant with no reading yet: the first check is what the adaptive schedule is built on.
      needsSoilCheck = true;
      soilCheckWhy = `No soil check has been logged for this plant yet. A first reading tells Plantzy how this pot behaves.`;
    } else if (plant.indoorOutdoor === 'outdoor') {
      if (isRainy) {
        needsSoilCheck = true;
        soilCheckWhy = `Rain is expected (${rainProb}% chance). Check the soil before watering to avoid waterlogged roots.`;
      } else if (isHot) {
        needsSoilCheck = daysSinceSoilCheck >= 1 || daysSinceWatered >= 2;
        soilCheckWhy = `Today's warm temperature (${currentTemp}°C) increases moisture loss from the soil. Check top layer before watering.`;
      } else if (plant.category === 'herb' || isBasil(plant)) {
        needsSoilCheck = daysSinceSoilCheck >= 1;
        soilCheckWhy = `Herbs in pots lose moisture quickly. Daily morning soil check ensures roots stay balanced.`;
      } else if (lastSoil === 'very_dry') {
        needsSoilCheck = true;
        soilCheckWhy = `Previous check recorded very dry soil. Inspect depth before deciding whether to water.`;
      } else if (daysSinceSoilCheck >= 3) {
        needsSoilCheck = true;
        soilCheckWhy = `Last soil check was ${daysSinceSoilCheck} days ago. Inspect moisture before weekend warmth.`;
      }
    } else {
      // Indoor plants
      if (lastSoil === 'very_dry') {
        needsSoilCheck = true;
        soilCheckWhy = `Last observation showed dry soil. Check if top 2 inches still feel dry before watering.`;
      } else if (plant.humidityPreference === 'high' && currentHumidity < 45) {
        needsSoilCheck = daysSinceSoilCheck >= 2;
        soilCheckWhy = `Low ambient humidity (${currentHumidity}%) speeds up surface dryness. Check root zone.`;
      } else if (trend === 'holding_moisture') {
        // Learned: stays moist longer!
        needsSoilCheck = daysSinceSoilCheck >= 5;
        soilCheckWhy = `Plantzy noticed your soil stayed moist in recent checks. Scheduling checks less frequently to protect roots.`;
      } else if (trend === 'drying_fast') {
        // Learned: dries fast!
        needsSoilCheck = daysSinceSoilCheck >= 2;
        soilCheckWhy = `This plant has been drying out faster recently. Checking earlier to keep hydration steady.`;
      } else if (plant.lightRequirement === 'low_light') {
        // Snake plant, ZZ plant
        needsSoilCheck = daysSinceSoilCheck >= 7 || daysSinceWatered >= 14;
        soilCheckWhy = `Low-light plants transpire slowly. Confirm the soil is completely dry before adding water.`;
      } else {
        needsSoilCheck = daysSinceSoilCheck >= 3 || daysSinceWatered >= 4;
        soilCheckWhy = `Last soil check was ${daysSinceSoilCheck} days ago. Top 2 inches typically dry within 3–4 days.`;
      }
    }

    if (needsSoilCheck) {
      const taskId = `soil-${plant.id}`;
      soilChecks.push({
        id: taskId,
        plantId: plant.id,
        plantName: plant.name,
        plantSpecies: plant.species,
        plantImage: plant.image,
        indoorOutdoor: plant.indoorOutdoor,
        location: plant.location,
        taskType: 'soil_check',
        title: `Check soil moisture`,
        description: `Check the top layer of soil (1–2 inches) before deciding whether to water.`,
        whyToday: soilCheckWhy,
        urgent: lastSoil === 'very_dry' || (plant.status === 'needs_attention' && daysSinceSoilCheck >= 3),
        status: completedTaskIds.has(taskId)
          ? 'completed'
          : snoozedTaskIds.has(taskId)
          ? 'snoozed'
          : 'pending',
        dueDate: 'Today',
      });
    }

    // 2. Light Check / Rotation Tasks
    const hasBeenInLowLight = isInLowLightSpot(plant);

    if (hasBeenInLowLight) {
      const taskId = `light-${plant.id}`;
      lightChecks.push({
        id: taskId,
        plantId: plant.id,
        plantName: plant.name,
        plantSpecies: plant.species,
        plantImage: plant.image,
        indoorOutdoor: plant.indoorOutdoor,
        location: plant.location,
        taskType: 'light_rotate',
        title: `Rotate or move toward brighter filtered light`,
        description: `Give this plant 1–2 days of gentle filtered light or rotate 90° for balanced growth.`,
        whyToday: `Plant has been in lower light for multiple weeks. A gentle light rotation maintains leaf vigor.`,
        urgent: false,
        status: completedTaskIds.has(taskId)
          ? 'completed'
          : snoozedTaskIds.has(taskId)
          ? 'snoozed'
          : 'pending',
        dueDate: 'Today',
      });
    } else if (needsRotation(plant)) {
      const daysSinceRotate = daysSince(lastEventDate(plant, 'light_rotate'));
      if (daysSinceRotate >= ROTATION_INTERVAL_DAYS) {
        const taskId = `rotate-${plant.id}`;
        lightChecks.push({
          id: taskId,
          plantId: plant.id,
          plantName: plant.name,
          plantSpecies: plant.species,
          plantImage: plant.image,
          indoorOutdoor: plant.indoorOutdoor,
          location: plant.location,
          taskType: 'light_rotate',
          title: `Quarter-turn light rotation`,
          description: `Rotate pot 90 degrees to ensure even sun exposure on all foliage sides.`,
          whyToday: `No rotation logged in ${daysSinceRotate} days. Plants naturally lean toward the window over time.`,
          urgent: false,
          status: completedTaskIds.has(taskId)
            ? 'completed'
            : snoozedTaskIds.has(taskId)
            ? 'snoozed'
            : 'pending',
          dueDate: 'Today',
        });
      }
    }

    // 3. Pruning / Grooming (at most weekly, so the routine does not nag every day)
    const daysSinceGroomed = daysSince(lastEventDate(plant, 'prune'));
    const rose = isRose(plant);
    if (wantsDeadheading(plant) && daysSinceGroomed >= GROOMING_INTERVAL_DAYS) {
      const taskId = `prune-${plant.id}`;
      pruningTasks.push({
        id: taskId,
        plantId: plant.id,
        plantName: plant.name,
        plantSpecies: plant.species,
        plantImage: plant.image,
        indoorOutdoor: plant.indoorOutdoor,
        location: plant.location,
        taskType: 'pruning',
        title: `Deadhead spent blooms`,
        description: rose
          ? `Snip spent flowers just above the first 5-leaflet leaf set using clean shears.`
          : `Pinch or snip faded flowers back to the nearest healthy leaf or bud using clean shears.`,
        whyToday: `Removing faded blooms channels the plant's energy into fresh buds instead of seed.`,
        urgent: false,
        status: completedTaskIds.has(taskId)
          ? 'completed'
          : snoozedTaskIds.has(taskId)
          ? 'snoozed'
          : 'pending',
        dueDate: 'Today',
      });
    } else if (isBasil(plant) && daysSinceGroomed >= GROOMING_INTERVAL_DAYS) {
      const taskId = `pinch-${plant.id}`;
      pruningTasks.push({
        id: taskId,
        plantId: plant.id,
        plantName: plant.name,
        plantSpecies: plant.species,
        plantImage: plant.image,
        indoorOutdoor: plant.indoorOutdoor,
        location: plant.location,
        taskType: 'pruning',
        title: `Pinch top shoot nodes`,
        description: `Pinch the center top pair of leaves to stimulate lateral branching and prevent early flowering.`,
        whyToday: `Routine weekly pinching keeps basil bushy, flavorful, and prevents bitter flowering.`,
        urgent: false,
        status: completedTaskIds.has(taskId)
          ? 'completed'
          : snoozedTaskIds.has(taskId)
          ? 'snoozed'
          : 'pending',
        dueDate: 'Today',
      });
    }

    // 4. Temperature / Cold Protection Alerts
    const minNightTemp = weather?.dailyForecast?.[0]?.tempMin ?? 14;
    if (plant.indoorOutdoor === 'outdoor' && minNightTemp <= 12 && plant.humidityPreference === 'high') {
      const taskId = `shelter-${plant.id}`;
      shelterTasks.push({
        id: taskId,
        plantId: plant.id,
        plantName: plant.name,
        plantSpecies: plant.species,
        plantImage: plant.image,
        indoorOutdoor: plant.indoorOutdoor,
        location: plant.location,
        taskType: 'shelter',
        title: `Move indoors tonight`,
        description: `Tonight's temperature is forecast to drop to ${minNightTemp}°C, which is uncomfortable for sensitive leaves.`,
        whyToday: `Tropical and tender plants can suffer cellular chill stress below 13°C. Shelter them indoors for the night.`,
        urgent: true,
        status: completedTaskIds.has(taskId)
          ? 'completed'
          : snoozedTaskIds.has(taskId)
          ? 'snoozed'
          : 'pending',
        dueDate: 'Tonight',
      });
    }
  });

  const allTasks = [...soilChecks, ...lightChecks, ...pruningTasks, ...shelterTasks, ...fertilizerTasks];
  const pendingTasks = allTasks.filter((t) => t.status === 'pending');

  // Estimate care time: ~2 mins per soil check, ~3 mins per pruning, ~1 min per rotation, ~2 min per shelter
  const estimatedMinutes = Math.max(
    5,
    soilChecks.length * 2 + lightChecks.length * 1 + pruningTasks.length * 3 + shelterTasks.length * 2
  );

  return {
    soilChecks,
    lightChecks,
    pruningTasks,
    shelterTasks,
    fertilizerTasks,
    allTasks,
    estimatedMinutes,
  };
}

// Generate Environmental Insights with plant-specific synthesis
export function generateEnvironmentInsights(
  weather: WeatherInfo | null,
  plants: Plant[]
): EnvironmentInsight {
  // Without live weather there is nothing true to say about today's conditions,
  // so say that instead of describing an invented day.
  if (!weather) {
    return {
      headline: 'Live weather is unavailable',
      summary:
        'Today\'s recommendations are based on your soil checks and care history only. Weather-based advice returns when conditions can be loaded.',
      alerts: [],
      outdoorSynthesis:
        plants.some((p) => p.indoorOutdoor === 'outdoor')
          ? 'Weather is unavailable, so check outdoor pots by hand: feel the soil before watering and look at the sky before leaving tender plants out overnight.'
          : 'No outdoor plants currently registered.',
      indoorSynthesis:
        plants.some((p) => p.indoorOutdoor === 'indoor')
          ? 'Indoor conditions change slowly. Keep checking soil moisture before watering.'
          : 'No indoor plants currently registered.',
    };
  }

  const temp = weather.temperature;
  const humidity = weather.humidity;
  const uv = weather.uvIndex;
  const rain = weather.rainProbability;
  const minTemp = weather.dailyForecast[0]?.tempMin ?? temp;

  const outdoorPlants = plants.filter((p) => p.indoorOutdoor === 'outdoor');
  const indoorPlants = plants.filter((p) => p.indoorOutdoor === 'indoor');

  const alerts: EnvironmentInsight['alerts'] = [];

  // Heat check
  if (temp >= 28) {
    alerts.push({
      type: 'heat',
      title: 'Warm Afternoon Alert',
      description: `Temperatures reaching ${temp}°C. Check outdoor plants earlier in the day and avoid unnecessary afternoon exposure.`,
      affectedPlants: outdoorPlants.map((p) => p.name),
    });
  }

  // Cold night check
  if (minTemp <= 12) {
    alerts.push({
      type: 'cold',
      title: 'Cool Night Temperatures',
      description: `Temperatures are expected to drop to ${minTemp}°C tonight. Your tropical or delicate plants may need shelter.`,
      affectedPlants: plants.filter((p) => p.humidityPreference === 'high').map((p) => p.name),
    });
  }

  // Rain check
  if (rain >= 35) {
    alerts.push({
      type: 'rain',
      title: 'Rain Probability Insight',
      description: `Rain probability is ${rain}%. Outdoor containers will catch precipitation—check soil depth before watering.`,
      affectedPlants: outdoorPlants.map((p) => p.name),
    });
  }

  // UV / Sun check
  if (uv >= 6) {
    alerts.push({
      type: 'light',
      title: 'High UV Index',
      description: `UV index is ${uv} (High). Outdoor plants like Aloe enjoy morning light, but hot direct afternoon glare may cause scorch.`,
      affectedPlants: outdoorPlants.map((p) => p.name),
    });
  }

  const outdoorSynthesis = outdoorPlants.length > 0
    ? `Your outdoor ${outdoorPlants[0].name}${outdoorPlants.length > 1 ? ` and ${outdoorPlants[1].name}` : ''} will experience ${temp}°C conditions and ${humidity}% humidity. Prioritize morning soil checks rather than fixed watering schedules.`
    : 'No outdoor plants currently registered.';

  const indoorSynthesis = indoorPlants.length > 0
    ? `Indoor temperatures remain stable, but if plants are near drafty windows or air vents, monitor moisture evaporation rates closely.`
    : 'No indoor plants currently registered.';

  const headline = temp >= 28
    ? 'Warm and active growing conditions today'
    : rain >= 40
    ? 'Overcast with precipitation expected'
    : 'Gentle, balanced seasonal environment';

  const summary = `Today outside is ${temp}°C with ${humidity}% humidity and a UV index of ${uv}. Recommendations have adapted to prioritize root soil checks rather than fixed timers.`;

  return {
    headline,
    summary,
    alerts,
    outdoorSynthesis,
    indoorSynthesis,
  };
}

// Generate Missed-Care Recovery guidance
export function checkMissedCare(plants: Plant[]): MissedCareSummary {
  const overduePlants: Array<{ plantName: string; task: string; reason: string }> = [];

  plants.forEach((plant) => {
    // A plant that was only just added has not been "missed"; measure from when it joined.
    const daysSinceSoil = daysSince(plant.lastSoilCheck ?? plant.createdAt);
    const daysSinceWater = daysSince(plant.lastWatered ?? plant.createdAt);

    if (daysSinceSoil >= 5 && daysSinceWater >= 7) {
      overduePlants.push({
        plantName: plant.name,
        task: 'Check soil moisture',
        reason: `Last checked ${daysSinceSoil} days ago. Quick check will get it back on track.`,
      });
    }
  });

  return {
    hasMissedTasks: overduePlants.length >= 2,
    missedCount: overduePlants.length,
    prioritySteps: overduePlants.slice(0, 3),
  };
}

// Plants Needing Attention
export function getPlantsNeedingAttention(plants: Plant[]): Array<{
  plant: Plant;
  reason: string;
  badge: string;
  actionText: string;
}> {
  const result: Array<{
    plant: Plant;
    reason: string;
    badge: string;
    actionText: string;
  }> = [];

  plants.forEach((plant) => {
    const lastSoil = plant.soilHistory[plant.soilHistory.length - 1]?.condition;
    const daysSinceCheck = daysSince(plant.lastSoilCheck);

    if (lastSoil === 'very_dry') {
      result.push({
        plant,
        reason: `${plant.name} soil was recorded as very dry on last check.`,
        badge: 'Dry Soil',
        actionText: 'Check Moisture',
      });
    } else if (plant.status === 'needs_attention') {
      const reason = plant.notes?.includes('deadheading')
        ? `${plant.name} has spent blooms ready for grooming.`
        : `${plant.name} could use an environmental check today.`;
      result.push({
        plant,
        reason,
        badge: 'Attention',
        actionText: 'Inspect',
      });
    } else if (
      plant.location.toLowerCase().includes('hallway') &&
      plant.lightRequirement !== 'low_light'
    ) {
      result.push({
        plant,
        reason: `${plant.name} has been in low hallway light and needs rotating toward sun.`,
        badge: 'Low Light',
        actionText: 'Rotate',
      });
    }
  });

  return result;
}
