// Tileable 20x20 textures painted with real shapes (grass blades, tree crowns, boulders,
// cobbles) rather than noise alone: every shape is drawn nine times, shifted a block's width in
// each direction, so whatever crosses one edge comes back in on the other and any two blocks
// using the texture join without a seam. Variants keep the same edges and differ only inside
// (blend() fades the variant in from 4 pixels in), which breaks up the repeat on big fields.
import { Canvas, type RGB, mix, smooth, tnoise, speck, clamp01 } from './rgb';
import { rng } from '../../../kit/pixels';

const B = 20;

/** A canvas where every drawing call is repeated at the 8 neighboring offsets. */
class Tile {
  readonly cv = new Canvas(B, B);
  private each(fn: (dx: number, dy: number) => void): this {
    for (const dy of [-B, 0, B]) for (const dx of [-B, 0, B]) fn(dx, dy);
    return this;
  }
  fill(fn: (x: number, y: number) => RGB): this {
    this.cv.shade(fn, 2);
    return this;
  }
  disc(x: number, y: number, r: number, col: RGB | ((x: number, y: number) => RGB)): this {
    return this.each((dx, dy) => this.cv.disc(x + dx, y + dy, r, typeof col === 'function' ? (px, py) => col(px - dx, py - dy) : col));
  }
  ellipse(x: number, y: number, rx: number, ry: number, col: RGB | ((x: number, y: number) => RGB)): this {
    return this.each((dx, dy) => this.cv.ellipse(x + dx, y + dy, rx, ry, typeof col === 'function' ? (px, py) => col(px - dx, py - dy) : col));
  }
  line(x0: number, y0: number, x1: number, y1: number, w: number, col: RGB): this {
    return this.each((dx, dy) => this.cv.line(x0 + dx, y0 + dy, x1 + dx, y1 + dy, w, col));
  }
  poly(pts: [number, number][], col: RGB | ((x: number, y: number) => RGB)): this {
    return this.each((dx, dy) =>
      this.cv.poly(
        pts.map(([x, y]) => [x + dx, y + dy]),
        typeof col === 'function' ? (px, py) => col(px - dx, py - dy) : col,
      ),
    );
  }
  /** Sampler with wrap-around (x, y may be any number). */
  sampler(): (x: number, y: number) => RGB {
    const cv = this.cv;
    return (x, y) => {
      const ix = ((Math.floor(x) % B) + B) % B;
      const iy = ((Math.floor(y) % B) + B) % B;
      return cv.get(ix, iy);
    };
  }
}

type Sampler = (x: number, y: number) => RGB;

/** Fades `inner` in over `base` from the block's edges (0 at the edge, 1 from `inset` pixels in). */
export function blend(base: Sampler, inner: Sampler, inset = 5): Sampler {
  return (x, y) => {
    const lx = ((x % B) + B) % B;
    const ly = ((y % B) + B) % B;
    const e = Math.min(lx, ly, B - lx, B - ly);
    return mix(base(x, y), inner(x, y), smooth(1, inset, e));
  };
}

// ---------------------------------------------------------------- grass

/** Meadow grass: a soft mottled green with tufts of blades lit from the top left. */
export function grassTex(seed = 1, tone: RGB = [0, 0, 0], tufts = 9): Sampler {
  const t = new Tile();
  const r = rng(seed * 7919);
  const t0 = (c: RGB): RGB => [c[0] + tone[0], c[1] + tone[1], c[2] + tone[2]];
  t.fill((x, y) => {
    const n = tnoise(x, y, 5, B, seed) * 0.6 + tnoise(x, y, 2.5, B, seed + 1) * 0.4;
    return t0(mix([70, 124, 46], [104, 158, 60], clamp01(n * 1.2 - 0.1)));
  });
  // tufts: little fans of blades, dark at the root, light at the tip
  for (let k = 0; k < tufts; k++) {
    const cx = r() * B;
    const cy = r() * B;
    const dark = r() < 0.4;
    for (let b = -2; b <= 2; b++) {
      const tipx = cx + b * 1.1 + (r() - 0.5);
      const tipy = cy - 3 - (2 - Math.abs(b)) * 0.8 - r();
      t.line(cx + b * 0.4, cy, tipx, tipy, 0.9, t0(dark ? [50, 96, 38] : mix([92, 150, 56], [146, 196, 84], (b + 2) / 4)));
    }
  }
  // a few lighter specks (clover, seed heads)
  for (let k = 0; k < 6; k++) t.disc(r() * B, r() * B, 0.6, t0([150, 196, 96]));
  return t.sampler();
}

// ---------------------------------------------------------------- forest

/** A wood seen from above: packed round tree crowns, each lit from the top left. */
export function canopyTex(seed = 3): Sampler {
  const t = new Tile();
  const r = rng(seed * 104729);
  t.fill((x, y) => mix([12, 34, 20], [22, 52, 26], tnoise(x, y, 5, B, seed)));
  const crowns: [number, number, number][] = [];
  for (let k = 0; k < 7; k++) crowns.push([r() * B, r() * B, 3.6 + r() * 2.2]);
  crowns.sort((a, b) => a[1] - b[1]);
  for (const [cx, cy, rad] of crowns) {
    t.disc(cx + 0.8, cy + 1.2, rad, [10, 26, 16]);
    const hue = r();
    const lo: RGB = mix([26, 70, 30], [40, 74, 26], hue);
    const hi: RGB = mix([98, 156, 62], [124, 160, 58], hue);
    t.disc(cx, cy, rad, (x, y) => {
      const l = clamp01(1 - Math.hypot(x - (cx - rad * 0.35), y - (cy - rad * 0.4)) / (rad * 1.5));
      const leaf = tnoise(x, y, 2.5, B, seed + 9) * 0.35;
      return mix(lo, hi, clamp01(l * 0.9 + leaf - 0.1));
    });
  }
  return t.sampler();
}

// ---------------------------------------------------------------- rock

/** Highland: big weathered slabs with dark cracks between them, scrub and lichen, lit from the top left. */
export function rockTex(seed = 5): Sampler {
  const t = new Tile();
  const r = rng(seed * 15485863);
  t.fill((x, y) => mix([70, 62, 54], [92, 82, 70], tnoise(x, y, 5, B, seed)));
  for (let k = 0; k < 4; k++) {
    const cx = r() * B;
    const cy = r() * B;
    const pts: [number, number][] = [];
    const n = 6;
    const rad = 4.5 + r() * 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.5;
      const rr = rad * (0.75 + r() * 0.35);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]);
    }
    t.poly(
      pts.map(([x, y]) => [x + 0.8, y + 1.1] as [number, number]),
      [54, 46, 42],
    );
    t.poly(pts, (x, y) => {
      const l = clamp01(0.55 - ((x - cx) / rad) * 0.4 - ((y - cy) / rad) * 0.55);
      return mix([112, 100, 86], [190, 178, 156], clamp01(l + (tnoise(x, y, 2.5, B, seed + 3) - 0.5) * 0.3));
    });
  }
  for (let k = 0; k < 3; k++) {
    const x = r() * B;
    const y = r() * B;
    t.disc(x, y, 1.3, [70, 96, 50]);
    t.disc(x - 0.4, y - 0.4, 0.8, [104, 134, 64]);
  }
  return t.sampler();
}

// ---------------------------------------------------------------- dirt

/** Packed earth with pebbles. */
export function dirtTex(seed = 7): Sampler {
  const t = new Tile();
  const r = rng(seed * 3571);
  t.fill((x, y) => {
    const n = tnoise(x, y, 5, B, seed) * 0.6 + tnoise(x, y, 2.5, B, seed + 1) * 0.4;
    return mix([132, 96, 60], [172, 134, 88], n);
  });
  for (let k = 0; k < 10; k++) {
    const cx = r() * B;
    const cy = r() * B;
    const rad = 0.5 + r() * 0.8;
    t.disc(cx + 0.4, cy + 0.5, rad, [100, 72, 46]);
    t.disc(cx, cy, rad, mix([170, 150, 120], [214, 198, 168], r()));
  }
  return t.sampler();
}

// ---------------------------------------------------------------- sand

export function sandTex(seed = 9): Sampler {
  return (x, y) => {
    const n = tnoise(x, y, 5, B, seed) * 0.5 + tnoise(x, y, 2.5, B, seed + 1) * 0.3 + speck(x, y, B, seed) * 0.2;
    return mix([200, 172, 118], [240, 222, 170], n);
  };
}
