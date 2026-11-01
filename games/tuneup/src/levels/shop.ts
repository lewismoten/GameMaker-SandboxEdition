// Level 1, The Piano Shop (the Keys family). The floor is a keyboard of white keys; the black
// keys stand up from it as ledges to hop. Six keyboards lie where Gwinn's tumble threw them:
// on the floor, on the shelves, up the piano stairs (a floating note over each step rings the
// next note of a scale, each in its own sound slot), and on the shelf where Gwinn herself is
// pacing. A wind-up toy drummer marches the floor. The back door to the player piano opens
// once all six are found.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { iconPic } from '../art/icons';
import type { Pal } from '../art/pal';
import { door, kit, LEDGE, notes, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** The six keyboards to find here (the seventh is inside the player piano). */
export const SHOP_FINDS = ['piano-bright', 'piano-mellow', 'epiano', 'epiano-round', 'harpsichord', 'clavinet'];

/** What each keyboard leaves behind (the rest lie on the wainscot). */
const AFTER: Record<string, string> = { 'piano-mellow': 'rail', harpsichord: 'rail', 'epiano-round': 'wall' };

export function shopBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // wallpaper: cream with a soft stripe and a row of little eighth notes
  const wall = () => {
    const p = P(c('peach', 3));
    p.rect(0, 0, 2, 20, c('peach', 2)).rect(10, 0, 1, 20, c('peach', 2));
    p.disc(15, 9, 1.4, c('peach', 1)).rect(16, 4, 1, 5, c('peach', 1));
    return p;
  };
  // the wainscot below the chair rail: dark wood panels
  const wains = () => P(c('wood', 1)).rect(2, 2, 16, 16, c('wood', 2)).rect(2, 2, 16, 1, c('wood', 3));
  book.add('wall', wall(), air);
  book.add('rail', wall().rect(0, 15, 20, 5, c('wood', 3)).rect(0, 15, 20, 1, c('wood', 4)), air);
  book.add('wains', wains(), air);
  // the ceiling beam and the walls outside (solid)
  book.add('beam', P(c('wood', 0)).rect(0, 16, 20, 4, c('wood', 1)), { solid: SOLID });
  // the floor: white keys, ivory with a seam and a shadow at the front
  const white = () => P(c('paint', 3)).rect(19, 0, 1, 20, c('stone', 1)).rect(0, 17, 20, 3, c('paint', 1)).rect(0, 0, 20, 1, c('paint', 2));
  book.add('floor', white(), { solid: SOLID });
  // a raised black key: glossy, with a highlight down its left
  const black = () => P(c('ink', 0)).rect(2, 1, 2, 16, c('ink', 1)).rect(0, 18, 20, 2, c('ink', 1)).frame(0, 0, 20, 20, c('ink', 0));
  book.add('black', black(), { solid: SOLID });
  // shelves: a plank on brackets, over the wallpaper (stand on top, hop up through)
  const shelf = (back: Pixels) =>
    back.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 3, 20, 1, c('wood', 1)).line(4, 4, 8, 9, c('metal', 2)).line(15, 4, 11, 9, c('metal', 2));
  book.add('shelf', shelf(wall()), { solid: LEDGE, grav: GRAV.down });
  // the piano stairs: steps like big piano keys, side on
  book.add('step', P(c('paint', 3)).rect(0, 0, 20, 3, c('paint', 4)).rect(0, 17, 20, 3, c('paint', 1)).rect(13, 3, 7, 9, c('ink', 0)), { solid: SOLID });
  // the shop window behind the counter: keyboards on show (no gold frame: not to pick up)
  const glass = () => P(c('sky', 6)).rect(0, 0, 20, 2, c('wood', 1)).rect(0, 18, 20, 2, c('wood', 1)).line(3, 15, 9, 3, c('sky', 7));
  book.add('window', glass(), air);
  ['piano', 'combo-organ', 'organ'].forEach((id, i) => {
    const p = glass();
    book.add(`show${i}`, iconPic(id, p).rect(0, 18, 20, 2, c('wood', 1)), air);
  });
  // Gwinn's mess: a tipped-over trunk, a lid, scattered sheet music (scenery)
  const trunk = () => {
    const p = wains();
    blob(p, 10, 13, 9, 6, k.R('red'), 0, 3);
    p.rect(2, 10, 16, 1, c('gold', 2)).rect(9, 9, 2, 3, c('gold', 3));
    return p;
  };
  book.add('trunk', trunk(), air);
  const sheet = (seed: number) => {
    const p = wains();
    const r = rng(seed);
    const x = 3 + Math.floor(r() * 6);
    p.rect(x, 9, 9, 8, c('paint', 3));
    for (let y = 11; y < 16; y += 2) p.rect(x + 1, y, 7, 1, c('ink', 1));
    p.disc(x + 3, 12, 1, c('ink', 0));
    return p;
  };
  book.add('sheet', sheet(4), air);
  notes(k, wall(), [c('red', 2), c('orange', 2), c('yellow', 2), c('green', 2), c('blue', 2), c('purple', 2)]);
  pickups(k, SHOP_FINDS, (id) => AFTER[id] ?? 'wains');
  door(k, wall(), SHOP_FINDS.length, (p) => {
    // a little piano roll over the door: where the player piano is
    p.rect(4, 2, 12, 8, c('paint', 3)).frame(4, 2, 12, 8, c('ink', 0));
    for (let i = 0; i < 4; i++) p.rect(6 + i * 3, 4 + (i % 2) * 2, 2, 1, c('ink', 0));
  });
  return k;
}

const LEGEND: Record<string, string> = {
  '.': 'wall',
  r: 'rail',
  ',': 'wains',
  '=': 'beam',
  _: 'floor',
  B: 'black',
  '-': 'shelf',
  S: 'step',
  W: 'window',
  '0': 'show0',
  '1': 'show1',
  '2': 'show2',
  T: 'trunk',
  m: 'sheet',
  D: 'door',
  d: 'door.top',
};

/** Level width in blocks; it is one screen tall (10). */
export const SHOP_W = 48;

export function shop(book: Kit['book']): Level {
  const m = new MapBuilder(book, LEGEND, 'beam');
  const W = SHOP_W;
  m.fill(0, 0, W, 1, '=').fill(0, 1, W, 4, '.').fill(0, 5, W, 1, 'r').fill(0, 6, W, 3, ',').fill(0, 9, W, 1, '_');
  // the shop windows, the trunk Gwinn tipped over and the music she scattered
  m.patch(2, 2, ['W01W']).patch(17, 2, ['W2W']).patch(2, 7, ['T,m']);
  // black keys standing up from the floor, and the shelves
  for (const x of [4, 15, 16, 42, 43, 44]) m.set(x, 8, 'B');
  m.fill(6, 6, 8, 1, '-').fill(30, 3, 4, 1, '-').fill(37, 6, 4, 1, '-');
  // the piano stairs: step k (0..5) is solid from row 8-k down, with a note over it
  for (let k = 0; k < 6; k++) {
    for (let y = 8 - k; y <= 8; y++) m.set(24 + k, y, 'S');
    m.set(24 + k, 7 - k, `note${k}`);
  }
  // the keyboards: on the floor, on the shelf, after the drummer, on the high shelf, on Gwinn's shelf, on a black key
  m.set(7, 8, 'pick-piano-bright')
    .set(12, 5, 'pick-piano-mellow')
    .set(22, 8, 'pick-epiano')
    .set(32, 2, 'pick-epiano-round')
    .set(39, 5, 'pick-harpsichord')
    .set(43, 7, 'pick-clavinet');
  // the way out: the door (shut until all six are found) and the doorway behind it
  m.set(46, 8, 'D').set(46, 7, 'd').set(47, 8, 'door.open');
  m.link(47, 8);
  m.mon(MON.drummer, 17, 8).mon(MON.drummer, 33, 8).mon(MON.gwinn, 37, 5);
  // he starts on the counter, mid-screen (the view is centered on him; it never scrolls up or down)
  return { m, start: at(8, 5), size: [SHOP_W, 10] };
}
