// ENDING.FLI: the render is finished. THE CHEZ drives off down the checkerboard toward the
// vanishing point, Ray riding on the roof with Teddy and Gwinn, while Doc Leo waves from the
// side of the road and the sun comes up where all the lines meet.
import { flare, bloom, type Picture } from '../render/image';
import { Moved, Sphere, rgb, rotation, type Shape, type V } from '../render/tracer';
import * as C from '../models/cast';
import { citicar } from '../models/citicar';
import { rayModel } from '../models/ray';
import { NEAR_COL } from '../tiles/cells';
import { studio } from '../render/look';
import { centered } from './draw';
import { place } from './pictures';
import { cam, floor, glowMat, stage, still, H, W } from './stage';

const SUNRISE = (d: V) => studio(d, { top: rgb(70, 90, 170), horizon: rgb(255, 190, 120), boxes: false });

/** THE CHEZ and its riders, nose toward -y, the middle of its rear bumper at (x, y). */
function chez(x: number, y: number, s: number, roll: number): Shape[] {
  const car = citicar(0, 0, s, [0, 0, 0]);
  const R = rotation(-Math.PI / 2);
  // in the car's frame: x along its length, y across (0.75 wide)
  const riders: Shape[] = [
    ...rayModel('y', roll, NEAR_COL, [0.75 * s, 0.375 * s, 1.0 * s + 0.3 * s], 0.3 * s),
    ...place(C.teddy(2), 0.2 * s, 0.2 * s, 0.75 * s, Math.PI / 2, 1.0 * s),
    ...place(C.gwinn(2), 0.2 * s, 0.6 * s, 0.75 * s, Math.PI / 2, 1.0 * s),
  ];
  return [...car, ...riders].map((sh) => new Moved(sh, R, [x - 0.375 * s, y, 0]));
}

export function endingFrames(): { frames: Picture[]; speed: number } {
  const frames: Picture[] = [];
  const camera = cam([0.6, 7, 1.7], [0.3, -10, 0.6], 0.8);
  const leo = place(C.docLeo(1), -1.5, 3.6, 2.1, -0.3);
  const sun = new Sphere([0, -300, 2], 18, glowMat(rgb(255, 230, 170), 1.6));
  const DRIVE = 28;
  for (let f = 0; f < DRIVE; f++) {
    const t = f / (DRIVE - 1);
    const y = 2.2 - 34 * t * t;
    const shapes = [floor(), sun, ...leo, ...chez(0.4, y, 1.3, f * 0.6)];
    const world = stage(shapes, { env: SUNRISE, backdrop: SUNRISE, keyColor: rgb(255, 222, 186), key: [-0.5, 0.7, 0.6], sky: rgb(110, 110, 160), fog: { color: rgb(255, 200, 150), scale: 40, from: 10 } });
    const pic = still(world, camera, 4, 16, 31);
    flare(pic, 163, 86, 0.25 + 0.5 * t);
    frames.push(pic);
  }
  const last: Picture = { w: W, h: H, rgb: frames[frames.length - 1].rgb.slice() };
  bloom(last, 0.85, 3, 0.6);
  centered(last, 20, 'THE RENDER IS FINISHED.', rgb(255, 255, 255), 1, { outline: rgb(40, 20, 30) });
  centered(last, 34, '100%', rgb(255, 220, 140), 2, { outline: rgb(40, 20, 30) });
  for (let f = 0; f < 14; f++) frames.push(last);
  return { frames, speed: 7 };
}
