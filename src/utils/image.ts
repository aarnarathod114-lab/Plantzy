/**
 * Client-side photo preparation.
 *
 * Phone photos are 3–12 MB. Sending them as-is is slow, costs more to analyse,
 * exceeds the request limit on serverless hosts, and (because a plant's photo is
 * kept in localStorage) would exhaust browser storage after one or two plants.
 * Photos are therefore resized in the browser before they go anywhere.
 */

/** Largest raw file we will try to decode. Anything bigger is almost certainly not a photo. */
export const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

/** Long edge, in pixels, of the copy sent for AI analysis. */
export const ANALYSIS_EDGE = 1280;

/** Long edge, in pixels, of the copy stored with a plant. */
export const THUMBNAIL_EDGE = 480;

/** Scale `width` x `height` down to fit `maxEdge` on the long side. Never scales up. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (!(longest > 0) || longest <= maxEdge) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export class ImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageError';
  }
}

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Fall through to the <img> path, which supports a few formats createImageBitmap does not.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new ImageError('unreadable'));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Resize a photo to JPEG data URLs at the requested long-edge sizes.
 * Throws `ImageError` with a message suitable for showing to the user.
 */
export async function preparePhoto(file: File, edges: number[], quality = 0.82): Promise<string[]> {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageError('That file is too large. Please choose a photo under 30 MB.');
  }

  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new ImageError('That image could not be read. Please use a JPEG, PNG or WebP photo.');
  }

  try {
    return edges.map((edge) => {
      const { width, height } = fitWithin(decoded.width, decoded.height, edge);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new ImageError('Your browser could not process that image.');
      // JPEG has no transparency; paint white first so transparent PNGs do not turn black.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(decoded.source, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', quality);
    });
  } finally {
    decoded.release();
  }
}
