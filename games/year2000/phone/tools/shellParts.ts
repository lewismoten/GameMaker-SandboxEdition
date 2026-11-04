// The phone's 3D-printed shell, dial, button caps and battery box as distance fields (mm), sized from a Variant. Each part is
// modelled the way it prints (local u, v on the bed, w up) with a `place` that puts it in the viewer's coordinates. An untested
// design: nobody has printed these, so every clearance below is a starting guess, not a measured fit.
//   shell:  front frame (open bezel: the board is the face, so its silkscreen stays visible), back tray, battery handle (the
//           Junior Lab Edition's battery holder sits past the board's edge)
//   dial:   rotary dial plate, pulse + off-normal cam (ramped teeth for the 6 mm tactile switches), spiral return spring, pivot
//           post, finger stop and the two button caps
//   battery: the battery box, four off-brand AAA cells with raised "AAA 1.5V" lettering, and the battery door
import { circle2, capsule2, extrude, roundRect2, subtract3, union3, type D2, type D3 } from '@lewismoten/gamemaker-sandbox-tools/mesh/sdfShapes';
import { strokeText2 } from '@lewismoten/gamemaker-sandbox-tools/mesh/strokeText';
import { BACK_Y, FRONT_Y, LEAD, LEAD_R, MIN_GAP } from './clearance';
import type { Variant } from './shellInput';

export type V3 = [number, number, number];

export interface ShellPart {
  id: string;
  label: string;
  group: 'shell' | 'dial' | 'battery' | 'components';
  side: 'front' | 'back';
  color: V3;
  /** Printed as one piece on the bed (false for the bought AAA cells). */
  printed: boolean;
  field: D3;
  box: { min: V3; max: V3 };
  cell: number;
  place: (u: number, v: number, w: number) => V3;
}

const WALL = 2.4;
const FIT = 0.3;
const FLOOR = 2.4;
const LIP = 2.2;
const CELL_D = 10.5;
const CELL_PITCH = 10.9;
const BOX_WALL = 1.2;
const SLK = 1.0; // room around the holder on every side of the bay
const HOLD_GAP = 3.0; // between the bay near wall and the holder: the leads come down here
const CUP_R = (9.7 + 0.4) / 2 + 1.6; // the microphone collar outer radius

const rect = (x0: number, z0: number, x1: number, z1: number, r = 1.5): D2 => roundRect2((x1 - x0) / 2, (z1 - z0) / 2, r, (x0 + x1) / 2, (z0 + z1) / 2);
const cyl = (cx: number, cz: number, r: number, w0: number, w1: number): D3 => extrude(circle2(r, cx, cz), w0, w1);
const boxAround = (x0: number, z0: number, x1: number, z1: number, w1: number, pad = 1): ShellPart['box'] => ({
  min: [x0 - pad, z0 - pad, -1],
  max: [x1 + pad, z1 + pad, w1 + 1],
});
const slabW = (d2: D2, w0: number, w1: number): D3 => extrude(d2, w0, w1);
const ceil05 = (v: number) => Math.ceil(v * 2) / 2;
const SLACK = MIN_GAP + 0.05;

/** Wall notches (full height) around the bodies of one face that overhang the board's outline, SLACK mm bigger on every side. */
function notchesFor(v: Variant, face: 'front' | 'back'): D3[] {
  return v.bodies
    .filter((b) => b.side === face && b.id !== 'RV1' && (b.bbox[0] < 0 || b.bbox[3] > v.W || b.bbox[2] < 0 || b.bbox[5] > v.H))
    .map((b) =>
      extrude(
        roundRect2((b.bbox[3] - b.bbox[0]) / 2 + SLACK, (b.bbox[5] - b.bbox[2]) / 2 + SLACK, 1, (b.bbox[0] + b.bbox[3]) / 2, (b.bbox[2] + b.bbox[5]) / 2),
        -1,
        100,
      ),
    );
}

/** Largest radius of a disc at (x, z) that keeps SLACK mm from every part body and lead stub on one face, for a printed part
 *  that spans heights y0..y1 (viewer coordinates). A horizontal test only, so a little more careful than the 3D one. */
function roomAt(v: Variant, face: 'front' | 'back', x: number, z: number, y0: number, y1: number, skip: string[] = []): number {
  const lo = Math.min(y0, y1) - SLACK;
  const hi = Math.max(y0, y1) + SLACK;
  let r = Infinity;
  for (const b of v.bodies) {
    if (b.side !== face || skip.some((s) => b.id === s) || b.bbox[4] < lo || b.bbox[1] > hi) continue;
    r = Math.min(r, Math.hypot(Math.max(b.bbox[0] - x, 0, x - b.bbox[3]), Math.max(b.bbox[2] - z, 0, z - b.bbox[5])) - SLACK);
  }
  const sLo = (face === 'front' ? FRONT_Y : BACK_Y - LEAD) - SLACK;
  const sHi = (face === 'front' ? FRONT_Y + LEAD : BACK_Y) + SLACK;
  if (lo <= sHi && hi >= sLo) for (const l of v.leads) if (l.face === face) r = Math.min(r, Math.hypot(l.x - x, l.z - z) - LEAD_R - SLACK);
  return r;
}

export function buildShell(v: Variant): { parts: ShellPart[]; bay: { holder: number[]; capsule: number[] } } {
  const out: ShellPart[] = [];
  const { W, H, dial } = v;
  const board = (grow: number): D2 => roundRect2(W / 2 + grow, H / 2 + grow, 4 + grow, W / 2, H / 2);
  const [cx, cz] = dial.c;
  const swTop = v.swTop;
  let wellR = dial.R + 8; // the dial well in the cover: the plate, plus the room the finger stop needs (set where the stop is placed)

  // ---- heights the dial and shell share -------------------------------------------------------------------------
  const plateBottom = swTop + 1.7;
  const plateTop = plateBottom + 3.2;
  // the cover's underside clears the tallest front part by SLACK (the dial, caps, displays and speaker have openings for what stands above)
  const Hf = ceil05(Math.max(v.frontMax + LIP + SLACK, plateTop + 2.5));
  const hFront = Hf - 1.6;
  // place helpers for parts whose local (u, v, w) are board x, board y, height from a plane (non-mirroring: y = yBase + w)
  const up =
    (yBase: number) =>
    (u: number, vv: number, w: number): V3 => [u, yBase + w, vv];
  const down =
    (yTop: number) =>
    (u: number, vv: number, w: number): V3 => [u, yTop - w, vv];

  // ---- the battery bay: one continuous case, extended past the board's bottom end --------------------------------------
  // from the board's edge down: a divider wall with the wire slot, the 4 x AAA holder lying flat, then the microphone mouthpiece
  const { L: hL, Wd: hW, T: hT } = v.holder;
  const bx = W / 2;
  const hx0 = bx - hL / 2;
  const hx1 = bx + hL / 2;
  const px0 = hx0 - SLK;
  const px1 = hx1 + SLK;
  const pz0 = H + FIT + 3.0; // the bay's inside starts here (a 3 mm divider wall from the board's edge)
  const hz0 = pz0 + HOLD_GAP; // the holder's near end: the leads come down in the gap
  const hz1 = hz0 + hW;
  const zm = hz1 + SLK + 1.0 + CUP_R; // the capsule's center
  const pz1 = zm + CUP_R + 1.5;
  const bayOuter = rect(px0 - WALL, H - 3, px1 + WALL, pz1 + WALL, 2.5);
  const bayPocket = rect(px0, pz0, px1, pz1, 1.5);
  const floorBottom = -(v.backMax + 1.5 + FLOOR);
  const hTray = -floorBottom;
  const floorTop = floorBottom + FLOOR;
  const hy0 = floorTop + 0.5; // the holder rests on the floor (the door's plug is flush with it)
  const hy1 = hy0 + hT;
  const hyc = (hy0 + hy1) / 2;
  if (hy1 > Hf - LIP - 0.4) throw new Error('the holder does not fit under the cover: top ' + hy1.toFixed(1) + ', cover underside ' + (Hf - LIP).toFixed(1));
  const capY1 = Hf - LIP - 0.6; // the capsule's face, 0.2 mm under the cover (the grille holes are in the cover over it)
  const capY0 = capY1 - 6.5;
  const bayInfo = { holder: [hx0, hy0, hz0, hx1, hy1, hz1], capsule: [bx - 4.85, capY0, zm - 4.85, bx + 4.85, capY1, zm + 4.85] };
  const wireXs = [...v.btPads, ...v.micPads].map((p) => p[0]);
  const wx0 = Math.min(...wireXs) - 2.2;
  const wx1 = Math.max(...wireXs) + 2.2;

  // ---- back tray (one piece with the bay) ---------------------------------------------------------------------------
  const btIn = { x0: hx0 + 2, z0: hz0 + 2, x1: hx1 - 2, z1: hz1 - 2 };
  const door = rect(btIn.x0, btIn.z0, btIn.x1, btIn.z1, 3);
  {
    let tray: D3 = subtract3(union3(slabW(board(WALL), 0, hTray), slabW(bayOuter, 0, hTray)), slabW(board(FIT), FLOOR, hTray + 1), slabW(bayPocket, FLOOR, hTray + 1));
    tray = union3(tray, ...v.holes.map(([x, z]) => cyl(x, z, Math.max(2.6, Math.min(4.6, roomAt(v, 'back', x, z, BACK_Y, -hTray))), 0, hTray)));
    // crush ribs that keep the holder from rattling: 0.6 mm off it when it sits centered
    const wTop = Math.min(hy1 - floorBottom, hTray - 0.2); // the tray ends at the board's back plane; a taller holder is held by the cover's ribs above
    const ribs: D3[] = [];
    for (const zr of [hz0 + 8, hz1 - 9.2]) {
      ribs.push(slabW(rect(px0 - 0.5, zr, px0 + SLK - 0.6, zr + 1.2, 0.3), FLOOR - 0.5, wTop));
      ribs.push(slabW(rect(px1 - SLK + 0.6, zr, px1 + 0.5, zr + 1.2, 0.3), FLOOR - 0.5, wTop));
    }
    for (const xr of [hx0 + 6, hx1 - 7.2]) {
      ribs.push(slabW(rect(xr, hz1 + 0.6, xr + 1.2, hz1 + 1.8, 0.3), FLOOR - 0.5, wTop));
      ribs.push(slabW(rect(xr, pz0 - 0.5, xr + 1.2, hz0 - 0.2, 0.3), FLOOR - 0.5, wTop)); // on the divider; stands off 0.2 mm from the holder's end
    }
    const cuts: D3[] = [...notchesFor(v, 'back'), ...v.holes.map(([x, z]) => cyl(x, z, 1.7, -1, hTray + 1))];
    cuts.push(slabW(door, -1, FLOOR + 1)); // the door's window
    cuts.push(slabW(rect(wx0, H + FIT - 0.1, wx1, pz0 + 0.1, 0.3), -3.8 - floorBottom, hTray + 1)); // the leads' slot through the divider, open at the top
    if (v.wheel) {
      const [wxp, wzp] = v.wheel;
      cuts.push(slabW(rect(wxp - 4, wzp - 6.3, W + WALL + 1, wzp + 6.3, 0.3), -11.8 - floorBottom, hTray + 1)); // the thumbwheel's slot in the side wall
    }
    out.push({
      id: 'back-tray',
      label: 'Back tray with the battery bay (closed back: the QR codes and Dex are seen when the case is open)',
      group: 'shell',
      side: 'back',
      color: [0.3, 0.44, 0.72],
      printed: true,
      field: subtract3(union3(tray, ...ribs), ...cuts),
      box: boxAround(-WALL, -WALL, W + WALL, pz1 + WALL, hTray, 1),
      cell: 0.6,
      place: up(floorBottom),
    });
  }

  // ---- dial group -------------------------------------------------------------------------------------------------
  const R = dial.R;
  const toDial =
    (yp: (u: number, vv: number, w: number) => V3) =>
    (u: number, vv: number, w: number): V3 =>
      yp(cx + u, cz + vv, w);
  const polar = (deg: number, r: number): [number, number] => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)];
  const dbox = (r: number, h: number): ShellPart['box'] => ({ min: [-r - 1, -r - 1, -1], max: [r + 1, r + 1, h + 1] });
  const orange: V3 = [0.95, 0.55, 0.15];
  {
    const holes = dial.digitDeg.map((a) => {
      const [u, vv] = polar(a, dial.ring);
      return cyl(u, vv, dial.holeD / 2, -1, 5);
    });
    out.push({
      id: 'dial-plate',
      label: 'Rotary dial (10 finger holes)',
      group: 'dial',
      side: 'front',
      color: orange,
      printed: true,
      field: subtract3(cyl(0, 0, R, 0, 3.2), cyl(0, 0, 1.8, -1, 5), ...holes),
      box: dbox(R, 3.2),
      cell: 0.6,
      place: toDial(down(plateTop)),
    });
  }
  {
    // cam teeth: the pulse ring has ten ramps (one per digit of travel), the off-normal ring one raised sector. Printed attach face
    // down; the tooth height w rises 1.4 mm along each ramp and drops back at once. Teeth reach toward the switch (y falls with w).
    const tooth = (x: number, z: number) => {
      const ang = ((Math.atan2(x, -z) * 180) / Math.PI + 360) % 360;
      return ((ang * 10) / 360) % 1;
    };
    const pulseR = Math.hypot(v.pulse[0] - cx, v.pulse[1] - cz);
    const offR = Math.hypot(v.offNormal[0] - cx, v.offNormal[1] - cz);
    const offAng = ((Math.atan2(v.offNormal[0] - cx, -(v.offNormal[1] - cz)) * 180) / Math.PI + 360) % 360;
    const field: D3 = (x, z, w) => {
      const r = Math.hypot(x, z);
      const ring = (r0: number, r1: number) => Math.max(r0 - r, r - r1);
      const ang = ((Math.atan2(x, -z) * 180) / Math.PI + 360) % 360;
      const dOff = Math.abs(((((ang - offAng) % 360) + 540) % 360) - 180);
      const hP = 0.6 + 1.4 * Math.min(1, tooth(x, z) * 1.25);
      const hO = dOff < 52 ? 2.0 : 0.6;
      const d1 = Math.max(ring(pulseR - 1.0, pulseR + 1.0), -w, w - hP);
      const d2 = Math.max(ring(offR + 1.0, offR + 2.8), -w, w - hO);
      const d0 = Math.max(ring(6.2, Math.max(11.4, offR + 2.8, pulseR + 1) + 0.2), -w, w - 0.6);
      return Math.min(d0, d1, d2);
    };
    out.push({
      id: 'dial-cam',
      label: 'Pulse cam and off-normal cam (ramped teeth)',
      group: 'dial',
      side: 'front',
      color: [0.88, 0.42, 0.1],
      printed: true,
      field,
      box: dbox(12, 2.1),
      cell: 0.45,
      place: toDial(down(plateBottom)),
    });
  }
  {
    // flat spiral return spring under the plate: as many turns of a 0.9 mm strip, as tall, as the switches beside it leave room for
    const r0 = 2.8;
    const pitch = 1.2;
    // the tallest spring (1.4 mm down to 0.6) that still leaves a disc 4.6 mm wide clear of the switch bodies beside it
    const fit = (h: number) => Math.min(7, roomAt(v, 'front', cx, cz, plateBottom - h, plateBottom));
    const springH = [1.4, 1.2, 1.0, 0.8].find((h) => fit(h) >= 4.6) ?? 0.6;
    const rMax = fit(springH);
    const turns = Math.max(0.6, Math.min(1.6, (rMax - 0.45 - r0) / pitch));
    const strip = (x: number, z: number): number => {
      const r = Math.hypot(x, z);
      const th = (Math.atan2(z, x) + 2 * Math.PI) % (2 * Math.PI);
      let best = Infinity;
      for (let k = Math.max(0, Math.floor((r - r0) / pitch - th / (2 * Math.PI)) - 1); k <= Math.ceil((r - r0) / pitch - th / (2 * Math.PI)) + 1; k++) {
        const t = th / (2 * Math.PI) + k;
        if (t < 0 || t > turns) continue;
        best = Math.min(best, Math.abs(r - (r0 + pitch * t)) - 0.45);
      }
      return best;
    };
    out.push({
      id: 'dial-spring',
      label: 'Return spring (flat spiral)',
      group: 'dial',
      side: 'front',
      color: [0.75, 0.75, 0.8],
      printed: true,
      field: (x, z, w) => Math.max(strip(x, z), -w, w - springH),
      box: dbox(7, springH),
      cell: springH < 1 ? 0.2 : 0.4,
      place: toDial(down(plateBottom)),
    });
  }
  {
    const h = plateTop + 0.4 - 1.6;
    // a pin as thick as the gap between the switch bodies allows (Deluxe: 1.6 mm, no bore), else the 3 mm post with a screw bore
    const postR = Math.max(0.7, Math.min(1.5, roomAt(v, 'front', cx, cz, FRONT_Y, FRONT_Y + h)));
    const footR = Math.max(postR, Math.min(4.2, roomAt(v, 'front', cx, cz, FRONT_Y, FRONT_Y + 1.6)));
    out.push({
      id: 'dial-post',
      label: 'Pivot post (glue the foot to the board)',
      group: 'dial',
      side: 'front',
      color: [0.9, 0.9, 0.92],
      printed: true,
      field: subtract3(union3(cyl(0, 0, footR, 0, 1.6), cyl(0, 0, postR, 0, h)), cyl(0, 0, postR > 1.3 ? 0.9 : 0, 1.6, h + 1)),
      box: dbox(4.2, h),
      cell: 0.4,
      place: toDial(up(1.6)),
    });
  }
  {
    const h = plateTop + 2.0 - 1.6;
    // the stop stands 3 mm outside the plate, or farther out (its arm grows to match) where a lead stub or part is in the way
    const roomOut = (d: number) => {
      const [a, b] = polar(dial.stopDeg, R + 3.0 + d);
      return roomAt(v, 'front', cx + a, cz + b, FRONT_Y, FRONT_Y + h);
    };
    const steps = Array.from({ length: 25 }, (_, i) => i * 0.5);
    const out0 = steps.find((d) => roomOut(d) >= 2.0) ?? steps.reduce((best, d) => (roomOut(d) > roomOut(best) ? d : best), 0);
    const [su, sv] = polar(dial.stopDeg, R + 3.0 + out0);
    const px = cx + su;
    const pz = cz + sv;
    const stopR = Math.max(1.0, Math.min(2.0, roomOut(out0)));
    wellR = R + 3.0 + out0 + stopR + 2.2;
    const footR = Math.max(stopR, Math.min(3.4, roomAt(v, 'front', px, pz, FRONT_Y, FRONT_Y + 1.2)));
    const toward = polar(dial.stopDeg + 180, 1);
    const arm = capsule2(0, 0, toward[0] * (5 + out0), toward[1] * (5 + out0), 1.5);
    const arm3: D3 = (x, z, w) => Math.max(arm(x, z), Math.abs(w - (h - 0.8)) - 0.8);
    out.push({
      id: 'dial-stop',
      label: 'Finger stop (glue the foot to the board)',
      group: 'dial',
      side: 'front',
      color: [0.9, 0.9, 0.92],
      printed: true,
      field: union3(cyl(0, 0, footR, 0, 1.2), cyl(0, 0, stopR, 0, h), arm3),
      box: { min: [-10 - out0, -10 - out0, -1], max: [10 + out0, 10 + out0, h + 1] },
      cell: 0.4,
      place: (u, vv, w) => [px + u, 1.6 + w, pz + vv],
    });
  }
  v.buttons.forEach(([bx2, bz2], i) => {
    // a stem through the cover's hole, standing 0.5 mm proud, with a flange under the cover that holds it in (printed socket down)
    const yTop = Hf + 0.5;
    const h = yTop - 5.7;
    const yFl = Hf - LIP - 0.3; // the flange's top, 0.3 mm under the cover
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

  // ---- front cover: a real cover over the board and the bay, with openings only where needed ------------------------
  // printed face down on the bed (the roof is the first layers), so nothing overhangs; the text is engraved into the face
  {
    const r2 = (d2: D2): D3 => slabW(d2, -1, LIP + 0.01);
    const outer = union3(slabW(board(WALL), 0, hFront), slabW(bayOuter, 0, Hf));
    const pockets = [slabW(board(FIT), LIP, Hf + 1), slabW(bayPocket, LIP, Hf + 1)];
    const bosses = union3(
      ...v.holes.map(([x, z]) => cyl(x, z, Math.max(2.6, Math.min(4.6, roomAt(v, 'front', x, z, FRONT_Y, FRONT_Y + hFront - 1.6))), 0, hFront)),
    );
    const pilot = union3(...v.holes.map(([x, z]) => cyl(x, z, 1.4, -1, hFront + 1)));
    const holes: D3[] = [];
    holes.push(r2(circle2(wellR, cx, cz))); // the dial's well: the plate, cam and finger stop are separate parts that drop in
    for (const [x0, z0, x1, z1] of v.displays) holes.push(r2(rect(x0 - 1.2, z0 - 1.2, x1 + 1.2, z1 + 1.2, 1))); // the 7-segment window (a clear or tinted insert is optional)
    for (const [x, z] of v.buttons) holes.push(r2(circle2(5.4, x, z))); // the TALK and CLEAR caps come through
    // earpiece grille over the speaker: a hex pattern of 2 mm holes inside the cone
    for (let j = -4; j <= 4; j++)
      for (let i = -4; i <= 4; i++) {
        const gx = v.speaker[0] + (i + (j % 2 ? 0.5 : 0)) * 3.4;
        const gz = v.speaker[1] + j * 2.94;
        if (Math.hypot(gx - v.speaker[0], gz - v.speaker[1]) <= 9.2) holes.push(r2(circle2(1.0, gx, gz)));
      }
    // mouthpiece grille over the capsule: seven 1.4 mm holes
    holes.push(r2(circle2(0.7, bx, zm)));
    for (let k = 0; k < 6; k++) holes.push(r2(circle2(0.7, bx + 2.7 * Math.cos((k * Math.PI) / 3), zm + 2.7 * Math.sin((k * Math.PI) / 3))));
    // the name, engraved 0.5 mm into the face over the bay
    const name = strokeText2(['THE POCKET', 'TELEPHONE'], 3.4, 0.6, 0, 0);
    const engrave: D3 = (x, z, w) => Math.max(name(x - bx, z - (pz0 + hz1) / 2), w - 0.5);
    // the capsule's collar hangs from the roof; two ribs hold the holder down
    const collar: D3 = subtract3(cyl(bx, zm, CUP_R, LIP - 0.01, LIP + 4.5), cyl(bx, zm, 5.25, LIP - 0.5, LIP + 5));
    const wRib = Hf - hy1 - 0.6;
    const roofRibs = [hx0 + 4, hx1 - 5.2].map((xr) => slabW(rect(xr, hz0 + 3, xr + 1.2, hz1 - 3, 0.3), LIP - 0.01, wRib));
    out.push({
      id: 'front-cover',
      label: 'Front cover (dial well, display window, caps, speaker and mouthpiece grilles)',
      group: 'shell',
      side: 'front',
      color: [0.34, 0.5, 0.78],
      printed: true,
      field: subtract3(union3(subtract3(outer, ...pockets), bosses, collar, ...roofRibs), pilot, ...holes, engrave, ...notchesFor(v, 'front')),
      box: boxAround(-WALL, -WALL, W + WALL, pz1 + WALL, Hf, 1),
      cell: 0.5,
      place: (u, vv, w) => [u, Hf - w, vv] as V3,
    });
  }

  // ---- battery: box, four off-brand AAA cells, door, the leads, the microphone capsule and its wires ----------------
  const box3 = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): D3 => (x, y, z) =>
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
    // its twisted pair: from the pads along the back of the board, over the holder (a little above it where the holder is tall), up to the capsule
    const wy = Math.max(-1.3, hy1 + 1.2);
    v.micPads.forEach(([x, z], k) => {
      const t = 0.5;
      const zr2 = pz0 + 2.0;
      wire(`MK1-wire${k + 1}`, k === 0 ? 'Microphone wire (+, red) twisted pair' : 'Microphone wire (-, black) twisted pair', 'components', k === 0 ? red : blk, [
        [x - t, x + t, -1.8, -0.8, z + 5.2, zr2 + t],
        [x - t, x + t, Math.min(-1.8, wy - t), Math.max(-0.8, wy + t), zr2 - t, zr2 + t],
        [x - t, x + t, wy - t, wy + t, zr2 - t, zm + t],
        [x - t, x + t, Math.min(wy - t, capY0 - 1), Math.max(wy + t, capY0), zm - t, zm + t],
      ]);
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
      field: subtract3(slabW(rect(hx0, hz0, hx1, hz1, 2), 0, hBox), slabW(rect(hx0 + BOX_WALL, hz0 + BOX_WALL, hx1 - BOX_WALL, hz1 - BOX_WALL, 1), BOX_WALL, hBox + 1)),
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
      place: (u, vv, w) => [u, floorBottom - 1.6 + w, vv],
    });
  }
  return { parts: out, bay: bayInfo };
}
