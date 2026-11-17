// The fair's clock: a meter of bells and a gate that run on Game-Maker's own block timers (a block turns into
// another after a number of ticks, 18.2 a second). Seven bells hang in a row after a little clock face, and they
// go dark one at a time, the last when the 13th chime sounds: that moment the fair's gate (four blocks tall,
// too high to jump) shuts for about fourteen seconds, then the gate opens and the bells light up again.
// Every bell block is its own two-block loop (lit, then dark, then lit again), so all the meters and gates in a
// level change together. Compact seven-bell strips repeat lower along both streets so a
// complete meter stays inside the cropped DOS view as the cat walks and jumps.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import type { Pal } from './print';
import type { Timed } from './level';
import { ORIGIN, type StarterMap } from '../../kit/starter/map';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { fairGate, pip } from './props';

/** Ticks the gate stays open, and the bells' share of it. */
export const BELLS = 7;
export const OPEN_TICKS = BELLS * 95;
/** Ticks the gate stays shut: long enough that missing the chime costs a real wait. */
export const SHUT_TICKS = 250;

/** The little clock face that starts each row of bells: paper dial on ink, the hands a minute from 13. */
function cap(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('ink', 0));
  p.disc(10, 10, 7.6, c('paper', 3)).disc(10, 10, 6.4, c('paper', 4));
  p.line(10, 10, 10, 5, c('ink', 0)).line(10, 10, 13, 6, c('red', 1)).disc(10, 10, 1, c('gold', 3));
  for (const [x, y] of [
    [10, 4],
    [16, 10],
    [10, 16],
    [4, 10],
  ])
    p.set(x, y, c('ink', 1));
  return p;
}

/** Adds the meter's and the gate's blocks to `book`; returns each timed block's next block and ticks. */
export function addMeter(book: Book, pal: Pal, openTicks = OPEN_TICKS): Timed[] {
  const cycle = openTicks + SHUT_TICKS;
  const timed: Timed[] = [];
  book.add('meterCap', cap(pal), { grav: PULL.down });
  for (let j = 0; j < BELLS; j++) {
    const lit = (openTicks * (j + 1)) / BELLS;
    book.add(`bellOn${j}`, pip(pal, true), { grav: PULL.down });
    book.add(`bellOff${j}`, pip(pal, false), { grav: PULL.down });
    timed.push({ name: `bellOn${j}`, next: `bellOff${j}`, ticks: lit });
    timed.push({ name: `bellOff${j}`, next: `bellOn${j}`, ticks: cycle - lit });
  }
  // A complete seven-bell strip in one tile, on the same clock as the large bells.
  // Its paper rail and gold cuts reuse the town's woodcut colors.
  for (let dark = 0; dark <= BELLS; dark++) {
    const p = new Pixels(20, 20, pal.c('ink', 0));
    p.rect(0, 4, 20, 1, pal.c('paper', 2)).rect(0, 15, 20, 1, pal.c('paper', 2));
    for (let j = 0; j < BELLS; j++) {
      const x = j * 3;
      const color = pal.c(j < dark ? 'ink' : 'gold', j < dark ? 2 : 3);
      p.rect(x, 7, 2, 5, color).rect(x, 13, 1, 1, color);
    }
    book.add(`bellStrip${dark}`, p, { grav: PULL.down });
    timed.push({ name: `bellStrip${dark}`, next: `bellStrip${(dark + 1) % (BELLS + 1)}`, ticks: dark < BELLS ? openTicks / BELLS : SHUT_TICKS });
  }
  // the gate: open (two posts and a ribbon of gold) or shut (planks, solid)
  const open = fairGate(pal, false);
  book.add('gateOpen', open, { grav: PULL.down });
  book.add('gateShut', fairGate(pal, true), { solid: SOLID });
  timed.push({ name: 'gateOpen', next: 'gateShut', ticks: openTicks });
  timed.push({ name: 'gateShut', next: 'gateOpen', ticks: SHUT_TICKS });
  return timed;
}

/** Repeat whole strips at cat height, leaving signs, scenery and crossings intact. */
export function placeMeters(map: StarterMap, book: Book, row: number): void {
  for (let x = 2; x < map.width - 1; x += 2) {
    if (map.map.blocks[(row + ORIGIN) * MLEN + x + ORIGIN] === book.n('sky')) map.set(x, row, 'bellStrip0');
  }
}
