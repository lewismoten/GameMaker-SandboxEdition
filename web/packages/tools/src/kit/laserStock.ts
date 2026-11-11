// Library-stock kit layouts: nest small solid pieces in cut-out holes, then pack the remaining parts with quarter turns.
// Hole nesting uses conservative cut bounding rectangles, including hairlines, and never changes a part's geometry.
import { cutSpacingProblems } from './laserClearance';
import { packStock, placePart, STOCK, STOCK_MARGIN, PART_GAP, type Part, type Placed, type StockSize } from './laserLayout';
import { HAIRLINE, LaserSheet, type Item, type Pt } from './laserSvg';

function points(it: Item): Pt[] {
  if (it.k === 'poly') return it.pts;
  const r = it.k === 'ring' ? it.r1 : it.r;
  return [
    [it.cx - r, it.cy - r],
    [it.cx + r, it.cy + r],
  ];
}

function inside([x, y]: Pt, it: Item): boolean {
  if (it.k === 'circle') return Math.hypot(x - it.cx, y - it.cy) < it.r;
  if (it.k !== 'poly') return false;
  let c = false;
  for (let i = 0, j = it.pts.length - 1; i < it.pts.length; j = i++) {
    const a = it.pts[i],
      b = it.pts[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}

/** One nesting level; pieces with holes stay as hosts, and every quantity is tracked by its input index. */
export function packKitStock(parts: readonly Part[], stock: StockSize, gap = PART_GAP) {
  const nested = new Map<number, { guest: number; at: Placed }[]>();
  const used = new Set<number>();
  const hosts = parts.map((p, i) => ({ p, i })).sort((a, b) => b.p.w * b.p.h - a.p.w * a.p.h);
  const guests = hosts.filter(({ p }) => !p.elements.some((e) => e.name.startsWith('hole')));
  for (const { p: host, i: hi } of hosts) {
    const pad = (host.size.w - host.w) / 2;
    for (const el of host.elements.filter((e) => e.name.startsWith('hole'))) {
      const hole = host.sheet.items[el.from];
      const pts = points(hole);
      const x0 = Math.min(...pts.map(([x]) => x)) + gap + HAIRLINE / 2;
      const y0 = Math.min(...pts.map(([, y]) => y)) + gap + HAIRLINE / 2;
      const x1 = Math.max(...pts.map(([x]) => x)) - gap - HAIRLINE / 2;
      const y1 = Math.max(...pts.map(([, y]) => y)) - gap - HAIRLINE / 2;
      const occupied: { x: number; y: number; w: number; h: number }[] = [];
      for (const { p, i } of guests) {
        if (i === hi || used.has(i)) continue;
        const b = p.cutBounds;
        let found = false;
        const w = b.w,
          h = b.h;
        for (let y = y0; y + h <= y1 + 1e-8 && !found; y += 1)
          for (let x = x0; x + w <= x1 + 1e-8 && !found; x += 1) {
            const rect: Item = {
              op: 'cut',
              k: 'poly',
              pts: [
                [x, y],
                [x + w, y],
                [x + w, y + h],
                [x, y + h],
              ],
            };
            if (!rect.pts.every((q) => inside(q, hole))) continue;
            if (occupied.some((r) => x < r.x + r.w + gap && x + w + gap > r.x && y < r.y + r.h + gap && y + h + gap > r.y)) continue;
            // Check containment and separation before placing anything. The rectangles include the guest's hairline.
            const probe = new LaserSheet(host.w, host.h);
            probe.items.push(hole, rect);
            if (cutSpacingProblems(probe, gap + HAIRLINE / 2).some((c) => c.b === `cut ${probe.items.length - 1}`)) continue;
            const at: Placed = {
              name: p.name,
              x: x - pad - b.x,
              y: y - pad - b.y,
              w: p.w,
              h: p.h,
              turn: 0,
            };
            nested.set(hi, [...(nested.get(hi) ?? []), { guest: i, at }]);
            used.add(i);
            occupied.push({ x, y, w, h });
            found = true;
          }
      }
    }
  }
  // packStock identifies parts by name. Give each root a unique temporary name so duplicate parts get their own guests.
  const roots = parts.flatMap((p, i) => (used.has(i) ? [] : [Object.assign(Object.create(p) as Part, { name: String(i) })]));
  const packed = packStock(roots, stock, gap);
  return packed.map((s, si) => {
    const placed: Placed[] = [];
    for (const root of s.placed) {
      const i = Number(root.name),
        host = parts[i];
      placed.push({ ...root, name: host.name });
      for (const { guest, at } of nested.get(i) ?? []) {
        const p = parts[guest];
        const child: Placed = {
          name: p.name,
          x: root.x + (root.turn ? host.h - at.y - p.h : at.x),
          y: root.y + (root.turn ? at.x : at.y),
          w: root.turn ? p.h : p.w,
          h: root.turn ? p.w : p.h,
          turn: root.turn,
        };
        placePart(s.sheet, p, child);
        placed.push(child);
      }
    }
    return { file: `sheet-${si + 1}`, title: `Sheet ${si + 1}: ${stock} inch stock`, sheet: s.sheet, placed };
  });
}

/** The deterministic fitting table uses the same layout as the downloadable sheets. */
export function stockFitting(parts: readonly Part[], gap = PART_GAP) {
  return (Object.keys(STOCK) as StockSize[]).map((stock) => {
    const sheets = packKitStock(parts, stock, gap).length;
    const materialMm2 = sheets * STOCK[stock].w * STOCK[stock].h;
    return { stock, sheets, materialMm2, materialIn2: materialMm2 / 25.4 ** 2, label: `fits ${sheets} ${sheets === 1 ? 'sheet' : 'sheets'} of ${stock}` };
  });
}

/** Every operation, including score and engraving, must stay inside the cutter margins, including its hairline. */
export function stockProblems(sheet: LaserSheet): string[] {
  return sheet.items.flatMap((it, i) => {
    const pad = it.op === 'engrave' ? 0 : HAIRLINE / 2;
    return points(it).some(
      ([x, y]) =>
        x - pad < STOCK_MARGIN.x - 1e-6 ||
        y - pad < STOCK_MARGIN.y - 1e-6 ||
        x + pad > sheet.w - STOCK_MARGIN.x + 1e-6 ||
        y + pad > sheet.h - STOCK_MARGIN.y + 1e-6,
    )
      ? [`item ${i} leaves the cutter margins`]
      : [];
  });
}
