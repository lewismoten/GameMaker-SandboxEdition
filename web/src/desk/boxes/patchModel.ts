// The embroidered patch as a 3D model (texturedGl.ts): a thin disc of the patch's real size, its face the stitch simulation
// (laser/<game>/patch/preview.png) laid on a flat top, a raised, rounded satin rim in the border's thread color, and a plain
// stabilizer back. The axis is y (the front faces +y), the same frame as coinModel.ts, whose triangle helper it shares.
import { tri } from './coinModel';
import type { TexPiece } from './texturedGl';

type V3 = [number, number, number];

const FACETS = 120;
const THREAD: [number, number, number] = [0.94, 0.63, 0.13];
const BACK: [number, number, number] = [0.88, 0.86, 0.8];
/** How far the satin rim stands above the face, and how far in it slopes, mm. */
const RISE = 0.7;
const SLOPE = 0.9;

/**
 * The patch's pieces. `diameter` is the cut-out size (mm), `thickness` the backing's, and `pictureMm` the width of the
 * square preview picture (the face's picture is laid so that the patch's center is the picture's center).
 */
export function patchPieces(diameter: number, thickness: number, pictureMm: number, face?: TexImageSource): TexPiece[] {
  const R = diameter / 2;
  const h = thickness / 2;
  const ring = (i: number, r: number, y: number): V3 => {
    const a = (i / FACETS) * Math.PI * 2;
    return [r * Math.cos(a), y, r * Math.sin(a)];
  };
  const out = (i: number): V3 => {
    const a = ((i + 0.5) / FACETS) * Math.PI * 2;
    return [Math.cos(a), 0, Math.sin(a)];
  };
  const disc = (r: number, y: number, side: 1 | -1, texture?: TexImageSource): TexPiece => {
    const pos: number[] = [];
    const nor: number[] = [];
    const uv: number[] = [];
    const st = (p: V3): [number, number] => [0.5 - (side * p[0]) / pictureMm, 0.5 - p[2] / pictureMm];
    const mid: V3 = [0, y, 0];
    for (let i = 0; i < FACETS; i++) {
      const a = ring(i, r, y);
      const b = ring(i + 1, r, y);
      tri(pos, nor, mid, a, b, [0, side, 0], uv, [st(mid), st(a), st(b)]);
    }
    return {
      positions: new Float32Array(pos),
      normals: new Float32Array(nor),
      uvs: texture ? new Float32Array(uv) : undefined,
      texture,
      color: texture ? [1, 1, 1] : BACK,
    };
  };
  const pos: number[] = [];
  const nor: number[] = [];
  for (let i = 0; i < FACETS; i++) {
    const n = out(i);
    const bevel: V3 = [n[0] * 0.62, 0.78, n[2] * 0.62];
    // the wall, then the slope up to the face
    tri(pos, nor, ring(i, R, -h), ring(i + 1, R, -h), ring(i + 1, R, h), n);
    tri(pos, nor, ring(i, R, -h), ring(i + 1, R, h), ring(i, R, h), n);
    tri(pos, nor, ring(i, R, h), ring(i + 1, R, h), ring(i + 1, R - SLOPE, h + RISE), bevel);
    tri(pos, nor, ring(i, R, h), ring(i + 1, R - SLOPE, h + RISE), ring(i, R - SLOPE, h + RISE), bevel);
  }
  return [disc(R - SLOPE, h + RISE, 1, face), disc(R, -h, -1), { positions: new Float32Array(pos), normals: new Float32Array(nor), color: THREAD }];
}
