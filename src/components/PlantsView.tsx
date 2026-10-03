import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowRight,
  Leaf,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { CATALOG_COUNT_LABEL, PLANT_CATALOG } from '../data/plantCatalog';
import { onPlantImageError } from '../utils/plantArt';

interface PlantsViewProps {
  onSelectPlant: (plantId: string) => void;
  onOpenAddPlant: () => void;
}

export const PlantsView: React.FC<PlantsViewProps> = ({
  onSelectPlant,
  onOpenAddPlant,
}) => {
  const { plants, weather } = usePlant();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'indoor' | 'outdoor' | 'needs_attention' | 'healthy'>('all');

  const filteredPlants = plants.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(search.toLowerCase()) ||
      plant.species.toLowerCase().includes(search.toLowerCase()) ||
      plant.location.toLowerCase().includes(search.toLowerCase()) ||
      (plant.vernacularName && plant.vernacularName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'indoor') return plant.indoorOutdoor === 'indoor';
    if (filter === 'outdoor') return plant.indoorOutdoor === 'outdoor';
    if (filter === 'needs_attention')
      return plant.status === 'needs_attention' || plant.status === 'warning';
    if (filter === 'healthy') return plant.status === 'healthy';

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#143D2B]">
              Collection Management
            </span>
            <span className="text-[10px] bg-[#E8F8F2] text-[#065F46] font-bold px-2.5 py-0.5 rounded-full border border-[#A3E9C8]">
              {plants.length} Plant{plants.length !== 1 ? 's' : ''} in Routine
            </span>
          </div>
          <h1 className="font-serif-plant text-3xl sm:text-4xl font-extrabold text-[#0D2E1E] mt-1">
            My Plants
          </h1>
          <p className="text-sm text-[#3E654E] mt-1">
            Explore your active collection or browse our catalog of {PLANT_CATALOG.length.toLocaleString()} Indian & global plants.
          </p>
        </div>

        <button
          onClick={onOpenAddPlant}
          className="px-5 py-3 rounded-2xl bg-[#143D2B] hover:bg-[#0E2C1E] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#86EFAC]" />
          <span>Add New Plant</span>
        </button>
      </div>

      {/* Filter and Search Bar with Pastel Palette */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-3xl border border-[#E1ECE3] shadow-2xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6B8072]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, species, room, Tulsi, Mogra..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-[#CCD8CF] focus:border-[#143D2B] outline-none"
          />
        </div>

        {/* Filter Pills in Pastel Tones */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Plants' },
            { id: 'indoor', label: 'Indoor' },
            { id: 'outdoor', label: 'Outdoor / Balcony' },
            { id: 'needs_attention', label: 'Needs Attention' },
            { id: 'healthy', label: 'Healthy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                filter === tab.id
                  ? 'bg-[#143D2B] text-white shadow-2xs'
                  : 'bg-[#E8F8F2] text-[#065F46] hover:bg-[#D1F5E4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plants Grid */}
      {filteredPlants.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E2EAE3] space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#E8F8F2] text-[#143D2B] flex items-center justify-center mx-auto">
            <Leaf className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="font-serif-plant text-xl font-bold text-[#0D2E1E]">
            No plants match your filter
          </h3>
          <p className="text-xs text-[#3E654E] max-w-sm mx-auto">
            Try adjusting your search terms or add from our catalog of {CATALOG_COUNT_LABEL} plants!
          </p>
          <button
            onClick={onOpenAddPlant}
            className="px-5 py-2.5 rounded-2xl bg-[#143D2B] text-white text-xs font-bold transition shadow-xs"
          >
            + Add a Plant from {CATALOG_COUNT_LABEL} Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant) => {
            const lastSoil = plant.soilHistory[plant.soilHistory.length - 1];
            return (
              <div
                key={plant.id}
                onClick={() => onSelectPlant(plant.id)}
                className="bg-white rounded-3xl overflow-hidden border border-[#E2EAE3] hover:border-[#143D2B] hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                {/* Image and Badges */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-[#E8F8F2]">
                  <img
                    src={plant.image}
                    onError={onPlantImageError}
                    loading="lazy"
                    alt={plant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                      {plant.indoorOutdoor}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs ${
                        plant.status === 'healthy'
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#F59E0B] text-white'
                      }`}
                    >
                      {plant.status === 'healthy' ? 'Healthy' : 'Needs Check'}
                    </span>
                  </div>

                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-white/95 text-[#143D2B] backdrop-blur-xs shadow-xs">
                    {plant.location}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif-plant text-lg font-bold text-[#0D2E1E] group-hover:text-[#143D2B] transition-colors">
                      {plant.name}
                    </h3>
                    {plant.vernacularName && (
                      <div className="text-[11px] font-bold text-[#92400E]">
                        {plant.vernacularName}
                      </div>
                    )}
                    <p className="text-xs text-[#557863] italic mt-0.5">{plant.species}</p>

                    {/* Environmental & Soil Insight Tag */}
                    <div className="mt-3 p-3 rounded-2xl bg-[#E8F8F2] border border-[#A3E9C8] text-xs text-[#143D2B] space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#065F46]">Last Soil Moisture</span>
                        <span className="text-[#143D2B]">
                          {lastSoil?.condition ? lastSoil.condition.replace('_', ' ') : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#245E3F] line-clamp-1 font-medium">
                        {plant.indoorOutdoor === 'outdoor' && weather
                          ? `Balcony at ${weather.temperature}°C • Check depth before watering`
                          : `Indoor spot • ${plant.lightRequirement.replace('_', ' ')}`}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 border-t border-[#F0F4F1] flex items-center justify-between text-xs font-bold text-[#143D2B]">
                    <span>View Care Profile & Log</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
