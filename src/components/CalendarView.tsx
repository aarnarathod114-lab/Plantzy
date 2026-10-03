import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Scissors,
  Sun,
  RotateCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { PlantTask } from '../types/plant';
import { careLoggedOn, dayKey, projectSchedule, type ProjectedTask } from '../utils/schedule';

type DayItem = ProjectedTask & { status?: PlantTask['status'] };

export const CalendarView: React.FC = () => {
  const { plants, routine, completeTask } = usePlant();

  const today = new Date();
  const todayKey = dayKey(today);

  const [currentDate, setCurrentDate] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setCurrentDate(next);
    // Keep the selection on a day that exists in the new month.
    const isThisMonth = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth();
    setSelectedDay(isThisMonth ? today.getDate() : 1);
  };
  const prevMonth = () => changeMonth(-1);
  const nextMonth = () => changeMonth(1);

  // Project far enough ahead to cover the month on screen (capped at about three months).
  const horizonDays = Math.min(
    93,
    Math.max(0, Math.ceil((new Date(year, month + 1, 0).getTime() - today.getTime()) / 86_400_000) + 1)
  );
  const projected = useMemo(
    () => projectSchedule(plants, Date.now(), horizonDays),
    [plants, horizonDays]
  );

  /**
   * Past days show what was actually logged, today shows the live routine,
   * and future days show the projection.
   */
  const getTasksForDay = (dayNum: number): DayItem[] => {
    const key = dayKey(new Date(year, month, dayNum));
    if (key === todayKey) return routine.allTasks;
    if (key < todayKey) return careLoggedOn(plants, key);
    return projected.get(key) ?? [];
  };

  const selectedKey = dayKey(new Date(year, month, selectedDay));
  const selectedIsToday = selectedKey === todayKey;
  const selectedDayTasks = getTasksForDay(selectedDay);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A3C]">
            Care Schedule
          </span>
          <h1 className="font-serif-plant text-3xl sm:text-4xl font-extrabold text-[#163022] mt-1">
            Plant Care Calendar
          </h1>
          <p className="text-sm text-[#556F60] mt-1">
            Past days show the care you logged. Future days are projected from each plant’s usual
            interval and adapt as weather and soil checks come in.
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-[#DCE6DE] shadow-2xs self-start sm:self-auto">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl hover:bg-[#F0F5F1] flex items-center justify-center text-[#2D5A3C]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-serif-plant text-sm font-bold text-[#1E3A2B] px-2 min-w-32 text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl hover:bg-[#F0F5F1] flex items-center justify-center text-[#2D5A3C]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAE3] shadow-xs">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold uppercase tracking-wider text-[#688172]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for previous month overflow */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1 rounded-2xl bg-[#FAFBFA]" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDay === day;
              const isToday = dayKey(new Date(year, month, day)) === todayKey;
              const tasks = getTasksForDay(day);

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  aria-pressed={isSelected}
                  aria-label={`${new Date(year, month, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${tasks.length} item${tasks.length === 1 ? '' : 's'}`}
                  className={`aspect-square p-2 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between text-left ${
                    isSelected
                      ? 'border-[#2D5A3C] bg-[#EBF4ED] ring-2 ring-[#2D5A3C]/20 shadow-xs'
                      : 'border-[#E4ECE6] bg-white hover:border-[#CCD8CF] hover:bg-[#F9FBFA]'
                  }`}
                >
                  <span className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-[#2D5A3C]'
                          : isToday
                          ? 'text-[#16A34A] font-extrabold'
                          : 'text-[#1B3626]'
                      }`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    )}
                  </span>

                  {/* Task Indicators */}
                  <span className="flex flex-wrap gap-1 mt-1">
                    {tasks.slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          t.taskType === 'soil_check'
                            ? 'bg-[#0284C7]'
                            : t.taskType === 'pruning'
                            ? 'bg-[#9333EA]'
                            : 'bg-[#D97706]'
                        }`}
                      />
                    ))}
                    {tasks.length > 3 && (
                      <span className="text-[8px] font-bold text-[#6B8072]">
                        +{tasks.length - 3}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E2EAE3] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#EDF3EF] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A3C]">
                {selectedIsToday ? 'Today’s Routine' : selectedKey < todayKey ? 'Care Logged' : 'Projected'}
              </span>
              <h3 className="font-serif-plant text-xl font-bold text-[#173423]">
                {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E5EFE7] text-[#245236]">
              {selectedDayTasks.length} {selectedKey < todayKey ? 'logged' : 'tasks'}
            </div>
          </div>

          {selectedDayTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#F6FAF7] border border-[#E3EDE5] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto opacity-70" />
              <p className="text-xs font-bold text-[#1F3D2B]">
                {selectedKey < todayKey ? 'No care was logged' : 'Nothing scheduled'}
              </p>
              <p className="text-[11px] text-[#698172]">
                {selectedKey < todayKey
                  ? 'Completed tasks and observations appear here on the day you log them.'
                  : 'Rest days prevent over-handling. Plants are checked only as often as they need.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-[#E3ECE5] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#D5E3D8] flex items-center justify-center shrink-0">
                      {t.taskType === 'soil_check' ? (
                        <Droplets className="w-4 h-4 text-[#0284C7]" />
                      ) : t.taskType === 'pruning' ? (
                        <Scissors className="w-4 h-4 text-[#9333EA]" />
                      ) : (
                        <RotateCw className="w-4 h-4 text-[#D97706]" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#1B3626]">{t.plantName}</div>
                      <div className="text-[11px] text-[#556F60]">{t.title}</div>
                    </div>
                  </div>

                  {/* Mark complete if today */}
                  {selectedIsToday && t.status !== 'completed' && (
                    <button
                      onClick={() => completeTask(t.id, t.plantId)}
                      className="px-2.5 py-1 rounded-lg bg-[#2D5A3C] text-white text-[11px] font-semibold hover:bg-[#23472F] transition shrink-0"
                    >
                      Done ✓
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
