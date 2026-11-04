// Tests: the laser joint helpers (tools kit/laserJoints, laserLayout) and Final Curtain's Stage Box (games/sleuth/laser): red
// stroke-only cuts and blue fill-only engraving (never magenta score), every sheet inside the Glowforge bed, closed cuts that
// lie outside all engraving, no two elements too close, finger joints that mesh, kerf and slot fits, and a mechanism that
// only releases the drawer when the dagger, the front curtain and the rear curtain are worked in that order.
import { describe, expect, it } from 'vitest';
import { notchSpans, offsetPoly, outlineFromRects } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';
import { BED } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { CUT, ENGRAVE } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { checkMechanism, dims } from '../../games/sleuth/laser/stageBoxDims';
import { buildStageBox } from '../../games/sleuth/laser/stageBoxBuild';

describe('laser joint helpers', () => {
  it('traces the outline of rectangles with a notch', () => {
    const pts = outlineFromRects([[0, 0, 10, 10]], [[4, 0, 6, 3]]);
    expect(pts).toHaveLength(8);
    expect(Math.abs(pts.reduce((s, p, i) => s + p[0] * pts[(i + 1) % 8][1] - pts[(i + 1) % 8][0] * p[1], 0)) / 2).toBe(94);
  });
  it('grows a rectangle by the offset', () => {
    const o = offsetPoly(
      [
        [0, 0],
        [10, 0],
        [10, 5],
        [0, 5],
      ],
      0.1,
    );
    expect(Math.max(...o.map((p) => p[0])) - Math.min(...o.map((p) => p[0]))).toBeCloseTo(10.2, 6);
    const h = offsetPoly(
      [
        [0, 0],
        [10, 0],
        [10, 5],
        [0, 5],
      ],
      -0.1,
    );
    expect(Math.max(...h.map((p) => p[1])) - Math.min(...h.map((p) => p[1]))).toBeCloseTo(4.8, 6);
  });
  it('makes the two sides of a finger joint mesh with no overlap and no gap', () => {
    for (const E of [96, 120, 126]) {
      const own = notchSpans(E, 3, { parity: 'odd', cubeStart: true, cubeEnd: true });
      const wall = notchSpans(E, 3, { parity: 'even', ends: true, cubeStart: true, cubeEnd: true });
      const all = [...own, ...wall].sort((a, b) => a[0] - b[0]);
      expect(all[0][0]).toBe(0);
      all.forEach((s, i) => i && expect(s[0]).toBeCloseTo(all[i - 1][1], 9));
      expect(all.at(-1)![1]).toBeCloseTo(E, 9);
    }
  });
});

const stage = buildStageBox(0.2);
const d = dims();

describe('Stage Box sheets', () => {
  it('uses red cuts and blue engraving only, in real millimeters, inside the bed', () => {
    for (const s of stage.sheets) {
      const svg = s.sheet.svg(s.title);
      const colors = new Set([...svg.matchAll(/(?:stroke|fill)="(#[0-9a-fA-F]{3,6})"/g)].map((m) => m[1].toLowerCase()));
      expect([...colors].every((c) => [CUT, ENGRAVE].includes(c))).toBe(true);
      expect(svg).not.toMatch(/<text|font-family|transform=|#ff00ff|id="score"/);
      expect(svg).toMatch(/width="[\d.]+mm" height="[\d.]+mm"/);
      expect(s.sheet.w).toBeLessThanOrEqual(BED.w);
      expect(s.sheet.h).toBeLessThanOrEqual(BED.h);
      const cut = svg.match(/<g id="cut"[^>]*>(.*?)<\/g>/s)![1];
      for (const p of cut.matchAll(/<path d="([^"]*)"/g)) expect(p[1].trim().endsWith('Z')).toBe(true);
      expect(s.sheet.items.every((i) => (i.op === 'cut' ? true : i.op === 'engrave'))).toBe(true);
    }
  });
  it('puts every cut outside all engraving, and no two elements too close', () => {
    expect(stage.problems).toEqual([]);
    for (const c of Object.values(stage.clearance)) expect(c).toEqual([]);
  });
  it('keeps letters at least 2.45 mm tall and places every part once per its quantity', () => {
    for (const { part } of Object.values(stage.parts)) for (const t of part.texts) expect(t.capMm).toBeGreaterThanOrEqual(2.45);
    const placed = stage.sheets.flatMap((s) => s.placed.map((p) => p.name));
    for (const m of Object.values(stage.parts)) expect(placed.filter((n) => n === m.part.name)).toHaveLength(m.qty);
  });
  it('takes the kerf as a parameter: parts grow by half a kerf each side, slots shrink', () => {
    const a = buildStageBox(0, 3, false);
    const b = buildStageBox(0.4, 3, false);
    const width = (n: string, k: typeof a, i: number) => {
      const it = k.parts[n].part.sheet.items[i] as unknown as { pts: number[][] };
      const xs = it.pts.map((p) => p[0]);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width('P', b, 0) - width('P', a, 0)).toBeCloseTo(0.4, 6);
    expect(width('FLOOR', a, 1) - width('FLOOR', b, 1)).toBeCloseTo(0.4, 6);
  });
  it('gives plates a sliding fit in their slots', () => {
    const slot = stage.parts.FLOOR.part.sheet.items[1] as unknown as { pts: number[][] };
    const ys = slot.pts.map((p) => p[1]);
    expect(Math.max(...ys) - Math.min(...ys) + stage.kerf).toBeCloseTo(d.t + 0.4, 6);
  });
});

describe('Stage Box mechanism', () => {
  const m = checkMechanism(d);
  it('can be unlocked, and only by moving the plates in order', () => {
    expect(m.unlockedReachable).toBe(true);
    expect(m.orderBroken).toBe(false);
    expect(m.unlockedAt!.every((v) => v >= m.clear)).toBe(true);
  });
  it('lets the lever carry the first plate all the way, with room for its post', () => {
    expect(m.leverEnough).toBe(true);
    expect(m.overlap).toBeGreaterThanOrEqual(2.5);
    expect(m.postSlot.w).toBeCloseTo(4.4, 6);
  });
  it('holds the drawer with one finger in the gap before each skirt', () => {
    const slots = [d.yC, d.yD1, d.yD2].map((y) => [y - d.slotW / 2, y + d.slotW / 2]);
    d.fingerY.forEach((f, i) => {
      expect(f + d.fingerW).toBeLessThanOrEqual(slots[i][0]); // in front of its plate
      expect(slots[i][0] - (f + d.fingerW)).toBeLessThan(1); // and close enough to stop it
      if (i) expect(f).toBeGreaterThanOrEqual(slots[i - 1][1]); // not inside the plate before
    });
    expect(d.skirt.z0).toBeLessThan(d.drawer.top - d.t); // the skirts hang below the comb's fingers
    expect(d.pegZ[1] + d.play).toBeLessThan(d.window.z0); // pegs and their slots sit behind the apron
    expect(d.pegZ2[1] + d.play).toBeLessThan(d.window.z0);
  });
});
