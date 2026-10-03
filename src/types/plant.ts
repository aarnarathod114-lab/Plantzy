export type SoilCondition = 'very_dry' | 'slightly_dry' | 'moist' | 'very_wet' | 'not_checked';

export interface CareEvent {
  id: string;
  plantId: string;
  plantName: string;
  taskType: 'soil_check' | 'water' | 'light_rotate' | 'prune' | 'fertilize' | 'move_shelter' | 'mist' | 'repot' | 'observation';
  date: string;
  action: string;
  soilCondition?: SoilCondition;
  notes?: string;
  environmentalContext?: {
    temperature?: number;
    weatherDescription?: string;
    humidity?: number;
  };
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  image: string;
  location: string;
  indoorOutdoor: 'indoor' | 'outdoor';
  potSize: string;
  soilType: string;
  drainage: 'has_drainage' | 'no_drainage' | 'self_watering';
  lightRequirement: 'low_light' | 'medium_light' | 'bright_indirect' | 'direct_sun';
  waterGuidance: string;
  temperatureRange: string;
  humidityPreference: 'low' | 'medium' | 'high';
  fertilizingSchedule: string;
  pruningNeeds: string;
  category?: 'foliage' | 'succulent' | 'herb' | 'flowering' | 'tropical' | 'medicinal' | 'fruit_edible' | 'bonsai';
  vernacularName?: string;
  lastWatered?: string;
  lastSoilCheck?: string;
  soilHistory: Array<{
    date: string;
    condition: SoilCondition;
    notes?: string;
  }>;
  careHistory: CareEvent[];
  notes?: string;
  createdAt: string;
  status: 'healthy' | 'needs_attention' | 'monitoring' | 'warning';
  soilMoistureTrend?: 'drying_fast' | 'holding_moisture' | 'balanced' | 'unknown';
}

export interface PlantTask {
  id: string;
  plantId: string;
  plantName: string;
  plantSpecies: string;
  plantImage: string;
  indoorOutdoor: 'indoor' | 'outdoor';
  location: string;
  taskType: 'soil_check' | 'water' | 'light_rotate' | 'pruning' | 'shelter' | 'fertilizing' | 'misting';
  title: string;
  description: string;
  whyToday: string;
  urgent: boolean;
  status: 'pending' | 'completed' | 'skipped' | 'snoozed';
  dueDate: string;
  snoozedUntil?: string;
}

export interface WeatherInfo {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  uvIndex: number;
  rainProbability: number;
  windSpeed: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
  dailyForecast: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    rainProb: number;
    uvMax: number;
    weatherCode: number;
  }>;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  city: string;
  units: 'celsius' | 'fahrenheit';
  reminderTimes: string[];
  quietHoursStart: string;
  quietHoursEnd: string;
  notificationsEnabled: boolean;
  isOnboarded: boolean;
  vacationMode: {
    active: boolean;
    startDate?: string;
    endDate?: string;
    notes?: string;
  };
}

export interface CatalogPlant {
  id: string;
  name: string;
  species: string;
  category: 'foliage' | 'succulent' | 'herb' | 'flowering' | 'tropical' | 'medicinal' | 'fruit_edible' | 'bonsai';
  vernacularName?: string;
  image: string;
  indoorOutdoor: 'indoor' | 'outdoor';
  lightRequirement: 'low_light' | 'medium_light' | 'bright_indirect' | 'direct_sun';
  lightLabel: string;
  waterGuidance: string;
  soilPreference: string;
  temperatureRange: string;
  humidityPreference: 'low' | 'medium' | 'high';
  potSize: string;
  pruningNotes: string;
  fertilizingNotes: string;
  careTip: string;
}

/** A hand-written catalog entry. Its image is generated when the catalog is assembled. */
export type CatalogEntry = Omit<CatalogPlant, 'image'>;
