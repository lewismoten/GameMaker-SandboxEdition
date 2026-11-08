// COLORS THAT WORK's blocks, added to the Starter block set after the signs. Two pairs:
//
//   Level 1 (color alone): plateHot and plateSafe are the same flat plate, the same size, with the
//     same three rivets; one is red and one is green, matched so a player who sees red and green
//     alike (see the engine's gfx/colorVision.ts) cannot tell them apart. The red one stings.
//   Level 2 (shape and brightness): spikeRed points and is dark; plateStripe is flat, light and
//     striped. They sting or not by what they look like, in any color.
//
// A sting takes 5 hit points, once, then the block lies flat and gray (the "touch" rule, as a coin
// goes). None of these is solid, so nothing holds the hero while it stings.
import { simulatePalette } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';

/** Hit points a sting takes, once. */
export const STING = -5;

/**
 * The two ramps level 1 turns on: a red and a green picked (by a search over the 64 levels a VGA
 * channel has, games/colors/tools/colorCheck.ts re-checks them) so that, for a player who sees red and
 * green alike (deuteranopia, the common kind), each shade of the green lands on the same shade of the red
 * (within 1 delta E). Protanopia is not matched: there the red plate is darker. Dark, middle, light.
 */
export function addColorRamps(b: PaletteBuilder): void {
  b.ramp('hotpad', 3, [120, 18, 36], [255, 150, 130], [170, 40, 50]);
  b.ramp('safepad', 3, [12, 80, 28], [156, 200, 124], [68, 112, 40]);
}

/** A flat plate on the ground of its block in three shades, with three rivets. */
function plate(pal: Pal, ramp: string): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const [dark, mid, light] = pal.r(ramp);
  p.rect(0, 10, 20, 10, mid).rect(0, 10, 20, 3, light).rect(0, 17, 20, 3, dark);
  for (const x of [3, 9, 15]) p.rect(x, 14, 3, 2, dark);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Two big spikes, pointing up: dark at the foot, bright at the tip, plainly pointed. */
function spikes(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const [dark, mid, light] = pal.r('hotpad');
  p.rect(0, 17, 20, 3, dark).rect(0, 17, 20, 1, mid);
  for (const cx of [5, 15]) {
    for (let y = 0; y < 17; y++) {
      const half = 1 + Math.floor((y * 4.6) / 17);
      p.rect(cx - half, y, half * 2, 1, y < 6 ? light : mid);
      p.set(cx + half - 1, y, dark);
    }
  }
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** A flat plate that is light, with upright stripes like a crossing: safe to stand on. */
function stripes(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const pale = pal.c('white', 3);
  const band = pal.c('teal', 2);
  for (let y = 10; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 6 < 3 ? pale : band);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** A plate or a row of spikes after a sting: pressed flat, gray, the same in either level. */
function spent(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  p.rect(0, 16, 20, 4, s[1]).rect(0, 16, 20, 1, s[3]);
  for (const x of [1, 7, 13]) p.rect(x, 14, 6, 2, s[3]).rect(x, 14, 6, 1, s[4]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Adds the plates and spikes to `book` (call after the signs). */
export function addColorBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('plateHot', plate(pal, 'hotpad'), { ...air, hp: STING, touch: 'spent' });
  book.add('plateSafe', plate(pal, 'safepad'), air);
  book.add('spikeRed', spikes(pal), { ...air, hp: STING, touch: 'spent' });
  book.add('plateStripe', stripes(pal), air);
  book.add('spent', spent(pal), air);
}

/** Simulate the scene, then match the two plate ramps exactly so VGA rounding gives no clue. */
export function lessonPalette(pal: Pal): Uint8Array {
  const colors = simulatePalette(pal.pal, 'deutan');
  pal.r('safepad').forEach((safe, i) => {
    const hot = pal.r('hotpad')[i];
    colors.set(colors.slice(hot * 3, hot * 3 + 3), safe * 3);
  });
  return colors;
}
