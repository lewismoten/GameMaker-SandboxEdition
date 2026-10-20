// Boss 4: THE HEAD CRASH. The read/write head has gone rogue and dug into the platter right
// over the way out. Two rings of platter shards orbit in front of it (two snakes on small
// loops), turrets on its arm sweep the arena and the platter's spin shoves the ship.
import { Pixels } from '../kit/pixels';
import { CLEAR, bevel, blob, micro } from './art';
import { slicesOf, snake, tint, weakPoint } from './boss';
import { mite, pics } from './enemies';
import { arena } from './mapkit';
import type { Bestiary } from './mons';
import type { Pal } from './pal';
import { disc, keyOf, skull } from './sprites';
import { kit, type Leg } from './stage';
import type { BlockSet } from './art';
import type { StageArt } from './tiles';
import { HURT } from './common';

function headPic(p: Pal, hot: boolean): Pixels {
  const big = new Pixels(40, 40, CLEAR);
  bevel(big, 2, 0, 36, 38, p.r('steel'), 3, 2);
  big.rect(6, 4, 28, 12, p.c('deep', 0));
  micro(big, 8, 7, 'R/W', p.c('glow', hot ? 4 : 2));
  for (const s of [-1, 1]) blob(big, 20 + s * 9, 24, 5, 5, p.r('red'), hot ? 2 : 0, hot ? 4 : 2);
  big.rect(8, 32, 24, 4, p.c('glow', hot ? 4 : 2));
  for (let x = 9; x < 32; x += 4) big.rect(x, 33, 2, 2, p.c('ink', 0));
  return big;
}

function bossTiles(bs: BlockSet, a: StageArt): void {
  const p = a.pal;
  const groove = a.floor(0);
  for (let x = 0; x < 20; x++) groove.rect(x, 8 + Math.round(Math.sin(x / 2) * 2), 1, 4, p.c('base', 0));
  bs.add('groove', groove);
}

function bossVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...skull(keyOf(p, { main: 'virus', accent: 'red' })));
  mite(b, 'mite', [
    [-3, 2, 6],
    [6, 3, 6],
    [-6, 3, 6],
    [2, 10, 7],
  ]);
  const h0 = slicesOf(headPic(p, false), 2, 2);
  const h1 = slicesOf(headPic(p, true), 2, 2);
  const hurt = (q: Pixels) => tint(q, (c) => (p.r('steel').includes(c) ? p.c('red', 1 + (p.r('steel').indexOf(c) >> 1)) : c));
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 2; c++)
      weakPoint(b, `head${r}${c}`, r === 0 ? 6 : 9, (h) => (h <= 3 ? [hurt(h0[r][c]), hurt(h1[r][c])] : [h0[r][c], h1[r][c]]), { score: 1800, anim: 3 });
  const [d0, d1] = disc(p, { main: 'virus', accent: 'slime' });
  b.mb.add('shard0', d0, { chHitPt: HURT.enemy });
  b.mb.add('shard1', d1, { chHitPt: HURT.enemy });
}

export function bossCrash(art: StageArt): Leg {
  let left: { name: string; x: number; y: number }[] = [];
  let right: { name: string; x: number; y: number }[] = [];
  const k = kit(
    art,
    (bs) => bossTiles(bs, art),
    (b) => {
      bossVirus(b, art.pal);
      left = snake(b, 'ringL', 4, 3, 3, 4, (i) => `shard${i % 2}`, { score: 300, spacing: 3 });
      right = snake(b, 'ringR', 4, 3, 3, 5, (i) => `shard${(i + 1) % 2}`, { score: 300, spacing: 3 });
    },
    { mite: 'mite', turretEvery: 9, seekerEvery: 36, flakEvery: 24, hatchShut: 40, hatchOpen: 24, hatchEvery: 7 },
  );
  const g = arena(k.bs, k.beasts, art, 13);
  g.rect(1, 0, 14, 10, (c, d) => ((c * 7 + d * 3) % 9 === 0 ? 'floor1' : 'floor0'));
  g.rect(1, 1, 14, 1, 'wall');
  g.rect(1, 0, 14, 1, 'groove');
  g.set(7, 1, 'floor0').set(8, 1, 'floor0').set(7, 0, 'gate0').set(8, 0, 'gate2');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) g.mon(7 + c, 1 + r, `head${r}${c}`);
  g.link(7, 1).link(8, 1);
  for (const s of left) g.mon(2 + s.x, 3 + s.y, s.name);
  for (const s of right) g.mon(10 + s.x, 3 + s.y, s.name);
  g.current(1, 14, 8, 8, 'L');
  g.turret(4, 2, 'sweep').turret(11, 2, 'sweep');
  g.turret(6, 2, 'seeker').turret(9, 2, 'flak');
  g.hatch(2, 2, false).hatch(13, 2, false);
  g.pickup(1, 9, 'repair').pickup(14, 9, 'nova').pickup(14, 7, 'repair');
  return {
    file: 's4c',
    kitFile: 'b4',
    title: 'The Head Crash',
    kind: 'boss',
    grid: g,
    kit: k,
    card: ['The read head crashed', 'over the way out. Shards', 'orbit it: mind the spin!'],
  };
}
