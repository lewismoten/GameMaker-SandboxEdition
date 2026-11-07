// The Starter friends in the hall, clapping and smiling in their own graduation robes: Kit and the eight helpers
// (heroLook.ts), each two blocks tall (a head block over a body block, like the hero). The robe is the person's own
// hoodie color and the mortarboard and stole their own beanie color, so each stays recognizable; skin and hair are
// theirs too. They are drawn once with Kit's ramps and recolored per person (graduationCast.ts recolorFor).
// A person is one still head block and a two-frame loop of body blocks (hands apart, together; the block set has no room for more);
// each loop has its own times, so nobody claps in step with the next.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from './book';
import { head, outlinedPair } from './hero';
import { kitRamp } from './heroLook';
import type { Pal } from './palette';
import { recolorFor } from './graduationCast';
import type { Timed } from './graduationHall';

const T = 255;

/** Everyone who is in the hall, in the order they stand: Kit first, then the eight helpers (web/src/project/starterHeroes.ts). */
export const FRIENDS = ['KIT', 'MIA', 'LENA', 'MARA', 'LIAN', 'YANA', 'NOVA', 'RIMA', 'LAMI'];

type Hands = 'apart' | 'together' | 'wide';

/** A friend's head, front on, smiling, with a mortarboard in place of the beanie (Kit's ramps). */
export function gradHead(pal: Pal): Pixels {
  const { c } = pal;
  const hat = kitRamp(pal, 'hat');
  const hair = kitRamp(pal, 'hair');
  const skin = kitRamp(pal, 'skin');
  const face = head(pal, 'smile', true);
  const p = new Pixels(20, 20, T);
  // the beanie goes: a dome of hair, then the face from the original below the cap line
  p.disc(10, 11, 7.6, hair[2]);
  p.blit(face.crop(0, 11, 20, 9), 0, 11, T);
  p.rect(5, 10, 10, 2, skin[2]).rect(5, 10, 10, 1, hair[1]);
  for (const x of [5, 8, 11, 14]) p.rect(x, 10, 2, 1, hair[2]).set(x, 11, hair[1]);
  // the mortarboard: a flat diamond board over a snug band, a button, and a gold tassel hanging at the right
  p.rect(5, 6, 10, 4, hat[1]).rect(5, 6, 10, 1, hat[2]);
  const rows: [number, number, number][] = [
    [1, 6, 13],
    [2, 3, 16],
    [3, 0, 19],
    [4, 3, 16],
    [5, 6, 13],
  ];
  for (const [y, x0, x1] of rows) {
    p.rect(x0, y, x1 - x0 + 1, 1, y < 3 ? hat[3] : hat[2]);
    p.rect(x0, y, 1, 1, hat[4]);
  }
  p.rect(6, 5, 8, 1, hat[0]);
  p.rect(9, 2, 2, 2, hat[4]);
  p.line(10, 3, 17, 4, c('gold', 3)).line(17, 4, 17, 8, c('gold', 3));
  p.rect(16, 8, 3, 3, c('gold', 4)).rect(16, 10, 3, 1, c('gold', 2));
  return p;
}

/** The thick arm of a sleeve from a shoulder to a hand. */
function arm(p: Pixels, x0: number, y0: number, x1: number, y1: number, sleeve: number, hand: number): void {
  const n = 12;
  for (let i = 0; i <= n; i++) p.disc(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 2.1, sleeve);
  p.disc(x1, y1, 1.8, hand);
}

/** A friend's body in a gown, 20x20, hands as given (Kit's ramps). */
export function gownBody(pal: Pal, hands: Hands): Pixels {
  const { c } = pal;
  const robe = kitRamp(pal, 'hood');
  const stole = kitRamp(pal, 'hat');
  const skin = kitRamp(pal, 'skin');
  const p = new Pixels(20, 20, T);
  // shoes under the hem, then the gown: an A-line with a dark front seam and the stole down both sides
  for (const x of [5, 11]) p.rect(x, 17, 4, 3, c('white', 3)).rect(x, 19, 4, 1, c('white', 1));
  for (let y = 0; y < 17; y++) {
    const half = 5 + Math.floor(y / 3);
    p.rect(10 - half, y, half * 2, 1, robe[2]);
    p.set(10 - half, y, robe[1]).set(9 + half, y, robe[1]);
    p.rect(11 - half, y, 1, 1, robe[3]);
  }
  p.rect(2, 15, 16, 2, robe[1]).rect(2, 15, 16, 1, robe[3]);
  p.rect(10, 4, 1, 11, robe[1]);
  p.rect(6, 0, 2, 14, stole[3]).rect(12, 0, 2, 14, stole[3]).rect(6, 0, 1, 14, stole[4]).rect(12, 0, 1, 14, stole[4]);
  p.rect(8, 0, 4, 2, skin[2]);
  // the arms, in front of the gown
  const hand = skin[2];
  if (hands === 'apart') {
    arm(p, 5, 3, 3, 9, robe[3], hand);
    arm(p, 14, 3, 16, 9, robe[3], hand);
  } else if (hands === 'together') {
    arm(p, 5, 3, 9, 8, robe[3], hand);
    arm(p, 14, 3, 11, 8, robe[3], hand);
    for (const [x, y] of [
      [8, 5],
      [12, 5],
      [10, 4],
    ])
      p.set(x, y, c('white', 3));
  } else {
    arm(p, 5, 3, 2, 6, robe[3], hand);
    arm(p, 14, 3, 17, 6, robe[3], hand);
  }
  return p;
}

/** Adds the friends to `book` (head `friend.<name>.top`, bodies `friend.<name>.0..1`) with their clapping loops in `timed`; returns each one's two block names to stand in a map, top then bottom. */
export function addFriendBlocks(book: Book, pal: Pal, timed: Timed[], names: readonly string[] = FRIENDS): [string, string][] {
  const air = { grav: PULL.down };
  const wall = pal.c('sky', 3);
  const hands: Hands[] = ['apart', 'together'];
  const top = gradHead(pal);
  return names.map((n, i) => {
    const base = `friend.${n.toLowerCase()}`;
    const pairs = hands.map((h) => outlinedPair(pal, top, gownBody(pal, h)));
    const back = (px: Pixels) => recolorFor(pal, px, n).map((_x, _y, c) => (c === T ? wall : c));
    book.add(`${base}.top`, back(pairs[0][0]), air);
    pairs.forEach((pair, f) => book.add(`${base}.${f}`, back(pair[1]), air));
    // each person claps a little differently: how long the hands rest apart, how long together, how long wide
    const rest = 5 + ((i * 5) % 8);
    const close = 2 + (i % 3);
    timed.push({ name: `${base}.0`, next: `${base}.1`, ticks: rest }, { name: `${base}.1`, next: `${base}.0`, ticks: close });
    return [`${base}.top`, `${base}.0`];
  });
}
