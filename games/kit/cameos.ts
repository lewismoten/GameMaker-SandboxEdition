// The Sandbox regulars as guests in another game (see TIN-HEARTS.md, "Cameos"): each drawn by
// its own game's code in its own palette, then recolored into the host's palette by nearest
// color, so a cameo looks like the character and still uses only the host's colors.
//
//   const joe = joeCameo(hostPal, 'down', 0);         // Mystery Robot Joe (Keep It Brief!)
//   const watt = wattCameo(hostPal, 'side', 1);       // Watt (Ohm Sweet Ohm)
//   const will = willCameo(hostPal, { face: 'front' }); // Will (Shakespeare in Sweatpants)
//   const lewie = lewieCameo(hostPal, 'down');        // Teenage Lewie (Snowbound), shovel and all
//
// `hostPal` is the host's 768-byte palette (6-bit, as kit/palette.ts PaletteBuilder.pal);
// `use` limits the colors a cameo may take (say, a game's sprite colors only). Every picture
// is 20x20 on CLEAR (255). Carl the fly has his own helper (carlCameo.ts), the tin heart and
// the Easter egg theirs (tinHeart.ts, easterEgg.ts), drawn straight in the host's ramps.
import { Pixels } from './pixels';
import { joe } from '../brief/src/sprites/joe';
import { PAL as BRIEF } from '../brief/src/art/pal';
import { watt, type View } from '../logic/src/sprites/sprites';
import { PAL as LOGIC } from '../logic/src/art/pal';
import { poetArt, type PoetPose } from '../sweats/src/common/sprites';
import { buildPalette as sweatsPalette, COMMON } from '../sweats/src/art/pal';
import { buildPalette as snowPalette } from '../snowbound/src/art/pal';
import { buildCharBlocks as kidBlocks } from '../snowbound/src/sprites/charBlocks';

export const CLEAR = 255;

export interface RecolorOptions {
  /** The host palette entries the picture may use (default: all but 255). */
  use?: number[];
  /** The source's clear index (default 255), kept clear. */
  clear?: number;
}

/** A picture drawn in palette `from`, redrawn in palette `to` by nearest color (CLEAR stays clear). */
export function recolor(src: Pixels, from: Uint8Array, to: Uint8Array, o: RecolorOptions = {}): Pixels {
  const use = o.use ?? Array.from({ length: 255 }, (_, i) => i);
  const clear = o.clear ?? CLEAR;
  const memo = new Map<number, number>();
  const near = (i: number) => {
    let best = use[0];
    let bd = Infinity;
    for (const j of use) {
      // weighted for the eye: green counts most, blue least
      const d = 3 * (from[i * 3] - to[j * 3]) ** 2 + 4 * (from[i * 3 + 1] - to[j * 3 + 1]) ** 2 + 2 * (from[i * 3 + 2] - to[j * 3 + 2]) ** 2;
      if (d < bd) ((bd = d), (best = j));
    }
    return best;
  };
  const out = new Pixels(src.w, src.h, CLEAR);
  for (let k = 0; k < src.px.length; k++) {
    const v = src.px[k];
    if (v === clear) continue;
    if (!memo.has(v)) memo.set(v, near(v));
    out.px[k] = memo.get(v)!;
  }
  return out;
}

/** Mystery Robot Joe, the tin box night librarian, walking `dir` (side faces left). */
export const joeCameo = (to: Uint8Array, dir: 'down' | 'up' | 'side', step = 0, o?: RecolorOptions): Pixels => recolor(joe(dir, step), BRIEF.pal, to, o);

/** Watt, the pocket-sized repair robot on treads. */
export const wattCameo = (to: Uint8Array, view: View, step = 0, mood: 'ok' | 'blink' = 'ok', o?: RecolorOptions): Pixels =>
  recolor(watt(view, step, mood), LOGIC.pal, to, o);

let sweats: ReturnType<typeof sweatsPalette> | undefined;
/** Will the playwright: bald, ruff, velvet doublet, grey sweatpants, fuzzy slippers. */
export function willCameo(to: Uint8Array, pose: PoetPose = { face: 'front' }, o?: RecolorOptions): Pixels {
  sweats ??= sweatsPalette(COMMON);
  return recolor(poetArt(sweats).body(pose), sweats.pal, to, o);
}

let snow: ReturnType<typeof snowPalette> | undefined;
let kid: ReturnType<typeof kidBlocks> | undefined;
/** Teenage Lewie from Snowbound: red knit hat, red coat, the snow shovel. `pose` is a KID.CBL frame name. */
export function lewieCameo(
  to: Uint8Array,
  pose: 'down0' | 'down1' | 'down2' | 'blink' | 'up0' | 'up1' | 'up2' | 'side0' | 'side1' = 'down0',
  o?: RecolorOptions,
): Pixels {
  snow ??= snowPalette('noon');
  kid ??= kidBlocks(snow);
  const pic = kid.pics.get(pose);
  if (!pic) throw new Error(`lewieCameo: no ${pose}`);
  return recolor(pic, snow.pal, to, o);
}
