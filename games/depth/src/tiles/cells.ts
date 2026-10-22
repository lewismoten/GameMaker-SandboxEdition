// What each kind of map cell is in 3D, in each focus plane, and how its 20x20 block is
// rendered: the cell and its neighbors are built as a little scene (so shadows fall across
// block edges and pits show their inner walls), seen through the game's oblique camera and
// cropped to the cell. Whatever is out of focus in a plane is traced on a layer of its own,
// blurred and laid over the floor at half strength: sharp means solid, a blur means it isn't there.
import { blur, oblique, over, render, type Picture, OBLIQUE_K } from '../render/image';
import { MAT } from '../render/look';
import { Box, Cylinder, Sdf, Sphere, hull, mix, rgb, sd, type Material, type Shape, type V, type World } from '../render/tracer';
import { THEMES, type Theme, type ThemeId } from './themes';

export type Plane = 'near' | 'far';
export const PLANES: Plane[] = ['near', 'far'];

/** Block height of a cube (cells), and how much of a cell its south face takes on screen. */
export const H = 0.8;
export const F = OBLIQUE_K * H;

/** The planes' colors: near things are warm amber, far things cool cyan. */
export const NEAR_COL = rgb(255, 150, 40);
export const FAR_COL = rgb(40, 200, 255);
export const LENS_COL: Record<'R' | 'G' | 'B', V> = { R: rgb(255, 40, 50), G: rgb(40, 230, 70), B: rgb(50, 90, 255) };

export interface Ctx {
  w: boolean;
  n: boolean;
  nw: boolean;
  nPit: boolean;
}

export interface Kind {
  ground(p: Plane): 'floor' | 'pit';
  /** Casts a full cube's shadow on the floor east and south of it. */
  tall(p: Plane): boolean;
  /** Its own geometry over the slab (ghost shapes are out of focus in this plane). */
  shapes?(cx: number, cy: number, p: Plane, t: Theme, part: number): Shape[];
  /** Glows added after rendering: [x, y, z, radius px, color]. */
  glows?(p: Plane, part: number): [number, number, number, number, V][];
  /** How many cells it spans (multi-cell models): [w, h]. */
  span?: [number, number];
}

const ghost = <S extends Shape>(s: S): S => {
  s.ghost = true;
  return s;
};

/** A cube standing in its cell: the footprint is set back so its top fills the cell on screen. */
export function cube(cx: number, cy: number, mat: Material, opts: { h?: number; inset?: number; round?: number } = {}): Shape {
  const h = opts.h ?? H;
  const inset = opts.inset ?? 0;
  const r = opts.round ?? 0.06;
  const f = OBLIQUE_K * h;
  const hx = 0.5 - inset;
  const hy = (1 - f) / 2 - inset;
  const hz = h / 2;
  const x = cx + 0.5;
  const y = cy + f + (1 - f) / 2;
  const z = hz;
  return new Sdf(
    [
      [x - hx, y - hy, 0],
      [x + hx, y + hy, h],
    ],
    (px, py, pz) => sd.box(px - x, py - y, pz - z, hx, hy, hz, r),
    [mat],
  );
}

/** Where a small thing standing on the middle of a cell sits (x, y on the floor). */
export const mid = (cx: number, cy: number): [number, number] => [cx + 0.5, cy + 0.58];

const glassOf = (c: V, glow = 0.25): Material => ({
  color: c,
  diffuse: 0.25,
  spec: 1.4,
  shine: 120,
  glass: { ior: 1.4, tint: mix(c, [1, 1, 1], 0.45), absorb: 0.1 },
  emit: [c[0] * glow, c[1] * glow, c[2] * glow],
});

const amber: Material = { color: NEAR_COL, diffuse: 0.85, spec: 1.0, shine: 70, fresnel: 0.3, emit: [0.12, 0.05, 0] };
const cyan: Material = { color: FAR_COL, diffuse: 0.75, spec: 1.2, shine: 90, fresnel: 0.35, emit: [0, 0.05, 0.1] };

/** The felt egg (the Prism Egg): black felt, a silver checker band, a violet cube appliqué. */
export function eggShape(x: number, y: number, z: number, s = 1): Shape {
  const felt: Material = {
    color: (p) => {
      const lz = (p[2] - z) / s;
      const band = Math.abs(lz) < 0.05;
      if (band) return (Math.floor((Math.atan2(p[1] - y, p[0] - x) * 12) / Math.PI) & 1) === 0 ? rgb(200, 205, 225) : rgb(30, 26, 44);
      // the violet cube on its front
      const fx = (p[0] - x) / s;
      if (p[1] > y && Math.abs(fx) < 0.07 && lz > 0.07 && lz < 0.2) return lz > 0.15 ? rgb(170, 130, 240) : fx < 0 ? rgb(122, 79, 208) : rgb(80, 44, 150);
      return rgb(24, 20, 34);
    },
    diffuse: 1,
    spec: 0.15,
    shine: 8,
  };
  const a = 0.17 * s;
  return new Sdf(
    [
      [x - a, y - a, z - 0.25 * s],
      [x + a, y + a, z + 0.25 * s],
    ],
    (px, py, pz) => {
      const lz = (pz - z) / s;
      const k = 1 + lz * 0.35; // narrower at the top
      return sd.ellipsoid((px - x) / k, (py - y) / k, pz - z, 0.16 * s, 0.16 * s, 0.22 * s);
    },
    [felt],
  );
}

/** The kinds of cell. Items stand on the floor; cubes fill the cell. */
export function kinds(): Record<string, Kind> {
  const floor = (): Kind => ({ ground: () => 'floor', tall: () => false });
  const pit = (): Kind => ({ ground: () => 'pit', tall: () => false });
  const item = (build: (x: number, y: number, t: Theme) => Shape[], glows?: Kind['glows']): Kind => ({
    ground: () => 'floor',
    tall: () => false,
    shapes: (cx, cy, _p, t) => build(...mid(cx, cy), t),
    glows,
  });
  const lens = (c: 'R' | 'G' | 'B'): Kind =>
    item(
      (x, y) => [
        new Sdf(
          [
            [x - 0.25, y - 0.1, 0.12],
            [x + 0.25, y + 0.1, 0.62],
          ],
          (px, py, pz) => sd.ellipsoid(px - x, py - y, pz - 0.37, 0.21, 0.06, 0.21),
          [glassOf(LENS_COL[c], 0.45)],
        ),
        new Sdf(
          [
            [x - 0.3, y - 0.08, 0.06],
            [x + 0.3, y + 0.08, 0.66],
          ],
          (px, py, pz) => Math.hypot(Math.hypot(px - x, pz - 0.37) - 0.23, py - y) - 0.035,
          [MAT.gold],
        ),
        new Cylinder(x, y, 0.03, 0, 0.14, MAT.gold),
        new Cylinder(x, y, 0.11, 0, 0.03, MAT.gold),
      ],
      () => [[0.5, 0.58, 0.37, 7, mix(LENS_COL[c], [1, 1, 1], 0.2)]],
    );
  const gate = (c: 'R' | 'G' | 'B'): Kind => ({
    ground: () => 'floor',
    tall: () => true,
    shapes: (cx, cy) => [
      cube(cx, cy, { color: mix(LENS_COL[c], [1, 1, 1], 0.15), diffuse: 0.55, reflect: 0.2, fresnel: 0.45, spec: 1.3, shine: 110, emit: [LENS_COL[c][0] * 0.3, LENS_COL[c][1] * 0.3, LENS_COL[c][2] * 0.3] }, { round: 0.03, inset: 0.04 }),
      ...frame(cx, cy),
    ],
  });
  const frame = (cx: number, cy: number): Shape[] => {
    const f = F;
    const out: Shape[] = [];
    for (const x of [cx + 0.03, cx + 0.97]) out.push(new Cylinder(x, cy + 0.99, 0.035, 0, H, MAT.chrome));
    out.push(new Box([cx, cy + f, H - 0.06], [cx + 1, cy + 1, H], MAT.chrome));
    return out;
  };
  const K: Record<string, Kind> = {
    floor: floor(),
    pit: pit(),
    void: pit(),
    wall: { ground: () => 'floor', tall: () => true, shapes: (cx, cy, _p, t) => [cube(cx, cy, t.wall)] },
    near: {
      ground: () => 'floor',
      tall: (p) => p === 'near',
      shapes: (cx, cy, p) => [p === 'near' ? cube(cx, cy, amber) : ghost(cube(cx, cy, amber, { inset: 0.08, round: 0.14 }))],
    },
    far: {
      ground: () => 'floor',
      tall: (p) => p === 'far',
      shapes: (cx, cy, p) => [p === 'far' ? cube(cx, cy, cyan) : ghost(cube(cx, cy, cyan, { inset: 0.08, round: 0.14 }))],
    },
    // glass bridges: floor in one plane, a ghost over the void in the other
    nbridge: {
      ground: (p) => (p === 'near' ? 'floor' : 'pit'),
      tall: () => false,
      shapes: (cx, cy, p) => {
        const panel = new Box([cx + 0.02, cy + 0.02, -0.08], [cx + 0.98, cy + 0.98, 0], { ...glassOf(NEAR_COL, 0.2), diffuse: 0.6, glass: undefined, reflect: 0.25, fresnel: 0.4 });
        return [p === 'near' ? panel : ghost(new Box([cx + 0.12, cy + 0.12, -0.3], [cx + 0.88, cy + 0.88, -0.22], { color: NEAR_COL, diffuse: 0.8, emit: [0.15, 0.07, 0] }))];
      },
    },
    fbridge: {
      ground: (p) => (p === 'far' ? 'floor' : 'pit'),
      tall: () => false,
      shapes: (cx, cy, p) => {
        const panel = new Box([cx + 0.02, cy + 0.02, -0.08], [cx + 0.98, cy + 0.98, 0], { ...glassOf(FAR_COL, 0.2), diffuse: 0.6, glass: undefined, reflect: 0.25, fresnel: 0.4 });
        return [p === 'far' ? panel : ghost(new Box([cx + 0.12, cy + 0.12, -0.3], [cx + 0.88, cy + 0.88, -0.22], { color: FAR_COL, diffuse: 0.8, emit: [0, 0.07, 0.15] }))];
      },
    },
    photon: item(
      (x, y) => [new Sphere([x, y, 0.3], 0.1, { color: rgb(255, 250, 200), diffuse: 0.3, emit: rgb(255, 230, 150), noShadow: true })],
      () => [[0.5, 0.58, 0.3, 6, rgb(255, 220, 120)]],
    ),
    bulb: item(
      (x, y) => [
        new Sphere([x, y, 0.4], 0.17, { ...MAT.glass, emit: rgb(90, 80, 40) }),
        new Sdf(
          [
            [x - 0.12, y - 0.12, 0.3],
            [x + 0.12, y + 0.12, 0.5],
          ],
          (px, py, pz) => sd.torus(px - x, py - y, pz - 0.4, 0.06, 0.012),
          [{ color: rgb(255, 230, 120), emit: rgb(255, 220, 100), noShadow: true }],
        ),
        new Cylinder(x, y, 0.08, 0.06, 0.25, { ...MAT.gold, color: rgb(200, 200, 190) }),
        new Cylinder(x, y, 0.05, 0, 0.07, MAT.matte(rgb(30, 30, 30))),
      ],
      () => [[0.5, 0.58, 0.4, 7, rgb(255, 230, 140)]],
    ),
    lensR: lens('R'),
    lensG: lens('G'),
    lensB: lens('B'),
    gateR: gate('R'),
    gateG: gate('G'),
    gateB: gate('B'),
    crowngate: {
      ground: () => 'floor',
      tall: () => true,
      shapes: (cx, cy) => {
        const x = cx + 0.5;
        const y = cy + F + (1 - F) / 2;
        return [
          cube(cx, cy, MAT.gold),
          hull(
            [
              [x, y + 0.34, 0.7],
              [x - 0.2, y + 0.34, 0.35],
              [x + 0.2, y + 0.34, 0.35],
              [x, y + 0.4, 0.45],
            ],
            { color: rgb(130, 60, 220), diffuse: 0.6, spec: 1, shine: 60, emit: rgb(40, 10, 80) },
          ),
        ];
      },
    },
    exit: item(
      (x, y) => [
        new Sdf(
          [
            [x - 0.45, y - 0.45, 0],
            [x + 0.45, y + 0.45, 0.12],
          ],
          (px, py, pz) => sd.torus(px - x, py - y, pz - 0.05, 0.37, 0.05),
          [MAT.chrome],
        ),
        new Cylinder(x, y, 0.33, -0.02, 0.01, { color: [1, 1, 1], emit: [1.4, 1.4, 1.5], noShadow: true }),
      ],
      () => [[0.5, 0.58, 0.05, 11, rgb(220, 240, 255)]],
    ),
    // a focus ring: the lens it holds glows the color of the plane it takes you to
    ring: {
      ground: () => 'floor',
      tall: () => false,
      shapes: (cx, cy, p) => {
        const [x, y] = mid(cx, cy);
        const to = p === 'near' ? FAR_COL : NEAR_COL;
        return [
          new Sdf(
            [
              [x - 0.45, y - 0.45, 0],
              [x + 0.45, y + 0.45, 0.14],
            ],
            (px, py, pz) => sd.torus(px - x, py - y, pz - 0.06, 0.36, 0.06),
            [MAT.chrome],
          ),
          new Cylinder(x, y, 0.31, -0.02, 0.03, { color: to, diffuse: 0.3, reflect: 0.35, emit: [to[0] * 0.6, to[1] * 0.6, to[2] * 0.6] }),
        ];
      },
      glows: (p) => [[0.5, 0.58, 0.04, 8, p === 'near' ? FAR_COL : NEAR_COL]],
    },
    orb: {
      ground: () => 'floor',
      tall: () => false,
      shapes: (cx, cy) => {
        const [x, y] = mid(cx, cy);
        return [new Sphere([x, y - 0.05, 0.5], 0.36, { ...MAT.chrome, diffuse: 0.15 }), new Cylinder(x, y - 0.05, 0.22, 0, 0.16, MAT.marble(rgb(230, 225, 235), rgb(120, 110, 140)))];
      },
    },
    egg: item((x, y) => [eggShape(x, y, 0.22), new Cylinder(x, y, 0.2, 0, 0.04, MAT.chrome)]),
  };
  return K;
}

export const KINDS = kinds();

/** A cell to render: its kind (and part of a multi-cell model), a variant, and its neighbors per plane. */
export interface CellKey {
  kind: string;
  part?: number;
  variant?: number;
  ctx: Record<Plane, Ctx>;
}

/** The slab under a floor cell: floor on top, cliffs below fading into the void. */
function slabMat(t: Theme): Material {
  const top = t.floor;
  return {
    ...top,
    color: (p, n) => {
      if (n[2] > 0.5 && p[2] > -0.01) return typeof top.color === 'function' ? top.color(p, n) : top.color;
      // bands of strata going down, fading into the void
      const fade = Math.exp(p[2] * 0.55);
      const band = 0.82 + 0.18 * Math.cos(p[2] * 18);
      const c = mix(t.abyss, t.cliff, fade);
      return [c[0] * band, c[1] * band, c[2] * band];
    },
  };
}

/** Builds the 3x3 scene around (0, 0) for this key in this plane. */
function sceneFor(key: CellKey, plane: Plane, t: Theme): Shape[] {
  const shapes: Shape[] = [];
  const kind = KINDS[key.kind];
  const ctx = key.ctx[plane];
  const slab = slabMat(t);
  const proxy: Material = { color: rgb(128, 128, 128) };
  // neighbors: slabs (pits leave holes) and cubes where they cast shadows
  const at = (dx: number, dy: number, isPit: boolean, isTall: boolean) => {
    if (!isPit) shapes.push(new Box([dx, dy, -3], [dx + 1, dy + 1, 0], slab));
    if (isTall) shapes.push(cube(dx, dy, proxy));
  };
  at(-1, 0, false, ctx.w);
  at(0, -1, ctx.nPit, ctx.n);
  at(-1, -1, false, ctx.nw);
  for (const [dx, dy] of [
    [1, -1],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ])
    at(dx, dy, false, false);
  if (kind.ground(plane) === 'floor') shapes.push(new Box([0, 0, -3], [1, 1, 0], slab));
  if (kind.shapes) {
    const span = kind.span ?? [1, 1];
    const part = key.part ?? 0;
    // multi-cell models are built from their top-left cell
    const ox = -(part % span[0]);
    const oy = -Math.floor(part / span[0]);
    shapes.push(...kind.shapes(ox, oy, plane, t, part));
  }
  return shapes;
}

/** Light from the west and a little north, high up: shadows fall east and a bit south. */
export const KEY_DIR: V = (() => {
  const v: V = [-0.62, -0.38, 1];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();

export function worldFor(shapes: Shape[], t: Theme, keyColor?: V): World {
  return {
    shapes,
    key: { dir: KEY_DIR, color: keyColor ?? t.key, soft: 0.07 },
    sky: mix(t.sky, [0, 0, 0], 0.35),
    ground: mix(t.ground, [0, 0, 0], 0.3),
    ao: { reach: 0.5, strength: 0.55 },
    env: t.env,
    backdrop: (d) => (d[2] < -0.5 ? t.abyss : t.env(d)),
    maxDepth: 3,
  };
}

/** Adds soft glows (light halos) to a 20x20 picture. */
export function addGlows(p: Picture, glows: [number, number, number, number, V][], scale = 20): void {
  for (const [gx, gy, gz, r, c] of glows) {
    const sx = gx * scale;
    const sy = (gy - OBLIQUE_K * gz) * scale;
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

/** One cell's block in one plane: 20x20 linear RGB. */
export function renderCell(key: CellKey, plane: Plane, themeId: ThemeId, seed = 1): Picture {
  const t = THEMES[themeId];
  const shapes = sceneFor(key, plane, t);
  const world = worldFor(shapes, t);
  const cam = oblique(0, 0, 20);
  const pic = render(world, cam, 20, 20, { spp: 6, edgeSpp: 25, seed });
  if (shapes.some((s) => s.ghost)) {
    const g = render(world, cam, 20, 20, { spp: 6, edgeSpp: 16, seed: seed + 9, ghost: true });
    // out of focus: soft, lighter and only half there
    const soft = blur(g, 1.3);
    for (let i = 0; i < soft.rgb.length; i++) soft.rgb[i] = soft.rgb[i] * 0.8 + 0.12;
    over(pic, soft, 0.55);
  }
  const kind = KINDS[key.kind];
  if (kind.glows) addGlows(pic, kind.glows(plane, key.part ?? 0));
  return pic;
}
