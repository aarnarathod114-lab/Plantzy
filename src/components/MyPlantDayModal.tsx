import React, { useState } from 'react';
import {
  X,
  Droplets,
  RotateCw,
  Scissors,
  Thermometer,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { SoilCondition, PlantTask } from '../types/plant';
import { onPlantImageError } from '../utils/plantArt';

interface MyPlantDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyPlantDayModal: React.FC<MyPlantDayModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    routine,
    completeTask,
    skipTask,
    snoozeTask,
  } = usePlant();

  // Pending tasks list
  const pendingTasks = routine.allTasks.filter((t) => t.status === 'pending');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedSoil, setSelectedSoil] = useState<SoilCondition | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [showWhyToday, setShowWhyToday] = useState<boolean>(false);
  const [isCompletedAll, setIsCompletedAll] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTask: PlantTask | undefined = pendingTasks[currentIndex];

  const handleCompleteCurrent = () => {
    if (!currentTask) return;

    completeTask(currentTask.id, currentTask.plantId, selectedSoil, notes || undefined);

    setSelectedSoil(undefined);
    setNotes('');
    setShowWhyToday(false);

    if (currentIndex >= pendingTasks.length - 1) {
      setIsCompletedAll(true);
    }
  };

  const handleSkipCurrent = () => {
    if (!currentTask) return;
    skipTask(currentTask.id);
    setSelectedSoil(undefined);
    setNotes('');
    setShowWhyToday(false);

    if (currentIndex >= pendingTasks.length - 1) {
      setIsCompletedAll(true);
    }
  };

  const handleSnoozeCurrent = () => {
    if (!currentTask) return;
    snoozeTask(currentTask.id);
    setSelectedSoil(undefined);
    setNotes('');
    setShowWhyToday(false);

    if (currentIndex >= pendingTasks.length - 1) {
      setIsCompletedAll(true);
    }
  };

  const getTaskIcon = (taskType: PlantTask['taskType']) => {
    switch (taskType) {
      case 'soil_check':
      case 'water':
        return <Droplets className="w-5 h-5 text-[#059669]" />;
      case 'light_rotate':
        return <RotateCw className="w-5 h-5 text-[#D97706]" />;
      case 'pruning':
        return <Scissors className="w-5 h-5 text-[#E11D48]" />;
      case 'shelter':
        return <Thermometer className="w-5 h-5 text-[#DC2626]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#143D2B]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#DCE4DE] overflow-hidden flex flex-col">
        {/* Header (Mint Green) */}
        <div className="p-5 bg-[#E8F8F2] border-b border-[#A3E9C8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#143D2B] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#86EFAC]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#065F46]">
                Focused Care Mode
              </span>
              <h2 className="text-base font-bold text-[#0D2E1E]">My Plant Day</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#065F46] bg-white border border-[#A3E9C8] px-3 py-1 rounded-full shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#10B981]" />
              <span>~{routine.estimatedMinutes} min</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#D1F5E4] flex items-center justify-center text-[#143D2B]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex-1">
          {isCompletedAll || !currentTask ? (
            /* Celebration Screen in Mint & Pastel Yellow */
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-[#E8F8F2] text-[#143D2B] border border-[#A3E9C8] flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#065F46]">
                  All Set for Today 🌱
                </span>
                <h3 className="font-serif-plant text-2xl font-bold text-[#0D2E1E]">
                  Routine Completed!
                </h3>
                <p className="text-sm text-[#3E654E] max-w-sm mx-auto">
                  Your plants are hydrated, well-positioned, and your care history has been saved.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FEF9E7] border border-[#FDE68A] max-w-sm mx-auto text-xs text-[#92400E] space-y-1">
                <div className="font-bold text-[#78350F] flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                  <span>5-Day Plant Care Streak Maintained</span>
                </div>
                <p>
                  Plantzy has saved your observations to fine-tune tomorrow’s routine.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full max-w-sm py-3 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white font-bold text-sm shadow-md transition"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            /* Active Step Checklist */
            <div className="space-y-6">
              {/* Step indicator */}
              <div className="flex items-center justify-between text-xs font-bold text-[#4A6B56]">
                <span className="px-3 py-1 rounded-full bg-[#E8F8F2] text-[#065F46] border border-[#A3E9C8]">
                  Step {currentIndex + 1} of {pendingTasks.length}
                </span>
                <span className="text-[#3E654E]">{currentTask.location}</span>
              </div>

              {/* Plant Card Header */}
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#FAFBF9] border border-[#E4EDE6]">
                <img
                  src={currentTask.plantImage}
                  onError={onPlantImageError}
                  loading="lazy"
                  alt={currentTask.plantName}
                  className="w-16 h-16 rounded-2xl object-cover bg-gray-100 shrink-0 shadow-2xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-plant text-lg font-bold text-[#0D2E1E] truncate">
                      {currentTask.plantName}
                    </h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#065F46] font-bold shrink-0 border border-[#A3E9C8]">
                      {currentTask.indoorOutdoor}
                    </span>
                  </div>
                  <p className="text-xs text-[#557863] italic">{currentTask.plantSpecies}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#143D2B]">
                    {getTaskIcon(currentTask.taskType)}
                    <span>{currentTask.title}</span>
                  </div>
                </div>
              </div>

              {/* Specific Guidance */}
              <div className="p-4 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8] text-xs text-[#143D2B] leading-relaxed font-medium">
                <p>{currentTask.description}</p>
              </div>

              {/* Soil condition options (only shown for soil checks) */}
              {currentTask.taskType === 'soil_check' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#143D2B]">
                    How does the soil feel 1–2 inches down?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'very_dry', label: 'Very dry (Soak)' },
                      { id: 'slightly_dry', label: 'Slightly dry' },
                      { id: 'moist', label: 'Moist (Hold off)' },
                      { id: 'very_wet', label: 'Very wet (Soggy)' },
                      { id: 'not_checked', label: "Didn't check" },
                    ].map((cond) => (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => setSelectedSoil(cond.id as SoilCondition)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                          selectedSoil === cond.id
                            ? 'bg-[#143D2B] text-white border-[#143D2B] shadow-2xs'
                            : 'bg-white text-[#245E3F] border-[#A3E9C8] hover:bg-[#E8F8F2]'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Why Today? (Pastel Yellow Accent) */}
              <div className="rounded-2xl border border-[#FDE68A] overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowWhyToday(!showWhyToday)}
                  className="w-full p-3 text-left flex items-center justify-between text-xs font-bold text-[#92400E] bg-[#FEF9E7] hover:bg-[#FEF3C7] transition"
                >
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Why today?</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-[#92400E] transition-transform ${
                      showWhyToday ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {showWhyToday && (
                  <div className="p-3 text-xs text-[#78350F] leading-relaxed border-t border-[#FDE68A] bg-[#FEF9E7]">
                    {currentTask.whyToday}
                  </div>
                )}
              </div>

              {/* Optional observation notes */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional observation (e.g. fresh leaf shoot, dusted broad leaves)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#CCD8CF] text-xs outline-none focus:border-[#143D2B]"
                />
              </div>

              {/* Primary Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={handleCompleteCurrent}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#86EFAC]" />
                  <span>Completed</span>
                </button>

                <button
                  onClick={handleSkipCurrent}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white border border-[#CCD8CF] text-[#4A6B56] hover:bg-[#E8F8F2] text-xs font-bold transition"
                >
                  Skip
                </button>

                <button
                  onClick={handleSnoozeCurrent}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white border border-[#CCD8CF] text-[#4A6B56] hover:bg-[#E8F8F2] text-xs font-bold transition"
                >
                  Remind later
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
