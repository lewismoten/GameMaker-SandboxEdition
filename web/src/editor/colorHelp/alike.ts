// Which palette colors look alike to someone whose red-green or blue-yellow differences are
// simulated (engine gfx/colorVision: Machado et al.). Two colors "look alike" when they are
// plainly different in normal vision but nearly the same in the chosen simulation. No DOM.
import { deltaEBytes, simulateBytes, type Rgb, type Vision } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { Warn, Preview } from './colorHelpPrefs';

/** Plainly different side by side in normal vision (CIE76 delta E)... */
const DISTINCT = 20;
/** ...but this close in the simulated view. */
const ALIKE = 6;

/** The simulations a choice stands for: red-green covers two kinds, blue-yellow one. */
const VISIONS: Record<'rg' | 'by', Vision[]> = { rg: ['protan', 'deutan'], by: ['tritan'] };

export const warnVisions = (w: Warn): Vision[] => (w === 'off' ? [] : w === 'both' ? [...VISIONS.rg, ...VISIONS.by] : VISIONS[w]);

/** A palette color as 0-255 bytes. */
const bytes = (pal: Palette, i: number): Rgb => [0, 1, 2].map((k) => Math.round((pal[i * 3 + k] * 255) / 63)) as Rgb;

/** The first simulation (of `visions`) in which two 0-255 colors look alike but are not, if any. */
export function alikeUnder(a: Rgb, b: Rgb, visions: Vision[]): Vision | undefined {
  if (deltaEBytes(a, b) < DISTINCT) return undefined;
  return visions.find((v) => deltaEBytes(simulateBytes(a, v), simulateBytes(b, v)) < ALIKE);
}

/** Palette colors that look alike to color `i` under `warn` (not `i` itself). */
export function alikeTo(pal: Palette, i: number, warn: Warn): number[] {
  const visions = warnVisions(warn);
  if (!visions.length) return [];
  const a = bytes(pal, i);
  const out: number[] = [];
  for (let j = 0; j < 256; j++) if (j !== i && alikeUnder(a, bytes(pal, j), visions)) out.push(j);
  return out;
}

/** Pairs (a < b) among `used` palette indexes that look alike under `warn`. */
export function alikePairs(pal: Palette, used: Iterable<number>, warn: Warn): [number, number][] {
  const visions = warnVisions(warn);
  const list = [...new Set(used)].sort((x, y) => x - y);
  const out: [number, number][] = [];
  if (!visions.length) return out;
  for (let x = 0; x < list.length; x++)
    for (let y = x + 1; y < list.length; y++) if (alikeUnder(bytes(pal, list[x]), bytes(pal, list[y]), visions)) out.push([list[x], list[y]]);
  return out;
}

/** Pairs of look-alike colors that touch (left-right or up-down) in a picture of palette indexes. */
export function touchingAlike(pixels: Uint8Array, w: number, h: number, pal: Palette, warn: Warn, skip?: number): [number, number][] {
  const pairs = new Set<number>();
  const note = (a: number, b: number) => a !== b && a !== skip && b !== skip && pairs.add(a < b ? a * 256 + b : b * 256 + a);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (x + 1 < w) note(pixels[y * w + x], pixels[y * w + x + 1]);
      if (y + 1 < h) note(pixels[y * w + x], pixels[(y + 1) * w + x]);
    }
  const visions = warnVisions(warn);
  const out: [number, number][] = [];
  if (!visions.length) return out;
  for (const k of pairs) {
    const a = k >> 8,
      b = k & 255;
    if (alikeUnder(bytes(pal, a), bytes(pal, b), visions)) out.push([a, b]);
  }
  return out.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
}

/** The views a preview choice shows, each with the simulation to draw (none = as it is). */
export function previewViews(p: Preview): { id: string; label: string; vision?: Vision }[] {
  const normal = { id: 'normal', label: 'As drawn' };
  const rg = { id: 'rg', label: 'Red-green', vision: 'deutan' as Vision };
  const by = { id: 'by', label: 'Blue-yellow', vision: 'tritan' as Vision };
  return p === 'normal' ? [normal] : p === 'rg' ? [normal, rg] : p === 'by' ? [normal, by] : [normal, rg, by];
}
