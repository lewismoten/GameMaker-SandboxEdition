// The mountain palette entry: Tess, material ramps and time-of-day recoloring.
import { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { recolor, type Look } from '../../kit/starter/heroLook';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { PRINT_INK } from './paletteInk';
import { LOOKS, type Tint } from './paletteLooks';

export { LOOKS, type Tint } from './paletteLooks';

/** Tess: tan skin, a long auburn braid, a mustard sun hat, a forest-green fleece, denim trousers. */
export const TESS: Look = {
  skin: [4, [128, 78, 50], [246, 200, 160], [208, 146, 104]],
  hair: [3, [88, 30, 18], [196, 96, 50]],
  hat: [5, [120, 84, 10], [255, 236, 150], [218, 170, 40]],
  hood: [5, [14, 60, 36], [150, 220, 150], [40, 120, 70]],
  pants: [5, [24, 40, 90], [170, 196, 240], [70, 100, 170]],
};

/** The game's own ramps, after the shared ones. */
function extraRamps(b: PaletteBuilder): void {
  b.ramp('rock', 6, [58, 50, 64], [214, 204, 196], [132, 118, 120]);
  b.ramp('moss', 5, [30, 70, 44], [170, 214, 120], [80, 140, 70]);
  b.ramp('fog', 4, [170, 176, 196], [250, 252, 255], [214, 220, 236]);
  b.ramp('water', 5, [20, 60, 110], [190, 236, 250], [60, 140, 200]);
  b.ramp('glow', 5, [20, 60, 70], [230, 255, 220], [110, 220, 190]);
  // lamplight in the dark tunnel: warm, but only a little lighter than the dark it falls on
  b.ramp('ember', 3, [40, 26, 26], [120, 74, 40], [72, 44, 32]);
}

/** The base palette (the morning), with Tess in the hero's index ranges. */
export function buildMountainPalette(): Pal {
  const base = buildStarterPalette(extraRamps);
  const tess = { ...base, pal: recolor(base, TESS) };
  // the printed morning is the base: the title, menus and every screen without a look of its own use it
  return { ...tess, pal: lookOf(tess, 'morning') };
}

/** A copy of the palette bytes with the named ramps recolored. */
export function swapped(pal: Pal, tints: Record<string, Tint>): Uint8Array {
  const out = new Uint8Array(pal.pal);
  const scratch = new PaletteBuilder();
  for (const [name, [from, to, mid]] of Object.entries(tints)) {
    const idx = pal.r(name);
    const made = scratch.ramp(`t_${name}`, idx.length, from, to, mid);
    idx.forEach((at, i) => out.set(scratch.pal.subarray(made[i] * 3, made[i] * 3 + 3), at * 3));
  }
  return out;
}

/** The palette bytes of a look ('' is the morning). */
export const lookOf = (pal: Pal, look: string): Uint8Array => swapped(pal, { ...LOOKS[look || 'morning'], ink: PRINT_INK[look || 'morning'] });
