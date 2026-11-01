// Level 12, The Attic (the Classic family: the song maker's own nine instruments). Up under
// the rafters stands Doc Leo's old toy piano with two big chord keys, C and F, and his sheet
// music on its stand: C, F, G. Walking into a key plays its chord (sound slots as chord
// buttons: C rings slot 0, F slot 7); the old trunk's latch is the G, and it only opens once
// both other chords have been played (counter 28: the latch takes two), so Teddy plays Doc
// Leo's phrase to get into the trunk, where three of the instruments are packed, and on
// through it. Nine to find; the door at the end opens when all nine are found.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import type { Pal } from '../art/pal';
import { door, kit, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { CTR } from '../ids';
import { MapBuilder, at, type Level } from './maps';

export const CLASSIC_FINDS = ['piano', 'bass', 'strings', 'brass', 'lead', 'bell', 'organ', 'pad', 'pluck'];
const W = 32;
/** The toy piano's chord keys (level x, on the floor row): C, then F. */
export const CHORD_KEYS = [10, 12];
/** The trunk: its latch (the G) and the far end of its inside (level x). */
export const TRUNK = { latch: 15, end: 19 };
/** Where each instrument lies: [id, x, y]. */
export const CLASSIC_AT: [string, number, number][] = [
  ['piano', 3, 8],
  ['bass', 6, 7],
  ['strings', 16, 8],
  ['brass', 17, 8],
  ['lead', 18, 8],
  ['bell', 22, 8],
  ['organ', 24, 7],
  ['pad', 26, 8],
  ['pluck', 28, 6],
];
/** Boxes on the floor: [column, height in blocks]. */
const BOXES: [number, number][] = [
  [6, 1],
  [24, 1],
  [27, 1],
  [28, 2],
];

export function atticBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // the attic: bare boards on the walls, the rafters overhead, a dusty floor
  const wall = () => {
    const p = P(c('wood', 1));
    for (let x = 0; x < 20; x += 7) p.rect(x, 0, 1, 20, c('wood', 0));
    return p.set(13, 6, c('wood', 0)).set(4, 14, c('wood', 0));
  };
  book.add('wall', wall(), air);
  book.add('rafter', P(c('wood', 0)).rect(0, 0, 20, 4, c('wood', 2)).rect(0, 16, 20, 4, c('wood', 2)).line(0, 19, 19, 0, c('wood', 3)), { solid: SOLID });
  book.add('post', wall().rect(6, 0, 8, 20, c('wood', 3)).rect(6, 0, 2, 20, c('wood', 4)), { solid: SOLID });
  book.add('floor', P(c('wood', 2)).rect(0, 0, 20, 2, c('wood', 3)).rect(0, 2, 20, 1, c('dirt', 1)).rect(13, 2, 1, 18, c('wood', 1)), { solid: SOLID });
  book.add('box', P(c('hay', 1)).frame(0, 0, 20, 20, c('hay', 0)).rect(0, 8, 20, 3, c('hay', 2)).rect(8, 0, 4, 20, c('hay', 2)), { solid: SOLID });
  // the round window in the gable
  book.add('window', wall().disc(10, 10, 8, c('ink', 0)).disc(10, 10, 7, c('sky', 4)).rect(9, 3, 2, 14, c('ink', 0)).rect(3, 9, 14, 2, c('ink', 0)), air);
  // the toy piano's body (over the keys), its sheet music (C, F, G), and the chord keys
  book.add('toy', wall().rect(0, 8, 20, 12, c('red', 1)).rect(0, 8, 20, 2, c('red', 2)).rect(2, 12, 16, 2, c('cloud', 2)), air);
  const sheet = wall().rect(3, 2, 14, 13, c('cloud', 2)).rect(9, 15, 2, 5, c('metal', 1));
  for (let i = 0; i < 3; i++) {
    blob(sheet, 6 + i * 4, 11 - i * 2, 1.6, 1.2, [c('ink', 0), c('ink', 0), c('ink', 0)], 0, 2);
    sheet.rect(7 + i * 4, 5 - i * 2, 1, 6, c('ink', 0));
  }
  book.add('sheet', sheet, air);
  const key = (chord: string, played: boolean) => {
    const p = wall()
      .rect(2, 0, 16, 20, played ? c('cloud', 1) : c('cloud', 2))
      .rect(2, 19, 16, 1, c('ink', 0));
    p.rect(2, 0, 1, 20, c('ink', 0)).rect(17, 0, 1, 20, c('ink', 0));
    // the chord's letter, in dots
    const dots: Record<string, [number, number][]> = {
      C: [
        [12, 6],
        [10, 5],
        [8, 6],
        [7, 8],
        [7, 10],
        [8, 12],
        [10, 13],
        [12, 12],
      ],
      F: [
        [8, 5],
        [8, 7],
        [8, 9],
        [8, 11],
        [8, 13],
        [10, 5],
        [12, 5],
        [10, 9],
      ],
    };
    for (const [x, y] of dots[chord]) p.rect(x, y, 2, 2, played ? c('cloud', 2) : c('red', 1));
    return p;
  };
  // C: hit points and a chord (slot 0); F: a chord (slot 7)
  book.add('keyC', key('C', false), { ...air, hp: 1, effect: CTR.chords, eamt: 1, touch: 'keyC.played' });
  book.add('keyC.played', key('C', true), air);
  book.add('keyF', key('F', false), { ...air, effect: CTR.chords, eamt: 1, touch: 'keyF.played' });
  book.add('keyF.played', key('F', true), air);
  // the trunk: a brass-bound lid over its inside, and the latch at its end (the G: it takes both chords)
  const trunkSide = () => P(c('roof', 1)).rect(0, 0, 20, 3, c('gold', 1)).rect(0, 17, 20, 3, c('gold', 1)).rect(9, 0, 2, 20, c('gold', 0));
  book.add('lid', P(c('roof', 2)).rect(0, 14, 20, 6, c('gold', 1)).rect(0, 0, 20, 4, c('roof', 3)), { solid: SOLID });
  book.add('inside', P(c('roof', 0)).rect(0, 16, 20, 4, c('purple', 0)), air);
  book.add('latch', trunkSide().disc(10, 10, 3, c('gold', 2)).rect(9, 9, 2, 3, c('ink', 0)), {
    solid: SOLID,
    effect: CTR.chords,
    eamt: -2,
    touch: 'latch.open',
  });
  book.add('latch.open', P(c('roof', 0)).rect(0, 0, 4, 20, c('roof', 2)).rect(0, 16, 20, 4, c('purple', 0)), air);
  pickups(k, CLASSIC_FINDS, (id) => (['strings', 'brass', 'lead'].includes(id) ? 'inside' : 'wall'));
  door(k, wall(), CLASSIC_FINDS.length, (p: Pixels) => {
    // a treble clef over the door
    p.ring(10, 9, 3, c('ink', 0)).rect(11, 3, 1, 12, c('ink', 0)).set(10, 2, c('ink', 0));
  });
  return k;
}

export function attic(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '.': 'wall', R: 'rafter', _: 'floor', B: 'box', p: 'post' }, 'rafter');
  m.fill(0, 0, W, 1, 'R').fill(0, 1, W, 8, '.').fill(0, 9, W, 1, '_');
  // the rafters slope down at each end, and a post stands over the trunk (the way on is through it)
  m.fill(0, 1, 2, 1, 'R')
    .fill(0, 2, 1, 1, 'R')
    .fill(W - 2, 1, 2, 1, 'R')
    .fill(W - 1, 2, 1, 1, 'R');
  m.set(8, 2, 'window').set(23, 2, 'window');
  m.fill(TRUNK.latch + 2, 1, 1, 6, 'p');
  for (const [x, h] of BOXES) for (let y = 9 - h; y < 9; y++) m.set(x, y, 'B');
  // the toy piano: its body over the two chord keys, the sheet music beside it
  m.fill(CHORD_KEYS[0], 7, CHORD_KEYS[1] - CHORD_KEYS[0] + 1, 1, 'toy')
    .set(CHORD_KEYS[0], 8, 'keyC')
    .set(CHORD_KEYS[1], 8, 'keyF');
  m.set(CHORD_KEYS[1] + 1, 7, 'sheet');
  // the trunk: the latch, the lid over its inside
  m.set(TRUNK.latch, 8, 'latch')
    .fill(TRUNK.latch, 7, TRUNK.end - TRUNK.latch + 1, 1, 'lid')
    .fill(TRUNK.latch + 1, 8, TRUNK.end - TRUNK.latch, 1, 'inside');
  for (const [id, x, y] of CLASSIC_AT) m.set(x, y, `pick-${id}`);
  m.set(30, 8, 'door').set(30, 7, 'door.top').set(31, 8, 'door.open').fill(30, 3, 1, 4, 'p');
  m.link(31, 8);
  // row 5: the view (which never scrolls up or down) sits square on the level; Teddy drops to the floor
  return { m, start: at(1, 5), size: [W, 10] };
}
