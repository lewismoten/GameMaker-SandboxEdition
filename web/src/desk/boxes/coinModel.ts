// The wooden nickel as a 3D model (texturedGl.ts): a disc of the kit's real size (38.1 mm across, 3 mm of wood) in a wood color,
// the nickel's front and back pictures (laser/<game>/front.png and back.png, a render of what the laser engraves) laid on its two
// faces, and a reeded rim, the way a coin's edge is milled: many narrow facets alternately tipped, so the light catches every
// other one. The axis is y (the front faces +y), the same frame as trinketGl.ts.
import type { TexPiece } from './texturedGl';

/** The cut line is drawn at the picture's edge; this much of the picture's radius is used so it stays off the coin. */
const INSET = 0.965;
const WOOD: [number, number, number] = [0.8, 0.62, 0.42];
const FACETS = 144;
const REED = 0.42; // radians each rim facet tips from the radial direction

type V3 = [number, number, number];

/** Pushes the triangle a, b, c turned so its face looks along `n` (the faces are culled from behind). */
export function tri(out: number[], nOut: number[], a: V3, b: V3, c: V3, n: V3, uv?: number[], uvs?: [number, number][]) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const wx = c[0] - a[0];
  const wy = c[1] - a[1];
  const wz = c[2] - a[2];
  const g = [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx];
  const flip = g[0] * n[0] + g[1] * n[1] + g[2] * n[2] < 0;
  const order = flip ? [a, c, b] : [a, b, c];
  const orderUv = uvs && (flip ? [uvs[0], uvs[2], uvs[1]] : uvs);
  order.forEach((p, i) => {
    out.push(...p);
    nOut.push(...n);
    if (uv && orderUv) uv.push(...orderUv[i]);
  });
}

/** The coin's pieces: front face, back face and rim. `front` and `back` are the pictures, when they have loaded. */
export function coinPieces(diameter: number, thickness: number, front?: TexImageSource, back?: TexImageSource): TexPiece[] {
  const R = diameter / 2;
  const h = thickness / 2;
  const ring = (i: number, y: number): V3 => {
    const a = (i / FACETS) * Math.PI * 2;
    return [R * Math.cos(a), y, R * Math.sin(a)];
  };
  const cap = (side: 1 | -1, texture?: TexImageSource): TexPiece => {
    const pos: number[] = [];
    const nor: number[] = [];
    const uv: number[] = [];
    const st = (p: V3): [number, number] => [0.5 - (side * 0.5 * INSET * p[0]) / R, 0.5 - (0.5 * INSET * p[2]) / R];
    const mid: V3 = [0, side * h, 0];
    for (let i = 0; i < FACETS; i++) {
      const a = ring(i, side * h);
      const b = ring(i + 1, side * h);
      tri(pos, nor, mid, a, b, [0, side, 0], uv, [st(mid), st(a), st(b)]);
    }
    return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvs: new Float32Array(uv), texture, color: texture ? [1, 1, 1] : WOOD };
  };
  const pos: number[] = [];
  const nor: number[] = [];
  for (let i = 0; i < FACETS; i++) {
    const mid = ((i + 0.5) / FACETS) * Math.PI * 2;
    const tilt = i % 2 ? REED : -REED;
    const around = mid + tilt;
    const n: V3 = [Math.cos(around), 0, Math.sin(around)];
    const a = ring(i, h);
    const b = ring(i + 1, h);
    const c = ring(i + 1, -h);
    const d = ring(i, -h);
    // the facet itself faces outward; its tipped normal is what the light sees
    const out: number[] = [];
    const outN: number[] = [];
    tri(out, outN, a, b, c, [Math.cos(mid), 0, Math.sin(mid)]);
    tri(out, outN, a, c, d, [Math.cos(mid), 0, Math.sin(mid)]);
    pos.push(...out);
    for (let k = 0; k < 6; k++) nor.push(...n);
  }
  return [cap(1, front), cap(-1, back), { positions: new Float32Array(pos), normals: new Float32Array(nor), color: [0.7, 0.53, 0.34] }];
}
