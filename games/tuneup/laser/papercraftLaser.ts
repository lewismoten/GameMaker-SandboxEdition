// The paper THE CHEZ on Glowforge stock sheets: cut (red) outlines and windows, score (magenta) folds, engrave (blue) stripes, roof,
// tires and the charge port. Each piece is drawn on its own small sheet first so the spacing check can run on it.
import { Part, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { packKitStock, stockFitting, stockProblems } from '@lewismoten/gamemaker-sandbox-tools/kit/laserStock';
import { tooClose, type Close, type Element } from '@lewismoten/gamemaker-sandbox-tools/kit/laserClearance';
import { LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import type { Piece } from './papercraftParts';

const GAP = 5;

function pieceSheet(p: Piece, checks = true): { sheet: LaserSheet; problems: Close[]; elements: Element[] } {
  const sheet = new LaserSheet(p.w, p.h);
  const els: Element[] = [];
  const el = (name: string, add: () => void) => {
    const from = sheet.items.length;
    add();
    els.push({ name, from, to: sheet.items.length });
  };
  el('outline', () => sheet.add({ op: 'cut', k: 'poly', pts: p.outline }));
  for (const h of p.holes)
    el(`hole ${h.label}`, () =>
      h.pts ? sheet.add({ op: 'cut', k: 'poly', pts: h.pts }) : sheet.add({ op: 'cut', k: 'circle', cx: h.circle![0], cy: h.circle![1], r: h.circle![2] }),
    );
  for (const e of p.engrave)
    el(e.label, () => {
      e.polys?.forEach((pts) => sheet.add({ op: 'engrave', k: 'poly', pts }));
      e.circles?.forEach(([cx, cy, r]) => sheet.add({ op: 'engrave', k: 'circle', cx, cy, r }));
      e.rings?.forEach(([cx, cy, r0, r1]) => sheet.add({ op: 'engrave', k: 'ring', cx, cy, r0, r1 }));
    });
  for (const [a, b] of p.folds) sheet.add({ op: 'score', k: 'poly', pts: [a, b] });
  return { sheet, problems: checks ? tooClose(sheet, els, 1, 1.5) : [], elements: els };
}

/** Preserve the paper net exactly: no kerf compensation or changes to the score lines. */
function laserParts(pieces: Piece[], checks: boolean) {
  const problems: string[] = [];
  const parts = pieces.flatMap((p) => {
    const made = pieceSheet(p, checks);
    if (checks) for (const c of made.problems) problems.push(`${p.name}: ${c.a} / ${c.b} ${c.mm} mm`);
    const part = new Part(p.name, p.w, p.h, 0);
    const pad = (part.size.w - p.w) / 2;
    part.sheet.place(made.sheet, pad, pad);
    part.elements.push(...made.elements);
    return Array.from({ length: p.qty }, () => part);
  });
  return { parts, problems };
}

export function fittingTable(pieces: Piece[]) {
  return stockFitting(laserParts(pieces, false).parts, GAP);
}

/** Every piece, at its original size, on selected-stock sheets. Printer layouts are independent. */
export function buildLaser(pieces: Piece[], stock: StockSize = '12x12', checks = true) {
  const { parts, problems } = laserParts(pieces, checks);
  const sheets = packKitStock(parts, stock, GAP);
  for (const s of sheets) problems.push(...stockProblems(s.sheet).map((p) => `${s.file}: ${p}`));
  return { stock, sheets, problems };
}
