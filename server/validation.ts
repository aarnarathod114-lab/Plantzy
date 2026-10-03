/**
 * Request and model-output validation. Everything here is pure so it can be
 * unit-tested without a running server.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const LIMITS = {
  question: 1_000,
  description: 500,
  symptoms: 1_000,
  city: 100,
  /** Decoded image size. */
  imageBytes: 8 * 1024 * 1024,
  contextJsonChars: 20_000,
} as const;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

/** Trim, drop control characters, collapse whitespace and enforce a length cap. */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export interface ParsedImage {
  mimeType: string;
  /** Raw base64 without the `data:` prefix. */
  data: string;
}

/**
 * Accepts either a `data:image/...;base64,` URL or bare base64 plus a MIME hint.
 * Returns `null` when no image was sent; throws when one was sent but is unusable.
 */
export function parseImage(imageBase64: unknown, mimeHint?: unknown): ParsedImage | null {
  if (imageBase64 === undefined || imageBase64 === null || imageBase64 === '') return null;
  if (typeof imageBase64 !== 'string') throw new ValidationError('Image must be a base64 string.');

  let mimeType = typeof mimeHint === 'string' ? mimeHint.toLowerCase() : 'image/jpeg';
  let data = imageBase64;

  const match = /^data:([a-z0-9.+/-]+);base64,(.*)$/is.exec(imageBase64);
  if (match) {
    mimeType = match[1].toLowerCase();
    data = match[2];
  }

  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new ValidationError('Unsupported image type. Use JPEG, PNG, WebP or HEIC.');
  }
  data = data.replace(/\s+/g, '');
  if (data.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw new ValidationError('Image data is not valid base64.');
  }
  const approxBytes = Math.floor((data.length * 3) / 4);
  if (approxBytes > LIMITS.imageBytes) {
    throw new ValidationError('Image is too large. Please use a photo under 8 MB.');
  }
  return { mimeType, data };
}

/** Serialise caller-supplied context for a prompt, bounded so it cannot blow up the request. */
export function boundedJson(value: unknown, maxChars: number = LIMITS.contextJsonChars): string {
  if (value === undefined || value === null) return '{}';
  let json: string;
  try {
    json = JSON.stringify(value);
  } catch {
    return '{}';
  }
  if (typeof json !== 'string') return '{}';
  return json.length > maxChars ? '{}' : json;
}

export function parseCoordinate(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

// ---------------------------------------------------------------------------
// Model output normalisation: never trust the shape of what a model returns.
// ---------------------------------------------------------------------------

const LIGHT_VALUES = ['low_light', 'medium_light', 'bright_indirect', 'direct_sun'] as const;
type Light = (typeof LIGHT_VALUES)[number];

export interface IdentifiedPlant {
  name: string;
  species: string;
  confidence: number;
  indoorOutdoor: 'indoor' | 'outdoor';
  lightRequirement: Light;
  lightLabel: string;
  waterGuidance: string;
  soilPreference: string;
  humidityPreference: string;
  temperatureRange: string;
  potRecommendation: string;
  notes: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Returns `null` when the model did not produce a usable identification. */
export function normaliseIdentification(raw: unknown): IdentifiedPlant | null {
  const r = asRecord(raw);
  const name = cleanText(r.name, 120);
  if (!name) return null;

  const confidence = Number(r.confidence);
  const light = LIGHT_VALUES.includes(r.lightRequirement as Light)
    ? (r.lightRequirement as Light)
    : 'bright_indirect';

  return {
    name,
    species: cleanText(r.species, 120),
    confidence: Number.isFinite(confidence) ? Math.round(Math.min(100, Math.max(0, confidence))) : 0,
    indoorOutdoor: r.indoorOutdoor === 'outdoor' ? 'outdoor' : 'indoor',
    lightRequirement: light,
    lightLabel: cleanText(r.lightLabel, 160),
    waterGuidance: cleanText(r.waterGuidance, 300),
    soilPreference: cleanText(r.soilPreference, 300),
    humidityPreference: cleanText(r.humidityPreference, 160),
    temperatureRange: cleanText(r.temperatureRange, 80),
    potRecommendation: cleanText(r.potRecommendation, 160),
    notes: cleanText(r.notes, 500),
  };
}

export interface HealthAnalysis {
  observedSigns: string[];
  potentialFactors: string[];
  actionChecklist: string[];
  summary: string;
}

function stringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item, 300))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function normaliseHealthAnalysis(raw: unknown): HealthAnalysis | null {
  const r = asRecord(raw);
  const analysis: HealthAnalysis = {
    observedSigns: stringList(r.observedSigns, 8),
    potentialFactors: stringList(r.potentialFactors, 8),
    actionChecklist: stringList(r.actionChecklist, 8),
    summary: cleanText(r.summary, 600),
  };
  const hasContent =
    analysis.summary.length > 0 ||
    analysis.observedSigns.length + analysis.potentialFactors.length + analysis.actionChecklist.length > 0;
  return hasContent ? analysis : null;
}
