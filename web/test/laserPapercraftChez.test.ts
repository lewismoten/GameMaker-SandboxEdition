// Tests: Tune-Up's paper THE CHEZ (games/tuneup/laser): the strips and side panels agree edge by edge (so the net folds closed),
// the laser sheet uses red cut, magenta score and blue engrave and fits the Glowforge bed, no two elements on a piece are too close,
// and the print pages fit Letter and A4 and write a real PDF and PNG.
import { describe, expect, it } from 'vitest';
import { Part, STOCK, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { checkStockCuts } from './laserStockAssertions';
import { stockProblems } from '@lewismoten/gamemaker-sandbox-tools/kit/laserStock';
import { CUT, ENGRAVE, SCORE } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { EDGES_COUNT, WIDTH, edgeLen } from '../../games/tuneup/laser/papercraftDims';
import { buildLaser, fittingTable } from '../../games/tuneup/laser/papercraftLaser';
import { COLOR, allPieces } from '../../games/tuneup/laser/papercraftParts';
import { PAPER, layoutPages, pagePng, pageSvg, pdf } from '../../games/tuneup/laser/papercraftPrint';

const pieces = allPieces();
const by = (n: string) => pieces.find((p) => p.name === n)!;
const round = (v: number) => +v.toFixed(6);

describe('the net folds closed', () => {
  const strips = [by('Top strip'), by('Underside strip')];
  it('has one segment per profile edge, each as long as that edge, and the strips share the car’s width', () => {
    const segs = strips.flatMap((s) => s.meta.segments!);
    expect(segs.map((s) => s.edge).sort((a, b) => a - b)).toEqual(Array.from({ length: EDGES_COUNT }, (_, i) => i));
    for (const s of segs) expect(s.len).toBeCloseTo(edgeLen(s.edge), 6);
    for (const s of strips) expect(s.meta.width).toBe(WIDTH);
  });
  it('gives each side panel the same edge lengths as the profile (the mirror one has the same set)', () => {
    const want = Array.from({ length: EDGES_COUNT }, (_, i) => edgeLen(i));
    const driver = by('Driver side panel').meta.panelEdges!;
    expect(driver).toHaveLength(EDGES_COUNT);
    driver.forEach((l, i) => expect(l).toBeCloseTo(want[i], 6));
    const pass = by('Passenger side panel').meta.panelEdges!;
    expect([...pass].map(round).sort((a, b) => a - b)).toEqual([...want].map(round).sort((a, b) => a - b));
  });
  it('makes each fold across a strip as long as the car is wide, and the folds span the segments', () => {
    for (const s of strips) {
      const total = s.meta.segments!.reduce((a, b) => a + b.len, 0);
      for (const [a, b] of s.folds.filter(([p, q]) => p[0] === q[0])) expect(Math.abs(b[1] - a[1])).toBeCloseTo(WIDTH, 6);
      const xs = s.folds.flatMap(([a, b]) => [a[0], b[0]]);
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(total, 6);
    }
  });
});

describe('the laser sheet', () => {
  const laser = buildLaser(pieces);
  const svg = laser.sheets.map((s) => s.sheet.svg('test')).join('');
  it('has no spacing problems and fits the bed', () => {
    expect(laser.problems).toEqual([]);
    for (const s of laser.sheets) {
      expect(s.sheet.w).toBe(STOCK[laser.stock].w);
      expect(s.sheet.h).toBe(STOCK[laser.stock].h);
      expect(stockProblems(s.sheet)).toEqual([]);
    }
  });
  it('uses red cuts, magenta scores and blue engraving only, with no text or transforms', () => {
    const colors = new Set([...svg.matchAll(/(?:stroke|fill)="(#[0-9a-f]{6})"/gi)].map((m) => m[1].toLowerCase()));
    expect([...colors].sort()).toEqual([CUT, SCORE, ENGRAVE].sort());
    expect(svg).not.toMatch(/<text|font-family|transform=/);
  });
  it('cuts one door window per side and none behind it, a windshield, a back window and two headlights', () => {
    expect(by('Driver side panel').holes.map((h) => h.label)).toEqual(['door window']);
    expect(by('Passenger side panel').holes.map((h) => h.label)).toEqual(['door window']);
    expect(by('Top strip').holes.map((h) => h.label)).toEqual(['windshield', 'headlight', 'headlight']);
    expect(by('Underside strip').holes.map((h) => h.label)).toEqual(['back window']);
  });
  it('puts the charge port on the passenger side only', () => {
    expect(by('Passenger side panel').engrave.some((e) => e.label === 'charge port')).toBe(true);
    expect(by('Driver side panel').engrave.some((e) => e.label === 'charge port')).toBe(false);
  });
});

describe('the print pages', () => {
  for (const [name, paper] of Object.entries(PAPER)) {
    it(`fit ${name} and hold every piece once per quantity`, () => {
      const pages = layoutPages(pieces, paper);
      const placed = pages.flatMap((p) => p.placed);
      for (const p of pieces) expect(placed.filter((q) => q.name === p.name)).toHaveLength(p.qty);
      for (const q of placed) {
        expect(q.x).toBeGreaterThanOrEqual(0);
        expect(q.y).toBeGreaterThanOrEqual(0);
        expect(q.x + q.w).toBeLessThanOrEqual(paper.w);
        expect(q.y + q.h).toBeLessThanOrEqual(paper.h);
      }
    });
  }
  for (const [name, paper] of Object.entries(PAPER)) {
    it(`prints all 4 wheels across the ${name} pages, in the SVG and the PDF as well as the placement list`, () => {
      const pages = layoutPages(pieces, paper);
      expect(pages.flatMap((p) => p.placed).filter((q) => q.name === 'Wheel')).toHaveLength(4);
      const tires = pages.flatMap((p) => p.prims).filter((p) => p.fill === COLOR.tire);
      expect(tires).toHaveLength(4);
      expect(
        pages
          .map((p) => pageSvg(p, 't'))
          .join('')
          .split(`fill="${COLOR.tire}"`).length - 1,
      ).toBe(4);
      const rg = COLOR.tire
        .slice(1)
        .match(/../g)!
        .map((h) => (parseInt(h, 16) / 255).toFixed(3))
        .join(' ');
      expect(Buffer.from(pdf(pages)).toString('latin1').split(`${rg} rg`).length - 1).toBe(4);
    });
  }
  it('writes an SVG in millimeters, a PDF and a PNG', () => {
    const pages = layoutPages(pieces, PAPER.letter);
    expect(pageSvg(pages[0], 't')).toMatch(/width="279\.4mm"/);
    const doc = Buffer.from(pdf(pages)).toString('latin1');
    expect(doc.startsWith('%PDF-1.4')).toBe(true);
    expect(doc).toContain(`/Count ${pages.length}`);
    expect(doc.trimEnd().endsWith('%%EOF')).toBe(true);
    expect([...pagePng(pages[0], 30).slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});

describe('paper car library stock', () => {
  const fitting = fittingTable(pieces);
  const cutParts = pieces.map((p) => {
    const part = new Part(p.name, p.w, p.h, 0);
    part.outline(p.outline);
    for (const h of p.holes) {
      if (h.pts) part.hole(h.label, h.pts);
      else part.holeRound(h.label, ...h.circle!);
    }
    return { part, qty: p.qty };
  });
  for (const stock of Object.keys(STOCK) as StockSize[]) {
    it(`packs every piece with its original score lines on ${stock}`, () => {
      const b = buildLaser(pieces, stock, false);
      expect(b.problems).toEqual([]);
      expect(b.sheets).toHaveLength(fitting.find((f) => f.stock === stock)!.sheets);
      checkStockCuts(b.sheets, stock, cutParts, 5);
      const placed = b.sheets.flatMap((s) => s.placed);
      for (const p of pieces) expect(placed.filter((at) => at.name === p.name)).toHaveLength(p.qty);
      for (const s of b.sheets) {
        expect(s.sheet.w).toBe(STOCK[stock].w);
        expect(s.sheet.h).toBe(STOCK[stock].h);
        expect(stockProblems(s.sheet)).toEqual([]);
      }
      expect(b.sheets.reduce((n, s) => n + s.sheet.count('score'), 0)).toBe(pieces.reduce((n, p) => n + p.qty * p.folds.length, 0));
    });
  }
});
