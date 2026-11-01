// Level 5, The Basement (the Bass family). Low, dark rooms under the music store, with a
// furnace and a water heater in the way. The Deep Sub-Bass rumbles: its speaker columns push
// Teddy up in pulses on the beat (a ring of two blocks, the pull up and then none), to the
// ducts along the ceiling, and he drops off their far ends into the next room. The floor is a
// metronome: a lamp steps one tile along it each beat (a click track, with the song's click).
// Seven basses to find; the door at the end opens when all seven are found.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import { door, kit, notes, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { MapBuilder, at, type Level } from './maps';

export const BASS_FINDS = ['sub-bass', 'upright-bass', 'finger-bass', 'slap-bass', 'fretless', 'punch-bass', 'sub-round'];
const W = 32;
/** A beat of the song, in ticks: the metronome lamp's step and the speakers' pulse (half on, half off). */
export const BASEMENT_BEAT = 8;
/** The speaker columns (level x), from the floor up to the duct row. */
export const LIFTS = [6, 17];
/** The row Teddy rides the ducts on (their floor is the row under it). */
export const DUCT_ROW = 2;
/** The ducts: [first column, last column]; Teddy drops off the right end. */
export const DUCTS: [number, number][] = [
  [7, 11],
  [18, 23],
];
/** Where each bass lies: [id, x, y]. */
export const BASSES_AT: [string, number, number][] = [
  ['sub-bass', 3, 8],
  ['upright-bass', 9, DUCT_ROW],
  ['finger-bass', 12, 8],
  ['slap-bass', 15, 7],
  ['fretless', 21, DUCT_ROW],
  ['punch-bass', 25, 8],
  ['sub-round', 28, 7],
];
/** The crates the high basses sit on (level x, on the floor row). */
const CRATES = [15, 28];

export function basementBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // block walls in the gloom, pipes along the ceiling
  const wall = () => {
    const p = P(c('stone', 0));
    for (let y = 0; y < 20; y += 10) p.rect(0, y + 9, 20, 1, c('ink', 1)).rect(y ? 0 : 10, y, 1, 9, c('ink', 1));
    return p;
  };
  book.add('wall', wall(), air);
  book.add(
    'pipes',
    P(c('ink', 1)).rect(0, 4, 20, 5, c('metal', 1)).rect(0, 5, 20, 1, c('metal', 3)).rect(0, 12, 20, 3, c('orange', 0)).rect(14, 2, 3, 9, c('metal', 0)),
    {
      solid: SOLID,
    },
  );
  // the ducts: a walkway of sheet metal (stand on top)
  book.add(
    'duct',
    P(c('metal', 2)).rect(0, 0, 20, 2, c('metal', 4)).rect(0, 18, 20, 2, c('metal', 0)).rect(4, 6, 1, 8, c('metal', 1)).rect(14, 6, 1, 8, c('metal', 1)),
    {
      solid: SOLID,
    },
  );
  // the furnace and the water heater: in the way on the floor
  const furnace = (top: boolean) => {
    const p = P(c('brick', 1)).rect(0, 0, 20, 1, c('brick', 3));
    if (top) p.rect(4, 6, 12, 8, c('ink', 0)).rect(6, 10, 8, 3, c('orange', 2)).rect(7, 11, 6, 1, c('glow', 3));
    else for (let y = 4; y < 20; y += 5) p.rect(0, y, 20, 1, c('brick', 0));
    return p;
  };
  book.add('furnace.top', furnace(true), { solid: SOLID });
  book.add('furnace', furnace(false), { solid: SOLID });
  const heater = (top: boolean) => {
    const p = P(c('ink', 0)).rect(2, 0, 16, 20, c('metal', 2)).rect(3, 0, 2, 20, c('metal', 4)).rect(15, 0, 2, 20, c('metal', 1));
    if (top) p.rect(2, 0, 16, 3, c('metal', 3)).disc(10, 10, 2.5, c('red', 2));
    return p;
  };
  book.add('heater.top', heater(true), { solid: SOLID });
  book.add('heater', heater(false), { solid: SOLID });
  // a crate to stand a bass on
  book.add('crate', P(c('wood', 2)).frame(0, 0, 20, 20, c('wood', 0)).line(1, 1, 18, 18, c('wood', 1)).line(18, 1, 1, 18, c('wood', 1)), { solid: SOLID });
  // the metronome floor: tile `i` lights on beat `i` of every four (a ring of one lit and up to two dark stretches)
  const tile = (lit: boolean) =>
    P(c('stone', 1))
      .rect(0, 0, 20, 2, c('stone', 2))
      .rect(0, 19, 20, 1, c('ink', 1))
      .disc(10, 9, 3, lit ? c('glow', 3) : c('ink', 1))
      .ring(10, 9, 4, lit ? c('glow', 1) : c('stone', 0));
  for (let i = 0; i < 4; i++) {
    const ring: { lit: boolean; beats: number }[] = [];
    if (i > 0) ring.push({ lit: false, beats: i });
    ring.push({ lit: true, beats: 1 });
    if (i < 3) ring.push({ lit: false, beats: 3 - i });
    ring.forEach((r, j) =>
      book.add(`click${i}.${j}`, tile(r.lit), { solid: SOLID, ntime: r.beats * BASEMENT_BEAT, next: `click${i}.${(j + 1) % ring.length}` }),
    );
  }
  // a speaker column: half a beat pushing up (the cone out, rings around it), half a beat still
  const column = (push: boolean, cone: boolean) => {
    const p = wall().rect(3, 0, 14, 20, c('ink', 0)).rect(4, 0, 12, 20, c('ink', 1));
    if (cone) p.disc(10, 12, push ? 6 : 5, c('metal', 1)).disc(10, 12, 2.5, c('metal', 3));
    else p.rect(9, 0, 2, 20, c('purple', 0));
    if (push) for (const y of cone ? [3] : [4, 14]) p.rect(6, y, 8, 1, c('purple', 3)).rect(8, y - 2, 4, 1, c('purple', 2));
    return p;
  };
  const half = BASEMENT_BEAT / 2;
  for (const [name, cone] of [
    ['lift', false],
    ['cone', true],
  ] as const) {
    book.add(name, column(true, cone), { grav: GRAV.up, ntime: half, next: `${name}.still` });
    book.add(`${name}.still`, column(false, cone), { grav: GRAV.none, ntime: half, next: name });
  }
  notes(k, wall(), [c('purple', 2), c('blue', 2), c('green', 2), c('yellow', 2), c('orange', 2), c('red', 2)]);
  pickups(k, BASS_FINDS, 'wall');
  door(k, wall(), BASS_FINDS.length, (p: Pixels) => {
    // a bass clef over the door
    p.ring(8, 9, 3, c('cloud', 2)).rect(11, 6, 1, 8, c('cloud', 2)).set(14, 7, c('cloud', 2)).set(14, 11, c('cloud', 2));
  });
  return k;
}

export function basement(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '.': 'wall', '=': 'pipes', D: 'duct', C: 'crate' }, 'pipes');
  m.fill(0, 0, W, DUCT_ROW, '=').fill(0, DUCT_ROW, W, 9 - DUCT_ROW, '.');
  for (let x = 0; x < W; x++) m.set(x, 9, `click${x % 4}.0`);
  // the speaker columns, the ducts they lift Teddy to, and what blocks the floor under each duct
  for (const x of LIFTS) {
    for (let y = DUCT_ROW; y < 8; y++) m.set(x, y, 'lift');
    m.set(x, 8, 'cone');
  }
  for (const [a, b] of DUCTS) m.fill(a, DUCT_ROW + 1, b - a + 1, 1, 'D');
  m.set(7, 4, 'furnace.top').fill(7, 5, 1, 4, 'furnace').set(8, 4, 'furnace.top').fill(8, 5, 1, 4, 'furnace');
  m.set(18, 4, 'heater.top').fill(18, 5, 1, 4, 'heater').set(19, 4, 'heater.top').fill(19, 5, 1, 4, 'heater');
  for (const x of CRATES) m.set(x, 8, 'C');
  // a run of notes over the floor of the middle room
  [10, 11, 13, 14].forEach((x, i) => m.set(x, 8, `note${[0, 1, 4, 5][i]}`));
  for (const [id, x, y] of BASSES_AT) m.set(x, y, `pick-${id}`);
  m.set(30, 8, 'door').set(30, 7, 'door.top').set(31, 8, 'door.open').fill(30, DUCT_ROW, 1, 5, '=');
  m.link(31, 8);
  // row 5: the view (which never scrolls up or down) sits square on the level; Teddy drops to the floor
  return { m, start: at(1, 5), size: [W, 10] };
}
