// Final Curtain's Stage Box: builds the parts, the stock sheets and the checks in memory (the test and stageBox.ts use it).
import { type Part, type Placed, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { packKitStock, stockFitting, stockProblems } from '@lewismoten/gamemaker-sandbox-tools/kit/laserStock';
import type { LaserSheet, Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { checkMechanism, dims } from './stageBoxDims';
import { addArt } from './stageBoxArt';
import { makeParts, type Parts } from './stageBoxParts';

const inside = (p: Pt, poly: readonly Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    if (poly[i][1] > p[1] !== poly[j][1] > p[1] && p[0] < ((poly[j][0] - poly[i][0]) * (p[1] - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
  return c;
};

/** Engraving that is not inside its part's outline, or that lands in one of its holes. Empty when every cut lies outside all engraving. */
export function engravingProblems(part: Part): string[] {
  const out: string[] = [];
  const items = part.sheet.items;
  const outline = part.elements.find((e) => e.name === 'outline')!;
  const poly = (i: number) => {
    const it = items[i];
    return it.k === 'poly' ? it.pts : undefined;
  };
  const holes = part.elements.filter((e) => e.name.startsWith('hole')).map((e) => ({ pts: poly(e.from), it: items[e.from] }));
  const shell = poly(outline.from);
  items.forEach((it, i) => {
    if (it.op !== 'engrave') return;
    const pts: Pt[] =
      it.k === 'poly'
        ? it.pts
        : it.k === 'circle'
          ? [
              [it.cx - it.r, it.cy],
              [it.cx + it.r, it.cy],
              [it.cx, it.cy - it.r],
              [it.cx, it.cy + it.r],
            ]
          : [];
    for (const p of pts) {
      if (shell && !inside(p, shell)) out.push(`${part.name}: engraving ${i} leaves the outline`);
      for (const h of holes) {
        if (h.pts && inside(p, h.pts)) out.push(`${part.name}: engraving ${i} lands in a hole`);
        if (h.it.k === 'circle' && Math.hypot(p[0] - h.it.cx, p[1] - h.it.cy) < h.it.r) out.push(`${part.name}: engraving ${i} lands in a round hole`);
      }
    }
  });
  return out;
}

export interface Built {
  kerf: number;
  stock: StockSize;
  parts: Parts;
  sheets: { file: string; title: string; sheet: LaserSheet; placed: Placed[] }[];
  mechanism: ReturnType<typeof checkMechanism>;
  clearance: Record<string, { a: string; b: string; mm: number }[]>;
  problems: string[];
}

const pieces = (parts: Parts) => Object.values(parts).flatMap(({ part, qty }) => Array.from({ length: qty }, () => part));

export function fittingTable(kerf = 0.2, t = 3) {
  return stockFitting(pieces(makeParts(dims(t), kerf)));
}

export function buildStageBox(kerf = 0.2, t = 3, checks = true, stock: StockSize = '12x12'): Built {
  const d = dims(t);
  const parts = makeParts(d, kerf);
  addArt(parts, d);
  const sheets = packKitStock(pieces(parts), stock);
  const clearance: Built['clearance'] = {};
  const problems: string[] = [];
  for (const { part } of Object.values(parts)) {
    clearance[part.name] = checks ? part.close() : [];
    problems.push(...engravingProblems(part));
    for (const x of part.texts) if (x.capMm < 2.45) problems.push(`${part.name}: letters under 2.45 mm: ${x.text}`);
  }
  for (const s of sheets) problems.push(...stockProblems(s.sheet).map((p) => `${s.file}: ${p}`));
  return { kerf, stock, parts, sheets, mechanism: checkMechanism(d), clearance, problems };
}
