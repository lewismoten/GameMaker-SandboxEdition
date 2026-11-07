// The dressing every level gets on top of its own blocks, so the same tile never makes a visible pattern:
//   ground   grass with fallen leaves, grass with a pebble, grass in a prop's shadow; dirt with pebbles, dirt with a root
//   sky      a thin wisp of cloud (two blocks), a pair of birds flapping (two pictures), a leaf drifting down (four)
//   far      distant hills in the haze, two blocks tall, in the sky's own darker shades (so every time of day tints
//            them): one piece for each pair of edge heights (0 none, 1 low, 2 high), so any run of them joins up
import { Pixels, dither, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../../kit/starter/palette';

/** Each ramp color one shade darker inside the ellipse (`cx`, `cy`, `rx`, `ry`), dithered at its rim. */
function shadeIn(pal: Pal, p: Pixels, ramps: string[], cx: number, cy: number, rx: number, ry: number): Pixels {
  const down = new Map<number, number>();
  for (const name of ramps) {
    const r = pal.r(name);
    r.forEach((c, k) => down.set(c, r[Math.max(0, k - 1)]));
  }
  return p.map((x, y, c) => {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d > 1 || !down.has(c)) return c;
    return d < 0.6 || dither(x, y, (1 - d) / 0.4) ? (down.get(c) as number) : c;
  });
}

/** Grass in a prop's shadow: a soft dark oval along its top. */
export const grassShade = (pal: Pal, grass: Pixels): Pixels => shadeIn(pal, grass.crop(0, 0, 20, 20), ['grass', 'dirt'], 10, 1, 11, 5);

/** Grass with a few fallen leaves (the day after Thanksgiving) or a pebble sunk in it. */
export function grassVariant(pal: Pal, grass: Pixels, kind: 'leaves' | 'pebble', seed: number): Pixels {
  const p = grass.crop(0, 0, 20, 20);
  const rand = rng(seed);
  if (kind === 'leaves') {
    const colors = [pal.c('orange', 3), pal.c('brick', 3), pal.c('gold', 4), pal.c('orange', 2)];
    for (let i = 0; i < 4; i++) {
      const x = 1 + Math.floor(rand() * 16);
      const y = Math.floor(rand() * 3);
      const c = colors[i % colors.length];
      p.rect(x, y, 3, 1, c).set(x + 1, y + 1, c);
    }
  } else {
    const s = pal.r('rock');
    const x = 3 + Math.floor(rand() * 12);
    p.rect(x, 8, 4, 3, s[2])
      .rect(x + 1, 8, 2, 1, s[4])
      .rect(x, 10, 4, 1, s[1]);
  }
  return p;
}

/** Dirt with pebbles, or with an old root running through it. */
export function dirtVariant(pal: Pal, dirt: Pixels, kind: 'pebbles' | 'root', seed: number): Pixels {
  const p = dirt.crop(0, 0, 20, 20);
  const rand = rng(seed);
  if (kind === 'pebbles') {
    const s = pal.r('rock');
    for (let i = 0; i < 3; i++) {
      const x = 1 + Math.floor(rand() * 15);
      const y = 1 + Math.floor(rand() * 15);
      p.rect(x, y, 3, 2, s[2])
        .set(x, y, s[4])
        .set(x + 2, y + 1, s[1]);
    }
  } else {
    const w = pal.r('wood');
    let y = 5 + Math.floor(rand() * 8);
    for (let x = 0; x < 20; x++) {
      if (x % 5 === 2) y += rand() < 0.5 ? -1 : 1;
      p.set(x, y, w[1]).set(x, y + 1, w[0]);
    }
    p.set(9, y - 1, w[1]).set(8, y - 2, w[1]);
  }
  return p;
}

/** A thin wisp of high cloud, 40x20, cut into two blocks. */
export function wisp(pal: Pal): [Pixels, Pixels] {
  const p = new Pixels(40, 20, skyOf(pal));
  const hi = pal.c('sky', 5);
  const mid = pal.c('sky', 4);
  for (let x = 3; x < 37; x++) {
    const t = Math.sin(((x - 3) / 34) * Math.PI);
    const y = 9 + Math.round(Math.sin(x / 6) * 1.5);
    const len = t * 2.2;
    for (let dy = -2; dy <= 2; dy++) {
      const a = len - Math.abs(dy);
      if (a > 0.9) p.set(x, y + dy, dy <= 0 ? hi : mid);
      else if (a > 0 && dither(x, y + dy, a)) p.set(x, y + dy, mid);
    }
  }
  return [p.crop(0, 0, 20, 20), p.crop(20, 0, 20, 20)];
}

/** Two birds far off, wings up (`f` 0) or down (1). */
export function birds(pal: Pal, f: 0 | 1): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('sky', 0);
  const bird = (x: number, y: number, s: number) => {
    p.set(x, y, ink);
    if (f === 0) for (let i = 1; i <= s; i++) p.set(x - i, y - i + (i > 1 ? 1 : 0), ink).set(x + i, y - i + (i > 1 ? 1 : 0), ink);
    else for (let i = 1; i <= s; i++) p.set(x - i, y + (i > 1 ? 1 : 0), ink).set(x + i, y + (i > 1 ? 1 : 0), ink);
  };
  bird(6, 8, 3);
  bird(14, 12, 2);
  return p;
}

/** A leaf drifting down through the air: frame `f` of four. */
export function leaf(pal: Pal, f: number): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const x = 8 + Math.round(Math.sin(f * 1.6) * 5);
  const y = 2 + f * 4;
  const c = f % 2 ? pal.c('brick', 3) : pal.c('orange', 3);
  if (f % 2) p.rect(x, y, 3, 1, c).set(x + 1, y + 1, pal.c('orange', 1));
  else p.rect(x, y, 1, 3, c).set(x + 1, y + 1, c);
  return p;
}

/** Edge heights of the far hills, in pixels from the bottom of their 40-pixel strip. */
const FAR_H = [0, 17, 29] as const;

/**
 * A piece of the distant hills, 20 wide and 40 tall (two blocks: top, bottom), joining edge height `a` on its left
 * to `b` on its right (0 none, 1 low, 2 high). The hills are the sky's own deeper shades, lighter toward their
 * hazy foot, and a high piece has a pale snowy crest.
 */
export function farHill(pal: Pal, a: 0 | 1 | 2, b: 0 | 1 | 2, seed: number): [Pixels, Pixels] {
  const p = new Pixels(20, 40, skyOf(pal));
  const s = pal.r('sky');
  const rand = rng(seed);
  const bump = 1 + rand() * 5;
  for (let x = 0; x < 20; x++) {
    const t = x / 20;
    const e = t * t * (3 - 2 * t);
    let h = FAR_H[a] + (FAR_H[b] - FAR_H[a]) * e;
    if (a && b) h += Math.sin(t * Math.PI) * bump * (a === b ? 1 : 0.5) + Math.sin(t * Math.PI * 3 + seed) * 1.2 * Math.sin(t * Math.PI);
    const top = Math.round(40 - h);
    for (let y = top; y < 40; y++) {
      const fade = (y - 22) / 11; // the foot melts into the haze
      let c = y - top < 2 ? s[0] : y - top < 9 ? s[1] : dither(x, y, (y - top - 9) / 8) ? s[2] : s[1];
      if (fade >= 1) c = s[3];
      else if (fade > 0.5) c = dither(x, y, (fade - 0.5) * 2) ? s[3] : s[2];
      else if (fade > 0 && dither(x, y, fade * 2)) c = s[2];
      if (h > 30 && y - top < 2 && (x + y) % 3) c = s[5]; // snow on the high crests
      p.set(x, y, c);
    }
  }
  return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
}
