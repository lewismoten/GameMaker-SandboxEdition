// The Heraldry Egg: forest-green felt quartered in gold diamonds like a herald's coat, a silver
// felt sword laid over a scrap of treasure map, and a road of brown backstitch winding all the
// way round the shell. Painted at any size: 20x20 for the block, bigger for the screens.
import { Canvas, type RGB, mix, clamp01, hex, tnoise } from './rgb';

const FELT = hex('#2f5d3a');
const GOLD = hex('#d8b04a');
const SILVER = hex('#c9ced6');
const THREAD = hex('#f4e7c0');
const ROAD: RGB = [120, 76, 40];

/** Paints the egg centered at (cx, cy) with height h onto the canvas. */
export function paintEgg(cv: Canvas, cx: number, cy: number, h: number): void {
  const rx = h * 0.38;
  const ry = h * 0.5;
  const s = h / 16;
  const inside = (x: number, y: number) => {
    // an egg: narrower at the top
    const v = (y - cy) / ry;
    const k = 1 - 0.18 * (v < 0 ? -v : -v * 0.3);
    return Math.hypot((x - cx) / (rx * k), v) - 1;
  };
  cv.ellipse(cx + s, cy + ry * 0.92, rx * 0.95, ry * 0.18, [24, 20, 16]);
  cv.fillSdf(
    (x, y) => inside(x, y) * Math.min(rx, ry),
    (x, y) => {
      const u = (x - cx) / rx;
      const v = (y - cy) / ry;
      // the herald's quartering: gold diamonds on green
      const dx = Math.abs((((x - cx) / (3.2 * s) + 100.5) % 1) - 0.5);
      const dy = Math.abs((((y - cy) / (3.2 * s) + 100.5) % 1) - 0.5);
      let c = dx + dy < 0.22 ? GOLD : FELT;
      // felt fuzz and the round shading of the shell
      const fuzz = tnoise(x * 3, y * 3, 2.5, 20, 7) * 0.18;
      const lit = clamp01(0.75 - u * 0.35 - v * 0.4 + fuzz);
      c = mix(mix(c, [0, 0, 0], 0.45), mix(c, [255, 255, 255], 0.15), lit);
      // the backstitched road winding round the middle
      const road = v - 0.12 * Math.sin(u * 5.5);
      if (Math.abs(road - 0.05) < 0.07 && Math.floor((x - cx) / (1.4 * s)) % 2 === 0) c = ROAD;
      return c;
    },
  );
  // the map scrap and the sword laid over it
  cv.poly(
    [
      [cx - rx * 0.55, cy - ry * 0.15],
      [cx + rx * 0.35, cy - ry * 0.35],
      [cx + rx * 0.5, cy + ry * 0.35],
      [cx - rx * 0.4, cy + ry * 0.45],
    ],
    (_x, y) => mix([220, 196, 140], [190, 160, 104], clamp01((y - cy) / ry + 0.4)),
  );
  cv.line(cx - rx * 0.3, cy + ry * 0.2, cx + rx * 0.15, cy - ry * 0.05, 0.5 * s, [170, 40, 30]);
  cv.line(cx - rx * 0.5, cy + ry * 0.55, cx + rx * 0.5, cy - ry * 0.6, 1.1 * s, SILVER);
  cv.line(cx - rx * 0.55, cy + ry * 0.12, cx - rx * 0.05, cy + ry * 0.42, 0.9 * s, GOLD);
  cv.disc(cx - rx * 0.55, cy + ry * 0.6, 0.8 * s, GOLD);
  void THREAD;
}

/** The 20x20 egg block: the egg in a little straw nest on the ground (`ground` paints under it). */
export function eggBlock(ground: (x: number, y: number) => RGB): Canvas {
  const cv = new Canvas(20, 20).shade(ground, 2);
  cv.ellipse(10, 16, 8, 3.2, [120, 92, 40]);
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    cv.line(10 + Math.cos(a) * 7, 16 + Math.sin(a) * 2.6, 10 + Math.cos(a + 0.9) * 5, 16 + Math.sin(a + 0.9) * 2, 0.6, k % 2 ? [214, 180, 96] : [168, 132, 60]);
  }
  paintEgg(cv, 10, 9.5, 14);
  return cv;
}

/** The empty nest it sits in. */
export function nestBlock(ground: (x: number, y: number) => RGB): Canvas {
  const cv = new Canvas(20, 20).shade(ground, 2);
  cv.ellipse(10, 15, 8, 3.6, [120, 92, 40]);
  cv.ellipse(10, 14.6, 5.4, 2, [70, 52, 24]);
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    cv.line(
      10 + Math.cos(a) * 7,
      15 + Math.sin(a) * 2.8,
      10 + Math.cos(a + 0.9) * 5,
      15 + Math.sin(a + 0.9) * 2.2,
      0.6,
      k % 2 ? [214, 180, 96] : [168, 132, 60],
    );
  }
  return cv;
}
