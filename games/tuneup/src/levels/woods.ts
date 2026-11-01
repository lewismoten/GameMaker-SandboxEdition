// Level 9, The Woods by the River (the Woodwinds family). Three staff doors bar the path: a
// tree's trunk carries five lines of a staff, a filled note on every line but one, and the
// hollow one is the note to play. Teddy climbs the cattail beside it (nothing pulls him down
// in the reeds, so Up climbs and Down lets him back down), and Space pokes a paw at the staff
// (STAFF.CHR): the hollow note sounds (a flute, high or low by where it sits: "Staff Doors" and
// notes at their pitch's height, DESIGN.md), counts one (counter 27) and the door at the foot of
// the trunk opens for it. One key a row was the plan, but PLAYGAME moves a hero at most 11 px a
// tick, so no key can lift him straight to a line. Six woodwinds to find; the felt egg hides in
// the clump of reeds behind where Teddy starts: one of them is hollow.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { feltEgg } from '../art/egg';
import type { Pal } from '../art/pal';
import { door, kit, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { CTR } from '../ids';
import { MapBuilder, at, type Level } from './maps';

export const WIND_FINDS = ['flute', 'clarinet', 'oboe', 'sax', 'pan-flute', 'reed-soft'];
const W = 40;
/** The staff's rows (its top line first): the trunk carries it from row 2 to row 6. */
const STAFF_TOP = 2;
const STAFF_ROWS = 5;
/** The staff doors: the trunk's column and the row of its hollow note (rows above 5 sound high). */
export const STAFF_DOORS = [
  { x: 10, row: 6 },
  { x: 19, row: 4 },
  { x: 27, row: 2 },
];
const HIGH_ROWS = 3;
/** The clump of reeds hiding the felt egg, and its hollow cell. */
export const EGG_AT: [number, number] = [1, 8];
/** The felt egg's block number (about.json "egg" and web/src/eggs/eggs.ts carry it too). */
export const EGG_BLOCK = 149;
/** Where the winds lie: [column, row]. */
export const WINDS_AT: [string, number, number][] = [
  ['flute', 5, 8],
  ['clarinet', 7, 7],
  ['pan-flute', 9, 2],
  ['oboe', 13, 8],
  ['sax', 15, 7],
  ['reed-soft', 23, 8],
];
/** The way out. */
export const EXIT_X = 37;

export function woodsBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // the woods: trunks in the dusk-green shade above, the river glinting behind the bank below
  const woods = (row: number) => {
    const p = P(c('leaf', 1));
    if (row >= 6)
      p.rect(0, 0, 20, 20, c('water', row === 6 ? 2 : 1))
        .rect(3, 6, 5, 1, c('water', 3))
        .rect(12, 13, 4, 1, c('water', 3));
    else p.rect(4, 0, 3, 20, c('leaf', 0)).rect(14, 0, 2, 20, c('leaf', 0)).rect(15, 0, 1, 20, c('leaf', 2));
    return p;
  };
  for (let r = 1; r < 9; r++) book.add(`woods${r}`, woods(r), air);
  book.add('canopy', P(c('leaf', 2)).disc(5, 8, 6, c('leaf', 3)).disc(15, 12, 5, c('grass', 3)), { solid: SOLID });
  book.add('bank', P(c('dirt', 2)).rect(0, 0, 20, 3, c('grass', 3)).rect(0, 3, 20, 1, c('grass', 1)), { solid: SOLID });
  book.add('stump', P(c('wood', 1)).rect(0, 0, 20, 4, c('wood', 3)).ring(10, 2, 5, c('wood', 2)).rect(2, 4, 2, 16, c('wood', 0)), { solid: SOLID });
  book.add('trunk', P(c('wood', 1)).rect(3, 0, 2, 20, c('wood', 0)).rect(13, 0, 2, 20, c('wood', 2)), { solid: SOLID });
  // a cattail to climb: nothing pulls Teddy down in it
  const reed = (row: number, top: boolean) => {
    const p = woods(row);
    p.rect(9, 0, 2, 20, c('grass', 2)).rect(9, 0, 1, 20, c('grass', 3)).line(10, 12, 16, 4, c('grass', 2));
    if (top) p.rect(8, 2, 4, 9, c('dirt', 1)).rect(9, 0, 2, 2, c('grass', 2));
    return p;
  };
  for (let r = 2; r < 9; r++) book.add(`reed${r}`, reed(r, r === 2), { grav: GRAV.none });
  // the staff on a trunk: a line through each row, a filled note on it, or the hollow one
  const staff = (note: 'filled' | 'hollow' | 'played') => {
    const p = P(c('wood', 1)).rect(3, 0, 2, 20, c('wood', 0)).rect(0, 9, 20, 2, c('paint', 3));
    const ink = c('ink', 0);
    if (note === 'hollow') {
      blob(p, 10, 10, 6, 4.4, [ink, ink, ink], 0, 2);
      blob(p, 10, 10, 3.6, 2.2, [c('cloud', 2), c('cloud', 2), c('cloud', 2)], 0, 2);
      p.rect(15, 0, 1, 10, ink);
    } else {
      blob(p, 10, 10, 5, 3.6, [ink, note === 'played' ? c('gold', 2) : ink, note === 'played' ? c('gold', 2) : ink], 0, 2);
      p.rect(14, 0, 1, 10, ink);
    }
    return p;
  };
  book.add('staff', staff('filled'), { solid: SOLID });
  book.add('staff.played', staff('played'), { solid: SOLID });
  // the hollow note: one played, and (high on the staff) a hit point first, for the high flute
  book.add('staff.lo', staff('hollow'), { solid: SOLID, effect: CTR.staff, eamt: 1, score: 100, touch: 'staff.played' });
  book.add('staff.hi', staff('hollow'), { solid: SOLID, effect: CTR.staff, eamt: 1, hp: 1, score: 100, touch: 'staff.played' });
  // the door at a trunk's foot: it opens for one note played
  const gate = (open: boolean) => {
    const p = P(c('wood', 1)).rect(3, 0, 2, 20, c('wood', 0));
    if (open) return p.rect(5, 2, 10, 18, c('ink', 1));
    return p.rect(5, 2, 10, 18, c('wood', 3)).rect(5, 2, 10, 1, c('wood', 4)).disc(12, 12, 1.2, c('gold', 2));
  };
  book.add('gate', gate(false), { solid: SOLID, effect: CTR.staff, eamt: -1, touch: 'gate.open' });
  book.add('gate.open', gate(true), air);
  // the reeds by the start: a thick clump; the hollow one parts for Teddy, and the felt egg is inside
  const clump = (row: number) => {
    const p = woods(row);
    for (const x of [1, 5, 9, 13, 17]) p.rect(x, 0, 2, 20, c('grass', (x / 4) % 2 ? 2 : 1)).rect(x, 3 + (x % 5), 2, 5, c('dirt', 1));
    return p;
  };
  for (const r of [6, 7, 8]) book.add(`clump${r}`, clump(r), { solid: SOLID });
  book.add('clump.hollow', clump(EGG_AT[1]), { ...air, touch: 'egg' });
  book.add('parted', woods(EGG_AT[1]).rect(1, 0, 2, 20, c('grass', 1)).rect(17, 0, 2, 20, c('grass', 2)), air);
  pickups(k, WIND_FINDS, (id) => (id === 'pan-flute' ? 'reed2' : id === 'clarinet' || id === 'sax' ? 'woods7' : 'woods8'));
  door(k, woods(8), WIND_FINDS.length, (p: Pixels) => {
    // a recorder over the door
    p.rect(4, 7, 12, 3, c('wood', 3)).set(7, 8, c('ink', 0)).set(10, 8, c('ink', 0)).set(13, 8, c('ink', 0));
  });
  // the felt egg in the last slot, 149, a number no other map of the game ever shows
  while (book.index.size < EGG_BLOCK) book.add(`spare${book.index.size}`, P());
  book.add('egg', feltEgg(woods(EGG_AT[1])), { ...air, obj: 1, score: 500, touch: 'parted' });
  return k;
}

/** The egg block's number in the woods' block set (about.json and web/src/eggs/eggs.ts carry it). */
export const eggBlock = (book: Kit['book']) => book.n('egg');

export function woods(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '=': 'canopy', _: 'bank', S: 'stump', T: 'trunk' }, 'canopy');
  m.fill(0, 0, W, 1, '=');
  for (let r = 1; r < 9; r++) m.fill(0, r, W, 1, `woods${r}`);
  m.fill(0, 9, W, 1, '_');
  // the clump at the start, its hollow reed at the foot
  for (const r of [6, 7, 8]) m.fill(0, r, 2, 1, `clump${r}`);
  m.set(EGG_AT[0], EGG_AT[1], 'clump.hollow');
  m.set(7, 8, 'S').set(15, 8, 'S');
  for (const d of STAFF_DOORS) {
    for (let r = 2; r < 9; r++) m.set(d.x - 1, r, `reed${r}`);
    // trunk above the staff, and a stretch of bare trunk between it and the door (a paw at the
    // lowest line never reaches the door)
    m.set(d.x, 1, 'T').set(d.x, 7, 'T');
    for (let r = STAFF_TOP; r < STAFF_TOP + STAFF_ROWS; r++) m.set(d.x, r, r === d.row ? (r <= HIGH_ROWS ? 'staff.hi' : 'staff.lo') : 'staff');
    m.set(d.x, 8, 'gate');
  }
  for (const [id, x, y] of WINDS_AT) m.set(x, y, `pick-${id}`);
  // the way out: a door in a trunk
  m.fill(EXIT_X, 1, 1, 6, 'T');
  m.set(EXIT_X, 8, 'door')
    .set(EXIT_X, 7, 'door.top')
    .set(EXIT_X + 1, 8, 'door.open');
  m.link(EXIT_X + 1, 8);
  // he starts mid-screen (where the view centers, and it never scrolls up or down) and drops to the bank
  return { m, start: at(3, 5), size: [W, 10] };
}
