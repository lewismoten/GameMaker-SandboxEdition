// Level 10, The Clock Tower (the Mallets and bells family). Inside the tower the music-box
// gears turn, and the way through is three curtains of tubular bells that swing open on the
// clock: over each one a clock face shows the hand going round, and when it sweeps into the
// gold wedge the bells swing aside for a while (a ring of blocks, the same 72 ticks as the
// clock's, so the countdown is always true; the song's tubular bell rings as they open).
// Gear steps and gear ledges to climb, ten mallets and bells to find, and the door at the top
// of the tower opens when all ten are found. Up on the gear ledges at the far end, a tin
// heart ticks among the gears.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import type { Pal } from '../art/pal';
import { door, kit, LEDGE, notes, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { MapBuilder, at, type Level } from './maps';

export const MALLET_FINDS = [
  'glockenspiel',
  'tubular-bells',
  'celesta',
  'music-box',
  'vibraphone',
  'marimba',
  'xylophone',
  'chimes',
  'steel-drum',
  'vibes-wobbly',
];
const W = 40;
/** Ticks the clock hand shows at each of its eight places (a beat of the song). */
export const CLOCK_STEP = 9;
/** The hand's places in the gold wedge (the last three): the bells are open while it is there. */
const OPEN_FROM = 5;
export const CLOCK_TICKS = CLOCK_STEP * 8;
/** The bell curtains (level x), on the floor row, each under its clock. */
export const BELL_DOORS = [10, 20, 30];
/** Where each mallet lies: [id, x, y]. */
export const MALLETS_AT: [string, number, number][] = [
  ['glockenspiel', 3, 8],
  ['celesta', 6, 6],
  ['music-box', 13, 8],
  ['vibraphone', 15, 6],
  ['marimba', 18, 8],
  ['xylophone', 23, 8],
  ['chimes', 26, 5],
  ['steel-drum', 28, 8],
  ['tubular-bells', 32, 8],
  ['vibes-wobbly', 35, 8],
];
/** Gear steps on the floor: [column, height in blocks]. */
const STEPS: [number, number][] = [
  [5, 1],
  [6, 2],
  [14, 1],
  [15, 2],
  [24, 1],
  [25, 2],
  [26, 3],
];
/** The gear ledges at the far end (stand on top, hop up through): [column, row]; the heart is on the top one. */
const LEDGES: [number, number][] = [
  [34, 6],
  [35, 6],
  [36, 4],
  [37, 4],
];
export const HEART_AT: [number, number] = [37, 3];

export function clockBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // the tower's stone wall, the beams overhead, a plank floor
  const wall = () => {
    const p = P(c('stone', 2));
    for (let y = 0; y < 20; y += 10) p.rect(0, y + 9, 20, 1, c('stone', 1)).rect(y ? 4 : 14, y, 1, 9, c('stone', 1));
    return p;
  };
  book.add('wall', wall(), air);
  book.add('beam', P(c('wood', 0)).rect(0, 12, 20, 8, c('wood', 1)).rect(0, 12, 20, 1, c('wood', 2)), { solid: SOLID });
  book.add('floor', P(c('wood', 2)).rect(0, 0, 20, 2, c('wood', 3)).rect(0, 10, 20, 1, c('wood', 1)), { solid: SOLID });
  // the tower wall between the rooms: solid stone, dressed
  book.add(
    'pier',
    P(c('stone', 1)).rect(0, 0, 20, 1, c('stone', 3)).rect(0, 9, 20, 1, c('stone', 0)).rect(9, 0, 1, 9, c('stone', 0)).rect(4, 10, 1, 10, c('stone', 0)),
    {
      solid: SOLID,
    },
  );
  // a gear: a brass wheel with teeth, turned a little each frame
  const gear = (p: Pixels, cx: number, cy: number, r: number, turn: number) => {
    for (let t = 0; t < 8; t++) {
      const a = (t / 8) * Math.PI * 2 + turn;
      p.disc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.6, c('gold', 1));
    }
    return p
      .disc(cx, cy, r - 0.5, c('gold', 2))
      .disc(cx, cy, r - 3, c('gold', 1))
      .disc(cx, cy, 1.5, c('ink', 0));
  };
  // gear steps (solid), gear ledges (stand on top) and gears turning on the wall: two frames each
  for (let f = 0; f < 2; f++) {
    const turn = f * (Math.PI / 8);
    const nx = { ntime: 6 };
    book.add(`step${f}`, gear(P(c('wood', 1)).rect(0, 0, 20, 2, c('wood', 3)), 10, 11, 7, turn), { solid: SOLID, ...nx, next: `step${1 - f}` });
    book.add(`ledge${f}`, gear(wall(), 10, 6, 5, -turn).rect(0, 0, 20, 2, c('gold', 2)), { solid: LEDGE, grav: GRAV.down, ...nx, next: `ledge${1 - f}` });
    book.add(`cog${f}`, gear(wall(), 10, 10, 6, turn), { ...air, ...nx, next: `cog${1 - f}` });
  }
  // the clock faces: the hand at each of eight places, the last three in the gold wedge (open)
  const face = (place: number) => {
    const p = P(c('stone', 1));
    p.disc(10, 10, 8.5, c('ink', 0)).disc(10, 10, 7.5, c('cloud', 2));
    // the wedge: the hand's open places
    for (let q = OPEN_FROM; q < 8; q++)
      for (let r = 2; r < 7; r++) {
        const a = (q / 8) * Math.PI * 2 - Math.PI / 2;
        p.set(Math.round(10 + Math.cos(a) * r), Math.round(10 + Math.sin(a) * r), c('gold', 2));
      }
    const a = (place / 8) * Math.PI * 2 - Math.PI / 2;
    p.line(10, 10, Math.round(10 + Math.cos(a) * 6), Math.round(10 + Math.sin(a) * 6), c('ink', 0));
    return p.disc(10, 10, 1.2, c('red', 1));
  };
  for (let q = 0; q < 8; q++) book.add(`clock${q}`, face(q), { solid: SOLID, ntime: CLOCK_STEP, next: `clock${(q + 1) % 8}` });
  // a curtain of tubular bells: hanging across the way (solid), or swung aside (open)
  const bells = (open: boolean) => {
    const p = wall().rect(0, 0, 20, 2, c('wood', 0));
    for (let i = 0; i < 4; i++) {
      const x = open ? 1 + i * 2 : 2 + i * 5;
      const len = 14 - i * 2;
      p.rect(x, 2, 3, len, c('metal', 3))
        .rect(x, 2, 1, len, c('metal', 4))
        .rect(x, 2 + len, 3, 1, c('metal', 1));
    }
    return p;
  };
  book.add('bells', bells(false), { solid: SOLID, ntime: CLOCK_STEP * OPEN_FROM, next: 'bells.open' });
  book.add('bells.open', bells(true), { ...air, ntime: CLOCK_STEP * (8 - OPEN_FROM), next: 'bells' });
  // the tin heart, ticking among the gears: a glint crosses it now and then; touched, it leaves the wall
  const tin = { ink: c('ink', 0), tin: [c('metal', 1), c('metal', 2), c('metal', 4)], white: c('cloud', 2), dark: c('metal', 0) };
  for (let f = 0; f < SHINE_FRAMES; f++)
    book.add(`tinHeart${f || ''}`, drawTinHeart(wall(), tin, f), {
      ...air,
      next: `tinHeart${(f + 1) % SHINE_FRAMES || ''}`,
      ntime: f ? 2 : 50,
      touch: 'wall',
      score: 100,
    });
  notes(k, wall(), [c('blue', 2), c('green', 2), c('yellow', 2), c('orange', 2), c('red', 2), c('purple', 2)]);
  pickups(k, MALLET_FINDS, 'wall');
  door(k, wall(), MALLET_FINDS.length, (p: Pixels) => {
    // a little bell over the door
    p.disc(10, 8, 3, c('gold', 2)).rect(7, 8, 7, 3, c('gold', 2)).set(10, 12, c('ink', 0));
  });
  return k;
}

export function clock(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '.': 'wall', '=': 'beam', _: 'floor', '#': 'pier' }, 'beam');
  m.fill(0, 0, W, 1, '=').fill(0, 1, W, 8, '.').fill(0, 9, W, 1, '_');
  // the piers between the rooms, a clock in each over its bell curtain
  for (const x of BELL_DOORS) {
    m.fill(x, 1, 1, 6, '#');
    m.set(x, 7, 'clock0').set(x, 8, 'bells');
  }
  // gears turning on the walls
  for (const [x, y] of [
    [2, 3],
    [8, 2],
    [12, 4],
    [17, 2],
    [22, 3],
    [28, 2],
    [33, 3],
    [31, 5],
  ])
    m.set(x, y, 'cog0');
  for (const [x, h] of STEPS) for (let y = 9 - h; y < 9; y++) m.set(x, y, 'step0');
  for (const [x, y] of LEDGES) m.set(x, y, 'ledge0');
  m.set(...HEART_AT, 'tinHeart');
  // the glockenspiel's notes along the floor of the first room and the third
  [2, 4, 21, 22].forEach((x, i) => m.set(x, 8, `note${[0, 1, 4, 5][i]}`));
  for (const [id, x, y] of MALLETS_AT) m.set(x, y, `pick-${id}`);
  m.set(38, 8, 'door').set(38, 7, 'door.top').set(39, 8, 'door.open').fill(38, 1, 1, 6, '#');
  m.link(39, 8);
  // row 5: the view (which never scrolls up or down) sits square on the level; Teddy drops to the floor
  return { m, start: at(1, 5), size: [W, 10] };
}
