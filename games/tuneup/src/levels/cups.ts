// Level 7, Hubcaps and Balls (a magic show at the curb: red velvet, a gold spotlight). The cups
// and balls, played with three hubcaps and the ball for the top of THE CHEZ's antenna. The caps
// lift to show where the ball is, then shuffle on the table: one crossing over the top while
// another slides under it, the third bobbing in place (realMonsters.ts capPaths). When they
// settle, Doc Leo reaches up under the cap he picks (Space). The ball counts; an empty cap just
// says "ta-da?", and he may pick again. Three rounds, a scene each, the last one quicker; the
// door at the left opens when the ball is found.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '../../../snowbound/src/art/draw';
import { AIR, countedDoor, kit, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
import { capPaths, capSlots, type CapGame, type Swap } from '../realMonsters';
import { MapBuilder, at, type Level } from './maps';

/** The table's three slots (level x, two apart) and the row the caps sit on. */
export const SLOTS = [10, 12, 14];
export const CUPS = { w: 16, floor: 9, row: 6, door: 2, exit: 1 } as const;

export interface CupRound {
  file: string;
  swaps: Swap[];
  speed: 2 | 4;
  /** The cap the ball starts under. */
  ball: number;
}

export const ROUNDS: CupRound[] = [
  {
    file: 'cups1',
    speed: 2,
    ball: 1,
    swaps: [
      { over: 0, under: 1 },
      { over: 2, under: 0 },
      { over: 1, under: 2 },
    ],
  },
  {
    file: 'cups2',
    speed: 2,
    ball: 0,
    swaps: [
      { over: 1, under: 0 },
      { over: 0, under: 2 },
      { over: 2, under: 1 },
    ],
  },
  {
    file: 'cups3',
    speed: 4,
    ball: 2,
    swaps: [
      { over: 2, under: 1 },
      { over: 0, under: 2 },
      { over: 1, under: 0 },
    ],
  },
];

/** The round's shell game for its .MON. */
export const capGame = (r: CupRound): CapGame => ({ paths: capPaths(r.swaps, r.speed), ball: r.ball });
/** The level x the ball's cap settles at. */
export const ballX = (r: CupRound) => SLOTS[capSlots(r.swaps)[r.ball]];

export function cupsBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'curb');
  const { book, c, P, R } = k;
  // the velvet curtain: deep folds
  const curtain = (seed: number) => {
    const p = P(c('wall', 2));
    for (let x = 0; x < 20; x++) {
      const fold = Math.sin((x + seed * 3) / 3);
      p.rect(x, 0, 1, 20, c('wall', fold > 0.5 ? 3 : fold > -0.4 ? 2 : 1));
    }
    return p;
  };
  book.add('curtain', curtain(0), AIR);
  // the valance along the top: gold fringe
  const valance = curtain(1);
  valance.rect(0, 0, 20, 12, c('wall', 3)).rect(0, 12, 20, 2, c('pipe', 3));
  for (let x = 1; x < 20; x += 3) valance.rect(x, 14, 1, 4, c('pipe', 2));
  book.add('valance', valance, { solid: SOLID });
  // the spotlight's pool on the curtain behind the table
  const glow = P(c('wall', 3));
  gradient(glow, 0, 0, 20, 20, R('lamp'), 0, 1);
  book.add('glow', glow, AIR);
  // the magic table: its top edge (the caps sit on it) and its cloth with a gold star
  const table = (star: boolean) => {
    const p = k.pic('curtain');
    p.rect(0, 0, 20, 3, c('mach', 4)).rect(0, 3, 20, 17, c('accent', 2)).rect(0, 3, 20, 1, c('accent', 4));
    for (let x = 2; x < 20; x += 5) p.rect(x, 17, 2, 3, c('pipe', 3));
    if (star) p.disc(10, 10, 3, c('pipe', 3)).set(10, 6, c('pipe', 3)).set(10, 14, c('pipe', 3)).set(6, 10, c('pipe', 3)).set(14, 10, c('pipe', 3));
    return p;
  };
  book.add('table', table(false), AIR);
  book.add('table.star', table(true), AIR);
  // the stage
  const stage = P(c('floor', 2));
  for (let x = 0; x < 20; x += 10) stage.rect(x, 0, 1, 20, c('floor', 0));
  stage.rect(0, 0, 20, 2, c('floor', 4));
  book.add('stage', stage, { solid: SOLID });
  countedDoor(k, 'door', 'curtain', CTR.ball, 1, (p: Pixels) => {
    p.disc(10, 12, 3, c('lamp', 4));
  });
  return k;
}

/** Every round's stage is the same; only its caps' paths (its .MON) differ. */
export function cups(book: Kit['book']): Level {
  {
    const { w, floor } = CUPS;
    const m = new MapBuilder(book, { '.': 'curtain', g: 'glow', '=': 'stage', '#': 'valance', t: 'table' }, 'valance');
    m.fill(0, 0, w, floor, '.').fill(0, floor, w, 1, '=').fill(0, 0, w, 1, '#');
    m.fill(9, 2, 7, 4, 'g');
    m.fill(9, CUPS.row + 1, 7, 2, 't').set(12, CUPS.row + 1, 'table.star');
    SLOTS.forEach((x, i) => m.mon(MON.cap0 + i, x, CUPS.row));
    m.set(CUPS.door, floor - 2, 'door.top').set(CUPS.door, floor - 1, 'door');
    m.link(CUPS.exit, floor - 1);
    m.mon(MON.reggie, 5, floor - 1);
    return { m, start: at(8, 5), size: [w, 10] };
  }
}
