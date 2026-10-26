// The isometric cells: parts of a level drawn as if the camera swung round to a corner. Each
// 20x20 block holds one map cell seen from the south-east and above, a unit square on the
// floor becoming a 20x10 diamond: floors are diamond checkers that tile seamlessly from block
// to block, cubes are hexagons with a lit top, a lit left face and a shaded right one, and
// amber near cubes stand a full tier above the low cyan far ones. Ray and the monsters keep
// their own pictures; only the backdrop turns. The rule doesn't change: sharp is solid.
import { blur, over, render, type Camera, type Picture } from '../render/image';
import { Box, Sdf, hull, mix, norm, rgb, sd, type Material, type Shape, type V, type World } from '../render/tracer';
import { FAR_COL, KINDS, LENS_COL, NEAR_COL, type CellKey, type Plane } from './cells';
import { THEMES, type Theme, type ThemeId } from './themes';

/** Screen pixels per unit of height, and the height of a full-tier cube (its hexagon fills the block). */
const ZPX = 12.5;
const ISO_H = 10 / ZPX;

/** World (x, y, z) to block pixels: the cell's floor diamond fills the lower half of the block. */
const isoXY = (x: number, y: number, z: number): [number, number] => [10 + 10 * (x - y), 10 + 5 * (x + y) - ZPX * z];

/** The isometric camera: parallel rays from the south-east, above. */
function isoCamera(top = 4): Camera {
  const d = norm([-1, -1, -10 / ZPX]);
  return {
    ray(sx, sy) {
      const a = (sx - 10) / 10; // x - y
      const b = (sy - 10 + ZPX * top) / 5; // x + y
      return [[(a + b) / 2, (b - a) / 2, top], d];
    },
  };
}

/** The light for isometric cells: high and from the left, so top, left and right faces read as three shades. */
const ISO_KEY: V = norm([-0.25, 0.55, 0.8]);

/** Each theme's diamond floor: two checker shades and the bright line round every diamond. */
const FLOORS: Partial<Record<ThemeId, { a: V; b: V; line: V; wall: V }>> = {
  vanish: { a: rgb(12, 14, 40), b: rgb(24, 28, 66), line: rgb(70, 190, 240), wall: rgb(96, 104, 170) },
  mirror: { a: rgb(30, 22, 50), b: rgb(56, 40, 88), line: rgb(190, 150, 245), wall: rgb(200, 205, 230) },
  peaks: { a: rgb(80, 130, 56), b: rgb(110, 150, 66), line: rgb(225, 235, 170), wall: rgb(160, 145, 135) },
  teapot: { a: rgb(196, 104, 60), b: rgb(150, 76, 44), line: rgb(250, 230, 190), wall: rgb(235, 215, 170) },
};

function floorMat(t: Theme): Material {
  const f = FLOORS[t.id] ?? { a: rgb(60, 60, 80), b: rgb(90, 90, 120), line: rgb(220, 220, 240) };
  return {
    color: (p) => {
      const u = p[0] - Math.floor(p[0]);
      const v = p[1] - Math.floor(p[1]);
      const e = Math.min(u, v, 1 - u, 1 - v);
      if (e < 0.05) return f.line;
      return (Math.floor(p[0]) + Math.floor(p[1])) & 1 ? f.b : f.a;
    },
    // no reflection: a mirrored sky would wash the diamonds out and lose Ray against them
    diffuse: 0.85,
    spec: 0.4,
    shine: 50,
  };
}

const solidOf = (c: V, emit = 0.1): Material => ({
  color: c,
  diffuse: 0.9,
  spec: 0.8,
  shine: 60,
  emit: [c[0] * emit, c[1] * emit, c[2] * emit],
  noShadow: true,
});

/** A cube on the cell's unit square, `h` tall (in units of the full tier). */
function isoCube(mat: Material, h = 1, inset = 0.02): Shape {
  const top = ISO_H * h;
  const r = 0.03;
  return new Sdf(
    [
      [inset, inset, 0],
      [1 - inset, 1 - inset, top],
    ],
    (px, py, pz) => sd.box(px - 0.5, py - 0.5, pz - top / 2, 0.5 - inset, 0.5 - inset, top / 2, r),
    [{ ...mat, noShadow: true }],
  );
}

const ghost = <S extends Shape>(s: S): S => {
  s.ghost = true;
  return s;
};

/** A stair run: `steps` steps rising toward the back (north-west), the last one a full tier. */
function stairs(mat: Material, steps = 4): Shape[] {
  const out: Shape[] = [];
  for (let k = 0; k < steps; k++) {
    const y0 = k / steps;
    out.push(new Box([0.02, 0.02, 0], [0.98, 1 - y0, (ISO_H * (k + 1)) / steps], { ...mat, noShadow: true }));
  }
  return out;
}

/** A shard prism: a violet crystal on a dark plinth (Count Polygon throws its shards); lit, it is about to throw. */
function prism(lit = false): Shape[] {
  const c: V = [0.5, 0.5, 0];
  const glow: Material = lit
    ? { color: rgb(255, 210, 255), diffuse: 0.5, spec: 1.4, shine: 110, emit: rgb(255, 120, 230), noShadow: true }
    : { color: rgb(210, 140, 255), diffuse: 0.5, spec: 1.4, shine: 110, emit: rgb(90, 40, 140), noShadow: true };
  const pts: V[] = [];
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    pts.push([c[0] + Math.cos(a) * 0.28, c[1] + Math.sin(a) * 0.28, 0.5]);
  }
  return [
    new Box([0.18, 0.18, 0], [0.82, 0.82, 0.22], { color: rgb(40, 30, 70), diffuse: 0.8, spec: 0.8, shine: 40, noShadow: true }),
    hull([...pts, [c[0], c[1], 0.2], [c[0], c[1], 1.15]], glow),
  ];
}

/** What a cell holds when it is drawn isometrically; undefined: its usual shapes. */
function isoShapes(key: CellKey, p: Plane, t: Theme): Shape[] | undefined {
  const part = key.part ?? 0;
  switch (key.kind) {
    case 'wall':
      return [isoCube(wallMat(t))];
    case 'near':
      // the near plane is the upper tier: full height
      return [p === 'near' ? isoCube(solidOf(NEAR_COL)) : ghost(isoCube(solidOf(NEAR_COL, 0.3), 1, 0.12))];
    case 'far':
      // the far plane is the lower tier: half height
      return [p === 'far' ? isoCube(solidOf(FAR_COL), 0.5) : ghost(isoCube(solidOf(FAR_COL, 0.3), 0.5, 0.12))];
    case 'gateR':
    case 'gateG':
    case 'gateB':
    case 'sealB': {
      const c = LENS_COL[key.kind === 'sealB' ? 'B' : (key.kind.slice(-1) as 'R' | 'G' | 'B')];
      return [isoCube({ color: mix(c, [1, 1, 1], 0.15), diffuse: 0.6, reflect: 0.2, spec: 1.3, shine: 110, emit: [c[0] * 0.3, c[1] * 0.3, c[2] * 0.3] })];
    }
    case 'crowngate':
      return [isoCube(solidOf(rgb(255, 200, 70), 0.2))];
    case 'stair':
      return stairs(wallMat(t), part || 4);
    case 'steps':
      // walkable: a low run of steps up into the room, ankle high
      return stairs(mix3(t), 3).map((s) => scaleZ(s, 0.25));
    case 'prism':
      return prism();
    case 'prismLit':
      return prism(true);
    default:
      return undefined;
  }
}

/** Isometric walls: flat-lit stone in the theme's wall shade, so the three faces read. */
const wallMat = (t: Theme): Material => ({ color: FLOORS[t.id]?.wall ?? rgb(150, 150, 170), diffuse: 0.9, spec: 0.5, shine: 40, noShadow: true });

const mix3 = (t: Theme): Material => {
  const f = FLOORS[t.id];
  return { color: f ? mix(f.b, f.line, 0.35) : rgb(150, 150, 170), diffuse: 0.85, spec: 0.6, shine: 40, noShadow: true };
};

/** Flattens a box to a fraction of its height (low steps). */
function scaleZ(s: Shape, k: number): Shape {
  if (s instanceof Box) return new Box([s.lo[0], s.lo[1], s.lo[2] * k], [s.hi[0], s.hi[1], s.hi[2] * k], s.mat);
  return s;
}

function isoWorld(shapes: Shape[], t: Theme): World {
  return {
    shapes,
    key: { dir: ISO_KEY, color: t.key, soft: 0.05 },
    sky: mix(t.sky, [0, 0, 0], 0.2),
    ground: mix(t.ground, [0, 0, 0], 0.3),
    env: t.env,
    backdrop: () => t.abyss,
    maxDepth: 3,
  };
}

/** Light halos for isometric cells: [x, y, z, radius px, color] in the cell's own units. */
function isoGlows(p: Picture, glows: [number, number, number, number, V][]): void {
  for (const [gx, gy, gz, r, c] of glows) {
    // the oblique glow positions are given for the oblique cell (y 0.58 = the middle); recentre
    const [sx, sy] = isoXY(gx, gy - 0.08, gz);
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const d = Math.hypot(x + 0.5 - sx, y + 0.5 - sy) / r;
        if (d >= 1) continue;
        const a = (1 - d) ** 2 * 0.55;
        const i = (y * p.w + x) * 3;
        for (let ch = 0; ch < 3; ch++) p.rgb[i + ch] += c[ch] * a;
      }
  }
}

/** One isometric cell's block in one plane: 20x20 linear RGB. */
export function renderIsoCell(key: CellKey, plane: Plane, themeId: ThemeId, seed = 1): Picture {
  const t = THEMES[themeId];
  const kind = KINDS[key.kind];
  if (kind.ground(plane) === 'pit') throw new Error(`${key.kind}: no pits in isometric cells`);
  const shapes: Shape[] = [new Box([-4, -4, -1], [5, 5, 0], floorMat(t))];
  const own = isoShapes(key, plane, t) ?? kind.shapes?.(0, 0, plane, t, key.part ?? 0) ?? [];
  // items made for the oblique cell stand a little south of the middle; centre them
  shapes.push(...own);
  const world = isoWorld(shapes, t);
  const cam = isoCamera();
  const pic = render(world, cam, 20, 20, { spp: 6, edgeSpp: 25, seed });
  if (shapes.some((s) => s.ghost)) {
    const g = render(world, cam, 20, 20, { spp: 6, edgeSpp: 16, seed: seed + 9, ghost: true });
    const soft = blur(g, 1.3);
    for (let i = 0; i < soft.rgb.length; i++) soft.rgb[i] = soft.rgb[i] * 0.8 + 0.12;
    over(pic, soft, 0.55);
  }
  if (kind.glows && !isoShapes(key, plane, t)) isoGlows(pic, kind.glows(plane, key.part ?? 0));
  return pic;
}
