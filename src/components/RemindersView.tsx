import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Moon,
  Volume2,
  RotateCw,
  Droplets,
  Scissors,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { PlantTask } from '../types/plant';
import { onPlantImageError } from '../utils/plantArt';
import { dayKey, projectSchedule } from '../utils/schedule';

export const RemindersView: React.FC = () => {
  const {
    plants,
    routine,
    userProfile,
    completeTask,
    skipTask,
    snoozeTask,
    completedTaskIds,
    updateUserProfile,
  } = usePlant();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed' | 'snoozed'>('today');
  const [notificationTestNotice, setNotificationTestNotice] = useState<string | null>(null);

  const pendingTasks = routine.allTasks.filter((t) => t.status === 'pending');
  const snoozedTasks = routine.allTasks.filter((t) => t.status === 'snoozed');

  // The next seven days, flattened into one list in date order.
  const upcomingItems = useMemo(() => {
    const schedule = projectSchedule(plants, Date.now(), 7);
    const today = new Date();
    const items: Array<{ id: string; plantName: string; title: string; when: string }> = [];
    for (let offset = 1; offset <= 7; offset++) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      const when =
        offset === 1
          ? 'Tomorrow'
          : day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
      for (const task of schedule.get(dayKey(day)) ?? []) {
        items.push({ id: task.id, plantName: task.plantName, title: task.title, when });
      }
    }
    return items;
  }, [plants]);

  const handleTestNotification = () => {
    setNotificationTestNotice(
      `🔔 Plantzy preview: ${pendingTasks.length} plant care task${pendingTasks.length === 1 ? ' is' : 's are'} ready for your review.`
    );
    setTimeout(() => {
      setNotificationTestNotice(null);
    }, 4500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A3C]">
            Notification Hub
          </span>
          <h1 className="font-serif-plant text-3xl sm:text-4xl font-extrabold text-[#163022] mt-1">
            Reminder Center
          </h1>
          <p className="text-sm text-[#556F60] mt-1">
            Morning care digests, snoozed checks, and quiet hour schedules.
          </p>
        </div>

        <button
          onClick={handleTestNotification}
          className="px-4 py-2.5 rounded-xl border border-[#CCD8CF] hover:bg-white text-xs font-bold text-[#2D5A3C] transition flex items-center gap-2 self-start sm:self-auto shadow-2xs"
        >
          <Volume2 className="w-4 h-4 text-[#16A34A]" />
          <span>Simulate Test Notification</span>
        </button>
      </div>

      {/* Simulated notification banner */}
      {notificationTestNotice && (
        <div className="p-4 rounded-2xl bg-[#E8F5EB] border border-[#BCE1C5] text-xs font-semibold text-[#1B4B27] flex items-center justify-between shadow-xs">
          <span>{notificationTestNotice}</span>
          <button onClick={() => setNotificationTestNotice(null)}>✕</button>
        </div>
      )}

      {/* Quiet Hours & Routine Time Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E1E8E2] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0F5F2] text-[#2D5A3C] flex items-center justify-center">
            <Moon className="w-5 h-5 text-[#2D5A3C]" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1B3626]">
              Quiet Hours Active ({userProfile.quietHoursStart} – {userProfile.quietHoursEnd})
            </div>
            <p className="text-xs text-[#597465]">
              Plantzy holds notifications during your rest hours so you’re never disturbed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-[#526D5E] font-medium">Daily digest:</span>
          <span className="text-xs font-bold text-[#1E3E2A] bg-[#EDF4EF] px-2.5 py-1 rounded-lg">
            {userProfile.reminderTimes?.[0] || '08:30'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E1ECE3] pb-2 overflow-x-auto">
        {[
          { id: 'today', label: `Today (${pendingTasks.length})` },
          { id: 'snoozed', label: `Snoozed (${snoozedTasks.length})` },
          { id: 'upcoming', label: 'Upcoming (Next 3 Days)' },
          { id: 'completed', label: `Completed (${completedTaskIds.size})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#2D5A3C] text-white shadow-2xs'
                : 'text-[#567262] hover:bg-[#F2F6F3]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-3">
        {activeTab === 'today' && (
          pendingTasks.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white border border-[#E2EAE3]">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto mb-2 opacity-70" />
              <div className="text-sm font-bold text-[#1B3626]">All clear for today!</div>
              <p className="text-xs text-[#526C5D] mt-1">No pending notifications or care reminders.</p>
            </div>
          ) : (
            pendingTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-white border border-[#E2EAE3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={t.plantImage}
                    onError={onPlantImageError}
                    loading="lazy"
                    alt={t.plantName}
                    className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1B3626]">{t.plantName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5EFE7] text-[#245236] font-semibold">
                        {t.indoorOutdoor}
                      </span>
                    </div>
                    <p className="text-xs text-[#526C5D] mt-0.5">{t.title}</p>
                    <p className="text-[11px] text-[#698172] mt-1 italic">{t.whyToday}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => completeTask(t.id, t.plantId)}
                    className="px-3 py-1.5 rounded-xl bg-[#2D5A3C] hover:bg-[#23472F] text-white text-xs font-semibold shadow-2xs transition"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => snoozeTask(t.id)}
                    className="px-3 py-1.5 rounded-xl border border-[#CCD8CF] hover:bg-[#F2F6F3] text-xs font-semibold text-[#526C5D]"
                  >
                    Snooze (4h)
                  </button>
                  <button
                    onClick={() => skipTask(t.id)}
                    className="px-2.5 py-1.5 rounded-xl border border-[#CCD8CF] hover:bg-[#F2F6F3] text-xs text-[#526C5D]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'snoozed' && (
          snoozedTasks.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-white border border-[#E2EAE3]">
              <Clock className="w-10 h-10 text-[#698172] mx-auto mb-2 opacity-50" />
              <div className="text-sm font-bold text-[#1B3626]">No snoozed reminders</div>
              <p className="text-xs text-[#526C5D] mt-1">Tasks snoozed during your day will reappear here.</p>
            </div>
          ) : (
            snoozedTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-[#FCFDFB] border border-[#E2EAE3] flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-[#1B3626]">{t.plantName}</div>
                  <div className="text-xs text-[#526C5D]">{t.title} (Snoozed)</div>
                </div>
                <button
                  onClick={() => completeTask(t.id, t.plantId)}
                  className="px-3 py-1.5 rounded-xl bg-[#2D5A3C] text-white text-xs font-semibold"
                >
                  Un-snooze & Complete
                </button>
              </div>
            ))
          )
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-3">
            {upcomingItems.length === 0 && (
              <div className="p-8 text-center rounded-3xl bg-white border border-[#E2EAE3] text-xs text-[#526C5D]">
                Nothing is due in the next seven days.
              </div>
            )}
            {upcomingItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-[#E2EAE3] flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-[#1B3626]">{item.plantName}</div>
                  <div className="text-xs text-[#526C5D]">{item.title}</div>
                </div>
                <span className="text-xs font-semibold text-[#2D5A3C] bg-[#EDF4EF] px-2.5 py-1 rounded-lg">
                  {item.when}
                </span>
              </div>
            ))}
            {upcomingItems.length > 0 && (
              <p className="text-[10px] text-[#6B8072] px-1">
                Projected from each plant’s usual interval. Weather and your soil checks can move
                these.
              </p>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="p-8 text-center rounded-3xl bg-white border border-[#E2EAE3] space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto opacity-70" />
            <div className="text-sm font-bold text-[#1B3626]">
              {completedTaskIds.size} Tasks Completed Today
            </div>
            <p className="text-xs text-[#526C5D]">
              Care records have been safely committed to each plant’s history timeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
