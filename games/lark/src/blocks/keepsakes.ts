// The keepsakes: what each friend gives Joe along with their thank-you, "maybe this is what you
// need". Each is a Pick-up block that sits at the same number in every background set (the
// inventory keeps only block numbers, and the drop menu and a sequence's tie read them in
// whatever set the scene has), from KEEPSAKE_BASE up. A keepsake can teach Joe a move: the move's
// sequence is tied to the block (Sequence.bloc), on only while he carries it.
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import { c } from '../art/pal';
import type { BlockSet } from './sets';
import { SHOVEL } from '../ids';

/** The first keepsake's block number; the ten Joe can carry follow it. */
export const KEEPSAKE_BASE = 140;

export const KEEPSAKE = {
  /** Doc Leo's thank-you from the clock tower: the town clock's spare winding key. SPRING HOP. */
  windKey: KEEPSAKE_BASE,
  /** Teddy's thank-you from the park: his own valentine, BE MINE in his best paw-writing. */
  valentine: KEEPSAKE_BASE + 1,
  /** The Bard's thank-you from the parade: his spare drumstick, a red ribbon round it. */
  drumstick: KEEPSAKE_BASE + 2,
  /** The goat's thank-you from the toy shop: the music box's little dancer, who came loose. */
  dancer: KEEPSAKE_BASE + 3,
  /** Doc Leo's thank-you from the car lot: THE CHEZ's spare fuse, in a little glass tube. */
  fuse: KEEPSAKE_BASE + 4,
  /** Carl's thank-you from the lighthouse: a spare lens from the lamp, a little round prism. */
  lens: KEEPSAKE_BASE + 5,
  /** Lewie's spare snow shovel, lent on a snow day and never asked back. SCOOP. */
  shovel: KEEPSAKE_BASE + 6,
  /** Will's umbrella, for a poet caught out in the weather of the world. */
  umbrella: KEEPSAKE_BASE + 7,
  /** Loaf #13's heart-shaped stone, painted with a little sun. */
  heartStone: KEEPSAKE_BASE + 8,
  /** The heart balloon Reggie floated off on. BALLOON. */
  balloon: KEEPSAKE_BASE + 9,
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

/** The music box's little dancer, on one toe, a pink skirt. */
export function dancerPic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  for (let x = 6; x < 15; x++) p.set(x, 18, c('ink', 1));
  p.disc(10, 4, 2, c('skin', 3));
  p.rect(9, 6, 3, 5, c('pink', 2)).rect(5, 10, 11, 2, c('pink', 3));
  p.line(9, 7, 6, 3, c('skin', 2)).line(11, 7, 14, 3, c('skin', 2));
  p.rect(10, 12, 1, 6, c('skin', 2));
  return p;
}

/** A fuse in a little glass tube with brass ends. */
export function fusePic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  for (let x = 4; x < 17; x++) p.set(x, 13, c('ink', 1));
  p.rect(6, 8, 9, 4, c('blue', 4)).frame(6, 8, 9, 4, c('stone', 3));
  p.line(7, 10, 13, 10, c('stone', 4));
  p.rect(3, 8, 3, 4, c('brass', 3)).rect(15, 8, 3, 4, c('brass', 3));
  return p;
}

/** A lens from the lighthouse lamp: a ring of glass prisms catching the light. */
export function lensPic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(10, 10, 7, c('brass', 2)).disc(10, 10, 6, c('blue', 4));
  p.ring(10, 10, 4, c('paper', 4)).ring(10, 10, 2, c('paper', 3));
  p.disc(8, 8, 1.5, c('window', 2));
  return p;
}

/** Lewie's spare snow shovel: a red blade, a wooden handle with a D grip. */
export function shovelPic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  const O = c('ink', 0);
  for (let x = 4; x < 18; x++) p.set(x, 17, c('ink', 1));
  p.line(5, 4, 12, 11, c('wood', 4)).line(6, 4, 13, 11, c('wood', 3));
  p.ring(4, 3, 2, c('ink', 1));
  p.rect(11, 10, 7, 6, c('red', 2)).frame(11, 10, 7, 6, O).rect(12, 11, 5, 1, c('red', 4));
  return p;
}

/** Will's umbrella, furled, a curved handle, a strap round it. */
export function umbrellaPic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  const O = c('ink', 0);
  for (let x = 4; x < 17; x++) p.set(x, 17, c('ink', 1));
  for (let k = 0; k < 9; k++) p.rect(7 + Math.floor(k / 3), 3 + k, 4 - Math.floor(k / 3), 1, c('purple', 2));
  p.line(10, 3, 10, 11, c('purple', 3));
  p.rect(9, 7, 3, 1, c('brass', 3));
  p.rect(10, 12, 1, 4, c('stone', 3));
  p.set(9, 16, O).set(8, 15, O).set(8, 14, c('wood', 2));
  p.set(10, 2, c('stone', 4));
  return p;
}

/** Loaf #13's stone: smooth, heart-shaped, a little painted sun on it. */
export function stonePic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  for (let x = 4; x < 17; x++) p.set(x, 17, c('ink', 1));
  heart(p, 10, 10, 7, c('stone', 1));
  heart(p, 10, 10, 6, c('stone', 3));
  p.disc(10, 9, 2, c('yellow', 3));
  for (const [dx, dy] of [
    [0, -4],
    [0, 4],
    [-4, 0],
    [4, 0],
  ])
    p.set(10 + dx, 9 + dy, c('yellow', 2));
  p.set(7, 6, c('stone', 5));
  return p;
}

/** A red heart balloon on a long curly string. */
export function balloonPic(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  heart(p, 10, 6, 6, c('red', 1));
  heart(p, 10, 6, 5, c('red', 3));
  p.set(7, 3, c('paper', 4)).set(8, 3, c('paper', 4)).set(7, 4, c('paper', 4));
  p.set(10, 12, c('red', 1));
  for (let y = 13; y < 19; y++) p.set(10 + (y % 2 ? 1 : 0), y, c('ink', 1));
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
    // the shovel, picked up, loads its counter: so many drifts shoveled
    const load = name === 'shovel' ? { effect: SHOVEL.counter, eamt: SHOVEL.load } : {};
    set.add(name, pic(on[name] ? set.pic(under) : ground), { obj: true, score: 25, touch: under, ...load });
  };
  put('windKey', windKeyPic);
  put('valentine', valentinePic);
  put('drumstick', drumstickPic);
  put('dancer', dancerPic);
  put('fuse', fusePic);
  put('lens', lensPic);
  put('shovel', shovelPic);
  put('umbrella', umbrellaPic);
  put('heartStone', stonePic);
  put('balloon', balloonPic);
  for (const [name, n] of Object.entries(KEEPSAKE)) if (set.id(name) !== n) throw new Error(`The ${name} is not at its number`);
}
