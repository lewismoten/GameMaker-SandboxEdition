// The Junior Lab Edition's shell: ONE full-width case (board width all the way down), built as distance fields (mm) from a Variant.
//   top end    the earpiece pod: the 28 mm speaker clips into the front cover (three flexure clips), grille holes in the roof
//   board      the 99 x 99 board between the cover's walls and the tray's, clamped by the corner bosses
//   lower body the dial module (dialModule.ts) in the cover, the 4 x AAA holder behind it in the tray (the module's base lies 0.2 mm
//              over the holder like a lid, with a groove for the microphone wires), the mouthpiece at the chin
// Six M3 x 30 screws go in from the back (heads on the back) into 2.5 mm pilot holes in six bosses of the front cover: the case's four
// outer corners and the board's two lower mounting holes (the two top ones pass through the board's top holes and clamp it too).
// The front cover covers everything except the dial opening, the display window, the grilles and the TALK / CLEAR caps.
// Printed face down (cover) and floor down (tray). An untested design: every clearance is a starting guess.
import { circle2, extrude, roundRect2, subtract3, union3, type D2, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import { BACK_Y, FRONT_Y } from './clearance';
import type { Variant } from './shellInput';
import {
  BOX_WALL,
  CELL_D,
  CELL_PITCH,
  CUP_R,
  FIT,
  FLOOR,
  HOLD_GAP,
  LIP,
  SLACK,
  SLK,
  WALL,
  boxAround,
  ceil05,
  cyl,
  notchesFor,
  rect,
  roomAt,
  slabW,
  type ShellPart,
  type V3,
} from './shellParts';
import { DM, buildDialModule } from './dialModule';

/** The six screws: M3 x 30 thread-forming (self-tapping) screws from the back into 2.5 mm pilot holes in the cover's bosses. */
export const SCREW = { length: 30, count: 6, pilot: 1.25, clearance: 1.65 };
const SPK_R = 14.0;

export function buildCheapShell(v: Variant): {
  parts: ShellPart[];
  bay: { holder: number[]; capsule: number[] };
  dial: ReturnType<typeof buildDialModule>['info'];
  screws: [number, number][];
  levels: Record<string, number>;
} {
  const out: ShellPart[] = [];
  const { W, H } = v;
  const bx = W / 2;
  const board = (grow: number): D2 => roundRect2(W / 2 + grow, H / 2 + grow, 4 + grow, W / 2, H / 2);

  // ---- heights ---------------------------------------------------------------------------------------------------------
  const Hf = ceil05(v.frontMax + LIP + SLACK); // the cover's face: flush all the way down (the dial plate stands 0.8 mm proud)
  const hFront = Hf - 1.6;
  const plateTopY = Hf + 0.8;
  const y0m = plateTopY - DM.plateTop; // the dial base's bottom
  const { L: hL, Wd: hW, T: hT } = v.holder;
  const hy1 = y0m - 0.2; // the holder's top: the base is its lid
  const hy0 = hy1 - hT;
  // one flat floor under the whole case (a stepped floor would print as a 11000 mm2 overhang): deep enough for the holder under the dial module
  const fb2 = Math.min(-(v.backMax + 1.5 + FLOOR), hy0 - 0.5 - FLOOR);
  const fbB = fb2;
  const hTray = -fb2;
  const slabY = (d2: D2, y0: number, y1: number): D3 => slabW(d2, y0 - fb2, y1 - fb2);
  const roundBox = (x0: number, z0: number, x1: number, z1: number, r = 1.5): D2 => rect(x0, z0, x1, z1, r);

  // ---- plan: top pod, board, divider, lower body --------------------------------------------------------------------------------
  const pz0 = H + FIT + 3.0; // the lower body's inside starts here (a 3 mm divider wall from the board's edge)
  const cz = pz0 + 1.0 + DM.baseR; // the dial's center
  const hx0 = bx - hL / 2;
  const hx1 = bx + hL / 2;
  const hz0 = pz0 + HOLD_GAP;
  const hz1 = hz0 + hW;
  const zm = Math.max(hz1 + SLK + 1.0 + CUP_R, cz + DM.baseR + 1.6 + CUP_R); // the microphone capsule's center
  const pz1 = zm + CUP_R + 1.5;
  const bayOuter = roundBox(-WALL, H - 3, W + WALL, pz1 + WALL, 2.5);
  const bayPocket = roundBox(-FIT, pz0, W + FIT, pz1, 1.5);
  // the earpiece pod above the board's top end, between the infrared parts (x 13 and 86)
  const zsp = -(SPK_R + 1.5);
  const podOuter = roundBox(bx - SPK_R - 3.5 - WALL, zsp - SPK_R - 3.5 - WALL, bx + SPK_R + 3.5 + WALL, 2.0, 3);
  const podPocket = roundBox(bx - SPK_R - 3.5, zsp - SPK_R - 3.5, bx + SPK_R + 3.5, 1.0, 2);
  const capY1 = Hf - LIP - 0.6;
  const capY0 = capY1 - 6.5;
  const bayInfo = { holder: [hx0, hy0, hz0, hx1, hy1, hz1], capsule: [bx - 4.85, capY0, zm - 4.85, bx + 4.85, capY1, zm + 4.85] };
  const wireXs = [...v.btPads, ...v.micPads].map((p) => p[0]);
  const wx0 = 1.0; // the slot also lets the microphone wires out to the corridor beside the holder
  const wx1 = Math.max(...wireXs) + 2.2;
  const levels = { Hf, plateTopY, y0m, hy0, hy1, fb2, fbB, cz, zm, pz1, zsp };

  // ---- the six screws ---------------------------------------------------------------------------------------------------------
  const screws: [number, number][] = [
    ...v.holes.slice(0, 4).map((h) => [h[0], h[1]] as [number, number]),
    [v.holes[0][0], pz1 - v.holes[0][0]],
    [v.holes[1][0], pz1 - v.holes[0][0]],
  ];
  const boardScrews = screws.slice(0, 4);
  const lowScrews = screws.slice(4);
  const seatY = fbB; // every head seats at the board part's back plane
  const insertY0 = 1.6; // the pilot's mouth (the board's front face)
  const screwTipY = seatY + SCREW.length;

  const btIn = { x0: hx0 + 2, z0: hz0 + 2, x1: hx1 - 2, z1: hz1 - 2 };
  const hyc = (hy0 + hy1) / 2;
  // ---- the dial module ---------------------------------------------------------------------------------------------------------
  const dm = buildDialModule({ cx: bx, cz, y0: y0m });

  // ---- back tray ---------------------------------------------------------------------------------------------------------------
  {
    let tray: D3 = subtract3(
      union3(slabY(board(WALL), fbB, 0), slabY(bayOuter, fb2, 0), slabY(podOuter, fbB, 0)),
      slabY(board(FIT), fbB + FLOOR, 1),
      slabY(bayPocket, fb2 + FLOOR, 1),
      slabY(podPocket, fbB + FLOOR, 1),
    );
    const bossR = (x: number, z: number) => Math.max(2.3, Math.min(4.6, roomAt(v, 'back', x, z, BACK_Y, fbB)));
    tray = union3(
      tray,
      ...boardScrews.map(([x, z]) => extrude(circle2(bossR(x, z), x, z), fbB - fb2 - 1, -0.075 - fb2)),
      ...lowScrews.map(([x, z]) => extrude(circle2(4.6, x, z), -1, 1.5 - fb2)),
    );
    // crush ribs that hold the holder (0.3 mm of slack); the dial base lies 0.2 mm over the holder like a lid
    const ribs: D3[] = [];
    for (const zr of [hz0 + 8, hz1 - 9.2]) {
      ribs.push(slabY(rect(hx0 - 3.3, zr, hx0 - 0.3, zr + 1.2, 0.3), fb2 + FLOOR - 0.5, hy1));
      ribs.push(slabY(rect(hx1 + 0.3, zr, hx1 + 3.3, zr + 1.2, 0.3), fb2 + FLOOR - 0.5, hy1));
    }
    for (const xr of [hx0 + 6, hx1 - 7.2]) {
      ribs.push(slabY(rect(xr, hz1 + 0.3, xr + 1.2, hz1 + 2.5, 0.3), fb2 + FLOOR - 0.5, hy1));
      ribs.push(slabY(rect(xr, pz0 - 0.5, xr + 1.2, hz0 - 0.2, 0.3), fb2 + FLOOR - 0.5, hy1));
    }
    const cuts: D3[] = [...notchesFor(v, 'back')];
    for (const [x, z] of boardScrews) cuts.push(extrude(circle2(SCREW.clearance, x, z), fbB - fb2 - 1, 5 - fb2));
    for (const [x, z] of lowScrews) cuts.push(extrude(circle2(SCREW.clearance, x, z), -1, 5 - fb2));
    cuts.push(slabY(rect(btIn.x0, btIn.z0, btIn.x1, btIn.z1, 3), fb2 - 1, fb2 + FLOOR + 1)); // the battery door's window
    cuts.push(slabY(rect(wx0, H + FIT - 0.1, wx1, pz0 + 0.1, 0.3), -3.8, 5)); // the leads' slot through the divider, open at the top
    if (v.wheel) {
      const [wxp, wzp] = v.wheel;
      cuts.push(slabY(rect(wxp - 4, wzp - 6.3, W + WALL + 1, wzp + 6.3, 0.3), -11.8, 5)); // the thumbwheel's slot in the side wall
    }
    out.push({
      id: 'back-tray',
      label: 'Back tray: full-width lower body with the battery cradle, six screw seats and the door window (closed back)',
      group: 'shell',
      side: 'back',
      color: [0.3, 0.44, 0.72],
      printed: true,
      field: subtract3(union3(tray, ...ribs), ...cuts),
      box: boxAround(-WALL, zsp - SPK_R - 4 - WALL, W + WALL, pz1 + WALL, hTray, 1),
      cell: 0.6,
      place: (u, vv, w) => [u, fb2 + w, vv] as V3,
    });
  }

  // ---- the dial module's parts, then the caps ------------------------------------------------------------------------------------------
  out.push(...dm.parts);
  v.buttons.forEach(([bx2, bz2], i) => {
    const yTop = Hf + 0.5;
    const h = yTop - 5.7;
    const yFl = Hf - LIP - 0.3;
    out.push({
      id: i === 0 ? 'cap-talk' : 'cap-clear',
      label: i === 0 ? 'TALK button cap' : 'CLEAR button cap',
      group: 'dial',
      side: 'front',
      color: i === 0 ? [0.15, 0.65, 0.3] : [0.85, 0.15, 0.12],
      printed: true,
      field: subtract3(union3(cyl(0, 0, 4.8, 0, h), cyl(0, 0, 6.2, yFl - 5.7 - 1.0, yFl - 5.7)), cyl(0, 0, 2.0, -1, 3.4)),
      box: { min: [-7, -7, -1], max: [7, 7, h + 1] },
      cell: 0.4,
      place: (u, vv, w) => [bx2 + u, 5.7 + w, bz2 + vv],
    });
  });

  // ---- front cover ---------------------------------------------------------------------------------------------------------------------
  {
    const r2 = (d2: D2): D3 => slabW(d2, -1, LIP + 0.01);
    const outer = union3(slabW(board(WALL), 0, hFront), slabW(bayOuter, 0, Hf), slabW(podOuter, 0, Hf));
    const pockets = [slabW(board(FIT), LIP, Hf + 1), slabW(bayPocket, LIP, Hf + 1), slabW(podPocket, LIP, Hf + 1)];
    const bossR = (x: number, z: number) => Math.max(2.4, Math.min(4.6, roomAt(v, 'front', x, z, FRONT_Y, FRONT_Y + hFront - 1.6)));
    const bosses = union3(...screws.map(([x, z], i) => cyl(x, z, i < 4 ? bossR(x, z) : 4.6, 0, i < 4 ? hFront : Hf - insertY0)));
    // a 2.5 mm pilot from the boss's mouth to a little past the screw's tip (the thread-forming screw cuts its own thread)
    const mouthW = (i: number) => (i < 4 ? hFront : Hf - insertY0);
    const inserts = screws.map(([x, z], i) => cyl(x, z, SCREW.pilot, Hf - screwTipY - 0.4, mouthW(i) + 1));
    const holes: D3[] = [];
    holes.push(r2(circle2(38.2, bx, cz))); // the dial plate's opening (the plate is 74 mm)
    for (const [x0, z0, x1, z1] of v.displays) holes.push(r2(rect(x0 - 1.2, z0 - 1.2, x1 + 1.2, z1 + 1.2, 1)));
    for (const [x, z] of v.buttons) holes.push(r2(circle2(5.4, x, z)));
    // the stop clip's slot, at the finger stop's angle
    const a = (dm.info.stopDeg * Math.PI) / 180;
    const rc = (dm.info.clipRho[0] + dm.info.clipRho[1]) / 2;
    const sx = bx + rc * Math.sin(a);
    const sz = cz - rc * Math.cos(a);
    holes.push(
      r2((x, z) => Math.max(Math.abs((x - sx) * Math.sin(a) - (z - sz) * Math.cos(a)) - 1.7, Math.abs((x - sx) * Math.cos(a) + (z - sz) * Math.sin(a)) - 3.1)),
    );
    // earpiece grille over the speaker in the pod
    for (let j = -4; j <= 4; j++)
      for (let i = -4; i <= 4; i++) {
        const gx = bx + (i + (j % 2 ? 0.5 : 0)) * 3.4;
        const gz = zsp + j * 2.94;
        if (Math.hypot(gx - bx, gz - zsp) <= 9.2) holes.push(r2(circle2(1.0, gx, gz)));
      }
    holes.push(r2(circle2(0.7, bx, zm)));
    for (let k = 0; k < 6; k++) holes.push(r2(circle2(0.7, bx + 2.7 * Math.cos((k * Math.PI) / 3), zm + 2.7 * Math.sin((k * Math.PI) / 3))));
    // the dial tube: the base's rim seats against its end (y = base top), the plate passes through the roof opening
    const tube: D3 = extrude((x, z) => Math.max(40.0 - Math.hypot(x - bx, z - cz), Math.hypot(x - bx, z - cz) - 41.6), LIP - 0.01, Hf - (y0m + DM.baseTop));
    const collar: D3 = subtract3(cyl(bx, zm, CUP_R, LIP - 0.01, LIP + 4.5), cyl(bx, zm, 5.25, LIP - 0.5, LIP + 5));
    // three speaker clips: each is two 2 mm thick arms that follow the speaker's rim for 40 degrees each way (printed standing on the roof, so it bends
    // in the layer plane), fixed to the pod wall by a rib at one end, with a barb over the speaker's back rim at its free end
    const clipSpan = Hf - 5.3; // the arms hang down to y = 5.3
    const clips = [0, 90, 270].map((a0): D3 => {
      const s0 = Math.sin((a0 * Math.PI) / 180);
      const c0 = Math.cos((a0 * Math.PI) / 180);
      return (x, z, w) => {
        const rx = x - bx;
        const rz = z - zsp;
        const r = Math.hypot(rx, rz);
        const dc = ((((Math.atan2(rx, -rz) * 180) / Math.PI - a0) % 360) + 360) % 360; // degrees clockwise of the rib
        const d = Math.min(dc, 360 - dc); // an arm runs each way from the rib
        const wy = Hf - w;
        const barb = d > 34 && d < 46 ? (wy < 5.3 ? 0 : wy < 6.1 ? (0.8 * (wy - 5.3)) / 0.8 : wy < 6.6 ? 0.8 : 0) : 0; // a chamfer to push the speaker past, then a ledge under its back rim
        const arm = Math.max(SPK_R + 0.4 - barb - r, r - (SPK_R + 2.4), 6 - d, d - 46);
        const rho = rx * s0 - rz * c0;
        const tan = rx * c0 + rz * s0;
        const rib = Math.max(SPK_R + 0.4 - rho, rho - (SPK_R + 4.2), Math.abs(tan) - 1.9);
        return Math.max(Math.min(arm, rib), LIP - 0.01 - w, w - clipSpan);
      };
    });
    out.push({
      id: 'front-cover',
      label: 'Front cover: dial opening and tube, display window, caps, earpiece pod with speaker clips, mouthpiece grille',
      group: 'shell',
      side: 'front',
      color: [0.34, 0.5, 0.78],
      printed: true,
      field: subtract3(union3(subtract3(outer, ...pockets), bosses, tube, collar, ...clips), ...inserts, ...holes, ...notchesFor(v, 'front')),
      box: boxAround(-WALL, zsp - SPK_R - 4 - WALL, W + WALL, pz1 + WALL, Hf, 1),
      cell: 0.5,
      place: (u, vv, w) => [u, Hf - w, vv] as V3,
    });
  }

  // ---- battery: box, four off-brand AAA cells, door, the leads, the microphone capsule and its wires ----------------
  const box3 =
    (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): D3 =>
    (x, y, z) =>
      Math.max(x0 - x, x - x1, y0 - y, y - y1, z0 - z, z - z1);
  const wire = (id: string, label: string, group: 'battery' | 'components', color: V3, segs: number[][]) => {
    const lo = [0, 1, 2].map((k) => Math.min(...segs.map((s) => s[2 * k])) - 1) as V3;
    const hi = [0, 1, 2].map((k) => Math.max(...segs.map((s) => s[2 * k + 1])) + 1) as V3;
    const fs = segs.map((s) => box3(s[0], s[1], s[2], s[3], s[4], s[5]));
    out.push({
      id,
      label,
      group,
      side: 'back',
      color,
      printed: false,
      field: (x, y, z) => Math.min(...fs.map((f) => f(x, y, z))),
      box: { min: lo, max: hi },
      cell: 0.25,
      place: (u, y, z) => [u, y, z],
    });
  };
  const red: V3 = [0.85, 0.12, 0.1];
  const blk: V3 = [0.08, 0.08, 0.09];
  {
    // the holder's leads: along the back of the board (y -1.9..-0.5), through the divider's slot, down in the gap, into the holder's end
    const zr = pz0 + 1.0;
    v.btPads.forEach(([x, z], k) => {
      const t = 0.7;
      wire(`BT1-lead${k + 1}`, k === 0 ? 'Holder lead (red, +) to the board' : 'Holder lead (black, -) to the board', 'battery', k === 0 ? red : blk, [
        [x - t, x + t, -1.9, -0.5, z + 3.2, zr + t],
        [x - t, x + t, Math.min(hyc - t, -1.9), -0.5, zr - t, zr + t],
        [x - t, x + t, hyc - t, hyc + t, zr - t, hz0 + 0.5],
      ]);
    });
    // the capsule: gripped by the collar under the cover, its face 0.2 mm under the grille
    out.push({
      id: 'MK1-capsule',
      label: 'Microphone capsule (9.7 mm electret, gripped by the collar)',
      group: 'components',
      side: 'front',
      color: [0.78, 0.78, 0.8],
      printed: false,
      field: (x, y, z) => Math.max(Math.hypot(x - bx, z - zm) - 4.85, Math.abs(y - (capY0 + capY1) / 2) - 3.25),
      box: { min: [bx - 6, capY0 - 1, zm - 6], max: [bx + 6, capY1 + 1, zm + 6] },
      cell: 0.4,
      place: (u, y, z) => [u, y, z],
    });
    // its twisted pair: from the pads along the back of the board, out to the corridor beside the holder (x 2.5 and 4.5, past the dial base's
    // rim), down the lower body, across under the chin to the capsule and up into it
    const wy = -1.2;
    const zt = cz + DM.baseR + 2.0;
    v.micPads.forEach(([x, z], k) => {
      const t = 0.5;
      const zr2 = pz0 + 2.0;
      const xs = 2.5 + 2 * k;
      const xc = bx + (k === 0 ? -1.3 : 1.3);
      wire(
        `MK1-wire${k + 1}`,
        k === 0 ? 'Microphone wire (+, red) twisted pair' : 'Microphone wire (-, black) twisted pair',
        'components',
        k === 0 ? red : blk,
        [
          [x - t, x + t, -1.8, -0.8, z + 5.2, zr2 + t],
          [Math.min(x, xs) - t, Math.max(x, xs) + t, wy - t, wy + t, zr2 - t, zr2 + t],
          [xs - t, xs + t, wy - t, wy + t, zr2 - t, zt + t],
          [Math.min(xs, xc) - t, Math.max(xs, xc) + t, wy - t, wy + t, zt - t, zt + t],
          [xc - t, xc + t, wy - t, wy + t, zt - t, zm + t],
          [xc - t, xc + t, wy - t, capY0, zm - t, zm + t],
        ],
      );
    });
  }
  {
    const hBox = hT;
    out.push({
      id: 'BT1',
      label: 'Battery box (4 x AAA)',
      group: 'battery',
      side: 'back',
      color: [0.22, 0.22, 0.25],
      printed: true,
      field: subtract3(
        slabW(rect(hx0, hz0, hx1, hz1, 2), 0, hBox),
        slabW(rect(hx0 + BOX_WALL, hz0 + BOX_WALL, hx1 - BOX_WALL, hz1 - BOX_WALL, 1), BOX_WALL, hBox + 1),
      ),
      box: boxAround(hx0, hz0, hx1, hz1, hBox, 1),
      cell: 0.8,
      place: (u, vv, w) => [u, hy1 - w, vv],
    });
    // cells lie along the longer side (x), four side by side across z
    const zc = (hz0 + hz1) / 2;
    const yc = hy1 - BOX_WALL - CELL_D / 2 - 0.05;
    const len = 43.7;
    const xc = bx;
    const rr = CELL_D / 2;
    for (let k = 0; k < 4; k++) {
      const cz2 = zc + (k - 1.5) * CELL_PITCH;
      const body: D3 = (x, y, z) => {
        const rad = Math.hypot(y - yc, z - cz2);
        const qx = Math.abs(x - xc) - (len / 2 - 0.6);
        const qr = rad - (rr - 0.6);
        const round = Math.hypot(Math.max(qx, 0), Math.max(qr, 0)) + Math.min(Math.max(qx, qr), 0) - 0.6;
        const nub = Math.max(Math.hypot(y - yc, z - cz2) - 1.9, Math.abs(x - (xc + len / 2 + 0.4)) - 0.4);
        return Math.min(round, nub);
      };
      out.push({
        id: `BT1-cell${k + 1}`,
        label: `ZORP AAA cell ${k + 1}`,
        group: 'battery',
        side: 'back',
        color: [0.1, 0.1, 0.12],
        printed: false,
        field: body,
        box: { min: [xc - len / 2 - 1, yc - rr - 1, cz2 - rr - 1], max: [xc + len / 2 + 2, yc + rr + 1, cz2 + rr + 1] },
        cell: 0.45,
        place: (u, y, z) => [u, y, z],
      });
      // raised lettering on the side that faces the door: text runs along the cell
      const text = strokeText2(['AAA 1.5V'], 3.4, 0.6, 0, 0);
      const letters: D3 = (x, y, z) => {
        const rad = Math.hypot(y - yc, z - cz2);
        const face = yc - y; // toward the door (y falls)
        const onBand = Math.abs(rad - (rr + 0.1)) - 0.35;
        const t = text(x - xc, z - cz2);
        return Math.max(onBand, t, 0.3 * rr - face);
      };
      out.push({
        id: `BT1-label${k + 1}`,
        label: `Lettering "AAA 1.5V", cell ${k + 1}`,
        group: 'battery',
        side: 'back',
        color: [0.96, 0.82, 0.2],
        printed: false,
        field: letters,
        box: { min: [xc - 13, yc - rr - 1, cz2 - 5], max: [xc + 13, yc + 1, cz2 + 5] },
        cell: 0.3,
        place: (u, y, z) => [u, y, z],
      });
    }
    // the door: plate outside the floor, a plug in the window (flush with the floor's inside), a finger notch
    const plate = rect(btIn.x0 - 3, btIn.z0 - 3, btIn.x1 + 3, btIn.z1 + 3, 3);
    const plug = rect(btIn.x0 + FIT, btIn.z0 + FIT, btIn.x1 - FIT, btIn.z1 - FIT, 3);
    const notch = circle2(4.5, (btIn.x0 + btIn.x1) / 2, btIn.z1 + 3);
    out.push({
      id: 'battery-door',
      label: 'Battery door (plug, plate and finger notch)',
      group: 'shell',
      side: 'back',
      color: [0.4, 0.55, 0.82],
      printed: true,
      field: (x, z, w) => {
        const p = Math.max(plate(x, z), notch(x, z) * -1, -w, w - 1.6);
        const g = Math.max(plug(x, z), -(w - 1.6), w - (1.6 + FLOOR));
        return Math.min(p, g);
      },
      box: boxAround(btIn.x0 - 3, btIn.z0 - 3, btIn.x1 + 3, btIn.z1 + 3, 1.6 + FLOOR, 1),
      cell: 0.6,
      place: (u, vv, w) => [u, fb2 - 1.6 + w, vv],
    });
  }
  // the earpiece: the 28 mm speaker clipped under the cover's roof in the top pod, two wires to the board's LS1 pads
  out.push({
    id: 'LS1-earpiece',
    label: 'Earpiece speaker (8 ohm, 28 mm, 4 mm thick), clipped into the cover; two wires to the LS1 pads (+ marked)',
    group: 'components',
    side: 'front',
    color: [0.08, 0.08, 0.09],
    printed: false,
    field: (x, y, z) => Math.max(Math.hypot(x - bx, z - zsp) - SPK_R, Math.abs(y - (Hf - LIP - 2.0)) - 2.0),
    box: { min: [bx - SPK_R - 1, Hf - LIP - 5, zsp - SPK_R - 1], max: [bx + SPK_R + 1, Hf - LIP + 1, zsp + SPK_R + 1] },
    cell: 0.4,
    place: (u, y, z) => [u, y, z],
  });
  return { parts: out, bay: bayInfo, dial: dm.info, screws, levels };
}
