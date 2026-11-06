// The leaves' pictures. A leaf is drawn from a shape in its own flat space (u along the middle vein from the stem at -1
// to the tip at +1, v across it), then turned for each frame of its tumble: spun round in the picture (`spin`), turned
// over about its vein so it looks thinner and shows its paler back (`flip`), and tipped toward or away (`tip`). Each
// half of a leaf is folded up a little at the vein, so one half catches the light and the other is in shade: that is
// what makes a flat picture look like a leaf turning in the air.
//
//   maple   big, five points, crimson to scarlet          8 frames of a tumble + a leaf lying on the grass
//   oak     long, round lobes, burnt orange               (the same)
//   birch   small, a drop with a point, butter yellow     (the same)
//
// Every picture is 20x20 with color 255 clear, as a monster's picture must be.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { RAMP, type Kind } from './palette';

const T = 255;

/** A leaf's flat shape: is (u, v) inside it? */
type Shape = (u: number, v: number) => boolean;

/** How big each kind is: half its length in pixels (stem not counted), whether its middle vein is drawn, how long its stem is
 * (in halves) and where the stem joins (u). */
export const SIZE: Record<Kind, { half: number; vein: boolean; stem: number; base: number }> = {
  maple: { half: 7.6, vein: true, stem: 0.42, base: -0.62 },
  oak: { half: 7.6, vein: true, stem: 0.3, base: -1 },
  birch: { half: 4.8, vein: false, stem: 0.5, base: -1 },
};

/** The maple: five pointed lobes round a middle a little below the leaf's center, toothed. */
function maple(u: number, v: number): boolean {
  const x = v;
  const y = u + 0.18;
  const r = Math.hypot(x, y);
  const a = Math.atan2(x, y); // 0 toward the tip
  const lobes: [number, number, number][] = [
    [0, 1.0, 0.62],
    [1.08, 0.94, 0.56],
    [-1.08, 0.94, 0.56],
    [2.15, 0.64, 0.46],
    [-2.15, 0.64, 0.46],
  ];
  const body = 0.5;
  let reach = body;
  for (const [c, len, w] of lobes) {
    const d = Math.abs(a - c);
    if (d < w) reach = Math.max(reach, body + (len - body) * Math.pow(1 - d / w, 0.9));
  }
  reach *= 1 + 0.08 * Math.cos(a * 15);
  return r <= reach * 1.04;
}

/** The oak: long, widest above the middle, with three round lobes each side. */
function oak(u: number, v: number): boolean {
  if (u < -1 || u > 1) return false;
  const env = Math.sqrt(Math.max(0, 1 - u * u)) * (0.92 + 0.22 * u);
  const lobe = 0.42 + 0.58 * Math.pow(Math.abs(Math.cos(Math.PI * 1.55 * (u + 0.12))), 0.5);
  return Math.abs(v) <= 0.64 * env * lobe;
}

/** The birch: a drop with a point at the tip and fine teeth. */
function birch(u: number, v: number): boolean {
  if (u < -1 || u > 1) return false;
  let w = 0.66 * Math.pow(1 - u, 0.8) * Math.pow(1 + u, 0.5);
  if (Math.floor((u + 1) * 5) % 2) w *= 0.92;
  return Math.abs(v) <= w;
}

const SHAPES: Record<Kind, Shape> = { maple, oak, birch };

/** One pose of a leaf in the air. Angles in radians; `flip` 0 is face up, pi is its back. */
export interface Pose {
  spin: number;
  flip: number;
  tip: number;
}

/** The eight poses of a tumble: a full spin with a full turn over, and a little tip on the way. The turn over starts a
 * little past flat, so no frame is exactly edge on (a leaf seen edge on is a line, and a line looks like a stick). */
export const TUMBLE: Pose[] = Array.from({ length: 8 }, (_, k) => ({
  spin: 0.35 + (k * Math.PI) / 4,
  flip: 0.35 + (k * Math.PI) / 4,
  tip: 0.45 * Math.abs(Math.sin((k * Math.PI) / 4)),
}));

/** The light comes from the upper left and a little in front. */
const LIGHT = (() => {
  const l = [-0.55, -0.65, 0.75];
  const n = Math.hypot(...l);
  return l.map((x) => x / n);
})();

/** A leaf of `kind` in pose `p`, centered in a 20x20 picture with clear pixels round it. */
export function leafPicture(pal: Pal, kind: Kind, p: Pose): Pixels {
  const ramp = pal.r(RAMP[kind]);
  const { half, vein, stem, base } = SIZE[kind];
  const shape = SHAPES[kind];
  const cf = Math.cos(p.flip);
  const sf = Math.sin(p.flip);
  const ct = Math.cos(p.tip);
  // how thin the leaf looks across; seen nearly edge on it is drawn as a line along its vein instead
  const across = Math.max(Math.abs(cf), 0.05);
  const edgeOn = Math.abs(cf) < 0.3;
  const dirU: [number, number] = [Math.sin(p.spin), -Math.cos(p.spin)]; // toward the tip, on the screen
  const dirV: [number, number] = [Math.cos(p.spin), Math.sin(p.spin)];
  const cx = 9.5;
  const cy = 9.5 + 0.1 * half; // a little low, so the stem fits above or below
  const inside = (x: number, y: number) => {
    const px = x - cx;
    const py = y - cy;
    const u = (px * dirU[0] + py * dirU[1]) / (half * ct);
    const v = (px * dirV[0] + py * dirV[1]) / (half * across);
    return { u, v, in: shape(u, v) };
  };
  const pic = new Pixels(20, 20, T);
  const isIn: boolean[] = [];
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) isIn.push(inside(x, y).in);
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < 20 && y < 20 && isIn[y * 20 + x];
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!at(x, y) || edgeOn) continue;
      const { u, v } = inside(x, y);
      const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      if (edge) {
        pic.set(x, y, ramp[0]);
        continue;
      }
      // the half's normal: the leaf's (turned over by flip) folded up 25 degrees toward the vein
      const fold = (v < 0 ? -1 : 1) * 0.42;
      const nLeaf = [Math.sin(fold), 0, Math.cos(fold)]; // in leaf space: x across, y along, z up
      // turn over about the vein (the leaf's y axis), then onto the screen with the spin
      const nx = nLeaf[0] * cf + nLeaf[2] * sf;
      const nz = -nLeaf[0] * sf + nLeaf[2] * cf;
      const sx = nx * dirV[0];
      const sy = nx * dirV[1];
      const facing = nz >= 0 ? 1 : -1; // the side we see faces us
      const lit = (sx * LIGHT[0] + sy * LIGHT[1]) * facing + Math.abs(nz) * LIGHT[2];
      const back = cf < 0;
      let shade = lit > 0.86 ? 4 : lit > 0.62 ? 3 : lit > 0.3 ? 2 : 1;
      if (back) shade = Math.max(1, shade - 1);
      if (vein && Math.abs(v * across * half) < 0.55 && u > -0.95 && u < 0.8 && across > 0.3) shade = Math.max(1, shade - 2);
      pic.set(x, y, ramp[shade]);
    }
  // seen edge on: a line from the stem's end to the tip, the lit edge on top
  const along = (t: number): [number, number] => [Math.floor(cx + dirU[0] * t * half * ct), Math.floor(cy + dirU[1] * t * half * ct)];
  if (edgeOn)
    for (let t = base; t <= 1; t += 0.04) {
      const [x, y] = along(t);
      if (x >= 0 && y >= 0 && x < 20 && y < 20) pic.set(x, y, t > 0.2 || base > -0.9 ? ramp[cf >= 0 ? 2 : 1] : ramp[1]);
    }
  // the stem: a short dark line out of the leaf's base
  const stemColor = pal.c('dirt', 0);
  for (let t = base; t >= base - stem; t -= 0.04) {
    const [x, y] = along(t);
    if (x >= 0 && y >= 0 && x < 20 && y < 20 && pic.get(x, y) === T) pic.set(x, y, stemColor);
  }
  return pic;
}

/** A leaf lying on the grass: flat, seen from the side so it is short and wide, at the bottom of its picture. */
export function restingPicture(pal: Pal, kind: Kind): Pixels {
  const ramp = pal.r(RAMP[kind]);
  const { half } = SIZE[kind];
  const pic = new Pixels(20, 20, T);
  const w = Math.round(half * 1.5);
  const x0 = 10 - Math.ceil(w / 2);
  // a lens two pixels high with a curl at one end, its underside in shade
  for (let x = 0; x < w; x++) {
    const tall = x === 0 || x === w - 1 ? 1 : 2;
    for (let k = 0; k < tall; k++) pic.set(x0 + x, 19 - k, k === 0 ? ramp[1] : ramp[x < w / 2 ? 3 : 2]);
  }
  pic.set(x0 + w, 18, ramp[2]).set(x0 + w + 1, 17, ramp[3]); // the tip curls up off the grass
  pic.set(x0 - 1, 19, pal.c('dirt', 0)); // the stem
  return pic;
}
