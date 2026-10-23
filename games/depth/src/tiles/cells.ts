// What each kind of map cell is in 3D, in each focus plane, and how its 20x20 block is
// rendered: the cell and its neighbors are built as a little scene (so shadows fall across
// block edges and pits show their inner walls), seen through the game's oblique camera and
// cropped to the cell. Whatever is out of focus in a plane is traced on a layer of its own,
// blurred and laid over the floor at half strength: sharp means solid, a blur means it isn't there.
import { blur, oblique, over, render, type Picture, OBLIQUE_K } from '../render/image';
import { MAT } from '../render/look';
import { Box, Cylinder, Sdf, Sphere, hull, mix, rgb, sd, type Material, type Shape, type V, type World } from '../render/tracer';
import { THEMES, type Theme, type ThemeId } from './themes';
import { teapotModel } from '../models/cast';
import { citicar } from '../models/citicar';

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

/** A glass walkway: pale, tinted, ruled with a grid, its edges lit. */
const walkway = (c: V): Material => ({
  color: (p) => {
    const u = p[0] - Math.floor(p[0]);
    const v = p[1] - Math.floor(p[1]);
    const e = Math.min(u, v, 1 - u, 1 - v);
    if (e < 0.08) return mix(c, [1, 1, 1], 0.75);
    const grid = Math.abs(u - 0.5) < 0.02 || Math.abs(v - 0.5) < 0.02;
    return grid ? mix(c, [1, 1, 1], 0.5) : mix(c, [0.1, 0.1, 0.15], 0.45);
  },
  diffuse: 0.75,
  reflect: 0.3,
  fresnel: 0.4,
  spec: 1.3,
  shine: 110,
  emit: [c[0] * 0.08, c[1] * 0.08, c[2] * 0.08],
});

const amber: Material = { color: NEAR_COL, diffuse: 0.85, spec: 1.0, shine: 70, fresnel: 0.3, emit: [0.12, 0.05, 0] };
const cyan: Material = { color: FAR_COL, diffuse: 0.75, spec: 1.2, shine: 90, fresnel: 0.35, emit: [0, 0.05, 0.1] };

/** The felt egg (the Prism Egg): glossy black felt, a vanishing checkerboard in silver stitch
 * round its bottom, a faceted violet cube on its front and a rainbow of floss across it. */
export function eggShape(x: number, y: number, z: number, s = 1): Shape {
  const hh = 0.22 * s;
  const felt: Material = {
    color: (p) => {
      const lz = (p[2] - z) / hh; // -1 bottom .. 1 top
      const fx = (p[0] - x) / (0.16 * s);
      const front = p[1] > y;
      // the rainbow of floss, a slanted band
      const band = lz - 0.5 + fx * 0.25;
      if (Math.abs(band) < 0.07) {
        const hue = (fx + 1) / 2;
        const k = Math.max(0, Math.min(5, Math.floor(hue * 6)));
        return [rgb(240, 60, 60), rgb(250, 160, 40), rgb(250, 230, 60), rgb(70, 210, 90), rgb(60, 140, 250), rgb(150, 80, 230)][k];
      }
      // the violet cube, three shades so it reads as solid
      if (front && Math.abs(fx) < 0.42 && lz > -0.25 && lz < 0.32) {
        if (lz > 0.12 - Math.abs(fx) * 0.25) return rgb(176, 140, 245);
        return fx < 0 ? rgb(122, 79, 208) : rgb(78, 44, 150);
      }
      // a checkerboard floor in silver chain stitch, vanishing round the bottom
      if (lz < -0.35) {
        const a = Math.atan2(p[1] - y, p[0] - x) * 4;
        const v = Math.log(1.05 + lz) * 6;
        const line = Math.abs(a - Math.round(a)) < 0.09 || Math.abs(v - Math.round(v)) < 0.12;
        if (line) return rgb(205, 210, 230);
      }
      return rgb(22, 18, 32);
    },
    diffuse: 1,
    spec: 0.5,
    shine: 25,
  };
  const a = 0.17 * s;
  return new Sdf(
    [
      [x - a, y - a, z - hh - 0.02 * s],
      [x + a, y + a, z + hh + 0.02 * s],
    ],
    (px, py, pz) => {
      const lz = (pz - z) / s;
      const k = 1 - lz * 0.9; // narrower at the top: an egg
      return sd.ellipsoid((px - x) / k, (py - y) / k, pz - z, 0.15 * s, 0.15 * s, 0.22 * s) * Math.min(1, k);
    },
    [felt],
  );
}

/** A slope: floor tilted downhill toward (dx, dy), with chevrons pointing the way it pulls. */
function slope(dx: number, dy: number): Kind {
  return {
    ground: () => 'floor',
    tall: () => false,
    shapes: (cx, cy) => {
      const out: Shape[] = [];
      const [x, y] = [cx + 0.5, cy + 0.5];
      const mat: Material = { color: rgb(255, 230, 120), diffuse: 0.7, spec: 0.8, shine: 40, emit: rgb(60, 45, 10) };
      for (const k of [-0.22, 0.12]) {
        const ax = x + dx * k;
        const ay = y + dy * k;
        const px = -dy;
        const py = dx;
        const tip: V = [ax + dx * 0.16, ay + dy * 0.16, 0];
        const l: V = [ax + px * 0.24, ay + py * 0.24, 0];
        const r: V = [ax - px * 0.24, ay - py * 0.24, 0];
        const li: V = [l[0] + dx * 0.1, l[1] + dy * 0.1, 0];
        const ri: V = [r[0] + dx * 0.1, r[1] + dy * 0.1, 0];
        const tipi: V = [tip[0] + dx * 0.1, tip[1] + dy * 0.1, 0];
        for (const [a, b, c, d] of [
          [l, tip, tipi, li],
          [r, tip, tipi, ri],
        ] as V[][])
          out.push(hull([a, b, c, d, ...[a, b, c, d].map((v) => [v[0], v[1], 0.035] as V)], mat));
      }
      return out;
    },
  };
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
      cube(
        cx,
        cy,
        {
          color: mix(LENS_COL[c], [1, 1, 1], 0.15),
          diffuse: 0.55,
          reflect: 0.2,
          fresnel: 0.45,
          spec: 1.3,
          shine: 110,
          emit: [LENS_COL[c][0] * 0.3, LENS_COL[c][1] * 0.3, LENS_COL[c][2] * 0.3],
        },
        { round: 0.03, inset: 0.04 },
      ),
      ...frame(cx, cy),
    ],
  });
  const frame = (cx: number, cy: number): Shape[] => {
    const f = F;
    const out: Shape[] = [];
    for (const x of [cx + 0.03, cx + 0.97]) out.push(new Cylinder(x, cy + 0.99, 0.035, 0, H, MAT.chrome));
    // chrome rails along the top's front and back edges
    out.push(new Box([cx, cy + 0.96, H - 0.05], [cx + 1, cy + 1, H], MAT.chrome));
    out.push(new Box([cx, cy + f, H - 0.05], [cx + 1, cy + f + 0.04, H], MAT.chrome));
    return out;
  };
  const panel = (c: V, emit: V): Kind => ({
    ground: () => 'floor',
    tall: () => false,
    shapes: (cx, cy) => [
      new Box([cx + 0.02, cy + 0.02, -0.08], [cx + 0.98, cy + 0.98, 0], { color: c, diffuse: 0.6, reflect: 0.3, fresnel: 0.4, spec: 1.2, shine: 90, emit }),
    ],
  });
  const K: Record<string, Kind> = {
    floor: floor(),
    pit: pit(),
    void: pit(),
    wall: { ground: () => 'floor', tall: () => true, shapes: (cx, cy, _p, t) => [cube(cx, cy, t.wall, { round: t.wallRound })] },
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
        const panel = new Box([cx + 0.04, cy + 0.04, -0.12], [cx + 0.96, cy + 0.96, 0], walkway(NEAR_COL));
        return [
          p === 'near'
            ? panel
            : ghost(new Box([cx + 0.12, cy + 0.12, -0.3], [cx + 0.88, cy + 0.88, -0.22], { color: NEAR_COL, diffuse: 0.8, emit: [0.15, 0.07, 0] })),
        ];
      },
    },
    fbridge: {
      ground: (p) => (p === 'far' ? 'floor' : 'pit'),
      tall: () => false,
      shapes: (cx, cy, p) => {
        const panel = new Box([cx + 0.04, cy + 0.04, -0.12], [cx + 0.96, cy + 0.96, 0], walkway(FAR_COL));
        return [
          p === 'far'
            ? panel
            : ghost(new Box([cx + 0.12, cy + 0.12, -0.3], [cx + 0.88, cy + 0.88, -0.22], { color: FAR_COL, diffuse: 0.8, emit: [0, 0.07, 0.15] })),
        ];
      },
    },
    // a photon: a gold spark in a wide halo, so it never reads as a pale floor square
    photon: item(
      (x, y) => [new Sphere([x, y, 0.3], 0.13, { color: rgb(255, 214, 70), diffuse: 0.3, emit: rgb(255, 190, 40), noShadow: true })],
      () => [[0.5, 0.58, 0.3, 10, rgb(255, 200, 60)]],
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
        return [
          new Sphere([x, y - 0.05, 0.5], 0.36, { ...MAT.chrome, diffuse: 0.15 }),
          new Cylinder(x, y - 0.05, 0.22, 0, 0.16, MAT.marble(rgb(230, 225, 235), rgb(120, 110, 140))),
        ];
      },
    },
    // auto-focus panels: the focus drifts on its own, so these come and go together; they
    // flicker hot pink twice just before they blur out
    pulseA: panel(rgb(220, 200, 255), rgb(50, 30, 80)),
    pulseA2: panel(rgb(220, 200, 255), rgb(50, 30, 80)),
    pulseW: panel(rgb(255, 120, 170), rgb(150, 30, 70)),
    pulseW2: panel(rgb(255, 120, 170), rgb(150, 30, 70)),
    pulseB: {
      ground: () => 'pit',
      tall: () => false,
      shapes: (cx, cy) => [
        ghost(new Box([cx + 0.12, cy + 0.12, -0.3], [cx + 0.88, cy + 0.88, -0.22], { color: rgb(200, 170, 255), diffuse: 0.8, emit: rgb(60, 30, 90) })),
      ],
    },
    slopeN: slope(0, -1),
    slopeE: slope(1, 0),
    slopeS: slope(0, 1),
    slopeW: slope(-1, 0),
    crystal: {
      ground: () => 'floor',
      tall: () => false,
      shapes: (cx, cy) => {
        const [x, y] = mid(cx, cy);
        const prism = (dx: number, dy: number, h: number, r: number, c: V) =>
          hull(
            [
              ...[0, 1, 2, 3, 4, 5].map((k) => [x + dx + Math.cos(k * 1.047) * r, y + dy + Math.sin(k * 1.047) * r, 0] as V),
              ...[0, 1, 2, 3, 4, 5].map((k) => [x + dx + Math.cos(k * 1.047) * r * 0.9, y + dy + Math.sin(k * 1.047) * r * 0.9, h] as V),
              [x + dx, y + dy, h + r * 1.3],
            ],
            { color: c, diffuse: 0.45, spec: 1.5, shine: 120, reflect: 0.2, fresnel: 0.4, emit: [c[0] * 0.2, c[1] * 0.2, c[2] * 0.2] },
          );
        return [
          prism(0, -0.02, 0.55, 0.11, rgb(140, 240, 220)),
          prism(-0.2, 0.08, 0.32, 0.08, rgb(170, 140, 255)),
          prism(0.19, 0.1, 0.38, 0.08, rgb(120, 220, 255)),
        ];
      },
    },
    teapot: {
      ground: () => 'floor',
      tall: () => false,
      shapes: (cx, cy) => {
        const [x, y] = mid(cx, cy);
        return [teapotModel([x - 0.04, y - 0.04, 0], 0.62), new Cylinder(x, y - 0.04, 0.4, 0, 0.02, MAT.marble(rgb(240, 236, 228), rgb(160, 120, 110)))];
      },
    },
    nest: {
      ground: () => 'floor',
      tall: () => false,
      shapes: (cx, cy) => {
        const [x, y] = mid(cx, cy);
        return [
          hull(
            [
              [x - 0.36, y - 0.3, 0],
              [x + 0.36, y - 0.3, 0],
              [x, y + 0.36, 0],
              [x, y - 0.05, 0.6],
            ],
            // lit violet faces (the Vanishing Point's floor is near black)
            (f) => ({ color: f % 2 ? rgb(190, 120, 255) : rgb(130, 80, 200), diffuse: 0.8, spec: 1, shine: 60, emit: rgb(45, 20, 75) }),
          ),
          new Sphere([x, y + 0.06, 0.24], 0.06, { color: rgb(255, 60, 60), emit: rgb(255, 40, 40), noShadow: true }),
        ];
      },
      glows: () => [[0.5, 0.64, 0.24, 6, rgb(255, 60, 60)]],
    },
    pillar: {
      ground: () => 'floor',
      tall: () => true,
      shapes: (cx, cy, _p, t) => {
        const x = cx + 0.5;
        const y = cy + 0.62;
        return [new Cylinder(x, y, 0.3, 0, H, t.wall), new Cylinder(x, y, 0.38, H - 0.08, H, MAT.gold), new Cylinder(x, y, 0.38, 0, 0.08, MAT.gold)];
      },
    },
    // the two-way mirror in the Hall of Mirrors: a wall to look at, with something faint inside
    mirrordoor: {
      ground: () => 'floor',
      tall: () => true,
      shapes: (cx, cy, _p, t) => [cube(cx, cy, { ...t.wall, reflect: 0.62, color: rgb(200, 205, 230) }), eggShape(cx + 0.5, cy + 0.72, 0.36, 0.7)],
    },
    chez: {
      ground: () => 'floor',
      tall: () => false,
      span: [2, 2],
      shapes: (cx, cy) => citicar(cx, cy),
    },
    egg: item((x, y) => [eggShape(x, y, 0.22), new Cylinder(x, y, 0.2, 0, 0.04, MAT.chrome)]),
    // bare floor here: levels/hidden.ts draws the tin heart, the Easter egg and Watt over it
    tinHeart: floor(),
    tinHeart2: floor(),
    easterEgg: floor(),
    watt: floor(),
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
