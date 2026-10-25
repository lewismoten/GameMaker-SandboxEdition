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
  /** Teddy's thank-you from the park: his own valentine, BE MINE in his best paw-writing. */
  valentine: KEEPSAKE_BASE + 1,
  /** The Bard's thank-you from the parade: his spare drumstick, a red ribbon round it. */
  drumstick: KEEPSAKE_BASE + 2,
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

/** Teddy's valentine: a red paper heart with a lace edge and a paw print. */
export function valentinePic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  heart(p, 10, 10, 7, c('paper', 4));
  heart(p, 10, 10, 6, c('red', 2));
  p.rect(9, 9, 2, 2, c('paper', 4)).set(8, 8, c('paper', 4)).set(11, 8, c('paper', 4)).set(10, 8, c('paper', 4));
  return p;
}

/** The Bard's spare drumstick, a red ribbon tied round it. */
export function drumstickPic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  for (let x = 6; x < 18; x++) p.set(x, 15, c('ink', 1));
  p.line(4, 14, 15, 5, c('wood', 4)).line(5, 14, 16, 5, c('wood', 3));
  p.disc(16, 4, 2.2, c('paper', 4));
  p.rect(8, 9, 3, 2, c('red', 3)).set(7, 12, c('red', 2)).set(12, 12, c('red', 2));
  return p;
}

/** A filled heart of radius about `r` centered at (cx, cy). */
export function heart(p: Pixels, cx: number, cy: number, r: number, col: number): void {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const u = x / r;
      const v = -y / r + 0.25;
      if ((u * u + v * v - 0.6) ** 3 - u * u * v * v * v <= 0) p.set(cx + x, cy + y, col);
    }
}

/** Adds the keepsakes at their fixed numbers (padding the set with unused blocks up to them); picked up, each leaves the ground it lay on: `groundName` unless `on` gives it another. */
export function addKeepsakes(set: BlockSet, ground: Pixels, groundName: string, on: Partial<Record<keyof typeof KEEPSAKE, string>> = {}): void {
  while (set.names.length < KEEPSAKE_BASE) set.add(`unused${set.names.length}`, new Pixels(20, 20, set.transparent ? CLEAR : 0));
  const put = (name: keyof typeof KEEPSAKE, pic: (g: Pixels) => Pixels) => {
    const under = on[name] ?? groundName;
    set.add(name, pic(on[name] ? set.pic(under) : ground), { obj: true, score: 25, touch: under });
  };
  put('windKey', windKeyPic);
  put('valentine', valentinePic);
  put('drumstick', drumstickPic);
  for (const [name, n] of Object.entries(KEEPSAKE)) if (set.id(name) !== n) throw new Error(`The ${name} is not at its number`);
}
