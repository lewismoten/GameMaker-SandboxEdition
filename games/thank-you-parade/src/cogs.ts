// The Clock Tower's cog planks: brass planks you can stand on that blink out for a moment and come back, in four phases, so that
// along a bridge of them one plank in every four is missing and the gaps travel right to left, a plank every 36 ticks
// (a cycle is 144 ticks: 108 on, 36 off). A plank's start block says where in the cycle it begins.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { LEDGE, PULL } from '../../kit/starter/book';
import type { PBook } from './base';
import { onPaper } from './blocks';
import { halftone, inkLine, type Pal } from './print';

const T = 255;
export const COG_ON = 108;
export const COG_OFF = 36;
export const COG_CYCLE = COG_ON + COG_OFF;
export const COG_PHASES = 4;

/** Where plank number `i` of a bridge stands in the cycle at tick 0 (the phase repeats every four planks). */
export const cogOffset = (i: number): number => (i % COG_PHASES) * COG_OFF;
/** True when a plank with offset `o` is solid at tick `t`. */
export const cogSolid = (o: number, t: number): boolean => (t + o) % COG_CYCLE < COG_ON;

/** The block a plank with phase `f` starts as. */
export const cogStart = (f: number): string => `cogS${f % COG_PHASES}`;

const draw = (pal: Pal, solid: boolean): Pixels => {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  if (solid) {
    p.rect(0, 0, 20, 7, c('gold', 3));
    halftone(p, 0, 0, 20, 7, c('gold', 2), 2, [c('gold', 3)]);
    p.rect(0, 0, 20, 2, c('gold', 5)).rect(0, 5, 20, 2, c('gold', 1));
    // a little cog set into the plank
    p.rect(8, 2, 4, 3, c('ink', 0)).set(9, 3, c('gold', 4)).set(10, 3, c('gold', 4));
    return onPaper(pal, inkLine(p, c('ink', 0)));
  }
  // a dotted outline: the plank is on its way back
  for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 1, c('stone', 2)).rect(x, 6, 2, 1, c('stone', 2));
  p.rect(0, 1, 1, 5, c('stone', 2)).rect(19, 1, 1, 5, c('stone', 2));
  return onPaper(pal, p);
};

/** Blocks cogOn and cogOff, and cogS0 to cogS3 for where a bridge's planks begin. */
export function addCogs(book: PBook, pal: Pal): void {
  const on = draw(pal, true);
  const off = draw(pal, false);
  const solid = { solid: LEDGE, grav: PULL.down };
  book.add('cogOn', on, solid);
  book.add('cogOff', off, { grav: PULL.down });
  for (let f = 0; f < COG_PHASES; f++) {
    const at = cogOffset(f);
    const live = cogSolid(at, 0);
    book.add(cogStart(f), live ? on : off, live ? solid : { grav: PULL.down });
    book.time(cogStart(f), live ? 'cogOff' : 'cogOn', live ? COG_ON - at : COG_CYCLE - at);
  }
  book.time('cogOn', 'cogOff', COG_ON).time('cogOff', 'cogOn', COG_OFF);
}
