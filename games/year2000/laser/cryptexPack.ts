// "In The Year 2000!" cryptex: sheet packing. Almost every root piece is a disc or a ring, so a rectangle packer wastes the corners.
// Discs are placed by their bounding circle (free position on a 1 mm grid, so rows can interlock like coins) and the square lid
// plate as a rectangle. Several orders and scan directions are tried; the fewest sheets win, then the least occupied area, so
// sheet 1 is filled before sheet 2 opens and the last sheet is as small as it can be. Placement only: no part's geometry changes.
import { STOCK, STOCK_MARGIN, placePart, type Part, type Placed, type StockSize } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';

interface Shape {
  part: Part;
  cx: number;
  cy: number;
  r: number;
  round: boolean;
  bw: number;
  bh: number;
}

function shapeOf(part: Part): Shape {
  const b = part.cutBounds;
  // the lid plate keeps its rectangle; every other root is a disc, a ring or a many-sided plate, so its bounding circle is used
  return { part, cx: 0, cy: 0, r: Math.max(b.w, b.h) / 2, round: part.name !== 'A1', bw: b.w, bh: b.h };
}

/** Space between two placed shapes' cut outlines (negative when they overlap). */
function space(a: Shape, b: Shape): number {
  if (a.round && b.round) return Math.hypot(a.cx - b.cx, a.cy - b.cy) - a.r - b.r;
  if (!a.round && !b.round) return Math.max(Math.abs(a.cx - b.cx) - (a.bw + b.bw) / 2, Math.abs(a.cy - b.cy) - (a.bh + b.bh) / 2);
  const [c, q] = a.round ? [a, b] : [b, a];
  const dx = Math.max(Math.abs(c.cx - q.cx) - q.bw / 2, 0);
  const dy = Math.max(Math.abs(c.cy - q.cy) - q.bh / 2, 0);
  return Math.hypot(dx, dy) - c.r;
}

function pack(parts: readonly Part[], size: StockSize, gap: number, order: number, byRow: boolean): Shape[][] {
  const w = STOCK[size].w - 2 * STOCK_MARGIN.x;
  const h = STOCK[size].h - 2 * STOCK_MARGIN.y;
  const metric = (p: Part) => (order === 0 ? p.w * p.h : order === 1 ? Math.max(p.w, p.h) : p.w + p.h);
  const sorted = [...parts].sort((a, b) => metric(b) - metric(a) || a.name.localeCompare(b.name));
  const bins: Shape[][] = [];
  for (const part of sorted) {
    const s = shapeOf(part);
    const hw = s.round ? s.r : s.bw / 2;
    const hh = s.round ? s.r : s.bh / 2;
    if (2 * hw > w + 1e-8 || 2 * hh > h + 1e-8) throw new Error(`${part.name} does not fit ${size} with the cutter margins`);
    const fit = (bin: Shape[]) => {
      const outer = byRow ? h - 2 * hh : w - 2 * hw;
      const inner = byRow ? w - 2 * hw : h - 2 * hh;
      for (let o = 0; o <= outer + 1e-8; o++)
        for (let i = 0; i <= inner + 1e-8; i++) {
          s.cx = hw + (byRow ? i : o);
          s.cy = hh + (byRow ? o : i);
          if (bin.every((q) => space(s, q) >= gap)) return true;
        }
      return false;
    };
    let bin = bins.find(fit);
    if (!bin) {
      bin = [];
      bins.push(bin);
      fit(bin);
    }
    bin.push({ ...s });
  }
  return bins;
}

/** Pack the root pieces (nested guests ride inside them); same result shape as the library's packStock. */
export function packCryptex(parts: readonly Part[], size: StockSize, gap = 2.05) {
  const stock = STOCK[size];
  let best: Shape[][] | undefined;
  let bestScore = Infinity;
  for (let order = 0; order < 3; order++)
    for (const byRow of [false, true]) {
      const bins = pack(parts, size, gap, order, byRow);
      const occupied = bins.reduce(
        (a, b) => a + Math.max(...b.map((s) => s.cx + (s.round ? s.r : s.bw / 2))) * Math.max(...b.map((s) => s.cy + (s.round ? s.r : s.bh / 2))),
        0,
      );
      const score = bins.length * stock.w * stock.h * 100 + occupied;
      if (score < bestScore) {
        best = bins;
        bestScore = score;
      }
    }
  return best!.map((bin) => {
    const sheet = new LaserSheet(stock.w, stock.h);
    const placed: Placed[] = bin.map((s) => {
      const b = s.part.cutBounds;
      const at: Placed = {
        name: s.part.name,
        x: STOCK_MARGIN.x + s.cx - s.bw / 2 - b.x,
        y: STOCK_MARGIN.y + s.cy - s.bh / 2 - b.y,
        w: s.part.w,
        h: s.part.h,
        turn: 0,
      };
      placePart(sheet, s.part, at);
      return at;
    });
    return { sheet, placed };
  });
}
