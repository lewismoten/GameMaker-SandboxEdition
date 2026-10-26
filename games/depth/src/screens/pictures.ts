// The still pictures: level cards, the menu, story slides, the cast, the pages text is shown
// over, high scores, load and save, out of light, the ending's slides and the egg.
import { bloom, flare, type Picture } from '../render/image';
import { MAT, studio } from '../render/look';
import { Box, Cylinder, Moved, Sphere, cross, dot, mix, norm, rgb, rotation, sub, type Material, type Shape, type V } from '../render/tracer';
import * as C from '../models/cast';
import { citicar } from '../models/citicar';
import { RAY_R, rayDeath, rayModel } from '../models/ray';
import { FAR_COL, KINDS, NEAR_COL, cube, eggShape } from '../tiles/cells';
import { THEMES, type ThemeId } from '../tiles/themes';
import { centered, panel, text } from './draw';
import { STATUS } from '../../../kit/saveSlots';
import { logoShapes, SKY } from './title';
import { H, W, cam, floor, glowMat, props, stage, still } from './stage';

/** A model built in a cell (centered near 0.5, 0.6) placed at (x, y), scaled and turned. */
export function place(shapes: Shape[], x: number, y: number, s = 1, yaw = 0, z = 0): Shape[] {
  const R = rotation(yaw);
  const c: V = [0.5, 0.6, 0];
  const rc: V = [R[0] * c[0] + R[1] * c[1], R[3] * c[0] + R[4] * c[1], 0];
  return shapes.map((sh) => new Moved(sh, R, [x - rc[0] * s, y - rc[1] * s, z], s));
}

const ray = (x: number, y: number, s = 1, col = NEAR_COL, a = 0.6) => rayModel('y', a, col, [x, y, RAY_R * s + 0.01], RAY_R * s);

const WHITE: V = rgb(255, 255, 255);
const INK: V = rgb(20, 14, 44);

/** Words over a picture: a big title, a line under it, and advice at the bottom. */
function card(pic: Picture, title: string, line: string, advice: string[], n: number, of: number): void {
  panel(pic, 0, 0, W, 38, rgb(10, 8, 30), 0.55);
  text(pic, 8, 3, n === of ? `FINAL SCENE: ${n} OF ${of}` : `SCENE ${n} OF ${of}`, rgb(255, 200, 90), 1, { outline: INK });
  centered(pic, 16, title.toUpperCase(), WHITE, 2, { outline: INK, shadow: rgb(0, 0, 0) });
  panel(pic, 0, 150, W, H, rgb(10, 8, 30), 0.6);
  centered(pic, 154, line, rgb(140, 230, 255), 1, { outline: INK });
  advice.forEach((l, i) => centered(pic, 168 + i * 9, l, WHITE, 1, { outline: INK }));
}

function themeFloor(id: ThemeId): Shape {
  return new Box([-60, -60, -2], [60, 60, 0], THEMES[id].floor);
}

/** A row of cubes along x (a wall in the theme). */
function wallRow(id: ThemeId, x0: number, x1: number, y: number, mat?: Material): Shape[] {
  const out: Shape[] = [];
  for (let x = x0; x <= x1; x++) out.push(cube(x, y, mat ?? THEMES[id].wall, { round: THEMES[id].wallRound }));
  return out;
}

const nearCube: Material = { color: NEAR_COL, diffuse: 0.85, spec: 1.0, shine: 70, fresnel: 0.3 };
const farCube: Material = { color: FAR_COL, diffuse: 0.75, spec: 1.2, shine: 90, fresnel: 0.35 };

/** The level cards: each scene's set, rendered close to the ground with a long lens. */
export function cardPicture(n: number, of: number, title: string, line: string, advice: string[]): Picture {
  const ids: ThemeId[] = ['checker', 'glass', 'mirror', 'peaks', 'teapot', 'vanish'];
  const id = ids[n - 1];
  const t = THEMES[id];
  const shapes: Shape[] = [themeFloor(id)];
  let eye: V = [0.6, 6.2, 2.3];
  let look: V = [0.6, 0, 0.5];
  if (n === 1) {
    shapes.push(
      ...wallRow(id, -4, 5, -3),
      ...ray(0.6, 1.2),
      ...place(C.teddy(2), -1.6, 0.9, 1.4, 0.4),
      new Sphere([2.8, -0.6, 0.5], 0.5, MAT.chrome),
      new Sphere([-3, -1.2, 0.45], 0.45, MAT.chrome),
    );
    shapes.push(cube(2, -2, nearCube), cube(3, -2, nearCube), cube(-2, -2, farCube));
  } else if (n === 2) {
    shapes.push(...wallRow(id, -4, 5, -3), ...place(C.gwinn(2), -1.2, 0.9, 1.5, 0.3), ...ray(1.4, 1.0, 1, FAR_COL));
    for (const [x, y] of [
      [-3, -1],
      [3, -1.5],
      [2.5, 0.5],
      [-2.6, 0.8],
    ])
      shapes.push(...place(crystals(), x, y, 2.2));
    shapes.push(new Box([-0.4, -1.4, -0.08], [0.5, -0.5, 0], { color: rgb(220, 200, 255), diffuse: 0.6, reflect: 0.3, emit: rgb(50, 30, 80) }));
  } else if (n === 3) {
    look = [0.6, -1, 0.7];
    for (let x = -4; x <= 5; x++) shapes.push(cube(x, -3, MAT.chrome, { h: 1.6 }));
    shapes.push(cube(-3, -0.5, MAT.chrome, { h: 1.6 }), cube(4, -0.5, MAT.chrome, { h: 1.6 }));
    shapes.push(...ray(0.2, 1.0), ...place(C.double(1), 1.8, -0.6, 1.3));
  } else if (n === 4) {
    eye = [0.6, 7, 3.2];
    for (const [x, y, s] of [
      [-3, -2, 1.6],
      [3.2, -2.5, 2.2],
      [-1, -4, 2.8],
      [1.8, -0.8, 1.0],
      [-3.5, 1, 0.9],
    ])
      shapes.push(boulder(x, y, s));
    shapes.push(...ray(0.4, 1.4), ...place(C.jaggy(1), -1.4, 0.2, 1.6));
  } else if (n === 5) {
    eye = [0.8, 6.4, 2.6];
    shapes.push(...citicar(0, 0, 1.25, [-3.8, -1.2, 0]), C.teapotModel([2.2, -0.6, 0], 1.5), ...place(C.docLeo(0), 0.4, 0.6, 1.6, 0.2), ...ray(1.8, 1.4));
    for (let x = -5; x <= 6; x += 2.5) shapes.push(new Cylinder(x, -3.6, 0.35, 0, 2.2, t.wall), new Cylinder(x, -3.6, 0.45, 2.1, 2.3, MAT.gold));
  } else {
    eye = [0.5, 7.5, 1.6];
    look = [0.5, -4, 0.9];
    for (let k = 0; k < 9; k++) {
      shapes.push(cube(-2.5, -k * 2, t.wall, { h: 1.6 }), cube(3.5, -k * 2, t.wall, { h: 1.6 }));
    }
    shapes.push(...place(C.count(0, 0), 0.5, -3, 2.4, 0, 0.4), ...ray(0.5, 1.2), new Sphere([0.5, -40, 1], 1.2, glowMat(rgb(255, 255, 255), 2)));
  }
  const world = stage(shapes, { env: t.env, sky: t.sky, ground: t.ground, keyColor: t.key, fog: { color: mix(t.sky, [1, 1, 1], 0.2), scale: 30, from: 6 } });
  world.backdrop = (d) =>
    n === 6
      ? mix(rgb(4, 4, 18), rgb(30, 60, 120), Math.max(0, 1 - Math.abs(d[2]) * 4))
      : studio(d, { boxes: false, top: t.sky, horizon: mix(t.sky, [1, 1, 1], 0.5) });
  const pic = still(world, cam(eye, look, 0.75), 4, 20, n);
  bloom(pic, 0.95, 2.5, 0.45);
  card(pic, title, line, advice, n, of);
  return pic;
}

/** A cluster of crystals in a unit cell (the Glass Garden's block). */
function crystals(): Shape[] {
  return KINDS.crystal.shapes!(0, 0, 'near', THEMES.glass, 0);
}

/** A rounded rock (Bryce's favorite thing). */
function boulder(x: number, y: number, s: number): Shape {
  return new Moved(cube(-0.5, -0.5, THEMES.peaks.wall, { round: 0.4, h: 1 }), rotation(x * 0.7), [x, y, 0], s);
}

/** The menu: the logo small at the top, a frosted panel where PLAYGAME writes the menu. */
export function menuPicture(): Picture {
  const shapes = [floor(), ...props([0, 3.5, 0], 1.1), logoShapes([0, 1.2, 2.25], 0.95), ...ray(2.6, -2.8), new Sphere([-2.8, -2.2, 0.4], 0.4, MAT.gold)];
  const pic = still(stage(shapes, { env: SKY }), cam([0.2, -8.6, 2.6], [0, 0, 1.6], 0.8), 4, 20, 3);
  bloom(pic, 0.95, 2.5, 0.4);
  // where the menu goes: title at (96, 104), choices from y 120 to 167, the marker at x 70
  panel(pic, 60, 96, 262, 172, rgb(236, 240, 255), 0.82, rgb(255, 255, 255));
  return pic;
}

/** A page for PLAYGAME's text (x 40..288, y 40..168): frosted glass over a picture. */
export function textPage(base: Picture, tint: V = rgb(248, 246, 255)): Picture {
  // frosted enough that the dark checks behind don't dim the purple words or the red
  // MORE... below 3:1
  panel(base, 32, 34, 296, 180, tint, 0.96, rgb(255, 255, 255));
  return base;
}

/** How to play, before its pages: sharp is solid, a blur isn't there. */
export function howtoPicture(): Picture {
  const t = THEMES.checker;
  const shapes: Shape[] = [
    floor(),
    cube(-1.2, -0.6, nearCube),
    cube(-0.2, -0.6, nearCube),
    ...ray(1.5, 1.1, 1.1),
    new Cylinder(-2.6, 1.0, 0.42, -0.02, 0.03, glowMat(FAR_COL, 0.8)),
  ];
  for (const x of [1.4, 2.4, 3.4]) shapes.push(cube(x, -6, farCube, { h: 1.4 }));
  const world = stage(shapes, { env: t.env });
  // a long lens focused on the near cubes: the far ones fall out of focus
  const pic = still(world, cam([0.5, 6, 3.4], [0.5, -0.6, 0.3], 0.7, { aperture: 0.25, focus: 7.2 }), 10, 48, 11);
  centered(pic, 6, 'SHARP IS SOLID.', WHITE, 2, { outline: INK });
  centered(pic, 180, "A BLUR ISN'T THERE.", WHITE, 2, { outline: INK });
  return pic;
}

const CAST_CAM = { eye: [0.0, 7.8, 2.4] as V, look: [-0.2, 0, 0.6] as V, fov: 0.76 };

/** Where a point lands across the screen for a camera (for labels). */
function project(eye: V, look: V, p: V, fov = CAST_CAM.fov): number {
  const fw = norm(sub(look, eye));
  const right = norm(cross(fw, [0, 0, 1]));
  const d = sub(p, eye);
  const f = H / 2 / Math.tan(fov / 2);
  return W / 2 + (dot(d, right) * f) / dot(d, fw);
}

/** The cast, under Doc Leo's spotlight. */
export function castPicture(labels = true): Picture {
  // seen from the south (+y), so east is on the left: THE CHEZ at the east end, nose first
  const shapes: Shape[] = [
    floor(),
    ...citicar(0, 0, 1.3, [1.7, -0.9, 0]),
    ...place(C.teddy(2), 0.65, 1.0, 1.8, 0.3),
    ...place(C.gwinn(2), -0.65, 0.9, 1.8, -0.1),
    ...place(C.docLeo(0), -2.0, 0.5, 2.0, -0.2),
    ...ray(-3.25, 1.1, 1.0),
  ];
  const world = stage(shapes, { points: [{ at: [0.5, 3, 5], color: rgb(255, 240, 210), radius: 0.3, reach: 6 }], keyColor: rgb(120, 120, 150) });
  const pic = still(world, cam(CAST_CAM.eye, CAST_CAM.look, CAST_CAM.fov), 4, 20, 5);
  bloom(pic, 0.9, 2.5, 0.5);
  if (!labels) return pic;
  centered(pic, 8, 'THE CAST', WHITE, 2, { outline: INK });
  const names: [V, string][] = [
    [[-3.25, 1.1, 0], 'RAY'],
    [[-2.0, 0.5, 0], 'DOC LEO'],
    [[-0.65, 0.9, 0], 'GWINN'],
    [[0.65, 1.0, 0], 'TEDDY'],
    [[3.0, -0.5, 0], 'THE CHEZ'],
  ];
  const c = CAST_CAM;
  // each name under its actor, pushed apart where two would run together (Gwinn stands close to Doc Leo)
  const at = names.map(([p, s]) => ({ s, x: Math.round(project(c.eye, c.look, p) - s.length * 4) })).sort((a, b) => a.x - b.x);
  for (let i = 1; i < at.length; i++) at[i].x = Math.max(at[i].x, at[i - 1].x + at[i - 1].s.length * 8 + 8);
  const over = Math.max(0, at[at.length - 1].x + at[at.length - 1].s.length * 8 - 316);
  for (const l of at) text(pic, l.x - over, 186, l.s, rgb(255, 230, 160), 1, { outline: INK });
  return pic;
}

/** The background for credits pages: Doc Leo's spotlight on an empty checkerboard. */
export function creditsBackground(): Picture {
  const shapes: Shape[] = [floor(), ...props([0, 2, 0], 1), ...ray(0.5, -1, 1.2)];
  const world = stage(shapes, { points: [{ at: [0.5, -1, 6], color: rgb(255, 230, 200), radius: 0.4, reach: 7 }], keyColor: rgb(80, 80, 120) });
  return textPage(still(world, cam([0.5, -9, 3.2], [0.5, 0, 0.8], 0.8), 4, 16, 6));
}

/** The background for the instructions' pages. */
export function howtoBackground(): Picture {
  const shapes: Shape[] = [floor(), ...wallRow('checker', -6, 6, 2), ...ray(-1.5, -1), cube(1, -1, nearCube), cube(2, -1, farCube)];
  return textPage(still(stage(shapes), cam([0, -8, 4], [0, 0, 0.5], 0.8), 4, 16, 8));
}

/** High scores: PLAYGAME writes the title in red at the top and the scores in blue below. */
export function hiscorePicture(): Picture {
  const shapes: Shape[] = [floor(), logoShapes([0, 6, 3.2], 0.8)];
  const pic = still(stage(shapes, { env: SKY }), cam([0, -6, 3], [0, 0, 1.6], 0.9), 4, 16, 9);
  panel(pic, 10, 0, 310, 12, rgb(255, 255, 255), 0.97);
  panel(pic, 10, 22, 310, 200, rgb(246, 248, 255), 0.94, rgb(255, 255, 255));
  return pic;
}

/**
 * Load and save: PLAYGAME lists the save names in yellow from (80, 40) with its red marker at
 * x 60, and writes its blue message at y 185: smoked glass under the names and marker,
 * frosted glass under the message (kit/saveSlots.ts).
 */
export function savePicture(word: string): Picture {
  const shapes: Shape[] = [floor(), ...ray(-2.4, -1.4, 1.4)];
  const pic = still(stage(shapes), cam([0, -7, 3.4], [0, 0, 0.5], 0.85), 4, 16, 10);
  panel(pic, 50, 30, 300, 178, rgb(8, 6, 28), 0.92, rgb(120, 220, 255));
  panel(pic, STATUS.x, STATUS.y, STATUS.x + STATUS.w, STATUS.y + STATUS.h, rgb(236, 240, 255), 0.93, rgb(255, 255, 255));
  centered(pic, 8, word, WHITE, 2, { outline: INK });
  return pic;
}

/** Out of light: Ray falling apart into a wireframe. */
export function lostPicture(): Picture {
  const shapes: Shape[] = [floor(), ...place(rayDeath(2), 0, 0, 2.6), ...place(rayDeath(4), -2.4, -1.6, 1.6)];
  const pic = still(stage(shapes, { keyColor: rgb(120, 120, 160) }), cam([0.3, -6, 2.4], [0, 0, 0.8], 0.8), 4, 16, 12);
  bloom(pic, 0.8, 3, 0.7);
  centered(pic, 14, 'OUT OF LIGHT', rgb(255, 120, 120), 3, { outline: INK });
  centered(pic, 176, 'The render stopped at 99%.', WHITE, 1, { outline: INK });
  return pic;
}

/** The felt egg on its pedestal behind the two-way mirror, then frosted for its pages. */
export function eggPicture(): Picture {
  const shapes: Shape[] = [
    floor({ ...THEMES.mirror.floor }),
    eggShape(0, 0, 1.25, 4),
    new Cylinder(0, 0, 0.6, 0, 0.35, MAT.marble(rgb(240, 236, 244), rgb(120, 110, 150))),
    ...[-1, 1].map((k) => cube(k * 2.2 - 0.5, -1.2, { ...MAT.chrome }, { h: 2 })),
  ];
  const world = stage(shapes, {
    env: THEMES.mirror.env,
    points: [{ at: [0.6, -2, 5], color: rgb(255, 245, 220), radius: 0.3, reach: 6 }],
    keyColor: rgb(110, 100, 150),
  });
  const pic = still(world, cam([0, 6, 2.6], [0, 0, 1.0], 0.75), 6, 30, 13);
  bloom(pic, 0.85, 3, 0.6);
  flare(pic, 186, 54, 0.45);
  return pic;
}
