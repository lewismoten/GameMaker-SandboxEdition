// Level 3, The Music Store's Back Room (the Strings family). Two concert harps stand among
// the instrument cases, and their strings are ladders: nothing pulls Teddy down inside a harp,
// so Up climbs and Down lets him back down. A row of guitar cases steps up like stairs, a
// floating note over each ringing the next note of a harp's scale. Eight string instruments
// to find; a toy drummer has wandered in from the piano shop. The door at the end opens when
// all eight are found.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import type { Pal } from '../art/pal';
import { door, kit, LEDGE, notes, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

export const STRING_FINDS = ['violin', 'orchestra', 'pizzicato', 'guitar-steel', 'guitar-nylon', 'oud', 'harp', 'harp-chime'];
/** Level width; one screen tall. */
const W = 40;
/** The harps' columns (level x). */
export const HARPS = [14, 36];

export function stringsBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // the back room: teal walls with a picture rail, a plank floor
  const wall = () => P(c('teal', 1)).rect(0, 0, 20, 1, c('teal', 0)).rect(6, 0, 1, 20, c('teal', 0)).rect(16, 0, 1, 20, c('teal', 0));
  book.add('wall', wall(), air);
  book.add('ceiling', P(c('wood', 0)).rect(0, 15, 20, 5, c('wood', 1)), { solid: SOLID });
  book.add('floor', P(c('wood', 2)).rect(0, 0, 20, 2, c('wood', 3)).rect(9, 2, 1, 18, c('wood', 1)), { solid: SOLID });
  // shelves and the counter: planks over the wall
  const plank = (back: Pixels) => back.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 3, 20, 1, c('wood', 1));
  book.add('shelf', plank(wall()), { solid: LEDGE, grav: GRAV.down });
  // guitar cases standing on end, a step each: black with a gold clasp
  book.add('case', P(c('ink', 1)).rect(1, 0, 18, 20, c('ink', 0)).rect(3, 2, 14, 1, c('ink', 1)).rect(9, 9, 2, 2, c('gold', 2)), { solid: SOLID });
  // a harp's strings: no pull inside, so Teddy climbs (gold pillar left, strings across)
  const strings = (top: boolean) => {
    const p = wall();
    for (const x of [6, 10, 14]) p.rect(x, 0, 1, 20, c('paint', 3));
    p.rect(0, 0, 3, 20, c('gold', 2)).rect(1, 0, 1, 20, c('gold', 3));
    if (top) blob(p, 10, 3, 9, 3, k.R('gold'), 1, 3);
    return p;
  };
  book.add('harp', strings(false), { grav: GRAV.none });
  book.add('harp.top', strings(true), { grav: GRAV.none });
  notes(k, wall(), [c('red', 2), c('orange', 2), c('yellow', 2), c('green', 2), c('blue', 2), c('purple', 2)]);
  pickups(k, STRING_FINDS, (id) => (id === 'harp-chime' ? 'harp.top' : 'wall'));
  door(k, wall(), STRING_FINDS.length, (p) => {
    // a violin's scroll over the door
    p.ring(10, 6, 3, c('wood', 3)).rect(10, 6, 1, 4, c('wood', 3));
  });
  return k;
}

export function strings(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '.': 'wall', '=': 'ceiling', _: 'floor', '-': 'shelf', C: 'case' }, 'ceiling');
  m.fill(0, 0, W, 1, '=').fill(0, 1, W, 8, '.').fill(0, 9, W, 1, '_');
  // the counter Teddy starts on, the high shelf by the first harp, the shelf after the cases
  m.fill(5, 6, 6, 1, '-').fill(15, 2, 5, 1, '-').fill(28, 3, 4, 1, '-');
  // the harps: strings from the floor to the ceiling
  for (const x of HARPS) {
    m.fill(x, 2, 1, 7, 'harp');
    m.set(x, 1, 'harp.top');
  }
  // the guitar cases step up, a note over each
  for (let s = 0; s < 6; s++) {
    for (let y = 8 - s; y <= 8; y++) m.set(22 + s, y, 'C');
    m.set(22 + s, 7 - s, `note${s}`);
  }
  m.set(6, 5, 'pick-violin')
    .set(3, 8, 'pick-guitar-steel')
    .set(11, 8, 'pick-pizzicato')
    .set(18, 1, 'pick-harp')
    .set(21, 8, 'pick-guitar-nylon')
    .set(30, 2, 'pick-oud')
    .set(33, 8, 'pick-orchestra')
    .set(HARPS[1], 1, 'pick-harp-chime');
  m.set(38, 8, 'door').set(38, 7, 'door.top').set(39, 8, 'door.open');
  m.link(39, 8);
  m.mon(MON.drummer, 16, 8);
  return { m, start: at(8, 5), size: [W, 10] };
}
