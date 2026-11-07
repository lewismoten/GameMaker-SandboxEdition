// The monsters' pictures, 20x20 on clear: a rolling pebble, Nutmeg the squirrel, glow-worms on their silk
// threads, Wisp (the mountain's own little cloud), fog that drifts off, the sun, the hens, and two neighbors
// (each two blocks tall: a top and a bottom that walk together) with their word-free speech bubbles.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import type { Pal } from '../../../kit/starter/palette';

const T = 255;
const ink = (pal: Pal, p: Pixels) => outline(p, pal.c('ink', 0), { transparent: T });

/** A pebble that rolls: a speckled stone with a highlight that turns (frame 0 or 1). */
export function pebble(pal: Pal, frame: number): Pixels {
  const p = new Pixels(20, 20, T);
  const s = pal.r('rock');
  blob(p, 10, 13, 6.5, 6, s, 1, 4);
  const spots = frame ? [7, 15, 12, 10] : [12, 15, 8, 11];
  p.rect(spots[0], spots[1], 2, 1, s[0]).rect(spots[2], spots[3], 1, 2, s[0]);
  return ink(pal, p);
}

/** Nutmeg the squirrel: bounding (frames 0 and 1) or sitting up with an acorn. */
export function squirrel(pal: Pal, how: 0 | 1 | 'sit'): Pixels {
  const p = new Pixels(20, 20, T);
  const f = pal.r('orange');
  const tail = pal.r('brick');
  if (how === 'sit') {
    blob(p, 4, 9, 4, 7, tail, 1, 4);
    blob(p, 11, 13, 4, 5, f, 0, 3);
    blob(p, 12, 6, 3.5, 3, f, 1, 4);
    p.rect(10, 2, 2, 2, f[1]).set(14, 6, pal.c('ink', 0));
    p.disc(14, 11, 2, pal.c('wood', 1));
  } else {
    const up = how === 0 ? 0 : 2;
    blob(p, 4, 7 + up, 4.5, 4, tail, 1, 4);
    blob(p, 10, 13, 5.5, 3.5, f, 0, 3);
    blob(p, 15, 11, 3, 2.6, f, 1, 4);
    p.rect(14, 8, 2, 2, f[1]).set(17, 10, pal.c('ink', 0));
    p.rect(how === 0 ? 6 : 8, 16, 2, 3, f[1]).rect(how === 0 ? 13 : 11, 16, 2, 3, f[1]);
  }
  return ink(pal, p);
}

/** A glow-worm on its silk thread: dark, an ember, dim or bright (dotted rings so the dark shows through). */
export function glowWorm(pal: Pal, frame: 0 | 1 | 2 | 3): Pixels {
  const p = new Pixels(20, 20, T);
  const g = pal.r('glow');
  p.rect(10, 0, 1, 9, pal.c('stone', 1));
  const rings: [number, number, number][][] = [
    [],
    [[1.2, 1, 1]],
    [
      [1.4, 3, 1],
      [3, 2, 2],
      [4.6, 1, 3],
    ],
    [
      [1.4, 4, 1],
      [2.6, 3, 1],
      [4.2, 2, 2],
      [6.4, 1, 3],
    ],
  ][frame];
  for (const [r, shade, every] of [...rings].reverse())
    p.map((x, y, c) => ((x + 0.5 - 10.5) ** 2 + (y + 0.5 - 11) ** 2 <= r * r && (x + y) % every === 0 ? g[shade] : c));
  p.set(10, 10, pal.c('ink', 1));
  return p;
}

/** Wisp, the mountain's little cloud: two soft frames, `mood` sad (a few snowflakes falling under it) or happy. */
export function wisp(pal: Pal, frame: 0 | 1, mood: 'sad' | 'happy'): Pixels {
  const p = new Pixels(20, 20, T);
  const w = pal.r('white');
  const y = frame ? 1 : 0;
  blob(p, 6, 10 + y, 4.5, 3.5, w, 0, 3);
  blob(p, 13, 9 + y, 5.5, 4.5, w, 0, 3);
  blob(p, 10, 7 + y, 4.5, 4, w, 1, 3);
  const k = pal.c('ink', 0);
  p.set(8, 9 + y, k).set(12, 9 + y, k);
  if (mood === 'happy') p.set(9, 11 + y, k).set(10, 12 + y, k).set(11, 11 + y, k);
  else {
    p.rect(9, 12 + y, 3, 1, k);
    const d = pal.c('white', 3);
    for (const [x, dy] of [
      [6, frame ? 16 : 15],
      [11, frame ? 15 : 17],
      [15, frame ? 17 : 16],
    ])
      p.set(x, dy, d);
  }
  return ink(pal, p);
}

/** A bank of fog that drifts off: dotted, so what is behind it shows through. */
export function fogPuff(pal: Pal, frame: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  const f = pal.r('fog');
  const tau = (Math.PI * 2) / 20;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const a = Math.sin((x + frame * 3) * tau) * 0.6 + Math.sin((y + x * 0.0) * tau * 2 + frame) * 0.4;
      if ((x + y + frame) % 2 === 0) p.set(x, y, f[a > 0.3 ? 3 : 2]);
      else if (a > 0.45) p.set(x, y, f[1]);
    }
  return p;
}

/** A wisp of mist: a soft round puff, dotted so the park shows through. */
export function mist(pal: Pal, frame: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  const f = pal.r('fog');
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const d = ((x - 9.5) / 9.5) ** 2 + ((y - 11 + frame) / 6.5) ** 2;
      if (d < 1 && ((x + y + frame) % 2 === 0 || d < 0.3)) p.set(x, y, f[d < 0.3 ? 3 : d < 0.7 ? 2 : 1]);
    }
  return p;
}

/** The sun: a warm disc with a soft rim. */
export function sun(pal: Pal): Pixels {
  const p = new Pixels(20, 20, T);
  const g = pal.r('gold');
  p.disc(10, 10, 9, g[3]).disc(10, 10, 7, g[4]).disc(8, 8, 3, g[5]);
  return p;
}

/** A hen: pecking or standing (frames 0 and 1). */
export function hen(pal: Pal, frame: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  const w = pal.r('white');
  blob(p, 9, 13, 6, 4.5, w, 0, 3);
  const hx = frame ? 15 : 14;
  const hy = frame ? 11 : 7;
  p.disc(hx, hy, 2.6, w[3]).set(hx + 1, hy - 1, pal.c('ink', 0));
  p.rect(hx + 2, hy, 2, 1, pal.c('orange', 3)).rect(hx - 1, hy - 3, 2, 1, pal.c('red', 2));
  p.rect(2, 10, 3, 2, w[1]);
  p.rect(8, 17, 1, 3, pal.c('orange', 2)).rect(11, 17, 1, 3, pal.c('orange', 2));
  return ink(pal, p);
}

/** A neighbor, two blocks tall. `who` sets their colors; `part` top (head and shoulders) or bottom (coat and legs, walking frame 0 or 1). */
export interface Neighbor {
  skin: [string, number];
  hair: [string, number];
  coat: string;
  hat?: string;
}

export const OKORO: Neighbor = { skin: ['wood', 1], hair: ['ink', 0], coat: 'purple', hat: 'gold' };
export const HALE: Neighbor = { skin: ['skin', 2], hair: ['white', 2], coat: 'blue' };

export function neighborTop(pal: Pal, n: Neighbor): Pixels {
  const p = new Pixels(20, 20, T);
  const coat = pal.r(n.coat);
  const skin = pal.c(...n.skin);
  p.rect(4, 14, 12, 6, coat[2]).rect(4, 14, 12, 1, coat[3]);
  p.disc(10, 8, 5, skin);
  const hair = pal.c(...n.hair);
  if (n.hat) p.rect(4, 1, 12, 4, pal.c(n.hat, 3)).rect(3, 4, 14, 1, pal.c(n.hat, 2));
  else p.rect(5, 3, 10, 2, hair).set(4, 5, hair).set(15, 5, hair);
  p.set(12, 7, pal.c('ink', 0)).set(8, 7, pal.c('ink', 0));
  p.rect(9, 10, 3, 1, pal.c('ink', 0));
  return ink(pal, p);
}

export function neighborBottom(pal: Pal, n: Neighbor, frame: 0 | 1): Pixels {
  const p = new Pixels(20, 20, T);
  const coat = pal.r(n.coat);
  p.rect(4, 0, 12, 12, coat[2]).rect(4, 0, 2, 12, coat[3]).rect(9, 2, 1, 9, coat[1]);
  p.rect(2, 1, 2, 8, coat[1]).rect(16, 1, 2, 8, coat[1]);
  const leg = pal.c('ink', 1);
  if (frame) p.rect(5, 12, 3, 7, leg).rect(12, 12, 3, 7, leg);
  else p.rect(7, 12, 3, 7, leg).rect(10, 12, 3, 7, leg);
  p.rect(4, 18, 4, 2, pal.c('ink', 0)).rect(11, 18, 4, 2, pal.c('ink', 0));
  return ink(pal, p);
}

/** A word-free speech bubble: '!' (surprise), '?' (puzzled) or a heart. */
export function bubble(pal: Pal, what: '!' | '?' | 'heart'): Pixels {
  const p = new Pixels(20, 20, T);
  const w = pal.c('white', 3);
  p.disc(10, 8, 7.5, w).rect(6, 14, 3, 3, w).set(5, 17, w);
  const k = pal.c('ink', 0);
  if (what === '!') p.rect(9, 3, 2, 7, k).rect(9, 11, 2, 2, k);
  else if (what === '?')
    p.rect(8, 3, 4, 1, k)
      .rect(12, 4, 1, 3, k)
      .rect(10, 7, 2, 1, k)
      .rect(10, 8, 1, 2, k)
      .rect(10, 11, 1, 2, k)
      .set(7, 4, k);
  else {
    const r = pal.c('red', 2);
    p.disc(8, 7, 2.5, r).disc(12, 7, 2.5, r);
    for (let y = 8; y < 13; y++) p.rect(6 + (y - 8), y, 9 - (y - 8) * 2, 1, r);
  }
  return ink(pal, p);
}

/** The mountain's eye, 40x40 cut into four 20x20 parts (TL, TR, BL, BR): open (white, a dark pupil, a shine), a blink, or shut asleep. */
export function bigEye(pal: Pal, how: 'open' | 'blink' | 'shut'): Pixels[] {
  const p = new Pixels(40, 40, T);
  const ink = pal.c('ink', 0);
  const r = pal.r('rock');
  if (how === 'open') {
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (((x - 19.5) / 15) ** 2 + ((y - 21) / 13) ** 2 <= 1) p.set(x, y, pal.c('white', 3));
    p.disc(21, 23, 8, ink).disc(21, 23, 4, pal.c('ink', 1)).disc(17, 19, 3, pal.c('white', 3)).set(25, 27, pal.c('white', 2));
    // a heavy, sleepy lid
    for (let x = 4; x <= 35; x++) {
      const y = 21 - Math.round(Math.sqrt(Math.max(0, 1 - ((x - 19.5) / 15.5) ** 2)) * 13);
      p.rect(x, y, 1, 3, r[0]);
    }
  } else if (how === 'blink') {
    p.rect(4, 22, 32, 3, ink).rect(6, 21, 28, 1, r[1]);
  } else {
    for (let x = 4; x <= 35; x++) {
      const y = 18 + Math.round(Math.sqrt(Math.max(0, 1 - ((x - 19.5) / 15.5) ** 2)) * 8);
      p.rect(x, y, 1, 3, ink);
    }
    for (const x of [8, 15, 24, 31]) p.rect(x, 27 + (x === 15 || x === 24 ? 2 : 0), 1, 3, ink);
  }
  const out = outline(p, ink, { transparent: T });
  return [out.crop(0, 0, 20, 20), out.crop(20, 0, 20, 20), out.crop(0, 20, 20, 20), out.crop(20, 20, 20, 20)];
}

/** The mountain's mouth, 40x20 cut into two parts (L, R): a gentle smile, or a big round yawn. */
export function bigMouth(pal: Pal, yawn: boolean): Pixels[] {
  const p = new Pixels(40, 20, T);
  const ink = pal.c('ink', 0);
  if (yawn) {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) if (((x - 19.5) / 12) ** 2 + ((y - 10) / 8.5) ** 2 <= 1) p.set(x, y, pal.c('ink', 1));
    for (let y = 10; y < 20; y++) for (let x = 0; x < 40; x++) if (((x - 19.5) / 7) ** 2 + ((y - 15) / 3.5) ** 2 <= 1) p.set(x, y, pal.c('brick', 3));
  } else
    for (let x = 4; x <= 35; x++) {
      const y = 4 + Math.round(Math.sqrt(Math.max(0, 1 - ((x - 19.5) / 15.5) ** 2)) * 9);
      p.rect(x, y, 1, 3, ink);
    }
  const out = outline(p, ink, { transparent: T });
  return [out.crop(0, 0, 20, 20), out.crop(20, 0, 20, 20)];
}
