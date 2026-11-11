// "In The Year 2000!" cryptex: builds the parts, the sheets and the checks in memory (the test and cryptex.ts use it).
// Rings and plates are hollow; small parts are nested in their empty middles (cryptexNest.ts), so the sheets are fewer and smaller.
import { packRows, type Part, type Placed } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import type { LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { engravingProblems } from '../../sleuth/laser/stageBoxBuild';
import { RINGS, SLICE_HOLE, WASHER, SOCKET_FIT, checkLock } from './cryptexDims';
import { boundingRadius, nest, nestProblems, type Guest, type Hole } from './cryptexNest';
import { makeParts, type Parts } from './cryptexParts';

export interface Built {
  kerf: number;
  parts: Parts;
  sheets: { file: string; title: string; sheet: LaserSheet; placed: Placed[] }[];
  lock: ReturnType<typeof checkLock>;
  clearance: Record<string, { a: string; b: string; mm: number }[]>;
  problems: string[];
  /** square millimeters: the sheets' bounding boxes, and the wood the parts themselves use */
  area: { sheets: number; wood: number };
}

/** Hosts in sheet order, with the hole each offers. */
const HOSTS: [string, Hole][] = [
  ...['A2R', 'A3R', 'A4R', 'A5R'].map((k): [string, Hole] => [k, { cx: RINGS[3], cy: RINGS[3], r: SLICE_HOLE[3] }]),
  ['B1', { cx: RINGS[3], cy: RINGS[3], r: SLICE_HOLE[3] }],
  ['C1', { cx: RINGS[2], cy: RINGS[2], r: SLICE_HOLE[2] }],
  ['B2', { cx: RINGS[3], cy: RINGS[3], r: WASHER.apothem + SOCKET_FIT }],
  ['C2', { cx: RINGS[2], cy: RINGS[2], r: WASHER.apothem + SOCKET_FIT }],
  ['D1', { cx: RINGS[1], cy: RINGS[1], r: SLICE_HOLE[1] }],
  ['E1', { cx: RINGS[0], cy: RINGS[0], r: SLICE_HOLE[0] }],
  ['D2', { cx: RINGS[1], cy: RINGS[1], r: WASHER.apothem + SOCKET_FIT }],
  ['E2', { cx: RINGS[0], cy: RINGS[0], r: WASHER.apothem + SOCKET_FIT }],
];
/** Parts cut as guests (everything the hosts can hold); the rest of the sheet's parts are laid out as hosts or loose. */
const GUESTS = ['A2C', 'A3C', 'A4C', 'A5C', 'G1', 'G2', 'G3', 'G4', 'HEAD', 'LID', 'CORE0', 'CORER', 'COREC', 'LIDP'];
/** The sheets' rows of host parts (loose parts the hosts could not hold go in the last row of the last sheet). */
const ROWS: [string, string, string[][]][] = [
  [
    'sheet-1-base',
    'Sheet 1: the base stack and rings 4 and 1',
    [
      ['A1', 'A2R', 'A3R', 'A4R'],
      ['A5R', 'B1', 'B2', 'E1', 'E2'],
    ],
  ],
  ['sheet-2-rings', 'Sheet 2: rings 3 and 2, the core and the washers', [['C1', 'C2', 'D1', 'D2']]],
];

export function buildCryptex(kerf = 0.2, checks = true): Built {
  const parts = makeParts(kerf);
  const guests: Guest[] = GUESTS.flatMap((k) =>
    Array.from({ length: parts[k].qty }, () => ({ key: k, part: parts[k].part, rb: boundingRadius(parts[k].part) })),
  );
  const holes = HOSTS.map(([, h]) => h);
  const { placed: nested, left } = nest(holes, guests, kerf);
  const problems: string[] = nestProblems(holes, nested, kerf);
  const sheets = ROWS.map(([file, title, rows], si) => {
    const grid = rows.map((r) => r.map((k) => parts[k].part));
    if (si === ROWS.length - 1) {
      // what no hole could take, in rows that fit the bed
      let row: Part[] = [];
      let used = 0;
      for (const g of left) {
        if (used + g.part.size.w + 4 > 470) {
          grid.push(row);
          row = [];
          used = 0;
        }
        row.push(g.part);
        used += g.part.size.w + 4;
      }
      if (row.length) grid.push(row);
    }
    const packed = packRows(title, grid);
    const mine = new Set(rows.flat());
    nested.forEach((n) => {
      const hostKey = HOSTS[n.host][0];
      if (!mine.has(hostKey)) return;
      const at = packed.placed.find((p) => p.name === hostKey)!;
      const pad = (n.guest.part.size.w - n.guest.part.w) / 2;
      packed.sheet.place(
        n.guest.part.sheet,
        at.x + HOSTS[n.host][1].cx + n.dx - n.guest.part.w / 2 - pad,
        at.y + HOSTS[n.host][1].cy + n.dy - n.guest.part.h / 2 - pad,
      );
      packed.placed.push({
        name: n.guest.key,
        x: at.x + HOSTS[n.host][1].cx + n.dx - n.guest.part.w / 2,
        y: at.y + HOSTS[n.host][1].cy + n.dy - n.guest.part.h / 2,
        w: n.guest.part.w,
        h: n.guest.part.h,
      });
    });
    return { file, title, sheet: packed.sheet, placed: packed.placed };
  });
  const clearance: Built['clearance'] = {};
  for (const { part } of Object.values(parts)) {
    clearance[part.name] = checks ? part.close() : [];
    problems.push(...engravingProblems(part));
    for (const x of part.texts) if (x.capMm < 2.45) problems.push(`${part.name}: letters under 2.45 mm: ${x.text}`);
  }
  const wood = Object.values(parts).reduce((a, m) => a + woodArea(m.part) * m.qty, 0);
  return { kerf, parts, sheets, lock: checkLock(kerf), clearance, problems, area: { sheets: sheets.reduce((a, s) => a + s.sheet.w * s.sheet.h, 0), wood } };
}

/** A part's outline minus its holes, square millimeters. */
function woodArea(p: Part): number {
  const shoelace = (q: readonly (readonly number[])[]) =>
    Math.abs(q.reduce((a, c, i) => a + c[0] * q[(i + 1) % q.length][1] - q[(i + 1) % q.length][0] * c[1], 0)) / 2;
  const cuts = p.sheet.items.filter((i) => i.op === 'cut').map((i) => (i.k === 'poly' ? shoelace(i.pts) : i.k === 'circle' ? Math.PI * i.r * i.r : 0));
  return cuts[0] - cuts.slice(1).reduce((a, b) => a + b, 0);
}
