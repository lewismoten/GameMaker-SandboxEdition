// The Beltway's cab around the windshield (painted into cab.ts's seat): the two doors seen as
// walls at angles (their windows trapezoids that converge toward the windshield, the sill and top
// frame along them), the roadside racing past the passenger's window, the wood-grain dash with its
// row of switches, and the bench seat Teddy sits on. Fixed scenery, except that roadside's phases.
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Kit } from '../blocks/common';

/** The door window's roadside racing past to the right: `phase` pixels along its 20 px pattern, a tree then a pole.
 * The horizon is at eye level (y 60, like the windshield's), so the far trees and poles rise through one row of blocks. */
function outside(k: Kit, p: Pixels, x: number, y: number, w: number, h: number, phase = 0): void {
  const { c, R } = k;
  gradient(p, x, y, w, h, R('sky'), 3, 6);
  const ground = y + Math.round(h / 2);
  p.rect(x, ground, w, y + h - ground, c('grass', 2)).rect(x, ground - 4, w, 4, c('leaf', 1));
  for (let tx = x + (phase % 20) - 20; tx < x + w + 20; tx += 20) {
    p.rect(tx + 5, ground - 10, 3, 10, c('wood', 1))
      .disc(tx + 6, ground - 14, 6, c('leaf', 2))
      .disc(tx + 4, ground - 16, 3, c('leaf', 3));
    p.rect(tx + 17, ground - 19, 2, 19, c('ink', 1)).rect(tx + 14, ground - 17, 8, 2, c('ink', 1));
  }
}

/** The door window's roadside: pixels a tick and ticks in a lap, and the cells (x, y) that race (above Teddy's head). */
export const DOOR = {
  step: 5,
  phases: 4,
  cells: [
    [13, 2],
    [14, 2],
    [15, 2],
  ],
} as const;

/** A wall seen at an angle: its window is a trapezoid from the near edge (x0, tall) to the far edge (x1). */
interface Wall {
  x0: number;
  x1: number;
  top: [number, number];
  bottom: [number, number];
}
const lerp = (w: Wall, v: [number, number], x: number) => Math.round(v[0] + ((v[1] - v[0]) * (x - w.x0)) / (w.x1 - w.x0));

/** The window's glass (the roadside clipped to the trapezoid), its frame along the top and the chrome sill, per column. */
function window(k: Kit, p: Pixels, w: Wall, phase: number): void {
  const { c } = k;
  const [lo, hi] = [Math.min(w.x0, w.x1), Math.max(w.x0, w.x1)];
  const view = new Pixels(hi - lo, 120);
  outside(k, view, 0, 0, hi - lo, 120, phase);
  for (let x = lo; x < hi; x++) {
    const [t, b] = [lerp(w, w.top, x), lerp(w, w.bottom, x)];
    p.rect(x, t - 4, 1, 4, c('wall', 0)).rect(x, t - 4, 1, 1, c('wall', 3));
    for (let y = t; y < b; y++) p.set(x, y, view.get(x - lo, y));
    p.rect(x, b, 1, 4, c('metal', 2)).set(x, b, c('metal', 4));
  }
}

/** The two side windows and doors, the headliner's fittings: seen at angles, like walls of a box. */
export function sides(k: Kit, p: Pixels, phase = 0): void {
  const { c } = k;
  // the driver's door: a wall running off to the left, its window a trapezoid narrowing toward the A-pillar
  p.rect(0, 20, 40, 180, c('wall', 1));
  window(k, p, { x0: 0, x1: 26, top: [24, 42], bottom: [98, 88] }, 0);
  // the passenger's door: a wall running from the camera at the right edge toward the windshield; the window is a trapezoid,
  // taller at the right edge, its top frame and chrome sill converging toward the windshield
  p.rect(256, 20, 64, 180, c('wall', 3)).rect(256, 20, 4, 180, c('wall', 0)).rect(260, 20, 1, 180, c('wall', 4));
  window(k, p, { x0: 260, x1: 320, top: [40, 24], bottom: [84, 112] }, phase);
}

/** The dash's face: black pad, then wood-grain with the row of switches (the instruments are drawn over it). */
export function dashFace(k: Kit, p: Pixels): void {
  const { c } = k;
  p.rect(0, 100, 260, 4, c('wall', 0)).rect(0, 100, 260, 2, c('wall', 3)).rect(0, 102, 260, 1, c('wall', 4));
  for (let y = 104; y < 180; y++)
    for (let x = 40; x < 260; x++) {
      // periodic over a block, so the grain's cells share blocks (the scene has 150 backgrounds)
      const v = Math.sin(((y * 4 + Math.sin((x * Math.PI) / 10) * 5 + Math.sin((y * Math.PI) / 10) * 3) * Math.PI) / 10);
      p.set(x, y, c('wood', v > 0.86 ? 3 : v < -0.8 ? 1 : 2));
    }
  p.rect(40, 180, 220, 20, c('wall', 0));
  // the row of switches under the gauges: a black plate and two toggles in each block of it
  for (const x of [40, 60, 80]) {
    p.rect(x, 143, 20, 14, c('wall', 0)).rect(x, 143, 20, 1, c('mach', 0)).rect(x, 156, 20, 1, c('mach', 0));
    for (const [dx, up] of [
      [4, true],
      [12, false],
    ] as const)
      p.rect(x + dx, 146, 4, 8, c('mach', 1)).rect(x + dx, up ? 146 : 150, 4, 4, c('metal', 4));
  }
}

/** The bench seat's cushion in front of the passenger door, red piping along its edge. */
export function bench(k: Kit, p: Pixels): void {
  const { c } = k;
  p.rect(200, 140, 120, 60, c('wall', 3)).rect(200, 140, 120, 3, c('wall', 4)).rect(200, 143, 120, 1, c('red', 1));
}
