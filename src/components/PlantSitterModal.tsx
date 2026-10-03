import React, { useState } from 'react';
import {
  X,
  Luggage,
  Calendar,
  CheckCircle2,
  Share2,
  Copy,
  Printer,
  Sparkles,
  Droplets,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';

interface PlantSitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlantSitterModal: React.FC<PlantSitterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { plants, userProfile, updateUserProfile } = usePlant();

  const [isVacationActive, setIsVacationActive] = useState<boolean>(
    userProfile.vacationMode?.active || false
  );
  const [startDate, setStartDate] = useState<string>(
    userProfile.vacationMode?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    userProfile.vacationMode?.endDate ||
      new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [sitterNotes, setSitterNotes] = useState<string>(
    userProfile.vacationMode?.notes || 'Thank you for watching our plant babies! Feel free to text me if any questions come up.'
  );
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  // One plain-language line per plant, built from that plant's own care profile.
  const sitterSteps = plants.map((plant) => ({
    id: plant.id,
    title: `${plant.name} (${plant.location})`,
    instruction: plant.waterGuidance.replace(/[.\s]+$/, '') + '.',
  }));

  const handleSaveVacation = () => {
    updateUserProfile({
      vacationMode: {
        active: isVacationActive,
        startDate,
        endDate,
        notes: sitterNotes,
      },
    });
  };

  const handleCopySitterPlan = () => {
    const steps = sitterSteps
      .map((step, i) => `${i + 1}. ${step.title}: ${step.instruction}`)
      .join('\n');
    const text = `🌱 Plantzy Plant Care Plan for ${userProfile.name}'s Plants
Dates: ${startDate} to ${endDate}
Notes: ${sitterNotes}

${steps || 'No plants in this collection yet.'}

When in doubt, it is safer to wait a day than to overwater.`;

    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 3000);
      })
      .catch((err) => console.error('Could not copy the sitter guide:', err));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#DCE4DE] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-[#F6FAF7] border-b border-[#E3ECE5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D5A3C] text-white flex items-center justify-center shadow-xs">
              <Luggage className="w-5 h-5 text-[#86EFAC]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A3C]">
                Travel Preparation
              </span>
              <h2 className="text-base font-bold text-[#183624]">
                Vacation & Plant Sitter Mode
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#E8F0EA] flex items-center justify-center text-[#556D5F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Vacation Mode Toggle */}
          <div className="p-4 rounded-2xl bg-[#FCFDFB] border border-[#E1ECE3] flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#1B3626]">
                Vacation Care Mode
              </div>
              <p className="text-xs text-[#597465]">
                Switches recommendations into low-maintenance protection mode while you're away.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isVacationActive}
                onChange={(e) => {
                  setIsVacationActive(e.target.checked);
                  updateUserProfile({
                    vacationMode: {
                      active: e.target.checked,
                      startDate,
                      endDate,
                      notes: sitterNotes,
                    },
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#CCD8CF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D5A3C]"></div>
            </label>
          </div>

          {/* Travel Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#476251] mb-1">
                Departure Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#476251] mb-1">
                Return Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
              />
            </div>
          </div>

          {/* Sitter Simplified Plan Preview */}
          <div className="p-5 rounded-2xl bg-[#F6FAF7] border border-[#E0EBE2] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D5A3C]">
                  Sitter Checklist View
                </span>
                <h3 className="font-serif-plant text-base font-bold text-[#183624]">
                  “Today's Plant Care for Sitter”
                </h3>
              </div>
              <button
                onClick={handleCopySitterPlan}
                className="text-xs font-bold text-[#2D5A3C] hover:underline flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedNotice ? 'Copied!' : 'Copy Sitter Guide'}</span>
              </button>
            </div>

            <p className="text-xs text-[#526D5E]">
              Streamlined for family or house-sitters without overwhelming them with botanical terminology:
            </p>

            {sitterSteps.length === 0 ? (
              <p className="text-xs text-[#526D5E] bg-white p-4 rounded-xl border border-[#D7E6DA]">
                Add plants to your collection and their care steps will appear here.
              </p>
            ) : (
              <ol className="space-y-2 text-xs text-[#20422F] list-decimal list-inside leading-relaxed bg-white p-4 rounded-xl border border-[#D7E6DA] max-h-64 overflow-y-auto">
                {sitterSteps.map((step) => (
                  <li key={step.id} className="font-semibold">
                    <span className="text-[#183624]">{step.title}:</span>{' '}
                    <span className="font-normal">{step.instruction}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="text-[11px] text-[#698172] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Rule of thumb for sitter: When in doubt, skip watering for a day.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#F6FAF7] border-t border-[#E3ECE5] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#CCD8CF] text-xs font-semibold"
          >
            Close
          </button>
          <button
            onClick={() => {
              handleSaveVacation();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#2D5A3C] hover:bg-[#23472F] text-white text-xs font-bold transition"
          >
            Save Vacation Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
