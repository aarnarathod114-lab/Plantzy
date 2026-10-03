import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { Plant, UserProfile, WeatherInfo, PlantTask, SoilCondition, CareEvent } from '../types/plant';
import { DEMO_PLANTS, INITIAL_USER_PROFILE, getDemoPlants } from '../data/demoData';
import { computeCareStats } from '../utils/insights';
import {
  generateDailyRoutine,
  generateEnvironmentInsights,
  getPlantsNeedingAttention,
  checkMissedCare,
  GroupedRoutine,
  EnvironmentInsight,
  MissedCareSummary,
} from '../utils/intelligence';

interface PlantContextType {
  plants: Plant[];
  userProfile: UserProfile;
  weather: WeatherInfo | null;
  loadingWeather: boolean;
  /** Why weather is missing, when it is. Never paired with invented conditions. */
  weatherError: string | null;
  refreshWeather: () => Promise<void>;
  updateCity: (city: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  routine: GroupedRoutine;
  environmentInsights: EnvironmentInsight;
  plantsNeedingAttention: Array<{ plant: Plant; reason: string; badge: string; actionText: string }>;
  missedCareSummary: MissedCareSummary;
  completedTaskIds: Set<string>;
  snoozedTaskIds: Map<string, string>;
  completeTask: (taskId: string, plantId: string, soilCondition?: SoilCondition, notes?: string) => void;
  skipTask: (taskId: string) => void;
  snoozeTask: (taskId: string) => void;
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'careHistory' | 'soilHistory'>) => Plant;
  updatePlant: (plantId: string, updates: Partial<Plant>) => void;
  deletePlant: (plantId: string) => void;
  addCareObservation: (plantId: string, condition?: SoilCondition, notes?: string, taskType?: CareEvent['taskType']) => void;
  resetToDemo: () => void;
  clearUserData: () => void;
  isDemoMode: boolean;
  activeCareSession: boolean;
  setActiveCareSession: (active: boolean) => void;
  stats: {
    totalPlants: number;
    completedThisWeek: number;
    needsMonitoring: number;
    overdueCritical: number;
    streakDays: number;
  };
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

function isStoredPlant(value: unknown): value is Plant {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<Plant>;
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.species === 'string' &&
    Array.isArray(p.soilHistory) &&
    Array.isArray(p.careHistory)
  );
}

const LOCAL_STORAGE_KEY_PLANTS = 'plantzy_plants_v1';
const LOCAL_STORAGE_KEY_PROFILE = 'plantzy_profile_v1';
const LOCAL_STORAGE_KEY_COMPLETED = 'plantzy_completed_tasks_v1';

export const PlantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load plants from localStorage or fallback to demo
  const [plants, setPlants] = useState<Plant[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_PLANTS);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        // Guard against hand-edited or truncated storage taking the whole app down.
        if (Array.isArray(parsed) && parsed.every(isStoredPlant)) return parsed;
        console.warn('Stored plants were not in the expected shape; starting from the demo set.');
      }
    } catch (e) {
      console.error('Failed to parse local plants', e);
    }
    return getDemoPlants();
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return { ...INITIAL_USER_PROFILE, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse user profile', e);
    }
    return INITIAL_USER_PROFILE;
  });

  // Completed tasks today
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_COMPLETED);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only keep if same date
        if (parsed.date === new Date().toISOString().split('T')[0]) {
          return new Set(parsed.taskIds);
        }
      }
    } catch (e) {
      console.error('Failed to parse completed tasks', e);
    }
    return new Set<string>();
  });

  const [snoozedTaskIds, setSnoozedTaskIds] = useState<Map<string, string>>(new Map());
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [activeCareSession, setActiveCareSession] = useState<boolean>(false);
  // Guards against a slow response for a previous city overwriting a newer one.
  const weatherRequest = useRef(0);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PLANTS, JSON.stringify(plants));
    } catch (e) {
      console.error('Failed to save plants', e);
    }
  }, [plants]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(userProfile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_COMPLETED,
        JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          taskIds: Array.from(completedTaskIds),
        })
      );
    } catch (e) {
      console.error('Failed to save completed tasks', e);
    }
  }, [completedTaskIds]);

  // Fetch weather for user's city
  const fetchWeather = async (cityName: string) => {
    const requestId = ++weatherRequest.current;
    setLoadingWeather(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
      const data = await res.json();
      if (requestId !== weatherRequest.current) return;
      if (res.ok && data.success && data.weather) {
        setWeather(data.weather);
        setWeatherError(null);
      } else {
        setWeather(null);
        setWeatherError(data.message || 'Weather is unavailable right now.');
      }
    } catch (err) {
      if (requestId !== weatherRequest.current) return;
      console.warn('Weather fetch failed:', err);
      setWeather(null);
      setWeatherError('Weather is unavailable right now.');
    } finally {
      if (requestId === weatherRequest.current) setLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchWeather(userProfile.city);
  }, [userProfile.city]);

  const refreshWeather = async () => {
    await fetchWeather(userProfile.city);
  };

  const updateCity = async (newCity: string) => {
    // The effect above refetches when the city changes; fetch directly only if it did not.
    if (newCity === userProfile.city) {
      await fetchWeather(newCity);
    } else {
      setUserProfile((prev) => ({ ...prev, city: newCity }));
    }
  };

  const updateUserProfile = (partial: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...partial }));
  };

  // Recompute intelligence daily routine & insights
  const routine = useMemo(() => {
    return generateDailyRoutine(plants, weather, completedTaskIds, snoozedTaskIds);
  }, [plants, weather, completedTaskIds, snoozedTaskIds]);

  const environmentInsights = useMemo(() => {
    return generateEnvironmentInsights(weather, plants);
  }, [weather, plants]);

  const plantsNeedingAttention = useMemo(() => {
    return getPlantsNeedingAttention(plants);
  }, [plants]);

  const missedCareSummary = useMemo(() => {
    return checkMissedCare(plants);
  }, [plants]);

  // Task actions
  const completeTask = (
    taskId: string,
    plantId: string,
    soilCondition?: SoilCondition,
    notes?: string
  ) => {
    setCompletedTaskIds((prev) => new Set([...prev, taskId]));

    setPlants((prevPlants) => {
      return prevPlants.map((plant) => {
        if (plant.id !== plantId) return plant;

        const now = new Date().toISOString();
        const isWaterTask = taskId.startsWith('soil-') || taskId.startsWith('water-');
        const isRotateTask = taskId.startsWith('light-') || taskId.startsWith('rotate-');
        const isPruneTask = taskId.startsWith('prune-') || taskId.startsWith('pinch-');

        const newCareEvent: CareEvent = {
          id: `care-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          plantId: plant.id,
          plantName: plant.name,
          taskType: isWaterTask ? 'soil_check' : isRotateTask ? 'light_rotate' : isPruneTask ? 'prune' : 'observation',
          date: now,
          action: soilCondition
            ? `Checked soil (${soilCondition.replace('_', ' ')})`
            : isRotateTask
            ? 'Rotated toward morning light'
            : isPruneTask
            ? 'Pruned and groomed stems'
            : 'Care completed',
          soilCondition: soilCondition,
          notes: notes,
          environmentalContext: weather
            ? {
                temperature: weather.temperature,
                humidity: weather.humidity,
                weatherDescription: `${weather.temperature}°C, ${weather.humidity}% humidity`,
              }
            : undefined,
        };

        const updatedCareHistory = [newCareEvent, ...plant.careHistory];
        const updatedSoilHistory = soilCondition
          ? [...plant.soilHistory, { date: now, condition: soilCondition, notes }]
          : plant.soilHistory;

        // Adaptive status adjustment based on user input
        let newStatus = plant.status;
        if (soilCondition === 'very_dry') {
          newStatus = 'needs_attention';
        } else if (soilCondition === 'moist' || soilCondition === 'slightly_dry') {
          newStatus = 'healthy';
        }

        return {
          ...plant,
          lastSoilCheck: isWaterTask ? now : plant.lastSoilCheck,
          lastWatered: soilCondition === 'very_dry' || taskId.startsWith('water-') ? now : plant.lastWatered,
          careHistory: updatedCareHistory,
          soilHistory: updatedSoilHistory,
          status: newStatus,
        };
      });
    });
  };

  const skipTask = (taskId: string) => {
    setCompletedTaskIds((prev) => new Set([...prev, taskId]));
  };

  const snoozeTask = (taskId: string) => {
    setSnoozedTaskIds((prev) => {
      const copy = new Map(prev);
      copy.set(taskId, new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString());
      return copy;
    });
  };

  const addCareObservation = (
    plantId: string,
    condition?: SoilCondition,
    notes?: string,
    taskType: CareEvent['taskType'] = 'observation'
  ) => {
    setPlants((prev) =>
      prev.map((plant) => {
        if (plant.id !== plantId) return plant;
        const now = new Date().toISOString();

        const newCare: CareEvent = {
          id: `obs-${Date.now()}`,
          plantId: plant.id,
          plantName: plant.name,
          taskType,
          date: now,
          action: notes || (condition ? `Soil check: ${condition}` : 'Observation logged'),
          soilCondition: condition,
          notes,
          environmentalContext: weather
            ? { temperature: weather.temperature, humidity: weather.humidity }
            : undefined,
        };

        const updatedSoilHistory = condition
          ? [...plant.soilHistory, { date: now, condition, notes }]
          : plant.soilHistory;

        return {
          ...plant,
          lastSoilCheck: condition ? now : plant.lastSoilCheck,
          lastWatered: taskType === 'water' ? now : plant.lastWatered,
          careHistory: [newCare, ...plant.careHistory],
          soilHistory: updatedSoilHistory,
        };
      })
    );
  };

  const addPlant = (plantData: Omit<Plant, 'id' | 'createdAt' | 'careHistory' | 'soilHistory'>): Plant => {
    const newId = `plant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newPlant: Plant = {
      ...plantData,
      id: newId,
      createdAt: new Date().toISOString(),
      careHistory: [
        {
          id: `init-${Date.now()}`,
          plantId: newId,
          plantName: plantData.name,
          taskType: 'observation',
          date: new Date().toISOString(),
          action: 'Added to Plantzy routine',
        },
      ],
      // No soil reading is recorded until the user actually takes one.
      soilHistory: [],
    };

    setPlants((prev) => [newPlant, ...prev]);
    return newPlant;
  };

  const updatePlant = (plantId: string, updates: Partial<Plant>) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, ...updates } : p))
    );
  };

  const deletePlant = (plantId: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== plantId));
  };

  const resetToDemo = () => {
    setPlants(getDemoPlants());
    setUserProfile(INITIAL_USER_PROFILE);
    setCompletedTaskIds(new Set());
    localStorage.removeItem(LOCAL_STORAGE_KEY_PLANTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_PROFILE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_COMPLETED);
  };

  const clearUserData = () => {
    setPlants([]);
    setCompletedTaskIds(new Set());
    localStorage.removeItem(LOCAL_STORAGE_KEY_PLANTS);
  };

  const isDemoMode = plants.length === DEMO_PLANTS.length && plants[0]?.id === DEMO_PLANTS[0]?.id;

  const stats = useMemo(() => {
    const care = computeCareStats(plants);
    return {
      totalPlants: plants.length,
      completedThisWeek: care.completedThisWeek,
      needsMonitoring: plants.filter((p) => p.status === 'monitoring' || p.status === 'needs_attention').length,
      overdueCritical: missedCareSummary.missedCount,
      streakDays: care.streakDays,
    };
  }, [plants, missedCareSummary]);

  return (
    <PlantContext.Provider
      value={{
        plants,
        userProfile,
        weather,
        loadingWeather,
        weatherError,
        refreshWeather,
        updateCity,
        updateUserProfile,
        routine,
        environmentInsights,
        plantsNeedingAttention,
        missedCareSummary,
        completedTaskIds,
        snoozedTaskIds,
        completeTask,
        skipTask,
        snoozeTask,
        addPlant,
        updatePlant,
        deletePlant,
        addCareObservation,
        resetToDemo,
        clearUserData,
        isDemoMode,
        activeCareSession,
        setActiveCareSession,
        stats,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};

export const usePlant = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlant must be used within a PlantProvider');
  }
  return context;
};
