// The cut and engraved outlines of a laser-kit part as plain loops in millimeters (the part's 2 mm layout pad removed).
import type { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';

export function loopsOf(p: Part, op: 'cut' | 'engrave'): number[][][] {
  return p.sheet.items
    .filter((i) => i.op === op)
    .map((i) => {
      if (i.k === 'poly') return i.pts.map(([x, y]) => [x - 2, y - 2]);
      const r = i.k === 'ring' ? i.r1 : i.r;
      return Array.from({ length: 120 }, (_, j) => [i.cx - 2 + r * Math.cos((j * Math.PI) / 60), i.cy - 2 + r * Math.sin((j * Math.PI) / 60)]);
    });
}
