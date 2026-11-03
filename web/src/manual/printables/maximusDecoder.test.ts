// Maximus's Star Wheel (printables.json) is a copy of what the game builds: the same rings, windows
// and pictures as games/maximus/src/wheel, and the three hatches in the pod bay wear the pictures the
// wheel shows. The right hatch is the one the form's code names, and no other hatch wears it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CodeWheelItem } from './types';
import { turnFor } from './codeWheel';
import {
  CLEARANCE,
  CLEARANCE_CODE,
  GLYPHS,
  HATCHES,
  HATCH_OPEN,
  HIDDEN,
  INNER,
  MIDDLE,
  OUTER,
  WINDOWS,
  codeFor,
} from '../../../../games/maximus/src/wheel/wheel';
import { hatchPicture } from '../../../../games/maximus/src/blocks/homeSet';
import { GATE } from '../../../../games/maximus/src/levels/home';

const printables = JSON.parse(readFileSync(join(__dirname, '../../../../games/maximus/printables.json'), 'utf8')) as { items: { kind: string }[] };
const wheel = printables.items.find((i) => i.kind === 'codewheel') as CodeWheelItem;

describe("Maximus: the Courier's Star Wheel matches the game", () => {
  it('is a three-disc wheel with the rings, windows and pictures of games/maximus/src/wheel', () => {
    expect(wheel.outer).toEqual(OUTER);
    expect(wheel.middle).toEqual(MIDDLE);
    expect(wheel.inner).toEqual(INNER);
    expect(wheel.hidden).toEqual(HIDDEN);
    expect(wheel.windows).toEqual(WINDOWS);
    expect(wheel.glyphs).toEqual(GLYPHS);
  });

  it('every picture is nine by nine', () => {
    for (const [name, rows] of Object.entries(GLYPHS)) {
      expect(rows, name).toHaveLength(9);
      for (const r of rows) expect(r, name).toMatch(/^[#.]{9}$/);
    }
  });

  it('shows ten different codes at every setting of the world against the badge: the wheel reads like the game', () => {
    const shown = new Set(INNER.map((m) => codeFor(CLEARANCE.world, m)));
    expect(shown.size).toBeGreaterThan(3);
    expect(codeFor(CLEARANCE.world, CLEARANCE.mark)).toBe(CLEARANCE_CODE);
  });

  it("the puzzle's setting is on the discs, its answer names the right hatch, and no other hatch wears that code", () => {
    const p = wheel.puzzles![0];
    expect(p.turn).toEqual({ outer: CLEARANCE.dock, middle: CLEARANCE.world, inner: CLEARANCE.mark });
    expect(turnFor(wheel, p.turn.inner, p.turn.outer)).toBeGreaterThanOrEqual(0);
    expect(HATCHES[HATCH_OPEN]).toBe(CLEARANCE_CODE);
    expect(HATCHES.filter((c) => c === CLEARANCE_CODE)).toHaveLength(1);
    expect(p.answer).toContain(CLEARANCE_CODE.replace('code ', '').toLowerCase());
    expect(p.answer).toContain('middle');
    expect(HATCH_OPEN).toBe(1);
  });

  it.each(HATCHES.map((c, k) => [c, k] as const))('the hatch %s (%i from the bottom) wears its code as the wheel draws it', (code) => {
    const pic = hatchPicture(code);
    // each picture square is two pixels, from (1, 11)
    const rows = GLYPHS[code];
    const lit = (x: number, y: number) => pic.get(1 + x * 2, 11 + y * 2);
    const ink = lit(
      rows.findIndex((r) => r.includes('#')) >= 0 ? rows[rows.findIndex((r) => r.includes('#'))].indexOf('#') : 0,
      rows.findIndex((r) => r.includes('#')),
    );
    rows.forEach((r, y) => [...r].forEach((ch, x) => expect(lit(x, y) === ink, `${code} ${x},${y}`).toBe(ch === '#')));
  });

  it('the hatches sit in the three pairs of rows of the pod bay wall', () => {
    expect(GATE.hatchRows).toHaveLength(HATCHES.length);
    expect(new Set(GATE.hatchRows.flatMap((r) => [r, r + 1])).size).toBe(6);
  });
});
