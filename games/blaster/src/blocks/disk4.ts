// Stage 4: THE HARD DISK. A mirror-bright platter spinning under the ship (whole rows of
// data streams), the spindle hub, the read/write arm, and bad sectors crawling with virus.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, shadeAt } from '../art/draw';
import { pics } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { bomb, disc, keyOf, mite, skull, slug } from '../sprites/sprites';
import { onFloor, slices, type StageArt } from './tiles';

export function diskArt(p: Pal): StageArt {
  const floor = (v: number): Pixels => {
    const t = new Pixels(20, 20);
    const r = rng(v * 11 + 1);
    // brushed chrome with the faint rings of the tracks
    t.map((x, y) => shadeAt(p.r('base'), 2, 4, 0.45 + Math.sin((y + x * 0.15) * 1.3) * 0.12 + r() * 0.12, x, y));
    for (let y = 4; y < 20; y += 8) for (let x = 0; x < 20; x++) if ((x + y) % 3) t.set(x, y + Math.round(x / 14), p.c('base', 5));
    if (v === 1) for (let x = 1; x < 20; x += 3) t.rect(x, 12, 2, 1, p.c('base', 1));
    if (v === 2) t.line(2, 17, 17, 3, p.c('base', 6));
    if (v === 3) micro(t, 2, 7, 'S07', p.c('base', 1));
    if (v === 4) t.set(5, 6, p.c('gray', 1)).set(14, 13, p.c('gray', 1)).set(9, 16, p.c('gray', 2));
    return t;
  };
  const edge = (side: 'L' | 'R', v: number): Pixels => {
    const t = new Pixels(20, 20);
    t.map((x, y) => shadeAt(p.r('deep'), 1, 3, 0.4 + ((x + y * 2) % 7) * 0.03, x, y));
    t.rect(side === 'L' ? 18 : 0, 0, 2, 20, p.c('deep', 4));
    if (v === 1) {
      blob(t, 10, 10, 4, 4, p.r('steel'), 2, 6);
      t.rect(8, 9, 5, 2, p.c('ink', 0));
    }
    return t;
  };
  return { pal: p, floor, edge, floors: 5, edges: 2 };
}

function spindle(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 4, 4);
  blob(big, 40, 40, 36, 36, p.r('steel'), 1, 5);
  blob(big, 40, 40, 26, 26, p.r('steel'), 3, 6);
  blob(big, 40, 40, 10, 10, p.r('deep'), 1, 3);
  for (let k = 0; k < 6; k++) {
    const an = (k * Math.PI) / 3;
    blob(big, 40 + Math.cos(an) * 18, 40 + Math.sin(an) * 18, 3, 3, p.r('deep'), 0, 2);
  }
  return big;
}

/** The read/write arm, 2 wide by 5 tall, its head at the bottom. */
function arm(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 2, 5);
  for (let y = 0; y < 84; y++) {
    const w = 12 - y * 0.08;
    const cx = 20 + Math.sin(y / 30) * 4;
    for (let x = Math.round(cx - w / 2); x < cx + w / 2; x++) big.set(x, y, shadeAt(p.r('steel'), 2, 5, 0.3 + ((x - cx + w / 2) / w) * 0.5, x, y));
  }
  bevel(big, 10, 82, 20, 14, p.r('trim'), 3, 1);
  big.rect(18, 92, 4, 3, p.c('glow', 4));
  big.rect(19, 0, 2, 80, p.c('trim', 4));
  return big;
}

function bad(a: StageArt, k: number): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  const r = rng(31 + k);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * 18);
    const y = Math.floor(r() * 18);
    t.rect(x, y, 2 + Math.floor(r() * 3), 1, p.c(i % 3 ? 'virus' : 'slime', 1 + Math.floor(r() * 4)));
  }
  return t;
}

function sectorLine(a: StageArt): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  t.rect(0, 9, 20, 2, p.c('trim', 3));
  for (let x = 1; x < 20; x += 5) t.rect(x, 8, 2, 4, p.c('trim', 5));
  return t;
}

export function diskTiles(bs: BlockSet, a: StageArt): void {
  slices(bs, 'hub', spindle(a));
  slices(bs, 'arm', arm(a));
  bs.add('bad', bad(a, 0), { next: 'bad1', ntime: 3 });
  bs.add('bad1', bad(a, 1), { next: 'bad', ntime: 3 });
  bs.add('sector', sectorLine(a));
}

export function diskVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...mite(keyOf(p, { main: 'slime', accent: 'red' })));
  pics(b, 'skull', ...skull(keyOf(p, { main: 'virus', accent: 'red' })));
  pics(b, 'slug', ...slug(keyOf(p, { main: 'virus', accent: 'gold' })));
  pics(b, 'disc', ...disc(p, { main: 'virus', accent: 'slime' }));
  pics(b, 'tank', ...bomb(keyOf(p, { main: 'slime', accent: 'red' })));
}
