// PASS THE PIE's clocks. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C changeblks): a block can
// turn into another after some ticks, and that is the only clock the editor gives you. Every block of one kind
// changes together, from the moment the level starts, so a row of five kinds of block is a bar that runs out a
// segment at a time, and a door can shut when the last one goes. Grandma's oven door at the start of a timed street
// is a link back to the same street: touch it and every clock starts again.
import { segmentedBar, ticks } from '@lewismoten/gamemaker-sandbox-tools/kit/ticks';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import type { Book } from '../../kit/starter/book';
import { SOLID } from '../../kit/starter/book';
import * as art from './art';
import { paperBlock, press } from './print';
import { AIR, type Timed } from './levels/common';
import type { StarterMap } from '../../kit/starter/map';

/** Ticks a second. */
export const SECOND = ticks(1, { rate: 18.2, round: 'none' });
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
  const seg = Math.round(ticks(seconds, { rate: SECOND, round: 'none' }) / SEGMENTS);
  return { seg, open: seg * SEGMENTS };
};

/** The bar's blocks (seg0..4, each on, cooling and out), the door that shuts with it, and the oven door. */
export function addClock(book: Book, pal: Pal, timed: Timed[], c: Clock): void {
  const bar = segmentedBar({ segments: SEGMENTS, ticksPerSegment: c.seg });
  for (let i = 0; i < SEGMENTS; i++) {
    const out = bar[SEGMENTS - i - 1].end;
    for (const f of ['on', 'warn', 'off'] as const) book.add(`seg${i}.${f}`, art.segment(pal, f), AIR);
    timed.push({ name: `seg${i}.on`, next: `seg${i}.warn`, ticks: out - SEG_WARN }, { name: `seg${i}.warn`, next: `seg${i}.off`, ticks: SEG_WARN });
  }
  // A small five-light repeat fits the narrow spaces beside large placards. Its steps have
  // the same segment duration as the large bar; it does not drive any gameplay timer.
  const { ink, acc } = press(pal);
  for (let step = 0; step <= SEGMENTS; step++) {
    const p = paperBlock(pal);
    for (let i = 0; i < SEGMENTS; i++) {
      p.rect(1, 2 + i * 3, 18, 2, ink[0]).rect(2, 2 + i * 3, 16, 1, i < SEGMENTS - step ? acc[2] : ink[1]);
    }
    book.add(`mini${step}`, p, AIR);
    if (step < SEGMENTS) timed.push({ name: `mini${step}`, next: `mini${step + 1}`, ticks: bar[step].duration });
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

/** Extra copies of the complete five-segment meter across street, roof and pond-bed views.
 * OpenAI Codex (GPT-6.1 Sol), directed by Lewis Moten; existing art and clock blocks. */
const ROUTE_BARS: Record<string, [number, number][]> = {
  gravyMini: [
    [35, 14],
    [71, 14],
  ],
  gravy: [
    [5, -4],
    [26, 1],
    [59, 1],
    [72, 1],
    [4, 3],
    [15, 3],
    [25, 3],
    [36, 3],
    [41, 3],
    [49, 3],
    [65, 3],
    [82, 3],
    [14, 4],
    [16, 5],
    [1, 6],
    [37, 6],
    [82, 6],
    [49, 7],
    [36, 11],
    [68, 11],
    [15, 12],
    [25, 13],
    [78, 13],
    [3, 14],
    [22, 14],
    [39, 14],
    [82, 14],
    [13, 15],
    [35, 15],
    [49, 15],
    [59, 15],
    [65, 15],
    [81, 15],
    [68, 16],
  ],
  dojoMini: [
    [11, 14],
    [81, 14],
    [46, 15],
  ],
  dojo: [
    [1, -4],
    [11, 0],
    [54, 0],
    [73, 0],
    [51, 2],
    [21, 3],
    [41, 3],
    [64, 3],
    [83, 3],
    [4, 4],
    [83, 6],
    [51, 10],
    [23, 11],
    [33, 11],
    [43, 11],
    [51, 11],
    [64, 11],
    [4, 12],
    [9, 12],
    [73, 12],
    [1, 14],
    [18, 14],
    [28, 14],
    [35, 14],
    [45, 14],
    [56, 14],
    [71, 14],
    [83, 14],
    [58, 15],
    [68, 15],
  ],
  doorsMini: [
    [1, 14],
    [44, 14],
    [76, 15],
  ],
  doors: [
    [7, 0],
    [33, 0],
    [60, 0],
    [4, 2],
    [17, 3],
    [27, 3],
    [43, 3],
    [53, 3],
    [70, 3],
    [75, 3],
    [83, 3],
    [1, 4],
    [23, 6],
    [50, 10],
    [17, 11],
    [43, 11],
    [70, 11],
    [75, 11],
    [83, 11],
    [4, 12],
    [73, 12],
    [14, 14],
    [19, 14],
    [27, 14],
    [37, 14],
    [54, 14],
    [61, 14],
    [72, 14],
    [83, 14],
    [10, 15],
    [41, 15],
    [71, 15],
  ],
  freezerMini: [
    [1, 14],
    [71, 14],
  ],
  freezer: [
    [4, -8],
    [14, -8],
    [24, -8],
    [34, -8],
    [44, -8],
    [54, -8],
    [64, -8],
    [74, -8],
    [82, -8],
    [2, -2],
    [12, 0],
    [22, 0],
    [32, 0],
    [42, 0],
    [52, 0],
    [62, 0],
    [72, 0],
    [82, 0],
    [22, 6],
    [50, 6],
    [61, 6],
    [82, 6],
    [12, 8],
    [38, 8],
    [48, 8],
    [71, 8],
    [81, 8],
    [1, 12],
    [71, 12],
    [11, 14],
    [16, 14],
    [22, 14],
    [32, 14],
    [40, 14],
    [50, 14],
    [61, 14],
    [82, 14],
    [51, 15],
    [65, 15],
    [81, 15],
  ],
  gobbleMini: [[27, 14]],
  gobble: [
    [82, -4],
    [13, 0],
    [50, 0],
    [70, 0],
    [4, 3],
    [23, 3],
    [33, 3],
    [43, 3],
    [60, 3],
    [80, 3],
    [3, 4],
    [24, 4],
    [82, 4],
    [43, 6],
    [60, 6],
    [82, 6],
    [23, 11],
    [80, 11],
    [4, 12],
    [27, 12],
    [2, 14],
    [14, 14],
    [35, 14],
    [42, 14],
    [50, 14],
    [60, 14],
    [70, 14],
    [76, 14],
    [84, 14],
    [11, 15],
    [17, 15],
  ],
};

/** Repeat the bar on decoration only; never replace a platform, pickup, ladder, sign or wind tile. */
export function repeatRouteBars(file: string, m: StarterMap, book: Book): void {
  const safe = new Set(['sky', 'siding', 'window'].filter((n) => book.index.has(n)).map((n) => book.n(n)));
  for (const [x, y] of ROUTE_BARS[file] ?? []) {
    for (let i = 0; i < SEGMENTS; i++) {
      if (!safe.has(m.map.blocks[(y + 10) * 100 + x + i + 10])) throw new Error(`${file}: timer would replace gameplay at ${x + i},${y}`);
    }
    placeBar(m, x, y);
  }

  for (const [x, y] of ROUTE_BARS[`${file}Mini`] ?? []) {
    if (!safe.has(m.map.blocks[(y + 10) * 100 + x + 10])) throw new Error(`${file}: small timer would replace gameplay at ${x},${y}`);
    m.set(x, y, 'mini0');
  }
}
