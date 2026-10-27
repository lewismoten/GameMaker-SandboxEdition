// The Sandbox Software regulars tucked into the library (games/kit/TIN-HEARTS.md), each block
// added after everything else in its set so no other block's number moves: the tin heart and
// a painted Easter egg in a quiet reading nook behind a gap in the Other Dimensions hallway's
// shelves (a few points each, no sound, gone when touched; Joe's walk to the books never
// passes them), and Watt from Ohm Sweet Ohm in the Laboratory, seeing to the inventor's
// wiring where a panel of it stood (as solid as it was).
//
// Every other screen in the library is a window that never scrolls, so all of it shows the
// moment Joe walks in. The nook is its own scene, two windows wide, that scrolls as Joe walks:
// its far end, where the heart and the egg are, only comes on screen once he goes looking.
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { wattCameo } from '../../../kit/cameos';
import { PAL, c } from '../art/pal';
import { on } from '../art/kit';
import type { CompiledHub } from './hub';
import { shelf, type CompiledWing } from './wing';
import type { Cell } from './area';
import { LAB } from './wings/lab';
import { OTHER } from './wings/other';

/** Where Watt is, in book 1 of the Lab's own cells. */
const HIDDEN = { watt: { x: 9, y: 1 } };

/** The nook's top-left on its wing's map (under the hallway and the books, rows 0..9). */
const NOOK_AT = { x: 4, y: 20 };

/** The gap in the hallway's right-hand shelves that leads in (hallway cells). */
const GAP = { x: 15, y: 7 };

/**
 * The nook, two windows side by side: S shelves, T t a reading table, D the way out, h the
 * tin heart, e the Easter egg. Joe comes in at the left window's '@'; the right one's '@' is
 * only floor (every window has one).
 */
const NOOK = [
  [
    'SSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSS',
    'SS............SS',
    'SS.Tt.........SS',
    'SS..............',
    'SS......@.......',
    'SS..............',
    'SS.........Tt.SS',
    'SS............SS',
    'SSSSSSSSDSSSSSSS',
  ],
  [
    'SSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSS',
    'SSSSSSSSSS....hS',
    'SSSSSSSSSS.....S',
    '...............S',
    '........@......S',
    '...........Tt..S',
    'SSSSSSSSSS.....S',
    'SSSSSSSSSSe....S',
    'SSSSSSSSSSSSSSSS',
  ],
];

export function addHidden(_hub: CompiledHub, wings: CompiledWing[]): void {
  addNook(wings.find((w) => w.spec === OTHER)!);
  // Watt, rolled up to the wiring in Great Minds, Strange Priorities
  const lab = wings.find((w) => w.spec === LAB)!;
  const book = lab.books[0].win;
  const wa = lab.area;
  wa.solid('watt', on(wa.tiles.pic(lab.books[0].spec.floor), wattCameo(PAL.pal, 'down', 0, 'ok')));
  wa.set(book.ox + HIDDEN.watt.x, book.oy + HIDDEN.watt.y, 'watt');
}

function addNook(wing: CompiledWing): void {
  const a = wing.area;
  const { tint } = wing.spec;
  const seed = wing.index * 13;
  const floor = a.tiles.pic('hall');
  // the gap: the shelves part on a dark way through (not solid; a link into the nook)
  const gap = shelf(seed + 1, tint);
  gap.rect(5, 0, 10, 20, c('ink', 1)).rect(5, 0, 1, 20, c('wood', 0)).rect(14, 0, 1, 20, c('wood', 0));
  for (const y of [6, 13]) gap.rect(6, y, 8, 1, c('wood', 2));
  a.tile('nookGap', gap);
  a.set(wing.hall.ox + GAP.x, wing.hall.oy + GAP.y, 'nookGap');
  const tin = { ink: c('ink', 0), tin: [c('tin', 2), c('tin', 3), c('tin', 4)], white: c('paper', 4), dark: c('ink', 1) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    a.tile(`tinHeart${k || ''}`, drawTinHeart(on(floor), tin, k), {
      score: 100,
      touch: 'hall',
      next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 50,
    });
  const egg = {
    ink: c('ink', 0),
    shell: [c('teal', 1), c('teal', 2), c('teal', 3)],
    paint: [c('brass', 2), c('brass', 3)],
    accent: c('pink', 3),
    white: c('paper', 4),
  };
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    a.tile(`easterEgg${k || ''}`, drawEasterEgg(on(floor), egg, 'stars', k), {
      score: 25,
      touch: 'hall',
      next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 70,
    });
  // shelves all round, so the view never scrolls past them onto bare carpet (it can run on
  // about half a screen past either end, round the map's left edge too)
  for (let y = NOOK_AT.y - 2; y < NOOK_AT.y + 12; y++) for (let x = NOOK_AT.x - 16; x < NOOK_AT.x + 48; x++) a.set((x + 100) % 100, y, 'shelf');
  const legend: Record<string, Cell> = {
    S: 'shelf',
    '.': 'hall',
    T: 'tableL',
    t: 'tableR',
    D: { tile: 'door', mark: 'out' },
    h: 'tinHeart',
    e: 'easterEgg',
  };
  const left = a.window(NOOK_AT.x, NOOK_AT.y, NOOK[0], legend, 'hall');
  a.window(NOOK_AT.x + 16, NOOK_AT.y, NOOK[1], legend, 'hall');
  wing.nook = { gap: { x: wing.hall.ox + GAP.x, y: wing.hall.oy + GAP.y }, entry: left.entry, out: left.marks.get('out')! };
}
