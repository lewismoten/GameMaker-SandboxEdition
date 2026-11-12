// Build the cryptex and validate its lock, unglued hidden engraving, hole nesting and selected library stock.
import { placePart, STOCK, STOCK_MARGIN, type Part, type Placed, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { cutSpacingProblems, engravingRegionProblems } from '@lewismoten/gamemaker-sandbox-tools/kit/laserClearance';
import type { LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { engravingProblems } from '../../sleuth/laser/stageBoxBuild';
import { COLLAR_R, POCKET, RINGS, SLICE_HOLE, WASHER, SOCKET_FIT, checkLock } from './cryptexDims';
import { NEST_GAP, boundingRadius, nest, nestProblems, type Guest, type Hole } from './cryptexNest';
import { packCryptex } from './cryptexPack';
import { makeParts, type Parts } from './cryptexParts';

export interface Built {
  kerf: number;
  stock: StockSize;
  parts: Parts;
  sheets: { file: string; title: string; sheet: LaserSheet; placed: Placed[] }[];
  lock: ReturnType<typeof checkLock>;
  clearance: Record<string, { a: string; b: string; mm: number }[]>;
  problems: string[];
  /** mm²: purchased stock, occupied bounding rectangles, retained kerf-compensated wood. */
  area: { sheets: number; occupied: number; wood: number };
}

/** Hosts may themselves nest inside a larger host. All hosts have quantity one. */
const HOSTS: [string, Hole][] = [
  ...['A2R', 'A3R', 'A4R', 'A5R'].map((k): [string, Hole] => [k, { cx: RINGS[3], cy: RINGS[3], r: SLICE_HOLE[3] }]),
  ...RINGS.flatMap((r, k): [string, Hole][] => [
    [`${'EDCB'[k]}1`, { cx: r, cy: r, r: SLICE_HOLE[k] }],
    [`${'EDCB'[k]}2`, { cx: r, cy: r, r: WASHER.apothem + SOCKET_FIT }],
  ]),
  ...[2, 3, 4, 5].map((n): [string, Hole] => [`A${n}C`, { cx: COLLAR_R, cy: COLLAR_R, r: POCKET.bore }]),
  ...[1, 2, 3, 4].flatMap((n): [string, Hole][] =>
    ['', 'B'].map((suffix) => [
      `G${n}${suffix}`,
      {
        cx: WASHER.apothem / Math.cos(Math.PI / 10),
        cy: WASHER.apothem / Math.cos(Math.PI / 10),
        r: WASHER.bore,
      },
    ]),
  ),
];

/** Pack without expensive per-part raster checks; reused for the four-size fitting table. */
function layout(parts: Parts, kerf: number, stock: StockSize) {
  const guests: Guest[] = Object.entries(parts)
    .filter(([k]) => k !== 'A1')
    .flatMap(([key, m]) => Array.from({ length: m.qty }, () => ({ key, part: m.part, rb: boundingRadius(m.part) })));
  // Larger holes first gives the tightest nesting; later hosts can already be children of earlier hosts.
  const hosts = [...HOSTS].sort((a, b) => b[1].r - a[1].r);
  const holes = hosts.map(([, h]) => h);
  const { placed: nested, left } = nest(holes, guests, kerf);
  const problems = nestProblems(holes, nested, kerf);
  const packed = packCryptex([parts.A1.part, ...left.map((g) => g.part)], stock);
  const sheets = packed.map((s, si) => {
    const roots = [...s.placed];
    const children = (key: string, parent: Placed) => {
      for (const n of nested.filter((n) => hosts[n.host][0] === key)) {
        const hole = hosts[n.host][1];
        const p = n.guest.part;
        const x = hole.cx + n.dx - p.w / 2;
        const y = hole.cy + n.dy - p.h / 2;
        const host = parts[key].part;
        const at: Placed = {
          name: n.guest.key,
          x: parent.x + (parent.turn === 90 ? host.h - y - p.h : x),
          y: parent.y + (parent.turn === 90 ? x : y),
          w: parent.turn === 90 ? p.h : p.w,
          h: parent.turn === 90 ? p.w : p.h,
          turn: parent.turn,
        };
        placePart(s.sheet, p, at);
        s.placed.push(at);
        children(n.guest.key, at);
      }
    };
    roots.forEach((p) => children(p.name, p));
    return { file: `sheet-${si + 1}`, title: `Sheet ${si + 1}: ${stock} inch stock`, ...s };
  });
  return { sheets, problems };
}

export function fittingTable(kerf = 0.2) {
  const parts = makeParts(kerf);
  return (Object.keys(STOCK) as StockSize[]).map((stock) => {
    const { sheets } = layout(parts, kerf, stock);
    const materialMm2 = sheets.length * STOCK[stock].w * STOCK[stock].h;
    return {
      stock,
      sheets: sheets.length,
      materialMm2,
      materialIn2: materialMm2 / 25.4 ** 2,
      label: `fits ${sheets.length} ${sheets.length === 1 ? 'sheet' : 'sheets'} of ${stock}`,
    };
  });
}

export function buildCryptex(kerf = 0.2, checks = true, stock: StockSize = '12x12'): Built {
  if (!Number.isFinite(kerf) || kerf < 0 || kerf > 0.4) throw new Error('Kerf must be between 0 and 0.4 mm');
  const parts = makeParts(kerf);
  const { sheets, problems } = layout(parts, kerf, stock);
  const clearance: Built['clearance'] = {};
  for (const m of Object.values(parts)) {
    const { part } = m;
    clearance[part.name] = checks ? part.close() : [];
    problems.push(...engravingProblems(part));
    for (const zone of m.hidden) {
      const pad = (part.size.w - part.w) / 2;
      problems.push(...engravingRegionProblems(part.sheet, { ...zone, cx: zone.cx + pad, cy: zone.cy + pad }).map((p) => `${part.name}: ${p}`));
    }
    for (const x of part.texts) if (x.capMm < 2.45) problems.push(`${part.name}: letters under 2.45 mm: ${x.text}`);
  }
  for (const s of sheets) {
    problems.push(...cutSpacingProblems(s.sheet, NEST_GAP).map((p) => `${s.file}: ${p.a} / ${p.b}: ${p.mm.toFixed(3)} mm apart`));
    for (const it of s.sheet.items) {
      const pts =
        it.k === 'poly'
          ? it.pts
          : [
              [it.cx - (it.k === 'ring' ? it.r1 : it.r), it.cy - (it.k === 'ring' ? it.r1 : it.r)],
              [it.cx + (it.k === 'ring' ? it.r1 : it.r), it.cy + (it.k === 'ring' ? it.r1 : it.r)],
            ];
      if (
        pts.some(
          ([x, y]) => x < STOCK_MARGIN.x - 1e-6 || x > s.sheet.w - STOCK_MARGIN.x + 1e-6 || y < STOCK_MARGIN.y - 1e-6 || y > s.sheet.h - STOCK_MARGIN.y + 1e-6,
        )
      )
        problems.push(`${s.file}: geometry outside cutter margins: ${JSON.stringify(pts)}`);
    }
  }
  const wood = Object.values(parts).reduce((a, m) => a + woodArea(m.part) * m.qty, 0);
  const occupied = sheets.reduce(
    (a, s) => a + (Math.max(...s.placed.map((p) => p.x + p.w)) + STOCK_MARGIN.x) * (Math.max(...s.placed.map((p) => p.y + p.h)) + STOCK_MARGIN.y),
    0,
  );
  return {
    kerf,
    stock,
    parts,
    sheets,
    lock: checkLock(kerf),
    clearance,
    problems,
    area: { sheets: sheets.length * STOCK[stock].w * STOCK[stock].h, occupied, wood },
  };
}

/** A part's outline minus its holes, square millimeters. */
function woodArea(p: Part): number {
  const shoelace = (q: readonly (readonly number[])[]) =>
    Math.abs(q.reduce((a, c, i) => a + c[0] * q[(i + 1) % q.length][1] - q[(i + 1) % q.length][0] * c[1], 0)) / 2;
  const cuts = p.sheet.items.filter((i) => i.op === 'cut').map((i) => (i.k === 'poly' ? shoelace(i.pts) : i.k === 'circle' ? Math.PI * i.r * i.r : 0));
  return cuts[0] - cuts.slice(1).reduce((a, b) => a + b, 0);
}
