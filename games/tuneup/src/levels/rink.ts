// Level 7, The Roller Rink (the Organ family), seen from above. Teddy skates right on his own, a
// block a beat of the organ's tune (RINK.CHR); a tap of Up or Down glides him one lane over, and
// Left holds him back. The five lanes are a staff: each note sits on the line of its pitch, so
// skating through them plays the tune's opening ("Score Scroll", DESIGN.md). Six organs lie in
// the lanes, each just past a note; the gate at the far end opens when all six are found.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import { door, kit, notes, pickups, SOLID, type Kit } from '../blocks/common';
import { MapBuilder, at, type Level } from './maps';

export const ORGAN_FINDS = ['pipe-organ', 'tonewheel', 'combo-organ', 'accordion', 'harmonica', 'kazoo'];
/** Level width; one screen tall. */
const W = 48;
/** The lanes' rows, lowest pitch first (lane 0 is the bottom one). */
export const LANE_ROWS = [6, 5, 4, 3, 2];
/** The tune's opening as lanes (C E G E F D E C on C D E F G), a note every 4 blocks from column 4. */
export const MELODY_LANES = [0, 2, 4, 2, 3, 1, 2, 0];
const NOTE_GAP = 4;
const NOTE_X = 4;
/** Organs: [the note it follows, its id]: two blocks past that note, in its lane. */
const ORGANS: [number, string][] = [
  [1, 'pipe-organ'],
  [2, 'tonewheel'],
  [4, 'combo-organ'],
  [5, 'accordion'],
  [6, 'harmonica'],
  [7, 'kazoo'],
];
/** Where each organ lies: [column, lane]. */
export const ORGAN_AT = ORGANS.map(([n]) => [NOTE_X + n * NOTE_GAP + 2, MELODY_LANES[n]] as [number, number]);
/** The gate's column and lane. */
export const GATE: [number, number] = [44, 2];

export function rinkBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  // the maple floor, with a staff line down the middle of each lane
  const lane = () => {
    const p = P(c('wood', 3));
    for (let y = 3; y < 20; y += 6) p.rect(0, y, 20, 1, c('wood', 4));
    // the staff line runs through the note heads (notes.ts draws them at y 14)
    p.rect(0, 14, 20, 1, c('ink', 1));
    return p;
  };
  book.add('lane', lane());
  // the boards round the rink: white, a red stripe, a dark kick rail
  book.add('boards', P(c('paint', 3)).rect(0, 8, 20, 4, c('red', 2)).rect(0, 17, 20, 3, c('ink', 1)), { solid: SOLID });
  book.add('boards.lo', P(c('paint', 3)).rect(0, 8, 20, 4, c('red', 2)).rect(0, 0, 20, 3, c('ink', 1)), { solid: SOLID });
  // beyond the boards: the dark hall, with colored lights from the mirror ball
  const hall = (seed: number) => {
    const p = P(c('ink', 0));
    const cols = [c('pink', 2), c('blue', 3), c('yellow', 3), c('green', 2)];
    p.disc(4 + (seed % 3) * 5, 6 + (seed % 2) * 8, 1.4, cols[seed % 4]);
    return p;
  };
  for (let i = 0; i < 4; i++) book.add(`hall${i}`, hall(i), { solid: SOLID, ntime: 8, next: `hall${(i + 1) % 4}` });
  notes(k, lane(), [c('red', 2), c('orange', 2), c('yellow', 2), c('green', 2), c('blue', 2), c('purple', 2)]);
  pickups(k, ORGAN_FINDS, 'lane');
  door(k, lane(), ORGAN_FINDS.length, (p: Pixels) => {
    // a pair of skates over the gate
    p.rect(5, 5, 4, 3, c('red', 2)).rect(11, 5, 4, 3, c('red', 2)).rect(5, 8, 4, 1, c('ink', 0)).rect(11, 8, 4, 1, c('ink', 0));
  });
  return k;
}

export function rink(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '.': 'lane', B: 'boards', b: 'boards.lo' }, 'boards');
  for (let x = 0; x < W; x++)
    m.set(x, 0, `hall${x % 4}`)
      .set(x, 8, `hall${(x + 2) % 4}`)
      .set(x, 9, `hall${(x + 1) % 4}`);
  m.fill(0, 1, W, 1, 'B').fill(0, 2, W, 5, '.').fill(0, 7, W, 1, 'b');
  // the start: the rink's left boards behind Teddy
  m.fill(0, 2, 1, 5, 'B');
  MELODY_LANES.forEach((l, i) => m.set(NOTE_X + i * NOTE_GAP, LANE_ROWS[l], `note${l}`));
  ORGANS.forEach(([, id], i) => m.set(ORGAN_AT[i][0], LANE_ROWS[ORGAN_AT[i][1]], `pick-${id}`));
  // the far boards, with the gate in the middle lane
  const [gx, gl] = GATE;
  m.fill(gx, 2, 1, 5, 'B').fill(gx + 1, 2, W - gx - 1, 5, 'B');
  m.set(gx, LANE_ROWS[gl], 'door').set(gx + 1, LANE_ROWS[gl], 'door.open');
  m.link(gx + 1, LANE_ROWS[gl]);
  return { m, start: at(1, LANE_ROWS[0]), size: [W, 10] };
}
