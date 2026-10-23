// Boss 5: GLITCH, the virus itself, a skull of corrupted pixels the width of the die. Its
// face is the arena's wall, its eye sockets and cheeks are turrets, its brain plugs the way
// out behind a sliding grille, and its leak slugs hunt the ship around the arena.
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, bevel, blob, micro, shadeAt } from '../art/draw';
import { armor, opaque, slicesOf, tint, weakPoint } from './boss';
import { mite, pics, stalker } from '../characters/enemies';
import { arena } from '../stages/mapkit';
import type { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { keyOf, mite as miteArt, slug } from '../sprites/sprites';
import { kit, type Leg } from '../stages/stage';
import type { BlockSet } from '../art/draw';
import type { StageArt } from '../blocks/tiles';
import { POWER } from '../ids';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../../../web/src/formats/blocks';

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;

/** The face: 14 x 4 blocks of corrupted skull, with the brain's hole in the middle. */
function face(p: Pal): Pixels {
  const big = new Pixels(280, 80, CLEAR);
  const r = rng(13);
  for (let y = 0; y < 80; y++)
    for (let x = 0; x < 280; x++) {
      const nx = (x - 140) / 138;
      if (x >= 120 && x < 160) continue;
      const ny = (y + 10) / 84;
      if (nx * nx + ny * ny * ny > 1) continue;
      let c = shadeAt(p.r('grey'), 3, 6, 0.6 - Math.abs(nx) * 0.4 - ny * 0.2, x, y);
      if (y % 6 === 0 && r() < 0.5) c = p.c('virus', 2 + Math.floor(r() * 3));
      big.set(x, y, c);
    }
  // glitch: torn scanlines shifted sideways
  for (let i = 0; i < 9; i++) {
    const y = Math.floor(r() * 76);
    const sh = Math.floor(r() * 9) - 4;
    const row = big.crop(0, y, 280, 2);
    big.blit(row, sh, y, CLEAR);
    big.rect(Math.floor(r() * 260), y, 8 + Math.floor(r() * 20), 2, p.c(r() < 0.5 ? 'slime' : 'glow', 3));
  }
  // eye sockets and cheekbones
  for (const s of [-1, 1]) {
    blob(big, 140 + s * 70, 46, 26, 20, p.r('ink'), 0, 0);
    blob(big, 140 + s * 70, 46, 10, 8, p.r('glow'), 1, 4);
    big.rect(140 + s * 108 - 10, 60, 20, 4, p.c('grey', 2));
  }
  micro(big, 30, 8, 'GLITCH', p.c('virus', 5));
  micro(big, 222, 8, 'V1.0', p.c('virus', 5));
  // the brain's hole
  big.rect(120, 0, 40, 80, CLEAR);
  big.rect(118, 0, 2, 76, p.c('ink', 0)).rect(160, 0, 2, 76, p.c('ink', 0));
  return big;
}

/** The brain (2 x 2): a pulsing mass of corrupted code. */
function brain(p: Pal, k: number): Pixels {
  const big = new Pixels(40, 40, CLEAR);
  blob(big, 20, 20, 19, 19, p.r('virus'), 0, 4);
  const r = rng(5 + k);
  for (let i = 0; i < 16; i++) {
    const x = 6 + Math.floor(r() * 26);
    const y = 6 + Math.floor(r() * 26);
    big.rect(x, y, 3 + Math.floor(r() * 4), 2, p.c(i % 2 ? 'slime' : 'pink', 2 + (k ? 2 : 0)));
  }
  for (let a = 0; a < 6; a++) big.line(20, 20, 20 + Math.cos(a + k) * 15, 20 + Math.sin(a + k) * 15, p.c('virus', 5));
  blob(big, 20, 20, 5, 5, p.r('glow'), k ? 2 : 1, 4);
  return big;
}

function bar(p: Pal): Pixels {
  const t = new Pixels(20, 20, CLEAR);
  bevel(t, 0, 6, 20, 8, p.r('trim'), 3, 1);
  for (let x = 2; x < 20; x += 4) t.rect(x, 9, 2, 2, p.c('ink', 0));
  return t;
}

/** The arena floor's quiet glitch: torn dashes in two dark shades, darker than any bullet. */
function calm(a: StageArt, seed: number): Pixels {
  const t = a.floor(0);
  const r = rng(seed);
  for (let i = 0; i < 4; i++) t.rect(Math.floor(r() * 16), 1 + Math.floor(r() * 18), 3 + Math.floor(r() * 3), 1, a.pal.c('deep', i % 2 ? 0 : 2));
  return t;
}

function bossTiles(bs: BlockSet, a: StageArt): void {
  bs.add('calm0', calm(a, 21));
  bs.add('calm1', calm(a, 22));
  const s = slicesOf(face(a.pal), 14, 4);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 14; c++) {
      if (!opaque(s[r][c])) continue;
      const t = new Pixels(20, 20);
      t.px.set(a.floor(0).px);
      t.blit(s[r][c], 0, 0, CLEAR);
      bs.add(`face${r}${c}`, t, { solid: SOLID });
    }
}

function bossVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...miteArt(keyOf(p, { main: 'virus', accent: 'gold' })));
  mite(b, 'mite', [
    [3, 2, 6],
    [-6, 3, 6],
    [6, 3, 6],
    [-3, 10, 7],
  ]);
  const b0 = slicesOf(brain(p, 0), 2, 2);
  const b1 = slicesOf(brain(p, 1), 2, 2);
  const hurt = (q: Pixels) => tint(q, (c) => (p.r('virus').includes(c) ? p.c('red', 1 + (p.r('virus').indexOf(c) >> 1)) : c));
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 2; c++)
      weakPoint(b, `head${r}${c}`, r === 0 ? 7 : 10, (h) => (h <= 3 ? [hurt(b0[r][c]), hurt(b1[r][c])] : [b0[r][c], b1[r][c]]), { score: 2500, anim: 3 });
  armor(b, 'grilleArt', bar(p));
  b.add('grille', {
    power: POWER.armor,
    pics: [['grilleArt', 50]],
    path: [
      [2, 0, 3],
      [-4, 0, 3],
      [2, 0, 3],
    ],
  });
  pics(b, 'slug', ...slug(keyOf(p, { main: 'red', accent: 'gold' })));
  stalker(b, 'slug', { hp: 4, speed: 1, score: 500 });
}

export function bossGlitch(art: StageArt): Leg {
  const k = kit(
    art,
    (bs) => bossTiles(bs, art),
    (b) => bossVirus(b, art.pal),
    { mite: 'mite', turretEvery: 9, seekerEvery: 34, flakEvery: 26, hatchShut: 36, hatchOpen: 24, hatchEvery: 7 },
  );
  const g = arena(k.bs, k.beasts, art, 17);
  // a quiet floor, so the bullets stand out (the bright glitch speckle stays in the scrolling legs)
  g.rect(1, 0, 14, 10, (c, d) => ((c * 3 + d * 5) % 11 === 0 ? 'calm0' : (c * 5 + d * 3) % 13 === 0 ? 'calm1' : 'floor0'));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) if (k.bs.has(`face${r}${c}`)) g.set(1 + c, r, `face${r}${c}`);
  g.set(7, 0, 'gate0').set(8, 0, 'gate2');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) g.mon(7 + c, 1 + r, `head${r}${c}`);
  g.link(7, 1).link(8, 1);
  for (const c of [2, 5, 8, 11]) g.mon(c, 4, 'grille');
  // eyes, cheeks and nose
  g.turret(4, 2, 'sweep').turret(11, 2, 'sweep');
  g.turret(2, 3, 'flak').turret(13, 3, 'flak');
  g.turret(6, 3, 'seeker').turret(9, 3, 'seeker');
  g.hatch(1, 4, false).hatch(14, 4, false);
  g.mon(2, 9, 'slug').mon(13, 9, 'slug');
  g.pickup(1, 8, 'repair').pickup(14, 8, 'repair').pickup(1, 6, 'nova').pickup(14, 6, 'nova');
  return {
    file: 's5c',
    kitFile: 'b5',
    title: 'GLITCH',
    kind: 'boss',
    grid: g,
    kit: k,
    card: ['The virus itself. Blast its', 'brain out through the', 'grille, then fly home!'],
  };
}
