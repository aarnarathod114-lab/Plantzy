import React, { useState } from 'react';
import {
  X,
  Droplets,
  Sun,
  Thermometer,
  Scissors,
  Plus,
  Trash2,
  Edit2,
  Brain,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { SoilCondition, CareEvent } from '../types/plant';
import { onPlantImageError } from '../utils/plantArt';

interface PlantDetailModalProps {
  plantId: string | null;
  onClose: () => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plantId,
  onClose,
}) => {
  const { plants, updatePlant, deletePlant, addCareObservation, weather } = usePlant();

  const plant = plants.find((p) => p.id === plantId);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [showAddObsModal, setShowAddObsModal] = useState<boolean>(false);
  const [obsCondition, setObsCondition] = useState<SoilCondition>('slightly_dry');
  const [obsNotes, setObsNotes] = useState<string>('');
  const [obsTaskType, setObsTaskType] = useState<CareEvent['taskType']>('soil_check');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');

  if (!plant) return null;

  const handleStartEdit = () => {
    setEditName(plant.name);
    setEditLocation(plant.location);
    setEditNotes(plant.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updatePlant(plant.id, {
      name: editName,
      location: editLocation,
      notes: editNotes,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove ${plant.name} from Plantzy?`)) {
      deletePlant(plant.id);
      onClose();
    }
  };

  const handleSaveObservation = () => {
    addCareObservation(plant.id, obsCondition, obsNotes, obsTaskType);
    setShowAddObsModal(false);
    setObsNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-[#DCE4DE] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="relative aspect-video sm:aspect-21/9 w-full bg-[#E8F8F2] overflow-hidden">
          <img
            src={plant.image}
            onError={onPlantImageError}
            loading="lazy"
            alt={plant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close & Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={handleStartEdit}
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#143D2B] backdrop-blur-xs flex items-center justify-center transition shadow-xs"
              title="Edit Plant"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-[#FFF0F4] text-[#E11D48] backdrop-blur-xs flex items-center justify-center transition shadow-xs"
              title="Delete Plant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Plant Title Overlay */}
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs text-white">
                {plant.indoorOutdoor}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#10B981] text-white">
                {plant.status}
              </span>
              <span className="text-xs text-white/90 font-medium">• {plant.location}</span>
            </div>
            <h2 className="font-serif-plant text-2xl sm:text-3xl font-extrabold text-white">
              {plant.name}
            </h2>
            {plant.vernacularName && (
              <div className="text-xs font-bold text-[#FEF08A]">{plant.vernacularName}</div>
            )}
            <p className="text-xs text-white/80 italic">{plant.species}</p>
          </div>
        </div>

        {/* Tab Switcher in Mint */}
        <div className="px-6 pt-3 border-b border-[#E8EDE9] flex items-center justify-between bg-[#FAFBF9]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-xs font-bold border-b-2 transition ${
                activeTab === 'profile'
                  ? 'border-[#143D2B] text-[#143D2B]'
                  : 'border-transparent text-[#648772] hover:text-[#143D2B]'
              }`}
            >
              Care Profile & Requirements
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-[#143D2B] text-[#143D2B]'
                  : 'border-transparent text-[#648772] hover:text-[#143D2B]'
              }`}
            >
              <span>Care History</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-[#E8F8F2] text-[#065F46] font-bold">
                {plant.careHistory.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowAddObsModal(true)}
            className="mb-2 px-3 py-1.5 rounded-xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#86EFAC]" />
            <span>Add Observation</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Learning / Adaptive Schedule Banner (Mint Green) */}
              <div className="p-4 rounded-3xl bg-[#E8F8F2] border border-[#A3E9C8] flex items-start gap-3.5 shadow-2xs">
                <Brain className="w-5 h-5 text-[#143D2B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#065F46] uppercase tracking-wider">
                    Plantzy Adaptive Learning
                  </h4>
                  <p className="text-xs text-[#143D2B] mt-0.5 leading-relaxed font-medium">
                    {plant.soilMoistureTrend === 'holding_moisture'
                      ? 'This plant’s soil stays moist longer than typical. Plantzy spaces out soil inspections to avoid root waterlogging.'
                      : plant.soilMoistureTrend === 'drying_fast'
                      ? 'This plant dries out quickly in its warm location. Plantzy monitors the soil more frequently.'
                      : 'Plantzy observes your moisture readings to calculate optimal watering rhythm.'}
                  </p>
                </div>
              </div>

              {/* Requirement Cards Grid in Pastel Accents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sunlight: Pastel Yellow */}
                <div className="p-4 rounded-3xl bg-[#FEF9E7] border border-[#FDE68A] space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#92400E]">
                    <Sun className="w-4 h-4 text-[#D97706]" />
                    <span>Light Needs</span>
                  </div>
                  <p className="text-xs text-[#0D2E1E] font-bold capitalize">
                    {plant.lightRequirement.replace('_', ' ')}
                  </p>
                  <p className="text-[11px] text-[#78350F]">
                    Rotate pot 90° biweekly to ensure uniform photosynthesis on all leaf sides.
                  </p>
                </div>

                {/* Watering: Mint Green */}
                <div className="p-4 rounded-3xl bg-[#E8F8F2] border border-[#A3E9C8] space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                    <Droplets className="w-4 h-4 text-[#059669]" />
                    <span>Water Guidance</span>
                  </div>
                  <p className="text-xs text-[#0D2E1E] font-bold">{plant.waterGuidance}</p>
                  <p className="text-[11px] text-[#245E3F]">
                    Always feel top 2 inches of soil with finger before adding water.
                  </p>
                </div>

                {/* Temperature & Humidity: Pastel Pink */}
                <div className="p-4 rounded-3xl bg-[#FFF0F4] border border-[#F9CAD6] space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#9F1239]">
                    <Thermometer className="w-4 h-4 text-[#E11D48]" />
                    <span>Temperature & Humidity</span>
                  </div>
                  <p className="text-xs text-[#0D2E1E] font-bold">{plant.temperatureRange}</p>
                  <p className="text-[11px] text-[#881337]">
                    Humidity: <span className="capitalize">{plant.humidityPreference}</span>. Keep clear of AC drafts and hot winds.
                  </p>
                </div>

                {/* Soil & Drainage: Mint Green */}
                <div className="p-4 rounded-3xl bg-[#E8F8F2] border border-[#A3E9C8] space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                    <Scissors className="w-4 h-4 text-[#10B981]" />
                    <span>Soil & Potting</span>
                  </div>
                  <p className="text-xs text-[#0D2E1E] font-bold">{plant.soilType}</p>
                  <p className="text-[11px] text-[#245E3F]">
                    Pot: {plant.potSize} • Drainage: {plant.drainage.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Grooming & Notes */}
              <div className="p-4 rounded-3xl bg-[#FAFBF9] border border-[#E1ECE3] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#143D2B]">
                  Grooming & Seasonal Care
                </div>
                <div className="text-xs text-[#3E654E] space-y-1.5 leading-relaxed font-medium">
                  <p>
                    <span className="font-bold text-[#0D2E1E]">Pruning:</span> {plant.pruningNeeds}
                  </p>
                  <p>
                    <span className="font-bold text-[#0D2E1E]">Fertilizing:</span> {plant.fertilizingSchedule}
                  </p>
                  {plant.notes && (
                    <p>
                      <span className="font-bold text-[#0D2E1E]">Botanical Notes:</span> {plant.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="text-xs text-[#4A6B56] font-medium">
                Complete chronological log of care events, soil checks, and rotations.
              </div>

              <div className="relative pl-6 space-y-4 border-l-2 border-[#A3E9C8] ml-2">
                {plant.careHistory.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#143D2B] flex items-center justify-center group-hover:scale-125 transition-transform" />

                    <div className="p-3.5 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0D2E1E]">{item.action}</span>
                        <span className="text-[11px] text-[#4A6B56]">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {item.soilCondition && (
                        <div className="text-[11px] text-[#065F46] font-bold">
                          Recorded moisture: {item.soilCondition.replace('_', ' ')}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-xs text-[#245E3F] italic">“{item.notes}”</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Observation Logging Sub-Modal */}
        {showAddObsModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE4DE] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-plant text-lg font-bold text-[#0D2E1E]">
                  Add Observation for {plant.name}
                </h3>
                <button
                  onClick={() => setShowAddObsModal(false)}
                  className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#143D2B]">Action Type</label>
                  <select
                    value={obsTaskType}
                    onChange={(e) => setObsTaskType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                  >
                    <option value="soil_check">Soil Moisture Check</option>
                    <option value="water">Watered Thoroughly</option>
                    <option value="light_rotate">Rotated Pot</option>
                    <option value="prune">Pruned Stems / Groomed</option>
                    <option value="observation">General Health Note</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#143D2B]">
                    Soil Moisture Reading
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      { id: 'very_dry', label: 'Very Dry' },
                      { id: 'slightly_dry', label: 'Slightly Dry' },
                      { id: 'moist', label: 'Moist' },
                      { id: 'very_wet', label: 'Very Wet' },
                    ].map((cond) => (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => setObsCondition(cond.id as SoilCondition)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                          obsCondition === cond.id
                            ? 'bg-[#143D2B] text-white border-[#143D2B]'
                            : 'bg-[#E8F8F2] text-[#065F46] border-[#A3E9C8]'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#143D2B]">
                    Observation Notes
                  </label>
                  <input
                    type="text"
                    value={obsNotes}
                    onChange={(e) => setObsNotes(e.target.value)}
                    placeholder="e.g. New fresh shoot unfurling, fragrant buds"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleSaveObservation}
                  className="flex-1 py-2.5 rounded-xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white text-xs font-bold transition shadow-xs"
                >
                  Save Observation
                </button>
                <button
                  onClick={() => setShowAddObsModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#CCD8CF] text-xs font-bold text-[#4A6B56]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
