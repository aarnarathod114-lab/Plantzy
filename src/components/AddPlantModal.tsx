import React, { useMemo, useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  Plus,
  Leaf,
  Loader2,
  Upload,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { CATALOG_COUNT_LABEL, PLANT_CATALOG } from '../data/plantCatalog';
import { CatalogPlant } from '../types/plant';
import { CATALOG_FILTERS, searchCatalog, type CatalogFilterId } from '../utils/catalogSearch';
import { ANALYSIS_EDGE, ImageError, THUMBNAIL_EDGE, preparePhoto } from '../utils/image';
import { onPlantImageError, plantArt } from '../utils/plantArt';

/** Catalog results are rendered in pages so a broad search does not mount 1,000 cards at once. */
const PAGE_SIZE = 60;

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlantAdded: (plantId: string) => void;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  isOpen,
  onClose,
  onPlantAdded,
}) => {
  const { addPlant } = usePlant();

  const [activeTab, setActiveTab] = useState<'search' | 'ai' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CatalogFilterId>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // AI Identification State
  const [identifying, setIdentifying] = useState(false);
  const [aiPreviewImage, setAiPreviewImage] = useState<string | null>(null);
  // Small copy kept with the plant; the larger one above is only sent for identification.
  const [aiThumbnail, setAiThumbnail] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiCustomNotes, setAiCustomNotes] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Manual Form State
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [image, setImage] = useState('');
  const [location, setLocation] = useState('Living Room Window');
  const [indoorOutdoor, setIndoorOutdoor] = useState<'indoor' | 'outdoor'>('indoor');
  const [potSize, setPotSize] = useState('Medium (8")');
  const [soilType, setSoilType] = useState('Well-draining potting soil');
  const [drainage, setDrainage] = useState<'has_drainage' | 'no_drainage' | 'self_watering'>('has_drainage');
  const [lightRequirement, setLightRequirement] = useState<'low_light' | 'medium_light' | 'bright_indirect' | 'direct_sun'>('bright_indirect');
  const [waterGuidance, setWaterGuidance] = useState('Check soil first; soak when top 2 inches dry');
  const [notes, setNotes] = useState('');

  const filteredCatalog = useMemo(
    () => searchCatalog(PLANT_CATALOG, searchQuery, selectedCategory),
    [searchQuery, selectedCategory]
  );

  if (!isOpen) return null;

  // Handle Catalog plant selection
  const handleSelectCatalog = (catalogPlant: CatalogPlant) => {
    const newPlant = addPlant({
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
    onPlantAdded(newPlant.id);
  };

  // Handle Image Upload for AI
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    setAiError(null);
    if (!file) return;
    try {
      const [analysis, thumbnail] = await preparePhoto(file, [ANALYSIS_EDGE, THUMBNAIL_EDGE]);
      setAiPreviewImage(analysis);
      setAiThumbnail(thumbnail);
    } catch (err) {
      setAiError(err instanceof ImageError ? err.message : 'That image could not be read.');
    } finally {
      // Lets the same file be chosen again after an error.
      input.value = '';
    }
  };

  // Trigger server-side AI Identification
  const handleIdentifyWithAI = async () => {
    if (!aiPreviewImage && !aiCustomNotes) return;
    setIdentifying(true);
    setAiResult(null);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: aiPreviewImage,
          description: aiCustomNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.plant) {
        setAiResult(data.plant);
        setName(data.plant.name || 'Identified Plant');
        setSpecies(data.plant.species || '');
        setIndoorOutdoor(data.plant.indoorOutdoor || 'indoor');
        setWaterGuidance(data.plant.waterGuidance || '');
        setSoilType(data.plant.soilPreference || '');
        setPotSize(data.plant.potRecommendation || 'Medium (8")');
      } else {
        setAiError(
          data.message || 'Could not identify this plant. Try the catalog search or add it manually.'
        );
      }
    } catch (err) {
      console.error('AI Identification error:', err);
      setAiError('Could not reach the identification service. Check your connection and try again.');
    } finally {
      setIdentifying(false);
    }
  };

  const handleConfirmAiPlant = () => {
    if (!aiResult) return;
    const newPlant = addPlant({
      name: name || aiResult.name,
      species: species || aiResult.species,
      image: aiThumbnail || plantArt('foliage', name || aiResult.name),
      location: location || 'Living Room',
      indoorOutdoor: indoorOutdoor || aiResult.indoorOutdoor || 'indoor',
      potSize: potSize || aiResult.potRecommendation || 'Medium (8")',
      soilType: soilType || aiResult.soilPreference || 'Well-draining mix',
      drainage: drainage,
      lightRequirement: aiResult.lightRequirement || 'bright_indirect',
      waterGuidance: waterGuidance || aiResult.waterGuidance || 'Check top soil layer',
      temperatureRange: aiResult.temperatureRange || '18°C–28°C',
      humidityPreference: 'medium',
      fertilizingSchedule: 'Monthly during growing season',
      pruningNeeds: 'Prune dead stems and wipe leaves',
      notes: aiResult.notes || notes,
      status: 'healthy',
      soilMoistureTrend: 'balanced',
    });
    onPlantAdded(newPlant.id);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newPlant = addPlant({
      name,
      species: species || 'Custom Specimen',
      image: image || plantArt('foliage', name),
      location: location || 'Living Room',
      indoorOutdoor,
      potSize,
      soilType,
      drainage,
      lightRequirement,
      waterGuidance,
      temperatureRange: '18°C–28°C',
      humidityPreference: 'medium',
      fertilizingSchedule: 'Bi-monthly in spring/summer',
      pruningNeeds: 'Remove yellow leaves at base',
      notes,
      status: 'healthy',
      soilMoistureTrend: 'balanced',
    });

    onPlantAdded(newPlant.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-[#DCE4DE] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-[#E8F8F2] border-b border-[#A3E9C8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#143D2B] text-white flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5 text-[#86EFAC]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#065F46]">
                  Plant Collection
                </span>
                <span className="text-[10px] bg-[#FEF9E7] text-[#92400E] font-bold px-2 py-0.5 rounded-full border border-[#FDE68A]">
                  {CATALOG_COUNT_LABEL} Varieties
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#0D2E1E]">Add a Plant to Your Routine</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#D1F5E4] flex items-center justify-center text-[#143D2B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 border-b border-[#E8EDE9] flex gap-4 bg-[#FAFBF9]">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'search'
                ? 'border-[#143D2B] text-[#143D2B]'
                : 'border-transparent text-[#557863] hover:text-[#143D2B]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search {CATALOG_COUNT_LABEL} Plant Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'ai'
                ? 'border-[#E11D48] text-[#9F1239]'
                : 'border-transparent text-[#557863] hover:text-[#9F1239]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>Identify with AI</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'manual'
                ? 'border-[#D97706] text-[#92400E]'
                : 'border-transparent text-[#557863] hover:text-[#92400E]'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Add Manually</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: SEARCH CATALOG */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6B8072]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Search by common, botanical or Hindi name: Tulsi, Monstera, Ocimum, तुलसी..."
                  aria-label="Search the plant catalog"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#CCD8CF] focus:border-[#143D2B] outline-none text-xs font-medium bg-white"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                {CATALOG_FILTERS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={selectedCategory === cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                      selectedCategory === cat.id
                        ? 'bg-[#143D2B] text-white shadow-2xs'
                        : 'bg-[#E8F8F2] text-[#065F46] hover:bg-[#D1F5E4]'
                    }`}
                  >
                    {cat.id === 'all' ? `All (${PLANT_CATALOG.length.toLocaleString()})` : cat.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-semibold text-[#557863]" aria-live="polite">
                {filteredCatalog.length === 0
                  ? 'No plants match that search.'
                  : `${filteredCatalog.length.toLocaleString()} plant${filteredCatalog.length === 1 ? '' : 's'}`}
              </p>

              {filteredCatalog.length === 0 && (
                <div className="p-6 rounded-2xl bg-[#F6FAF7] border border-[#E1ECE3] text-center space-y-2">
                  <p className="text-xs text-[#3E654E]">
                    Not in the catalog yet? You can still track it.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('ai')}
                      className="px-3 py-1.5 rounded-xl bg-[#143D2B] text-white text-xs font-bold"
                    >
                      Identify from a photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName(searchQuery);
                        setActiveTab('manual');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#E8F8F2] text-[#065F46] text-xs font-bold"
                    >
                      Add “{searchQuery.trim()}” manually
                    </button>
                  </div>
                </div>
              )}

              {/* Plant selection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredCatalog.slice(0, visibleCount).map((plant) => (
                  <button
                    type="button"
                    key={plant.id}
                    onClick={() => handleSelectCatalog(plant)}
                    className="p-3 rounded-2xl border border-[#E1ECE3] hover:border-[#143D2B] hover:bg-[#E8F8F2] focus-visible:border-[#143D2B] focus-visible:outline-2 focus-visible:outline-[#143D2B] transition-all cursor-pointer flex items-center gap-3.5 group bg-white shadow-2xs text-left"
                  >
                    <img
                      src={plant.image}
                      alt=""
                      loading="lazy"
                      onError={onPlantImageError}
                      className="w-14 h-14 rounded-2xl object-cover bg-gray-100 shrink-0 group-hover:scale-105 transition-transform shadow-2xs"
                    />
                    <span className="flex-1 min-w-0 block">
                      <span className="block font-bold text-xs text-[#0D2E1E] truncate">{plant.name}</span>
                      {plant.vernacularName && (
                        <span className="block text-[10px] font-bold text-[#92400E] truncate">
                          {plant.vernacularName}
                        </span>
                      )}
                      <span className="block text-[10px] text-[#557863] italic truncate">{plant.species}</span>
                      <span className="block text-[10px] text-[#245E3F] mt-0.5 truncate font-medium">
                        {plant.lightLabel}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-[#143D2B] bg-[#D1F5E4] px-2 py-1 rounded-lg group-hover:bg-[#143D2B] group-hover:text-white transition">
                      + Add
                    </span>
                  </button>
                ))}
                {filteredCatalog.length > visibleCount && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="sm:col-span-2 py-2.5 rounded-2xl bg-[#E8F8F2] hover:bg-[#D1F5E4] text-[#065F46] text-xs font-bold transition"
                  >
                    Show more ({(filteredCatalog.length - visibleCount).toLocaleString()} remaining)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: IDENTIFY WITH AI */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto space-y-1">
                <h3 className="font-serif-plant text-xl font-bold text-[#0D2E1E]">
                  AI Plant Identification
                </h3>
                <p className="text-xs text-[#4A6B56]">
                  Upload a photo of your plant. Plantzy inspects leaves, stems, and automatically configures light and watering rules.
                </p>
              </div>

              {/* Upload Dropzone (Pastel Pink border / background) */}
              <div className="border-2 border-dashed border-[#F9CAD6] hover:border-[#E11D48] rounded-3xl p-6 text-center bg-[#FFF0F4] transition">
                {aiPreviewImage ? (
                  <div className="space-y-3">
                    <img
                      src={aiPreviewImage}
                      alt="Preview"
                      className="w-32 h-32 rounded-2xl object-cover mx-auto shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAiPreviewImage(null);
                        setAiThumbnail(null);
                      }}
                      className="text-xs text-[#E11D48] font-bold hover:underline"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer space-y-2 block">
                    <Upload className="w-8 h-8 text-[#E11D48] mx-auto opacity-80" />
                    <div className="text-xs font-bold text-[#9F1239]">
                      Click to upload photo or drag & drop
                    </div>
                    <p className="text-[10px] text-[#881337]">
                      JPG, PNG or WebP. Photos are resized on your device before upload.
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Optional Text Hint */}
              <div>
                <label className="text-xs font-bold text-[#143D2B]">
                  Optional Description or Details
                </label>
                <input
                  type="text"
                  value={aiCustomNotes}
                  onChange={(e) => setAiCustomNotes(e.target.value)}
                  placeholder="e.g. Has serrated aromatic leaves, white evening flowers"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                />
              </div>

              {/* Identification Button */}
              <button
                type="button"
                onClick={handleIdentifyWithAI}
                disabled={(!aiPreviewImage && !aiCustomNotes) || identifying}
                className="w-full py-3 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
              >
                {identifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#86EFAC]" />
                    <span>Analyzing Botanical Features...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#86EFAC]" />
                    <span>Identify Plant Specimen</span>
                  </>
                )}
              </button>

              {aiError && (
                <div role="alert" className="p-3.5 rounded-2xl bg-[#FEF9E7] border border-[#FDE68A] text-xs text-[#92400E] space-y-2">
                  <p className="font-semibold">{aiError}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('search')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#FDE68A] font-bold"
                    >
                      Search the catalog
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#FDE68A] font-bold"
                    >
                      Add manually
                    </button>
                  </div>
                </div>
              )}

              {/* AI Result Card */}
              {aiResult && (
                <div className="p-4 rounded-3xl bg-[#E8F8F2] border border-[#A3E9C8] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#065F46]">
                        {aiResult.confidence >= 80 ? 'Likely match' : 'Possible match'} · {aiResult.confidence}% model confidence
                      </span>
                      <h4 className="font-serif-plant text-base font-bold text-[#0D2E1E]">
                        {aiResult.name}
                      </h4>
                      <p className="text-xs text-[#245E3F] italic">{aiResult.species}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#065F46] border border-[#A3E9C8]">
                      {aiResult.indoorOutdoor}
                    </span>
                  </div>

                  <p className="text-xs text-[#143D2B] leading-relaxed">
                    <span className="font-bold">Care guidance:</span> {aiResult.waterGuidance}. {aiResult.soilPreference}.
                  </p>

                  <div className="pt-2 border-t border-[#D1F5E4] flex items-center justify-between gap-3">
                    <div className="text-[11px] text-[#245E3F]">
                      AI identification can be wrong. Check the name before adding.
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmAiPlant}
                      className="px-4 py-2 rounded-xl bg-[#143D2B] text-white text-xs font-bold shadow-xs hover:bg-[#0E2C1E] transition"
                    >
                      Confirm & Add 🌱
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD MANUALLY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#143D2B]">
                    Plant Nickname / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Balcony Rama Tulsi"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none focus:border-[#143D2B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#143D2B]">
                    Species (Botanical name)
                  </label>
                  <input
                    type="text"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    placeholder="e.g. Ocimum sanctum"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#143D2B]">
                    Location / Balcony / Room
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. East Balcony Railing, Living Room Shelf"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#143D2B]">Placement</label>
                  <select
                    value={indoorOutdoor}
                    onChange={(e) => setIndoorOutdoor(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor (Balcony / Terrace / Garden)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#143D2B]">Pot Size</label>
                  <input
                    type="text"
                    value={potSize}
                    onChange={(e) => setPotSize(e.target.value)}
                    placeholder='e.g. Medium (10") clay'
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#143D2B]">Soil Type</label>
                  <input
                    type="text"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    placeholder="e.g. Loam + vermicompost"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#143D2B]">Drainage</label>
                  <select
                    value={drainage}
                    onChange={(e) => setDrainage(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                  >
                    <option value="has_drainage">Has Drainage Holes</option>
                    <option value="no_drainage">No Drainage</option>
                    <option value="self_watering">Self-Watering Pot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#143D2B]">
                  Light Exposure
                </label>
                <select
                  value={lightRequirement}
                  onChange={(e) => setLightRequirement(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                >
                  <option value="low_light">Low indirect light</option>
                  <option value="medium_light">Medium filtered light</option>
                  <option value="bright_indirect">Bright, indirect sunlight</option>
                  <option value="direct_sun">Full direct sun</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#143D2B]">
                  Photo URL (optional)
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white font-bold text-xs shadow-xs transition"
              >
                Save Plant to Routine 🌱
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
