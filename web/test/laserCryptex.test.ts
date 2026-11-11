// Cryptex fabrication regressions: full stock bounds, hierarchical nesting, glue-free hidden art and the 10,000-code lock.
import { describe, expect, it } from 'vitest';
import { BED, Part, packStock, STOCK, STOCK_MARGIN, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { cutSpacingProblems, engravingRegionProblems } from '@lewismoten/gamemaker-sandbox-tools/kit/laserClearance';
import { CUT, ENGRAVE, LaserSheet, type Item } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { buildCryptex, fittingTable } from '../../games/year2000/laser/cryptexBuild';
import {
  COLLAR_R,
  CORE,
  COMBO,
  HEAD_R,
  LID,
  POCKET,
  RIM,
  RINGS,
  SLICE_HOLE,
  SLICES_PER_RING,
  T,
  WASHER,
  checkLock,
} from '../../games/year2000/laser/cryptexDims';
import { assemblySvg, legend } from '../../games/year2000/laser/cryptexSteps';
import { GROUPS } from '../../games/year2000/laser/cryptexGroups';

const kit = buildCryptex();
const extent = (it: Item): number[][] =>
  it.k === 'poly'
    ? it.pts.map((p) => [...p])
    : [
        [it.cx - (it.k === 'ring' ? it.r1 : it.r), it.cy - (it.k === 'ring' ? it.r1 : it.r)],
        [it.cx + (it.k === 'ring' ? it.r1 : it.r), it.cy + (it.k === 'ring' ? it.r1 : it.r)],
      ];

describe('cryptex stock sheets', () => {
  it('uses only red cut strokes and blue engraving fills, with no flip operations or SVG transforms', () => {
    for (const s of kit.sheets) {
      const svg = s.sheet.svg(s.title);
      const colors = new Set([...svg.matchAll(/(?:stroke|fill)="(#[0-9a-f]{6})"/gi)].map((m) => m[1].toLowerCase()));
      expect([...colors].every((c) => [CUT, ENGRAVE].includes(c))).toBe(true);
      expect(svg).not.toMatch(/<text|font-family|transform=|#ff00ff|id="score"/);
    }
  });
  it.each(Object.keys(STOCK) as StockSize[])('places every part within the cutter margins on %s stock', (stock) => {
    const b = stock === '12x12' ? kit : buildCryptex(0.2, false, stock);
    expect(b.problems).toEqual([]);
    const placed = b.sheets.flatMap((s) => s.placed);
    for (const m of Object.values(b.parts)) expect(placed.filter((p) => p.name === m.part.name)).toHaveLength(m.qty);
    expect(placed).toHaveLength(Object.values(b.parts).reduce((a, m) => a + m.qty, 0));
    for (const s of b.sheets) {
      expect(s.sheet.w).toBe(STOCK[stock].w);
      expect(s.sheet.h).toBe(STOCK[stock].h);
      expect(s.sheet.w - 2 * STOCK_MARGIN.x).toBeLessThanOrEqual(BED.w);
      expect(s.sheet.h - 2 * STOCK_MARGIN.y).toBeLessThanOrEqual(BED.h + 1e-6);
      for (const it of s.sheet.items)
        for (const [x, y] of extent(it)) {
          expect(x).toBeGreaterThanOrEqual(STOCK_MARGIN.x - 1e-6);
          expect(y).toBeGreaterThanOrEqual(STOCK_MARGIN.y - 1e-6);
          expect(x).toBeLessThanOrEqual(s.sheet.w - STOCK_MARGIN.x + 1e-6);
          expect(y).toBeLessThanOrEqual(s.sheet.h - STOCK_MARGIN.y + 1e-6);
        }
    }
    const fit = fittingTable().find((f) => f.stock === stock)!;
    expect(fit.sheets).toBe(b.sheets.length);
    expect(fit.materialMm2).toBeCloseTo(b.area.sheets, 6);
    expect(fit.materialIn2).toBeCloseTo(fit.sheets * Number(stock.split('x')[0]) * Number(stock.split('x')[1]), 6);
    expect(fit.label).toContain(`of ${stock}`);
  });
  it('uses two 12x12 sheets or one 12x20 sheet, with less retained wood than before', () => {
    expect(kit.sheets).toHaveLength(2);
    expect(buildCryptex(0.2, false, '12x20').sheets).toHaveLength(1);
    expect(kit.area.wood).toBeLessThan(72274.93 * 0.86);
  });
  it('keeps engraving and cuts separated on every part', () => {
    expect(kit.problems).toEqual([]);
    for (const c of Object.values(kit.clearance)) expect(c).toEqual([]);
  });
  it('detects crossing cut paths, while allowing legally nested concentric circles', () => {
    const sheet = new LaserSheet(30, 30);
    sheet.add({ op: 'cut', k: 'circle', cx: 15, cy: 15, r: 12 });
    sheet.add({ op: 'cut', k: 'circle', cx: 15, cy: 15, r: 8 });
    expect(cutSpacingProblems(sheet, 2)).toEqual([]);
    sheet.add({
      op: 'cut',
      k: 'poly',
      pts: [
        [1, 14],
        [29, 14],
        [29, 16],
        [1, 16],
      ],
    });
    expect(cutSpacingProblems(sheet, 2).map((p) => p.mm)).toEqual([0, 0]);
  });
  it('packs a long part by rotating the actual geometry, and separates neighboring cut outlines', () => {
    const p = new Part('long', 270, 110, 0.2);
    p.outline([
      [0, 0],
      [270, 0],
      [270, 110],
      [0, 110],
    ]);
    const bins = packStock([p, p], '12x12');
    expect(bins).toHaveLength(1);
    // Separate test shape fits only after turning on short stock.
    const q = new Part('turn', 110, 270, 0.2);
    q.outline([
      [0, 0],
      [110, 0],
      [110, 270],
      [0, 270],
    ]);
    const rotated = packStock([q], '6x12')[0];
    expect(rotated.placed[0].turn).toBe(90);
    for (const [x, y] of extent(rotated.sheet.items[0])) {
      expect(x).toBeGreaterThanOrEqual(STOCK_MARGIN.x - 1e-6);
      expect(y).toBeGreaterThanOrEqual(STOCK_MARGIN.y - 1e-6);
      expect(x).toBeLessThanOrEqual(STOCK['6x12'].w - STOCK_MARGIN.x + 1e-6);
      expect(y).toBeLessThanOrEqual(STOCK['6x12'].h - STOCK_MARGIN.y + 1e-6);
    }
    const [a, b] = bins[0].placed;
    const separation = Math.max(b.x - a.x - a.w, a.x - b.x - b.w, b.y - a.y - a.h, a.y - b.y - b.h) - p.kerf;
    expect(separation).toBeGreaterThanOrEqual(2 - 1e-6);
  });
  it('applies kerf compensation once, independent of stock and nesting', () => {
    const a = buildCryptex(0, false);
    const b = buildCryptex(0.4, false);
    const width = (k: typeof a) => {
      const xs = extent(k.parts.A1.part.sheet.items[0]).map(([x]) => x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(a.problems).toEqual([]);
    expect(b.problems).toEqual([]);
    expect(width(b) - width(a)).toBeCloseTo(0.4, 6);
  });
});

describe('cryptex hollow and hidden engraving', () => {
  it('uses a 4 mm minimum on the core, collar tip, and bearing overlaps', () => {
    expect(T).toBe(3.18);
    expect(RIM).toBe(4);
    expect(RIM).toBeGreaterThan(T * 1.25);
    expect(CORE.r - CORE.bore).toBeGreaterThanOrEqual(RIM);
    expect(COLLAR_R - Math.hypot(POCKET.notchOut, POCKET.notchHw)).toBeCloseTo(RIM);
    SLICE_HOLE.forEach((h, k) => {
      expect(RINGS[k] - h).toBeGreaterThanOrEqual(RIM);
      expect((k ? RINGS[k - 1] : RINGS[0]) - h).toBeGreaterThanOrEqual(RIM);
    });
    expect(CORE.bore * 2).toBe(16);
    expect(SLICE_HOLE[3] ** 2 - COLLAR_R ** 2).toBeGreaterThan(2 * (34 ** 2 - 26 ** 2));
  });
  it('decorates the hollow floor, ring interiors, washer faces, core floor, head underside and lid underside', () => {
    for (const key of ['A1', 'A5R', 'A5C', 'B1', 'C1', 'D1', 'E1', 'B2', 'C2', 'D2', 'G1', 'G2', 'G3', 'G4', 'CORE0', 'HEAD', 'LID']) {
      const m = kit.parts[key];
      expect(m.hidden.length, key).toBeGreaterThan(0);
      for (const z of m.hidden) {
        expect(z.to, key).toBeGreaterThan(z.from);
        expect(engravingRegionProblems(m.part.sheet, { ...z, cx: z.cx + 2, cy: z.cy + 2 }), key).toEqual([]);
      }
    }
    for (const key of ['B1', 'C1', 'D1', 'E1', 'HEAD', 'LID']) expect(kit.parts[key].face).toBe('down');
    expect(kit.parts.A1.hidden[0].r1).toBeLessThan(CORE.r);
    expect(kit.parts.CORE0.hidden[0].r1).toBeLessThan(CORE.bore);
    expect(kit.parts.HEAD.hidden[0].r0).toBeGreaterThan(CORE.r);
    expect(kit.parts.HEAD.hidden[0].r1).toBeLessThan(HEAD_R);
    expect(kit.parts.LID.hidden[0].r0).toBeGreaterThan(LID.plug);
  });
  it('leaves every buried glue face blank, including the lower washer layers and core wall slices', () => {
    for (const key of ['A2R', 'A3R', 'A4R', 'A2C', 'A3C', 'A4C', 'G1B', 'G2B', 'G3B', 'G4B', 'CORER', 'COREC', 'LIDP']) {
      expect(
        kit.parts[key].part.sheet.items.filter((i) => i.op === 'engrave'),
        key,
      ).toEqual([]);
    }
    for (const n of [1, 2, 3, 4]) {
      expect(kit.parts[`G${n}`].qty).toBe(1);
      expect(kit.parts[`G${n}B`].qty).toBe(1);
    }
    for (const [key, m] of Object.entries(kit.parts)) {
      if (key === 'A1' || /^[BCDE]2$/.test(key)) continue; // exposed title and digits
      m.part.sheet.items.forEach((it, i) => {
        if (it.op === 'engrave')
          expect(
            m.hidden.some((z) => z.from <= i && i < z.to),
            `${key} engraving ${i}`,
          ).toBe(true);
      });
    }
  });
  it('rejects a filled shape crossing a glue footprint even when its vertices are outside', () => {
    const s = new LaserSheet(20, 20);
    s.add({
      op: 'engrave',
      k: 'poly',
      pts: [
        [4, 4],
        [16, 4],
        [16, 16],
        [4, 16],
      ],
    });
    expect(engravingRegionProblems(s, { label: 'outside plug', from: 0, to: 1, cx: 10, cy: 10, r0: 2, r1: 10 })).toHaveLength(1);
  });
  it('renders assembly instructions and a legend matching the safe engraved faces', () => {
    const svg = assemblySvg();
    for (const t of ['Stack A: the base', 'Stack F: the core', 'G1 to G4', 'Final assembly', 'Set your own code', 'Part IDs']) expect(svg).toContain(t);
    expect(svg).toContain('artwork down');
    for (const r of legend(0.2)) expect(r.where).not.toContain('glued face');
  });
});

describe('cryptex stack and lock', () => {
  it('uses actual stock thickness throughout assembly and leaves the ridge below the rings', () => {
    const core = CORE.ridgeSlices + CORE.roundSlices;
    expect(core * T).toBe((POCKET.plates + RINGS.length * SLICES_PER_RING) * T);
    expect(CORE.ridgeSlices).toBeLessThan(POCKET.plates);
    expect(GROUPS.find((g) => g.id === 'H')!.pieces[0].z).toBeCloseTo(13 * T);
    expect(GROUPS.find((g) => g.id === 'G1')!.pieces.map((p) => p.key)).toEqual(['G1B', 'G1']);
    expect(WASHER.apothem - WASHER.notchOut).toBeGreaterThanOrEqual(3);
  });
  it('frees the core for 2000 and no other of the 10,000 combinations', () => {
    expect(kit.lock.opens).toEqual([COMBO.join('')]);
    expect(kit.lock.pocketFits).toBe(true);
    expect(kit.lock.wrongDigitBlocked).toBe(true);
    expect(kit.lock.windowDeg).toBeGreaterThanOrEqual(4);
    expect(kit.lock.windowDeg).toBeLessThan(18);
  });
  it('keeps the lock and fits working at actual kerfs 0.1, 0.2 and 0.3 mm', () => {
    for (const actual of [0.1, 0.2, 0.3]) {
      const l = checkLock(0.2, actual);
      expect(l.opens).toEqual(['2000']);
      expect(l.pocketFits).toBe(true);
      expect(l.wrongDigitBlocked).toBe(true);
      expect(l.windowDeg).toBeGreaterThan(3);
      expect(l.fits.washerInSocket).toBeGreaterThan(0.04);
    }
  });
  it('follows a changed combination when washers are reseated', () => {
    expect(checkLock(0.2, 0.2, [7, 3, 9, 1]).opens).toEqual(['7391']);
  });
});
