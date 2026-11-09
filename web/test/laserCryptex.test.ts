// Tests: the In The Year 2000! cryptex (games/year2000/laser): red stroke-only cuts and blue fill-only engraving (never magenta
// score), every sheet inside the Glowforge bed, cuts outside all engraving, no two elements too close, the kerf a parameter, and
// a lock that frees the core only for the one combination (every one of the 10,000 is tried), at the kerfs a laser might have.
import { describe, expect, it } from 'vitest';
import { BED } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { CUT, ENGRAVE } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { buildCryptex } from '../../games/year2000/laser/cryptexBuild';
import { CORE, COMBO, POCKET, RINGS, SLICES_PER_RING, T, WASHER, checkLock } from '../../games/year2000/laser/cryptexDims';
import { assemblySvg } from '../../games/year2000/laser/cryptexSteps';

const kit = buildCryptex();

describe('cryptex sheets', () => {
  it('uses only red cut strokes and blue engrave fills, one pass, inside the bed', () => {
    expect(kit.sheets).toHaveLength(3);
    for (const s of kit.sheets) {
      const svg = s.sheet.svg(s.title);
      const colors = new Set([...svg.matchAll(/(?:stroke|fill)="(#[0-9a-f]{6})"/gi)].map((m) => m[1].toLowerCase()));
      expect([...colors].every((c) => [CUT, ENGRAVE].includes(c))).toBe(true);
      expect(svg).not.toMatch(/<text|font-family|transform=|#ff00ff|id="score"/);
      expect(s.sheet.w).toBeLessThanOrEqual(BED.w);
      expect(s.sheet.h).toBeLessThanOrEqual(BED.h);
    }
  });
  it('puts every cut outside all engraving, and no two elements too close', () => {
    expect(kit.problems).toEqual([]);
    for (const c of Object.values(kit.clearance)) expect(c).toEqual([]);
  });
  it('places every part once per its quantity', () => {
    const placed = kit.sheets.flatMap((s) => s.placed.map((p) => p.name));
    for (const m of Object.values(kit.parts)) expect(placed.filter((n) => n === m.part.name)).toHaveLength(m.qty);
  });
  it('takes the kerf as a parameter: parts grow by half a kerf each side', () => {
    const a = buildCryptex(0, false);
    const b = buildCryptex(0.4, false);
    const width = (k: typeof a) => {
      const it = k.parts.BASE.part.sheet.items[0] as unknown as { pts: number[][] };
      const xs = it.pts.map((p) => p[0]);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width(b) - width(a)).toBeCloseTo(0.4, 6);
  });
  it('writes an assembly sheet with every card', () => {
    const svg = assemblySvg();
    for (const t of ['1. Base', '2. Core', '3. Washers', '4. Rings', '5. Stack', '6. Head and lid']) expect(svg).toContain(t);
  });
});

describe('cryptex stack', () => {
  it('has a core as long as the pocket plus the rings', () => {
    const core = 1 + (CORE.ridgeSlices - 1) + CORE.roundSlices;
    expect(core * T).toBe((POCKET.plates + RINGS.length * SLICES_PER_RING) * T);
  });
  it('keeps the ridge in the pocket, under the rings, until the pull', () => {
    expect(CORE.ridgeSlices).toBeLessThan(POCKET.plates);
  });
  it('leaves a 3 mm wall between a notch and the washer outline, and sizes the rings in steps wider than a digit band', () => {
    expect(WASHER.apothem - WASHER.notchOut).toBeGreaterThanOrEqual(3);
    RINGS.slice(1).forEach((r, k) => expect(r - RINGS[k]).toBeGreaterThanOrEqual(7));
  });
});

describe('cryptex lock', () => {
  it('frees the core for 2 0 0 0 and for no other of the 10,000 combinations', () => {
    expect(checkLock(0.2).opens).toEqual([COMBO.join('')]);
  });
  it('fits the pocket, blocks the next digit over, and lets a ring be a few degrees off', () => {
    const l = checkLock(0.2);
    expect(l.pocketFits).toBe(true);
    expect(l.wrongDigitBlocked).toBe(true);
    expect(l.windowDeg).toBeGreaterThanOrEqual(4);
    expect(l.windowDeg).toBeLessThan(18);
  });
  it('still works for a laser kerf of 0.1 or 0.3 mm when the files were made for 0.2', () => {
    for (const actual of [0.1, 0.3]) {
      const l = checkLock(0.2, actual);
      expect(l.opens).toEqual(['2000']);
      expect(l.pocketFits).toBe(true);
      expect(l.windowDeg).toBeGreaterThan(3);
      expect(l.fits.washerInSocket).toBeGreaterThan(0.04);
    }
  });
  it('follows a changed combination (washers reseated)', () => {
    expect(checkLock(0.2, 0.2, [7, 3, 9, 1]).opens).toEqual(['7391']);
  });
});
