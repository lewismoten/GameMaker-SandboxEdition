// Boss 2: THE MEMORY LEECH. Its sucker mouth is clamped over the way out, draining the
// memory; its body, twelve monsters long, coils around the arena in a loop (one path, each
// segment starting at its own point on it), soaking up shots meant for the mouth.
import { Pixels } from '../kit/pixels';
import { CLEAR, blob, micro } from './src/art/draw';
import { slicesOf, snake, tint, weakPoint } from './boss';
import { mite, pics } from './enemies';
import { arena } from './mapkit';
import type { Bestiary } from './mons';
import type { Pal } from './src/art/pal';
import { keyOf, mite as miteArt } from './sprites';
import { kit, type Leg } from './stage';
import type { BlockSet } from './src/art/draw';
import type { StageArt } from './tiles';
import { HURT } from './common';
import { ramTiles } from './ram';

/** The sucker, 2 x 2: two eyes on top, a ring of teeth below. */
function mouth(p: Pal, open: boolean): Pixels {
  const big = new Pixels(40, 40, CLEAR);
  blob(big, 20, 20, 19, 19, p.r('slime'), 0, 3);
  for (const s of [-1, 1]) {
    blob(big, 20 + s * 9, 9, 4, 4, p.r('gold'), 2, 4);
    big.rect(19 + s * 9, 8, 2, 3, p.c('ink', 0));
  }
  micro(big, 12, 1, 'LEAK', p.c('slime', 5));
  const r = open ? 11 : 8;
  blob(big, 20, 27, r, r, p.r('red'), 0, 2);
  big.map((x, y, c) => (Math.hypot(x - 20, y - 27) < r - 4 ? p.c('ink', 0) : c));
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI * 2) / 14;
    const x = 20 + Math.cos(a) * (r - 2);
    const y = 27 + Math.sin(a) * (r - 2);
    big.rect(x, y, 2, 2, p.c('grey', 7));
  }
  return big;
}

function segment(p: Pal, head: boolean, k: number): Pixels {
  const t = new Pixels(20, 20, CLEAR);
  blob(t, 10, 10, 9, 9, p.r('slime'), 0, 4);
  blob(t, 10, 10, 6, 6, p.r(k ? 'slime' : 'virus'), 1, 3);
  if (head) {
    blob(t, 6, 7, 3, 3, p.r('gold'), 2, 4).set(6, 7, p.c('ink', 0));
    blob(t, 14, 7, 3, 3, p.r('gold'), 2, 4).set(14, 7, p.c('ink', 0));
    t.rect(6, 13, 8, 2, p.c('ink', 0));
  } else for (let i = 0; i < 4; i++) t.set(10 + Math.cos(i * 1.6 + k) * 4, 10 + Math.sin(i * 1.6 + k) * 4, p.c('slime', 5));
  return t;
}

function bossTiles(bs: BlockSet, a: StageArt): void {
  const p = a.pal;
  const drained = a.floor(0);
  for (let y = 2; y < 20; y += 5) for (let x = 2; x < 20; x += 5) drained.rect(x - 1, y - 1, 3, 3, p.c('virus', 1));
  bs.add('drained', drained);
}

function bossVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...miteArt(keyOf(p, { main: 'gold', accent: 'red' })));
  mite(b, 'mite', [
    [2, 2, 4],
    [-2, 3, 4],
    [2, 3, 4],
    [-1, 10, 5],
  ]);
  const m0 = slicesOf(mouth(p, false), 2, 2);
  const m1 = slicesOf(mouth(p, true), 2, 2);
  const hurt = (q: Pixels) => tint(q, (c) => (p.r('slime').includes(c) ? p.c('red', 1 + (p.r('slime').indexOf(c) >> 1)) : c));
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 2; c++)
      weakPoint(b, `head${r}${c}`, r === 0 ? 5 : 8, (h) => (h <= 3 ? [hurt(m0[r][c]), hurt(m1[r][c])] : [m0[r][c], m1[r][c]]), { score: 1200, anim: 6 });
  b.mb.add('segHead', segment(p, true, 0), { chHitPt: HURT.enemy });
  b.mb.add('seg0', segment(p, false, 0), { chHitPt: HURT.enemy });
  b.mb.add('seg1', segment(p, false, 1), { chHitPt: HURT.enemy });
}

export function bossLeech(art: StageArt): Leg {
  let body: { name: string; x: number; y: number }[] = [];
  const k = kit(
    art,
    (bs) => {
      ramTiles(bs, art);
      bossTiles(bs, art);
    },
    (b) => {
      bossVirus(b, art.pal);
      body = snake(b, 'seg', 12, 11, 3, 4, (i) => (i === 0 ? 'segHead' : `seg${i % 2}`), { score: 200 });
    },
    { mite: 'mite', turretEvery: 11, seekerEvery: 50, hatchShut: 50, hatchOpen: 30, hatchEvery: 10 },
  );
  const g = arena(k.bs, k.beasts, art, 9);
  g.rect(1, 0, 14, 10, (c, d) => ((c * 3 + d) % 5 === 0 ? 'floor1' : (c + d) % 9 === 0 ? 'floor2' : 'floor0'));
  g.rect(1, 0, 14, 1, 'drained');
  g.rect(1, 1, 14, 1, 'wall');
  g.set(7, 1, 'floor0').set(8, 1, 'floor0').set(7, 0, 'gate0').set(8, 0, 'gate2');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) g.mon(7 + c, 1 + r, `head${r}${c}`);
  g.link(7, 1).link(8, 1);
  for (const s of body) g.mon(2 + s.x, 3 + s.y, s.name);
  g.hatch(2, 2, false).hatch(13, 2, false);
  g.turret(4, 1, 'seeker').turret(11, 1, 'seeker');
  g.stamp(1, 5, 'dramA', 2, 3).stamp(13, 5, 'dramB', 2, 3);
  for (let c = 3; c < 13; c++) g.set(c, 9, `ref${c % 4}`);
  g.pickup(1, 8, 'repair').pickup(14, 8, 'nova');
  return {
    file: 's2c',
    kitFile: 'b2',
    title: 'The Memory Leech',
    kind: 'boss',
    grid: g,
    kit: k,
    card: ['Its mouth is clamped over', 'the exit. Shoot through the', 'coils to get at it!'],
  };
}
