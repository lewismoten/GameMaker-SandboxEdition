// "In The Year 2000!" cryptex: the cut shape and the engraving of every part, from the measurements in cryptexDims.ts.
// Part coordinates are millimeters on the flat piece, y down, seen from the face that lies up on the sheet (one pass, no flip).
// Every word is already in games/year2000 (the title, the Teleport-A-Phone, "bring a quarter", the teleporter's BZZZT).
// No people are drawn. Convex phone booths, moons, stars and a teleporter platform stay off every glue footprint.
import { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { rectPoly } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import {
  BASE,
  CORE,
  DIGITS,
  HEAD_R,
  LID,
  COLLAR_R,
  PX,
  PX_ID,
  RINGS,
  SLICE_HOLE,
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
  /** Which way the engraved sheet face points after assembly. No part is flipped at the laser. */
  face: 'up' | 'down';
  /** Safe regions on unglued faces, in nominal part coordinates; checked against every hidden engraving. */
  hidden: { label: string; from: number; to: number; cx: number; cy: number; r0: number; r1: number }[];
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
    parts[name] = { part, qty, note, face: 'up', hidden: [] };
    return part;
  };
  const disc = (name: string, r: number, qty: number, note: string) => {
    const p = add(name, 2 * r, 2 * r, qty, note);
    p.outlineRound(r, r, r);
    return p;
  };
  const hidden = (p: Part, label: string, cx: number, cy: number, r0: number, r1: number, draw: () => void) => {
    const from = p.sheet.items.length;
    draw();
    parts[p.name].hidden.push({ label, from, to: p.sheet.items.length, cx, cy, r0, r1 });
  };
  const star = (p: Part, x: number, y: number, r = 0.6) => p.engrave('hidden stars', [diamond(x, y, r)]);
  const booth = (p: Part, x: number, y: number) =>
    p.engrave('hidden phone booth', [
      quad(x - 3, y - 3, x + 3, y - 2),
      quad(x - 2.6, y - 1.5, x - 0.4, y + 1),
      quad(x + 0.4, y - 1.5, x + 2.6, y + 1),
      quad(x - 2.6, y + 1.8, x + 2.6, y + 3),
    ]);

  // --- the base: a floor, with the reading mark, the title and a few pictures --------------------------------------
  const base = add('A1', BASE, BASE, 1, 'base stack A, layer 1: the floor (the core stands on it)');
  base.outline(rectPoly([0, 0, BASE, BASE]));
  const c = BASE / 2;
  hidden(base, 'floor beneath the removable core', c, c, 0, CORE.r - 1, () => {
    base.text('A1', 'pc', c, c + 5, PX_ID);
    booth(base, c, c - 2);
  });
  hidden(base, 'teleporter in the base hollow', c, c, COLLAR_R + 1, SLICE_HOLE[3] - 1, () => {
    base.text('BZZZT', 'pc', c, c - 29, PX_ID);
    base.engrave('hidden teleporter', [quad(c - 6, c + 26, c + 6, c + 27), quad(c - 4, c + 29, c + 4, c + 30)]);
    star(base, c - 28, c, 1.5);
  });
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

  // --- the pocket plates, each in two parts: an outer ring and a collar round the ridge slot ---------------------------------------
  // (the interior between them is empty, and the sheets nest small parts there). IDs: A2R..A5R (R: the ring), A2C..A5C (C: the collar), bottom to top.
  const idAt = (p: Part, id: string, x: number, y: number) => p.text(id, 'pc', x, y, PX_ID);
  for (let n = 2; n <= 5; n++) {
    const o = disc(`A${n}R`, RINGS[3], 1, `base stack A, layer ${n}, outer ring (glue on the layer below, edges flush)`);
    o.holeRound('hollow', RINGS[3], RINGS[3], SLICE_HOLE[3]);
    if (n === 5)
      hidden(o, 'top of the base rim, under ring 4', RINGS[3], RINGS[3], SLICE_HOLE[3], RINGS[3], () => {
        idAt(o, `A${n}R`, RINGS[3], RINGS[3] - (RINGS[3] + SLICE_HOLE[3]) / 2);
        star(o, RINGS[3] + 43, RINGS[3], 1.3);
      });
    const i = disc(`A${n}C`, COLLAR_R, 1, `base stack A, layer ${n}, collar round the ridge slot (ridge slots lined up, on the marker side)`);
    i.hole('ridge slot', at(pocketHole(), COLLAR_R, COLLAR_R));
    if (n === 5)
      hidden(i, 'top of the collar, under the loose washers', COLLAR_R, COLLAR_R, 12.3, COLLAR_R, () => {
        idAt(i, `A${n}C`, COLLAR_R, COLLAR_R - 15.6);
        star(i, COLLAR_R - 15.6, COLLAR_R, 0.7);
      });
  }

  // --- the rings: a plain slice with a round hole (a rim) under a top slice with the digits ------------------------------------------
  // Stack letters B (ring 4), C (ring 3), D (ring 2), E (ring 1). Plain-slice art faces down, away from its top glue joint.
  // Top-slice hidden art lies under the next loose ring; only the outer digit band remains visible.
  RINGS.forEach((R, k) => {
    const L = 'EDCB'[k];
    for (const [layer, side] of [
      [1, 'B'],
      [2, 'T'],
    ] as const) {
      const id = `${L}${layer}`;
      const p = disc(
        id,
        R,
        1,
        side === 'T' ? `ring ${k + 1} (stack ${L}), top slice with the digits` : `ring ${k + 1} (stack ${L}), plain slice: a rim under the top slice`,
      );
      if (side === 'B') {
        p.holeRound('hollow', R, R, SLICE_HOLE[k]);
        parts[id].face = 'down';
        hidden(p, 'inside of ring, downward face; glue only the blank reverse', R, R, SLICE_HOLE[k], R, () => {
          const mid = (R + SLICE_HOLE[k]) / 2;
          if (k === 0) star(p, R, R - mid, 0.45);
          else {
            idAt(p, id, R - mid, R);
            booth(p, R, R - mid);
          }
        });
      } else {
        p.hole('washer socket', at(decagon(WASHER.apothem + SOCKET_FIT), R, R));
        if (k > 0)
          hidden(p, 'top face under the next loose ring', R, R, 20, RINGS[k - 1], () => {
            idAt(p, id, R, R - 23.5);
            p.engraveRound('hidden moon', R - 23.5, R, 1.3);
            star(p, R, R + 23.5, 1);
          });
        for (let j = 0; j < DIGITS; j++) {
          const a = (j * STEP * Math.PI) / 180;
          p.text(String(j), 'pc', R + digitRadius(k) * Math.cos(a), R + digitRadius(k) * Math.sin(a), PX);
        }
      }
    }
  });

  // --- the washers: where the notch is seated sets the digit; G<n> is the pair for ring n ----------------------------------------------
  const wr = WASHER.apothem / Math.cos(Math.PI / DIGITS);
  for (let n = 1; n <= 4; n++) {
    for (const bottom of [true, false]) {
      const id = `G${n}${bottom ? 'B' : ''}`;
      const wash = add(
        id,
        2 * wr,
        2 * wr,
        1,
        `washer pair G${n}: ${bottom ? 'blank lower' : 'engraved upper'} washer; glue blank faces together, notch aligned`,
      );
      wash.outline(at(decagon(WASHER.apothem), wr, wr));
      wash.hole('bore and notch', at(washerHole(), wr, wr));
      if (!bottom)
        hidden(wash, 'upper washer face; glue only the blank reverse', wr, wr, WASHER.bore, WASHER.apothem, () => {
          idAt(wash, `G${n}`, wr, wr - 15.6);
          wash.engraveRound('hidden moon', wr - 15.4, wr, 1.1);
          star(wash, wr, wr + 15.5, 0.7);
        });
    }
  }

  // --- the core: a hollow tube, closed at the bottom, ridge near the bottom -----------------------------------------
  const cw = 2 * CORE.ridgeOut;
  const core0 = add('CORE0', cw, cw, 1, 'core F, slice 1 (bottom, closed, with the ridge)');
  core0.outline(at(coreShape(), CORE.ridgeOut, CORE.ridgeOut));
  hidden(core0, 'floor inside the hollow core; keep the entire wall glue annulus blank', CORE.ridgeOut, CORE.ridgeOut, 0, CORE.bore - 0.5, () => {
    core0.text('BZZZT', 'pc', CORE.ridgeOut, CORE.ridgeOut, PX_ID);
    star(core0, CORE.ridgeOut, CORE.ridgeOut - 4, 0.8);
  });
  const coreR = add('CORER', cw, cw, CORE.ridgeSlices - 1, 'core slices 2 and 3 (hollow, with the ridge; ridges all on one side)');
  coreR.outline(at(coreShape(), CORE.ridgeOut, CORE.ridgeOut));
  coreR.holeRound('bore', CORE.ridgeOut, CORE.ridgeOut, CORE.bore);
  const coreC = disc('COREC', CORE.r, CORE.roundSlices, 'core slices 4 to 12 (hollow, round)');
  coreC.holeRound('bore', CORE.r, CORE.r, CORE.bore);
  const head = disc('HEAD', HEAD_R, 1, 'head (glue on the core last, above the rings)');
  head.holeRound('bore', HEAD_R, HEAD_R, CORE.bore);
  parts.HEAD.face = 'down';
  hidden(head, 'underside of head, outside the core glue joint', HEAD_R, HEAD_R, CORE.r + 1, HEAD_R - 1, () => {
    head.text('2000', 'pc', HEAD_R, HEAD_R - 16, PX_ID);
    head.engraveRound('hidden moon', HEAD_R - 16, HEAD_R, 1.3);
    star(head, HEAD_R + 16, HEAD_R, 1.1);
  });
  const lid = disc('LID', LID.r, 1, 'lid (glue two plugs under it)');
  parts.LID.face = 'down';
  hidden(lid, 'underside of lid, outside the plug glue joint', LID.r, LID.r, LID.plug + 0.7, LID.r - 0.7, () => {
    lid.text('BZZZT', 'micro', LID.r, LID.r - 10.8, 0.5);
    star(lid, LID.r, LID.r + 10.7, 0.8);
  });
  disc('LIDP', LID.plug, 2, 'lid plug (press fit in the core)');
  return parts;
}
