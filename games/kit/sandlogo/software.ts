// Flat SOFTWARE lettering and reserved palette colors for indexed logo frames.
import { DistanceGrid, textStrokes } from '@lewismoten/gamemaker-sandbox-tools/kit/sdftext';
import { W, H, SOFT_START, SOFT_ZOOM } from './settings';
import { fatter } from './lettering';

// ---- SOFTWARE ------------------------------------------------------------------------
// Drawn flat on top of the dithered render, the way a 1995 animator lettered over a
// render: bold yellow in three solid bands with a thick black outline and drop shadow, so
// it reads over the castle and sky at 320x200 in every frame.

/** Palette entries kept for the lettering: black, then light yellow, yellow and orange. */
export const FLAT: [number, number, number][] = [
  [0, 0, 0],
  [255, 250, 170],
  [255, 214, 0],
  [235, 128, 0],
];
const SOFT_CX = 160;
const SOFT_MID = 80;
/** Cap height in screen rows at full size. */
const SOFT_ROWS = 17;
const OUTLINE = 3;

let softText: { grid: DistanceGrid; x0: number; x1: number } | undefined;
function softwareText() {
  if (!softText) {
    const segs = fatter(textStrokes('SOFTWARE', 1, 0, 0.32), 1.55);
    const xs = segs.flatMap(([a, , b, , r]) => [a - r, b + r]);
    softText = { grid: new DistanceGrid(segs, 0.01, 0.3), x0: Math.min(...xs), x1: Math.max(...xs) };
  }
  return softText;
}

/** SOFTWARE's size at frame f (0 = not shown yet). */
function softScale(f: number): number {
  const k = f - SOFT_START;
  return k < 0 ? 0 : SOFT_ZOOM[Math.min(k, SOFT_ZOOM.length - 1)];
}

/** Where SOFTWARE sits at a scale: its baseline, pixels per unit across and rows per unit up. */
function softPlace(s: number) {
  const rows = SOFT_ROWS * s;
  return { rows, unit: rows * 1.2, base: SOFT_MID + rows / 2 };
}

/** Letters SOFTWARE over an indexed frame in the flat colors (no dither). */
export function drawSoftware(px: Uint8Array, f: number): Uint8Array {
  const s = softScale(f);
  if (!s) return px;
  const { rows, unit, base } = softPlace(s);
  const t = softwareText();
  const x0 = Math.max(0, Math.floor(SOFT_CX + t.x0 * unit - 8));
  const x1 = Math.min(W - 1, Math.ceil(SOFT_CX + t.x1 * unit + 8));
  const y0 = Math.max(0, Math.floor(base - rows - 8));
  const y1 = Math.min(H - 1, Math.ceil(base + 8));
  // 0 nothing, 1 outline, 2.. the fill's palette entry + 1
  const kind = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const ux = (x + 0.5 - SOFT_CX) / unit;
      const uy = (base - (y + 0.5)) / rows;
      const d = t.grid.at(ux, uy) * unit;
      if (d < 0) kind[y * W + x] = 1 + (uy > 0.6 ? 1 : uy > 0.2 ? 2 : 3);
      else if (d < Math.max(1.2, OUTLINE * Math.min(1, s))) kind[y * W + x] = 1;
    }
  // the drop shadow, then the outline and the fill
  const sh = Math.max(1, Math.round(3 * s));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) if (kind[y * W + x] && x + sh < W && y + sh < H && !kind[(y + sh) * W + x + sh]) px[(y + sh) * W + x + sh] = 0;
  for (let i = 0; i < kind.length; i++) if (kind[i]) px[i] = kind[i] === 1 ? 0 : kind[i] - 1;
  return px;
}
