// Fewer triangles for a closed mesh, by quadric edge collapse (Garland and Heckbert, "Surface Simplification
// Using Quadric Error Metrics", 1997): the cheapest edge, by how far its merged point strays from the planes
// of the triangles around it, is collapsed until the next cost is over `maxError`. A collapse is refused when
// it would pinch the surface (the edge's two ends must share exactly the two vertices of its two triangles) or
// fold a triangle over, so a closed one-piece mesh stays closed and in one piece. A triangle's color rides with
// it, and an edge between two differently colored triangles also gets a plane of its own, so a color's border
// stays where it was. The sampling grid of the mesher (surfaceNets.ts) leaves flat and gently curved stretches
// in far more triangles than the shape needs; this takes them out.
import type { Mesh } from './mesh';

export interface DecimateOptions {
  /** The largest distance, in the mesh's units, a collapse may move the surface (the cost limit is its square, times the planes meeting there). */
  maxError: number;
  /** Colors further apart than this (0-255 steps) make an edge a color border to hold in place (default 30). */
  colorStep?: number;
  /** Never go below this many triangles (default 4). */
  minTriangles?: number;
}

/** A symmetric 4x4 matrix as ten numbers: a2, ab, ac, ad, b2, bc, bd, c2, cd, d2 (a plane ax + by + cz + d = 0). */
type Quadric = Float64Array;

function addPlane(q: Quadric, o: number, a: number, b: number, c: number, d: number, w: number): void {
  q[o] += w * a * a;
  q[o + 1] += w * a * b;
  q[o + 2] += w * a * c;
  q[o + 3] += w * a * d;
  q[o + 4] += w * b * b;
  q[o + 5] += w * b * c;
  q[o + 6] += w * b * d;
  q[o + 7] += w * c * c;
  q[o + 8] += w * c * d;
  q[o + 9] += w * d * d;
}

function errorAt(q: ArrayLike<number>, x: number, y: number, z: number): number {
  return (
    q[0] * x * x + 2 * q[1] * x * y + 2 * q[2] * x * z + 2 * q[3] * x + q[4] * y * y + 2 * q[5] * y * z + 2 * q[6] * y + q[7] * z * z + 2 * q[8] * z + q[9]
  );
}

interface Entry {
  cost: number;
  a: number;
  b: number;
  va: number;
  vb: number;
  /** Where the merged vertex goes. */
  x: number;
  y: number;
  z: number;
}

/** A binary min-heap on cost. */
class Heap {
  private items: Entry[] = [];
  get size(): number {
    return this.items.length;
  }
  /** Adds many at once and orders them in one pass. */
  fill(es: Entry[]): void {
    const h = this.items;
    for (const e of es) h.push(e);
    for (let i = (h.length >> 1) - 1; i >= 0; i--) this.down(i);
  }
  private down(start: number): void {
    const h = this.items;
    const top = h[start];
    let i = start;
    for (;;) {
      let c = i * 2 + 1;
      if (c >= h.length) break;
      if (c + 1 < h.length && h[c + 1].cost < h[c].cost) c++;
      if (h[c].cost >= top.cost) break;
      h[i] = h[c];
      i = c;
    }
    h[i] = top;
  }
  push(e: Entry): void {
    const h = this.items;
    let i = h.push(e) - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[p].cost <= e.cost) break;
      h[i] = h[p];
      i = p;
    }
    h[i] = e;
  }
  pop(): Entry | undefined {
    const h = this.items;
    const top = h[0];
    const last = h.pop();
    if (last && h.length) {
      let i = 0;
      for (;;) {
        let c = i * 2 + 1;
        if (c >= h.length) break;
        if (c + 1 < h.length && h[c + 1].cost < h[c].cost) c++;
        if (h[c].cost >= last.cost) break;
        h[i] = h[c];
        i = c;
      }
      h[i] = last;
    }
    return top;
  }
}

export function decimate(mesh: Mesh, o: DecimateOptions): Mesh {
  const nv = mesh.positions.length / 3;
  const nt = mesh.indices.length / 3;
  const pos = Float64Array.from(mesh.positions);
  const tv = Int32Array.from(mesh.indices);
  const colors = mesh.colors;
  const colorStep = o.colorStep ?? 30;
  const quadrics = new Float64Array(nv * 10);
  const alive = new Uint8Array(nt).fill(1);
  /** Each triangle's unit normal now (all zero for a sliver). */
  const tn = new Float64Array(nt * 3);
  const vertAlive = new Uint8Array(nv).fill(1);
  const version = new Int32Array(nv);
  const around: number[][] = Array.from({ length: nv }, () => []);
  for (let t = 0; t < nt; t++) for (let c = 0; c < 3; c++) around[tv[t * 3 + c]].push(t);

  /** Sets `nrm` to a triangle's unit normal and area (with vertex `swap` standing at `to`, if given). */
  const nrm = new Float64Array(4);
  const normal = (t: number, swap = -1, to?: ArrayLike<number>): Float64Array => {
    const v0 = tv[t * 3] * 3;
    const v1 = tv[t * 3 + 1] * 3;
    const v2 = tv[t * 3 + 2] * 3;
    let p0x = pos[v0];
    let p0y = pos[v0 + 1];
    let p0z = pos[v0 + 2];
    let p1x = pos[v1];
    let p1y = pos[v1 + 1];
    let p1z = pos[v1 + 2];
    let p2x = pos[v2];
    let p2y = pos[v2 + 1];
    let p2z = pos[v2 + 2];
    if (to) {
      const s3 = swap * 3;
      if (v0 === s3) [p0x, p0y, p0z] = [to[0], to[1], to[2]];
      else if (v1 === s3) [p1x, p1y, p1z] = [to[0], to[1], to[2]];
      else if (v2 === s3) [p2x, p2y, p2z] = [to[0], to[1], to[2]];
    }
    const ux = p1x - p0x;
    const uy = p1y - p0y;
    const uz = p1z - p0z;
    const wx = p2x - p0x;
    const wy = p2y - p0y;
    const wz = p2z - p0z;
    const nx = uy * wz - uz * wy;
    const ny = uz * wx - ux * wz;
    const nz = ux * wy - uy * wx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len < 1e-12) nrm.fill(0);
    else {
      nrm[0] = nx / len;
      nrm[1] = ny / len;
      nrm[2] = nz / len;
      nrm[3] = len / 2;
    }
    return nrm;
  };
  const plane = (t: number, v: number, w: number, q: Quadric) => {
    const [a, b, c] = normal(t);
    if (!a && !b && !c) return;
    for (const vertex of [tv[t * 3], tv[t * 3 + 1], tv[t * 3 + 2]])
      addPlane(q, vertex * 10, a, b, c, -(a * pos[v * 3] + b * pos[v * 3 + 1] + c * pos[v * 3 + 2]), w);
  };
  for (let t = 0; t < nt; t++) {
    plane(t, tv[t * 3], 1, quadrics);
    tn[t * 3] = nrm[0];
    tn[t * 3 + 1] = nrm[1];
    tn[t * 3 + 2] = nrm[2];
  }

  // which colors meet at each vertex (a bit for each of up to 31 colors, the 31st standing for any further ones): only
  // vertices that touch the same colors are merged, so a color's border neither shrinks nor wanders and a thin stripe stays
  const meets = new Int32Array(nv);
  if (colors) {
    const bit = new Map<number, number>();
    for (let t = 0; t < nt; t++) {
      const key = ((colors[t * 3] >> 3) << 10) | ((colors[t * 3 + 1] >> 3) << 5) | (colors[t * 3 + 2] >> 3);
      let b = bit.get(key);
      if (b === undefined) bit.set(key, (b = Math.min(bit.size, 30)));
      for (let c = 0; c < 3; c++) meets[tv[t * 3 + c]] |= 1 << b;
    }
  }
  // color borders: across an edge between differently colored triangles, a plane holding the edge in place
  if (colors) {
    const edgeTri = new Map<number, number>();
    for (let t = 0; t < nt; t++)
      for (let c = 0; c < 3; c++) {
        const a = tv[t * 3 + c];
        const b = tv[t * 3 + ((c + 1) % 3)];
        const key = Math.min(a, b) * nv + Math.max(a, b);
        const other = edgeTri.get(key);
        if (other === undefined) {
          edgeTri.set(key, t);
          continue;
        }
        if (Math.hypot(colors[t * 3] - colors[other * 3], colors[t * 3 + 1] - colors[other * 3 + 1], colors[t * 3 + 2] - colors[other * 3 + 2]) <= colorStep)
          continue;
        const ex = pos[b * 3] - pos[a * 3];
        const ey = pos[b * 3 + 1] - pos[a * 3 + 1];
        const ez = pos[b * 3 + 2] - pos[a * 3 + 2];
        const el = Math.hypot(ex, ey, ez) || 1;
        for (const face of [t, other]) {
          const [fx, fy, fz] = normal(face);
          // the plane through the edge that contains the face's normal
          let px = ey * fz - ez * fy;
          let py = ez * fx - ex * fz;
          let pz = ex * fy - ey * fx;
          const pl = Math.hypot(px, py, pz);
          if (pl < 1e-12) continue;
          px /= pl;
          py /= pl;
          pz /= pl;
          const d = -(px * pos[a * 3] + py * pos[a * 3 + 1] + pz * pos[a * 3 + 2]);
          // heavier than a face plane: a border of a color is a feature
          addPlane(quadrics, a * 10, px, py, pz, d, 4 * el);
          addPlane(quadrics, b * 10, px, py, pz, d, 4 * el);
        }
      }
  }

  const limit = o.maxError * o.maxError;
  const heap = new Heap();
  const sum = new Float64Array(10);
  // the vertices round a vertex, each once (a stamp stands in for a set)
  const seen = new Int32Array(nv);
  let stamp = 0;
  const neighbours = (v: number, into: number[] = []): number[] => {
    stamp++;
    into.length = 0;
    for (const t of around[v])
      for (let c = 0; c < 3; c++) {
        const n = tv[t * 3 + c];
        if (n !== v && seen[n] !== stamp) {
          seen[n] = stamp;
          into.push(n);
        }
      }
    return into;
  };
  const shared: number[] = [];
  const nearA: number[] = [];
  const nearB: number[] = [];
  /** The cheapest point to merge a and b to (left in `best`) and what it costs. */
  const best = new Float64Array(3);
  const cheapest = (a: number, b: number): number => {
    for (let k = 0; k < 10; k++) sum[k] = quadrics[a * 10 + k] + quadrics[b * 10 + k];
    const ax = pos[a * 3];
    const ay = pos[a * 3 + 1];
    const az = pos[a * 3 + 2];
    const bx = pos[b * 3];
    const by = pos[b * 3 + 1];
    const bz = pos[b * 3 + 2];
    const len = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2);
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const mz = (az + bz) / 2;
    // the best of the ends and the middle, unless the quadric's own minimum is well defined, near the edge and cheaper
    let cost = errorAt(sum, mx, my, mz);
    best[0] = mx;
    best[1] = my;
    best[2] = mz;
    const ea = errorAt(sum, ax, ay, az);
    if (ea < cost) [cost, best[0], best[1], best[2]] = [ea, ax, ay, az];
    const eb = errorAt(sum, bx, by, bz);
    if (eb < cost) [cost, best[0], best[1], best[2]] = [eb, bx, by, bz];
    // solve [a2 ab ac; ab b2 bc; ac bc c2] p = -[ad bd cd]
    const [m00, m01, m02, v0, m11, m12, v1, m22, v2] = sum;
    const det = m00 * (m11 * m22 - m12 * m12) - m01 * (m01 * m22 - m12 * m02) + m02 * (m01 * m12 - m11 * m02);
    if (Math.abs(det) > 1e-9) {
      const x = -(v0 * (m11 * m22 - m12 * m12) - m01 * (v1 * m22 - m12 * v2) + m02 * (v1 * m12 - m11 * v2)) / det;
      const y = -(m00 * (v1 * m22 - m12 * v2) - v0 * (m01 * m22 - m12 * m02) + m02 * (m01 * v2 - v1 * m02)) / det;
      const z = -(m00 * (m11 * v2 - v1 * m12) - m01 * (m01 * v2 - v1 * m02) + v0 * (m01 * m12 - m11 * m02)) / det;
      if ((x - mx) ** 2 + (y - my) ** 2 + (z - mz) ** 2 <= len * len) {
        const e = errorAt(sum, x, y, z);
        if (e < cost) [cost, best[0], best[1], best[2]] = [e, x, y, z];
      }
    }
    return Math.max(0, cost);
  };
  const queue = (a: number, b: number, into: Entry[] | undefined = undefined) => {
    const cost = cheapest(a, b);
    if (cost > limit) return;
    const entry = { cost, a, b, va: version[a], vb: version[b], x: best[0], y: best[1], z: best[2] };
    if (into) into.push(entry);
    else heap.push(entry);
  };
  const first: Entry[] = [];
  for (let v = 0; v < nv; v++) for (const n of neighbours(v, nearA)) if (n > v) queue(v, n, first);
  heap.fill(first);

  let tris = nt;
  const floor = o.minTriangles ?? 4;
  while (heap.size && tris > floor) {
    const e = heap.pop()!;
    const { a, b } = e;
    if (!vertAlive[a] || !vertAlive[b] || version[a] !== e.va || version[b] !== e.vb) continue;
    if (meets[a] !== meets[b]) continue;
    best[0] = e.x;
    best[1] = e.y;
    best[2] = e.z;
    shared.length = 0;
    for (const t of around[a]) if (tv[t * 3] === b || tv[t * 3 + 1] === b || tv[t * 3 + 2] === b) shared.push(t);
    if (shared.length !== 2) continue;
    // the link condition: the ends have no neighbors in common but the two opposite vertices
    neighbours(a, nearA);
    neighbours(b, nearB);
    stamp++;
    for (const n of nearA) seen[n] = stamp;
    let common = 0;
    for (const n of nearB) if (seen[n] === stamp) common++;
    if (common !== 2) continue;
    // no triangle may fold over or shrink to nothing
    let ok = true;
    for (let end = 0; end < 2 && ok; end++) {
      const v = end ? b : a;
      for (const t of around[v]) {
        if (t === shared[0] || t === shared[1]) continue;
        const after = normal(t, v, best);
        if (after[3] === 0 || tn[t * 3] * after[0] + tn[t * 3 + 1] * after[1] + tn[t * 3 + 2] * after[2] < 0.25) {
          ok = false;
          break;
        }
      }
    }
    if (!ok) continue;
    // collapse b into a, at the best point
    for (const t of shared) {
      alive[t] = 0;
      // the two triangles are gone from all their corners
      for (let c = 0; c < 3; c++) {
        const list = around[tv[t * 3 + c]];
        list[list.indexOf(t)] = list[list.length - 1];
        list.pop();
      }
    }
    tris -= 2;
    for (const t of around[b]) {
      for (let c = 0; c < 3; c++) if (tv[t * 3 + c] === b) tv[t * 3 + c] = a;
      around[a].push(t);
    }
    around[b] = [];
    pos[a * 3] = best[0];
    pos[a * 3 + 1] = best[1];
    pos[a * 3 + 2] = best[2];
    for (const t of around[a]) {
      normal(t);
      tn[t * 3] = nrm[0];
      tn[t * 3 + 1] = nrm[1];
      tn[t * 3 + 2] = nrm[2];
    }
    vertAlive[b] = 0;
    for (let k = 0; k < 10; k++) quadrics[a * 10 + k] += quadrics[b * 10 + k];
    version[a]++;
    // a's neighbors now: both ends' old ones but the two ends
    stamp++;
    seen[a] = stamp;
    seen[b] = stamp;
    for (const list of [nearA, nearB])
      for (const n of list)
        if (seen[n] !== stamp) {
          seen[n] = stamp;
          queue(a, n);
        }
  }

  // compact: the vertices and triangles left
  const renumber = new Int32Array(nv).fill(-1);
  const outPos: number[] = [];
  const outIdx: number[] = [];
  const outColors: number[] = [];
  for (let t = 0; t < nt; t++) {
    if (!alive[t]) continue;
    for (let c = 0; c < 3; c++) {
      const v = tv[t * 3 + c];
      if (renumber[v] < 0) {
        renumber[v] = outPos.length / 3;
        outPos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
      }
      outIdx.push(renumber[v]);
    }
    if (colors) outColors.push(colors[t * 3], colors[t * 3 + 1], colors[t * 3 + 2]);
  }
  return {
    positions: Float32Array.from(outPos),
    indices: Uint32Array.from(outIdx),
    ...(colors ? { colors: Uint8Array.from(outColors) } : {}),
  };
}
