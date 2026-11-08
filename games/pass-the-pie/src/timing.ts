// PASS THE PIE's clocks. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C changeblks): a block can
// turn into another after some ticks, and that is the only clock the editor gives you. Every block of one kind
// changes together, from the moment the level starts, so a row of five kinds of block is a bar that runs out a
// segment at a time, and a door can shut when the last one goes. Grandma's oven door at the start of a timed street
// is a link back to the same street: touch it and every clock starts again.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import type { Book } from '../../kit/starter/book';
import { SOLID } from '../../kit/starter/book';
import * as art from './art';
import { AIR, type Timed } from './levels/common';
import type { StarterMap } from '../../kit/starter/map';

/** Ticks a second. */
export const SECOND = 18.2;
/** How long a segment shows pale (cooling) before it goes out. */
export const SEG_WARN = 18;
/** Segments in a bar. */
export const SEGMENTS = 5;

export interface Clock {
  /** Ticks each segment stays lit. */
  seg: number;
  /** Ticks until the door shuts: the whole bar. */
  open: number;
}

export const clock = (seconds: number): Clock => {
  const seg = Math.round((seconds * SECOND) / SEGMENTS);
  return { seg, open: seg * SEGMENTS };
};

/** The bar's blocks (seg0..4, each on, cooling and out), the door that shuts with it, and the oven door. */
export function addClock(book: Book, pal: Pal, timed: Timed[], c: Clock): void {
  for (let i = 0; i < SEGMENTS; i++) {
    const out = (SEGMENTS - i) * c.seg;
    for (const f of ['on', 'warn', 'off'] as const) book.add(`seg${i}.${f}`, art.segment(pal, f), AIR);
    timed.push({ name: `seg${i}.on`, next: `seg${i}.warn`, ticks: out - SEG_WARN }, { name: `seg${i}.warn`, next: `seg${i}.off`, ticks: SEG_WARN });
  }
  const [oTop, oBot] = art.hallDoor(pal, false);
  const [sTop, sBot] = art.hallDoor(pal, true);
  book.add('hall.open.top', oTop, AIR);
  book.add('hall.open.bottom', oBot, AIR);
  book.add('hall.shut.top', sTop, { solid: SOLID });
  book.add('hall.shut.bottom', sBot, { solid: SOLID });
  timed.push({ name: 'hall.open.top', next: 'hall.shut.top', ticks: c.open }, { name: 'hall.open.bottom', next: 'hall.shut.bottom', ticks: c.open });
  const [ovTop, ovBot] = art.ovenDoor(pal);
  book.add('oven.top', ovTop, AIR);
  book.add('oven.bottom', ovBot, AIR);
}

/** A copy of the bar with its left end at (x, y). */
export function placeBar(m: StarterMap, x: number, y: number): void {
  for (let i = 0; i < SEGMENTS; i++) m.set(x + i, y, `seg${i}.on`);
}

/** The door that shuts with the bar, standing on `floor` at column x. */
export function placeDoor(m: StarterMap, x: number, floor: number): void {
  m.set(x, floor - 2, 'hall.open.top').set(x, floor - 1, 'hall.open.bottom');
}

/** The oven door at column x on `floor`. */
export function placeOven(m: StarterMap, x: number, floor: number): void {
  m.set(x, floor - 2, 'oven.top').set(x, floor - 1, 'oven.bottom');
}
