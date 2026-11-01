// Level 4, The Choir Loft (the Voices family). A quiet climb: back over a pew for the first
// voice, then up two steps whose hymn notes each sing a pitch, and up the bell rope (nothing pulls Teddy down on a
// rope, so Up climbs) to the loft. The song is the choir coming in one voice a bar until all
// nine sing (sound/laterSongs.ts choirSong), and touching the loft rail blooms an "aah" chord
// (sound slot 5, a .VOC of the choir preset). Four voices to find; the loft door opens when
// all four are found.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../art/pal';
import { door, kit, notes, pickups, SOLID, GRAV, type Kit } from '../blocks/common';
import { MapBuilder, at, type Level } from './maps';

export const VOICE_FINDS = ['aah', 'ooh', 'soprano', 'choir'];
const W = 16;
/** The bell rope's column (level x) and its top row (the loft's row). */
export const ROPE_X = 14;
export const LOFT_ROW = 3;
/** Where the loft rail blooms (level x, on the loft row). */
export const RAIL_X = 9;
/** Where each voice lies: [id, x, y]. */
export const VOICES_AT: [string, number, number][] = [
  ['aah', 2, 8],
  ['ooh', 11, 8],
  ['soprano', 15, 6],
  ['choir', 5, LOFT_ROW],
];

export function choirBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, P } = k;
  const air = { grav: GRAV.down };
  // plaster walls, a stone floor, and the beams of the roof
  const wall = () => P(c('peach', 2)).rect(0, 18, 20, 2, c('peach', 1)).rect(0, 0, 1, 20, c('peach', 3));
  book.add('wall', wall(), air);
  book.add('beam', P(c('wood', 0)).rect(0, 14, 20, 6, c('wood', 1)).rect(0, 14, 20, 1, c('wood', 2)), { solid: SOLID });
  book.add('floor', P(c('stone', 2)).rect(0, 0, 20, 2, c('stone', 3)).rect(9, 2, 1, 18, c('stone', 1)), { solid: SOLID });
  // a stained-glass window, two blocks tall: lead lines over colored panes
  const glass = (top: boolean) => {
    const p = wall();
    p.rect(4, top ? 4 : 0, 12, top ? 16 : 14, c('ink', 0));
    const panes = [c('blue', 2), c('red', 2), c('yellow', 2), c('green', 2), c('purple', 2), c('blue', 3)];
    for (let y = top ? 5 : 0; y < (top ? 20 : 13); y += 4) for (let x = 5; x < 15; x += 5) p.rect(x, y, 4, 3, panes[(x + y + (top ? 0 : 3)) % panes.length]);
    if (top) p.rect(4, 4, 12, 1, c('ink', 1)).set(9, 3, c('ink', 0)).set(10, 3, c('ink', 0));
    return p;
  };
  book.add('glass.top', glass(true), air);
  book.add('glass', glass(false), air);
  // a pew: a dark wooden bench (solid: a hop over it)
  book.add(
    'pew',
    P(c('wood', 1)).rect(0, 0, 20, 4, c('wood', 2)).rect(0, 4, 20, 2, c('wood', 0)).rect(2, 6, 3, 14, c('wood', 0)).rect(15, 6, 3, 14, c('wood', 0)),
    {
      solid: SOLID,
    },
  );
  // the steps up to the landing: stone, with a hymn board on the riser
  book.add(
    'step',
    P(c('stone', 3)).rect(0, 0, 20, 2, c('stone', 4)).rect(4, 6, 12, 8, c('wood', 1)).rect(6, 8, 8, 1, c('cloud', 2)).rect(6, 11, 6, 1, c('cloud', 2)),
    {
      solid: SOLID,
    },
  );
  // the loft: its floor (stand on it), and the balustrade under it
  book.add('loft', P(c('wood', 2)).rect(0, 0, 20, 3, c('wood', 3)).rect(0, 3, 20, 1, c('wood', 0)), { solid: SOLID });
  // the bell rope: no pull, so Teddy climbs it; a woolly grip at the bottom
  const rope = (grip: boolean) => {
    const p = wall().rect(9, 0, 3, 20, c('hay', 1)).rect(10, 0, 1, 20, c('hay', 3));
    for (let y = 1; y < 20; y += 4) p.set(9, y, c('hay', 0)).set(11, y + 2, c('hay', 0));
    if (grip) p.rect(7, 8, 7, 8, c('red', 1)).rect(8, 9, 5, 6, c('red', 2));
    return p;
  };
  book.add('rope', rope(false), { grav: GRAV.none });
  book.add('rope.grip', rope(true), { grav: GRAV.none });
  // the loft rail: a carved balustrade; touched, the whole choir sings "aah" (score up, slot 5)
  const rail = (sung: boolean) => {
    const p = wall().rect(0, 6, 20, 2, c('wood', 3));
    for (let x = 2; x < 20; x += 5) p.rect(x, 8, 2, 12, c('wood', 2));
    if (!sung) p.disc(10, 3, 2.2, c('glow', 3)).ring(10, 3, 3, c('yellow', 2));
    return p;
  };
  book.add('rail', rail(false), { ...air, score: 100, touch: 'rail.sung' });
  book.add('rail.sung', rail(true), air);
  notes(k, wall(), [c('red', 2), c('orange', 2), c('yellow', 2), c('green', 2), c('blue', 2), c('purple', 2)]);
  pickups(k, VOICE_FINDS, 'wall');
  door(k, wall(), VOICE_FINDS.length, (p: Pixels) => {
    // a hymn book open over the door
    p.rect(5, 4, 10, 7, c('cloud', 2)).rect(9, 4, 2, 7, c('red', 1)).rect(6, 6, 2, 1, c('ink', 1)).rect(12, 6, 2, 1, c('ink', 1));
  });
  return k;
}

export function choir(book: Kit['book']): Level {
  const m = new MapBuilder(book, { '.': 'wall', B: 'beam', _: 'floor', P: 'pew', S: 'step', L: 'loft' }, 'beam');
  m.fill(0, 0, W, 1, 'B').fill(0, 1, W, 8, '.').fill(0, 9, W, 1, '_');
  // the windows over the loft, and one high over the landing
  for (const x of [4, 8, 12]) m.set(x, 1, 'glass.top').set(x, 2, 'glass');
  // a pew, the two steps and the landing (the soprano waits on it)
  m.set(4, 8, 'P');
  m.set(12, 8, 'S').fill(13, 7, 1, 2, 'S').fill(14, 7, 2, 2, 'S');
  // the loft across the top, from the door to the rope, and its rail
  m.fill(1, LOFT_ROW + 1, ROPE_X - 1, 1, 'L');
  m.set(RAIL_X, LOFT_ROW, 'rail');
  for (let y = LOFT_ROW; y <= 5; y++) m.set(ROPE_X, y, 'rope');
  m.set(ROPE_X, 6, 'rope.grip');
  // the hymn notes: up the steps (C, D), then along the loft (F, G, A)
  m.set(12, 7, 'note0').set(13, 6, 'note1').set(12, LOFT_ROW, 'note3').set(11, LOFT_ROW, 'note4').set(7, LOFT_ROW, 'note5');
  for (const [id, x, y] of VOICES_AT) m.set(x, y, `pick-${id}`);
  // the way on: the loft door at the far end
  m.set(2, LOFT_ROW, 'door')
    .set(2, LOFT_ROW - 1, 'door.top')
    .set(1, LOFT_ROW, 'door.open');
  m.link(1, LOFT_ROW);
  // a one-screen level starts mid-screen (8, 5), so the view sits square on it; Teddy drops to the floor
  return { m, start: at(8, 5), size: [W, 10] };
}
