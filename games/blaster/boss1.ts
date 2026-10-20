// Boss 1: THE BIOS BUG, a beetle the size of a chip, clamped onto the BIOS. Its shell is
// the arena's back wall; its jaws are turrets, its sides spit seekers and mites, and its
// head (four monsters: a crown over two great eyes) plugs the only way out.
import { Pixels, rng } from '../kit/pixels';
import { CLEAR, blob, micro, shadeAt } from './art';
import { opaque, slicesOf, tint, weakPoint } from './boss';
import { pics } from './enemies';
import { keyOf, mite as miteArt } from './sprites';
import { mite } from './enemies';
import { arena } from './mapkit';
import type { Bestiary } from './mons';
import type { Pal } from './pal';
import { kit, type Leg } from './stage';
import type { StageArt } from './tiles';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../web/src/formats/blocks';
import type { BlockSet } from './art';

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;

/** The shell, 12 x 4 blocks, drawn on clear (the head's hole in the middle bottom). */
function shell(p: Pal): Pixels {
  const big = new Pixels(240, 80, CLEAR);
  const r = rng(5);
  // legs reaching out to the sides
  for (const side of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const y0 = 14 + i * 18;
      for (let k = 0; k < 40; k++) {
        const x = 120 + side * (80 + k);
        const y = y0 + Math.round(Math.sin(k / 9) * 6) + (k > 28 ? (k - 28) * 0.8 : 0);
        big.rect(x, y, 2, 4, p.c('virus', k % 7 === 0 ? 0 : 1));
        big.set(x, y, p.c('virus', 3));
      }
    }
  // the carapace
  for (let y = 0; y < 80; y++)
    for (let x = 0; x < 240; x++) {
      const nx = (x - 120) / 104;
      const ny = (y - 22) / 52;
      const d = nx * nx + ny * ny;
      if (d > 1 || y > 70) continue;
      const z = Math.sqrt(1 - d);
      const seam = Math.abs(x - 119.5) < 1.5;
      let c = shadeAt(p.r('virus'), 0, 4, 0.25 + z * 0.55 - ny * 0.15 - Math.abs(nx) * 0.2, x, y);
      if (seam) c = p.c('virus', 0);
      if (d > 0.9) c = p.c('ink', 0);
      big.set(x, y, c);
    }
  // slime spots and gold circuitry glyphs
  for (let i = 0; i < 14; i++) {
    const x = 30 + r() * 180;
    const y = 8 + r() * 44;
    if (Math.abs(x - 120) < 26) continue;
    blob(big, x, y, 3 + r() * 3, 2 + r() * 2, p.r('slime'), 1, 4);
  }
  micro(big, 52, 30, 'AMI', p.c('gold', 4));
  micro(big, 168, 30, 'BIOS', p.c('gold', 4));
  for (let k = 0; k < 5; k++) big.rect(40 + k * 6, 46, 3, 1, p.c('gold', 2)).rect(176 + k * 6, 46, 3, 1, p.c('gold', 2));
  // the head's hole
  big.rect(100, 0, 40, 80, CLEAR);
  big.rect(98, 0, 2, 72, p.c('ink', 0)).rect(140, 0, 2, 72, p.c('ink', 0));
  return big;
}

/** The head, 2 x 2 blocks: a horned crown over two compound eyes and a mouth. */
function head(p: Pal, blink: boolean): Pixels {
  const big = new Pixels(40, 40, CLEAR);
  blob(big, 20, 20, 19, 19, p.r('virus'), 0, 3);
  // horns
  for (const s of [-1, 1]) for (let k = 0; k < 12; k++) big.rect(20 + s * (6 + k * 0.9), 2 + k * 0.4, 2, 3, p.c('gold', 1 + (k >> 2)));
  // the crown plate
  blob(big, 20, 10, 13, 8, p.r('steel'), 1, 5);
  micro(big, 13, 8, 'ROM', p.c('red', 2));
  // eyes
  for (const s of [-1, 1]) {
    blob(big, 20 + s * 9, 25, 7, 6, p.r('slime'), blink ? 1 : 2, blink ? 3 : 5);
    for (let k = 0; k < 6; k++) big.set(20 + s * 9 + ((k * 3) % 7) - 3, 22 + ((k * 5) % 6), p.c('slime', 0));
  }
  // mouth
  big.rect(14, 33, 12, 3, p.c('ink', 0));
  for (let x = 15; x < 26; x += 3) big.rect(x, 33, 2, 2, p.c('grey', 7));
  return big;
}

function bossTiles(bs: BlockSet, a: StageArt): void {
  const p = a.pal;
  const sh = shell(p);
  const s = slicesOf(sh, 12, 4);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 12; c++) {
      if (!opaque(s[r][c])) continue;
      const t = new Pixels(20, 20);
      t.px.set(a.floor(0).px);
      t.blit(s[r][c], 0, 0, CLEAR);
      bs.add(`shell${r}${c}`, t, { solid: SOLID });
    }
  // a big BIOS chip under the beetle's belly
  const plate = new Pixels(20, 20);
  plate.px.set(a.floor(0).px);
  plate.rect(0, 0, 20, 20, p.c('deep', 1));
  for (let x = 1; x < 20; x += 4) plate.set(x, 10, p.c('deep', 3));
  bs.add('biosChip', plate);
}

function bossVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...miteArt(keyOf(p, { main: 'virus', accent: 'slime' })));
  mite(b, 'mite', [
    [2, 1, 3],
    [-1, 3, 3],
    [2, 3, 3],
    [-2, 4, 4],
    [1, 8, 4],
  ]);
  const h0 = slicesOf(head(p, false), 2, 2);
  const h1 = slicesOf(head(p, true), 2, 2);
  const hurt = (q: Pixels) => tint(q, (c) => (p.r('virus').includes(c) ? p.c('red', 1 + (p.r('virus').indexOf(c) >> 1)) : c));
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 2; c++)
      weakPoint(b, `head${r}${c}`, r === 0 ? 5 : 8, (h) => (h <= 3 ? [hurt(h0[r][c]), hurt(h1[r][c])] : [h0[r][c], h1[r][c]]), {
        score: 1000,
        anim: r === 1 ? 7 : 50,
      });
}

export function bossBIOS(art: StageArt): Leg {
  const k = kit(
    art,
    (bs) => bossTiles(bs, art),
    (b) => bossVirus(b, art.pal),
    { mite: 'mite', turretEvery: 10, seekerEvery: 45, hatchShut: 40, hatchOpen: 30, hatchEvery: 9 },
  );
  const g = arena(k.bs, k.beasts, art, 7);
  g.rect(1, 0, 14, 10, (c, d) => ((c + d) % 7 === 0 ? 'floor1' : 'floor0'));
  g.rect(3, 4, 10, 2, 'biosChip');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) if (k.bs.has(`shell${r}${c}`)) g.set(2 + c, r, `shell${r}${c}`);
  // the head plugs the way out
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) g.mon(7 + c, 1 + r, `head${r}${c}`);
  g.link(7, 1).link(8, 1);
  // jaws (sweeping turrets), seeker pods and mite hatches in the shell
  g.turret(5, 3, 'sweep').turret(10, 3, 'sweep');
  g.turret(3, 2, 'seeker').turret(12, 2, 'seeker');
  g.hatch(4, 3, false).hatch(11, 3, false);
  g.pickup(2, 8, 'repair').pickup(13, 8, 'nova');
  return {
    file: 's1c',
    kitFile: 'b1',
    title: 'The BIOS Bug',
    kind: 'boss',
    grid: g,
    kit: k,
    card: ['Shoot out its eyes, then', 'its crown, and fly out', 'through the hole.'],
  };
}
