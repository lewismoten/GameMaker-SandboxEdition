// Which palette shows a sprite readably: one that does not paint most of its colors near black.
import { parsePalette, type Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

/** Below this brightness (0..63, VGA 6-bit) a color counts as near black. */
const DARK_LUMA = 14;

/** The share (0..1) of the used colors (palette indices) that are near black. */
export function darkShare(pal: Palette, used: ArrayLike<number>): number {
  let seen = 0;
  let dark = 0;
  for (let i = 0; i < used.length; i++) {
    const c = used[i];
    if (!c || c === 255) continue; // 0 is skipped as background, 255 is see-through
    seen++;
    if (0.299 * pal[c * 3] + 0.587 * pal[c * 3 + 1] + 0.114 * pal[c * 3 + 2] < DARK_LUMA) dark++;
  }
  return seen ? dark / seen : 0;
}

/** True when most of the sprite's colors would be dark on this palette. */
export const isTooDark = (pal: Palette, used: ArrayLike<number>): boolean => darkShare(pal, used) > 0.5;

/** The first candidate that is not too dark; else the least dark one; else the first. */
export function mostReadable(candidates: Uint8Array[], used: ArrayLike<number>): number {
  let best = 0;
  let bestShare = Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const share = darkShare(parsePalette(candidates[i]), used);
    if (share <= 0.5) return i;
    if (share < bestShare) [best, bestShare] = [i, share];
  }
  return best;
}

/** True when every one of the 256 colors is the same, so the palette shows as one solid block. */
export function isSolidPalette(bytes: Uint8Array): boolean {
  for (let i = 3; i < Math.min(bytes.length, 768); i++) if (bytes[i] !== bytes[i % 3]) return false;
  return true;
}
