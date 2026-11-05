// WALKING VERY FAR's palettes. The near one is the Starters' palette plus a ramp of distance colors (`dist`, from
// a dark green-blue hill to nearly the color of the sky). The far one is the same 256 colors with the scenery's
// ramps (sky, grass, stone, blue, purple, white) mixed part of the way toward a pale sky blue. Kit's colors, the
// signs' and the foreground's are left alone, so the tiny figure stays clear against the mist. Same numbers,
// two palettes: only what the numbers mean changes.
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

/** How much of the haze a hazed color takes on, out of 100. */
const HAZE = 55;
/** The haze: a pale sky blue, in the palette's 6-bit steps (0 to 63). */
const MIST: [number, number, number] = [50, 58, 63];
/** The ramps the haze changes. */
const HAZED = ['sky', 'grass', 'stone', 'blue', 'purple', 'white'];

/** The one palette every scene's numbers come from. */
export function buildPalette(): Pal {
  return buildStarterPalette((b) => b.ramp('dist', 5, [60, 120, 110], [196, 224, 240]));
}

/** The far scenes' palette: the near one, 768 bytes, with the scenery ramps hazed. Color 0 stays black. */
export function farPalette(pal: Pal): Uint8Array {
  const out = Uint8Array.from(pal.pal);
  for (const ramp of HAZED)
    for (const i of pal.r(ramp)) for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.round((pal.pal[i * 3 + k] * (100 - HAZE) + MIST[k] * HAZE) / 100);
  return out;
}
