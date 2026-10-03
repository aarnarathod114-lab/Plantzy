import React, { useMemo } from 'react';
import {
  Droplets,
  Sun,
  CheckCircle2,
  Brain,
  Flame,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { computeCareStats, computeSoilPatterns, listNames } from '../utils/insights';

export const InsightsView: React.FC = () => {
  const { plants, stats, weather, weatherError, environmentInsights } = usePlant();

  // Every figure on this screen is computed from logged care and soil checks.
  const patterns = useMemo(() => computeSoilPatterns(plants), [plants]);
  const totalCareEvents = useMemo(() => computeCareStats(plants).totalCareEvents, [plants]);
  const holding = patterns.holdingMoisture.map((p) => p.name);
  const drying = patterns.dryingFast.map((p) => p.name);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A3C]">
          Care Trends & Patterns
        </span>
        <h1 className="font-serif-plant text-3xl sm:text-4xl font-extrabold text-[#163022]">
          Your Plant Week 🌱
        </h1>
        <p className="text-sm text-[#556F60]">
          Observing your care consistency, soil evaporation patterns, and environmental adaptations.
        </p>
      </div>

      {/* Consistency Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#21422E] to-[#2D5A3C] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs text-[#FDE047] flex items-center justify-center shrink-0">
            <Flame className="w-8 h-8 fill-current text-[#FBBF24]" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#86EFAC]">
              Care Consistency
            </div>
            <h2 className="font-serif-plant text-2xl font-bold">
              {stats.streakDays > 0
                ? `${stats.streakDays}-Day Care Streak`
                : 'Start a Care Streak Today'}
            </h2>
            <p className="text-xs text-[#C2DEC9] mt-0.5">
              {stats.streakDays > 0
                ? `You have logged plant care on ${stats.streakDays} day${stats.streakDays === 1 ? '' : 's'} in a row.`
                : 'Complete one task from today\u2019s routine to begin.'}
            </p>
          </div>
        </div>

        <div className="px-5 py-2.5 rounded-2xl bg-white/15 backdrop-blur-xs text-xs font-bold border border-white/20 whitespace-nowrap">
          🌿 {totalCareEvents.toLocaleString()} care log{totalCareEvents === 1 ? '' : 's'} so far
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E2EAE3] shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#E8F5EB] text-[#2D5A3C] flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-bold font-serif-plant text-[#1B3626]">
            {stats.completedThisWeek}
          </div>
          <div className="text-xs text-[#5C7768]">Care Logs, Last 7 Days</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2EAE3] shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-2">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-serif-plant text-[#1B3626]">
            {plants.length}
          </div>
          <div className="text-xs text-[#5C7768]">Plants Monitored</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2EAE3] shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-2">
            <Sun className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-serif-plant text-[#1B3626]">
            {weather ? `${weather.temperature}°C` : '—'}
          </div>
          <div className="text-xs text-[#5C7768]">
            {weather ? 'Outside Right Now' : 'Weather Unavailable'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2EAE3] shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center mb-2">
            <Brain className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-serif-plant text-[#1B3626]">
            {patterns.schedulesAdapted}
          </div>
          <div className="text-xs text-[#5C7768]">Schedules Adapted</div>
        </div>
      </div>

      {/* Observations & Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Soil Moisture Patterns */}
        <div className="p-6 rounded-3xl bg-white border border-[#E2EAE3] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <h3 className="font-serif-plant text-base font-bold text-[#1A3625]">
              Soil Hydration Patterns
            </h3>
          </div>

          {holding.length === 0 && drying.length === 0 ? (
            <p className="text-xs text-[#536E5E] leading-relaxed">
              No clear pattern yet. Once a plant has a few soil checks logged, Plantzy shows here
              whether its pot tends to hold moisture or dry out quickly.
            </p>
          ) : (
            <div className="space-y-2 text-xs text-[#536E5E] leading-relaxed">
              {holding.length > 0 && (
                <p>
                  <span className="font-semibold text-[#1B3626]">{listNames(holding)}</span>{' '}
                  {holding.length === 1 ? 'was' : 'were'} moist in at least two of the last three
                  checks.
                </p>
              )}
              {drying.length > 0 && (
                <p>
                  <span className="font-semibold text-[#1B3626]">{listNames(drying)}</span>{' '}
                  {drying.length === 1 ? 'was' : 'were'} very dry in at least two of the last three
                  checks.
                </p>
              )}
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-[#F6FAF7] border border-[#E2EEE5] text-xs text-[#3E634D]">
            <span className="font-bold text-[#1E3E2A]">What Plantzy does with this:</span>{' '}
            {patterns.schedulesAdapted > 0
              ? `It has adjusted the check interval for ${patterns.schedulesAdapted} indoor plant${patterns.schedulesAdapted === 1 ? '' : 's'}: longer where soil stays moist, shorter where it dries fast.`
              : 'Indoor plants that stay moist get checked less often, and ones that dry fast get checked sooner.'}
            {patterns.needMoreData.length > 0 &&
              ` ${patterns.needMoreData.length} plant${patterns.needMoreData.length === 1 ? ' needs' : 's need'} more soil checks before a pattern shows.`}
          </div>
        </div>

        {/* Weather */}
        <div className="p-6 rounded-3xl bg-white border border-[#E2EAE3] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <h3 className="font-serif-plant text-base font-bold text-[#1A3625]">
              Today&rsquo;s Conditions
            </h3>
          </div>
          <p className="text-xs text-[#536E5E] leading-relaxed">
            {weather ? environmentInsights.summary : weatherError ?? environmentInsights.summary}
          </p>
          {environmentInsights.alerts.length > 0 ? (
            <ul className="space-y-2">
              {environmentInsights.alerts.map((alert) => (
                <li
                  key={alert.type}
                  className="p-3.5 rounded-2xl bg-[#F6FAF7] border border-[#E2EEE5] text-xs text-[#3E634D]"
                >
                  <span className="font-bold text-[#1E3E2A]">{alert.title}:</span> {alert.description}
                  {alert.affectedPlants.length > 0 && (
                    <span className="block mt-1 text-[#5C7768]">
                      Affects {listNames(alert.affectedPlants)}.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#F6FAF7] border border-[#E2EEE5] text-xs text-[#3E634D]">
              {weather
                ? 'No heat, cold, rain or UV alerts for your plants today.'
                : 'Weather-based alerts will appear here when conditions can be loaded.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
