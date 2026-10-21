// Stage 3: THE SOUND CARD. A red Sound Blaster board: the FM chip, audio jacks, volume
// knobs, VU meters dancing, and big speaker cones that thump the ship forward when they
// push out (a gravity block that is only there on the beat).
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, bevel, blob, micro, shadeAt } from '../art/draw';
import { pics } from '../../enemies';
import type { Bestiary } from '../../mons';
import type { Pal } from '../art/pal';
import { bomb, cluster, disc, keyOf, mite, note, wasp } from '../../sprites';
import { onFloor, slices, type StageArt } from './tiles';

export function soundArt(p: Pal): StageArt {
  const floor = (v: number): Pixels => {
    const t = new Pixels(20, 20);
    const r = rng(v * 7 + 5);
    t.map((x, y) => shadeAt(p.r('base'), 1, 2, 0.35 + r() * 0.25, x, y));
    if (v === 1) for (let x = 0; x < 20; x++) t.set(x, 10 + Math.round(Math.sin(x / 3.2) * 4), p.c('base', 4));
    if (v === 2) {
      blob(t, 9.5, 9.5, 3, 3, p.r('trim'), 2, 5);
      t.rect(9, 9, 2, 2, p.c('deep', 0));
    }
    if (v === 3) micro(t, 3, 7, 'SB16', p.c('base', 5));
    if (v === 4)
      for (let x = 0; x < 20; x++)
        t.set(x, 6 + Math.round(Math.sin(x / 1.6) * 2), p.c('base', 4)).set(x, 14 + Math.round(Math.sin(x / 1.6) * 2), p.c('base', 3));
    return t;
  };
  const edge = (side: 'L' | 'R', v: number): Pixels => {
    // the speaker grille on the card's bracket
    const t = new Pixels(20, 20, p.c('deep', 0));
    for (let y = 1; y < 20; y += 4) for (let x = (y >> 2) % 2 ? 2 : 4; x < 18; x += 4) t.rect(x, y, 2, 2, p.c('deep', 3));
    t.rect(side === 'L' ? 19 : 0, 0, 1, 20, p.c('trim', 4));
    if (v === 1) bevel(t, 4, 6, 12, 8, p.r('trim'), 3, 1);
    return t;
  };
  return { pal: p, floor, edge, floors: 5, edges: 2 };
}

/** A speaker cone (4 x 4), the dust cap pushed out or in. */
function speaker(a: StageArt, out: boolean): Pixels {
  const p = a.pal;
  const big = onFloor(a, 4, 4);
  blob(big, 40, 40, 39, 39, p.r('trim'), 1, 4);
  blob(big, 40, 40, 34, 34, p.r('deep'), 0, 2);
  for (let r = 10; r < 34; r += 6)
    for (let k = 0; k < 120; k++) {
      const an = (k / 120) * Math.PI * 2;
      big.set(40 + Math.cos(an) * r, 40 + Math.sin(an) * r, p.c('deep', out ? 3 : 2));
    }
  blob(big, 40, 40, out ? 13 : 10, out ? 13 : 10, p.r(out ? 'glow' : 'deep'), out ? 1 : 1, out ? 4 : 3);
  for (let k = 0; k < 8; k++) {
    const an = (k * Math.PI) / 4;
    big.rect(40 + Math.cos(an) * 36, 40 + Math.sin(an) * 36, 3, 3, p.c('steel', 5));
  }
  return big;
}

/** The FM chip (3 x 3). */
function fmChip(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 3, 3);
  for (let i = 0; i < 9; i++) {
    const k = 8 + i * 5;
    big.rect(k, 1, 2, 6, p.c('steel', 5)).rect(k, 53, 2, 6, p.c('steel', 5));
    big.rect(1, k, 6, 2, p.c('steel', 5)).rect(53, k, 6, 2, p.c('steel', 5));
  }
  bevel(big, 6, 6, 48, 48, p.r('deep'), 1, 2);
  micro(big, 12, 18, 'YMF262', p.c('label', 4));
  micro(big, 16, 28, 'OPL3', p.c('glow', 3));
  micro(big, 14, 38, 'YAMAHA', p.c('label', 2));
  return big;
}

function jack(a: StageArt, ramp: string): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  bevel(t, 2, 2, 16, 16, p.r('deep'), 1, 1);
  blob(t, 10, 10, 6, 6, p.r(ramp), 1, 4);
  blob(t, 10, 10, 2.5, 2.5, p.r('deep'), 0, 0);
  return t;
}

/** A VU meter column (4 frames, bouncing). */
function vu(a: StageArt, level: number): Pixels {
  const p = a.pal;
  const t = a.floor(0);
  bevel(t, 3, 0, 14, 20, p.r('deep'), 0, 1);
  for (let i = 0; i < 6; i++) {
    const lit = 5 - i < level;
    const ramp = i < 2 ? 'red' : i < 3 ? 'gold' : 'slime';
    t.rect(5, 1 + i * 3, 10, 2, lit ? p.c(ramp, 3) : p.c(ramp, 0));
  }
  return t;
}

function knob(a: StageArt): Pixels {
  const p = a.pal;
  const big = onFloor(a, 2, 2);
  blob(big, 20, 20, 17, 17, p.r('deep'), 0, 3);
  blob(big, 20, 20, 13, 13, p.r('steel'), 2, 6);
  big.rect(19, 6, 3, 12, p.c('red', 2));
  for (let k = 0; k < 11; k++) {
    const an = Math.PI * 0.75 + (k / 10) * Math.PI * 1.5;
    big.set(20 + Math.cos(an) * 19, 20 + Math.sin(an) * 19, p.c('label', 4));
  }
  return big;
}

export function soundTiles(bs: BlockSet, a: StageArt): void {
  // the speaker's middle 2x2 thumps: out (with a forward push) and in
  const out = speaker(a, true);
  const inn = speaker(a, false);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const mid = r > 0 && r < 3 && c > 0 && c < 3;
      if (!mid) bs.add(`spk${r}${c}`, out.crop(c * 20, r * 20, 20, 20));
      else {
        bs.add(`spk${r}${c}`, inn.crop(c * 20, r * 20, 20, 20), { next: `spkO${r}${c}`, ntime: 14 });
        bs.add(`spkO${r}${c}`, out.crop(c * 20, r * 20, 20, 20), { next: `spk${r}${c}`, ntime: 8, grav: 1 });
      }
    }
  slices(bs, 'fm', fmChip(a));
  bs.add('jackG', jack(a, 'slime'));
  bs.add('jackP', jack(a, 'pink'));
  bs.add('jackB', jack(a, 'blue'));
  const levels = [2, 5, 3, 6, 1, 4];
  levels.forEach((l, i) => bs.add(`vu${i}`, vu(a, l), { next: `vu${(i + 1) % levels.length}`, ntime: 3 }));
  slices(bs, 'knob', knob(a));
}

export function soundVirus(b: Bestiary, p: Pal): void {
  pics(b, 'mite', ...mite(keyOf(p, { main: 'cyan', accent: 'pink' })));
  const [n0, n1] = note(keyOf(p, { main: 'virus', accent: 'slime' }));
  pics(b, 'note', n0, n1);
  const [g0, g1] = note(keyOf(p, { main: 'slime', accent: 'virus' }));
  pics(b, 'noteG', g0, g1);
  pics(b, 'wasp', ...wasp(keyOf(p, { main: 'gold', accent: 'cyan' })));
  pics(b, 'amp', ...bomb(keyOf(p, { main: 'blue', accent: 'red' })));
  pics(b, 'disc', ...disc(p, { main: 'grey', accent: 'cyan' }));
  pics(b, 'cluster', ...cluster(p, { main: 'pink', accent: 'gold' }));
}
