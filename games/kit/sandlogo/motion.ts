// Moving shovel, sand grains, flag and resting-part states for the logo sting.
import {
  add,
  apply,
  Box,
  Capsule,
  Cone,
  cross,
  fromAxes,
  mulM,
  norm,
  placed,
  rotY,
  scale,
  Shape,
  Sphere,
  sub,
  Tri,
  V,
} from '@lewismoten/gamemaker-sandbox-tools/kit/raytrace';
import { PATS, PAT, DROP_START, DROP_STAGGER, DROP, SWEEP_START, SWEEP } from './settings';
import { plain, sand, plastic, RED, BLUE, YELLOW } from './materials';
import { SAND_Y, MOUND, POLE_TOP } from './scene';
import { logo, logoShapes } from './lettering';

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

/** A part of the scene that moves; once it comes to rest it joins a cached layer. */
export interface Mover {
  key: string;
  shapes: Shape[];
  rest: boolean;
  /** Only its shading changes this frame (the highlight sweep), not where it or its shadow is. */
  glowOnly?: boolean;
  /** The same shapes without the glow, as they rest. */
  restAs?: Shape[];
}

export function movers(f: number): Mover[] {
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
