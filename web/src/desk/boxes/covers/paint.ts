// Brushes for the painted box covers (covers/<id>.ts): gradients, glows, soft shapes and a
// painterly finish, so each cover reads like a 1995 artist's rendering of the game rather
// than a screenshot.
import { seeded } from '../boxFacts';

export type Ctx = CanvasRenderingContext2D;
type Stops = [number, string][];
/** A cover painter: fills a w x h picture (the title sits over its top ~third). */
export type Painter = (ctx: Ctx, w: number, h: number) => void;

export { seeded };

function stops<G extends CanvasGradient>(g: G, s: Stops): G {
  for (const [at, c] of s) g.addColorStop(at, c);
  return g;
}

export const lin = (c: Ctx, x0: number, y0: number, x1: number, y1: number, s: Stops) => stops(c.createLinearGradient(x0, y0, x1, y1), s);
export const rad = (c: Ctx, x: number, y: number, r: number, s: Stops, r0 = 0) => stops(c.createRadialGradient(x, y, r0, x, y, r), s);

/** A soft light: a radial fade from `color` to nothing, added to what is under it. */
export function glow(c: Ctx, x: number, y: number, r: number, color: string, alpha = 1): void {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = alpha;
  c.fillStyle = rad(c, x, y, r, [
    [0, color],
    [1, 'rgba(0,0,0,0)'],
  ]);
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

/** Fills the current path, or one drawn by `shape`. */
export function fill(c: Ctx, style: string | CanvasGradient, shape?: () => void): void {
  if (shape) {
    c.beginPath();
    shape();
  }
  c.fillStyle = style;
  c.fill();
}

export function ell(c: Ctx, x: number, y: number, rx: number, ry: number, rot = 0): void {
  c.beginPath();
  c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2);
}

/** A polygon through x,y pairs. */
export function poly(c: Ctx, pts: number[], close = true): void {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  if (close) c.closePath();
}

/** A smooth closed shape through x,y pairs (curves between the midpoints). */
export function blob(c: Ctx, pts: number[]): void {
  const n = pts.length / 2;
  const mid = (i: number) => [(pts[(i % n) * 2] + pts[((i + 1) % n) * 2]) / 2, (pts[(i % n) * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2];
  c.beginPath();
  const [sx, sy] = mid(0);
  c.moveTo(sx, sy);
  for (let i = 1; i <= n; i++) {
    const [mx, my] = mid(i);
    c.quadraticCurveTo(pts[(i % n) * 2], pts[(i % n) * 2 + 1], mx, my);
  }
  c.closePath();
}

/** A night sky's stars, some with a twinkle. */
export function stars(c: Ctx, w: number, h: number, n: number, seed: string, color = '#fff'): void {
  const r = seeded(seed);
  c.save();
  c.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const s = r() ** 3 * 2.2 + 0.4;
    c.globalAlpha = 0.35 + r() * 0.65;
    c.fillRect(x, y, s, s);
    if (s > 2) {
      c.globalAlpha *= 0.5;
      c.fillRect(x - s * 2, y + s / 2 - 0.5, s * 5, 1);
      c.fillRect(x + s / 2 - 0.5, y - s * 2, 1, s * 5);
    }
  }
  c.restore();
}

/** A thick stroked line with round ends. */
export function stroke(c: Ctx, style: string | CanvasGradient, width: number, pts: number[]): void {
  poly(c, pts, false);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = width;
  c.strokeStyle = style;
  c.stroke();
}

/**
 * The airbrushed finish over the whole picture: soft mottling and a vignette, so flat
 * shapes look painted.
 */
export function finish(c: Ctx, w: number, h: number, seed: string, vignette = 0.55): void {
  const r = seeded(`${seed}#brush`);
  c.save();
  for (let i = 0; i < 70; i++) {
    const x = r() * w;
    const y = r() * h;
    const s = 30 + r() * 70;
    c.fillStyle = rad(c, x, y, s, [
      [0, i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'],
      [1, 'rgba(0,0,0,0)'],
    ]);
    c.fillRect(x - s, y - s, s * 2, s * 2);
  }
  c.globalAlpha = 1;
  c.fillStyle = rad(c, w / 2, h * 0.55, Math.max(w, h) * 0.75, [
    [0.55, 'rgba(0,0,0,0)'],
    [1, `rgba(0,0,0,${vignette})`],
  ]);
  c.fillRect(0, 0, w, h);
  c.restore();
}

/** Light rays fanning from a point. */
export function rays(c: Ctx, x: number, y: number, len: number, n: number, color: string, alpha: number, spread = Math.PI * 2, start = 0): void {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = start + (spread * (i + 0.5)) / n;
    const g = lin(c, x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, [
      [0, color],
      [1, 'rgba(0,0,0,0)'],
    ]);
    c.globalAlpha = alpha * (i % 2 ? 0.6 : 1);
    c.fillStyle = g;
    const da = spread / n / 3;
    poly(c, [x, y, x + Math.cos(a - da) * len, y + Math.sin(a - da) * len, x + Math.cos(a + da) * len, y + Math.sin(a + da) * len]);
    c.fill();
  }
  c.restore();
}
