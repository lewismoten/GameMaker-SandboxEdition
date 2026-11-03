// A pixel sprite as a chunky printable figure: the picture's colors are cut to a few (merged by CIELAB
// distance, the way the palette tools judge colors, with the darkest color kept for the outline), stray
// specks are dropped or bridged so the figure is one connected piece, and it is extruded to a standee
// of `layers` blocks deep on a base plate with a foot that is wider and deeper than the figure. Each
// color becomes one closed body (voxel.ts); the union is one body for a single-color STL.
import { labOf } from '../colorReduce';
import type { Mesh } from './mesh';
import { voxelMesh } from './voxel';

export const TRANSPARENT = 255;
export interface PixelPicture {
  w: number;
  h: number;
  /** Palette index per pixel, row major from the top; 255 is empty. */
  cells: Uint8Array;
  /** 6-bit VGA palette (768 bytes). */
  palette: Uint8Array;
}
export interface FigureOptions {
  /** Most colors (the base counts as the outline color): 4, or 3. */
  colors?: number;
  /** Millimeters per pixel block. */
  block?: number;
  /** Blocks deep the figure is. */
  layers?: number;
  /** Rows of base plate under the feet. */
  baseRows?: number;
  /** Blocks the base sticks out each side, and front and back. */
  baseMargin?: number;
}
export interface Figure {
  /** One closed mesh per color, darkest (outline and base) first. */
  bodies: { color: [number, number, number]; mesh: Mesh }[];
  /** The whole solid as one mesh. */
  solid: Mesh;
  /** Cleaned color map (width x height, with the base), for previews: index into `bodies`, -1 empty. */
  map: Int8Array;
  w: number;
  h: number;
  droppedSpecks: number;
  bridged: number;
}

type Lab = [number, number, number];
const dE = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Colors used, cut to `max` seeds: the darkest first (the outline), then the farthest from those chosen, weighted by use. */
function seedColors(pic: PixelPicture, max: number): { seeds: number[]; of: Map<number, number> } {
  const count = new Map<number, number>();
  for (const c of pic.cells) if (c !== TRANSPARENT) count.set(c, (count.get(c) ?? 0) + 1);
  const used = [...count.keys()];
  const lab = new Map(used.map((c) => [c, labOf(pic.palette, c)]));
  const total = [...count.values()].reduce((a, b) => a + b, 0);
  const seeds = [used.reduce((a, b) => (lab.get(b)![0] < lab.get(a)![0] ? b : a))];
  while (seeds.length < max && seeds.length < used.length) {
    let best = -1;
    let score = 0;
    for (const c of used) {
      if (seeds.includes(c)) continue;
      const near = Math.min(...seeds.map((s) => dE(lab.get(s)!, lab.get(c)!)));
      const s = near * (1 + 3 * Math.sqrt(count.get(c)! / total));
      // a color with under 1% of the pixels and close to a seed is not worth a filament
      if (near < 12 || count.get(c)! < total * 0.01) continue;
      if (s > score) {
        score = s;
        best = c;
      }
    }
    if (best < 0) break;
    seeds.push(best);
  }
  const of = new Map<number, number>();
  for (const c of used) {
    let k = 0;
    for (let i = 1; i < seeds.length; i++) if (dE(lab.get(seeds[i])!, lab.get(c)!) < dE(lab.get(seeds[k])!, lab.get(c)!)) k = i;
    of.set(c, k);
  }
  return { seeds, of };
}

/** The figure of a picture. */
export function pixelFigure(pic: PixelPicture, o: FigureOptions = {}): Figure {
  const { colors = 4, block = 1.5, layers = 4, baseRows = 2, baseMargin = 1 } = o;
  const { seeds, of } = seedColors(pic, colors);
  // crop to the drawn pixels
  let x0 = pic.w,
    x1 = -1,
    y0 = pic.h,
    y1 = -1;
  for (let y = 0; y < pic.h; y++)
    for (let x = 0; x < pic.w; x++)
      if (pic.cells[y * pic.w + x] !== TRANSPARENT) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const fw = x1 - x0 + 1;
  const fh = y1 - y0 + 1;
  const W = fw + 2 * baseMargin;
  const H = fh + baseRows;
  const map = new Int8Array(W * H).fill(-1);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : map[y * W + x]);
  for (let y = 0; y < fh; y++)
    for (let x = 0; x < fw; x++) {
      const c = pic.cells[(y0 + y) * pic.w + x0 + x];
      if (c !== TRANSPARENT) map[y * W + x + baseMargin] = of.get(c)!;
    }
  // the base plate: the outline color, with the figure's feet standing in its top row
  for (let y = fh; y < H; y++) for (let x = 0; x < W; x++) map[y * W + x] = 0;

  // one piece: 4-connected components; small far specks go, the rest are bridged to the main piece
  let dropped = 0;
  let bridged = 0;
  for (;;) {
    const comp = new Int32Array(W * H).fill(-1);
    const sizes: number[] = [];
    for (let s = 0; s < W * H; s++) {
      if (map[s] < 0 || comp[s] >= 0) continue;
      const id = sizes.length;
      const stack = [s];
      comp[s] = id;
      let n = 0;
      while (stack.length) {
        const p = stack.pop()!;
        n++;
        const px = p % W,
          py = (p / W) | 0;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const q = (py + dy) * W + px + dx;
          if (at(px + dx, py + dy) >= 0 && comp[q] < 0) {
            comp[q] = id;
            stack.push(q);
          }
        }
      }
      sizes.push(n);
    }
    if (sizes.length <= 1) break;
    const main = sizes.indexOf(Math.max(...sizes));
    // the nearest pair of pixels between the main piece and any other
    let best: { a: number; b: number; d: number } | undefined;
    for (let a = 0; a < W * H; a++) {
      if (comp[a] !== main) continue;
      for (let b = 0; b < W * H; b++) {
        if (comp[b] < 0 || comp[b] === main) continue;
        const d = Math.abs((a % W) - (b % W)) + Math.abs(((a / W) | 0) - ((b / W) | 0));
        if (!best || d < best.d) best = { a, b, d };
      }
    }
    if (!best) break;
    const other = comp[best.b];
    if (sizes[other] < 4 && best.d > 2) {
      for (let s = 0; s < W * H; s++) if (comp[s] === other) map[s] = -1;
      dropped += sizes[other];
      continue;
    }
    // L-shaped bridge from the other piece's pixel toward the main piece, in that pixel's color
    let x = best.b % W,
      y = (best.b / W) | 0;
    const tx = best.a % W,
      ty = (best.a / W) | 0;
    const col = map[best.b];
    while (x !== tx) {
      x += Math.sign(tx - x);
      if (map[y * W + x] < 0) {
        map[y * W + x] = col;
        bridged++;
      }
    }
    while (y !== ty) {
      y += Math.sign(ty - y);
      if (map[y * W + x] < 0) {
        map[y * W + x] = col;
        bridged++;
      }
    }
  }
  // no two pixels of one color may touch only at a corner (that edge would belong to four faces)
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (let y = 0; y + 1 < H; y++)
      for (let x = 0; x + 1 < W; x++) {
        const a = map[y * W + x],
          b = map[y * W + x + 1],
          c = map[(y + 1) * W + x],
          d = map[(y + 1) * W + x + 1];
        // fill an empty corner of the window with the diagonal's color, else recolor one of the others
        const fix = (color: number, p: number, q: number) => {
          map[map[p] < 0 || map[q] >= 0 ? p : q] = color;
          changed = true;
        };
        if (a >= 0 && d >= 0 && ((a === d && b !== a && c !== a) || (b < 0 && c < 0))) fix(a, y * W + x + 1, (y + 1) * W + x);
        else if (b >= 0 && c >= 0 && ((b === c && a !== b && d !== b) || (a < 0 && d < 0))) fix(b, y * W + x, (y + 1) * W + x + 1);
      }
    if (!changed) break;
  }

  // the voxel grid: x across, y is depth, z up. The figure is `layers` deep, the base plate deeper
  const baseLayers = layers + 2 * baseMargin;
  const front = baseMargin;
  const hasAt = (k: number) => (x: number, y: number, z: number) => {
    const row = H - 1 - z;
    if (x < 0 || x >= W || row < 0 || row >= H) return false;
    const m = map[row * W + x];
    if (m < 0 || (k >= 0 && m !== k)) return false;
    return row >= fh ? y >= 0 && y < baseLayers : y >= front && y < front + layers;
  };
  const dims = { nx: W, ny: baseLayers, nz: H };
  const bodies = seeds.map((s, k) => ({
    color: [0, 1, 2].map((c) => Math.round((Math.min(63, pic.palette[s * 3 + c]) * 255) / 63)) as [number, number, number],
    mesh: voxelMesh({ ...dims, has: hasAt(k) }, block),
  }));
  const solid = voxelMesh({ ...dims, has: hasAt(-1) }, block);
  return { bodies: bodies.filter((b) => b.mesh.indices.length > 0), solid, map, w: W, h: H, droppedSpecks: dropped, bridged };
}
