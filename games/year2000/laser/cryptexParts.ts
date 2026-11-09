// "In The Year 2000!" cryptex: the cut shape and the engraving of every part, from the measurements in cryptexDims.ts.
// Part coordinates are millimeters on the flat piece, y down, seen from the face that lies up on the sheet (one pass, no flip).
// Every word is already in games/year2000 (the title, the Teleport-A-Phone, "bring a quarter", the teleporter's BZZZT).
// No people are drawn. The pictures are convex shapes only: a phone booth, a moon, three stars.
import { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { rectPoly } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import {
  BASE,
  CORE,
  DIGITS,
  HEAD_R,
  LID,
  PX,
  POCKET,
  RINGS,
  SOCKET_FIT,
  STEP,
  WASHER,
  coreShape,
  decagon,
  digitRadius,
  pocketHole,
  washerHole,
} from './cryptexDims';

export interface Made {
  part: Part;
  qty: number;
  note: string;
}
export type Parts = Record<string, Made>;

const at = (pts: readonly Pt[], x: number, y: number): Pt[] => pts.map(([a, b]) => [a + x, b + y] as Pt);
const quad = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
const diamond = (cx: number, cy: number, r: number): Pt[] => [
  [cx, cy - r],
  [cx + r * 0.7, cy],
  [cx, cy + r],
  [cx - r * 0.7, cy],
];

export function makeParts(kerf: number): Parts {
  const parts: Parts = {};
  const add = (name: string, w: number, h: number, qty: number, note: string) => {
    const part = new Part(name, w, h, kerf);
    parts[name] = { part, qty, note };
    return part;
  };
  const disc = (name: string, r: number, qty: number, note: string) => {
    const p = add(name, 2 * r, 2 * r, qty, note);
    p.outlineRound(r, r, r);
    return p;
  };

  // --- the base: a floor, with the reading mark, the title and a few pictures --------------------------------------
  const base = add('BASE', BASE, BASE, 1, 'floor of the base (the core stands on it)');
  base.outline(rectPoly([0, 0, BASE, BASE]));
  const c = BASE / 2;
  base.text('IN THE YEAR 2000!', 'pc', c, 4, PX);
  base.text('TELEPORT-A-PHONE', 'pc', c, BASE - 4, PX);
  base.engrave('reading mark', [
    [
      [c + 51, c],
      [c + 55.5, c - 2.5],
      [c + 55.5, c + 2.5],
    ],
  ]);
  base.engrave('phone booth roof', [quad(4, 88, 15, 91)]);
  base.engrave('phone booth panes', [quad(5, 92, 9, 97), quad(10, 92, 14, 97), quad(5, 98, 9, 103), quad(10, 98, 14, 103)]);
  base.engraveRound('moon', 11, 13, 5);
  base.engrave('stars', [diamond(94, 14, 2.6), diamond(102, 24, 2.2), diamond(88, 22, 1.8)]);

  // --- the pocket plates: the base's walls round the core's ridge ---------------------------------------------------
  const pk = disc('PK', RINGS[3], POCKET.plates, 'pocket plate (glue four on the floor, slots lined up)');
  pk.hole('ridge slot', at(pocketHole(), RINGS[3], RINGS[3]));

  // --- the rings: two slices each, the top slice carries the digits -------------------------------------------------
  RINGS.forEach((R, k) => {
    for (const side of ['T', 'B']) {
      const p = disc(
        `R${k + 1}${side}`,
        R,
        1,
        side === 'T' ? `ring ${k + 1}, top slice with the digits` : `ring ${k + 1}, plain slice (glue under the top slice)`,
      );
      p.hole('washer socket', at(decagon(WASHER.apothem + SOCKET_FIT), R, R));
      if (side === 'T')
        for (let j = 0; j < DIGITS; j++) {
          const a = (j * STEP * Math.PI) / 180;
          p.text(String(j), 'pc', R + digitRadius(k) * Math.cos(a), R + digitRadius(k) * Math.sin(a), PX);
        }
    }
  });

  // --- the washers: where the notch is seated sets the digit ---------------------------------------------------------
  const wr = WASHER.apothem / Math.cos(Math.PI / DIGITS);
  const wash = add('WASH', 2 * wr, 2 * wr, 8, 'washer (glue in pairs; the notch is the combination)');
  wash.outline(at(decagon(WASHER.apothem), wr, wr));
  wash.hole('bore and notch', at(washerHole(), wr, wr));

  // --- the core: a hollow tube, closed at the bottom, ridge near the bottom -----------------------------------------
  const cw = 2 * CORE.ridgeOut;
  const core0 = add('CORE0', cw, cw, 1, 'core slice 1 (bottom, closed, with the ridge)');
  core0.outline(at(coreShape(), CORE.ridgeOut, CORE.ridgeOut));
  const coreR = add('CORER', cw, cw, CORE.ridgeSlices - 1, 'core slices 2 and 3 (hollow, with the ridge; ridges all on one side)');
  coreR.outline(at(coreShape(), CORE.ridgeOut, CORE.ridgeOut));
  coreR.holeRound('bore', CORE.ridgeOut, CORE.ridgeOut, CORE.bore);
  const coreC = disc('COREC', CORE.r, CORE.roundSlices, 'core slices 4 to 12 (hollow, round)');
  coreC.holeRound('bore', CORE.r, CORE.r, CORE.bore);
  const head = disc('HEAD', HEAD_R, 1, 'head (glue on the core last, above the rings)');
  head.holeRound('bore', HEAD_R, HEAD_R, CORE.bore);
  const lid = disc('LID', LID.r, 1, 'lid (glue two plugs under it)');
  lid.text('BZZZT', 'pc', LID.r, LID.r, PX);
  disc('LIDP', LID.plug, 2, 'lid plug (press fit in the core)');
  return parts;
}
