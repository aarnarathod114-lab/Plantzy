import React, { useMemo, useState } from 'react';
import {
  Sprout,
  MapPin,
  Leaf,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Search,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { CATALOG_COUNT_LABEL, PLANT_CATALOG } from '../data/plantCatalog';
import { CatalogPlant } from '../types/plant';
import { CATALOG_FILTERS, searchCatalog, type CatalogFilterId } from '../utils/catalogSearch';
import { onPlantImageError } from '../utils/plantArt';

const PAGE_SIZE = 60;

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { updateUserProfile, userProfile, addPlant, updateCity } = usePlant();

  const [step, setStep] = useState<number>(1);
  const [userName, setUserName] = useState<string>(userProfile.name || '');
  const [userCity, setUserCity] = useState<string>(userProfile.city || 'Mumbai, IN');
  const [units, setUnits] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [selectedCatalogPlants, setSelectedCatalogPlants] = useState<CatalogPlant[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<CatalogFilterId>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [reminderTime, setReminderTime] = useState<string>('08:30');
  const [quietHoursStart, setQuietHoursStart] = useState<string>('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState<string>('07:30');

  const filteredCatalog = useMemo(
    () => searchCatalog(PLANT_CATALOG, searchQuery, selectedCat),
    [searchQuery, selectedCat]
  );

  if (!isOpen) return null;

  const toggleCatalogSelect = (plant: CatalogPlant) => {
    if (selectedCatalogPlants.some((p) => p.id === plant.id)) {
      setSelectedCatalogPlants(selectedCatalogPlants.filter((p) => p.id !== plant.id));
    } else {
      setSelectedCatalogPlants([...selectedCatalogPlants, plant]);
    }
  };

  const handleFinish = async () => {
    updateUserProfile({
      name: userName || 'Plant Friend',
      city: userCity || 'Mumbai, IN',
      units,
      reminderTimes: [reminderTime],
      quietHoursStart,
      quietHoursEnd,
      isOnboarded: true,
    });

    if (userCity) {
      await updateCity(userCity);
    }

    selectedCatalogPlants.forEach((catalogPlant) => {
      addPlant({
        name: catalogPlant.name,
        species: catalogPlant.species,
        vernacularName: catalogPlant.vernacularName,
        category: catalogPlant.category,
        image: catalogPlant.image,
        location: catalogPlant.indoorOutdoor === 'outdoor' ? 'Balcony / Terrace' : 'Living Room Window',
        indoorOutdoor: catalogPlant.indoorOutdoor,
        potSize: catalogPlant.potSize,
        soilType: catalogPlant.soilPreference,
        drainage: 'has_drainage',
        lightRequirement: catalogPlant.lightRequirement,
        waterGuidance: catalogPlant.waterGuidance,
        temperatureRange: catalogPlant.temperatureRange,
        humidityPreference: catalogPlant.humidityPreference,
        fertilizingSchedule: catalogPlant.fertilizingNotes,
        pruningNeeds: catalogPlant.pruningNotes,
        notes: catalogPlant.careTip,
        status: 'healthy',
        soilMoistureTrend: 'balanced',
      });
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#E1E8E2] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header / Stepper (Mint Green background) */}
        <div className="p-6 bg-[#E8F8F2] border-b border-[#A3E9C8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#143D2B] text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5 text-[#86EFAC]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#065F46]">
                Plantzy Onboarding • Step {step} of 5
              </div>
              <h2 className="text-base font-bold text-[#0D2E1E]">
                {step === 1 && 'Welcome to Plantzy'}
                {step === 2 && 'Your Environment & Location'}
                {step === 3 && `Select Your Plants (${PLANT_CATALOG.length.toLocaleString()} Available)`}
                {step === 4 && 'Confirm Care Profiles'}
                {step === 5 && 'Daily Routine Preferences'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#D1F5E4] flex items-center justify-center text-[#143D2B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Line */}
        <div className="w-full bg-[#E8F8F2] h-1.5">
          <div
            className="bg-[#143D2B] h-1.5 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-[#E8F8F2] text-[#143D2B] border border-[#A3E9C8] flex items-center justify-center mx-auto mb-4 shadow-2xs">
                  <Sprout className="w-8 h-8 text-[#10B981]" />
                </div>
                <h3 className="font-serif-plant text-2xl font-bold text-[#0D2E1E]">
                  “What should we call you?”
                </h3>
                <p className="text-sm text-[#3E654E]">
                  Plantzy remembers care for all your plants and provides a gentle personalized morning checklist.
                </p>
              </div>

              <div className="max-w-sm mx-auto">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#143D2B] mb-2">
                  Your Name or Nickname
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Aarna, Rohan, Ananya"
                  className="w-full px-4 py-3 rounded-2xl border border-[#CCD8CF] focus:border-[#143D2B] outline-none text-base font-semibold text-[#0D2E1E] bg-[#FAFBF9]"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="w-14 h-14 rounded-3xl bg-[#FEF9E7] text-[#D97706] border border-[#FDE68A] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="font-serif-plant text-2xl font-bold text-[#0D2E1E]">
                  Where do your plants grow?
                </h3>
                <p className="text-sm text-[#3E654E]">
                  Monsoon rains, summer warmth, and humidity dictate root evaporation rates.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#143D2B] mb-2">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={userCity}
                    onChange={(e) => setUserCity(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Bengaluru, Pune, London"
                    className="w-full px-4 py-3 rounded-2xl border border-[#CCD8CF] focus:border-[#143D2B] outline-none text-base font-semibold text-[#0D2E1E] bg-[#FAFBF9]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Mumbai, IN', 'Delhi, IN', 'Bengaluru, IN', 'Pune, IN', 'Kolkata, IN', 'Chennai, IN'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setUserCity(city)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition font-bold ${
                        userCity === city
                          ? 'bg-[#143D2B] text-white border-[#143D2B]'
                          : 'bg-[#E8F8F2] text-[#065F46] border-[#A3E9C8] hover:bg-[#D1F5E4]'
                      }`}
                    >
                      {city.split(',')[0]}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#143D2B] mb-2">
                    Temperature Unit
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUnits('celsius')}
                      className={`py-2.5 px-4 rounded-2xl border text-xs font-bold transition ${
                        units === 'celsius'
                          ? 'bg-[#E8F8F2] text-[#065F46] border-[#143D2B]'
                          : 'bg-white text-[#4A6B56] border-[#CCD8CF]'
                      }`}
                    >
                      Celsius (°C)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnits('fahrenheit')}
                      className={`py-2.5 px-4 rounded-2xl border text-xs font-bold transition ${
                        units === 'fahrenheit'
                          ? 'bg-[#E8F8F2] text-[#065F46] border-[#143D2B]'
                          : 'bg-white text-[#4A6B56] border-[#CCD8CF]'
                      }`}
                    >
                      Fahrenheit (°F)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PLANT SETUP */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif-plant text-xl font-bold text-[#0D2E1E]">
                    “What plants do you have?”
                  </h3>
                  <p className="text-xs text-[#3E654E]">
                    Search {PLANT_CATALOG.length.toLocaleString()} houseplants, flowers, herbs, edibles and trees.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E8F8F2] text-[#065F46] border border-[#A3E9C8] self-start sm:self-auto">
                  {selectedCatalogPlants.length} selected
                </span>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6B8072]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Search by common, botanical or Hindi name..."
                  aria-label="Search the plant catalog"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#CCD8CF] focus:border-[#143D2B] outline-none text-xs font-medium"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                {CATALOG_FILTERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selectedCat === c.id}
                    onClick={() => {
                      setSelectedCat(c.id);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition ${
                      selectedCat === c.id
                        ? 'bg-[#143D2B] text-white'
                        : 'bg-[#E8F8F2] text-[#065F46] hover:bg-[#D1F5E4]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Plant selection grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                {filteredCatalog.slice(0, visibleCount).map((plant) => {
                  const isSelected = selectedCatalogPlants.some((p) => p.id === plant.id);
                  return (
                    <div
                      key={plant.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => toggleCatalogSelect(plant)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleCatalogSelect(plant);
                        }
                      }}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col focus-visible:outline-2 focus-visible:outline-[#143D2B] ${
                        isSelected
                          ? 'border-[#143D2B] bg-[#E8F8F2] ring-2 ring-[#143D2B]/20 shadow-xs'
                          : 'border-[#E1E8E2] bg-white hover:border-[#CCD8CF]'
                      }`}
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-[#E8F8F2]">
                        <img
                          src={plant.image}
                          onError={onPlantImageError}
                          loading="lazy"
                          alt={plant.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#143D2B] text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                          {plant.indoorOutdoor}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-[#0D2E1E] truncate">{plant.name}</div>
                      {plant.vernacularName && (
                        <div className="text-[10px] font-bold text-[#92400E] truncate">
                          {plant.vernacularName}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredCatalog.length === 0 && (
                  <p className="col-span-full text-xs text-[#3E654E] py-6 text-center">
                    No plants match that search. You can add any plant manually after setup.
                  </p>
                )}
                {filteredCatalog.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="col-span-full py-2 rounded-2xl bg-[#E8F8F2] hover:bg-[#D1F5E4] text-[#065F46] text-xs font-bold transition"
                  >
                    Show more ({(filteredCatalog.length - visibleCount).toLocaleString()} remaining)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: PLANT DETAILS CONFIRMATION */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto space-y-1">
                <h3 className="font-serif-plant text-2xl font-bold text-[#0D2E1E]">
                  Confirming Your Plants ({selectedCatalogPlants.length})
                </h3>
                <p className="text-xs text-[#3E654E]">
                  Plantzy automatically configures lighting and moisture preferences.
                </p>
              </div>

              {selectedCatalogPlants.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#E8F8F2] border border-[#A3E9C8] text-center">
                  <Leaf className="w-8 h-8 text-[#143D2B] mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-bold text-[#143D2B]">
                    No plants selected yet.
                  </p>
                  <p className="text-xs text-[#3E654E] mt-1">
                    You can go back to pick from our {CATALOG_COUNT_LABEL} catalog or start with demo plants!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedCatalogPlants.map((plant) => (
                    <div
                      key={plant.id}
                      className="p-3.5 rounded-2xl border border-[#E1ECE3] bg-white flex items-center gap-3.5 shadow-2xs"
                    >
                      <img
                        src={plant.image}
                        onError={onPlantImageError}
                        loading="lazy"
                        alt={plant.name}
                        className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#0D2E1E]">{plant.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F8F2] text-[#065F46] font-bold">
                            {plant.indoorOutdoor}
                          </span>
                        </div>
                        <div className="text-xs text-[#3E654E] mt-0.5 truncate">
                          Light: {plant.lightLabel} • Soil: {plant.soilPreference}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: ROUTINE PREFERENCES & COMPLETION */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="w-14 h-14 rounded-3xl bg-[#E8F8F2] text-[#143D2B] border border-[#A3E9C8] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                  <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                </div>
                <h3 className="font-serif-plant text-2xl font-bold text-[#0D2E1E]">
                  Your Plantzy routine is ready 🌱
                </h3>
                <p className="text-sm text-[#3E654E]">
                  Set your morning routine digest time and quiet hours so you're never disturbed.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#143D2B] mb-1.5">
                      Morning Routine Time
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-2xl border border-[#CCD8CF] text-sm font-bold bg-[#FAFBF9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#143D2B] mb-1.5">
                      Quiet Hours Start
                    </label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-2xl border border-[#CCD8CF] text-sm font-bold bg-[#FAFBF9]"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8] text-xs text-[#143D2B] space-y-1">
                  <div className="font-bold text-[#065F46]">What happens next?</div>
                  <p>
                    Every morning, Plantzy evaluates local weather, humidity, and your past soil checks into one unified checklist.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-5 bg-[#FAFBF9] border-t border-[#E8EDE9] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-2xl border border-[#CCD8CF] text-xs font-bold text-[#143D2B] hover:bg-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-7 py-3 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white text-sm font-bold flex items-center gap-2 shadow-md transition"
            >
              <Sprout className="w-4 h-4 text-[#86EFAC]" />
              <span>Launch My Routine 🌱</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
