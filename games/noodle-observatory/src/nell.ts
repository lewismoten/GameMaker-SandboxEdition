// Nell, who builds the observatory: the Starter hero's poses in Nell's colors (palette.ts NELL) with her own head
// (the knit cap taken off; black hair up in a bun with a mustard scrunchie and a pencil through it). Drawn facing
// right; the character file mirrors the pictures for walking left.
//
// Her second character file is NELL IN THE RING (ring.chr): the pasta ring rolls uphill on its own, the way the
// ride-along Starter's rocket rises (every frame of the idle sequence moves it up a little); Left and Right steer,
// Up rolls faster, Down slower but still up. Space does nothing in the ring.
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { KEYS } from '../../kit/starter/blocks';
import { Book } from '../../kit/starter/book';
import { body, head, outlinedPair, type Face, type Legs } from '../../kit/starter/hero';
import { kitRamp } from '../../kit/starter/heroLook';
import { KEY, SEQ, SND } from '../../kit/starter/ids';
import type { Pal } from '../../kit/starter/palette';

type Raised = 'left' | 'right' | 'both' | '';
const T = 255;

/** The counters a part, a lens, a pad or a place setting adds to (20 to 25): each starts at 1, which shows as 0. */
export const CHANNELS = [KEYS, KEYS + 1, KEYS + 2, KEYS + 3, KEYS + 4, KEYS + 5] as const;

/** Nell's head: the Starter head, the cap swapped for hair up in a bun, a scrunchie and a pencil. */
function nellHead(pal: Pal, face: Face, front = false, look = 0, raised: Raised = ''): Pixels {
  const p = head(pal, face, front, look, raised);
  const hat = kitRamp(pal, 'hat');
  const hair = kitRamp(pal, 'hair');
  const white = pal.r('white');
  const cap = new Set([...hat, white[1], white[2], white[3]]);
  for (let y = 0; y <= 11; y++) for (let x = 0; x < 20; x++) if (cap.has(p.get(x, y))) p.set(x, y, T);
  const cx = front ? 10 : 9.5;
  // the hair over the top of the head, a little lighter where the lamp catches it
  for (let y = 3; y <= 11; y++)
    for (let x = 1; x < 20; x++) {
      const d = ((x - cx) / 8.6) ** 2 + ((y - 11) / 7.6) ** 2;
      if (d < 1 && (p.get(x, y) === T || y <= 10)) p.set(x, y, d < 0.45 && y < 7 && x > cx - 3 ? hair[2] : y < 6 ? hair[1] : hair[0]);
    }
  if (face !== 'back') {
    // a side part and a few strands over the forehead
    p.rect(front ? 6 : 9, 9, 6, 1, hair[1]).set(front ? 13 : 15, 10, hair[0]).set(front ? 7 : 11, 10, hair[0]);
  }
  // the bun on top toward the back, its scrunchie, and a pencil through it
  const bx = front ? 10 : 6;
  p.disc(bx, 3, 2.9, hair[1]).set(bx - 1, 2, hair[2]).set(bx, 1, hair[2]);
  p.rect(bx - 3, 5, 7, 2, hat[3]).rect(bx - 3, 5, 7, 1, hat[4]).set(bx - 3, 6, hat[1]).set(bx + 3, 6, hat[1]);
  if (face !== 'back' || front) {
    const wood = pal.r('wood');
    p.line(bx - 4, 0, bx + 3, 4, wood[4]).line(bx - 4, 1, bx + 3, 5, wood[2]);
    p.set(bx + 4, 5, pal.c('ink', 0)).set(bx - 5, 0, pal.c('red', 2));
  }
  return p;
}

/** Nell's character blocks (.CBL): the Starter hero's poses with her head. */
export function buildNellBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const add = (topName: string, bottomName: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = outlinedPair(pal, top, bottom);
    if (!book.has(topName)) book.add(topName, t);
    if (!book.has(bottomName)) book.add(bottomName, b);
  };
  const h = (face: Face, front = false, look = 0, raised: Raised = '') => nellHead(pal, face, front, look, raised);
  const stand = body(pal, { arms: 'down', legs: { back: [5, 0], front: [11, 0] } });
  const walk: Legs[] = [
    { back: [3, 0], front: [12, 0] },
    { back: [7, 2], front: [9, 0] },
    { back: [12, 0], front: [3, 0] },
    { back: [9, 0], front: [7, 2] },
  ];
  add('stand.top', 'stand', h('smile'), stand);
  add('blink.top', 'stand', h('blink'), stand);
  add('hurt.top', 'hurt', h('ouch'), body(pal, { arms: 'out', legs: { back: [4, 0], front: [12, 0] } }));
  add('cheer.top', 'jump', h('cheer'), body(pal, { arms: 'out', legs: 'tuck' }));
  walk.forEach((legs, i) => add('stand.top', `walk${i}`, h('smile'), body(pal, { arms: i % 2 ? 'swingB' : 'swingA', legs })));
  add('up.top', 'jumpup', h('smile', false, 0, 'both'), body(pal, { arms: 'high', legs: 'tuck' }));
  add('oh.top', 'fall', h('oh', false, 0, 'left'), body(pal, { arms: 'flail', legs: 'dangle' }));
  add('cheer2.top', 'cheer', h('cheer', false, 0, 'both'), body(pal, { arms: 'high', legs: { back: [5, 0], front: [11, 0] } }));
  add('look.top', 'stand', h('smile', false, -1), stand);
  const dig = { back: [3, 0], front: [10, 0] } as Legs;
  add('stand.top', 'dig0', h('smile'), body(pal, { arms: 'dig0', legs: dig }));
  add('stand.top', 'dig1', h('smile'), body(pal, { arms: 'dig1', legs: dig }));
  add('stand.top', 'throw0', h('smile'), body(pal, { arms: 'windup', legs: { back: [5, 0], front: [11, 0] } }));
  add('cheer.top', 'throw1', h('cheer'), body(pal, { arms: 'release', legs: { back: [4, 0], front: [11, 0] } }));
  add('stand.top', 'throw2', h('smile'), body(pal, { arms: 'follow', legs: { back: [5, 0], front: [11, 0] } }));
  add('back.top', 'climb0', h('back', true), body(pal, { arms: 'upA', legs: 'climbA', front: true, back: true }));
  add('back.top', 'climb1', h('back', true), body(pal, { arms: 'upB', legs: 'climbB', front: true, back: true }));
  return book;
}

/** A standing picture of Nell (head over body), for the title, cards and cartoons. */
export function nellPicture(book: Book, top: string, bottom: string): Pixels {
  const p = new Pixels(20, 40, T);
  p.blit(book.pics.get(top)!, 0, 0, T);
  p.blit(book.pics.get(bottom)!, 0, 20, T);
  return p;
}

/** The pasta ring, 20x20: a fat golden hoop with ridges; `turn` moves the ridges round as it rolls. */
export function ringPicture(pal: Pal, turn: number, withNell = false): Pixels {
  const p = new Pixels(20, 20, T);
  const r = pal.r('pasta');
  const ink = pal.c('ink', 0);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const d = Math.hypot(x - 9.5, y - 9.5);
      if (d > 9.6 || d < 5.2) continue;
      if (d > 8.8 || d < 6) p.set(x, y, ink);
      else {
        const a = Math.atan2(y - 9.5, x - 9.5) + turn * 0.4;
        const ridge = Math.floor(((a + Math.PI) / (2 * Math.PI)) * 14) % 2 === 0;
        p.set(x, y, y < 8 ? r[ridge ? 4 : 3] : r[ridge ? 2 : 1]);
      }
    }
  if (withNell) {
    // her sweater and hands inside the ring, gripping it on both sides
    const hood = kitRamp(pal, 'hood');
    const skin = kitRamp(pal, 'skin');
    p.rect(7, 6, 6, 8, hood[2]).rect(7, 6, 6, 1, hood[4]).rect(12, 7, 1, 7, hood[1]);
    p.rect(5, 9, 2, 2, skin[2]).rect(13, 9, 2, 2, skin[2]);
    const pants = kitRamp(pal, 'pants');
    p.rect(7, 14, 2, 1, pants[2]).rect(11, 14, 2, 1, pants[2]);
  }
  return p;
}

/** Pixels a tick the ring rolls uphill with no key held, and with Up, Down, Left and Right. */
export const RING = { drift: 2, fast: 3, slow: 1, steer: 3 } as const;
export const HERO_HIT_POINTS = 50;
export const HERO_LIVES = 3;

/** Nell in the ring (ring.cbl): her head over the rolling ring, two turns of it. */
export function buildRingBlocks(pal: Pal, nell: Book): Book {
  const b = new Book('cbl');
  b.add('ring.top', nell.pics.get('stand.top')!);
  b.add('ring0', ringPicture(pal, 0, true));
  b.add('ring1', ringPicture(pal, 1, true));
  return b;
}

/** RING.CHR: the forced roll uphill lives in the frames' y (see the header). */
export function buildRing(cb: Book): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (n: number, o: { x?: number; y?: number; pause?: number } = {}): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: cb.n('ring.top'),
    pic2: cb.n(`ring${n % 2}`),
    pause: o.pause ?? 1,
  });
  set(S[SEQ.die], [f(0, { pause: 10 }), f(1, { pause: 24 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f(0, { pause: 2 }), f(1), f(0, { pause: 2 })], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f(0)], { key: 0 });
  set(S[4], [f(0)], { key: 0 });
  set(S[SEQ.dig], [f(0)], { key: 0 });
  set(S[SEQ.throw], [f(0)], { key: 0 });
  set(S[SEQ.cheer], [f(0)], { key: 0 });
  const run = (dx: number, dy: number) => [0, 0, 1, 1].map((n) => f(n, { x: dx, y: dy }));
  set(S[SEQ.idle], run(0, -RING.drift));
  set(S[SEQ.right], run(RING.steer, -RING.drift), { key: KEY.right, jstkMov: 3 });
  set(S[SEQ.left], run(-RING.steer, -RING.drift), { key: KEY.left, jstkMov: 7 });
  set(S[SEQ.up], run(0, -RING.fast), { key: KEY.up, jstkMov: 1 });
  set(S[SEQ.down], run(0, -RING.slow), { key: KEY.down, jstkMov: 5 });
  set(S[SEQ.rightD], run(RING.steer, -RING.drift), { key: KEY.d });
  set(S[SEQ.leftA], run(-RING.steer, -RING.drift), { key: KEY.a });
  set(S[SEQ.upW], run(0, -RING.fast), { key: KEY.w });
  set(S[SEQ.downS], run(0, -RING.slow), { key: KEY.s });
  set(S[SEQ.jump], run(0, -RING.drift), { key: KEY.space, norepeat: 1, jstkMov: 9, jstkBut: 1 });
  sentinels(ch);
  return ch;
}

/** Every counter infinite except hit points, lives and the six part counters (1, which shows as 0). */
export function sentinels(ch: Character): void {
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = HERO_HIT_POINTS;
  ch.meter[1] = HERO_LIVES;
  for (const k of CHANNELS) ch.meter[k] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
}
