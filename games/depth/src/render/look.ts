// The house look of Depth Perception: a studio environment (soft boxes over a dark cyclorama,
// what every chrome sphere of 1995 reflected), the checkerboard, and the stock materials.
import { clamp01, mix, rgb, smooth, type Material, type V } from './tracer';

/** The studio: deep blue-violet walls, a warm horizon line and two big soft boxes overhead. */
export function studio(d: V, opts: { top?: V; horizon?: V; floor?: V; boxes?: boolean } = {}): V {
  const top = opts.top ?? rgb(40, 52, 110);
  const hor = opts.horizon ?? rgb(230, 190, 170);
  const floor = opts.floor ?? rgb(24, 20, 34);
  const z = d[2];
  let c: V;
  if (z >= 0) c = mix(hor, top, smooth(0, 0.55, z));
  else c = mix(mix(hor, floor, 0.6), floor, smooth(0, 0.3, -z));
  // a thin hot line where floor meets sky
  const line = Math.exp(-((z / 0.03) ** 2)) * 0.5;
  c = [c[0] + line, c[1] + line * 0.9, c[2] + line * 0.8];
  if (opts.boxes !== false) {
    // soft boxes: one big overhead to the north-west, a strip to the east
    const box = (cx: number, cy: number, cz: number, size: number, power: number) => {
      const dd = (d[0] - cx) ** 2 + (d[1] - cy) ** 2 + (d[2] - cz) ** 2;
      return smooth(size, size * 0.55, Math.sqrt(dd)) * power;
    };
    const s = box(-0.45, -0.3, 0.84, 0.38, 2.2) + box(0.85, 0.15, 0.5, 0.18, 1.3) + box(0.1, 0.9, 0.42, 0.12, 0.8);
    c = [c[0] + s, c[1] + s, c[2] + s * 0.95];
  }
  return c;
}

/** A checkerboard on the floor plane, `size` per check, faded by distance. */
export function checker(a: V, b: V, size = 0.5, offset = 0): (p: V) => V {
  return (p) => ((Math.floor((p[0] + offset) / size) + Math.floor((p[1] + offset) / size)) & 1 ? a : b);
}

export const MAT = {
  chrome: { color: rgb(235, 238, 245), diffuse: 0.06, reflect: 0.86, fresnel: 0.1, metal: true, spec: 1.2, shine: 120 } as Material,
  gold: { color: rgb(255, 196, 92), diffuse: 0.12, reflect: 0.78, metal: true, spec: 1.0, shine: 80 } as Material,
  glass: { color: rgb(255, 255, 255), diffuse: 0, spec: 1.5, shine: 160, glass: { ior: 1.5, tint: rgb(220, 240, 255) } } as Material,
  plastic: (c: V): Material => ({ color: c, diffuse: 0.9, spec: 0.6, shine: 40, fresnel: 0.15 }),
  matte: (c: V): Material => ({ color: c, diffuse: 1 }),
  glow: (c: V, power = 1): Material => ({ color: c, diffuse: 0, emit: [c[0] * power, c[1] * power, c[2] * power], noShadow: true }),
  marble: (a: V, b: V): Material => ({
    color: (p: V) => {
      const v = Math.sin(p[0] * 9 + Math.sin(p[1] * 7 + p[2] * 5) * 2.2 + Math.sin(p[0] * 23 + p[1] * 19) * 0.4);
      return mix(a, b, clamp01(Math.abs(v) ** 0.35));
    },
    diffuse: 0.9,
    spec: 0.8,
    shine: 60,
    fresnel: 0.25,
  }),
};
