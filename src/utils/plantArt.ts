import type { CatalogPlant } from '../types/plant';

/**
 * Generated plant illustrations.
 *
 * A wrong photo is worse than no photo, and hotlinking 650 stock images is
 * neither accurate nor reliable. Catalog entries without a verified photo get
 * a small deterministic SVG tile instead: one glyph per category, with tint and
 * tilt varied by a hash of the plant id so neighbouring tiles do not look
 * identical. It is also the fallback when a remote photo fails to load.
 */
type Category = CatalogPlant['category'];

interface Palette {
  backgrounds: string[];
  primary: string[];
  dark: string;
  accent: string;
}

const PALETTES: Record<Category, Palette> = {
  foliage: { backgrounds: ['#E3F1E5', '#DCEFE3', '#E8F3DF'], primary: ['#4F9A63', '#5BA36B', '#3F8F5C'], dark: '#2D6B41', accent: '#A9D8B2' },
  tropical: { backgrounds: ['#DDF0EA', '#D8EEE4', '#E2F2EC'], primary: ['#2F8F7A', '#3A9A7F', '#2A8570'], dark: '#1B5E50', accent: '#9AD7C5' },
  succulent: { backgrounds: ['#EAF2E0', '#E4F0E6', '#EEF3E2'], primary: ['#7FAE6A', '#6FA98C', '#8DB479'], dark: '#4C7A3D', accent: '#C9E2BB' },
  flowering: { backgrounds: ['#FBE9EE', '#FDF0E4', '#F3E9F8'], primary: ['#E57A9A', '#EE9A5A', '#A77BD6', '#E8627A', '#F2B441'], dark: '#3F8F5C', accent: '#F7CE5B' },
  herb: { backgrounds: ['#EEF4DD', '#E9F2DF', '#F1F5DE'], primary: ['#86A93F', '#79A84C', '#93B048'], dark: '#55731F', accent: '#CFE09B' },
  medicinal: { backgrounds: ['#E8F0E4', '#E3EFE8', '#EBF1E0'], primary: ['#5E9B7A', '#6BA376', '#52957F'], dark: '#2F6B4F', accent: '#B5DBC4' },
  fruit_edible: { backgrounds: ['#FDF0DD', '#FCEBE0', '#F8F1D9'], primary: ['#F08A4B', '#E5604D', '#E9B93B', '#8DB04A'], dark: '#3F8F5C', accent: '#FBD9B8' },
  bonsai: { backgrounds: ['#F1ECE3', '#ECEFE3', '#F3EEE6'], primary: ['#4F9A63', '#5BA36B', '#3F8F5C'], dark: '#8B5E3C', accent: '#C9A27E' },
};

/** FNV-1a: small, fast and stable across runtimes. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const LEAF = 'M0-84C52-52 58 28 0 86C-58 28-52-52 0-84Z';

function glyph(category: Category, primary: string, palette: Palette): string {
  const { dark, accent } = palette;
  switch (category) {
    case 'foliage':
      return (
        `<path d="${LEAF}" fill="${primary}"/>` +
        `<path d="M0-70V78M0-30L26-48M0-30L-26-48M0 6L32-14M0 6L-32-14M0 40L24 22M0 40L-24 22" stroke="${accent}" stroke-width="4" stroke-linecap="round" fill="none"/>`
      );
    case 'tropical':
      return [-64, -32, 0, 32, 64]
        .map((deg, i) => `<path d="${LEAF}" fill="${i % 2 ? dark : primary}" transform="translate(0 78) rotate(${deg}) scale(.42 1) translate(0 -86)"/>`)
        .join('');
    case 'succulent': {
      const ring = (count: number, scale: number, fill: string, offset: number) =>
        Array.from({ length: count }, (_, i) => {
          const deg = (360 / count) * i + offset;
          return `<path d="${LEAF}" fill="${fill}" transform="rotate(${deg}) scale(${scale * 0.5} ${scale}) translate(0 -62)"/>`;
        }).join('');
      return ring(8, 0.62, dark, 0) + ring(8, 0.46, primary, 22.5) + ring(5, 0.28, accent, 0) + `<circle r="9" fill="${primary}"/>`;
    }
    case 'flowering': {
      const petals = Array.from({ length: 6 }, (_, i) => `<circle cx="0" cy="-44" r="30" fill="${primary}" transform="rotate(${i * 60})"/>`).join('');
      return (
        `<path d="M0 30V104" stroke="${dark}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="${LEAF}" fill="${dark}" transform="translate(22 84) rotate(58) scale(.22 .34)"/>` +
        `<g transform="translate(0 -14) scale(.82)">${petals}<circle r="24" fill="${accent}"/></g>`
      );
    }
    case 'herb':
    case 'medicinal': {
      const pair = (y: number, s: number) =>
        `<path d="${LEAF}" fill="${primary}" transform="translate(0 ${y}) rotate(-62) scale(${s * 0.3} ${s * 0.42}) translate(0 -84)"/>` +
        `<path d="${LEAF}" fill="${primary}" transform="translate(0 ${y}) rotate(62) scale(${s * 0.3} ${s * 0.42}) translate(0 -84)"/>`;
      return (
        `<path d="M0 92V-58" stroke="${dark}" stroke-width="6" stroke-linecap="round"/>` +
        pair(62, 1.15) + pair(22, 1) + pair(-16, 0.85) +
        `<path d="${LEAF}" fill="${dark}" transform="translate(0 -50) scale(.26 .36) translate(0 -84)"/>`
      );
    }
    case 'fruit_edible':
      return (
        `<circle cy="18" r="62" fill="${primary}"/>` +
        `<circle cx="-22" cy="-4" r="14" fill="#fff" opacity=".28"/>` +
        `<path d="M0-44C2-62 8-72 18-80" stroke="${dark}" stroke-width="7" stroke-linecap="round" fill="none"/>` +
        `<path d="${LEAF}" fill="${dark}" transform="translate(30 -64) rotate(62) scale(.3 .36)"/>`
      );
    case 'bonsai':
      return (
        `<path d="M-52 62H52L42 96H-42Z" fill="${dark}"/>` +
        `<path d="M-6 62C-10 30 14 14 4-18" stroke="${dark}" stroke-width="12" stroke-linecap="round" fill="none"/>` +
        `<circle cx="-30" cy="-22" r="30" fill="${primary}"/><circle cx="26" cy="-34" r="36" fill="${primary}"/><circle cx="-2" cy="-60" r="28" fill="${primary}"/>`
      );
  }
}

const cache = new Map<string, string>();

/** Deterministic SVG data URI for a plant. Same inputs always give the same tile. */
export function plantArt(category: Category = 'foliage', seed = ''): string {
  const key = `${category}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const palette = PALETTES[category] ?? PALETTES.foliage;
  const h = hash(key);
  const background = palette.backgrounds[h % palette.backgrounds.length];
  const primary = palette.primary[(h >>> 4) % palette.primary.length];
  // A potted tree looks wrong at an angle; everything else gets a slight, varied tilt.
  const tilt = category === 'bonsai' ? 0 : ((h >>> 8) % 25) - 12;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
    `<rect width="400" height="300" fill="${background}"/>` +
    `<circle cx="200" cy="150" r="118" fill="#fff" opacity=".45"/>` +
    `<g transform="translate(200 150) rotate(${tilt})">${glyph(category, primary, palette)}</g>` +
    `</svg>`;

  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  cache.set(key, uri);
  return uri;
}

/**
 * `onError` handler for plant `<img>` elements: if a remote photo fails to
 * load (offline, removed, blocked), swap in a generated tile instead of a
 * broken-image icon. Guarded so a failing fallback cannot loop.
 */
export function onPlantImageError(event: { currentTarget: HTMLImageElement }): void {
  const img = event.currentTarget;
  if (img.dataset.fallback === '1') return;
  img.dataset.fallback = '1';
  img.src = plantArt('foliage', img.alt);
}
