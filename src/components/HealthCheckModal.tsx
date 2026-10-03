import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Droplets,
  Sun,
  Search,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { ANALYSIS_EDGE, ImageError, preparePhoto } from '../utils/image';

interface HealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthCheckModal: React.FC<HealthCheckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { plants } = usePlant();

  const [selectedPlantId, setSelectedPlantId] = useState<string>(plants[0]?.id || '');
  const [symptoms, setSymptoms] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [isGeneralGuidance, setIsGeneralGuidance] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    setError(null);
    if (!file) return;
    try {
      const [analysis] = await preparePhoto(file, [ANALYSIS_EDGE]);
      setImagePreview(analysis);
    } catch (err) {
      setError(err instanceof ImageError ? err.message : 'That image could not be read.');
    } finally {
      input.value = '';
    }
  };

  const handleInspect = async () => {
    if (!imagePreview && !symptoms) return;

    setAnalyzing(true);
    setResult(null);
    setError(null);

    const selectedPlant = plants.find((p) => p.id === selectedPlantId);

    try {
      const res = await fetch('/api/ai/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          symptoms,
          plantContext: selectedPlant
            ? {
                name: selectedPlant.name,
                species: selectedPlant.species,
                location: selectedPlant.location,
                indoorOutdoor: selectedPlant.indoorOutdoor,
                light: selectedPlant.lightRequirement,
                lastSoilCheck: selectedPlant.lastSoilCheck,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setResult(data.analysis);
        setIsGeneralGuidance(Boolean(data.isFallback));
      } else {
        setError(data.message || 'The health check could not be completed. Please try again.');
      }
    } catch (err) {
      console.error('Health check inspection error:', err);
      setError('Could not reach the health check service. Check your connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#DCE4DE] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-[#F6FAF7] border-b border-[#E3ECE5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D5A3C] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#86EFAC]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A3C]">
                Botanical Diagnostics
              </span>
              <h2 className="text-base font-bold text-[#183624]">AI Plant Health Check</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#E8F0EA] flex items-center justify-center text-[#556D5F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Plant Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#496554] mb-1.5">
              Select Affected Plant (Optional)
            </label>
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#CCD8CF] outline-none"
            >
              <option value="">-- General Inspection --</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species})
                </option>
              ))}
            </select>
          </div>

          {/* Photo Upload Area */}
          <div className="border-2 border-dashed border-[#CCD8CF] hover:border-[#2D5A3C] rounded-2xl p-5 text-center bg-[#FAFBF9] transition">
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Inspection"
                  className="w-28 h-28 rounded-xl object-cover mx-auto shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="text-xs text-[#DC2626] font-semibold hover:underline"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <label className="cursor-pointer space-y-1 block">
                <Upload className="w-7 h-7 text-[#2D5A3C] mx-auto opacity-70 mb-1" />
                <div className="text-xs font-bold text-[#1B3626]">
                  Upload photo of leaf, stem, or soil
                </div>
                <p className="text-[10px] text-[#698172]">
                  Photos of affected foliage yield the best insight
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

          {/* Observed symptoms quick chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#496554] mb-1.5">
              Observed Symptoms
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                'Yellowing lower leaves',
                'Brown leaf tips',
                'Drooping foliage',
                'Dry curling edges',
                'Small dark spots',
                'Slow growth',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setSymptoms((prev) => (prev ? `${prev}, ${chip}` : chip))
                  }
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#D5E3D8] hover:bg-[#EBF4EE] text-[#2D5A3C]"
                >
                  + {chip}
                </button>
              ))}
            </div>

            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe symptoms (e.g. Lower leaves turning yellow with slight softening, top inch of soil moist)"
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#CCD8CF] outline-none"
            />
          </div>

          {/* Inspection Button */}
          <button
            onClick={handleInspect}
            disabled={(!imagePreview && !symptoms) || analyzing}
            className="w-full py-3 rounded-xl bg-[#2D5A3C] hover:bg-[#23472F] disabled:opacity-40 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#86EFAC]" />
                <span>Running Botanical Inspection...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#86EFAC]" />
                <span>Analyze Plant Health</span>
              </>
            )}
          </button>

          {error && (
            <div role="alert" className="p-3.5 rounded-2xl bg-[#FEF9E7] border border-[#FDE68A] text-xs font-semibold text-[#92400E]">
              {error}
            </div>
          )}

          {/* Diagnostic Result */}
          {result && (
            <div className="p-4 rounded-2xl bg-[#F0F8F2] border border-[#CDE5D2] space-y-3">
              {isGeneralGuidance && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF9E7] border border-[#FDE68A] text-xs text-[#92400E]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>AI analysis is unavailable right now.</strong> Your photo and notes were not
                    analysed. This is a general checklist, not an assessment of your plant.
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isGeneralGuidance ? 'General Care Checklist' : 'Health Inspection Summary'}</span>
              </div>

              {result.observedSigns?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#1B3626]">Observed Signs:</span>
                  <ul className="text-xs text-[#3E654E] list-disc list-inside space-y-0.5">
                    {result.observedSigns.map((sign: string, i: number) => (
                      <li key={i}>{sign}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-[#20442E] leading-relaxed font-medium">
                {result.summary}
              </p>

              {result.potentialFactors?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#1B3626]">
                    Potential Associated Factors:
                  </span>
                  <ul className="text-xs text-[#3E654E] list-disc list-inside space-y-0.5">
                    {result.potentialFactors.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.actionChecklist?.length > 0 && (
                <div className="p-3 rounded-xl bg-white border border-[#D5EAD9] space-y-1">
                  <span className="text-[11px] font-bold text-[#163022]">
                    Recommended Action Checklist:
                  </span>
                  <ul className="text-xs text-[#4F6E5C] list-disc list-inside space-y-1">
                    {result.actionChecklist.map((act: string, i: number) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-[10px] text-[#698172] italic pt-1">
                This is guidance, not a diagnosis. Visible symptoms have many possible causes, so check soil moisture and light before changing your watering or feeding.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
