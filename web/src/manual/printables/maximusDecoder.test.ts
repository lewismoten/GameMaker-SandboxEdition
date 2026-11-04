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
  BEHIND,
  GLYPHS,
  HATCHES,
  HATCH_OPEN,
  HIDDEN,
  INNER,
  MIDDLE,
  OUTER,
  WINDOWS,
  codeFor,
  windowShows,
} from '../../../../games/maximus/src/wheel/wheel';
import { hatchPicture, HATCH_PIC } from '../../../../games/maximus/src/blocks/homeSet';
import { GATE } from '../../../../games/maximus/src/levels/home';

const printables = JSON.parse(readFileSync(join(__dirname, '../../../../games/maximus/printables.json'), 'utf8')) as { items: { kind: string }[] };
const wheel = printables.items.find((i) => i.kind === 'codewheel') as CodeWheelItem;

describe("Maximus: the Courier's Star Wheel matches the game", () => {
  it('is a three-disc wheel with the rings, windows and pictures of games/maximus/src/wheel', () => {
    expect(wheel.outer).toEqual(OUTER);
    expect(wheel.middle).toEqual(MIDDLE);
    expect(wheel.inner).toEqual(INNER);
    expect(wheel.hidden).toEqual(HIDDEN);
    expect(wheel.behind).toEqual(BEHIND);
    expect(wheel.windows).toEqual(WINDOWS);
    expect(wheel.glyphs).toEqual(GLYPHS);
  });

  it('every picture is nine by nine', () => {
    for (const [name, rows] of Object.entries(GLYPHS)) {
      expect(rows, name).toHaveLength(9);
      for (const r of rows) expect(r, name).toMatch(/^[#.]{9}$/);
    }
  });

  it('has several windows on one ring: the middle disc has holes, and the big disc has a ring to show through them', () => {
    expect(WINDOWS.length).toBeGreaterThan(1);
    expect(new Set(WINDOWS.map((w) => w.ring)).size).toBe(1);
    const ring = HIDDEN[0];
    const holes = ring.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
    expect(holes.length).toBeGreaterThan(1);
    expect(holes.length).toBeLessThanOrEqual(ring.length / 2);
    // buildable on paper: no two holes touch, so the middle disc is never cut into pieces
    for (const h of holes) expect(ring[(h + 1) % ring.length], `holes at ${h}`).not.toBe('');
    expect(BEHIND[0].every((c) => c && GLYPHS[c])).toBe(true);
    expect(ring.every((c) => !c || GLYPHS[c])).toBe(true);
  });

  it('simulates the three discs: every setting reads one pair, and the dock, the world and the mark each change it', () => {
    const n = OUTER.length;
    const at = (d: number, w: number, m: number) => codeFor(OUTER[d], MIDDLE[w], INNER[m]).join();
    // the discs by hand: the window over cell p of the middle disc (p = window - mark); a hole shows the big disc
    for (let d = 0; d < n; d++)
      for (let w = 0; w < n; w++)
        for (let m = 0; m < n; m++)
          WINDOWS.forEach((win, k) => {
            const p = (((win.at - m) % n) + n) % n;
            const want = HIDDEN[0][(p + w) % n] || BEHIND[0][(p + d) % n];
            expect(windowShows(OUTER[d], MIDDLE[w], INNER[m], k)).toBe(want);
          });
    // for the clearance form's dock and world, the ten marks read ten different pairs
    const d = OUTER.indexOf(CLEARANCE.dock);
    const w = MIDDLE.indexOf(CLEARANCE.world);
    const m = INNER.indexOf(CLEARANCE.mark);
    expect(new Set(INNER.map((_, k) => at(d, w, k))).size).toBe(n);
    // the right pair needs the right dock and the right world
    for (let o = 0; o < n; o++) {
      if (o !== d) expect(at(o, w, m), `dock ${OUTER[o]}`).not.toBe(at(d, w, m));
      if (o !== w) expect(at(d, o, m), `world ${MIDDLE[o]}`).not.toBe(at(d, w, m));
    }
    // at the clearance setting one window shows the middle disc's print and one looks through to the big disc
    const through = WINDOWS.map((win) => !HIDDEN[0][(((((win.at - m) % n) + n) % n) + w) % n]);
    expect(through).toContain(true);
    expect(through).toContain(false);
    // turning the big disc changes what the see-through window shows; turning the middle disc changes which windows see through
    expect(new Set(OUTER.map((_, o) => at(o, w, m))).size).toBeGreaterThan(3);
    expect(
      new Set(MIDDLE.map((_, o) => through.map((__, k) => HIDDEN[0][(((((WINDOWS[k].at - m) % n) + n) % n) + o) % n] === '').join())).size,
    ).toBeGreaterThan(2);
  });

  it("the puzzle's setting is on the discs, its answer names the right hatch, and no other hatch wears that code", () => {
    const p = wheel.puzzles![0];
    expect(p.turn).toEqual({ outer: CLEARANCE.dock, middle: CLEARANCE.world, inner: CLEARANCE.mark });
    expect(turnFor(wheel, p.turn.inner, p.turn.outer)).toBeGreaterThanOrEqual(0);
    expect(p.windowsRead).toEqual(WINDOWS.map((_, k) => k));
    expect(CLEARANCE_CODE).toEqual(codeFor(CLEARANCE.dock, CLEARANCE.world, CLEARANCE.mark));
    expect(HATCHES[HATCH_OPEN]).toEqual(CLEARANCE_CODE);
    expect(HATCHES.filter((c) => c.join() === CLEARANCE_CODE.join())).toHaveLength(1);
    expect(new Set(HATCHES.map((c) => c.join())).size).toBe(HATCHES.length);
    const said = CLEARANCE_CODE.map((c) => c.replace('code ', '').toLowerCase());
    expect(p.answer!.indexOf(said[0])).toBeGreaterThanOrEqual(0);
    expect(p.answer!.indexOf(said[1])).toBeGreaterThan(p.answer!.indexOf(said[0]));
    expect(p.answer).toContain('middle');
    expect(HATCH_OPEN).toBe(1);
  });

  it.each(HATCHES.map((c, k) => [c.join(' + '), c, k] as const))(
    'the hatch %s (%i from the bottom) wears its two pictures as the wheel draws them',
    (_n, codes) => {
      const pic = hatchPicture(codes);
      const bg = pic.get(HATCH_PIC.x - 1, HATCH_PIC.y);
      codes.forEach((code, k) =>
        GLYPHS[code].forEach((r, y) =>
          [...r].forEach((ch, x) => expect(pic.get(HATCH_PIC.x + x, HATCH_PIC.y + k * HATCH_PIC.step + y) !== bg, `${code} ${x},${y}`).toBe(ch === '#')),
        ),
      );
    },
  );

  it('the hatches sit in the three pairs of rows of the pod bay wall', () => {
    expect(GATE.hatchRows).toHaveLength(HATCHES.length);
    expect(new Set(GATE.hatchRows.flatMap((r) => [r, r + 1])).size).toBe(6);
  });
});
