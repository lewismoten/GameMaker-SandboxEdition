// Where the tour puts its hosts and bubbles: on screen, above the caption bar, and off the control.
import { describe, expect, it } from 'vitest';
import { placeBubble, standBy, walkMs, type Rect } from './place';

const VIEWS = [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
];
const FLOOR = 110;
const inView = (r: Rect, v: { w: number; h: number }) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h - FLOOR;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('placing the tour', () => {
  for (const v of VIEWS) {
    const targets: Rect[] = [
      { x: 8, y: 8, w: 40, h: 30 }, // a header button at the left
      { x: v.w - 50, y: 8, w: 44, h: 36 }, // the ⚙ at the right
      { x: v.w / 2 - 60, y: v.h / 2, w: 120, h: 34 }, // a button mid-page
      { x: 16, y: 60, w: v.w - 32, h: 300 }, // something wide
      { x: v.w - 120, y: v.h - FLOOR - 40, w: 110, h: 34 }, // low down at the right
    ];
    it(`keeps a host on screen at ${v.w}`, () => {
      for (const t of targets)
        for (const press of [false, true]) {
          const p = standBy(t, { w: 60, h: 48 }, v, FLOOR, press);
          expect(inView({ ...p, w: 60, h: 48 }, v), JSON.stringify({ t, press, p })).toBe(true);
        }
    });
    it(`keeps a bubble on screen and off the control at ${v.w}`, () => {
      const size = { w: Math.min(320, v.w - 32), h: 90 };
      const speaker = { x: 16, y: v.h - FLOOR - 56, w: 60, h: 48 };
      for (const t of targets) {
        const b = placeBubble(speaker, size, v, FLOOR, t);
        const r = { x: b.x, y: b.y, w: size.w, h: size.h };
        expect(inView(r, v), JSON.stringify({ t, b })).toBe(true);
        expect(overlaps(r, speaker), JSON.stringify({ t, b })).toBe(false);
        expect(b.tail).toBeGreaterThanOrEqual(16);
      }
    });
  }

  it('walks at a steady pace', () => {
    expect(walkMs({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(250);
    expect(walkMs({ x: 0, y: 0 }, { x: 5000, y: 0 })).toBe(1800);
  });
});
