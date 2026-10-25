// The keepsakes: what each friend gives Joe along with their thank-you, "maybe this is what you
// need". Each is a Pick-up block that sits at the same number in every background set (the
// inventory keeps only block numbers, and the drop menu and a sequence's tie read them in
// whatever set the scene has), from KEEPSAKE_BASE up. A keepsake can teach Joe a move: the move's
// sequence is tied to the block (Sequence.bloc), on only while he carries it.
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import { c } from '../art/pal';
import type { BlockSet } from './sets';

/** The first keepsake's block number; the ten Joe can carry follow it. */
export const KEEPSAKE_BASE = 140;

export const KEEPSAKE = {
  /** Doc Leo's thank-you from the clock tower: the town clock's spare winding key. SPRING HOP. */
  windKey: KEEPSAKE_BASE,
} as const;

/** The winding key, lying on whatever is under it: a brass bow, a shank and a square bit. */
export function windKeyPic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  const O = c('ink', 0);
  // shadow
  for (let x = 5; x < 17; x++) p.set(x, 15, c('ink', 1));
  // the bow: a brass ring with a heart-shaped hole (the clockmaker's mark)
  p.disc(7, 9, 4, c('brass', 3)).ring(7, 9, 4, O);
  p.set(6, 8, c('ink', 1)).set(8, 8, c('ink', 1)).rect(6, 9, 3, 1, c('ink', 1)).set(7, 10, c('ink', 1));
  p.set(5, 7, c('brass', 4)).set(6, 6, c('brass', 4));
  // shank and bit
  p.rect(11, 8, 6, 2, c('brass', 2)).rect(11, 8, 6, 1, c('brass', 4));
  p.rect(15, 10, 2, 3, c('brass', 2)).frame(15, 10, 2, 3, O);
  p.set(17, 8, O).set(17, 9, O);
  return p;
}

/** Adds the keepsakes at their fixed numbers (padding the set with unused blocks up to them); picked up, each leaves `groundName`. */
export function addKeepsakes(set: BlockSet, ground: Pixels, groundName: string): void {
  while (set.names.length < KEEPSAKE_BASE) set.add(`unused${set.names.length}`, new Pixels(20, 20, set.transparent ? CLEAR : 0));
  set.add('windKey', windKeyPic(ground), { obj: true, score: 25, touch: groundName });
  if (set.id('windKey') !== KEEPSAKE.windKey) throw new Error('The winding key is not at its number');
}
