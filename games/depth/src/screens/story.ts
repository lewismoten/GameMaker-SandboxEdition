// The storyline: four rendered slides with a caption under each, then the ending's slides.
import { bloom, flare, type Picture } from '../render/image';
import { MAT, studio } from '../render/look';
import { Box, Cylinder, Sphere, hull, mix, rgb, type Material, type Shape, type V } from '../render/tracer';
import * as C from '../models/cast';
import { rayModel } from '../models/ray';
import { FAR_COL, LENS_COL, NEAR_COL, cube } from '../tiles/cells';
import { centered, panel } from './draw';
import { place } from './pictures';
import { cam, floor, glowMat, props, stage, still, H, W } from './stage';

const INK: V = rgb(16, 12, 40);

/** A caption: up to four lines in a smoked band at the bottom. */
export function caption(pic: Picture, lines: string[], color: V = rgb(255, 255, 255)): Picture {
  for (const l of lines) if (l.length > 39) throw new Error(`Caption line over 39 columns: "${l}"`);
  const top = H - 8 - lines.length * 10;
  panel(pic, 0, top - 4, W, H, rgb(8, 6, 26), 0.72);
  lines.forEach((l, i) => centered(pic, top + i * 10, l, color, 1, { outline: INK }));
  return pic;
}

/** A material showing a picture on a flat screen facing -y (x across, z up). */
function screenMat(img: Picture, x0: number, x1: number, z0: number, z1: number): Material {
  return {
    color: (p) => {
      const u = (p[0] - x0) / (x1 - x0);
      const v = (z1 - p[2]) / (z1 - z0);
      if (u < 0 || u > 1 || v < 0 || v > 1) return rgb(30, 30, 34);
      const sx = Math.min(img.w - 1, Math.floor(u * img.w));
      const sy = Math.min(img.h - 1, Math.floor(v * img.h));
      const i = (sy * img.w + sx) * 3;
      // scanlines
      const k = sy % 2 ? 0.8 : 1;
      return [img.rgb[i] * k, img.rgb[i + 1] * k, img.rgb[i + 2] * k];
    },
    diffuse: 0.15,
    reflect: 0.08,
    fresnel: 0.3,
    spec: 1.2,
    shine: 120,
    emit: [0.85, 0.85, 0.85],
  };
}

/** 3 AM at Sandbox Software: the render on the monitor, 99% done. */
function slide1(render: Picture): Picture {
  // a copy of the render with a progress bar at 99%
  const shown: Picture = { w: render.w, h: render.h, rgb: render.rgb.slice() };
  panel(shown, 40, 170, 280, 184, rgb(10, 10, 20), 0.85);
  panel(shown, 42, 172, 42 + Math.round(236 * 0.99), 182, rgb(80, 220, 120), 1);
  const beige: Material = { color: rgb(214, 204, 180), diffuse: 0.95, spec: 0.4, shine: 30 };
  const desk: Material = MAT.marble(rgb(70, 50, 40), rgb(120, 90, 70));
  const sx0 = -1.15;
  const sx1 = 1.15;
  const sz0 = 1.25;
  const sz1 = 2.7;
  const shapes: Shape[] = [
    new Box([-6, -2, 0.9], [6, 4, 1.0], desk),
    new Box([-1.45, 0, 1.05], [1.45, 2.4, 2.95], beige), // the monitor
    new Box([sx0, -0.02, sz0], [sx1, 0.02, sz1], screenMat(shown, sx0, sx1, sz0, sz1)),
    new Box([-0.8, 0.2, 1.0], [0.8, 1.8, 1.05], beige),
    new Box([-1.9, -1.6, 1.0], [1.2, -0.6, 1.12], beige), // keyboard
    new Cylinder(2.2, -0.9, 0.28, 1.0, 1.65, { color: rgb(240, 240, 235), diffuse: 0.9, spec: 0.8, shine: 50 }), // the mug
    new Cylinder(2.2, -0.9, 0.24, 1.55, 1.62, { color: rgb(60, 30, 15), diffuse: 0.6, spec: 1, shine: 80 }),
    new Box([-3.2, -1.3, 1.0], [-2.3, -0.4, 1.03], { color: rgb(40, 40, 60), diffuse: 0.8, spec: 0.6, shine: 40 }), // a floppy
    new Box([-3.0, -1.0, 1.03], [-2.5, -0.6, 1.035], { color: rgb(200, 200, 210), diffuse: 0.9 }),
  ];
  const world = stage(shapes, {
    env: (d) => studio(d, { top: rgb(10, 10, 30), horizon: rgb(40, 30, 60), floor: rgb(5, 5, 10), boxes: false }),
    backdrop: () => rgb(8, 8, 20),
    keyColor: rgb(60, 60, 90),
    sky: rgb(20, 20, 40),
    ground: rgb(10, 8, 14),
    // Doc Leo's spotlight, left on
    points: [{ at: [-3, -4, 5], color: rgb(255, 230, 190), radius: 0.3, reach: 7 }],
    fog: { color: rgb(0, 0, 0), scale: 400 },
  });
  const pic = still(world, cam([0.6, -6.5, 2.6], [0.2, 0, 1.8], 0.8), 4, 20, 41);
  bloom(pic, 0.8, 3, 0.6);
  return caption(pic, ['3:00 AM at Sandbox Software. The render', 'of the century, the box art for DEPTH', 'PERCEPTION, is 99% done. Everybody', 'went home. Doc Leo left the light on.']);
}

/** Count Polygon in the render, the props going low-poly. */
function slide2(): Picture {
  const gold = hull(
    (() => {
      const pts: V[] = [];
      for (let k = 0; k < 8; k++) for (const z of [-1, 1]) pts.push([-2.4 + Math.cos((k * Math.PI) / 4) * 0.5, 0.8 + Math.sin((k * Math.PI) / 4) * 0.5, 2.05 + z * 0.4]);
      return pts;
    })(),
    MAT.gold,
  );
  const shapes: Shape[] = [floor(), gold, cube(-0.5, 0.5, { color: rgb(220, 40, 50), diffuse: 0.9, spec: 0.8, shine: 50 }, { h: 1, round: 0 }), ...place(C.count(0, 1), 0.6, -0.6, 4.5, Math.PI, 0.6), new Sphere([2.6, 0.4, 0.5], 0.5, MAT.chrome)];
  const world = stage(shapes, { keyColor: rgb(200, 160, 255), env: (d) => studio(d, { top: rgb(40, 10, 60), horizon: rgb(200, 90, 160) }) });
  const pic = still(world, cam([0.4, -7, 2.4], [0.4, 0, 1.4], 0.8), 4, 20, 42);
  bloom(pic, 0.9, 2.5, 0.5);
  return caption(pic, ['Then COUNT POLYGON crept in through', 'the modem and started stealing', 'polygons. Spheres went octagonal.', 'The teapot went square.'], rgb(255, 200, 255));
}

/** Ray, close up, every polygon still his. */
function slide3(): Picture {
  const shapes: Shape[] = [floor(), ...rayModel('y', 0.4, NEAR_COL, [0, 0, 1.2], 1.2), ...props([0, 5, 0], 1.2)];
  const world = stage(shapes, { env: (d) => studio(d, { top: rgb(90, 120, 210), horizon: rgb(255, 214, 180) }) });
  const pic = still(world, cam([0.8, -5, 2.0], [0, 0, 1.15], 0.75), 4, 20, 43);
  flare(pic, 128, 58, 0.5);
  return caption(pic, ['He missed one. RAY, the chrome sphere', 'from every ray tracing demo ever made,', 'still had every polygon. And a job to', 'finish by morning.']);
}

/** Two planes, three lenses. */
function slide4(): Picture {
  const lens = (x: number, c: 'R' | 'G' | 'B') =>
    new Sphere([x, 0, 1.6], 0.55, { color: LENS_COL[c], diffuse: 0.3, spec: 1.5, shine: 140, glass: { ior: 1.4, tint: mix(LENS_COL[c], [1, 1, 1], 0.4) }, emit: [LENS_COL[c][0] * 0.3, LENS_COL[c][1] * 0.3, LENS_COL[c][2] * 0.3] });
  const near: Material = { color: NEAR_COL, diffuse: 0.85, spec: 1, shine: 70 };
  const far: Material = { color: FAR_COL, diffuse: 0.8, spec: 1.2, shine: 90 };
  const shapes: Shape[] = [floor(), lens(-1.6, 'R'), lens(0, 'G'), lens(1.6, 'B'), cube(-3.2, -1.5, near), cube(-2.2, -1.5, near), cube(2.2, -6, far, { h: 1.5 }), cube(3.2, -6, far, { h: 1.5 })];
  const world = stage(shapes);
  const pic = still(world, cam([0, 6.5, 2.4], [0, 0, 1.0], 0.8, { aperture: 0.18, focus: 6.8 }), 8, 40, 44);
  bloom(pic, 0.9, 2.5, 0.5);
  return caption(pic, ['Six scenes, two planes each: sharp is', "solid, a blur isn't there. Find the", 'red, green and blue lenses, and get', 'Ray to every vanishing point.']);
}

export function storyPictures(render: Picture): Picture[] {
  return [slide1(render), slide2(), slide3(), slide4()];
}

/** The ending's slide after the cartoon. */
export function wonPicture(cast: Picture): Picture {
  const pic: Picture = { w: W, h: H, rgb: cast.rgb.slice() };
  return caption(pic, ['The box art went to the printer at 9.', 'Count Polygon is a single pixel now,', 'somewhere in the corner of the box.', 'Thanks for playing!'], rgb(255, 230, 160));
}

export { glowMat };
