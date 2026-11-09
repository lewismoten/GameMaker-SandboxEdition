// The paper THE CHEZ on one Glowforge sheet: cut (red) outlines and windows, score (magenta) folds, engrave (blue) stripes, roof,
// tires and the charge port. Each piece is drawn on its own small sheet first so the spacing check can run on it.
import { BED } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { tooClose, type Close, type Element } from '@lewismoten/gamemaker-sandbox-tools/kit/laserClearance';
import { LaserSheet } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import type { Piece } from './papercraftParts';

const GAP = 5;

function pieceSheet(p: Piece): { sheet: LaserSheet; problems: Close[] } {
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
  return { sheet, problems: tooClose(sheet, els, 1, 1.5) };
}

export interface LaserBuild {
  sheet: LaserSheet;
  placed: { name: string; x: number; y: number; w: number; h: number }[];
  problems: string[];
}

/** Every piece (times its quantity) in rows on one bed-sized sheet. */
export function buildLaser(pieces: Piece[]): LaserBuild {
  const rows: Piece[][] = [[], [], []];
  const byName = (n: string) => pieces.find((p) => p.name === n)!;
  const times = (p: Piece) => Array.from({ length: p.qty }, () => p);
  rows[0] = [byName('Underside strip'), byName('Top strip')];
  rows[1] = [byName('Driver side panel'), byName('Passenger side panel'), ...times(byName('Tire'))];
  rows[2] = [...times(byName('Bumper')), ...times(byName('Wheel'))];
  const problems: string[] = [];
  const cache = new Map<string, LaserSheet>();
  const placed: LaserBuild['placed'] = [];
  const bits: [LaserSheet, number, number][] = [];
  let y = GAP;
  let maxW = 0;
  for (const row of rows) {
    let x = GAP;
    let rh = 0;
    for (const p of row) {
      let s = cache.get(p.name);
      if (!s) {
        const made = pieceSheet(p);
        s = made.sheet;
        cache.set(p.name, s);
        for (const c of made.problems) problems.push(`${p.name}: ${c.a} / ${c.b} ${c.mm} mm`);
      }
      bits.push([s, x, y]);
      placed.push({ name: p.name, x, y, w: p.w, h: p.h });
      x += p.w + GAP;
      rh = Math.max(rh, p.h);
    }
    maxW = Math.max(maxW, x);
    y += rh + GAP;
  }
  if (maxW > BED.w || y > BED.h) problems.push(`the sheet is ${maxW.toFixed(0)} x ${y.toFixed(0)} mm, over the ${BED.w} x ${BED.h} mm bed`);
  const sheet = new LaserSheet(Math.ceil(maxW), Math.ceil(y));
  for (const [s, x, yy] of bits) sheet.place(s, x, yy);
  return { sheet, placed, problems };
}
