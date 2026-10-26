// The Sandbox Software logo sting that opens every Sandbox game, pre-rendered the 1995
// way: a wooden sandbox on a checkered lawn under a cloudy blue sky, with a sand castle
// (towers, battlements and a yellow pennant), a red pail of sand and a blue toy shovel
// that pats a mound of sand twice, kicking up grains. Then "-= S A N D B O X =-" drops in
// a letter at a time, spinning, in chunky beveled plastic in the colors of THE SANDBOX
// BBS (retro/bbs/bbsName.ts: red, yellow, green, cyan, blue, magenta, brown, the ends
// yellow), casting hard shadows on the sand. A bold yellow "SOFTWARE", outlined in black,
// zooms in under it, a highlight sweeps across, star glints sparkle, and
// it fades to black.
//
// It is ray traced here in software (raytrace.ts; the letters are sdftext.ts), quantized
// to one 256-color palette (quantize.ts) and written as an Autodesk Animator FLI, which
// carries its own palette, so any game can put it first in its title slide show:
// `sandlogo.fli 0` before the game's own intro. The camera holds still and only what moves
// is traced again each frame, so still areas stay byte-identical and the FLI stores just
// the changes.
import { encodeFli } from '../../web/src/formats/fli';
import { DistanceGrid, ExtrudedText, Seg, textStrokes } from './sdftext';
import { medianCutPalette, Quantizer } from './quantize';
import {
  add,
  apply,
  blocked,
  Box,
  Camera,
  Capsule,
  clamp01,
  Cone,
  cross,
  dot,
  fbm,
  fromAxes,
  grain,
  Group,
  Hit,
  Lettering,
  Material,
  mix,
  mulM,
  nearest,
  noise,
  norm,
  placed,
  Ring,
  rotX,
  rotY,
  scale,
  Shape,
  Sphere,
  sub,
  Surface,
  Tri,
  V,
} from './raytrace';

/** The logo's file name on every disk. */
export const SANDLOGO = 'sandlogo.fli';

const W = 320;
const H = 200;
/** FLI speed: 1/70 s ticks per frame (6 = about 12 frames a second). */
const SPEED = 6;
const FADE_IN = 5;
/** The shovel's two pats: each starts here and lasts PAT frames, hitting the sand halfway. */
const PATS = [2, 9];
const PAT = 8;
/** The nine pieces of -= S A N D B O X =- drop in one after another. */
const DROP_START = 13;
const DROP_STAGGER = 2;
const DROP = 8;
/** SOFTWARE zooms in, flat on top of the render, these scales a frame, then holds. */
const SOFT_START = 30;
const SOFT_ZOOM = [0.35, 0.7, 1.1, 1];
const SWEEP_START = 37; // the highlight crosses the letters
const SWEEP = 8;
const SPARKLES: [number, number][] = [
  // frame, piece (S A N D B O X are 1..7)
  [38, 1],
  [41, 4],
  [44, 7],
];
const HOLD_END = 47;
const FADE = 7;
/** 54 frames, as long as the sting always was, so the walkthroughs' timelines stay put. */
const FRAMES = HOLD_END + FADE;

// ---- light, sky and lawn --------------------------------------------------------------

const cam = new Camera([0.35, 2.3, -6.2], [0.1, 1.3, 0.25], 305);
const SUN = norm([-0.5, 0.85, -0.42]);
const SUN_COLOR: V = [1.05, 1.0, 0.9];
const AMBIENT: V = [0.36, 0.4, 0.5];
const WHITE: V = [1, 1, 1];

/** The 1995 sky: deep blue overhead to pale at the horizon, with puffy fractal clouds. */
function sky(d: V): V {
  const y = Math.max(d[1], 0);
  const base = mix([0.68, 0.84, 1.0], [0.12, 0.32, 0.86], clamp01(Math.pow(y, 0.6) * 1.6));
  if (y < 0.01) return base;
  const u = d[0] / (y + 0.08);
  const v = d[2] / (y + 0.08);
  const c = clamp01((fbm(u * 0.9, v * 0.9, 0.3, 5) + 0.05) * 2.6);
  const shade = clamp01(0.75 + fbm(u * 0.9 + 0.4, v * 0.9 + 0.4, 0.3, 3) * 0.8);
  return mix(base, scale([1, 1, 1], shade), c * clamp01(y * 6));
}

/** What chrome and plastic mirror: the sky above, a dark lawn and a bright horizon line. */
function env(r: V): V {
  if (r[1] >= 0) return add(sky(r), scale(WHITE, Math.exp(-((r[1] / 0.04) ** 2)) * 0.5));
  return mix([0.35, 0.45, 0.25], [0.08, 0.14, 0.06], clamp01(-r[1] * 3));
}

/** The lawn: two greens in a POV-Ray checkerboard, hazy toward the horizon. */
function lawn(x: number, z: number): V {
  const c: V = (Math.floor(x * 0.9) + Math.floor(z * 0.9)) & 1 ? [0.22, 0.56, 0.16] : [0.36, 0.74, 0.24];
  return scale(c, 0.94 + grain(x, 0, z, 9) * 0.12);
}

// ---- materials ------------------------------------------------------------------------

const surface = (color: V, o: Partial<Surface> = {}): Surface => ({ color, kd: 0.9, ks: 0, shine: 10, mirror: 0, ...o });
const plain =
  (color: V, o: Partial<Surface> = {}): Material =>
  () =>
    surface(color, o);

/** Dry sand, grainy, with soft ripples. */
const sand: Material = (h) => {
  const [x, y, z] = h.p;
  const g = grain(x, y, z, 70) * 0.14 + grain(x, y, z, 23) * 0.08;
  const ripple = noise(x * 3.1, z * 3.1, 1.7) * 0.06;
  return surface(scale([0.96, 0.8, 0.52], 0.86 + g + ripple));
};

/** Damp, packed castle sand, banded where the pail molded it, with a dark doorway. */
const castleSand: Material = (h) => {
  const [x, y, z] = h.p;
  const g = grain(x, y, z, 60) * 0.12;
  const band = 0.04 * Math.sin(y * 70);
  let c = scale([0.86, 0.66, 0.4], 0.88 + g + band);
  // the doorway and two windows on the keep's front
  const lx = x - CASTLE[0];
  const ly = y - CASTLE[1];
  if (h.n[2] < -0.9 && h.shape === keep) {
    const arch = Math.abs(lx) < 0.11 && (ly < 0.2 || Math.hypot(lx, ly - 0.2) < 0.11);
    const window = Math.abs(Math.abs(lx) - 0.3) < 0.04 && Math.abs(ly - 0.34) < 0.06;
    if (arch || window) c = [0.16, 0.1, 0.06];
  }
  return surface(c);
};

/** Pine boards, the grain running along each board. */
const wood =
  (along: 0 | 2): Material =>
  (h) => {
    const p = h.p;
    const a = p[along];
    const across = along === 0 ? p[2] : p[0];
    const ring = Math.sin((across * 40 + p[1] * 25 + noise(a * 1.5, across * 6, p[1] * 6) * 3) * 1.2) * 0.5 + 0.5;
    const c = mix([0.78, 0.52, 0.27], [0.55, 0.32, 0.15], ring * 0.55 + grain(a, p[1], across, 30) * 0.15);
    return surface(c, { ks: 0.12, shine: 14 });
  };

/** Shiny toy plastic. */
const plastic = (color: V): Material => plain(color, { kd: 0.85, ks: 0.75, shine: 36, mirror: 0.1 });

const RED: V = [0.92, 0.08, 0.06];
const BLUE: V = [0.1, 0.26, 0.95];
const YELLOW: V = [1.0, 0.82, 0.05];

// ---- the sandbox ----------------------------------------------------------------------

const SAND_Y = 0.3;
const boards: Shape[] = [];
const ground: Shape[] = [];
const castle: Shape[] = [];
const pail: Shape[] = [];
// the frame: four boards, their ends overlapping at the corners, and corner seats
boards.push(new Box([-2.24, 0, -1.84], [2.24, 0.44, -1.6], placed(), wood(0)));
boards.push(new Box([-2.24, 0, 1.6], [2.24, 0.44, 1.84], placed(), wood(0)));
boards.push(new Box([-2.24, 0, -1.6], [-2.0, 0.44, 1.6], placed(), wood(2)));
boards.push(new Box([2.0, 0, -1.6], [2.24, 0.44, 1.6], placed(), wood(2)));
for (const [x, z] of [
  [-2.24, -1.84],
  [2.24, -1.84],
  [-2.24, 1.84],
  [2.24, 1.84],
] as [number, number][]) {
  const sx = Math.sign(x);
  const sz = Math.sign(z);
  const xs = [x, x - sx * 0.5].sort((a, b) => a - b);
  const zs = [z, z - sz * 0.5].sort((a, b) => a - b);
  boards.push(new Box([xs[0], 0.44, zs[0]], [xs[1], 0.5, zs[1]], placed(), wood(0)));
}
ground.push(new Box([-2.0, 0, -1.6], [2.0, SAND_Y, 1.6], placed(), sand));
// the mound the shovel pats
const MOUND: V = [-0.75, SAND_Y - 0.3, -0.75];
ground.push(new Sphere(0.42, placed(MOUND), sand));

// the sand castle: a keep, four pail-molded corner towers, a tall middle tower, battlements
const CASTLE: V = [0.55, SAND_Y, 0.45];
const at = (x: number, y: number, z: number): V => [CASTLE[0] + x, CASTLE[1] + y, CASTLE[2] + z];
const keep = new Box([-0.5, 0, -0.38], [0.5, 0.52, 0.38], placed(CASTLE), castleSand);
castle.push(keep);
const merlons = (cx: number, cy: number, cz: number, r: number, n: number, rot0: number) => {
  const ring: Shape[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot0 + (i * Math.PI * 2) / n;
    ring.push(new Box([-0.05, 0, -0.05], [0.05, 0.1, 0.05], placed(at(cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r), rotY(-a)), castleSand));
  }
  castle.push(new Group(ring));
};
for (const [x, z] of [
  [-0.5, -0.38],
  [0.5, -0.38],
  [-0.5, 0.38],
  [0.5, 0.38],
] as [number, number][]) {
  castle.push(new Cone(0.23, 0.19, 0, 0.82, placed(at(x, 0, z)), castleSand));
  merlons(x, 0.82, z, 0.14, 4, Math.PI / 4);
}
for (const x of [-0.2, 0.2]) {
  castle.push(new Box([-0.05, 0, -0.05], [0.05, 0.1, 0.05], placed(at(x, 0.52, -0.33)), castleSand));
  castle.push(new Box([-0.05, 0, -0.05], [0.05, 0.1, 0.05], placed(at(x, 0.52, 0.33)), castleSand));
}
castle.push(new Cone(0.27, 0.23, 0.52, 1.22, placed(at(0, 0, 0)), castleSand));
merlons(0, 1.22, 0, 0.16, 6, 0);
const POLE_TOP = at(0, 1.72, 0);
castle.push(new Cone(0.016, 0.016, 1.22, 1.74, placed(at(0, 0, 0)), plain([0.95, 0.95, 0.92], { ks: 0.4, shine: 30 })));
castle.push(new Sphere(0.03, placed(add(POLE_TOP, [0, 0.03, 0])), plastic(YELLOW)));

// the red pail, full of sand, its yellow handle flopped toward us
const PAIL: V = [-1.2, SAND_Y, 0.35];
const pailAt = (x: number, y: number, z: number): V => [PAIL[0] + x, PAIL[1] + y, PAIL[2] + z];
const pailRed: Material = (h) => {
  const y = h.p[1] - PAIL[1];
  // a yellow star decal on the front
  const lx = h.p[0] - PAIL[0];
  const a = Math.atan2(lx, -(h.p[2] - PAIL[2]));
  const sy = y - 0.33;
  const sa = Math.atan2(sy, a * 0.36);
  const sr = Math.hypot(a * 0.36, sy);
  const star = 0.09 * (0.55 + 0.45 * Math.cos(5 * (sa - Math.PI / 2)));
  const color = h.n[1] < 0.5 && Math.abs(a) < 1.2 && sr < star ? YELLOW : RED;
  return surface(color, { kd: 0.85, ks: 0.75, shine: 36, mirror: 0.1 });
};
pail.push(new Cone(0.3, 0.4, 0, 0.7, placed(PAIL), pailRed, { bottom: false, top: false }));
pail.push(new Cone(0.425, 0.425, 0.62, 0.72, placed(PAIL), plastic(RED), { bottom: false, top: false }));
pail.push(new Ring(0.39, 0.425, placed(pailAt(0, 0.72, 0)), plastic(RED)));
pail.push(new Ring(0, 0.392, placed(pailAt(0, 0.64, 0)), sand));
pail.push(new Sphere(0.27, placed(pailAt(0, 0.48, 0)), sand)); // heaped a little
{
  const tilt = 1.15; // toward the camera
  const pts: V[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = (Math.PI * i) / 10;
    const rise = Math.sin(a) * 0.43;
    pts.push(pailAt(Math.cos(a) * 0.435, 0.6 + rise * Math.cos(tilt), -rise * Math.sin(tilt)));
  }
  const handle: Shape[] = [];
  for (let i = 1; i < pts.length; i++) handle.push(new Capsule(pts[i - 1], pts[i], 0.02, placed(), plastic(YELLOW)));
  for (const s of [-1, 1]) handle.push(new Sphere(0.04, placed(pailAt(s * 0.43, 0.6, 0)), plastic(YELLOW)));
  pail.push(new Group(handle));
}
const statics: Shape[] = [new Group(boards), ...ground, new Group(castle), new Group(pail)];

// ---- what moves ---------------------------------------------------------------------

/** The blue shovel, gripped at its handle's top; `lift` (radians) raises the blade off the mound. */
const ROLL = -0.55;
function shovel(lift: number): Shape[] {
  const toGrip = norm([-0.82, 0, -0.55]);
  // contact pose: the blade lies on the mound, the handle rising 14 degrees to the grip
  const phi = 0.24 - lift;
  const Y = norm(add(scale(toGrip, Math.cos(phi)), [0, Math.sin(phi), 0]));
  const X = norm(cross(Y, [0, 1, 0]));
  const Z = cross(X, Y);
  // the blade turned about the handle to face us a little
  const rot = mulM(fromAxes(X, Y, Z), rotY(ROLL));
  // the grip stays put; the blade's middle (0.2 up the shovel) touches the mound top
  const contactY = norm(add(scale(toGrip, Math.cos(0.24)), [0, Math.sin(0.24), 0]));
  const top: V = add(MOUND, [0, 0.42 + 0.035, 0]);
  const grip = add(top, scale(contactY, 1.26));
  const pos = sub(grip, apply(rot, [0, 1.52, 0]));
  const pl = placed(pos, rot);
  const blue = plastic(BLUE);
  return [
    new Box([-0.23, 0, -0.02], [0.23, 0.56, 0.02], pl, blue),
    // the scoop's turned-up sides
    new Box([-0.23, 0, -0.02], [-0.19, 0.5, 0.09], pl, blue),
    new Box([0.19, 0, -0.02], [0.23, 0.5, 0.09], pl, blue),
    new Cone(0.07, 0.045, 0.54, 0.68, pl, blue),
    new Cone(0.044, 0.044, 0.68, 1.48, pl, blue),
    new Capsule([-0.15, 1.53, 0], [0.15, 1.53, 0], 0.055, pl, blue),
    new Capsule([0, 1.46, 0], [0, 1.53, 0], 0.05, pl, blue),
  ];
}

/** The shovel's lift at frame f: up at first, down to the sand for each pat, resting after the last. */
function shovelLift(f: number): number {
  const UP = 0.75;
  for (let i = 0; i < PATS.length; i++) {
    const p = (f - PATS[i]) / PAT;
    if (p < 0) return UP;
    if (p < 0.5) return UP * Math.cos(Math.PI * p) ** 2;
    if (i === PATS.length - 1) return 0;
    if (p < 1) return UP * Math.sin(Math.PI * (p - 0.5)) ** 2;
  }
  return 0;
}

/** Grains of sand kicked up by each pat. */
function puffs(f: number): Shape[] {
  const out: Shape[] = [];
  const top: V = add(MOUND, [0, 0.42, 0]);
  for (const start of PATS) {
    const t = f - (start + PAT / 2);
    if (t <= 0 || t > 5) continue;
    let seed = start * 7919 + 13;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 8) / 16777216;
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2;
      const sp = 0.07 + rnd() * 0.06;
      const up = 0.16 + rnd() * 0.1;
      const p: V = [top[0] + Math.cos(a) * (0.12 + sp * t), top[1] + up * t - 0.035 * t * t, top[2] + Math.sin(a) * (0.12 + sp * t)];
      if (p[1] < SAND_Y + 0.02) continue;
      out.push(new Sphere(0.022 + rnd() * 0.012, placed(p), sand));
    }
  }
  return out;
}

/** The pennant on the middle tower, rippling. */
function flag(f: number): Shape[] {
  const ph = f * 0.95;
  const along = norm([1, 0, 0.35]);
  const pt = (u: number, v: number): V => {
    const wave = Math.sin(ph - u * 7) * 0.05 * u;
    return [POLE_TOP[0] + along[0] * u * 0.4 + 0.012, POLE_TOP[1] - v - u * 0.03, POLE_TOP[2] + along[2] * u * 0.4 + wave];
  };
  const m = plain(YELLOW, { kd: 0.95, ks: 0.15, shine: 8 });
  const red = plain(RED, { kd: 0.95, ks: 0.15, shine: 8 });
  // two strips: yellow above, red below, each in two triangles that bend in the wind
  return [
    new Tri(pt(0, 0), pt(0, 0.09), pt(0.5, 0.06), placed(), m),
    new Tri(pt(0, 0), pt(0.5, 0.06), pt(1, 0.09), placed(), m),
    new Tri(pt(0, 0.09), pt(0, 0.18), pt(0.5, 0.12), placed(), red),
    new Tri(pt(0, 0.09), pt(0.5, 0.12), pt(0.5, 0.06), placed(), red),
    new Tri(pt(0.5, 0.06), pt(0.5, 0.12), pt(1, 0.09), placed(), red),
  ];
}

// ---- the logo -----------------------------------------------------------------------

/** The colors of S A N D B O X as THE SANDBOX BBS shows them (bbsName.ts), made solid. */
const PIECE_COLORS: V[] = [
  [1.0, 0.85, 0.12], // -=  yellow
  [1.0, 0.2, 0.18], // S  light red
  [1.0, 0.88, 0.15], // A  yellow
  [0.22, 0.95, 0.22], // N  light green
  [0.15, 0.88, 0.95], // D  light cyan
  [0.28, 0.32, 1.0], // B  light blue
  [1.0, 0.28, 0.95], // O  light magenta
  [0.78, 0.42, 0.08], // X  brown
  [1.0, 0.85, 0.12], // =-  yellow
];
const PIECES = ['-=', 'S', 'A', 'N', 'D', 'B', 'O', 'X', '=-'];

/** The logo's frame: in front of the camera, leaning back a little. */
const LOGO_C: V = add(add(cam.eye, scale(cam.fw, 4.3)), scale(cam.up, 1.02));
const LOGO_ROT = mulM(fromAxes(cam.right, cam.up, cam.fw), rotX(-0.22));
const LOGO_SIZE = 0.43; // world height of a capital

const fatter = (segs: Seg[], k: number): Seg[] => segs.map(([a, b, c, d, r]) => [a, b, c, d, r * k]);

interface Piece {
  text: ExtrudedText;
  /** Where its middle sits along the logo, in cap heights. */
  x: number;
}

let pieces: Piece[] | undefined;
function logo(): { pieces: Piece[] } {
  if (!pieces) {
    const widths: number[] = [];
    const glyphs = PIECES.map((s) => {
      const segs = fatter(textStrokes(s, 1, -0.5, 0.06), 1.3);
      const xs = segs.flatMap(([x0, , x1, , r]) => [x0 - r, x1 + r]);
      widths.push(Math.max(...xs) - Math.min(...xs));
      return segs;
    });
    const gap = 0.24;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    let pen = -total / 2;
    pieces = glyphs.map((segs, i) => {
      const x = pen + widths[i] / 2;
      pen += widths[i] + gap;
      return { text: new ExtrudedText(new DistanceGrid(segs, 0.01, 0.2), 0.42, 0.07), x };
    });
  }
  return { pieces };
}

/** How far across the logo (world units from its middle) a point is. */
const acrossLogo = (p: V) => dot(sub(p, LOGO_C), cam.right);

function bandGlow(p: V, band: number | undefined): number {
  if (band === undefined) return 0;
  const k = acrossLogo(p) + 0.6 * dot(sub(p, LOGO_C), cam.up);
  return Math.exp(-(((k - band) / 0.35) ** 2)) * 0.9;
}

/** Glossy candy plastic for a piece: lighter toward the top, a sweep of light when it passes. */
function pieceMaterial(color: V, band: number | undefined): Material {
  return (h: Hit) => {
    const t = clamp01(h.local[1] + 0.5);
    const c = mix(scale(color, 0.85), mix(color, WHITE, 0.3), t);
    const g = bandGlow(h.p, band);
    return surface(c, { kd: 0.95, ks: 0.9, shine: 40, mirror: 0.16, glow: scale(mix(color, WHITE, 0.6), g) });
  };
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The pieces in the air or landed at frame f (none before they start falling). */
function logoShapes(f: number, glow = true): { key: string; shape: Shape }[] {
  const { pieces: ps } = logo();
  const band = glow && f >= SWEEP_START && f < SWEEP_START + SWEEP ? -3.4 + (6.8 * (f - SWEEP_START)) / (SWEEP - 1) : undefined;
  const out: { key: string; shape: Shape }[] = [];
  ps.forEach((p, i) => {
    const t = (f - (DROP_START + i * DROP_STAGGER)) / DROP;
    if (t <= 0) return;
    const k = Math.min(1, t);
    const e = easeOut(k);
    // falls from above with a little bounce, spinning about its upright
    const bounce = k < 1 ? Math.sin(Math.PI * Math.min(1, k * 1.25)) * (1 - k) * 0.6 : 0;
    const drop = (1 - e) * 5.5 + bounce;
    const spin = (1 - e) * Math.PI * 2;
    const rot = mulM(LOGO_ROT, rotY(spin));
    const pos = add(LOGO_C, apply(LOGO_ROT, [p.x * LOGO_SIZE, drop * LOGO_SIZE, 0]));
    out.push({ key: `piece${i}`, shape: new Lettering(p.text, placed(pos, rot, LOGO_SIZE), pieceMaterial(PIECE_COLORS[i], band)) });
  });
  return out;
}

// ---- tracing ----------------------------------------------------------------------------

function trace(shapes: Shape[], d: V): V {
  const o = cam.eye;
  const h = nearest(shapes, o, d);
  if (!h) {
    if (d[1] >= 0) return sky(d);
    const t = -o[1] / d[1];
    const p = add(o, scale(d, t));
    const lit = blocked(shapes, add(p, [0, 1e-3, 0]), SUN) ? 0 : 1;
    const c = lawn(p[0], p[2]);
    const diff = SUN[1] * lit;
    const col: V = [0, 1, 2].map((i) => c[i] * (AMBIENT[i] + 0.9 * diff * SUN_COLOR[i])) as V;
    return mix(col, sky([d[0], 0, d[2]]), clamp01(1 - Math.exp(-t / 40)));
  }
  const s = h.shape.material(h);
  const n = h.n;
  const lit = blocked(shapes, add(h.p, scale(n, 2e-3)), SUN) ? 0 : 1;
  const diff = Math.max(0, dot(n, SUN)) * lit;
  const vn = dot(d, n);
  const r: V = [d[0] - 2 * vn * n[0], d[1] - 2 * vn * n[1], d[2] - 2 * vn * n[2]];
  const spec = s.ks ? Math.max(0, dot(r, SUN)) ** s.shine * s.ks * lit : 0;
  const e = s.mirror ? env(r) : undefined;
  const out: V = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    out[i] = s.color[i] * (AMBIENT[i] + s.kd * diff * SUN_COLOR[i]) + spec;
    if (e) out[i] = out[i] * (1 - s.mirror * 0.5) + e[i] * s.mirror * s.color[i];
    if (s.glow) out[i] += s.glow[i];
  }
  return out;
}

const SAMPLES: [number, number][] = [
  [0.375, 0.125],
  [0.875, 0.375],
  [0.125, 0.625],
  [0.625, 0.875],
];

function pixel(shapes: Shape[], x: number, y: number): V {
  const acc: V = [0, 0, 0];
  for (const [sx, sy] of SAMPLES) {
    const c = trace(shapes, cam.ray(x + sx, y + sy));
    acc[0] += c[0] / 4;
    acc[1] += c[1] / 4;
    acc[2] += c[2] / 4;
  }
  return acc;
}

/** The screen box a moving shape and its shadow on the ground can touch. */
function dirtyBox(s: Shape, shadows = true): [number, number, number, number] {
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  const pts: V[] = [];
  for (const c of s.corners()) pts.push(c, shadows ? sub(c, scale(SUN, c[1] / SUN[1])) : c);
  for (const c of pts) {
    const p = cam.project(c);
    if (!p) return [0, 0, W - 1, H - 1];
    x0 = Math.min(x0, p[0]);
    y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]);
    y1 = Math.max(y1, p[1]);
  }
  return [Math.max(0, Math.floor(x0) - 2), Math.max(0, Math.floor(y0) - 2), Math.min(W - 1, Math.ceil(x1) + 2), Math.min(H - 1, Math.ceil(y1) + 2)];
}

/** A part of the scene that moves; once it comes to rest it joins a cached layer. */
interface Mover {
  key: string;
  shapes: Shape[];
  rest: boolean;
  /** Only its shading changes this frame (the highlight sweep), not where it or its shadow is. */
  glowOnly?: boolean;
  /** The same shapes without the glow, as they rest. */
  restAs?: Shape[];
}

function movers(f: number): Mover[] {
  const { pieces: ps } = logo();
  const band = f >= SWEEP_START && f < SWEEP_START + SWEEP;
  const logoParts = logoShapes(f);
  const plainParts = band ? logoShapes(f, false) : logoParts;
  const plain = (key: string) => plainParts.filter((l) => l.key === key).map((l) => l.shape);
  const out: Mover[] = [
    { key: 'shovel', shapes: shovel(shovelLift(f)), rest: f >= PATS[PATS.length - 1] + PAT / 2 },
    { key: 'puffs', shapes: puffs(f), rest: false },
    { key: 'flag', shapes: flag(f), rest: false },
  ];
  ps.forEach((_, i) => {
    const s = logoParts.find((l) => l.key === `piece${i}`);
    const landed = f >= DROP_START + i * DROP_STAGGER + DROP;
    if (s) out.push({ key: s.key, shapes: [s.shape], rest: !band && landed, glowOnly: band && landed, restAs: plain(s.key) });
  });
  return out;
}

/** Each mover's shapes behind one bounding box. */
const grouped = (sets: Shape[][]): Shape[] => sets.filter((x) => x.length).map((x) => (x.length > 1 ? new Group(x) : x[0]));

/** Marks the screen boxes shapes (and their shadows) can touch. */
function markDirty(mask: Uint8Array, shapes: Shape[], shadows = true): void {
  for (const s of shapes) {
    const [x0, y0, x1, y1] = dirtyBox(s, shadows);
    for (let y = y0; y <= y1; y++) mask.fill(1, y * W + x0, y * W + x1 + 1);
  }
}

function retrace(out: Float32Array, mask: Uint8Array, shapes: Shape[]): void {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) out.set(pixel(shapes, x, y), (y * W + x) * 3);
}

/** Pictures of the still scene with some movers at rest in it, keyed by which ones. */
const layers = new Map<string, { keys: Set<string>; px: Float32Array }>();
const restShapes = new Map<string, Shape[]>();

/** Everything that isn't moving at the moment, traced once per set of resting movers. */
function layer(rest: Mover[]): Float32Array {
  for (const m of rest) if (!restShapes.has(m.key)) restShapes.set(m.key, m.restAs ?? m.shapes);
  const keys = rest.map((m) => m.key).sort();
  const sig = keys.join(',');
  const hit = layers.get(sig);
  if (hit) return hit.px;
  if (!layers.has('')) {
    const px = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px.set(pixel(statics, x, y), (y * W + x) * 3);
    layers.set('', { keys: new Set(), px });
    if (!sig) return px;
  }
  // start from the cached layer with the most of these movers (and no others) and add the rest
  let base = layers.get('')!;
  for (const l of layers.values()) if (l.keys.size > base.keys.size && [...l.keys].every((k) => keys.includes(k))) base = l;
  const added = keys.filter((k) => !base.keys.has(k));
  const px = base.px.slice();
  const mask = new Uint8Array(W * H);
  markDirty(
    mask,
    added.flatMap((k) => restShapes.get(k)!),
  );
  retrace(px, mask, [...statics, ...grouped([keys.flatMap((k) => restShapes.get(k)!)])]);
  layers.set(sig, { keys: new Set(keys), px });
  return px;
}

/** A four-point star glint with a soft halo, the kind 3D Studio's glow filter drew. */
function sparkle(out: Float32Array, cx: number, cy: number, k: number): void {
  const R = 26 * k;
  for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(H - 1, Math.ceil(cy + R)); y++)
    for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(W - 1, Math.ceil(cx + R)); x++) {
      const dx = Math.abs(x + 0.5 - cx);
      const dy = Math.abs(y + 0.5 - cy) * 1.2;
      const r = Math.hypot(dx, dy);
      const arms = Math.max(0, 1 - dy / 1.6) * Math.max(0, 1 - dx / R) ** 2 + Math.max(0, 1 - dx / 1.6) * Math.max(0, 1 - dy / R) ** 2;
      const diag = Math.max(0, 1 - Math.abs(dx - dy) / 1.2) * Math.max(0, 1 - r / (R * 0.45)) ** 2 * 0.5;
      const core = Math.max(0, 1 - r / (5 * k)) ** 2 * 1.2;
      const v = (arms + diag + core) * k;
      const i = (y * W + x) * 3;
      out[i] += v;
      out[i + 1] += v;
      out[i + 2] += v * 0.9;
    }
}

/** One frame in linear RGB: the still layer, with what moves traced again where it can show. */
function renderFrame(f: number): Float32Array {
  const ms = movers(f);
  const resting = ms.filter((m) => m.rest);
  const moving = ms.filter((m) => !m.rest).map((m) => m.shapes);
  // a piece that only glows is where it rests, shadow and all
  const out = layer(ms.filter((m) => m.rest || m.glowOnly)).slice();
  const mask = new Uint8Array(W * H);
  for (const m of ms) if (!m.rest) markDirty(mask, m.shapes, !m.glowOnly);
  retrace(out, mask, [...statics, ...grouped([resting.flatMap((m) => restShapes.get(m.key)!)]), ...grouped(moving)]);
  for (const [sf, piece] of SPARKLES) {
    const t = f - sf;
    if (t < 0 || t > 3) continue;
    const k = [0.6, 1, 0.7, 0.35][t];
    const p = logo().pieces[piece];
    const g = p.text.grid;
    const corner = add(LOGO_C, apply(LOGO_ROT, [(p.x + g.x1 * 0.55) * LOGO_SIZE, 0.48 * LOGO_SIZE, -0.25 * LOGO_SIZE]));
    const s = cam.project(corner);
    if (s) sparkle(out, s[0], s[1], k);
  }
  return out;
}

const toBytes = (f: Float32Array): Uint8Array => {
  const out = new Uint8Array(f.length);
  for (let i = 0; i < f.length; i++) out[i] = Math.round(clamp01(f[i]) * 255);
  return out;
};

// ---- SOFTWARE ------------------------------------------------------------------------
// Drawn flat on top of the dithered render, the way a 1995 animator lettered over a
// render: bold yellow in three solid bands with a thick black outline and drop shadow, so
// it reads over the castle and sky at 320x200 in every frame.

/** Palette entries kept for the lettering: black, then light yellow, yellow and orange. */
const FLAT: [number, number, number][] = [
  [0, 0, 0],
  [255, 250, 170],
  [255, 214, 0],
  [235, 128, 0],
];
const SOFT_CX = 160;
const SOFT_MID = 80;
/** Cap height in screen rows at full size. */
const SOFT_ROWS = 17;
const OUTLINE = 3;

let softText: { grid: DistanceGrid; x0: number; x1: number } | undefined;
function softwareText() {
  if (!softText) {
    const segs = fatter(textStrokes('SOFTWARE', 1, 0, 0.32), 1.55);
    const xs = segs.flatMap(([a, , b, , r]) => [a - r, b + r]);
    softText = { grid: new DistanceGrid(segs, 0.01, 0.3), x0: Math.min(...xs), x1: Math.max(...xs) };
  }
  return softText;
}

/** SOFTWARE's size at frame f (0 = not shown yet). */
function softScale(f: number): number {
  const k = f - SOFT_START;
  return k < 0 ? 0 : SOFT_ZOOM[Math.min(k, SOFT_ZOOM.length - 1)];
}

/** Where SOFTWARE sits at a scale: its baseline, pixels per unit across and rows per unit up. */
function softPlace(s: number) {
  const rows = SOFT_ROWS * s;
  return { rows, unit: rows * 1.2, base: SOFT_MID + rows / 2 };
}

/** Letters SOFTWARE over an indexed frame in the flat colors (no dither). */
function drawSoftware(px: Uint8Array, f: number): Uint8Array {
  const s = softScale(f);
  if (!s) return px;
  const { rows, unit, base } = softPlace(s);
  const t = softwareText();
  const x0 = Math.max(0, Math.floor(SOFT_CX + t.x0 * unit - 8));
  const x1 = Math.min(W - 1, Math.ceil(SOFT_CX + t.x1 * unit + 8));
  const y0 = Math.max(0, Math.floor(base - rows - 8));
  const y1 = Math.min(H - 1, Math.ceil(base + 8));
  // 0 nothing, 1 outline, 2.. the fill's palette entry + 1
  const kind = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const ux = (x + 0.5 - SOFT_CX) / unit;
      const uy = (base - (y + 0.5)) / rows;
      const d = t.grid.at(ux, uy) * unit;
      if (d < 0) kind[y * W + x] = 1 + (uy > 0.6 ? 1 : uy > 0.2 ? 2 : 3);
      else if (d < Math.max(1.2, OUTLINE * Math.min(1, s))) kind[y * W + x] = 1;
    }
  // the drop shadow, then the outline and the fill
  const sh = Math.max(1, Math.round(3 * s));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) if (kind[y * W + x] && x + sh < W && y + sh < H && !kind[(y + sh) * W + x + sh]) px[(y + sh) * W + x + sh] = 0;
  for (let i = 0; i < kind.length; i++) if (kind[i]) px[i] = kind[i] === 1 ? 0 : kind[i] - 1;
  return px;
}

interface LogoFrames {
  frames: Uint8Array[];
  /** A palette per frame (the fades). */
  palettes: Uint8Array[];
  palette: Uint8Array;
  speed: number;
}

let cached: LogoFrames | undefined;

/** Every frame of the sting as 320x200 indexed pixels, with their palettes. */
function sandLogoFrames(): LogoFrames {
  if (cached) return cached;
  const rgb: Uint8Array[] = [];
  for (let f = 0; f < FRAMES; f++) {
    const fl = renderFrame(f);
    rgb.push(toBytes(fl));
  }
  const palette = medianCutPalette(rgb, FLAT);
  const q = new Quantizer(palette, 5);
  const frames = rgb.map((c, f) => drawSoftware(q.apply(c, W, H), f));
  const palettes = frames.map((_, f) => {
    const k = f < FADE_IN ? (f + 1) / (FADE_IN + 1) : f >= FRAMES - FADE ? (FRAMES - 1 - f) / FADE : 1;
    return palette.map((v) => Math.round(v * k));
  });
  cached = { frames, palettes, palette, speed: SPEED };
  return cached;
}

let fli: Uint8Array | undefined;

/** SANDLOGO.FLI: the sting as an Autodesk Animator FLI (its own palette, delta frames). */
export function sandLogoFli(): Uint8Array {
  if (!fli) {
    const { frames, palettes, palette, speed } = sandLogoFrames();
    fli = encodeFli(frames, palette, { speed, palettes });
  }
  return fli;
}
