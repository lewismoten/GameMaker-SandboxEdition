// DAY AND NIGHT's pictures. Each is drawn once, and shows in whichever palette the scene loads:
// the sun that is a moon, stars that only show at night, windows and lanterns that only glow at
// night, a roof, and the gate that a lantern hangs on. Colors from the ramps named orb, lamp and
// star are the ones the palettes change most (palettes.ts); the rest are the Starters' own.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

const sky = (pal: Pal) => new Pixels(20, 20, skyOf(pal));

/** The sun by day, the moon by night: a disc with a few round marks (sunspots, or craters). */
export function orb(pal: Pal): Pixels {
  const o = pal.r('orb');
  const p = sky(pal);
  p.disc(10, 10, 9, o[0]).disc(10, 10, 8, o[1]).disc(8, 8, 4, o[2]);
  p.disc(13, 12, 2, o[0]).disc(7, 14, 1.5, o[0]).disc(14, 6, 1.2, o[0]);
  return p;
}

/** A star: a small plus with a bright heart, in the one slot that is the sky's color by day. */
export function star(pal: Pal): Pixels {
  const s = pal.r('star')[0];
  const p = sky(pal);
  p.rect(9, 6, 2, 8, s).rect(6, 9, 8, 2, s).rect(8, 8, 4, 4, s);
  return p;
}

/** The brick block with a window in it: shutters of wood, and glass in the lamp ramp (dull by day, lit by night). */
export function windowBrick(pal: Pal, brick: Pixels): Pixels {
  const { c, r } = pal;
  const g = r('lamp');
  const w = r('wood');
  const p = new Pixels(20, 20);
  p.px.set(brick.px);
  p.rect(3, 2, 14, 16, w[1]).rect(5, 4, 10, 12, g[1]).rect(5, 4, 10, 1, g[0]).rect(5, 15, 10, 1, g[0]);
  p.rect(9, 4, 2, 12, w[2]).rect(5, 9, 10, 2, w[2]);
  p.rect(7, 6, 2, 2, g[2]).rect(12, 12, 2, 2, g[2]);
  p.frame(3, 2, 14, 16, c('ink', 0));
  return p;
}

/** The brick block over the door with a lantern in it. */
export function lanternBrick(pal: Pal, brick: Pixels): Pixels {
  const { c, r } = pal;
  const g = r('lamp');
  const p = new Pixels(20, 20);
  p.px.set(brick.px);
  p.rect(4, 3, 12, 14, c('ink', 0)).rect(5, 4, 10, 12, g[1]).rect(7, 6, 6, 8, g[2]).rect(9, 8, 2, 4, g[2]);
  p.rect(9, 0, 2, 3, c('ink', 0)).rect(4, 16, 12, 2, c('ink', 0));
  return p;
}

/** A roof tile row: red tiles on a low slope. */
export function roof(pal: Pal): Pixels {
  const t = pal.r('brick');
  const p = sky(pal);
  p.rect(0, 6, 20, 14, t[2]);
  for (let y = 6; y < 20; y += 4) {
    p.rect(0, y, 20, 1, t[4]).rect(0, y + 3, 20, 1, t[0]);
    for (let x = (y / 4) % 2 ? 0 : 5; x < 20; x += 10) p.rect(x, y + 1, 1, 3, t[0]);
  }
  p.rect(0, 4, 20, 2, t[1]).rect(0, 4, 20, 1, t[3]);
  return p;
}

/** The top of a street lamp: a lantern in a cage on a bracket. */
export function postTop(pal: Pal): Pixels {
  const { c, r } = pal;
  const g = r('lamp');
  const s = r('stone');
  const p = sky(pal);
  p.rect(9, 10, 2, 10, s[0]).rect(5, 2, 10, 2, s[0]).rect(6, 3, 8, 1, s[2]);
  p.rect(5, 4, 10, 8, c('ink', 0)).rect(6, 5, 8, 6, g[1]).rect(8, 6, 4, 4, g[2]).rect(9, 7, 2, 2, g[2]);
  p.rect(6, 11, 8, 1, s[0]);
  return p;
}

/** The pole of a street lamp (plain, so a lamp can stand on any ground). */
export function post(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = sky(pal);
  p.rect(9, 0, 2, 20, s[0]).rect(10, 0, 1, 20, s[2]);
  return p;
}

/** A pillar of a gate. */
export function pillar(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = sky(pal);
  p.rect(4, 0, 12, 20, s[2]).rect(4, 0, 2, 20, s[4]).rect(14, 0, 2, 20, s[1]);
  for (let y = 5; y < 20; y += 7) p.rect(4, y, 12, 1, s[1]);
  return p;
}

/** The top of a gate: the left capital, the lintel with a hanging lantern, the right capital. */
export function gateTop(pal: Pal, part: 'l' | 'm' | 'r'): Pixels {
  const { c, r } = pal;
  const s = r('stone');
  const g = r('lamp');
  const p = sky(pal);
  const x0 = part === 'l' ? 2 : 0;
  const x1 = part === 'r' ? 18 : 20;
  p.rect(x0, 0, x1 - x0, 8, s[2]).rect(x0, 0, x1 - x0, 2, s[4]).rect(x0, 6, x1 - x0, 2, s[1]);
  if (part === 'm') {
    p.rect(9, 8, 2, 3, c('ink', 0)).rect(5, 10, 10, 8, c('ink', 0)).rect(6, 11, 8, 6, g[1]).rect(8, 12, 4, 4, g[2]);
  } else {
    p.rect(part === 'l' ? 4 : 4, 8, 12, 12, s[2]).rect(part === 'l' ? 4 : 14, 8, 2, 12, part === 'l' ? s[4] : s[1]);
    if (part === 'l') p.rect(4, 8, 2, 12, s[4]).rect(14, 8, 2, 12, s[1]);
  }
  return p;
}
