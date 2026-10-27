// Drawing helpers shared by the block, monster and character art.
import { Pixels, rng, dither } from '../../../kit/pixels';
import { SAND } from './palette';
import { CLEAR } from '../../../kit/blit';
export { CLEAR } from '../../../kit/blit';

export { Pixels, rng, dither };

export const tile = (c = 0) => new Pixels(20, 20, c);
export const sprite = () => new Pixels(20, 20, CLEAR);

/** Picks from a ramp with clamping. */
export const shade = (ramp: number[], i: number) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(i)))];

/** Grainy sand: mostly `base`, with darker and lighter grains. */
export function sandTexture(seed: number, base = 6, ramp = SAND, grain = 0.22): Pixels {
  const r = rng(seed);
  const p = tile();
  return p.map(() => {
    const v = r();
    if (v < grain * 0.45) return shade(ramp, base - 1);
    if (v < grain * 0.6) return shade(ramp, base - 2);
    if (v > 1 - grain * 0.4) return shade(ramp, base + 1);
    if (v > 1 - grain * 0.48) return shade(ramp, base + 2);
    return shade(ramp, base);
  });
}

/** Wind ripples in sand: soft diagonal arcs. */
export function ripples(p: Pixels, seed: number, ramp = SAND, base = 6): Pixels {
  const r = rng(seed);
  for (let k = 0; k < 3; k++) {
    const y0 = 3 + k * 7 + Math.floor(r() * 2);
    for (let x = 0; x < 20; x++) {
      const y = y0 + Math.round(Math.sin((x + k * 3) / 3.2) * 1.4);
      p.set(x, y, shade(ramp, base - 1));
      p.set(x, y - 1, shade(ramp, base + 1));
    }
  }
  return p;
}

/** A raised rectangle lit from the top left. */
export function bevel(p: Pixels, x: number, y: number, w: number, h: number, ramp: number[], mid: number, depth = 1): Pixels {
  p.rect(x, y, w, h, shade(ramp, mid));
  for (let d = 0; d < depth; d++) {
    p.rect(x + d, y + d, w - d * 2, 1, shade(ramp, mid + 2 - d));
    p.rect(x + d, y + d, 1, h - d * 2, shade(ramp, mid + 1));
    p.rect(x + d, y + h - 1 - d, w - d * 2, 1, shade(ramp, mid - 2 + d));
    p.rect(x + w - 1 - d, y + d, 1, h - d * 2, shade(ramp, mid - 1));
  }
  return p;
}

/** Outlines every non-clear pixel of a sprite that touches clear space. */
export function outline(p: Pixels, c: number): Pixels {
  const src = p.crop(0, 0, p.w, p.h);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (src.get(x, y) !== CLEAR) continue;
      const n = [src.get(x - 1, y), src.get(x + 1, y), src.get(x, y - 1), src.get(x, y + 1)];
      if (n.some((v) => v !== CLEAR && v !== -1 && v !== c)) p.set(x, y, c);
    }
  return p;
}

/** Shades a filled disc as a ball lit from the top left. */
export function ball(p: Pixels, cx: number, cy: number, r: number, ramp: number[], mid: number): Pixels {
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = dx * dx + dy * dy;
      if (d > r * r) continue;
      const light = (-dx - dy) / (r * 1.6) - Math.sqrt(d) / (r * 2.5);
      p.set(x, y, shade(ramp, mid + light * 2.4));
    }
  return p;
}

/** Soft drop shadow under/right of an object on sand (darkens sand shades). */
export function shadowOnSand(p: Pixels, test: (x: number, y: number) => boolean): Pixels {
  return p.map((x, y, c) => {
    if (!test(x, y)) return c;
    const i = SAND.indexOf(c);
    return i >= 0 ? SAND[Math.max(0, i - 2)] : c;
  });
}

/** A palette-index picture from ASCII art rows and a key (other chars = clear). */
export function art(rows: string[], key: Record<string, number>, base?: Pixels): Pixels {
  const p = base ?? sprite();
  return p.draw(0, 0, rows, key);
}
