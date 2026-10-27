// The print shop's measurements: The Game Crafter's large retail box template as measured, the
// disk and CD label sheets, the bleed and safe margins, and that a sheet's art and die cut are
// the same size in pixels (so one lies over the other).
import { describe, expect, it } from 'vitest';
import { BLEED, DPI, SAFE, cropMarks, dieSvg, pixelSize, type DieLines, type Shape } from './dieLines';
import { BOX, boxDie, boxPanels, boxStops } from './retailBoxTemplate';
import { CD_CENTERS, CD_LABEL, cdSheetDie, diskSheetDie, diskSlots, DISK_CASE, DISK_LABEL, LETTER } from './labelSheets';

const bounds = (s: Shape): [number, number, number, number] =>
  s.kind === 'circle'
    ? [s.cx - s.r, s.cy - s.r, s.cx + s.r, s.cy + s.r]
    : [Math.min(...s.pts.map((p) => p[0])), Math.min(...s.pts.map((p) => p[1])), Math.max(...s.pts.map((p) => p[0])), Math.max(...s.pts.map((p) => p[1]))];

describe('the retail box template', () => {
  it('is The Game Crafter’s large retail box: 3975 x 4725 pixels at 300 dpi', () => {
    expect(DPI).toBe(300);
    expect(pixelSize(boxDie())).toEqual([3975, 4725]);
    expect(BOX.sheet).toEqual([13.25, 15.75]);
  });

  it('has a 1/8 in bleed round a 13 x 15.5 in trim', () => {
    const [x0, y0, x1, y1] = bounds(boxDie().cuts[0]);
    expect(BLEED).toBe(0.125);
    expect([x0, y0]).toEqual([BLEED, BLEED]);
    expect(x1 - x0).toBeCloseTo(13);
    expect(y1 - y0).toBeCloseTo(15.5);
    expect(BOX.sheet[0] - x1).toBeCloseTo(BLEED);
    expect(BOX.sheet[1] - y1).toBeCloseTo(BLEED);
  });

  it('puts its folds where the template’s green lines are (in pixels at 300 dpi)', () => {
    const { xs, ys } = boxStops();
    expect(xs.map((x) => x * DPI)).toEqual([37.5, 243.75, 581.25, 3393.75, 3731.25, 3937.5]);
    expect(ys.map((y) => y * DPI)).toEqual([37.5, 243.75, 581.25, 4143.75, 4481.25, 4687.5]);
  });

  it('has a 9.375 x 11.875 in face and 1.125 in walls', () => {
    const p = boxPanels();
    expect(p.face.slice(2)).toEqual([9.375, 11.875]);
    expect(p.left[2]).toBe(1.125);
    expect(p.top[3]).toBe(1.125);
    expect(p.leftIn[2]).toBe(0.6875);
  });

  it('keeps every safe line 1/8 in inside its panel', () => {
    const die = boxDie();
    const [fx, fy, fw, fh] = boxPanels().face;
    const [sx0, sy0, sx1, sy1] = bounds(die.safe[0]);
    expect([sx0, sy0]).toEqual([fx + SAFE, fy + SAFE]);
    expect(sx1).toBeCloseTo(fx + fw - SAFE);
    expect(sy1).toBeCloseTo(fy + fh - SAFE);
  });

  it('has no bleed when it is turned off', () => {
    expect(boxDie(false).bleed).toBe(0);
  });
});

describe('the label sheets', () => {
  it('are letter paper', () => {
    for (const die of [diskSheetDie(true), cdSheetDie(true)]) {
      expect([die.w, die.h]).toEqual(LETTER);
      expect(pixelSize(die)).toEqual([2550, 3300]);
    }
  });

  it('put six 2.75 in disk labels on a sheet, inside the 8 x 10.5 in that prints at actual size, bleeds clear of each other', () => {
    const die = diskSheetDie(true);
    expect(diskSlots()).toHaveLength(6);
    for (const c of die.cuts) {
      const [x0, y0, x1, y1] = bounds(c);
      expect(x1 - x0).toBeCloseTo(DISK_LABEL.w);
      expect(y1 - y0).toBeCloseTo(DISK_LABEL.h);
      expect(x0 - BLEED).toBeGreaterThanOrEqual(0.25);
      expect(y0 - BLEED).toBeGreaterThanOrEqual(0.25);
      expect(x1 + BLEED).toBeLessThanOrEqual(8.25);
      expect(y1 + BLEED).toBeLessThanOrEqual(10.75);
    }
    const [a, b] = diskSlots();
    expect(b[0] - a[0] - DISK_LABEL.w).toBeGreaterThanOrEqual(2 * BLEED + 0.25);
    // two folds a label: back strip | top edge | front
    expect(die.folds).toHaveLength(12);
  });

  it('fit a disk label’s front in a 3.5" disk’s recess, clear of its windows, and its back strip above the hub', () => {
    const { recess, window: win, hub } = DISK_CASE;
    const x = (DISK_CASE.w - DISK_LABEL.w) / 2;
    expect(x).toBeGreaterThanOrEqual(recess.x);
    expect(x + DISK_LABEL.w).toBeLessThanOrEqual(recess.x + recess.w);
    expect(x).toBeGreaterThan(win.inset + win.w);
    expect(DISK_LABEL.h - DISK_LABEL.back - DISK_LABEL.edge).toBeLessThanOrEqual(recess.h);
    expect(DISK_LABEL.back).toBeLessThan(hub.y - hub.r);
    expect(DISK_LABEL.edge * 25.4).toBeCloseTo(3.2, 0);
  });

  it('put two 117 mm CD labels with 41 mm holes on a sheet, inside the 8 x 10.5 in', () => {
    const die = cdSheetDie(true);
    expect(CD_LABEL.outer * 25.4).toBeCloseTo(117);
    expect(CD_LABEL.hole * 25.4).toBeCloseTo(41);
    expect(die.cuts).toHaveLength(4);
    for (const [, cy] of CD_CENTERS) {
      expect(cy - CD_LABEL.outer / 2 - BLEED).toBeGreaterThanOrEqual(0.25);
      expect(cy + CD_LABEL.outer / 2 + BLEED).toBeLessThanOrEqual(10.75);
    }
    expect(CD_CENTERS[1][1] - CD_CENTERS[0][1] - CD_LABEL.outer).toBeGreaterThanOrEqual(2 * BLEED);
  });

  it('keep crop marks clear of every bleed', () => {
    const die: DieLines = diskSheetDie(true);
    const grown = die.cuts.map((c) => {
      const [x0, y0, x1, y1] = bounds(c);
      return [x0 - BLEED, y0 - BLEED, x1 + BLEED, y1 + BLEED];
    });
    for (const m of cropMarks(die))
      for (const [px, py] of m) for (const [x0, y0, x1, y1] of grown) expect(px > x0 && px < x1 && py > y0 && py < y1).toBe(false);
  });
});

describe('the die-cut files', () => {
  it('make an SVG the sheet’s size in inches, with cut, fold, safe and bleed layers', () => {
    const svg = dieSvg(boxDie(), 'Box');
    expect(svg).toContain('width="13.25in"');
    expect(svg).toContain('height="15.75in"');
    for (const layer of ['cut', 'fold', 'safe', 'bleed']) expect(svg).toContain(`id="${layer}"`);
  });

  it('are the same size as the art at any dpi', () => {
    for (const die of [boxDie(), diskSheetDie(false), cdSheetDie(true)])
      for (const dpi of [40, 150, 300]) expect(pixelSize(die, dpi)).toEqual([Math.round(die.w * dpi), Math.round(die.h * dpi)]);
  });
});
