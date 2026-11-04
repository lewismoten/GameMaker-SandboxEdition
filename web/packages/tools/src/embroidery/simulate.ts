// A stitch simulation: the pattern drawn stitch by stitch, in sewing order, as thread lines with width and a rounded
// shading (lighter along the middle of the thread, darker at its edges), on a plain twill-colored backing.
// Jumps and trims are not drawn. The picture is square and centered on the needle's 0,0.
import type { Pattern, RGB } from './types';

export interface Picture {
  w: number;
  h: number;
  rgb: Uint8Array;
}

export interface SimOptions {
  /** Picture size in mm (square), centered on 0,0. */
  size: number;
  pxPerMm: number;
  /** Thread width, mm (about 0.4 for 40 weight thread, drawn a little heavier to read at small size). */
  thread?: number;
  /** Backing fabric color. */
  backing?: RGB;
  /** The mm point at the middle of the picture (default 0,0), to look closely at one part. */
  center?: [number, number];
}

const clamp = (v: number) => Math.max(0, Math.min(255, v));

/** Draws the pattern. */
export function simulate(pattern: Pattern, o: SimOptions): Picture {
  const w = Math.round(o.size * o.pxPerMm);
  const rgb = new Uint8Array(w * w * 3);
  const back = o.backing ?? [214, 208, 196];
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const weave = (((x >> 1) + (y >> 1)) & 1) * 5 + ((x * 7 + y * 13) % 5);
      rgb.set([clamp(back[0] - weave), clamp(back[1] - weave), clamp(back[2] - weave)], (y * w + x) * 3);
    }
  }
  const half = ((o.thread ?? 0.42) * o.pxPerMm) / 2;
  const [mx, my] = o.center ?? [0, 0];
  const px = (v: number) => (v - mx + o.size / 2) * o.pxPerMm;
  const py = (v: number) => (o.size / 2 - (v - my)) * o.pxPerMm;
  let color = 0;
  let ax = 0;
  let ay = 0;
  for (const s of pattern.stitches) {
    if (s.cmd === 'color') color++;
    if (s.cmd !== 'stitch' && s.cmd !== 'jump') continue;
    const bx = px(s.x);
    const by = py(s.y);
    if (s.cmd === 'stitch') {
      const t = pattern.threads[color].rgb;
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - half - 1));
      const x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx) + half + 1));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by) - half - 1));
      const y1 = Math.min(w - 1, Math.ceil(Math.max(ay, by) + half + 1));
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy || 1;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const u = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / len2));
          const d = Math.hypot(x + 0.5 - (ax + dx * u), y + 0.5 - (ay + dy * u)) / half;
          if (d > 1) continue;
          const shade = 1.18 - 0.55 * d * d; // sheen along the thread's middle
          const i = (y * w + x) * 3;
          const a = d > 0.8 ? (1 - d) / 0.2 : 1; // soft edge
          for (let c = 0; c < 3; c++) rgb[i + c] = clamp(rgb[i + c] * (1 - a) + t[c] * shade * a);
        }
      }
    }
    ax = bx;
    ay = by;
  }
  return { w, h: w, rgb };
}
