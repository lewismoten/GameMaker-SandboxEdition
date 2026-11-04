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
import type { Variant } from './shellInput';

export type V3 = [number, number, number];

export interface ShellPart {
  id: string;
  label: string;
  group: 'shell' | 'dial' | 'battery';
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

const rect = (x0: number, z0: number, x1: number, z1: number, r = 1.5): D2 => roundRect2((x1 - x0) / 2, (z1 - z0) / 2, r, (x0 + x1) / 2, (z0 + z1) / 2);
const cyl = (cx: number, cz: number, r: number, w0: number, w1: number): D3 => extrude(circle2(r, cx, cz), w0, w1);
const boxAround = (x0: number, z0: number, x1: number, z1: number, w1: number, pad = 1): ShellPart['box'] => ({
  min: [x0 - pad, z0 - pad, -1],
  max: [x1 + pad, z1 + pad, w1 + 1],
});
const slabW = (d2: D2, w0: number, w1: number): D3 => extrude(d2, w0, w1);
const ceil05 = (v: number) => Math.ceil(v * 2) / 2;

export function buildShell(v: Variant): ShellPart[] {
  const out: ShellPart[] = [];
  const { W, H, dial } = v;
  const board = (grow: number): D2 => roundRect2(W / 2 + grow, H / 2 + grow, 4 + grow, W / 2, H / 2);
  const [cx, cz] = dial.c;
  const swTop = v.swTop;

  // ---- heights the dial and shell share -------------------------------------------------------------------------
  const plateBottom = swTop + 1.7;
  const plateTop = plateBottom + 3.2;
  const Hf = ceil05(Math.max(v.frontMax + 1.5, plateTop + 2.5));
  const hFront = Hf - 1.6;

  // ---- front frame: lip down on the bed, walls up toward the board ----------------------------------------------
  {
    const frameBody = subtract3(slabW(board(WALL), 0, hFront), slabW(board(FIT), LIP, hFront + 1), slabW(rect(3.4, 3.4, W - 3.4, H - 3.4, 2), -1, hFront + 1));
    const bosses = union3(...v.holes.map(([x, z]) => cyl(x, z, 4.6, 0, hFront)));
    const pilot = union3(...v.holes.map(([x, z]) => cyl(x, z, 1.4, -1, hFront + 1)));
    out.push({
      id: 'front-frame',
      label: 'Front frame (open bezel)',
      group: 'shell',
      side: 'front',
      color: [0.34, 0.5, 0.78],
      printed: true,
      field: subtract3(union3(frameBody, bosses), pilot),
      box: boxAround(-WALL, -WALL, W + WALL, H + WALL, hFront, 1),
      cell: 0.95,
      place: (u, w, zz) => [u, Hf - zz, w] as V3,
    });
  }
  // place helper for parts whose local (u, v, w) are board x, board y, height up from a plane yBase (non-mirroring: y = yBase + w)
  const up =
    (yBase: number) =>
    (u: number, vv: number, w: number): V3 => [u, yBase + w, vv];
  const down =
    (yTop: number) =>
    (u: number, vv: number, w: number): V3 => [u, yTop - w, vv];

  // ---- back tray (and the handle) -------------------------------------------------------------------------------
  const depth = v.bt.handle ? v.backMax : Math.max(v.backMax, -v.bt.y0);
  const floorBottom = -(depth + 1.5 + FLOOR);
  const hTray = -floorBottom;
  const btIn = { x0: v.bt.x0 + 2, z0: v.bt.z0 + 2, x1: v.bt.x1 - 2, z1: v.bt.z1 - 2 };
  const door = rect(btIn.x0, btIn.z0, btIn.x1, btIn.z1, 3);
  const hx0 = v.bt.x0 - FIT;
  const hx1 = v.bt.x1 + FIT;
  {
    let tray: D3 = subtract3(slabW(board(WALL), 0, hTray), slabW(board(FIT), FLOOR, hTray + 1));
    tray = union3(tray, ...v.holes.map(([x, z]) => cyl(x, z, 4.6, 0, hTray)));
    const cuts: D3[] = v.holes.map(([x, z]) => cyl(x, z, 1.7, -1, hTray + 1));
    if (v.bt.handle)
      cuts.push(slabW(rect(hx0, H - 4, hx1, H + 6, 1), FLOOR, hTray + 1)); // the rim opens into the handle
    else cuts.push(slabW(door, -1, FLOOR + 1)); // the door's window
    for (const win of v.windows)
      if (win.z + win.h < H - 1) cuts.push(slabW(rect(win.x - 1.2, win.z - 1.2, win.x + win.w + 1.2, win.z + win.h + 1.2, 1), -1, FLOOR + 1));
    out.push({
      id: 'back-tray',
      label: 'Back tray (windows over the QR codes and Dex)',
      group: 'shell',
      side: 'back',
      color: [0.3, 0.44, 0.72],
      printed: true,
      field: subtract3(tray, ...cuts),
      box: boxAround(-WALL, -WALL, W + WALL, H + WALL, hTray, 1),
      cell: 0.95,
      place: up(floorBottom),
    });
  }
  const handleFloor = v.bt.y0 - FIT - FLOOR;
  if (v.bt.handle) {
    const hh = -handleFloor;
    const outer = rect(hx0 - WALL, H - 2.4, hx1 + WALL, v.bt.z1 + FIT + WALL, 2);
    const pocket = rect(hx0, H - 2.5, hx1, v.bt.z1 + FIT, 1);
    out.push({
      id: 'back-handle',
      label: 'Battery handle (below the board)',
      group: 'shell',
      side: 'back',
      color: [0.3, 0.44, 0.72],
      printed: true,
      field: subtract3(slabW(outer, 0, hh), slabW(pocket, FLOOR, hh + 1), slabW(door, -1, FLOOR + 1)),
      box: boxAround(hx0 - WALL, H - 2.4, hx1 + WALL, v.bt.z1 + FIT + WALL, hh, 1),
      cell: 0.95,
      place: up(handleFloor),
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
    // flat spiral return spring: 1.8 turns of a 0.9 mm strip, 3 mm tall, printed flat
    const r0 = 3.1;
    const pitch = 1.6;
    const turns = 1.6;
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
      field: (x, z, w) => Math.max(strip(x, z), -w, w - 3),
      box: dbox(7, 3),
      cell: 0.4,
      place: toDial(down(plateBottom)),
    });
  }
  {
    const h = plateTop + 0.4 - 1.6;
    out.push({
      id: 'dial-post',
      label: 'Pivot post (glue the foot to the board)',
      group: 'dial',
      side: 'front',
      color: [0.9, 0.9, 0.92],
      printed: true,
      field: subtract3(union3(cyl(0, 0, 4.2, 0, 1.6), cyl(0, 0, 1.5, 0, h)), cyl(0, 0, 0.9, 1.6, h + 1)),
      box: dbox(4.2, h),
      cell: 0.4,
      place: toDial(up(1.6)),
    });
  }
  {
    const [su, sv] = polar(dial.stopDeg, R + 3.0);
    const px = cx + su;
    const pz = cz + sv;
    const h = plateTop + 2.0 - 1.6;
    const toward = polar(dial.stopDeg + 180, 1);
    const arm = capsule2(0, 0, toward[0] * 5, toward[1] * 5, 1.5);
    const arm3: D3 = (x, z, w) => Math.max(arm(x, z), Math.abs(w - (h - 0.8)) - 0.8);
    out.push({
      id: 'dial-stop',
      label: 'Finger stop (glue the foot to the board)',
      group: 'dial',
      side: 'front',
      color: [0.9, 0.9, 0.92],
      printed: true,
      field: union3(cyl(0, 0, 3.4, 0, 1.2), cyl(0, 0, 2.0, 0, h), arm3),
      box: { min: [-9, -9, -1], max: [9, 9, h + 1] },
      cell: 0.4,
      place: (u, vv, w) => [px + u, 1.6 + w, pz + vv],
    });
  }
  v.buttons.forEach(([bx, bz], i) => {
    const h = 5.6;
    out.push({
      id: i === 0 ? 'cap-talk' : 'cap-clear',
      label: i === 0 ? 'TALK button cap' : 'CLEAR button cap',
      group: 'dial',
      side: 'front',
      color: i === 0 ? [0.15, 0.65, 0.3] : [0.85, 0.15, 0.12],
      printed: true,
      field: subtract3(cyl(0, 0, 4.8, 0, h), cyl(0, 0, 2.0, -1, 3.4)),
      box: { min: [-6, -6, -1], max: [6, 6, h + 1] },
      cell: 0.4,
      place: (u, vv, w) => [bx + u, 5.7 + w, bz + vv],
    });
  });

  // ---- battery: box, four off-brand AAA cells, door ---------------------------------------------------------------
  {
    const { x0, x1, z0, z1, y0, y1 } = v.bt;
    const hBox = y1 - y0;
    out.push({
      id: 'BT1',
      label: 'Battery box (4 x AAA)',
      group: 'battery',
      side: 'back',
      color: [0.22, 0.22, 0.25],
      printed: true,
      field: subtract3(slabW(rect(x0, z0, x1, z1, 2), 0, hBox), slabW(rect(x0 + BOX_WALL, z0 + BOX_WALL, x1 - BOX_WALL, z1 - BOX_WALL, 1), BOX_WALL, hBox + 1)),
      box: boxAround(x0, z0, x1, z1, hBox, 1),
      cell: 0.8,
      place: (u, vv, w) => [u, y1 - w, vv],
    });
    // cells lie along the longer side (x), four side by side across z
    const zc = (z0 + z1) / 2;
    const yc = y1 - BOX_WALL - CELL_D / 2 - 0.05;
    const len = 43.7;
    const xc = (x0 + x1) / 2;
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
    // the door: plate outside the floor, a plug in the window, a finger notch
    const plate = rect(btIn.x0 - 3, btIn.z0 - 3, btIn.x1 + 3, btIn.z1 + 3, 3);
    const plug = rect(btIn.x0 + FIT, btIn.z0 + FIT, btIn.x1 - FIT, btIn.z1 - FIT, 3);
    const doorFloor = v.bt.handle ? handleFloor : floorBottom;
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
      place: (u, vv, w) => [u, doorFloor - 1.6 + w, vv],
    });
  }
  return out;
}
