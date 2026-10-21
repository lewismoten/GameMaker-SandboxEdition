// Autodesk Animator .FLI films: the opening, the warp jump out of the galaxy chart, the
// launch back to orbit, and the Core lighting up at the end.
import { encodeFli } from '../../web/src/formats/fli';
import { rng } from '../kit/pixels';
import { Canvas } from './src/art/canvas';
import { drawPod } from './vehicles';
import { drawShard } from './src/blocks/items';
import { SCREEN, planetArt } from './screens';
import { WHITE, shared } from './src/art/palette';

const C = (n: string) => SCREEN.ramps.get(n) ?? shared.get(n)!;
const film = (frames: Canvas[], speed: number) =>
  encodeFli(
    frames.map((f) => f.px),
    SCREEN.pal,
    { speed },
  );

function stars(seed: number, n: number) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({ x: r() * 2 - 1, y: r() * 2 - 1, z: 0.2 + r() * 0.8 }));
}

/** Hyperspace: stars stretch into streaks, then a flash. */
export function warpFli(): Uint8Array {
  const field = stars(5, 260);
  const frames: Canvas[] = [];
  const N = 18;
  for (let f = 0; f < N; f++) {
    const c = new Canvas();
    const speed = (f / N) ** 2;
    for (const s of field) {
      const z = s.z;
      const x0 = 160 + (s.x / z) * 120;
      const y0 = 100 + (s.y / z) * 80;
      const len = 1 + speed * 60 * (1 / z);
      const dx = x0 - 160;
      const dy = y0 - 100;
      const d = Math.hypot(dx, dy) || 1;
      for (let i = 0; i < len; i += 0.7) {
        const t = i / len;
        c.set(x0 + (dx / d) * i, y0 + (dy / d) * i, C(t < 0.5 ? 'cyan' : 'neb2')[Math.max(1, 7 - Math.floor(t * 6))]);
      }
    }
    if (f >= N - 3) {
      const k = f - (N - 3);
      c.rect(0, 0, 320, 200, [C('cyan')[6], WHITE, C('cyan')[7]][k]);
    }
    frames.push(c);
  }
  return film(frames, 4);
}

/** Lifting off: the ground drops away, the sky darkens to space. */
export function launchFli(): Uint8Array {
  const frames: Canvas[] = [];
  const N = 16;
  for (let f = 0; f < N; f++) {
    const c = new Canvas();
    const t = f / (N - 1);
    // sky from blue to black
    const sky = C('blue');
    const top = Math.max(0, Math.round(5 - t * 6));
    c.gradient(0, 0, 320, 200, [sky[Math.max(0, top - 1)], sky[top], sky[Math.min(7, top + 2)]]);
    if (t > 0.4) c.stars(31, Math.floor((t - 0.4) * 500), C('star'));
    // the ground falls away below
    const gy = 150 + t * t * 260;
    c.rect(0, Math.round(gy), 320, 200, C('green')[2]);
    for (let x = 0; x < 320; x += 4) c.rect(x, Math.round(gy) - ((x * 7) % 5), 4, 6, C('green')[3]);
    c.rect(150, Math.round(gy) - 4, 22, 4, C('grey')[4]);
    // the pod and its flame
    const py = 100 - t * 10;
    for (let i = 0; i < 26 + (f % 3) * 4; i++)
      c.rect(156 - Math.max(0, 4 - i / 6), py + 18 + i, Math.max(1, 8 - i / 4), 1, C('orange')[Math.max(0, 7 - Math.floor(i / 4))]);
    c.sprite(drawPod('u', { flicker: f % 3 }), 140, py - 10, 2);
    frames.push(c);
  }
  return film(frames, 5);
}

/** The opening: the pod crosses the stars past a planet; the Core flickers out. */
export function introFli(): Uint8Array {
  const frames: Canvas[] = [];
  const N = 30;
  for (let f = 0; f < N; f++) {
    const c = new Canvas();
    c.stars(13 + Math.floor(f / 3), 180, C('star'));
    planetArt(c, 250 - f, 130, 50, 'verdant', 3);
    // the Core in the distance, flickering out
    const glow = f < 18 ? 6 + (f % 2) * 2 : Math.max(0, 6 - (f - 18));
    if (glow > 0) c.sphere(60, 50, glow, [C('orange')[3], C('yellow')[6], WHITE]);
    for (let i = 0; i < 40; i++) c.set(-20 + f * 12 - i, 92 + i * 0.1, C('orange')[Math.max(0, 7 - Math.floor(i / 5))]);
    c.sprite(drawPod('r', { flicker: f % 3, glow: f & 1 }), -20 + f * 12, 84, 2);
    if (f > 22) c.center(170, 'MAXIMUS', C('yellow').slice(3).reverse(), { scale: 3, outline: 0 });
    frames.push(c);
  }
  return film(frames, 5);
}

/** The ending: ten shards fly home and the Core ignites. */
export function wonFli(): Uint8Array {
  const frames: Canvas[] = [];
  const N = 24;
  for (let f = 0; f < N; f++) {
    const c = new Canvas();
    c.stars(55, 260, C('star'));
    const t = Math.min(1, f / 16);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + t * 2;
      const rr = 130 * (1 - t);
      c.sprite(drawShard(k), 150 + Math.round(Math.cos(a) * rr), 90 + Math.round(Math.sin(a) * rr * 0.7), 1);
    }
    if (f >= 16) {
      const rr = (f - 15) * 10;
      c.sphere(160, 100, rr, [C('orange')[3], C('yellow')[5], C('yellow')[7], WHITE]);
    } else c.sphere(160, 100, 8, [0, C('violet')[1]]);
    frames.push(c);
  }
  return film(frames, 5);
}
