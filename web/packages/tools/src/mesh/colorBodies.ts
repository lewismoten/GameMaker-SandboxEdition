// Splitting a colored solid into one closed body per color, for a multi-filament print (threeMf.ts).
// `pickPalette` chooses at most `max` colors from a mesh's triangle colors (far apart ones first, close
// ones merged); `colorBodies` cuts the solid into one body for each, every point taking the color of the
// nearest surface point, so the bodies fit together to make exactly the solid.
import type { Mesh, Vec3 } from './mesh';
import { tetraMesh } from './tetraMesh';

export type Rgb = [number, number, number];
/** A point equally near two colors goes to the lower-numbered one (a tiny bias, in the field's units), so no point is left without a body. */
const TIE = 1e-4;
const dist = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Up to `max` colors that stand for the mesh's triangle colors (by area), those closer than `merge` joined. */
export function pickPalette(mesh: Mesh, max = 4, merge = 40): Rgb[] {
  const { positions: p, indices: ix, colors } = mesh;
  if (!colors) throw new Error('The mesh has no colors');
  // area by color, in coarse buckets
  const buckets = new Map<number, { rgb: Rgb; area: number }>();
  for (let t = 0; t < ix.length / 3; t++) {
    const a = ix[t * 3] * 3;
    const b = ix[t * 3 + 1] * 3;
    const c = ix[t * 3 + 2] * 3;
    const nx = (p[b + 1] - p[a + 1]) * (p[c + 2] - p[a + 2]) - (p[b + 2] - p[a + 2]) * (p[c + 1] - p[a + 1]);
    const ny = (p[b + 2] - p[a + 2]) * (p[c] - p[a]) - (p[b] - p[a]) * (p[c + 2] - p[a + 2]);
    const nz = (p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a]);
    const area = Math.hypot(nx, ny, nz) / 2;
    const rgb: Rgb = [colors[t * 3], colors[t * 3 + 1], colors[t * 3 + 2]];
    const key = (rgb[0] >> 4) * 256 + (rgb[1] >> 4) * 16 + (rgb[2] >> 4);
    const e = buckets.get(key) ?? { rgb: [0, 0, 0] as Rgb, area: 0 };
    for (let k = 0; k < 3; k++) e.rgb[k] += rgb[k] * area;
    e.area += area;
    buckets.set(key, e);
  }
  const all = [...buckets.values()].map((e) => ({ rgb: e.rgb.map((v) => v / e.area) as Rgb, area: e.area }));
  const total = all.reduce((n, e) => n + e.area, 0);
  // colors that are only specks do not get a filament
  const real = all.filter((e) => e.area > total * 0.004);
  const seeds: Rgb[] = [real.reduce((a, b) => (b.area > a.area ? b : a)).rgb];
  while (seeds.length < max) {
    // the color farthest from every seed, weighted a little by how much of it there is
    let best: { rgb: Rgb; score: number } | undefined;
    for (const e of real) {
      const score = Math.min(...seeds.map((s) => dist(s, e.rgb))) * (1 + Math.sqrt(e.area / total));
      if (!best || score > best.score) best = { rgb: e.rgb, score };
    }
    if (!best || Math.min(...seeds.map((s) => dist(s, best.rgb))) < merge) break;
    seeds.push(best.rgb);
  }
  // a few rounds of k-means to settle each seed on the colors it stands for
  for (let round = 0; round < 6; round++) {
    const sum = seeds.map(() => [0, 0, 0, 0]);
    for (const e of all) {
      let k = 0;
      for (let i = 1; i < seeds.length; i++) if (dist(seeds[i], e.rgb) < dist(seeds[k], e.rgb)) k = i;
      for (let c = 0; c < 3; c++) sum[k][c] += e.rgb[c] * e.area;
      sum[k][3] += e.area;
    }
    sum.forEach((s, i) => {
      if (s[3] > 0) seeds[i] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
    });
  }
  return seeds.map((c) => c.map(Math.round) as Rgb);
}

export interface BodiesOptions {
  min: Vec3;
  max: Vec3;
  cell: number;
}

/** Squared distance transform along one line (Felzenszwalb and Huttenlocher), in place. */
function edt1(f: Float64Array, n: number, v: Int32Array, z: Float64Array, out: Float64Array): void {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s: number;
    for (;;) {
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      if (s <= z[k] && k > 0) k--;
      else break;
    }
    if (!(f[q] === Infinity && f[v[k]] === Infinity)) {
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = Infinity;
    }
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    out[q] = (q - v[k]) ** 2 + f[v[k]];
  }
}

/** For each palette color, how far a point is from the nearest surface vertex of that color (a distance transform on a grid, sampled smoothly). */
function colorDistances(mesh: Mesh, palette: Rgb[], o: BodiesOptions): (x: number, y: number, z: number, k: number) => number {
  const { positions: p, indices: ix, colors } = mesh;
  // each vertex takes the palette color of a triangle that uses it
  const vert = new Uint8Array(p.length / 3);
  for (let t = 0; t < ix.length / 3; t++) {
    const rgb: Rgb = [colors![t * 3], colors![t * 3 + 1], colors![t * 3 + 2]];
    let k = 0;
    for (let i = 1; i < palette.length; i++) if (dist(palette[i], rgb) < dist(palette[k], rgb)) k = i;
    for (let c = 0; c < 3; c++) vert[ix[t * 3 + c]] = k;
  }
  const { cell } = o;
  const nx = Math.ceil((o.max[0] - o.min[0]) / cell) + 3;
  const ny = Math.ceil((o.max[1] - o.min[1]) / cell) + 3;
  const nz = Math.ceil((o.max[2] - o.min[2]) / cell) + 3;
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const n = Math.max(nx, ny, nz);
  const [line, outLine] = [new Float64Array(n), new Float64Array(n)];
  const [v, z] = [new Int32Array(n), new Float64Array(n + 1)];
  const fields = palette.map((_, c) => {
    const d = new Float64Array(nx * ny * nz).fill(Infinity);
    for (let i = 0; i < vert.length; i++) {
      if (vert[i] !== c) continue;
      const gi = Math.round((p[i * 3] - o.min[0]) / cell) + 1;
      const gj = Math.round((p[i * 3 + 1] - o.min[1]) / cell) + 1;
      const gk = Math.round((p[i * 3 + 2] - o.min[2]) / cell) + 1;
      if (gi >= 0 && gj >= 0 && gk >= 0 && gi < nx && gj < ny && gk < nz) d[at(gi, gj, gk)] = 0;
    }
    // the transform along x, then y, then z
    for (const [axis, len, a, b, stride] of [
      [0, nx, ny, nz, 1],
      [1, ny, nx, nz, nx],
      [2, nz, nx, ny, nx * ny],
    ] as const) {
      for (let q = 0; q < a * b; q++) {
        const first = axis === 0 ? at(0, q % ny, Math.floor(q / ny)) : axis === 1 ? at(q % nx, 0, Math.floor(q / nx)) : at(q % nx, Math.floor(q / nx), 0);
        for (let i = 0; i < len; i++) line[i] = d[first + i * stride];
        edt1(line, len, v, z, outLine);
        for (let i = 0; i < len; i++) d[first + i * stride] = outLine[i];
      }
    }
    return d;
  });
  return (x, y, zz, c) => {
    const d = fields[c];
    // trilinear between the grid points round the point (clamped to the grid)
    const gx = Math.min(nx - 1.001, Math.max(0, (x - o.min[0]) / cell + 1));
    const gy = Math.min(ny - 1.001, Math.max(0, (y - o.min[1]) / cell + 1));
    const gz = Math.min(nz - 1.001, Math.max(0, (zz - o.min[2]) / cell + 1));
    const i = Math.floor(gx);
    const j = Math.floor(gy);
    const k = Math.floor(gz);
    const [fx, fy, fz] = [gx - i, gy - j, gz - k];
    let sum = 0;
    for (let dk = 0; dk < 2; dk++)
      for (let dj = 0; dj < 2; dj++)
        for (let di = 0; di < 2; di++) sum += Math.sqrt(d[at(i + di, j + dj, k + dk)]) * (di ? fx : 1 - fx) * (dj ? fy : 1 - fy) * (dk ? fz : 1 - fz);
    return sum * cell;
  };
}

/** One closed body per palette color (a color with no solid of its own is left out). */
export function colorBodies(mesh: Mesh, palette: Rgb[], field: (x: number, y: number, z: number) => number, o: BodiesOptions): { color: Rgb; mesh: Mesh }[] {
  const distance = colorDistances(mesh, palette, o);
  const out: { color: Rgb; mesh: Mesh }[] = [];
  palette.forEach((color, index) => {
    try {
      const body = tetraMesh((x, y, z) => {
        const f = field(x, y, z);
        if (f > 8 * o.cell) return f;
        let other = Infinity;
        for (let k = 0; k < palette.length; k++) if (k !== index) other = Math.min(other, distance(x, y, z, k) + k * TIE);
        // inside, the color whose surface is nearest owns the point: this one where its distance is the smaller
        return Math.max(f, distance(x, y, z, index) + index * TIE - other);
      }, o);
      if (body.indices.length) out.push({ color, mesh: body });
    } catch {
      /* a color with no solid of its own */
    }
  });
  return out;
}
