// The title: DEPTH PERCEPTION in beveled chrome over the checkerboard, Ray in front, the props
// of every ray tracing demo behind, a lens flare on the letters.
import { bloom, flare, type Picture } from '../render/image';
import { MAT, studio } from '../render/look';
import { Sphere, mix, rgb, type Material, type Shape, type V } from '../render/tracer';
import { rayModel } from '../models/ray';
import { NEAR_COL } from '../tiles/cells';
import { centered } from './draw';
import { lettering } from './logo';
import { cam, floor, props, stage, still } from './stage';

/** Chrome that runs from cyan at the top of the letters to amber at the bottom (far to near). */
const LOGO_CHROME = (z0: number, z1: number): Material => ({
  color: (p) => mix(rgb(255, 170, 70), rgb(110, 220, 255), Math.max(0, Math.min(1, (p[2] - z0) / (z1 - z0)))),
  diffuse: 0.18,
  reflect: 0.72,
  metal: true,
  spec: 1.4,
  shine: 90,
});

export function logoShapes(at: V = [0, 0, 1.15], scale = 1, yaw = 0, pitch = -0.38): Shape {
  return lettering(
    [
      { text: 'DEPTH', height: 1.25, y: 0.55 },
      { text: 'PERCEPTION', height: 0.5, y: -0.1, gap: 0.2 },
    ],
    0.4,
    0.07,
    LOGO_CHROME(at[2] - 0.2, at[2] + 1.9),
    at,
    yaw,
    pitch,
    scale,
  );
}

/** The set the title and the intro share. */
export function titleSet(extra: Shape[] = []): Shape[] {
  return [floor(), ...props([0, 3.5, 0], 1.1), ...extra];
}

/** A brighter studio for the logo's chrome to reflect. */
export const SKY = (d: V) => studio(d, { top: rgb(90, 120, 210), horizon: rgb(255, 214, 180) });

export const TITLE_EYE: V = [0.2, -8.6, 2.0];
export const TITLE_LOOK: V = [0, 0, 1.35];

export function titlePicture(): Picture {
  const ray = rayModel('y', 0.5, NEAR_COL, [2.1, -2.4, 0.62], 0.62);
  const shapes = titleSet([logoShapes([0, 0.4, 1.0], 1.45), ...ray, new Sphere([-2.6, -1.6, 0.35], 0.35, MAT.chrome)]);
  const w = stage(shapes, { env: SKY });
  const pic = still(w, cam(TITLE_EYE, TITLE_LOOK, 0.78), 4, 25, 7);
  bloom(pic, 0.9, 2.5, 0.5);
  flare(pic, 76, 46, 0.7);
  centered(pic, 184, 'NO GLASSES REQUIRED.', rgb(255, 255, 255), 1, { outline: rgb(20, 16, 50) });
  return pic;
}
