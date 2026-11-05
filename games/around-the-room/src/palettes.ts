// Each room has its own time of day: the same palette with the sky ramp changed. Block pictures and the hero use
// the same color numbers in every room, so only the sky (and what is drawn in sky colors) changes.
import type { Pal } from '../../kit/starter/palette';
import type { Room } from './frame';

type RGB = [number, number, number];
/** The sky ramp's darkest, middle and lightest colors a room: noon, sunset, dusk and night. */
const SKIES: [RGB, RGB, RGB][] = [
  [
    [70, 150, 236],
    [130, 200, 250],
    [200, 238, 255],
  ],
  [
    [220, 96, 92],
    [250, 160, 112],
    [255, 226, 168],
  ],
  [
    [92, 70, 164],
    [150, 124, 214],
    [214, 194, 255],
  ],
  [
    [14, 24, 78],
    [34, 52, 128],
    [90, 112, 190],
  ],
];

/** The room's 768-byte palette (6-bit components). */
export function roomPalette(pal: Pal, k: Room): Uint8Array {
  const out = Uint8Array.from(pal.pal);
  const ramp = pal.r('sky');
  const [from, mid, to] = SKIES[k];
  ramp.forEach((index, i) => {
    const t = i / (ramp.length - 1);
    const [a, b, u] = t < 0.5 ? [from, mid, t * 2] : [mid, to, (t - 0.5) * 2];
    out.set(
      a.map((v, j) => Math.round(v + (b[j] - v) * u) >> 2),
      index * 3,
    );
  });
  return out;
}
