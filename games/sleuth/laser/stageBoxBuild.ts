// Final Curtain's Stage Box: builds the parts, the three sheets and the checks in memory (the test and stageBox.ts use it).
import { packRows, type Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
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
  parts: Parts;
  sheets: { file: string; title: string; sheet: LaserSheet; placed: ReturnType<typeof packRows>['placed'] }[];
  mechanism: ReturnType<typeof checkMechanism>;
  clearance: Record<string, { a: string; b: string; mm: number }[]>;
  problems: string[];
}

export function buildStageBox(kerf = 0.2, t = 3, checks = true): Built {
  const d = dims(t);
  const parts = makeParts(d, kerf);
  addArt(parts, d);
  const one = (n: string) => [parts[n].part];
  const many = (n: string) => Array.from({ length: parts[n].qty }, () => parts[n].part);
  const layout: [string, string, Part[][]][] = [
    [
      'sheet-1-box',
      'Sheet 1: the outer box',
      [
        [...one('P'), ...one('K'), ...one('L'), ...one('R')],
        [...one('T'), ...one('B')],
      ],
    ],
    [
      'sheet-2-inside',
      'Sheet 2: the stage and the mechanism',
      [
        [...one('FLOOR'), ...one('W')],
        [...one('D1'), ...one('D2'), ...one('C'), ...one('COMB'), ...one('DAGGER'), ...one('ARM'), ...one('PIN'), ...one('POST'), ...many('PEG')],
      ],
    ],
    [
      'sheet-3-drawer',
      'Sheet 3: the trap-room drawer',
      [
        [...one('DB'), ...one('DF'), ...one('DK')],
        [...one('DL'), ...one('DR')],
      ],
    ],
  ];
  const sheets = layout.map(([file, title, rows]) => ({ file, title, ...packRows(title, rows) }));
  const clearance: Built['clearance'] = {};
  const problems: string[] = [];
  for (const { part } of Object.values(parts)) {
    clearance[part.name] = checks ? part.close() : [];
    problems.push(...engravingProblems(part));
    for (const x of part.texts) if (x.capMm < 2.45) problems.push(`${part.name}: letters under 2.45 mm: ${x.text}`);
  }
  return { kerf, parts, sheets, mechanism: checkMechanism(d), clearance, problems };
}
