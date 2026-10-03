import React, { useState } from 'react';
import {
  Download,
  Trash2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { CATALOG_COUNT_LABEL, TOTAL_PLANT_COUNT } from '../data/plantCatalog';

export const SettingsView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    updateCity,
    resetToDemo,
    clearUserData,
    plants,
  } = usePlant();

  const [name, setName] = useState(userProfile.name);
  const [city, setCity] = useState(userProfile.city);
  const [units, setUnits] = useState<'celsius' | 'fahrenheit'>(userProfile.units);
  const [reminderTime, setReminderTime] = useState(userProfile.reminderTimes?.[0] || '08:30');
  const [quietHoursStart, setQuietHoursStart] = useState(userProfile.quietHoursStart);
  const [quietHoursEnd, setQuietHoursEnd] = useState(userProfile.quietHoursEnd);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async () => {
    updateUserProfile({
      name,
      units,
      reminderTimes: [reminderTime],
      quietHoursStart,
      quietHoursEnd,
    });
    if (city !== userProfile.city) {
      await updateCity(city);
    }
    setSaveMessage('Preferences updated successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleExportData = () => {
    const data = {
      profile: userProfile,
      plants,
      catalogCount: TOTAL_PLANT_COUNT,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantzy-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#143D2B]">
          Account & Environment
        </span>
        <h1 className="font-serif-plant text-3xl sm:text-4xl font-extrabold text-[#0D2E1E] mt-1">
          Settings & Preferences
        </h1>
        <p className="text-sm text-[#3E654E] mt-1">
          Configure notification timing, quiet hours, and manage demo datasets across {CATALOG_COUNT_LABEL} plant profiles.
        </p>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8] text-xs font-bold text-[#065F46] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE3] shadow-xs space-y-6">
        {/* User profile */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#143D2B]">
            Profile & Microclimate Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#143D2B] mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-[#CCD8CF] outline-none focus:border-[#143D2B]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#143D2B] mb-1">
                City / Location (for live weather)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Delhi, Bengaluru, London"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-[#CCD8CF] outline-none focus:border-[#143D2B]"
              />
            </div>
          </div>
        </div>

        {/* Units in Pastel Tones */}
        <div className="space-y-3 pt-4 border-t border-[#F0F4F1]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#143D2B]">
            Units of Measurement
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUnits('celsius')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition ${
                units === 'celsius'
                  ? 'bg-[#143D2B] text-white border-[#143D2B]'
                  : 'bg-[#E8F8F2] text-[#065F46] border-[#A3E9C8]'
              }`}
            >
              Celsius (°C)
            </button>
            <button
              type="button"
              onClick={() => setUnits('fahrenheit')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition ${
                units === 'fahrenheit'
                  ? 'bg-[#143D2B] text-white border-[#143D2B]'
                  : 'bg-[#E8F8F2] text-[#065F46] border-[#A3E9C8]'
              }`}
            >
              Fahrenheit (°F)
            </button>
          </div>
        </div>

        {/* Notification Times & Quiet Hours */}
        <div className="space-y-4 pt-4 border-t border-[#F0F4F1]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#143D2B]">
            Routine Digest & Quiet Hours
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#143D2B] mb-1">
                Daily Morning Digest
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-2xl border border-[#CCD8CF] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#143D2B] mb-1">
                Quiet Hours Begin
              </label>
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-2xl border border-[#CCD8CF] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#143D2B] mb-1">
                Quiet Hours End
              </label>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-2xl border border-[#CCD8CF] outline-none font-bold"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white font-bold text-xs shadow-xs transition"
        >
          Save All Preferences
        </button>
      </div>

      {/* Demo Mode & Data Operations (Pastel Cards) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE3] shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#143D2B]">
          Demo & Data Management
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => {
              if (confirm('Reset to demo collection (including Rama Tulsi, Mogra, Monstera, Rose, Peace Lily)?')) {
                resetToDemo();
              }
            }}
            className="p-4 rounded-3xl border border-[#A3E9C8] bg-[#E8F8F2] hover:bg-[#D1F5E4] text-left transition space-y-1 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Demo Data</span>
            </div>
            <p className="text-[11px] text-[#245E3F]">
              Restores sample plants with pre-populated care records.
            </p>
          </button>

          <button
            onClick={handleExportData}
            className="p-4 rounded-3xl border border-[#FDE68A] bg-[#FEF9E7] hover:bg-[#FEF3C7] text-left transition space-y-1 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#92400E]">
              <Download className="w-4 h-4" />
              <span>Export Plant Data</span>
            </div>
            <p className="text-[11px] text-[#78350F]">
              Download your entire collection and logs as clean JSON.
            </p>
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear your collection? This cannot be undone.')) {
                clearUserData();
              }
            }}
            className="p-4 rounded-3xl border border-[#F9CAD6] bg-[#FFF0F4] hover:bg-[#FCE7EC] text-left transition space-y-1 shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#9F1239]">
              <Trash2 className="w-4 h-4 text-[#E11D48]" />
              <span>Clear Collection</span>
            </div>
            <p className="text-[11px] text-[#881337]">
              Start clean and select freely from our {CATALOG_COUNT_LABEL} catalog.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
