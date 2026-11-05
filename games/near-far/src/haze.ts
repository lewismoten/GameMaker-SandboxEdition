// NEAR AND FAR's far plane is paler because it loads its own palette: the near palette with every color
// (but black) mixed part of the way toward a pale sky blue. The blocks keep the same color numbers; only
// what the numbers mean changes. So the pale is drawn into the palette, not blurred by the engine.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

/** How much of the haze each color takes on, out of 100. */
const HAZE = 52;
/** The haze: a pale sky blue, in the palette's 6-bit steps (0 to 63). */
const MIST: [number, number, number] = [50, 59, 63];

/** The far plane's palette: the near one, 768 bytes, hazed. Color 0 stays black (fades use it). */
export function farPalette(pal: Pal): Uint8Array {
  const out = Uint8Array.from(pal.pal);
  for (let i = 1; i < 256; i++)
    for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.round((pal.pal[i * 3 + k] * (100 - HAZE) + MIST[k] * HAZE) / 100);
  return out;
}

/** For each near color, the near color nearest to its hazed look, so a picture drawn on the near palette can show a far panel. */
export function hazeMap(pal: Pal): Uint8Array {
  const far = farPalette(pal);
  const map = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < 256; j++) {
      let d = 0;
      for (let k = 0; k < 3; k++) d += (far[i * 3 + k] - pal.pal[j * 3 + k]) ** 2;
      if (d < bestD) (bestD = d), (best = j);
    }
    map[i] = best;
  }
  return map;
}

/** A copy of `p` with every color looked up in `map` (255, a clear pixel, stays). */
export function hazed(p: Pixels, map: Uint8Array): Pixels {
  return p.crop(0, 0, p.w, p.h).map((x, y, c) => (c === 255 ? c : map[c]));
}
