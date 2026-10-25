// beam.fli, chapter six's turn (before Carl's thank-you): the lighthouse on its point in the dark,
// Carl buzzing round the lamp room; the old lamp sputters, catches, and its beam sweeps round
// over the cove and the sea, while the boats come home by it. The cove lights up as the beam
// comes on (the dark palette turning to the night's).
import { Pixels } from '../../../../kit/pixels';
import { Reel } from '../../../../kit/reel';
import { blob, gradient, scaleBlit } from '../../art/draw';
import { c, r } from '../../art/pal';
import { carlPicture } from '../../sprites/critters';
import { H, W, blend, caption, close, lit, stars } from './common';

const LAMP = { x: 70, y: 33 };
const SEA = 118;

function cove(): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, SEA, r('dusk'), 0, 1);
  stars(p, 23, SEA - 20, 80);
  gradient(p, 0, SEA, W, H - SEA, r('blue'), 1, 0);
  // the far shore, a line of hills along the horizon
  for (let x = 140; x < W; x++) {
    const y = Math.round(SEA - 4 - Math.sin(x / 23) * 3);
    p.rect(x, y, 1, SEA - y, c('grass', 0));
  }
  // the point: rocks heaped under the lighthouse
  for (const [x, y, rx, ry] of [
    [20, 150, 34, 30],
    [70, 140, 40, 22],
    [110, 158, 26, 18],
    [40, 182, 48, 22],
    [120, 186, 30, 16],
  ])
    blob(p, x, y, rx, ry, r('stone'), 0, 3);
  // the tower: white, two red bands, tapering up to the gallery
  for (let y = 44; y < 132; y++) {
    const t = (y - 44) / 88;
    const half = 9 + 6 * t;
    const band = (y > 60 && y < 70) || (y > 92 && y < 102);
    for (let x = Math.floor(LAMP.x - half); x <= LAMP.x + half; x++) {
      const nx = (x - LAMP.x) / half;
      p.set(x, y, band ? c('red', nx < -0.3 ? 3 : nx < 0.4 ? 2 : 1) : c('paper', nx < -0.3 ? 4 : nx < 0.4 ? 3 : 1));
    }
  }
  p.rect(LAMP.x - 3, 112, 6, 20, c('wood', 1));
  // the gallery and its rail, the lamp room's frame, the red cap
  p.rect(LAMP.x - 14, 42, 28, 3, c('ink', 0))
    .rect(LAMP.x - 14, 36, 1, 6, c('ink', 0))
    .rect(LAMP.x + 13, 36, 1, 6, c('ink', 0));
  p.rect(LAMP.x - 14, 36, 28, 1, c('ink', 0));
  p.rect(LAMP.x - 8, 18, 16, 6, c('red', 1))
    .rect(LAMP.x - 5, 14, 10, 4, c('red', 2))
    .rect(LAMP.x - 1, 10, 2, 4, c('ink', 0));
  return p;
}

/** The lamp room: dark glass, or lit. */
function lamp(p: Pixels, on: boolean): void {
  p.rect(LAMP.x - 8, 24, 16, 12, on ? c('window', 2) : c('blue', 0));
  p.rect(LAMP.x - 8, 24, 1, 12, c('ink', 0))
    .rect(LAMP.x + 7, 24, 1, 12, c('ink', 0))
    .rect(LAMP.x - 1, 24, 2, 12, c('ink', 0));
  if (on) p.disc(LAMP.x, LAMP.y - 3, 3, c('yellow', 3));
}

/** The beam at angle `a` round the tower (0 to the right, PI/2 toward us), seen from the side. */
function beam(p: Pixels, a: number): void {
  const dx = Math.cos(a);
  const toward = Math.sin(a);
  if (Math.abs(dx) > 0.12) {
    const len = 330 * Math.abs(dx);
    const dir = Math.sign(dx);
    const spread = 6 + 22 * Math.max(0, toward);
    for (let s = 6; s < len; s++) {
      const x = LAMP.x + dir * s;
      const half = 2 + (spread * s) / len;
      for (let y = Math.floor(LAMP.y - 3 - half); y <= LAMP.y - 3 + half; y++) {
        if (x < 0 || x >= W || y < 0) continue;
        const core = Math.abs(y - LAMP.y + 3) < half * 0.35;
        if (core || (x + y) % 2 === 0) p.set(x, y, c('window', core && toward > -0.3 ? 1 : 0));
      }
    }
  }
  // turned toward us, it flashes
  if (toward > 0.8) p.disc(LAMP.x, LAMP.y - 3, 6 + 14 * (toward - 0.8) * 5, c('window', 1)).disc(LAMP.x, LAMP.y - 3, 6, c('yellow', 3));
}

/** A small boat with its lantern lit, its bow to the left. */
function boat(p: Pixels, x: number, y: number, k: number): void {
  const bob = k % 6 < 3 ? 0 : 1;
  p.rect(x, y + bob, 22, 4, c('wood', 1)).rect(x + 2, y + 4 + bob, 18, 2, c('wood', 0));
  p.rect(x + 10, y - 16 + bob, 1, 16, c('wood', 3));
  for (let i = 0; i < 12; i++) p.rect(x + 11, y - 15 + i + bob, Math.round(i * 0.7) + 1, 1, c('paper', 2));
  p.disc(x + 3, y - 2 + bob, 1.5, c('window', 2));
}

/** Waves glinting on the sea, moving with `k`. */
function waves(p: Pixels, k: number): void {
  for (let y = SEA + 6; y < H; y += 9)
    for (let x = ((y * 7 + k * 2) % 30) - 30; x < W; x += 30) if (x > 120 || y > 176) p.rect(x, y, 6 + (y % 4), 1, c('blue', 2));
}

export function beamFli(): Uint8Array {
  const bg = cove();
  const dark = lit('dark');
  const night = lit('night');
  const reel = new Reel(night);
  const scene = (p: Pixels, k: number, on: boolean, a?: number) => {
    waves(p, k);
    boat(p, 330 - k * 1.6, 150, k);
    boat(p, 420 - k * 1.9, 168, k + 3);
    lamp(p, on);
    if (a !== undefined) beam(p, a);
    const t = k * 0.35;
    scaleBlit(p, carlPicture(k % 2), Math.round(LAMP.x - 10 + Math.cos(t) * 30), Math.round(LAMP.y - 6 + Math.sin(t) * 12), 1);
  };
  // the dark: the cove shows next to nothing, Carl's eyes and a sputter or two
  const sputter = [false, false, false, true, false, false, true, true, false, true, false, false];
  sputter.forEach((on, k) =>
    reel.frame(
      bg,
      (p) => {
        scene(p, k, on);
        if (k > 3) caption(p, 'THE OLD LAMP SPUTTERS...');
      },
      1,
      Math.min(1, (k + 1) / 5),
      dark,
    ),
  );
  // it catches, and the beam goes round
  for (let k = 12; k < 72; k++) {
    const a = (k - 12) * 0.24 - 0.6;
    const pal = k < 20 ? blend(dark, night, (k - 11) / 8) : night;
    reel.frame(
      bg,
      (p) => {
        scene(p, k, true, a);
        caption(p, k < 30 ? '...AND CATCHES!' : 'ROUND AND ROUND, FOR EVERYBODY.');
      },
      1,
      1,
      pal,
    );
  }
  return close(reel);
}
