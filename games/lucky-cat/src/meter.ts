// The fair's clock: a meter of bells and a gate that run on Game-Maker's own block timers (a block turns into
// another after a number of ticks, 18.2 a second). Seven bells hang in a row after a little clock face, and they
// go dark one at a time, the last when the 13th chime sounds: that moment the fair's gate (four blocks tall,
// too high to jump) shuts for a few seconds, then the gate opens and the bells light up again.
// Every bell block is its own two-block loop (lit, then dark, then lit again), so all the meters and gates in a
// level change together and are always in view.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import type { Timed } from './level';
import { fairGate, pip } from './props';

/** Ticks the gate stays open, and the bells' share of it. */
export const BELLS = 7;
export const OPEN_TICKS = BELLS * 130;
/** Ticks the gate stays shut. */
export const SHUT_TICKS = 150;
export const CYCLE = OPEN_TICKS + SHUT_TICKS;

/** The little clock face that starts each row of bells. */
function cap(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, pal.r('brick')[1]);
  p.frame(0, 0, 20, 20, c('brick', 0));
  p.disc(10, 10, 7.4, c('stone', 4)).disc(10, 10, 6.2, c('white', 3)).ring(10, 10, 7, c('gold', 2));
  p.line(10, 10, 10, 5, c('ink', 0)).line(10, 10, 14, 8, c('red', 1)).disc(10, 10, 1, c('gold', 3));
  return p;
}

/** Adds the meter's and the gate's blocks to `book`; returns each timed block's next block and ticks. */
export function addMeter(book: Book, pal: Pal): Timed[] {
  const timed: Timed[] = [];
  book.add('meterCap', cap(pal), { grav: PULL.down });
  for (let j = 0; j < BELLS; j++) {
    const lit = (OPEN_TICKS * (j + 1)) / BELLS;
    book.add(`bellOn${j}`, pip(pal, true), { grav: PULL.down });
    book.add(`bellOff${j}`, pip(pal, false), { grav: PULL.down });
    timed.push({ name: `bellOn${j}`, next: `bellOff${j}`, ticks: lit });
    timed.push({ name: `bellOff${j}`, next: `bellOn${j}`, ticks: CYCLE - lit });
  }
  // the gate: open (two posts and a ribbon of gold) or shut (planks, solid)
  const open = fairGate(pal, false);
  book.add('gateOpen', open, { grav: PULL.down });
  book.add('gateShut', fairGate(pal, true), { solid: SOLID });
  timed.push({ name: 'gateOpen', next: 'gateShut', ticks: OPEN_TICKS });
  timed.push({ name: 'gateShut', next: 'gateOpen', ticks: SHUT_TICKS });
  return timed;
}
