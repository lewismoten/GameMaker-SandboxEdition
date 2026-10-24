// Tests: the sublimation page's layout (desk/mug/mugLayout.ts): front and back half the round
// apart, the crop is the pictures plus the bleed, strips stay apart and inside the margins.
import { describe, expect, it } from 'vitest';
import { BLEED, DEFAULT_LIFT, LABEL_BAND, TICK_BAND, pageLayout, pagePixels, pageSize, pageX, stripLayout, svgSize } from '../src/desk/mug/mugLayout';
import { MARGIN, MUG_SIZES, PAPERS, circumference } from '../src/desk/mug/mugSizes';

const paper = (id: string) => PAPERS.find((p) => p.id === id)!;
const size = (id: string) => MUG_SIZES.find((s) => s.id === id)!;
const BBS = 640 / 224; // a short, wide ANSI logo
const GAME = 344 / 240; // a game's badge (gameBadge.ts BADGE_W x BADGE_H)

describe('mug sizes', () => {
  it('match the blank makers’ templates', () => {
    expect(size('11oz').wrapW).toBeGreaterThanOrEqual(8.25);
    expect(size('11oz').wrapW).toBeLessThanOrEqual(9.3);
    expect(circumference(size('11oz'))).toBeCloseTo(10.05, 1);
    // a tumbler's full wrap meets itself
    expect(circumference(size('20oz'))).toBeCloseTo(size('20oz').wrapW, 1);
    expect(size('20oz').wrapH).toBe(8.2);
    for (const s of MUG_SIZES) if (s.handle) expect(s.wrapW).toBeLessThan(circumference(s)); // a gap under the handle
  });
});

describe('a mug’s strip', () => {
  for (const s of MUG_SIZES)
    it(`${s.name}: front and back exactly half the round apart, level, no wider than a third`, () => {
      const l = stripLayout({ size: s, front: BBS, back: GAME }, 8.25);
      expect(l.centers.back - l.centers.front).toBeCloseTo(circumference(s) / 2, 10);
      expect(l.art.front!.y + l.art.front!.h / 2).toBeCloseTo(l.art.back!.y + l.art.back!.h / 2, 10);
      expect(l.art.front!.x + l.art.front!.w / 2).toBeCloseTo(l.centers.front, 10);
      for (const r of [l.art.front!, l.art.back!]) {
        expect(r.w).toBeLessThanOrEqual(circumference(s) / 3 + 1e-9);
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(s.wrapW);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.y + r.h).toBeLessThanOrEqual(s.wrapH);
      }
    });

  it('a quarter of the round from the handle: the front on the left end’s side, swapped for the left hand', () => {
    const s = size('11oz');
    const gap = (circumference(s) - s.wrapW) / 2; // from the handle to the wrap's end
    const r = stripLayout({ size: s, front: GAME }, 8.25);
    expect(r.centers.front + gap).toBeCloseTo(circumference(s) / 4, 10);
    expect(r.centers.back + gap).toBeCloseTo((3 * circumference(s)) / 4, 10);
    const l = stripLayout({ size: s, front: GAME, leftHanded: true }, 8.25);
    expect(l.centers.front).toBeCloseTo(r.centers.back, 10);
    // a tumbler's wrap is the whole round: 25% and 75% of it from the seam
    const t = stripLayout({ size: size('20oz'), front: GAME, back: GAME }, 8.25);
    expect(t.centers.front / size('20oz').wrapW).toBeCloseTo(0.25, 3); // the round is 9.299 in
    expect(t.centers.back / size('20oz').wrapW).toBeCloseTo(0.75, 3);
  });

  it('crops to the pictures plus the bleed', () => {
    for (const s of MUG_SIZES)
      for (const [front, back] of [
        [BBS, BBS],
        [GAME, undefined],
        [undefined, BBS],
        [BBS, GAME],
      ]) {
        const l = stripLayout({ size: s, front, back }, 8.25);
        const c = l.content!;
        expect(l.crop!.y).toBeCloseTo(Math.max(0, c.y - BLEED), 10);
        expect(l.crop!.y + l.crop!.h).toBeCloseTo(Math.min(s.wrapH, c.y + c.h + BLEED), 10);
        expect(l.crop!.x).toBeCloseTo(Math.max(0, c.x - BLEED), 10);
        expect(l.crop!.x + l.crop!.w).toBeCloseTo(Math.min(s.wrapW, c.x + c.w + BLEED), 10);
      }
    // a short logo on a tall tumbler: no clamping, so exactly the content plus the bleed
    const t = stripLayout({ size: size('20oz'), front: BBS, back: BBS }, 8.25);
    expect(t.crop!.h).toBeCloseTo(t.content!.h + 2 * BLEED, 10);
    expect(t.crop!.h).toBeLessThan(2);
  });

  it('a blank mug has nothing to print', () => {
    expect(stripLayout({ size: size('11oz') }, 8.25).crop).toBeUndefined();
  });

  it('a tumbler’s pictures sit up where the hand doesn’t cover them, measured from the bottom of the cup', () => {
    const s = size('20oz');
    const l = stripLayout({ size: s, front: GAME }, 8.25);
    const wrapBottom = (s.height - s.wrapH) / 2;
    expect(s.wrapH - l.centerY + wrapBottom).toBeCloseTo(DEFAULT_LIFT, 10);
    const low = stripLayout({ size: s, front: GAME, lift: 3 }, 8.25);
    expect(s.wrapH - low.centerY + wrapBottom).toBeCloseTo(3, 10);
    // kept on the wrap however high it is asked for
    const high = stripLayout({ size: s, front: GAME, lift: 20 }, 8.25);
    expect(high.art.front!.y).toBeGreaterThanOrEqual(0);
  });
});

describe('the page', () => {
  const mix = [
    { size: size('11oz'), front: BBS, back: BBS },
    { size: size('15oz'), front: GAME, back: GAME },
    { size: size('20oz'), front: GAME, back: BBS },
    { size: size('12oz'), front: BBS },
    { size: size('11oz'), front: GAME, back: GAME },
    { size: size('11oz'), back: BBS },
    { size: size('11oz') },
    { size: size('15oz'), front: BBS, back: BBS },
  ];
  for (const id of ['letter', 'legal', 'a4'])
    for (const orientation of ['portrait', 'landscape'] as const)
      for (const mirrored of [true, false])
        it(`${id} ${orientation}${mirrored ? ' mirrored' : ''}: strips never overlap and stay in the margins`, () => {
          const page = pageLayout(paper(id), orientation, mix, mirrored);
          expect(page.strips.length).toBeGreaterThan(0);
          const right = page.pageW - MARGIN;
          const bottom = page.pageH - MARGIN;
          page.strips.forEach((p, i) => {
            expect(p.block.y).toBeGreaterThanOrEqual(MARGIN - 1e-9);
            expect(p.block.y + p.block.h).toBeLessThanOrEqual(bottom + 1e-9);
            expect(p.block.h).toBeCloseTo(TICK_BAND + p.strip.crop.h + LABEL_BAND, 10);
            if (i) expect(p.block.y).toBeGreaterThanOrEqual(page.strips[i - 1].block.y + page.strips[i - 1].block.h - 1e-9);
            for (const r of Object.values(p.strip.art)) {
              const [a, b] = [pageX(page, p.strip, r.x), pageX(page, p.strip, r.x + r.w)].sort((m, n) => m - n);
              expect(a).toBeGreaterThanOrEqual(MARGIN - 1e-9);
              expect(b).toBeLessThanOrEqual(right + 1e-9);
            }
          });
          expect(page.blank).toEqual([6]);
          expect(page.strips.length + page.overflow.length + page.blank.length).toBe(mix.length);
        });

  it('Legal holds more than Letter', () => {
    const many = Array.from({ length: 12 }, () => ({ size: size('11oz'), front: BBS, back: BBS }));
    const letter = pageLayout(paper('letter'), 'portrait', many, true);
    const legal = pageLayout(paper('legal'), 'portrait', many, true);
    expect(letter.strips.length).toBeGreaterThanOrEqual(5);
    expect(legal.strips.length).toBeGreaterThan(letter.strips.length);
    expect(legal.overflow[0]).toBe(legal.strips.length);
  });

  it('is portrait by default size, and the inch to pixel scale is exact', () => {
    expect(pageSize(paper('letter'), 'portrait')).toEqual({ w: 8.5, h: 11 });
    expect(pageSize(paper('legal'), 'portrait')).toEqual({ w: 8.5, h: 14 });
    expect(pageSize(paper('legal'), 'landscape')).toEqual({ w: 14, h: 8.5 });
    expect(pagePixels({ pageW: 8.5, pageH: 11 }, 300)).toEqual({ w: 2550, h: 3300 });
    expect(pagePixels({ pageW: 8.5, pageH: 14 }, 300)).toEqual({ w: 2550, h: 4200 });
    expect(pagePixels({ pageW: 1, pageH: 1 }, 300)).toEqual({ w: 300, h: 300 });
    expect(svgSize({ pageW: 8.5, pageH: 14 })).toEqual({ width: '8.5in', height: '14in', viewBox: '0 0 8.5 14' });
  });

  it('mirroring turns a strip round the page’s middle', () => {
    const m = [{ size: size('11oz'), front: GAME, back: GAME }];
    const a = pageLayout(paper('letter'), 'portrait', m, false);
    const b = pageLayout(paper('letter'), 'portrait', m, true);
    const s = a.strips[0].strip;
    expect(pageX(a, s, s.centers.front) + pageX(b, s, s.centers.front)).toBeCloseTo(8.5, 10);
    expect(pageX(a, s, s.centers.back) - pageX(a, s, s.centers.front)).toBeCloseTo(circumference(s.size) / 2, 10);
  });
});
