import React, { useMemo, useState } from 'react';
import {
  Droplets,
  Sun,
  Scissors,
  Thermometer,
  CloudRain,
  CheckCircle2,
  HelpCircle,
  PlayCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { PlantTask, SoilCondition } from '../types/plant';
import { CATALOG_COUNT_LABEL } from '../data/plantCatalog';
import { listNames } from '../utils/insights';
import { projectSchedule, summariseUpcoming } from '../utils/schedule';
import { onPlantImageError } from '../utils/plantArt';

interface DashboardViewProps {
  onSelectPlant: (plantId: string) => void;
  onOpenAddPlant: () => void;
  onOpenCareSession: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectPlant,
  onOpenAddPlant,
  onOpenCareSession,
  onNavigateTab,
}) => {
  const {
    userProfile,
    plants,
    weather,
    weatherError,
    loadingWeather,
    routine,
    environmentInsights,
    plantsNeedingAttention,
    missedCareSummary,
    completedTaskIds,
    completeTask,
    stats,
  } = usePlant();

  const upcoming = useMemo(() => summariseUpcoming(projectSchedule(plants, Date.now(), 7)), [plants]);

  // Expanded toggles for grouped tasks
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    soil: true,
    light: false,
    prune: false,
    shelter: true,
  });

  // Track expanded "Why today?" notes
  const [expandedWhy, setExpandedWhy] = useState<{ [key: string]: boolean }>({});

  // Quick soil modal state for in-dashboard completion
  const [soilModalTask, setSoilModalTask] = useState<PlantTask | null>(null);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleWhy = (taskId: string) => {
    setExpandedWhy((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const pendingRoutineTasks = routine.allTasks.filter((t) => t.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 0. Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#143D2B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>Today's Plant-Care System</span>
          </div>
          <h1 className="font-serif-plant text-3xl sm:text-4xl font-extrabold text-[#0D2E1E] mt-1">
            {getGreeting()}, {userProfile.name} 🌱
          </h1>
          <p className="text-base text-[#3E654E] mt-1 font-medium">
            Here’s what your plants need today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingRoutineTasks.length > 0 ? (
            <button
              onClick={onOpenCareSession}
              className="px-5 py-3 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 transform hover:-translate-y-0.5 border border-[#143D2B]"
            >
              <PlayCircle className="w-5 h-5 text-[#86EFAC]" />
              <span>Start Care Session</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#FEF9E7] text-[#92400E] font-extrabold">
                ~{routine.estimatedMinutes} min
              </span>
            </button>
          ) : (
            <div className="px-4 py-2.5 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8] text-xs font-bold text-[#065F46] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>All care tasks completed today!</span>
            </div>
          )}
        </div>
      </div>

      {/* Missed-Care Recovery Banner (Pastel Yellow) */}
      {missedCareSummary.hasMissedTasks && (
        <div className="p-5 rounded-3xl bg-[#FEF9E7] border border-[#FDE68A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#FDE68A] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-plant text-base font-bold text-[#92400E]">
                Let's get your plants back on track 🌱
              </h3>
              <p className="text-xs text-[#78350F] mt-0.5">
                No guilt at all! Life gets busy. Rather than catching up on everything, here are the top priority checks to do right now:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {missedCareSummary.prioritySteps.map((step, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-white border border-[#FDE68A] text-[#92400E] font-bold shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    {step.plantName}: {step.task}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenCareSession}
            className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold transition shrink-0"
          >
            Review Priority Tasks
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Section 1 (Routine) & Section 2 (Attention) */}
        <div className="lg:col-span-8 space-y-8">
          {/* SECTION 1: TODAY'S PLANT ROUTINE */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAE3] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#F0F4F1] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#143D2B]">
                  Consolidated Checklist
                </span>
                <h2 className="font-serif-plant text-2xl font-bold text-[#0D2E1E]">
                  Today's Plant Routine
                </h2>
              </div>
              <div className="text-xs font-bold text-[#143D2B] bg-[#E8F8F2] px-3.5 py-1.5 rounded-xl border border-[#A3E9C8]">
                Est. time: <span className="text-[#065F46]">~{routine.estimatedMinutes} min</span>
              </div>
            </div>

            {/* If all tasks completed */}
            {routine.allTasks.length === 0 || pendingRoutineTasks.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-[#E8F8F2] border border-[#A3E9C8] space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#10B981] flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif-plant text-xl font-bold text-[#065F46]">
                  Your plants are thriving!
                </h3>
                <p className="text-xs text-[#245E3F] max-w-sm mx-auto">
                  All routine checks for today are done. Plantzy will monitor local conditions and synthesize tomorrow's routine.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. 💧 Water / Soil Check Group (Mint Green Accent) */}
                {routine.soilChecks.length > 0 && (
                  <div className="rounded-3xl border border-[#A3E9C8] overflow-hidden bg-white shadow-2xs">
                    <div
                      onClick={() => toggleGroup('soil')}
                      className="p-4 bg-[#E8F8F2] hover:bg-[#D1F5E4] cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white text-[#059669] flex items-center justify-center font-bold shadow-2xs">
                          <Droplets className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#065F46]">
                              💧 Water / Soil Check
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-[#065F46] font-extrabold border border-[#A3E9C8]">
                              {routine.soilChecks.filter((t) => t.status === 'pending').length} plants
                            </span>
                          </div>
                          <p className="text-xs text-[#245E3F] mt-0.5">
                            {routine.soilChecks.map((t) => t.plantName).join(' • ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#065F46] font-bold hidden sm:inline">
                          {expandedGroups.soil ? 'Collapse' : 'Expand'}
                        </span>
                        {expandedGroups.soil ? (
                          <ChevronUp className="w-4 h-4 text-[#065F46]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#065F46]" />
                        )}
                      </div>
                    </div>

                    {expandedGroups.soil && (
                      <div className="p-4 space-y-3 border-t border-[#D1F5E4] divide-y divide-[#E8F8F2]">
                        {routine.soilChecks.map((task) => (
                          <div
                            key={task.id}
                            className={`pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              task.status === 'completed' ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={task.plantImage}
                                onError={onPlantImageError}
                                loading="lazy"
                                alt={task.plantName}
                                className="w-12 h-12 rounded-2xl object-cover bg-gray-100 shrink-0 shadow-2xs"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onSelectPlant(task.plantId)}
                                    className="font-bold text-sm text-[#143D2B] hover:underline text-left"
                                  >
                                    {task.plantName}
                                  </button>
                                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#E8F8F2] text-[#065F46] font-bold">
                                    {task.indoorOutdoor}
                                  </span>
                                  {task.urgent && (
                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#FFF0F4] text-[#BE185D] font-extrabold border border-[#F9CAD6]">
                                      Dry
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#3D634B]">{task.description}</p>

                                {/* "Why today?" toggle button */}
                                <div className="mt-1">
                                  <button
                                    onClick={() => toggleWhy(task.id)}
                                    className="text-[11px] font-bold text-[#143D2B] hover:underline flex items-center gap-1"
                                  >
                                    <HelpCircle className="w-3 h-3 text-[#10B981]" />
                                    <span>Why today?</span>
                                  </button>
                                  {expandedWhy[task.id] && (
                                    <p className="mt-1 text-[11px] text-[#245E3F] bg-[#E8F8F2] p-2.5 rounded-xl border border-[#A3E9C8]">
                                      {task.whyToday}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Quick Action buttons */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {task.status === 'completed' ? (
                                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Checked
                                </span>
                              ) : (
                                <button
                                  onClick={() => setSoilModalTask(task)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white text-xs font-bold shadow-2xs transition"
                                >
                                  Check Soil
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ☀️ Light Check / Rotation Group (Pastel Yellow Accent) */}
                {routine.lightChecks.length > 0 && (
                  <div className="rounded-3xl border border-[#FDE68A] overflow-hidden bg-white shadow-2xs">
                    <div
                      onClick={() => toggleGroup('light')}
                      className="p-4 bg-[#FEF9E7] hover:bg-[#FEF3C7] cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white text-[#D97706] flex items-center justify-center font-bold shadow-2xs">
                          <Sun className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#92400E]">
                              ☀️ Light Check & Rotation
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-[#92400E] font-extrabold border border-[#FDE68A]">
                              {routine.lightChecks.filter((t) => t.status === 'pending').length} plants
                            </span>
                          </div>
                          <p className="text-xs text-[#78350F] mt-0.5">
                            {routine.lightChecks.map((t) => t.plantName).join(' • ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#92400E] font-bold hidden sm:inline">
                          {expandedGroups.light ? 'Collapse' : 'Expand'}
                        </span>
                        {expandedGroups.light ? (
                          <ChevronUp className="w-4 h-4 text-[#92400E]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#92400E]" />
                        )}
                      </div>
                    </div>

                    {expandedGroups.light && (
                      <div className="p-4 space-y-3 border-t border-[#FDE68A]">
                        {routine.lightChecks.map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={task.plantImage}
                                onError={onPlantImageError}
                                loading="lazy"
                                alt={task.plantName}
                                className="w-12 h-12 rounded-2xl object-cover bg-gray-100 shrink-0 shadow-2xs"
                              />
                              <div>
                                <span className="font-bold text-sm text-[#143D2B]">
                                  {task.plantName}
                                </span>
                                <p className="text-xs text-[#3E654E]">{task.title}</p>
                                <div className="mt-1">
                                  <button
                                    onClick={() => toggleWhy(task.id)}
                                    className="text-[11px] font-bold text-[#92400E] hover:underline flex items-center gap-1"
                                  >
                                    <HelpCircle className="w-3 h-3 text-[#D97706]" />
                                    <span>Why today?</span>
                                  </button>
                                  {expandedWhy[task.id] && (
                                    <p className="mt-1 text-[11px] text-[#78350F] bg-[#FEF9E7] p-2 rounded-xl border border-[#FDE68A]">
                                      {task.whyToday}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => completeTask(task.id, task.plantId)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                                task.status === 'completed'
                                  ? 'bg-[#E8F8F2] text-[#065F46]'
                                  : 'bg-[#143D2B] text-white hover:bg-[#0E2C1E]'
                              }`}
                            >
                              {task.status === 'completed' ? 'Rotated ✓' : 'Mark Rotated'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. ✂️ Pruning & Grooming Group (Pastel Pink Accent) */}
                {routine.pruningTasks.length > 0 && (
                  <div className="rounded-3xl border border-[#F9CAD6] overflow-hidden bg-white shadow-2xs">
                    <div
                      onClick={() => toggleGroup('prune')}
                      className="p-4 bg-[#FFF0F4] hover:bg-[#FCE7EC] cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white text-[#E11D48] flex items-center justify-center font-bold shadow-2xs">
                          <Scissors className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#9F1239]">
                              ✂️ Pruning & Grooming
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-[#9F1239] font-extrabold border border-[#F9CAD6]">
                              {routine.pruningTasks.filter((t) => t.status === 'pending').length} plant
                              {routine.pruningTasks.filter((t) => t.status === 'pending').length === 1 ? '' : 's'}
                            </span>
                          </div>
                          <p className="text-xs text-[#881337] mt-0.5">
                            {routine.pruningTasks.map((t) => t.plantName).join(' • ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#9F1239] font-bold hidden sm:inline">
                          {expandedGroups.prune ? 'Collapse' : 'Expand'}
                        </span>
                        {expandedGroups.prune ? (
                          <ChevronUp className="w-4 h-4 text-[#9F1239]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#9F1239]" />
                        )}
                      </div>
                    </div>

                    {expandedGroups.prune && (
                      <div className="p-4 space-y-3 border-t border-[#F9CAD6]">
                        {routine.pruningTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={task.plantImage}
                                onError={onPlantImageError}
                                loading="lazy"
                                alt={task.plantName}
                                className="w-12 h-12 rounded-2xl object-cover bg-gray-100 shrink-0 shadow-2xs"
                              />
                              <div>
                                <span className="font-bold text-sm text-[#143D2B]">
                                  {task.plantName}
                                </span>
                                <p className="text-xs text-[#3E654E]">{task.title}</p>
                                <div className="mt-1">
                                  <button
                                    onClick={() => toggleWhy(task.id)}
                                    className="text-[11px] font-bold text-[#9F1239] hover:underline flex items-center gap-1"
                                  >
                                    <HelpCircle className="w-3 h-3 text-[#E11D48]" />
                                    <span>Why today?</span>
                                  </button>
                                  {expandedWhy[task.id] && (
                                    <p className="mt-1 text-[11px] text-[#881337] bg-[#FFF0F4] p-2 rounded-xl border border-[#F9CAD6]">
                                      {task.whyToday}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => completeTask(task.id, task.plantId)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                                task.status === 'completed'
                                  ? 'bg-[#E8F8F2] text-[#065F46]'
                                  : 'bg-[#143D2B] text-white hover:bg-[#0E2C1E]'
                              }`}
                            >
                              {task.status === 'completed' ? 'Pruned ✓' : 'Mark Groomed'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. 🌡️ Move indoors / Temperature Shelter Group */}
                {routine.shelterTasks.length > 0 && (
                  <div className="rounded-3xl border border-[#F9CAD6] bg-[#FFF0F4] p-4 flex items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white text-[#E11D48] flex items-center justify-center font-bold shadow-2xs">
                        <Thermometer className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#9F1239]">
                            🌡️ Move indoors tonight
                          </span>
                          <span className="text-[10px] bg-[#E11D48] text-white px-2 py-0.5 rounded-full font-bold">
                            Cool Weather Alert
                          </span>
                        </div>
                        <p className="text-xs text-[#881337] mt-0.5">
                          {routine.shelterTasks.map((t) => t.plantName).join(' • ')}: Protect sensitive tropical leaves from sudden cold drafts.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        routine.shelterTasks.forEach((t) => completeTask(t.id, t.plantId))
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE185D] text-white text-xs font-bold shrink-0"
                    >
                      Brought Indoors
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECTION 2: PLANTS NEEDING ATTENTION */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAE3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#92400E]">
                  Actionable Insights
                </span>
                <h2 className="font-serif-plant text-xl font-bold text-[#0D2E1E]">
                  Plants Needing Attention
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('plants')}
                className="text-xs font-bold text-[#143D2B] hover:underline flex items-center gap-1"
              >
                <span>View All {CATALOG_COUNT_LABEL} Plants</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {plantsNeedingAttention.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8] text-xs text-[#065F46] text-center font-bold">
                No urgent concerns detected across your collection today. All plants are stable.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {plantsNeedingAttention.map((item) => (
                  <div
                    key={item.plant.id}
                    onClick={() => onSelectPlant(item.plant.id)}
                    className="p-4 rounded-3xl bg-[#FEF9E7] border border-[#FDE68A] hover:shadow-xs transition cursor-pointer flex items-start gap-3.5 group"
                  >
                    <img
                      src={item.plant.image}
                      onError={onPlantImageError}
                      loading="lazy"
                      alt={item.plant.name}
                      className="w-14 h-14 rounded-2xl object-cover bg-gray-100 shrink-0 group-hover:scale-105 transition-transform shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#143D2B] truncate">
                          {item.plant.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#92400E] font-bold border border-[#FDE68A]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#78350F] mt-1 line-clamp-2 leading-relaxed">
                        {item.reason}
                      </p>
                      <span className="mt-2 text-[11px] font-bold text-[#143D2B] flex items-center gap-1">
                        <span>{item.actionText}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Weather Card, Upcoming, Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* SECTION 3: ENVIRONMENT & WEATHER (Dark Green + Pastel Accents) */}
          <div className="bg-[#143D2B] text-white rounded-3xl p-6 shadow-md space-y-5 border border-[#143D2B]">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3E9C8]">
                  {weather ? 'Live Weather' : 'Weather Unavailable'}
                </span>
                <h3 className="font-serif-plant text-xl font-bold text-white">
                  {weather?.location || userProfile.city || 'Today Outside'}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white">
                  {weather ? `${weather.temperature}°C` : '—'}
                </div>
                {weather && (
                  <div className="text-[11px] text-[#A3E9C8] font-semibold">
                    Feels like {weather.feelsLike}°C
                  </div>
                )}
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs">
                <Droplets className="w-4 h-4 mx-auto text-[#A3E9C8] mb-1" />
                <div className="text-[9px] text-white/70 uppercase font-semibold">Humidity</div>
                <div className="text-xs font-bold text-white">{weather ? `${weather.humidity}%` : '—'}</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs">
                <Sun className="w-4 h-4 mx-auto text-[#FEF08A] mb-1" />
                <div className="text-[9px] text-white/70 uppercase font-semibold">UV Index</div>
                <div className="text-xs font-bold text-white">{weather ? weather.uvIndex : '—'}</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-xs">
                <CloudRain className="w-4 h-4 mx-auto text-[#93C5FD] mb-1" />
                <div className="text-[9px] text-white/70 uppercase font-semibold">Rain Chance</div>
                <div className="text-xs font-bold text-white">{weather ? `${weather.rainProbability}%` : '—'}</div>
              </div>
            </div>

            {!weather && (
              <p role="status" className="text-xs text-[#FDE68A] leading-relaxed">
                {loadingWeather
                  ? 'Loading weather…'
                  : `${weatherError ?? 'Weather is unavailable right now.'} Today’s routine uses your soil checks and care history only.`}
              </p>
            )}

            {/* Dedicated Plantzy Weather Synthesis */}
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#86EFAC]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Microclimate Advice</span>
              </div>
              <p className="text-xs text-[#E1F5EC] leading-relaxed">
                {environmentInsights.outdoorSynthesis}
              </p>
            </div>

            {/* 4-Day Forecast Strip */}
            {weather && weather.dailyForecast.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">
                Upcoming Weather Influence
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(weather?.dailyForecast || []).slice(0, 4).map((day, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-center"
                  >
                    <div className="text-[10px] text-white/70 font-semibold">
                      {idx === 0
                        ? 'Today'
                        : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs font-bold text-white my-0.5">{day.tempMax}°</div>
                    <div className="text-[9px] text-[#A3E9C8] font-bold">{day.rainProb}% rain</div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* SECTION 4: UPCOMING TASKS (Pastel Yellow / Mint styling) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2EAE3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#143D2B]">
                  Scheduled Horizon
                </span>
                <h3 className="font-serif-plant text-lg font-bold text-[#0D2E1E]">
                  Upcoming Tasks
                </h3>
              </div>
              <Calendar className="w-4 h-4 text-[#143D2B]" />
            </div>

            <div className="space-y-3">
              {upcoming.map((window, idx) => {
                const tone = [
                  'bg-[#E8F8F2] border-[#A3E9C8] text-[#065F46]',
                  'bg-[#FEF9E7] border-[#FDE68A] text-[#92400E]',
                  'bg-[#FFF0F4] border-[#F9CAD6] text-[#9F1239]',
                ][idx];
                return (
                  <div key={window.label} className={`p-3 rounded-2xl border ${tone}`}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{window.label}</span>
                      <span className="text-[10px] font-bold">
                        {window.taskCount} task{window.taskCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-xs mt-1 opacity-90">
                      {window.taskCount === 0
                        ? 'Nothing due.'
                        : listNames(window.plantNames)}
                    </p>
                  </div>
                );
              })}
              <p className="text-[10px] text-[#6B8072]">
                Projected from each plant’s usual interval. Weather and your soil checks can move
                these.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('calendar')}
              className="w-full py-2.5 rounded-2xl border border-[#A3E9C8] bg-[#E8F8F2] hover:bg-[#D1F5E4] text-xs font-bold text-[#143D2B] transition text-center"
            >
              Open Interactive Calendar →
            </button>
          </div>

          {/* SECTION 5: PLANT STATS (Pastel Colors) */}
          <div className="bg-white rounded-3xl p-6 border border-[#E2EAE3] shadow-xs space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#143D2B]">
              Collection Vitality
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8]">
                <div className="text-2xl font-bold font-serif-plant text-[#065F46]">
                  🌱 {stats.totalPlants}
                </div>
                <div className="text-xs font-semibold text-[#245E3F] mt-0.5">Total Plants</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF0F4] border border-[#F9CAD6]">
                <div className="text-2xl font-bold font-serif-plant text-[#9F1239]">
                  ✅ {stats.completedThisWeek}
                </div>
                <div className="text-xs font-semibold text-[#881337] mt-0.5">Care Completed</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FEF9E7] border border-[#FDE68A]">
                <div className="text-2xl font-bold font-serif-plant text-[#92400E]">
                  💧 {stats.needsMonitoring}
                </div>
                <div className="text-xs font-semibold text-[#78350F] mt-0.5">Monitoring</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#143D2B] text-white border border-[#143D2B]">
                <div className="text-2xl font-bold font-serif-plant text-[#86EFAC]">
                  🌿 0
                </div>
                <div className="text-xs font-semibold text-[#D1F5E4] mt-0.5">Overdue Critical</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SOIL CHECK MODAL (Pastel styling) */}
      {soilModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E2EAE3] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={soilModalTask.plantImage}
                  onError={onPlantImageError}
                  loading="lazy"
                  alt={soilModalTask.plantName}
                  className="w-12 h-12 rounded-2xl object-cover bg-gray-100 shadow-2xs"
                />
                <div>
                  <h3 className="font-serif-plant text-base font-bold text-[#0D2E1E]">
                    {soilModalTask.plantName}
                  </h3>
                  <p className="text-xs text-[#3D634B]">Record soil condition</p>
                </div>
              </div>
              <button
                onClick={() => setSoilModalTask(null)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#143D2B] uppercase tracking-wider">
                How does the soil feel 1–2 inches down?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'very_dry', label: 'Very dry (Soak)' },
                  { id: 'slightly_dry', label: 'Slightly dry' },
                  { id: 'moist', label: 'Moist (Hold off)' },
                  { id: 'very_wet', label: 'Very wet' },
                ].map((cond) => (
                  <button
                    key={cond.id}
                    onClick={() => {
                      completeTask(soilModalTask.id, soilModalTask.plantId, cond.id as SoilCondition);
                      setSoilModalTask(null);
                    }}
                    className="p-3 rounded-2xl border border-[#A3E9C8] bg-[#E8F8F2] hover:bg-[#143D2B] hover:text-white text-xs font-bold text-[#065F46] transition text-center shadow-2xs"
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
