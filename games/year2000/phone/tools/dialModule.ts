// The Junior Lab's self-contained rotary dial module, drawn from scratch as distance fields (mm). One stack on a base plate, front to back:
//   dial-plate   74 mm finger plate (10 holes of 13 mm on a 29 mm ring, 2 mm webs), hub tube with two drive tabs, two flexure pawls,
//                an off-normal wall and a rest dog under the rim; printed face down
//   dial-cam     pulse cam wheel: internal 12-tooth ratchet (the plate's pawls drive it only on the return), 12 lobes on its rim that press
//                SW2 sideways, 12 detent teeth for the hold-back leaf, a smooth band for the brake leaf, a grease groove under its web
//   dial-spring  printed flat spiral spring in one piece with its own frame ring (parameters below), 6 preload slots in the hub ring
//   dial-base    backplate: center post with a 2.5 mm pilot for the screw, 10 digit pedestals (digits under the holes), SW2 and SW3 cradles, the
//                hold-back and brake leaves on one pillar, the rest post, an ear for the finger-stop clip, pins that key the spring
//   dial-stop    clip-on finger stop (C-clip over the base's ear, arm over the plate), printed on its side
//   dial-bushing the spacer the washer clamps (the plate turns on the post, the screw clamps only the bushing)
// Bought: two 6 x 6 mm tactile switches, an M3 x 10 thread-forming screw and an M3 fender washer (9 mm). The dials's numbers shared
// with the mechanism check are in dialParams.json. Untested: nobody has printed this. z is the module's own height (0 = base bottom).
import { circle2, capsule2, extrude, subtract3, union3, type D2, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import type { ShellPart, V3 } from './shellParts';
import { dialParams as P, holeDeg } from './dialMechanism';

const RAD = Math.PI / 180;
/** All the numbers of the stack (mm, module z). */
export const DM = {
  baseR: 43.2,
  baseTop: 2.4,
  springTop: 5.4,
  camBottom: 5.8,
  camWebTop: 7.0,
  camTop: 9.8,
  lobeBottom: 7.0,
  lobeTop: 8.8,
  plateBottom: 11.2,
  plateTop: 14.4,
  postR: 4.2,
  postTop: 11.8,
  insertHoleR: 1.25,
  insertDepth: 7.5,
  bushingTop: 14.2,
  washerTop: 15.0,
  headTop: 17.4,
  swCenterZ: 7.9,
  sw2Deg: 200,
  sw3Deg: 250,
  holdPillarDeg: 140,
  restPostDeg: 150,
  camOuter: 22.6,
  camRoot: 16.8,
  camCrest: 15.6,
  /** Printed spiral spring: strip thickness t, pitch, turns, height h (all mm), PETG modulus (N/mm2) and the preload (deg). */
  spring: { t: 1.6, pitch: 2.8, turns: 4.0, h: 3.0, r0: 8.6, E: 2000, preloadDeg: 60 },
};
/** Torque (N mm) and strain (%) of the printed spiral at a given turn angle (deg). Flat strip: T = E I theta / L, strain = (t/2) theta / L. */
export function springAt(deg: number): { torque: number; strainPct: number; length: number } {
  const s = DM.spring;
  const rMean = s.r0 + (s.pitch * s.turns) / 2;
  const length = s.turns * 2 * Math.PI * rMean;
  const I = (s.h * s.t ** 3) / 12;
  const th = deg * RAD;
  return { torque: (s.E * I * th) / length, strainPct: (100 * (s.t / 2) * th) / length, length };
}

const wrap = (a: number) => ((a % 360) + 360) % 360;
const angOf = (x: number, v: number) => wrap((Math.atan2(x, -v) * 180) / Math.PI);
const polar = (deg: number, r: number): [number, number] => [r * Math.sin(deg * RAD), -r * Math.cos(deg * RAD)];
const slab = (d2: D2, z0: number, z1: number): D3 => extrude(d2, z0, z1);
const ann =
  (r0: number, r1: number): D2 =>
  (x, v) =>
    Math.max(r0 - Math.hypot(x, v), Math.hypot(x, v) - r1);
/** A box centered at polar (r, deg), lenR along the radius and lenT across it, in the plan. */
const pbox = (r: number, deg: number, lenR: number, lenT: number): D2 => {
  const s = Math.sin(deg * RAD);
  const c = Math.cos(deg * RAD);
  return (x, v) => Math.max(Math.abs(x * s - v * c - r) - lenR / 2, Math.abs(x * c + v * s) - lenT / 2);
};

const dbox = (r: number, h: number): ShellPart['box'] => ({ min: [-r - 1, -r - 1, -1], max: [r + 1, r + 1, h + 1] });

export interface ModuleCtx {
  cx: number;
  cz: number;
  /** Board-viewer y of the module's z = 0 plane. */
  y0: number;
  /** Debug: leave features out ('digits', 'pawls', 'tabs', 'wall', 'dog', 'leaves'). */
  skip?: string[];
}

export interface DialModule {
  parts: ShellPart[];
  /** Where things are, for the cover and tray: the clip's slot, the finger stop, the module's switches. */
  info: { stopDeg: number; clipRho: [number, number]; clipSlotWidth: number; sw2: [number, number]; sw3: [number, number] };
}

export function buildDialModule(ctx: ModuleCtx): DialModule {
  const { cx, cz, y0 } = ctx;
  const on = (n: string) => !ctx.skip?.includes(n);
  const out: ShellPart[] = [];
  // module point (x, v, z) -> viewer; printed "up" (z up) or "down" (face down: print w = top - z)
  const up = (u: number, v: number, w: number): V3 => [cx + u, y0 + w, cz + v];
  const downFrom =
    (top: number) =>
    (u: number, v: number, w: number): V3 => [cx + u, y0 + top - w, cz + v];

  const holeAngles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => holeDeg(d));
  const aA = 155; // the first pawl's tip, world degrees at rest (anchor 100 + 55)
  const F0 = aA - P.holdBackSnapDeg; // ratchet face phase of the cam at rest
  const holdTip = DM.holdPillarDeg - 26.6;

  // ---------------- finger plate (module z plateBottom..plateTop), printed face down ----------------
  {
    const t = DM.plateTop;
    const b = DM.plateBottom;
    const holes = holeAngles.map((a) => {
      const [hx, hv] = polar(a, P.ringR);
      return slab(circle2(P.holeD / 2, hx, hv), b - 1, t + 1);
    });
    const hubR = 6.2;
    // bore: 4.5 up to z 12.0, 3.3 up to 12.4, then a 45 degree cone out to 4.8 (so a face-down print has no overhang there)
    const bore: D3 = (x, v, z) => {
      const r = Math.hypot(x, v);
      const rb = z < 12.0 ? 4.5 : z < 12.4 ? 3.3 : Math.min(4.8, 3.3 + (z - 12.4));
      return Math.max(r - rb, 5.0 - z, z - (t + 1));
    };
    let plate: D3 = union3(slab(circle2(P.plateR, 0, 0), b, t), slab(ann(4.5, hubR), 5.6, b + 0.1));
    // two drive tabs under the hub tube (they go into the spring's hub ring slots)
    for (const a of on('tabs') ? [0, 180] : []) plate = union3(plate, slab(pbox(6.25, a, 3.5, 3.4), 3.8, 5.7));
    // pawls: arm from the tube (r 6, 100 deg) to the tip (r 17.1, 155 deg), 1.0 thick, z 8.0..plateBottom
    for (const k of on('pawls') ? [0, 180] : []) {
      const [ax, av] = polar(80 + k, 5.8);
      const [tx, tv] = polar(aA + k, 17.1);
      const [mx, mv] = polar(80 + k + 30, 10.0);
      plate = union3(plate, slab(capsule2(ax, av, mx, mv, 1.5), 8.0, b + 0.1), slab(capsule2(mx, mv, tx, tv, 1.0), 8.0, b + 0.1));
    }
    // off-normal wall under the rim (r 35.6..36.9): covers the plate angles 4..315 degrees from rest at SW3, so SW3 is closed whenever the plate is off rest
    const wallFrom = wrap(DM.sw3Deg - 315);
    const arcLen = 315 - P.offNormalOpenWithinDeg;
    const wall: D2 = (x, v) => Math.max(ann(35.5, 37.0)(x, v), wrap(angOf(x, v) - wallFrom) <= arcLen ? -0.5 : 0.5);
    if (on('wall')) plate = union3(plate, slab(wall, 6.5, b + 0.1));
    // the rest dog, just clockwise of the rest post
    if (on('dog')) plate = union3(plate, slab(pbox(33.25, DM.restPostDeg + 5.3, 3.5, 3.4), 9.0, b + 0.1));
    const f = subtract3(plate, ...holes, bore);
    out.push({
      id: 'dial-plate',
      label: 'Dial plate: 10 finger holes (13 mm), hub, pawls, off-normal wall and rest dog',
      group: 'dial',
      side: 'front',
      color: [0.95, 0.55, 0.15],
      printed: true,
      field: f,
      box: dbox(P.plateR, t - 3.8),
      cell: 0.5,
      place: downFrom(t),
    });
    // print frame: u, v as module, w = t - z (so the f above, written in module z, is flipped by the wrapper below)
    out[out.length - 1].field = (u, v, w) => f(u, v, t - w);
    out[out.length - 1].box = { min: [-P.plateR - 1, -P.plateR - 1, -1], max: [P.plateR + 1, P.plateR + 1, t - 3.8 + 1] };
  }

  // ---------------- cam wheel (z camBottom..camTop) ----------------
  {
    const b = DM.camBottom;
    const rIn = (a: number): number => {
      const s = (((a - F0) % 30) + 30) % 30;
      const d = DM.camRoot - DM.camCrest;
      return s < 29.5 ? DM.camRoot - (d * s) / 29.5 : DM.camCrest + (d * (s - 29.5)) / 0.5; // gentle ramp inward, then the steep drive face
    };
    const sw2 = DM.sw2Deg;
    const rOut = (a: number, z: number): number => {
      if (z < DM.lobeBottom) {
        // detent band: steep rise over 22 deg, gentle fall over 8 deg, 0.8 mm tall, valley at the hold-back tip at rest
        const s = (((a - holdTip) % 30) + 30) % 30;
        return DM.camOuter + (s < 22 ? (0.8 * s) / 22 : (0.8 * (30 - s)) / 8);
      }
      if (z < DM.lobeTop) {
        const d = Math.abs(((wrap(a - sw2 - 11) + 15) % 30) - 15);
        const h = d <= 5 ? 1.0 : d >= 8 ? 0 : (1.0 * (8 - d)) / 3;
        return DM.camOuter + h;
      }
      return DM.camOuter;
    };
    const f: D3 = (x, v, z) => {
      const r = Math.hypot(x, v);
      const a = angOf(x, v);
      const zb = Math.max(b - z, z - DM.camTop);
      const ring = Math.max(rIn(a) - r, r - rOut(a, z), zb);
      const web = Math.max(r - 16.9, 6.9 - r, b - z, z - DM.camWebTop);
      // grease groove under the web: a 1.0 mm wide, 0.5 mm deep ring at r 11
      const groove = Math.max(Math.abs(r - 11) - 0.5, z - (b + 0.5));
      return Math.max(Math.min(ring, web), -groove);
    };
    out.push({
      id: 'dial-cam',
      label: 'Pulse cam wheel: 12-tooth ratchet, 12 lobes for SW2, detent teeth, brake band, grease groove',
      group: 'dial',
      side: 'front',
      color: [0.88, 0.42, 0.1],
      printed: true,
      field: (u, v, w) => f(u, v, b + w),
      box: { min: [-25, -25, -1], max: [25, 25, DM.camTop - b + 1] },
      cell: 0.4,
      place: (u, v, w) => up(u, v, b + w),
    });
  }

  // ---------------- printed spiral spring in one piece with its frame (z baseTop..springTop) ----------------
  {
    const s = DM.spring;
    const z0 = DM.baseTop;
    const z1 = DM.springTop;
    const strip = (x: number, v: number): number => {
      const r = Math.hypot(x, v);
      const th = (Math.atan2(v, x) - 0.52 + 4 * Math.PI) % (2 * Math.PI);
      let best = Infinity;
      const k0 = Math.floor((r - s.r0) / s.pitch - th / (2 * Math.PI)) - 1;
      for (let k = Math.max(0, k0); k <= k0 + 3; k++) {
        const tt = th / (2 * Math.PI) + k;
        if (tt < 0 || tt > s.turns) continue;
        best = Math.min(best, Math.abs(r - (s.r0 + s.pitch * tt)) - s.t / 2);
      }
      return best;
    };
    const slots = [0, 60, 120, 180, 240, 300].map((a) => slab(pbox(6.3, a, 3.4, 3.8), z1 - 1.9, z1 + 1));
    const body: D3 = (x, v, z) => {
      const frame = Math.min(ann(20.0, 23.0)(x, v), pbox(24.0, 0, 2.2, 4.0)(x, v), pbox(24.0, 120, 2.2, 4.0)(x, v), pbox(24.0, 240, 2.2, 4.0)(x, v));
      const hub = ann(4.6, 8.0)(x, v);
      return Math.max(Math.min(frame, hub, strip(x, v)), z0 - z, z - z1);
    };
    const f = subtract3(body, ...slots);
    out.push({
      id: 'dial-spring',
      label: 'Return spring: printed flat spiral in one piece with its frame ring (PETG; the metal spring seat is in the base)',
      group: 'dial',
      side: 'front',
      color: [0.75, 0.75, 0.8],
      printed: true,
      field: (u, v, w) => f(u, v, z0 + w),
      box: { min: [-26, -26, -1], max: [26, 26, z1 - z0 + 1] },
      cell: 0.25,
      place: (u, v, w) => up(u, v, z0 + w),
    });
  }

  // ---------------- base plate (z 0..) ----------------
  const sw2r = 24.0 + 1.8; // SW2 body center (button faces the cam)
  {
    const top = DM.baseTop;
    let base: D3 = slab(circle2(DM.baseR, 0, 0), 0, top);
    base = union3(base, slab(pbox(44.0, P.stopDeg, 5.5, 8), 0, top)); // the clip's ear
    // center post with the heat-set insert hole
    base = union3(base, slab(circle2(DM.postR, 0, 0), top - 0.1, DM.postTop));
    // a low wall around the spring plate; its three notches take the plate's lugs, so the spring cannot turn
    base = union3(
      base,
      slab((x, v) => Math.max(ann(23.2, 27.2)(x, v), -Math.min(...[0, 120, 240].map((a) => pbox(24.6, a, 2.8, 4.4)(x, v)))), top - 0.1, 4.4),
    );
    // digit pedestals, 7 mm, top 1.2 mm under the plate, digit engraved
    const digit = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const eng: D3[] = [];
    holeAngles.forEach((a, i) => {
      const [px, pv] = polar(a, P.ringR);
      base = union3(base, slab(circle2(3.5, px, pv), top - 0.1, 8.6));
      const tx = strokeText2([digit[i]], 4.4, 0.7, 0, 0);
      if (on('digits')) eng.push((x, v, z) => Math.max(tx(x - px, v - pv), 8.1 - z));
    });
    // rest post
    base = union3(base, slab(pbox(33.25, DM.restPostDeg, 3.5, 3.4), top - 0.1, 10.2));
    // the hold-back and brake leaves on one pillar
    const [qx, qv] = polar(DM.holdPillarDeg, 28.5);
    base = union3(base, slab(pbox(28.5, DM.holdPillarDeg, 4.0, 4.0), top - 0.1, 9.8));
    const leaf = (z0: number, z1: number, thick: number, tipR: number, mid: number) => {
      const [tx, tv] = polar(holdTip, tipR);
      const [mx, mv] = polar(DM.holdPillarDeg - 12, mid);
      return union3(slab(capsule2(qx, qv, mx, mv, thick / 2), z0, z1), slab(capsule2(mx, mv, tx, tv, thick / 2), z0, z1));
    };
    if (on('leaves')) base = union3(base, leaf(5.8, 7.0, 2.0, 22.9, 25.6), leaf(8.8, 9.8, 2.0, 22.6, 25.4));
    // SW2 cradle: a block under the switch (bottom z 4.9), side walls, and a back wall with a slot for the pins
    const s2 = DM.sw2Deg;
    const sides: D2 = (x, v) => Math.max(pbox(sw2r, s2, 4.4, 10.4)(x, v), -pbox(sw2r, s2, 5.0, 6.4)(x, v));
    base = union3(base, slab(pbox(sw2r, s2, 4.4, 6.4), top - 0.1, 4.9), slab(sides, 4.8, 9.0));
    // SW3 cradle: a low frame (the switch lies flat on the base, pins down through holes)
    base = union3(
      base,
      slab((x, v) => Math.max(pbox(36.25, DM.sw3Deg, 10.2, 10.2)(x, v), -pbox(36.25, DM.sw3Deg, 6.6, 6.6)(x, v)), top - 0.1, top + 2.0),
    );
    // metal torsion spring seat: the spring plate's hub ring is its arbor; a 1.6 mm notch in the frame holds its second leg (see spring)
    const sw3Holes: D3[] = [];
    for (const sx of [-3.3, 3.3])
      for (const sy of [-2.3, 2.3]) {
        const c = Math.cos(DM.sw3Deg * RAD);
        const s = Math.sin(DM.sw3Deg * RAD);
        const [bx, bv] = polar(DM.sw3Deg, 36.25);
        sw3Holes.push(slab(circle2(0.65, bx + sx * s + sy * c, bv - sx * c + sy * s), -1, top + 1));
      }
    const insert = slab(circle2(DM.insertHoleR, 0, 0), DM.postTop - DM.insertDepth, DM.postTop + 1);
    const f = subtract3(base, insert, ...sw3Holes, ...eng);
    out.push({
      id: 'dial-base',
      label: 'Dial base: post with a 2.5 mm screw pilot, digit pedestals, switch cradles, detent and brake leaves, rest post, stop ear',
      group: 'dial',
      side: 'front',
      color: [0.78, 0.5, 0.18],
      printed: true,
      field: f,
      box: { min: [-DM.baseR - 8, -DM.baseR - 8, -1], max: [DM.baseR + 8, DM.baseR + 8, DM.postTop + 1] },
      cell: 0.37,
      place: up,
    });
  }

  // ---------------- finger-stop clip, printed on its side (profile in rho, z; extruded across) ----------------
  const clipRho: [number, number] = [46.4, 48.6];
  {
    const a = P.stopDeg;
    const prof = (rho: number, z: number): number => {
      const box = (r0: number, r1: number, z0: number, z1: number) => Math.max(r0 - rho, rho - r1, z0 - z, z - z1);
      return Math.min(
        box(clipRho[0], clipRho[1], -1.2, 19.2), // spine and post
        box(43.4, clipRho[1], -1.2, 0), // arm under the ear
        box(43.4, clipRho[1], DM.baseTop, DM.baseTop + 1.2), // arm over the ear
        box(27.0, clipRho[1], 16.2, 19.2), // arm over the plate (the finger stops against its side)
      );
    };
    const half = 2.6;
    // print frame: u = rho - 26, v = z + 1.2, w = across (0..2*half)
    out.push({
      id: 'dial-stop',
      label: 'Finger stop: C-clip over the base ear, post through the cover slot, arm over the plate (no glue)',
      group: 'dial',
      side: 'front',
      color: [0.9, 0.9, 0.92],
      printed: true,
      field: (u, v, w) => Math.max(prof(u + 26, v - 1.2), Math.abs(w - half) - half),
      box: { min: [-1, -1, -1], max: [clipRho[1] - 26 + 1, 20.4 + 1, 2 * half + 1] },
      cell: 0.35,
      place: (u, v, w) => {
        const rho = u + 26;
        const t = w - half;
        const s = Math.sin(a * RAD);
        const c = Math.cos(a * RAD);
        return [cx + rho * s + t * c, y0 + v - 1.2, cz - rho * c + t * s];
      },
    });
  }

  // ---------------- bushing ----------------
  {
    const z0 = DM.postTop;
    out.push({
      id: 'dial-bushing',
      label: 'Bushing: the washer clamps this spacer, so the plate turns freely and cannot lift off',
      group: 'dial',
      side: 'front',
      color: [0.9, 0.9, 0.92],
      printed: true,
      field: (u, v, w) => Math.max(ann(1.7, 3.1)(u, v), -w, w - (DM.bushingTop - z0)),
      box: { min: [-4, -4, -1], max: [4, 4, DM.bushingTop - z0 + 1] },
      cell: 0.2,
      place: (u, v, w) => up(u, v, z0 + w),
    });
  }

  // ---------------- bought parts shown in the viewer (not printed) ----------------
  const tact = (id: string, label: string, pos: [number, number], deg: number, flat: boolean) => {
    const [px, pv] = pos;
    const s = Math.sin(deg * RAD);
    const c = Math.cos(deg * RAD);
    out.push({
      id,
      label,
      group: 'dial',
      side: 'front',
      color: [0.08, 0.08, 0.09],
      printed: false,
      field: (u, v, z) => {
        const dx = u - px;
        const dv = v - pv;
        const rho = dx * s - dv * c;
        const tau = dx * c + dv * s;
        const body = flat
          ? Math.max(Math.abs(rho) - 3, Math.abs(tau) - 3, DM.baseTop - z, z - (DM.baseTop + 3.6))
          : Math.max(Math.abs(rho) - 1.8, Math.abs(tau) - 3, Math.abs(z - DM.swCenterZ) - 3);
        const stem = flat
          ? Math.max(Math.hypot(rho, tau) - 1.75, DM.baseTop + 3.5 - z, z - (DM.baseTop + 4.3))
          : Math.max(Math.hypot(tau, z - DM.swCenterZ) - 1.75, -2.6 - rho, rho + 1.8);
        return Math.min(body, stem);
      },
      box: { min: [px - 8, pv - 8, 0], max: [px + 8, pv + 8, 12] },
      cell: 0.3,
      place: (u, v, z) => up(u, v, z),
    });
  };
  tact('SW2-dial', 'SW2 pulse switch (6 mm tactile, on its side; the cam lobes press it)', polar(DM.sw2Deg, sw2r), DM.sw2Deg, false);
  tact('SW3-dial', 'SW3 off-normal switch (6 mm tactile, flat; the plate wall presses it)', polar(DM.sw3Deg, 36.25), DM.sw3Deg, true);
  out.push({
    id: 'dial-screw',
    label: 'M3 x 10 thread-forming screw and 9 mm washer (into the 2.5 mm pilot in the post)',
    group: 'dial',
    side: 'front',
    color: [0.7, 0.7, 0.74],
    printed: false,
    field: (u, v, z) => {
      const r = Math.hypot(u, v);
      const washer = Math.max(r - 4.5, DM.bushingTop - z, z - DM.washerTop);
      const head = Math.max(r - 2.9, DM.washerTop - z, z - DM.headTop);
      const shank = Math.max(r - 1.5, DM.washerTop - 10 - z, z - DM.washerTop);
      return Math.min(washer, head, shank);
    },
    box: { min: [-6, -6, DM.postTop - 8], max: [6, 6, DM.headTop + 1] },
    cell: 0.25,
    place: (u, v, z) => up(u, v, z),
  });

  for (const p of out) p.stack = p.id; // each part of the module explodes on its own in the viewer
  return { parts: out, info: { stopDeg: P.stopDeg, clipRho, clipSlotWidth: 5.6 + 1.6, sw2: polar(DM.sw2Deg, sw2r), sw3: polar(DM.sw3Deg, 36.25) } };
}
