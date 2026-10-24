// Content generators for block art: stretch a hazard's drawing to fill its whole cell (a block
// hurts through all of it), and draw a one-pixel outline round a monster's picture in the
// palette color that stands out most from the scenery behind it. Both return new pixels and
// leave the block's other settings alone.
import { BLEN, TRANSPARENT } from '../../../formats/blocks';
import { contrastRatio, luminance } from '../sceneData';

/** The art's bounding box: pixels that aren't the sky colors. */
export function artBox(pixels: Uint8Array, sky: Set<number>): { x0: number; y0: number; x1: number; y1: number } | undefined {
  let x0 = BLEN;
  let y0 = BLEN;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < BLEN; y++)
    for (let x = 0; x < BLEN; x++) {
      if (sky.has(pixels[y * BLEN + x])) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  return x1 < 0 ? undefined : { x0, y0, x1, y1 };
}

/**
 * The hazard's drawing stretched (nearest pixel) to fill the cell, so what the player sees
 * matches where it hurts. Sky pixels inside the drawing take the art's own main color.
 */
export function fillHazard(pixels: Uint8Array, sky: Set<number>): Uint8Array | undefined {
  const box = artBox(pixels, sky);
  if (!box) return undefined;
  const w = box.x1 - box.x0 + 1;
  const hgt = box.y1 - box.y0 + 1;
  const count = new Uint32Array(256);
  for (const p of pixels) if (!sky.has(p)) count[p]++;
  const main = count.indexOf(Math.max(...count));
  const out = new Uint8Array(BLEN * BLEN);
  for (let y = 0; y < BLEN; y++)
    for (let x = 0; x < BLEN; x++) {
      const sx = box.x0 + Math.floor((x * w) / BLEN);
      const sy = box.y0 + Math.floor((y * hgt) / BLEN);
      const p = pixels[sy * BLEN + sx];
      out[y * BLEN + x] = sky.has(p) ? main : p;
    }
  return out;
}

/** The palette color (among the first 256) with the most contrast against `behind`. */
export function contrastColor(pal: Uint8Array, behind: number, avoid: Set<number> = new Set()): number {
  const lb = luminance(pal, behind);
  let best = 0;
  let bestR = 0;
  for (let i = 0; i < 255; i++) {
    if (avoid.has(i)) continue;
    const r = contrastRatio(luminance(pal, i), lb);
    if (r > bestR) {
      bestR = r;
      best = i;
    }
  }
  return best;
}

/** A sprite with a one-pixel rim of `color` on its see-through pixels that touch its drawing. */
export function outline(pixels: Uint8Array, color: number): Uint8Array {
  const out = pixels.slice();
  for (let y = 0; y < BLEN; y++)
    for (let x = 0; x < BLEN; x++) {
      if (pixels[y * BLEN + x] !== TRANSPARENT) continue;
      const near = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < BLEN && ny < BLEN && pixels[ny * BLEN + nx] !== TRANSPARENT;
      });
      if (near) out[y * BLEN + x] = color;
    }
  return out;
}
