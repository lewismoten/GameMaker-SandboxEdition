// A box on the shelf stands spine out, so its spine is drawn small, at the size it shows, as a
// canvas: no picture address, so no request to load it and nothing to release. The box drawn
// whole (when it is turned face out or taken down) has all its sides as pictures as before.

/** The tallest a spine stands on the shelf (shelfLayout MAX_U, 9.25 inches) at 3 pixels to a CSS pixel. */
const SPINE_PX = 256;

const spines = new WeakMap<object, HTMLCanvasElement>();

/** Keeps `spine`, shrunk to what the shelf shows, for these faces. */
export function setSpine(faces: object, spine: HTMLCanvasElement): void {
  const k = Math.min(1, SPINE_PX / spine.height);
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(spine.width * k));
  small.height = Math.max(1, Math.round(spine.height * k));
  const ctx = small.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(spine, 0, 0, small.width, small.height);
  spines.set(faces, small);
}

/** The small spine of a shelf box's faces, if it has one. */
export function spineOf(faces: object): HTMLCanvasElement | undefined {
  return spines.get(faces);
}

/** A canvas with the same picture (each box model needs its own element). */
export function copyOf(c: HTMLCanvasElement): HTMLCanvasElement {
  const o = document.createElement('canvas');
  o.width = c.width;
  o.height = c.height;
  o.getContext('2d')?.drawImage(c, 0, 0);
  return o;
}
