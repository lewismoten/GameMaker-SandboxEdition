// The six scenes' sets: what the floor, the walls and the void are made of, and how each is lit.
import { checker, studio } from '../render/look';
import { clamp01, mix, rgb, smooth, type Material, type V } from '../render/tracer';

export type ThemeId = 'checker' | 'glass' | 'mirror' | 'peaks' | 'teapot' | 'vanish';

export interface Theme {
  id: ThemeId;
  floor: Material;
  wall: Material;
  /** Color of the floor slabs' sides going down into the void. */
  cliff: V;
  /** The void far below. */
  abyss: V;
  sky: V;
  ground: V;
  key: V;
  env: (d: V) => V;
}

const hash2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** Smooth value noise (for rock and grass). */
export function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(0, 1, x - xi);
  const v = smooth(0, 1, y - yi);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x: number, y: number, oct = 4) => {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += noise(x * f, y * f) * amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return s;
};

// Every floor pattern repeats each cell (the same tile goes everywhere), so textures use the
// position inside the cell only.
const frac = (v: number) => v - Math.floor(v);

export const THEMES: Record<ThemeId, Theme> = {
  checker: {
    id: 'checker',
    floor: { color: checker(rgb(232, 230, 240), rgb(34, 32, 70), 0.5), diffuse: 0.9, reflect: 0.12, fresnel: 0.2, spec: 0.4, shine: 40 },
    wall: { color: rgb(196, 70, 60), diffuse: 0.85, spec: 0.9, shine: 60, fresnel: 0.25 },
    cliff: rgb(70, 64, 110),
    abyss: rgb(8, 6, 26),
    sky: rgb(120, 128, 175),
    ground: rgb(60, 50, 70),
    key: rgb(255, 244, 230),
    env: (d) => studio(d),
  },
  glass: {
    id: 'glass',
    floor: {
      color: (p) => {
        const u = frac(p[0]);
        const v = frac(p[1]);
        const grout = Math.min(u, v, 1 - u, 1 - v) < 0.035;
        const vein = 0.5 + 0.5 * Math.sin(p[0] * 11 + Math.sin(p[1] * 9) * 1.5);
        return grout ? rgb(40, 70, 60) : mix(rgb(120, 190, 160), rgb(200, 240, 215), vein);
      },
      diffuse: 0.9,
      reflect: 0.1,
      fresnel: 0.3,
      spec: 0.7,
      shine: 50,
    },
    wall: { color: rgb(170, 230, 210), diffuse: 0.1, spec: 1.4, shine: 140, glass: { ior: 1.45, tint: rgb(150, 235, 200), absorb: 0.15 } },
    cliff: rgb(40, 90, 80),
    abyss: rgb(4, 20, 24),
    sky: rgb(130, 180, 170),
    ground: rgb(40, 70, 60),
    key: rgb(255, 250, 225),
    env: (d) => studio(d, { top: rgb(40, 110, 110), horizon: rgb(220, 250, 220) }),
  },
  mirror: {
    id: 'mirror',
    floor: {
      color: (p) => {
        const u = frac(p[0] + 0.5);
        const v = frac(p[1] + 0.5);
        const d = Math.abs(u - 0.5) + Math.abs(v - 0.5);
        return d < 0.47 && d > 0.4 ? rgb(150, 110, 200) : rgb(28, 22, 44);
      },
      diffuse: 0.7,
      reflect: 0.32,
      fresnel: 0.3,
      spec: 1.0,
      shine: 90,
    },
    wall: { color: rgb(220, 225, 240), diffuse: 0.05, reflect: 0.85, metal: true, spec: 1.2, shine: 120 },
    cliff: rgb(60, 40, 90),
    abyss: rgb(10, 4, 24),
    sky: rgb(110, 90, 150),
    ground: rgb(40, 30, 60),
    key: rgb(240, 230, 255),
    env: (d) => studio(d, { top: rgb(70, 30, 120), horizon: rgb(240, 180, 240) }),
  },
  peaks: {
    id: 'peaks',
    floor: {
      color: (p) => {
        const n = fbm(frac(p[0]) * 4 + 3, frac(p[1]) * 4 + 7);
        const g = mix(rgb(70, 120, 50), rgb(150, 180, 80), n);
        return g;
      },
      diffuse: 1,
      spec: 0.1,
      shine: 10,
    },
    wall: {
      color: (p) => {
        const n = fbm(p[0] * 3 + p[2] * 2, p[1] * 3 - p[2]);
        return mix(rgb(95, 80, 75), rgb(175, 160, 150), clamp01(n * 1.3 - 0.1));
      },
      diffuse: 1,
      spec: 0.2,
      shine: 20,
    },
    cliff: rgb(120, 96, 80),
    abyss: rgb(30, 40, 80),
    sky: rgb(150, 160, 200),
    ground: rgb(90, 80, 60),
    key: rgb(255, 220, 170),
    env: (d) => studio(d, { top: rgb(60, 80, 150), horizon: rgb(255, 190, 140), boxes: false }),
  },
  teapot: {
    id: 'teapot',
    floor: {
      color: (p) => {
        const u = frac(p[0]);
        const v = frac(p[1]);
        const edge = Math.min(u, v, 1 - u, 1 - v);
        const inner = Math.abs(u - 0.5) < 0.18 && Math.abs(v - 0.5) < 0.18;
        if (edge < 0.04) return rgb(90, 50, 30);
        return inner ? rgb(240, 225, 190) : rgb(196, 104, 60);
      },
      diffuse: 0.9,
      reflect: 0.06,
      fresnel: 0.2,
      spec: 0.5,
      shine: 30,
    },
    wall: {
      color: (p) => mix(rgb(210, 180, 130), rgb(240, 220, 175), 0.5 + 0.5 * Math.sin(p[2] * 40)),
      diffuse: 0.95,
      spec: 0.4,
      shine: 25,
    },
    cliff: rgb(150, 90, 60),
    abyss: rgb(30, 10, 10),
    sky: rgb(190, 160, 140),
    ground: rgb(90, 60, 40),
    key: rgb(255, 235, 200),
    env: (d) => studio(d, { top: rgb(110, 60, 50), horizon: rgb(255, 210, 160) }),
  },
  vanish: {
    id: 'vanish',
    floor: {
      color: (p) => {
        const u = frac(p[0]);
        const v = frac(p[1]);
        const line = Math.min(u, v, 1 - u, 1 - v);
        return line < 0.05 ? rgb(90, 220, 255) : line < 0.1 ? rgb(30, 60, 110) : rgb(10, 10, 24);
      },
      diffuse: 0.6,
      reflect: 0.25,
      fresnel: 0.3,
      spec: 1.0,
      shine: 80,
    },
    wall: { color: rgb(24, 20, 40), diffuse: 0.4, reflect: 0.3, fresnel: 0.5, spec: 1.4, shine: 140 },
    cliff: rgb(20, 30, 70),
    abyss: rgb(2, 2, 10),
    sky: rgb(70, 80, 140),
    ground: rgb(20, 20, 40),
    key: rgb(220, 230, 255),
    env: (d) => studio(d, { top: rgb(20, 20, 60), horizon: rgb(120, 220, 255) }),
  },
};
