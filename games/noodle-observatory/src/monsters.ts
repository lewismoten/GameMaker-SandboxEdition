// THE NOODLE OBSERVATORY's actors (noodle.mbl) and the two monster files that move them. Nothing here hurts and
// nothing can be popped (power 150, no hit points); they are props that move on their own:
//   kitchen.mon  the first scene: the tin monkey (a wind-up toy) rolls a lens along the counter into the scope and
//                ticks; the pasta ring rolls up the wall and frames the moon in the window
//   roof.mon     the colander rolling ahead across the roof garden and parking where Nell is going (one path a
//                level), and the last scene: the pasta ring rolls along the terrace, catches the tablecloth's loose
//                edge and rolls away with it, the dishes left safely on the table
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { ringPicture } from './nell';

const T = 255;
/** Powers of 100 or more cannot be popped by touching Nell (PLAYGAME.C DoCollision). */
const actor = { power: 150, thru: 1 };
/** Ticks a block takes at speed 1. */
export const BLOCK_TICKS = 20;

/** The tin monkey: a round tin head with ears, a little body on wheels, the wind-up key in its back (two turns). */
function toy(pal: Pal, k: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  const b = pal.r('orange');
  const s = pal.r('steel');
  const ink = pal.c('ink', 0);
  blob(p, 10, 13, 5, 4.2, b, 1, 4);
  p.disc(11, 6, 4.4, b[2]).disc(11, 7, 2.8, pal.c('parch', 3));
  p.disc(6.5, 5, 1.6, b[1]).disc(15.5, 5, 1.6, b[1]);
  p.set(10, 6, ink).set(12, 6, ink).set(10, 8, ink).set(11, 9, ink).set(12, 8, ink);
  // wheels
  for (const x of [7, 13]) p.disc(x, 17.5, 1.8, s[1]).set(x, 17, s[3]);
  // the key: two loops on a stem, turned flat or edge-on
  p.rect(3, 12, 3, 1, s[2]);
  if (k === 0) p.ring(1.5, 10, 1.4, s[3]).ring(1.5, 14, 1.4, s[3]);
  else p.rect(1, 9, 1, 7, s[3]).rect(0, 9, 3, 1, s[4]);
  return outline(p, ink, { transparent: T });
}

/** A loose lens rolling on its edge: a glass disc in a brass rim, the glint moving round. */
function lens(pal: Pal, k: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  p.disc(10, 12, 7, pal.c('gold', 2)).disc(10, 12, 5.6, pal.c('glass', 1)).disc(10, 12, 4.2, pal.c('glass', 2));
  if (k === 0) p.line(7, 10, 9, 8, pal.c('glass', 3));
  else p.line(11, 15, 13, 13, pal.c('glass', 3));
  return outline(p, pal.c('ink', 0), { transparent: T });
}

/** The colander rolling on its rim: a steel bowl seen side on, holes going round, a handle at each side. */
function colander(pal: Pal, k: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  const s = pal.r('steel');
  p.disc(10, 11, 7.6, s[2]).disc(10, 11, 6.2, s[3]);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + k * 0.5;
    p.set(Math.round(10 + Math.cos(a) * 3.8), Math.round(11 + Math.sin(a) * 3.8), s[0]);
  }
  p.set(10, 11, s[0]);
  p.rect(1, 9, 2, 3, s[1]).rect(17, 9, 2, 3, s[1]);
  return outline(p, pal.c('ink', 0), { transparent: T });
}

/** The tablecloth's hanging edge (blue and white check), `k` flaps it. */
function skirt(pal: Pal, k: 0 | 1, end: boolean): Pixels {
  const p = new Pixels(20, 20, T);
  const b = pal.r('blue');
  const w = pal.r('white');
  for (let y = 0; y < 12 + (k ? 2 : 0); y++)
    for (let x = 0; x < 20; x++) {
      const check = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0;
      p.set(x, y, check ? b[3] : w[3]);
    }
  if (end) p.line(19, 0, 15, 14, T).line(18, 0, 14, 14, T);
  for (let x = 0; x < 20; x += 4) p.set(x + (k ? 2 : 0), 12 + (k ? 2 : 0), b[1]);
  return p;
}

/** A speech bubble with a mark in it: '!' or the toy's little tick (a turned key). */
function bubble(pal: Pal, what: '!' | 'tick'): Pixels {
  const p = new Pixels(20, 20, T);
  const ink = pal.c('ink', 0);
  p.disc(10, 8, 7, pal.c('white', 3)).ring(10, 8, 7, ink);
  p.line(6, 14, 4, 18, ink).line(7, 14, 5, 18, pal.c('white', 3));
  if (what === '!') p.rect(9, 3, 2, 6, ink).rect(9, 11, 2, 2, ink);
  else {
    // "tk" in tiny letters
    p.rect(6, 4, 1, 7, ink).rect(5, 6, 3, 1, ink).rect(10, 4, 1, 7, ink).line(11, 8, 13, 6, ink).line(11, 8, 13, 10, ink);
  }
  return p;
}

const NOTHING = 'nothing';

export function monsterPictures(pal: Pal): Book {
  const mb = new Book('mbl', 100);
  mb.add('toy0', toy(pal, 0));
  mb.add('toy1', toy(pal, 1));
  mb.add('lens0', lens(pal, 0));
  mb.add('lens1', lens(pal, 1));
  mb.add('ring0', ringPicture(pal, 0));
  mb.add('ring1', ringPicture(pal, 1));
  mb.add('col0', colander(pal, 0));
  mb.add('col1', colander(pal, 1));
  mb.add('skirt0', skirt(pal, 0, false));
  mb.add('skirt1', skirt(pal, 1, false));
  mb.add('skirtEnd0', skirt(pal, 0, true));
  mb.add('skirtEnd1', skirt(pal, 1, true));
  mb.add('bubWow', bubble(pal, '!'));
  mb.add('bubTick', bubble(pal, 'tick'));
  mb.add(NOTHING, new Pixels(20, 20, T));
  return mb;
}

export const finishMonsterPictures = (mb: Book): Block[] => mb.finish();

type Pics = [number, number][];
const still = (mb: Book, name: string): Pics => [[mb.n(name), 8]];
const anim = (mb: Book, a: string, b: string, t: number): Pics => [
  [mb.n(a), t],
  [mb.n(b), t],
];

/** kitchen.mon's slots, and the first scene's clock (ticks after it starts). */
export const KITCHEN = { toy: 0, lens: 3, cue: 6, ring: 8 } as const;
export const LENSROLL = {
  /** The toy and the lens wait this long, then roll `roll` blocks right (the toy one less: it pushes). */
  start: 300,
  roll: 10,
  /** The ring waits, then rolls up the wall `rise` blocks to frame the moon. */
  ring: 760,
  rise: 5,
  /** The way on opens. */
  open: 1020,
} as const;
/** The lens is in the scope (its block changes) when it gets there. */
export const LENS_IN = LENSROLL.start + LENSROLL.roll * BLOCK_TICKS;
/** The ring has framed the moon. */
export const RING_UP = LENSROLL.ring + LENSROLL.rise * BLOCK_TICKS;

export function kitchenSet(mb: Book): Monster[] {
  const set = newMonsterSet();
  const L = LENSROLL;
  const t = KITCHEN.toy;
  set[t] = mon(still(mb, 'toy0'), { ...actor, end: L.start, newmon: t + 1 });
  set[t + 1] = mon(anim(mb, 'toy0', 'toy1', 4), { ...actor, end: -1, newmon: t + 2 }, [corner(L.roll - 1, 0, 1), corner(0, 0, 0)]);
  set[t + 2] = mon(anim(mb, 'toy0', 'toy1', 9), { ...actor, end: -2 });
  const l = KITCHEN.lens;
  set[l] = mon(still(mb, 'lens0'), { ...actor, end: L.start, newmon: l + 1 });
  set[l + 1] = mon(anim(mb, 'lens0', 'lens1', 5), { ...actor, end: -1, newmon: l + 2 }, [corner(L.roll, 0, 1), corner(0, 0, 0)]);
  set[l + 2] = mon(still(mb, NOTHING), { ...actor, end: -2 });
  // a bubble over the toy while it ticks: waits, shows, goes
  const c = KITCHEN.cue;
  set[c] = mon(still(mb, NOTHING), { ...actor, end: LENS_IN + 10, newmon: c + 1 });
  set[c + 1] = mon(still(mb, 'bubTick'), { ...actor, end: 220, newmon: l + 2 });
  const r = KITCHEN.ring;
  set[r] = mon(still(mb, NOTHING), { ...actor, end: L.ring, newmon: r + 1 });
  set[r + 1] = mon(anim(mb, 'ring0', 'ring1', 5), { ...actor, end: -1, newmon: r + 2 }, [corner(0, -L.rise, 1), corner(0, 0, 0)]);
  set[r + 2] = mon(still(mb, 'ring0'), { ...actor, end: -2 });
  return set;
}

/** roof.mon's slots: three colander runs (one a level), then the last scene's ring and tablecloth. */
export const ROOF = { colander: [0, 7, 14], ring: 22, skirt: 26 } as const;
/** Each colander run: [wait, blocks right] legs, then it parks. */
export const COLANDER_RUNS: [number, number][][] = [
  [
    [60, 12],
    [140, 14],
    [140, 20],
  ],
  [
    [40, 10],
    [160, 16],
    [160, 18],
  ],
  [
    [40, 14],
    [160, 14],
    [120, 18],
  ],
];

/** The last scene's clock: the ring rolls in, reaches the table at `catch`, and rolls away with the cloth. */
export const SUPPER = { ring: 840, toTable: 9, away: 30, open: 1300 } as const;
export const CLOTH_GONE = SUPPER.ring + (SUPPER.toTable + 8) * BLOCK_TICKS;

export function roofSet(mb: Book): Monster[] {
  const set = newMonsterSet();
  ROOF.colander.forEach((s0, i) => {
    // each leg: wait where it is, then roll on; after the last it stays parked
    COLANDER_RUNS[i].forEach(([wait, n], k) => {
      const s = s0 + k * 2;
      set[s] = mon(still(mb, 'col0'), { ...actor, end: wait, newmon: s + 1 });
      set[s + 1] = mon(anim(mb, 'col0', 'col1', 3), { ...actor, end: -1, newmon: s + 2 }, [corner(n, 0, 1), corner(0, 0, 0)]);
    });
    set[s0 + COLANDER_RUNS[i].length * 2] = mon(still(mb, 'col0'), { ...actor, end: -2 });
  });
  const r = ROOF.ring;
  set[r] = mon(still(mb, NOTHING), { ...actor, end: SUPPER.ring, newmon: r + 1 });
  set[r + 1] = mon(anim(mb, 'ring0', 'ring1', 4), { ...actor, end: -1, newmon: r + 2 }, [corner(SUPPER.toTable + SUPPER.away, 0, 1), corner(0, 0, 0)]);
  set[r + 2] = mon(still(mb, NOTHING), { ...actor, end: -2 });
  // the cloth's hanging edge: the end piece waits for the ring, then everything goes the same way
  const k = ROOF.skirt;
  const wait = SUPPER.ring + SUPPER.toTable * BLOCK_TICKS;
  set[k] = mon(anim(mb, 'skirt0', 'skirt1', 12), { ...actor, end: wait, newmon: k + 1 });
  set[k + 1] = mon(anim(mb, 'skirt0', 'skirt1', 4), { ...actor, end: -1, newmon: r + 2 }, [corner(SUPPER.away, 0, 1), corner(0, 0, 0)]);
  set[k + 2] = mon(anim(mb, 'skirtEnd0', 'skirtEnd1', 12), { ...actor, end: wait, newmon: k + 3 });
  set[k + 3] = mon(anim(mb, 'skirtEnd0', 'skirtEnd1', 4), { ...actor, end: -1, newmon: r + 2 }, [corner(SUPPER.away, 0, 1), corner(0, 0, 0)]);
  return set;
}

export const MON_SETS = { kitchen: kitchenSet, loft: kitchenSet, roof: roofSet } as const;
