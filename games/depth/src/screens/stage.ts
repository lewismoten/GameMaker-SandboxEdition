// The set for the screens' renders: a checkerboard to the horizon (or a theme's floor), the
// studio sky, a key light with soft shadows, and the props everybody in 1996 rendered.
import { perspective, render, type Camera, type Picture } from '../render/image';
import { MAT, checker, studio } from '../render/look';
import { Box, Cylinder, Sphere, mix, norm, rgb, type Material, type Shape, type V, type World } from '../render/tracer';
import { teapotModel } from '../models/cast';

export const W = 320;
export const H = 200;

export const CHECKER: Material = { color: checker(rgb(236, 232, 244), rgb(32, 30, 70), 1), diffuse: 0.9, reflect: 0.16, fresnel: 0.25, spec: 0.4, shine: 40 };

export function floor(mat: Material = CHECKER, z = 0): Shape {
  return new Box([-400, -400, z - 2], [400, 400, z], mat);
}

export interface StageOptions {
  key?: V;
  keyColor?: V;
  sky?: V;
  ground?: V;
  env?: (d: V) => V;
  fog?: World['fog'];
  ao?: number;
  points?: World['points'];
  backdrop?: World['backdrop'];
}

export function stage(shapes: Shape[], o: StageOptions = {}): World {
  return {
    shapes,
    key: { dir: norm(o.key ?? [-0.5, -0.55, 0.9]), color: o.keyColor ?? rgb(255, 244, 228), soft: 0.05 },
    points: o.points,
    sky: o.sky ?? rgb(70, 78, 125),
    ground: o.ground ?? rgb(40, 32, 46),
    ao: { reach: 1.2, strength: o.ao ?? 0.6 },
    env: o.env ?? ((d) => studio(d)),
    // the soft boxes light the chrome but stay out of the picture
    backdrop: o.backdrop ?? ((d) => studio(d, { boxes: false })),
    fog: o.fog ?? { color: rgb(220, 180, 180), scale: 45, from: 8 },
    maxDepth: 4,
  };
}

export function cam(eye: V, look: V, fov = 0.8, extra: Partial<Parameters<typeof perspective>[0]> = {}): Camera {
  return perspective({ eye, look, w: W, h: H, fov, ...extra });
}

export function still(world: World, c: Camera, spp = 4, edge = 25, seed = 1): Picture {
  return render(world, c, W, H, { spp, edgeSpp: edge, seed });
}

/** The props of every 1995 ray tracing demo, around a spot. */
export function props(at: V, s = 1): Shape[] {
  const p = (x: number, y: number, z: number): V => [at[0] + x * s, at[1] + y * s, at[2] + z * s];
  return [
    new Box(p(1.3, -0.4, 0), p(2.3, 0.6, 1.0), MAT.glass),
    new Cylinder(at[0] - 2.4 * s, at[1] + 0.8 * s, 0.45 * s, at[2], at[2] + 1.6 * s, MAT.marble(rgb(240, 236, 244), rgb(120, 110, 150))),
    new Sphere(p(-2.4, 0.8, 2.05), 0.45 * s, MAT.gold),
    teapotModel(p(2.6, 2.2, 0), 1.3 * s, rgb(220, 40, 50)),
  ];
}

export const glowMat = (c: V, k = 1): Material => ({ color: c, diffuse: 0, emit: [c[0] * k, c[1] * k, c[2] * k], noShadow: true });
export { mix };
