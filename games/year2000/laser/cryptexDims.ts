// "In The Year 2000!" cryptex: the measurements (millimeters, 3 mm plywood) and the lock check. The kit stands on its end:
// a square base with four pocket plates, four rings that step up like a pyramid (the biggest at the bottom, so every ring
// shows its own band of digits), and a hollow core that goes down the middle. The core's lower end carries a ridge that
// waits in the base's pocket, just under the stack. To pull the core out, the ridge has to pass up through a notch in each
// ring's inner washer, so all four notches must be at the marker. The notches' places are set by how the washers are seated.
import { offsetPoly, rotate } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';

export const T = 3; // plywood thickness
export const DIGITS = 10;
export const STEP = 360 / DIGITS; // degrees between digits
export const COMBO = [2, 0, 0, 0]; // the year the game is named for, read from the inner ring out
export const CORE = { r: 12, ridgeHw: 2, ridgeOut: 14.5, bore: 7.5, ridgeSlices: 3, roundSlices: 9 };
/** The washer's hole: a round bore with one notch. The pocket hole in the base is the same with a snugger notch. */
export const WASHER = { bore: 12.3, notchHw: 3.5, notchOut: 14.9, apothem: 18 };
export const POCKET = { bore: 12.3, notchHw: 2.3, notchOut: 14.9, plates: 4 };
export const SOCKET_FIT = 0.15; // the ring's socket is this much bigger than the washer, per side
export const RINGS = [28, 35, 42, 49]; // outer radii, inner ring first (it sits on top)
export const SLICES_PER_RING = 2;
export const HEAD_R = 20;
export const LID = { r: 14, plug: 7.35 };
export const BASE = 114; // the square base
export const PX = 0.5; // millimeters per font pixel for the digits (3.5 mm capitals)

/** The middle of the digit band of ring `k` (the exposed step of the pyramid). */
export const digitRadius = (k: number) => (k === 0 ? 24.3 : (RINGS[k - 1] + RINGS[k]) / 2);

const ARC = 120;
/** A round hole or core of radius `r` with one rectangular lug/notch along +x (half width `hw`, out to `out`). */
export function lugShape(r: number, hw: number, out: number): Pt[] {
  const a = Math.asin(hw / r);
  const pts: Pt[] = [
    [out, -hw],
    [out, hw],
  ];
  const n = Math.round((ARC * (2 * Math.PI - 2 * a)) / (2 * Math.PI));
  for (let i = 0; i <= n; i++) {
    const th = a + ((2 * Math.PI - 2 * a) * i) / n;
    pts.push([r * Math.cos(th), r * Math.sin(th)]);
  }
  return pts;
}

/** A regular decagon with a flat centered on +x (so a flat lies under every digit). */
export function decagon(apothem: number): Pt[] {
  const R = apothem / Math.cos(Math.PI / DIGITS);
  return Array.from({ length: DIGITS }, (_, j) => {
    const th = (Math.PI / DIGITS) * (2 * j + 1);
    return [R * Math.cos(th), R * Math.sin(th)] as Pt;
  });
}

export const coreShape = () => lugShape(CORE.r, CORE.ridgeHw, CORE.ridgeOut);
export const washerHole = () => lugShape(WASHER.bore, WASHER.notchHw, WASHER.notchOut);
export const pocketHole = () => lugShape(POCKET.bore, POCKET.notchHw, POCKET.notchOut);

function inside(p: Pt, poly: readonly Pt[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Sample points that stand for the core's shape: its outline every ~0.1 mm and an interior grid. */
function samples(poly: readonly Pt[], grid: number): Pt[] {
  const out: Pt[] = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.1));
    for (let s = 0; s < n; s++) out.push([p[0] + ((q[0] - p[0]) * s) / n, p[1] + ((q[1] - p[1]) * s) / n]);
  });
  for (let x = -16; x <= 16; x += grid) for (let y = -16; y <= 16; y += grid) if (inside([x, y], poly)) out.push([x, y]);
  return out;
}

export interface Lock {
  /** the combinations (of ten to the fourth) that free the core when every ring stands exactly on its digit */
  opens: string[];
  /** the core fits the base's pocket */
  pocketFits: boolean;
  /** how far (degrees, either way) a ring may be off its notch and the core still passes */
  windowDeg: number;
  /** the play between a washer and its ring's socket per side, and between the core and the washer's bore, millimeters */
  fits: { washerInSocket: number; coreInBore: number };
  /** the next digit over (36 degrees away) never lets the core pass */
  wrongDigitBlocked: boolean;
}

/** Plays the lock on the real cut shapes. `declared` is the kerf the files were drawn for, `actual` the laser's. */
export function checkLock(declared = 0.2, actual = declared, combo: readonly number[] = COMBO): Lock {
  const d = (declared - actual) / 2; // every part is this much bigger per side, every hole this much smaller
  const core = offsetPoly(coreShape(), d);
  const hole = offsetPoly(washerHole(), -d);
  const pts = samples(core, 0.4);
  const passes = (poly: readonly Pt[], deg: number) => {
    const turned = poly.map((p) => rotate(p, [0, 0], deg));
    return pts.every((p) => inside(p, turned));
  };
  // a washer seated at digit m has its notch at STEP * m on its ring; the ring turned to show `digit` is moved by -STEP * digit
  const memo = new Map<number, boolean>();
  const frees = (m: number, digit: number) => {
    const key = m * DIGITS + digit;
    if (!memo.has(key)) memo.set(key, passes(hole, STEP * m - STEP * digit));
    return memo.get(key)!;
  };
  const opens: string[] = [];
  const rings = combo.length;
  for (let n = 0; n < DIGITS ** rings; n++) {
    const code = Array.from({ length: rings }, (_, k) => Math.floor(n / DIGITS ** (rings - 1 - k)) % DIGITS);
    if (code.every((digit, k) => frees(combo[k], digit))) opens.push(code.join(''));
  }
  let windowDeg = 0;
  while (windowDeg < 30 && passes(hole, windowDeg + 0.5) && passes(hole, -windowDeg - 0.5)) windowDeg += 0.5;
  const pocket = offsetPoly(pocketHole(), -d);
  const radial = (poly: readonly Pt[]) => Math.min(...poly.map((p) => Math.hypot(p[0], p[1])));
  return {
    opens,
    pocketFits: pts.every((p) => inside(p, pocket)),
    windowDeg,
    fits: { washerInSocket: SOCKET_FIT - 2 * Math.abs(d), coreInBore: radial(hole) - (CORE.r + d) },
    wrongDigitBlocked: !passes(hole, STEP) && !passes(hole, -STEP),
  };
}
