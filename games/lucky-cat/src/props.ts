// LUCKY CAT's props: the town's superstitions drawn as 20x20 blocks. Each returns a picture on the sky color,
// outlined in ink; props.ts's `addProps` puts them in a level's block set under the names the levels use.
//   stepladder   stepTopL, stepTop, stepTopR (the top beam), stepL, stepR (the legs); a paint drip hangs under it
//   crack        a raised paving slab with a crack across it (bad luck, once)
//   crate        a flower crate to hop over
//   mirror       a silver mirror wall, a mirror key and the gate it opens (no broken glass anywhere)
//   brolly       an open umbrella that floats up (an updraft: PULL.up), in three colors
//   salt         a salt shaker (the key) and a spilled pile of salt (the gate), with its arch
//   woodBox      a wooden knock-on-wood box that opens when touched
//   town         window, awning, lamp, fence, tent, clock face, rascal's workshop
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob, bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, SOLID, LEDGE, type Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { SILVER_KEYS } from '../../kit/starter/locks';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { CHARMS, charmPicture } from './charms';

/** Hit points a bad-luck hazard takes, once. */
export const BAD_LUCK = -5;
/** Points a charm is worth: lucky 13. */
export const CHARM_POINTS = 13;
/** The counter the charms add to (counters 20 to 29 are free; 20 is the salt shaker's, 21 the mirror key's). */
export const CHARM_COUNTER = 22;

const air = { grav: PULL.down };
const clear = (pal: Pal) => new Pixels(20, 20, skyOf(pal));
const inked = (pal: Pal, p: Pixels) => outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });

/** The side of the stepladder: a slanted rail with rungs, `left` leaning one way. */
function stepLeg(pal: Pal, left: boolean): Pixels {
  const { c } = pal;
  const p = clear(pal);
  const wood = pal.r('orange');
  for (let y = 0; y < 20; y++) {
    const x = left ? 2 + Math.floor(y / 5) : 14 - Math.floor(y / 5);
    p.rect(x, y, 4, 1, wood[3])
      .set(left ? x : x + 3, y, wood[4])
      .set(left ? x + 3 : x, y, wood[1]);
  }
  for (const y of [4, 12]) p.rect(left ? 2 + Math.floor(y / 5) : 0, y, left ? 18 : 18 - Math.floor(y / 5) * 1, 2, c('wood', 3));
  return inked(pal, p);
}

/** The ladder's top: the hinge beam with a paint can. */
function stepTop(pal: Pal, part: 'L' | 'M' | 'R'): Pixels {
  const { c, r } = pal;
  const p = clear(pal);
  const o = r('orange');
  p.rect(part === 'L' ? 2 : 0, 8, part === 'R' ? 16 : 20, 8, o[3])
    .rect(0, 8, 20, 2, o[4])
    .rect(0, 15, 20, 1, o[1]);
  p.rect(0, 12, 20, 1, c('orange', 2));
  if (part === 'M') {
    // a can of blue paint on the beam
    p.rect(5, 1, 10, 7, c('stone', 3)).rect(5, 1, 10, 2, c('stone', 4)).rect(6, 3, 8, 5, c('blue', 2)).rect(6, 3, 8, 1, c('blue', 4));
    p.rect(3, 6, 3, 1, c('blue', 2));
  }
  return inked(pal, p);
}

/** A drop of blue paint hanging under the beam. */
function drip(pal: Pal, gone: boolean): Pixels {
  const { c, r } = pal;
  const p = clear(pal);
  const b = r('blue');
  p.rect(0, 0, 20, 2, c('orange', 1));
  if (!gone) {
    p.rect(9, 2, 3, 6, b[2]);
    blob(p, 10, 12, 4, 5, b, 1, 4);
    p.set(8, 11, c('white', 3)).set(8, 12, c('white', 2));
  } else {
    p.rect(3, 17, 14, 2, b[2]).rect(5, 15, 10, 2, b[2]).rect(5, 15, 4, 1, b[4]);
  }
  return inked(pal, p);
}

/** A paving slab with a crack across it and one half heaved up a little, or the same slab mended (a bit of dust). */
function crack(pal: Pal, dust: boolean): Pixels {
  const { c, r } = pal;
  const p = clear(pal);
  const s = r('stone');
  if (dust) {
    p.rect(0, 15, 20, 5, s[2]).rect(0, 15, 20, 1, s[4]).rect(0, 19, 20, 1, s[1]);
    p.rect(3, 13, 4, 2, s[3]).rect(12, 14, 5, 1, s[3]);
    return inked(pal, p);
  }
  p.rect(0, 15, 10, 5, s[2]).rect(0, 15, 10, 1, s[4]);
  p.rect(10, 10, 10, 10, s[3]).rect(10, 10, 10, 2, s[4]).rect(10, 10, 1, 10, s[2]);
  const pts: [number, number][] = [
    [10, 10],
    [8, 13],
    [11, 15],
    [8, 17],
    [10, 19],
  ];
  for (let i = 1; i < pts.length; i++) p.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c('ink', 0));
  p.line(13, 13, 15, 15, c('ink', 1)).line(15, 15, 14, 18, c('ink', 1));
  p.rect(2, 13, 2, 2, s[3]).rect(5, 14, 2, 1, s[4]);
  return inked(pal, p);
}

/** A flower crate (solid): planks with a red bloom. */
function crate(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, r('wood')[2]);
  p.rect(0, 0, 20, 4, r('wood')[1]).rect(0, 8, 20, 1, r('wood')[1]).rect(0, 14, 20, 1, r('wood')[1]);
  p.frame(0, 0, 20, 20, c('wood', 0));
  for (const x of [4, 10, 15]) p.line(x, 4, x + 1, 2, c('green', 3));
  p.disc(4, 1, 2, c('red', 2)).disc(10, 1, 2, c('pink', 2)).disc(15, 2, 1.6, c('gold', 3));
  return p;
}

/** A mirror wall: a silver frame around a bright blue-white glass with a shine across it. */
function mirrorWall(pal: Pal, variant: number): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, r('stone')[3]);
  p.frame(0, 0, 20, 20, c('ink', 1)).frame(1, 1, 18, 18, c('stone', 4));
  const glass = [c('sky', 5), c('white', 3)];
  p.rect(3, 3, 14, 14, glass[0]);
  const rand = rng(40 + variant);
  for (let i = 0; i < 5; i++) {
    const x = 3 + Math.floor(rand() * 10);
    p.line(x, 16, x + 4, 4, c('white', 3));
  }
  p.line(4, 14, 8, 4, c('white', 3)).line(6, 16, 12, 4, c('sky', 4));
  p.frame(3, 3, 14, 14, c('stone', 2));
  return p;
}

/** A hand mirror to carry: the mirror's key. */
function mirrorKey(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = clear(pal);
  p.disc(10, 7, 6, c('stone', 4)).disc(10, 7, 4.6, c('sky', 5));
  p.line(7, 8, 10, 4, c('white', 3));
  p.rect(9, 12, 3, 7, r('gold')[3]).rect(9, 12, 1, 7, c('gold', 4));
  return inked(pal, p);
}

/** The mirror gate: a tall silver door with a shining pane (solid; spends the mirror key). */
function mirrorGate(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, r('stone')[2]);
  p.frame(0, 0, 20, 20, c('ink', 1)).rect(3, 0, 14, 20, c('sky', 5)).frame(3, 0, 14, 20, c('stone', 4));
  p.line(5, 15, 10, 2, c('white', 3)).line(8, 18, 14, 3, c('white', 3));
  p.disc(14, 11, 1.6, c('gold', 3));
  return p;
}

/** The arch above a gate (a doorway frame, `trim` colored). */
function archOf(pal: Pal, ramp: string): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, r('brick')[2]);
  p.rect(0, 12, 20, 8, skyOf(pal));
  for (let y = 12; y < 20; y++) for (let x = 0; x < 20; x++) if (Math.hypot(x + 0.5 - 10, (y + 0.5 - 20) * 1.1) <= 9.6) p.set(x, y, c(ramp, 2));
  p.frame(0, 0, 20, 12, c('brick', 0));
  return p;
}

/** An open umbrella floating up: a scalloped canopy, a curved handle. */
function brolly(pal: Pal, ramp: string): Pixels {
  const { c, r } = pal;
  const p = clear(pal);
  const k = r(ramp);
  blob(p, 10, 8, 9, 6.5, k, 0, 4);
  p.rect(0, 9, 20, 7, skyOf(pal));
  for (let x = 0; x < 20; x += 5) p.disc(x + 2.5, 14, 2.6, k[3]);
  p.rect(0, 13, 20, 1, skyOf(pal));
  p.rect(10, 10, 1, 7, c('ink', 1)).line(10, 17, 8, 19, c('ink', 1));
  for (const x of [5, 10, 15]) p.line(x, 3, x, 12, k[1]);
  p.rect(9, 0, 3, 2, k[1]);
  return inked(pal, p);
}

/** The salt shaker: glass with a silver cap (the key). */
function shaker(pal: Pal): Pixels {
  const { c } = pal;
  const p = clear(pal);
  p.rect(5, 7, 10, 12, c('white', 2)).rect(5, 7, 3, 12, c('white', 3)).rect(12, 9, 3, 10, c('white', 1));
  blob(p, 10, 5, 5, 4, pal.r('stone'), 2, 4);
  for (const [x, y] of [
    [8, 3],
    [10, 2],
    [12, 3],
    [10, 5],
  ])
    p.set(x, y, c('ink', 0));
  p.rect(5, 12, 10, 3, c('blue', 2));
  return inked(pal, p);
}

/** A spill of salt: a white heap in a wooden bin with grains flying (solid; spends the shaker). */
function saltPile(pal: Pal): Pixels {
  const { c } = pal;
  const w = pal.r('white');
  const p = new Pixels(20, 20, pal.r('wood')[2]);
  p.rect(0, 0, 20, 20, c('wood', 2)).frame(0, 0, 20, 20, c('wood', 0));
  p.rect(1, 1, 18, 18, c('wood', 3));
  blob(p, 10, 14, 8.4, 6.4, w, 0, 3);
  p.rect(1, 17, 18, 2, w[2]);
  const rand = rng(77);
  for (let i = 0; i < 16; i++) p.set(2 + Math.floor(rand() * 16), 3 + Math.floor(rand() * 10), w[3]);
  return p;
}

/** A wooden knock-on-wood box: a knocker and a keyhole-shaped knot. */
function woodBox(pal: Pal): Pixels {
  const { c, r } = pal;
  const w = r('wood');
  const p = new Pixels(20, 20, w[3]);
  for (let y = 4; y < 20; y += 5) p.rect(0, y, 20, 1, w[1]);
  p.rect(0, 0, 20, 2, w[4]).frame(0, 0, 20, 20, w[0]);
  p.disc(10, 10, 3.4, w[2]).ring(10, 10, 3.4, w[1]);
  p.rect(8, 8, 5, 2, c('gold', 3)).rect(9, 10, 3, 3, c('gold', 2));
  p.rect(2, 2, 3, 3, c('stone', 3)).rect(15, 2, 3, 3, c('stone', 3));
  return p;
}

/** A window set in a wall (brick with a lit pane); the pane's `curtain` color. */
function windowBlock(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, r('brick')[2]);
  p.frame(0, 0, 20, 20, c('brick', 0));
  p.rect(4, 3, 12, 14, c('wood', 4)).rect(5, 4, 10, 12, c('sky', 4));
  p.rect(9, 4, 2, 12, c('wood', 4)).rect(5, 9, 10, 2, c('wood', 4));
  p.line(6, 14, 8, 6, c('white', 3));
  p.rect(3, 17, 14, 2, c('brick', 4));
  return p;
}

/** A striped awning (the top is solid to stand on). */
function awning(pal: Pal, alt: boolean): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 9, Math.floor((x + (alt ? 5 : 0)) / 5) % 2 ? c('white', 3) : c('red', 2));
  for (let x = 0; x < 20; x += 5) p.disc(x + 2.5, 9, 2.6, Math.floor((x + (alt ? 5 : 0)) / 5) % 2 ? c('white', 3) : c('red', 2));
  p.rect(0, 0, 20, 1, c('red', 4));
  return inked(pal, p);
}

/** A street lamp post (two blocks: head, post). */
function lamp(pal: Pal, head: boolean): Pixels {
  const { c } = pal;
  const p = clear(pal);
  if (head) {
    p.rect(7, 12, 6, 8, c('gold', 4)).rect(8, 13, 4, 6, c('gold', 5)).rect(5, 10, 10, 3, c('ink', 1)).rect(9, 0, 2, 10, c('ink', 1));
  } else p.rect(9, 0, 3, 20, c('ink', 1)).rect(6, 17, 9, 3, c('ink', 1));
  return inked(pal, p);
}

/** A picket fence post run. */
function fence(pal: Pal): Pixels {
  const { c } = pal;
  const p = clear(pal);
  p.rect(0, 11, 20, 2, c('white', 2)).rect(0, 16, 20, 2, c('white', 2));
  for (const x of [1, 8, 15])
    p.rect(x, 7, 4, 13, c('white', 3))
      .rect(x + 1, 6, 2, 1, c('white', 3))
      .rect(x, 7, 1, 13, c('white', 4));
  return inked(pal, p);
}

/** A tent peak (fair): two blocks, striped; `side` 0 left, 1 right. */
function tent(pal: Pal, side: 0 | 1): Pixels {
  const { c } = pal;
  const p = clear(pal);
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      const edge = side === 0 ? 20 - y : y;
      const lim = side === 0 ? x >= 20 - y - 0 : x <= y;
      void edge;
      if (lim) p.set(x, y, Math.floor((x + (side ? 3 : 0)) / 4) % 2 ? c('white', 3) : c('red', 2));
    }
  }
  p.rect(side === 0 ? 17 : 0, 0, 3, 3, c('gold', 3));
  return inked(pal, p);
}

/** Bunting: a string of little flags across the block. */
function bunting(pal: Pal): Pixels {
  const { c } = pal;
  const p = clear(pal);
  p.line(0, 2, 19, 2, c('ink', 1));
  const cols = [c('red', 2), c('gold', 3), c('blue', 2), c('green', 2)];
  [1, 6, 11, 16].forEach((x, i) => {
    for (let y = 0; y < 7; y++) p.rect(x + Math.floor(y / 3), 3 + y, 4 - Math.floor(y / 3) * 2, 1, cols[i]);
  });
  return p;
}

/** The town clock's face, in four blocks (2x2): the hands at one minute to the 13th chime. */
function clockFace(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = new Pixels(40, 40, r('brick')[2]);
  p.frame(0, 0, 40, 40, c('brick', 0)).frame(1, 1, 38, 38, c('stone', 3));
  p.disc(20, 20, 16, c('stone', 4)).disc(20, 20, 14.5, c('white', 3)).ring(20, 20, 15, c('gold', 2));
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    p.rect(Math.round(20 + Math.sin(a) * 12), Math.round(20 - Math.cos(a) * 12), 2, 2, c('ink', 0));
  }
  p.line(20, 20, 20, 9, c('ink', 0)).line(21, 20, 21, 9, c('ink', 0));
  p.line(20, 20, 27, 16, c('red', 1)).line(20, 21, 27, 17, c('red', 1));
  p.disc(20, 20, 2, c('gold', 3));
  return p;
}

/** A bell-shaped pip for the chime meter, lit (gold) or dark (dull gray-blue). */
function pip(pal: Pal, lit: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, r('brick')[1]);
  p.frame(0, 0, 20, 20, c('brick', 0));
  const g = lit ? r('gold') : r('stone');
  blob(p, 10, 9, 5.6, 5.8, g, lit ? 1 : 0, lit ? 5 : 3);
  p.rect(3, 12, 14, 3, g[lit ? 3 : 2]).rect(3, 12, 14, 1, g[lit ? 4 : 3]);
  p.disc(10, 16, 1.7, g[lit ? 2 : 1]);
  if (lit) p.set(7, 6, c('white', 3));
  return p;
}

/** The fair's gate: open (an arch with bunting) or shut (a solid wooden gate). */
function fairGate(pal: Pal, shut: boolean): Pixels {
  const { c, r } = pal;
  if (!shut) {
    // two striped posts with a gold ribbon between them: a gate standing open
    const p = clear(pal);
    for (const x0 of [0, 16]) for (let y = 0; y < 20; y++) p.rect(x0, y, 4, 1, (y + (x0 ? 2 : 0)) % 6 < 3 ? c('red', 2) : c('white', 3));
    p.rect(4, 0, 12, 1, c('gold', 3)).set(10, 1, c('gold', 4));
    return inked(pal, p);
  }
  const p = new Pixels(20, 20, r('wood')[2]);
  for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 20, c('wood', 1));
  p.rect(0, 5, 20, 2, c('wood', 1)).rect(0, 14, 20, 2, c('wood', 1)).frame(0, 0, 20, 20, c('wood', 0));
  p.disc(10, 10, 3, c('gold', 3)).rect(9, 10, 2, 5, c('gold', 2));
  return p;
}

/** Rascal the raccoon's workshop: a pulley wheel, a rope and a lever; and Rascal himself in two blocks. */
function pulley(pal: Pal): Pixels {
  const { c, r } = pal;
  const p = clear(pal);
  p.rect(0, 2, 20, 2, c('wood', 2));
  p.disc(10, 9, 5, r('stone')[2]).ring(10, 9, 5, c('ink', 1)).disc(10, 9, 1.6, c('ink', 1));
  p.line(5, 9, 5, 19, c('parch', 2)).line(15, 9, 15, 15, c('parch', 2));
  p.rect(13, 15, 5, 4, c('wood', 3));
  return inked(pal, p);
}

/** Rascal: a raccoon with a dark mask, round ears, a ringed tail and a sheepish smile (two blocks: head, body). */
function rascal(pal: Pal, bottom: boolean): Pixels {
  const { c, r } = pal;
  const p = clear(pal);
  const g = r('stone');
  if (!bottom) {
    p.disc(4, 5, 3.4, g[2]).disc(16, 5, 3.4, g[2]).disc(4, 5, 1.6, c('pink', 2)).disc(16, 5, 1.6, c('pink', 2));
    blob(p, 10, 12, 8.6, 6.8, g, 1, 4);
    p.rect(2, 9, 16, 5, c('ink', 1));
    p.rect(5, 10, 3, 3, c('white', 3)).rect(12, 10, 3, 3, c('white', 3));
    p.set(6, 11, c('ink', 0)).set(7, 11, c('ink', 0)).set(13, 11, c('ink', 0)).set(14, 11, c('ink', 0));
    p.rect(9, 14, 3, 2, c('ink', 0));
    p.set(7, 17, c('ink', 0)).set(8, 18, c('ink', 0)).set(9, 18, c('ink', 0)).set(10, 18, c('ink', 0)).set(11, 18, c('ink', 0)).set(12, 17, c('ink', 0));
  } else {
    for (let i = 0; i < 5; i++) p.rect(0, 3 + i * 3, 5, 2, i % 2 ? c('ink', 1) : g[3]);
    blob(p, 11, 8, 7, 8, g, 1, 4);
    p.rect(8, 3, 6, 8, c('white', 3));
    p.rect(6, 14, 3, 6, g[2]).rect(12, 14, 3, 6, g[2]);
    p.rect(5, 18, 5, 2, c('ink', 1)).rect(11, 18, 5, 2, c('ink', 1));
    p.disc(5, 9, 2, g[3]).disc(17, 9, 2, g[3]);
  }
  return inked(pal, p);
}

export interface PropOptions {
  /** The charms this level gives out: their blocks are added (touch them: 13 points, the charm counter up). */
  charms?: readonly (typeof CHARMS)[number][];
}

/** Adds the props every level may use; `only` limits it to the named groups (blocks are precious). */
export function addProps(book: Book, pal: Pal, groups: readonly string[], o: PropOptions = {}): void {
  const has = (g: string) => groups.includes(g);
  if (has('stepladder')) {
    book.add('stepTopL', stepTop(pal, 'L'), { solid: SOLID });
    book.add('stepTop', stepTop(pal, 'M'), { solid: SOLID });
    book.add('stepTopR', stepTop(pal, 'R'), { solid: SOLID });
    book.add('stepL', stepLeg(pal, true), air);
    book.add('stepR', stepLeg(pal, false), air);
    book.add('drip', drip(pal, false), { ...air, hp: BAD_LUCK, touch: 'dripGone' });
    book.add('dripGone', drip(pal, true), air);
  }
  if (has('crack')) {
    book.add('crack', crack(pal, false), { ...air, hp: BAD_LUCK, touch: 'crackDust' });
    book.add('crackDust', crack(pal, true), air);
  }
  if (has('crate')) book.add('crate', crate(pal), { solid: SOLID });
  if (has('mirror')) {
    book.add('mirrorWall', mirrorWall(pal, 0), { solid: SOLID });
    book.add('mirrorWall2', mirrorWall(pal, 1), { solid: SOLID });
    book.add('mirrorKey', mirrorKey(pal), { ...air, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
    book.add('mirrorGate', mirrorGate(pal), { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'sky' });
    book.add('mirrorArch', archOf(pal, 'stone'), air);
  }
  if (has('brolly')) {
    for (const [n, ramp] of [
      ['brollyRed', 'red'],
      ['brollyGold', 'gold'],
      ['brollyTeal', 'teal'],
    ] as const)
      book.add(n, brolly(pal, ramp), { grav: PULL.up });
  }
  if (has('salt')) {
    book.add('shaker', shaker(pal), { ...air, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
    book.add('saltPile', saltPile(pal), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
    book.add('saltArch', archOf(pal, 'wood'), air);
  }
  if (has('wood')) {
    book.add('woodBox', woodBox(pal), { solid: SOLID, score: 5, touch: 'sky' });
  }
  if (has('town')) {
    book.add('window', windowBlock(pal), { solid: SOLID });
    book.add('awning', awning(pal, false), { solid: LEDGE, grav: PULL.down });
    book.add('awning2', awning(pal, true), { solid: LEDGE, grav: PULL.down });
    book.add('lampHead', lamp(pal, true), air);
    book.add('lampPost', lamp(pal, false), air);
    book.add('fence', fence(pal), air);
    book.add('tentL', tent(pal, 0), air);
    book.add('tentR', tent(pal, 1), air);
    book.add('bunting', bunting(pal), air);
  }
  if (has('clock')) {
    const face = clockFace(pal);
    book.add('clockTL', face.crop(0, 0, 20, 20), { solid: SOLID });
    book.add('clockTR', face.crop(20, 0, 20, 20), { solid: SOLID });
    book.add('clockBL', face.crop(0, 20, 20, 20), { solid: SOLID });
    book.add('clockBR', face.crop(20, 20, 20, 20), { solid: SOLID });
  }
  if (has('rascal')) {
    book.add('rascalTop', rascal(pal, false), air);
    book.add('rascalBottom', rascal(pal, true), air);
    book.add('pulley', pulley(pal), air);
  }
  for (const name of o.charms ?? []) {
    book.add(`charm.${name}`, charmPicture(pal, name), { ...air, score: CHARM_POINTS, effect: CHARM_COUNTER, eamt: 1, touch: 'sky' });
  }
}

export { pip, fairGate };
