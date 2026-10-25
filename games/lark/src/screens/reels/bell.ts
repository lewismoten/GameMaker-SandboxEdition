// bell.fli, chapter one's turn (before the bell's page): up in the belfry Joe hauls on the bell
// rope, the hammer swings back and strikes, the big brass bell rocks and rings, and his counter
// counts the strokes, one to seven. Then it is seven o'clock.
import { Pixels } from '../../../../kit/pixels';
import { Reel } from '../../../../kit/reel';
import { gradient, outlined, scaleBlit, text } from '../../art/draw';
import { c, r } from '../../art/pal';
import { joe } from '../../sprites/joe';
import { H, W, caption, close, lit, stars } from './common';

const BELL = { cx: 160, top: 44, bottom: 112 };
const PIVOT = { x: 262, y: 58 };
/** The hammer's arm, and its angle when the head rests on the bell's lip. */
const ARM = 68;
const STRIKE = Math.atan2(BELL.bottom - 4 - PIVOT.y, BELL.cx + 46 - PIVOT.x);
/** Joe, at scale 3, by the rope. */
const JOE = { x: 26, y: 110 };
const ROPE_X = 53;

function belfry(): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, r('stone'), 1, 3);
  for (let y = 8; y < 170; y += 12) for (let x = ((y / 12) % 2) * 16; x < W; x += 32) p.rect(x, y, 31, 1, c('stone', 0)).rect(x, y, 1, 12, c('stone', 0));
  // the arch, open on the night and the town below
  const ax = 96;
  const aw = 128;
  for (let y = 30; y < 150; y++)
    for (let x = ax; x < ax + aw; x++) {
      const dy = Math.max(0, 30 + aw / 2 - y);
      if ((x - ax - aw / 2) ** 2 + dy * dy <= (aw / 2) ** 2) p.set(x, y, c('dusk', y < 90 ? 0 : 1));
    }
  const sky = new Pixels(W, H);
  stars(sky, 7, 120, 90);
  p.map((x, y, v) => (v === c('dusk', 0) && sky.get(x, y) ? sky.get(x, y) : v));
  for (let x = ax; x < ax + aw; x += 14) {
    const h = 10 + ((x * 7) % 13);
    p.rect(x, 150 - h, 13, h, c('ink', 1))
      .rect(x + 4, 150 - h + 4, 2, 2, c('window', 2))
      .rect(x + 8, 150 - h + 4, 2, 2, c('window', (x % 3) + 0));
  }
  p.rect(ax - 4, 150, aw + 8, 6, c('stone', 4));
  // the beam the bell hangs from, the floor
  p.rect(0, 18, W, 12, c('wood', 2)).rect(0, 18, W, 2, c('wood', 4)).rect(0, 28, W, 2, c('wood', 0));
  p.rect(0, 170, W, 30, c('wood', 2));
  for (let x = 0; x < W; x += 24) p.rect(x, 170, 1, 30, c('wood', 0));
  p.rect(0, 170, W, 2, c('wood', 4));
  // the hammer's post
  p.rect(PIVOT.x - 3, 30, 7, 140, c('wood', 1)).rect(PIVOT.x - 3, 30, 2, 140, c('wood', 3));
  return p;
}

/** The bell, swung `sway` (a lean of its mouth, in pixels) and lit. */
function bell(p: Pixels, sway: number, ring: boolean): void {
  const { cx, top, bottom } = BELL;
  p.rect(cx - 12, 30, 24, 10, c('wood', 1)).rect(cx - 3, 38, 6, 7, c('ink', 0));
  const ramp = r('brass');
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const half = 18 + 20 * t * t + (t > 0.9 ? (t - 0.9) * 60 : 0);
    const mid = cx + sway * t;
    for (let x = Math.floor(mid - half); x <= mid + half; x++) {
      const nx = (x - mid) / half;
      const k = ring ? 4 : Math.max(0, Math.min(4, Math.round(3.4 - (nx + 0.5) * 2.2 - (t > 0.9 ? 1 : 0))));
      p.set(x, y, ramp[k]);
    }
  }
  p.rect(Math.round(cx + sway - 50), bottom - 1, 100, 2, c('brass', 0));
  // the clapper, just showing under the mouth
  p.disc(cx + sway * 1.2, bottom + 3, 4, c('brass', 1));
}

function hammer(p: Pixels, back: number): void {
  const a = STRIKE - back;
  const hx = PIVOT.x + Math.cos(a) * ARM;
  const hy = PIVOT.y + Math.sin(a) * ARM;
  for (let d = -1; d <= 1; d++) p.line(PIVOT.x + d, PIVOT.y, hx + d, hy, c('ink', 1));
  p.disc(PIVOT.x, PIVOT.y, 4, c('brass', 2));
  p.disc(hx, hy, 7, c('stone', 1)).disc(hx - 2, hy - 2, 3, c('stone', 3));
}

/** Joe on the rope: hauling (arms up, the rope down) or letting it rise; and his count over him. */
function joeOnRope(p: Pixels, haul: boolean, count: number): void {
  const hand = JOE.y + (haul ? 18 : 6);
  p.rect(ROPE_X, 30, 2, hand - 30, c('wood', 4));
  p.rect(ROPE_X - 1, hand + 4, 4, 6, c('wood', 4));
  scaleBlit(p, joe('side', 0, haul ? 'hop' : 'open'), JOE.x, JOE.y, 3, true);
  if (count) {
    p.rect(JOE.x + 8, JOE.y - 26, 40, 20, c('ink', 0)).rect(JOE.x + 10, JOE.y - 24, 36, 16, c('paper', 4));
    text(p, JOE.x + 20, JOE.y - 24, String(count), c('ink', 0), 2);
  }
}

/** Rings of sound round the bell, `k` frames after the strike. */
function rings(p: Pixels, k: number): void {
  for (let i = 0; i < 3; i++) {
    const rad = 52 + k * 7 + i * 9;
    for (let a = -1.2; a <= 1.2; a += 0.6 / rad) {
      for (const side of [-1, 1]) p.set(BELL.cx + side * Math.cos(a) * rad, 80 + Math.sin(a) * rad * 0.8, c('yellow', 3 - Math.min(2, i)));
    }
  }
}

export function bellFli(): Uint8Array {
  const bg = belfry();
  const reel = new Reel(lit('clock'));
  for (let k = 1; k <= 8; k++) reel.frame(bg, (p) => (bell(p, 0, false), hammer(p, 0.1), joeOnRope(p, false, 0)), 1, k / 8);
  reel.frame(bg, (p) => (bell(p, 0, false), hammer(p, 0.1), joeOnRope(p, false, 0), caption(p, 'THE HAMMER SWINGS.')), 4);
  // seven strokes: the haul, the hammer back, the strike, the bell rocking and ringing
  const backs = [0.5, 0.65, 0.35, 0, 0.05, 0.1, 0.1, 0.1];
  const sways = [0, 0, 0, -8, 6, -4, 2, 0];
  for (let n = 1; n <= 7; n++)
    for (let k = 0; k < 8; k++)
      reel.frame(bg, (p) => {
        if (k >= 3) rings(p, k - 3);
        bell(p, sways[k], k === 3);
        hammer(p, backs[k]);
        joeOnRope(p, k < 3, k >= 3 ? n : n - 1);
        if (k >= 3 && k < 7) outlined(p, 214, 110 - (k - 3) * 3, 'BONG!', c('yellow', 3), c('ink', 0), 2);
        caption(p, n < 3 ? 'THE HAMMER SWINGS.' : n < 7 || k < 3 ? 'JOE COUNTS EVERY ONE.' : "SEVEN O'CLOCK!");
      });
  reel.frame(bg, (p) => (bell(p, 0, false), hammer(p, 0.1), joeOnRope(p, false, 7), caption(p, "SEVEN O'CLOCK!")), 14);
  return close(reel);
}
