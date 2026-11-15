// "In The Year 2000!" cryptex: the cut shape and the engraving of every part, from the measurements in cryptexDims.ts.
// Part coordinates are millimeters on the flat piece, y down, seen from the face that lies up on the sheet (one pass, no flip).
// Words retain the game's title, Teleport-A-Phone and BZZZT, with the requested hidden "YOU FOUND IT. BZZZT!" message.
// Hidden pixel panoramas stay off every glue footprint; no people or vehicles are drawn.
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
  RINGS,
  SLICE_HOLE,
  SOCKET_FIT,
  STEP,
  T,
  WASHER,
  coreShape,
  decagon,
  digitRadius,
  pocketHole,
  washerHole,
} from './cryptexDims';
import { circuitBand, coreMessage, floorReveal, hollowTeleporter, medallion, ringScene, starfield } from './cryptexArt';

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

  // --- the base: a floor, with the reading mark, the title and a few pictures --------------------------------------
  const base = add('A1', BASE, BASE, 1, 'base stack A, layer 1: the floor (the core stands on it)');
  base.outline(rectPoly([0, 0, BASE, BASE]));
  for (const sign of [-1, 1])
    base.hole(
      'frame post socket',
      rectPoly([
        BASE / 2 + sign * LID.postX - LID.tenonW / 2 - 0.15,
        BASE / 2 + 12 - T / 2 - 0.15,
        BASE / 2 + sign * LID.postX + LID.tenonW / 2 + 0.15,
        BASE / 2 + 12 + T / 2 + 0.15,
      ]),
    );
  const c = BASE / 2;
  hidden(base, 'floor beneath the removable core', c, c, 0, CORE.r - 1, () => {
    floorReveal(base, c);
  });
  hidden(base, 'teleporter in the base hollow', c, c, COLLAR_R + 1, SLICE_HOLE[3] - 1, () => {
    hollowTeleporter(base, c, COLLAR_R, SLICE_HOLE[3]);
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
  for (let n = 2; n <= 5; n++) {
    const o = disc(`A${n}R`, RINGS[3], 1, `base stack A, layer ${n}, outer ring (glue on the layer below, edges flush)`);
    o.holeRound('hollow', RINGS[3], RINGS[3], SLICE_HOLE[3]);
    if (n < 5) o.text(`A${n}R`, 'micro', RINGS[3], (RINGS[3] - SLICE_HOLE[3]) / 2, 0.7);
    if (n === 5)
      hidden(o, 'top of the base rim, under ring 4', RINGS[3], RINGS[3], SLICE_HOLE[3], RINGS[3], () => {
        circuitBand(o, RINGS[3], SLICE_HOLE[3], RINGS[3], `A${n}R`, 0, false);
      });
    const i = disc(`A${n}C`, COLLAR_R, 1, `base stack A, layer ${n}, collar round the ridge slot (ridge slots lined up, on the marker side)`);
    i.hole('ridge slot', at(pocketHole(), COLLAR_R, COLLAR_R));
    if (n < 5) i.text(`A${n}C`, 'micro', COLLAR_R, COLLAR_R + (12.3 + COLLAR_R) / 2, 0.7);
    if (n === 5)
      hidden(i, 'top of the collar, under the loose washers', COLLAR_R, COLLAR_R, 12.3, COLLAR_R, () => {
        circuitBand(i, COLLAR_R, 12.3, COLLAR_R, `A${n}C`);
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
          if (k === 0) {
            starfield(p, R, SLICE_HOLE[k], R);
            p.text(id, 'micro', R, 2, 0.5);
          } else ringScene(p, R, SLICE_HOLE[k], R, (['suburb', 'moon', 'teleporter'] as const)[k - 1], id);
        });
      } else {
        p.hole('washer socket', at(decagon(WASHER.apothem + SOCKET_FIT), R, R));
        if (k > 0)
          hidden(p, 'top face under the next loose ring', R, R, 20, RINGS[k - 1], () => {
            ringScene(p, R, 20, RINGS[k - 1], (['suburb', 'moon', 'teleporter'] as const)[k - 1], id);
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
        `washer pair G${n}: ${bottom ? 'ID-marked lower' : 'artwork upper'} washer; glue mating faces together, outer decagon flats aligned`,
      );
      wash.outline(at(decagon(WASHER.apothem), wr, wr));
      if (bottom) wash.holeRound('tab rotation clearance', wr, wr, WASHER.notchOut);
      else wash.hole('bore and notch', at(washerHole(), wr, wr));
      if (bottom) wash.text(id, 'micro', wr, wr + 16.5, 0.5);
      if (!bottom)
        hidden(wash, 'upper washer face; glue only the blank reverse', wr, wr, WASHER.bore, WASHER.apothem, () => {
          circuitBand(wash, wr, WASHER.bore, WASHER.apothem, `G${n}`, n);
        });
    }
  }

  // --- the core: a downward-opening tube, closed at the top, ridge near the bottom -----------------------------------------
  const cw = 2 * CORE.ridgeOut;
  const core0 = add('CORE0', cw, cw, 1, 'core F, slice 13 (solid round ceiling, artwork down)');
  core0.outlineRound(CORE.ridgeOut, CORE.ridgeOut, CORE.r);
  parts.CORE0.face = 'down';
  hidden(core0, 'ceiling inside the hollow core; keep the entire wall glue annulus blank', CORE.ridgeOut, CORE.ridgeOut, 0, CORE.bore - 0.5, () => {
    coreMessage(core0, CORE.ridgeOut);
  });
  const coreR = add('CORER', cw, cw, CORE.ridgeSlices, 'core slices 5, 7, 9 and 11 (hollow, aligned ridge tabs)');
  coreR.outline(at(coreShape(), CORE.ridgeOut, CORE.ridgeOut));
  coreR.holeRound('bore', CORE.ridgeOut, CORE.ridgeOut, CORE.bore);
  const coreC = disc('COREC', CORE.r, CORE.roundSlices, 'core slices 1 to 4, 6, 8, 10 and 12 (hollow, round)');
  coreC.holeRound('bore', CORE.r, CORE.r, CORE.bore);
  const head = disc('HEAD', HEAD_R, 1, 'head (glue on the core last, above the rings)');
  head.holeRound('bore', HEAD_R, HEAD_R, CORE.bore);
  parts.HEAD.face = 'down';
  hidden(head, 'underside of head, outside the core glue joint', HEAD_R, HEAD_R, CORE.r + 1, HEAD_R - 1, () => {
    medallion(head, HEAD_R, CORE.r + 1, HEAD_R - 1.25, '2000');
  });
  // A fixed bridge captures the loose rings and washers; two glued posts capture it until the core is removed.
  const lid = add('LID', BASE, 46, 1, 'sliding retaining bridge (artwork down; never glue it)');
  const bridge: Pt[] = [
    [-57, 5],
    [-40, 5],
    [-20, -5],
    ...Array.from({ length: 61 }, (_, i) => {
      const a = Math.PI + (Math.PI * i) / 60;
      return [20 * Math.cos(a), 20 * Math.sin(a)] as Pt;
    }),
    [20, -5],
    [40, 5],
    [57, 5],
    [57, 23],
    [40, 23],
    [20, 5],
    ...Array.from({ length: 61 }, (_, i) => {
      const a = (Math.PI * i) / 60;
      return [20 * Math.cos(a), 20 * Math.sin(a)] as Pt;
    }),
    [-20, 5],
    [-40, 23],
    [-57, 23],
  ];
  lid.outline(at(bridge, BASE / 2, 23));
  lid.hole('core passage', at(washerHole(), BASE / 2, 23));
  for (const sign of [-1, 1]) {
    const x = BASE / 2 + sign * LID.postX,
      y = 23 + 12;
    const narrow = LID.tenonW / 2 + 0.15,
      wide = LID.postW / 2 + 0.15,
      halfT = T / 2 + 0.15;
    lid.hole('post keyhole', [
      [x - narrow, y - halfT],
      [x + narrow, y - halfT],
      [x + narrow, y + LID.release - halfT],
      [x + wide, y + LID.release - halfT],
      [x + wide, y + LID.release + halfT],
      [x - wide, y + LID.release + halfT],
      [x - wide, y + LID.release - halfT],
      [x - narrow, y + LID.release - halfT],
    ]);
  }
  parts.LID.face = 'down';
  hidden(lid, 'underside of captured bridge, clear of post keyholes', BASE / 2, 23, LID.plug + 0.7, LID.r - 0.7, () => {
    // medallion assumes equal x/y center; translate its paths to the bridge center.
    const from = lid.sheet.items.length;
    medallion(lid, LID.r, LID.plug + 1.5, LID.r - 1.75);
    for (const item of lid.sheet.items.slice(from)) if (item.k === 'poly') item.pts = item.pts.map(([x, y]) => [x + BASE / 2 - LID.r, y + 23 - LID.r] as Pt);
    // Leave the fixed ridge-passage notch and 1.5 mm around it clear of hidden pixels.
    const safe = lid.sheet.items
      .slice(from)
      .filter(
        (item) =>
          item.k !== 'poly' ||
          item.pts.every(([x, y]) => x < BASE / 2 + 2 || x > BASE / 2 + 2 + WASHER.notchOut + 1.7 || Math.abs(y - 25) > WASHER.notchHw + 1.7),
      );
    lid.sheet.items.splice(from, lid.sheet.items.length - from, ...safe);
    lid.elements[lid.elements.length - 1].to = lid.sheet.items.length;
  });
  const post = add('LIDP', LID.postW, 15 * T, 2, 'frame side post (glue only its foot into A1; mushroom top captures bridge)');
  const hw = LID.postW / 2,
    ht = LID.tenonW / 2,
    h = 15 * T;
  post.outline([
    [0, h],
    [2 * hw, h],
    [2 * hw, h - T],
    [hw + ht, h - T],
    [hw + ht, h - 2 * T],
    [2 * hw, h - 2 * T],
    [2 * hw, T],
    [hw + ht, T],
    [hw + ht, 0],
    [hw - ht, 0],
    [hw - ht, T],
    [0, T],
    [0, h - 2 * T],
    [hw - ht, h - 2 * T],
    [hw - ht, h - T],
    [0, h - T],
  ]);
  return parts;
}
