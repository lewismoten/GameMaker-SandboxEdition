// The embroidery generator (packages/tools/src/embroidery) and Maximus's patch: the writers round-trip through their
// readers, no stitch or jump record is over the DST limit, the design fits the 4 x 4 in hoop, and the counts make sense.
import { describe, expect, it } from 'vitest';
import { compile } from '@lewismoten/gamemaker-sandbox-tools/embroidery/compile';
import { writeDst, readDst } from '@lewismoten/gamemaker-sandbox-tools/embroidery/dst';
import { writeExp, readExp } from '@lewismoten/gamemaker-sandbox-tools/embroidery/exp';
import { writePes, readPes } from '@lewismoten/gamemaker-sandbox-tools/embroidery/pes';
import { circle } from '@lewismoten/gamemaker-sandbox-tools/embroidery/geom';
import { tatami } from '@lewismoten/gamemaker-sandbox-tools/embroidery/fill';
import { satin } from '@lewismoten/gamemaker-sandbox-tools/embroidery/satin';
import { validate } from '@lewismoten/gamemaker-sandbox-tools/embroidery/validate';
import type { Design, Pattern } from '@lewismoten/gamemaker-sandbox-tools/embroidery/types';
import { maximusPatch } from '../../games/maximus/patch/design';

const maximus = maximusPatch();
const pattern = compile(maximus);
const dst = writeDst(pattern);

/** A pattern with a far jump (over the DST limit) and two colors, for the format edge cases. */
const small: Design = {
  name: 'TEST',
  hoop: [100, 100],
  blocks: [
    { thread: { name: 'a', rgb: [0, 0, 0] }, items: [{ kind: 'fill', polys: [circle(0, 0, 5, 32)], angle: 0 }] },
    {
      thread: { name: 'b', rgb: [255, 0, 0] },
      items: [
        {
          kind: 'satin',
          path: [
            [30, 30],
            [40, 35],
          ],
          width: 2,
        },
      ],
    },
  ],
};

/** The sewn points of a pattern in whole tenths of a mm, to compare with what a file reads back. */
const sewn = (p: Pattern) => p.stitches.filter((s) => s.cmd === 'stitch').map((s) => [Math.round(s.x * 10) + 0, Math.round(s.y * 10) + 0]);
const readBack = (s: { x: number; y: number; cmd: string }[]) =>
  s.filter((q) => q.cmd === 'stitch').map((q) => [Math.round(q.x * 10) + 0, Math.round(q.y * 10) + 0]);

describe('stitch generation', () => {
  it('caps every stitch at 7 mm', () => {
    let at = [0, 0];
    for (const s of pattern.stitches) {
      if (s.cmd === 'stitch') expect(Math.hypot(s.x - at[0], s.y - at[1])).toBeLessThanOrEqual(7 + 1e-9);
      at = [s.x, s.y];
    }
  });

  it('fills with rows 0.4 mm apart and stays inside the shape', () => {
    const chains = tatami([circle(0, 0, 5, 64)], 0, 0.4, 3.5);
    const pts = chains.flat();
    expect(pts.every((p) => Math.hypot(p[0], p[1]) <= 5.001)).toBe(true);
    const rows = new Set(pts.map((p) => p[1].toFixed(3)));
    expect(rows.size).toBeGreaterThan(20);
  });

  it('splits a satin column wider than 7 mm into lanes', () => {
    expect(
      satin(
        [
          [0, 0],
          [20, 0],
        ],
        6,
        0.4,
        false,
        7,
      ),
    ).toHaveLength(1);
    expect(
      satin(
        [
          [0, 0],
          [20, 0],
        ],
        15,
        0.4,
        false,
        7,
      ),
    ).toHaveLength(3);
  });
});

describe('writers and readers', () => {
  it('round-trips DST, EXP and PES stitch for stitch', () => {
    for (const p of [pattern, compile(small)]) {
      const want = sewn(p);
      expect(readBack(readDst(writeDst(p)).stitches)).toEqual(want);
      expect(readBack(readExp(writeExp(p)).stitches)).toEqual(want);
      expect(readBack(readPes(writePes(p)).stitches)).toEqual(want);
    }
  });

  it('writes a DST header that matches its data', () => {
    const r = readDst(dst);
    expect(r.declared.stitches).toBe((dst.length - 512) / 3);
    expect(r.declared.colors).toBe(maximus.blocks.length - 1);
    expect(String.fromCharCode(...dst.subarray(0, 3))).toBe('LA:');
    expect((dst.length - 512) % 3).toBe(0);
  });

  it('splits jumps longer than 12.1 mm into DST records', () => {
    const r = readDst(writeDst(compile(small)));
    const report = validate(r.stitches, { hoop: [100, 100], colors: 2, maxRecord: 12.1 });
    expect(report.problems).toEqual([]);
    expect(report.jumps).toBeGreaterThan(3); // 40 mm out to the second color takes several
  });

  it('keeps the PES label, thread count and color changes', () => {
    const r = readPes(writePes(pattern));
    expect(r.label).toBe('MAXIMUS PATCH');
    expect(r.threads).toBe(maximus.blocks.length);
    expect(r.colorChanges).toBe(maximus.blocks.length - 1);
  });
});

describe('the Maximus patch', () => {
  it('passes every check in all three formats', () => {
    const colors = maximus.blocks.length;
    const reports = [
      validate(readDst(dst).stitches, { hoop: maximus.hoop, colors, maxRecord: 12.1 }),
      validate(readExp(writeExp(pattern)).stitches, { hoop: maximus.hoop, colors, maxRecord: 12.7 }),
      validate(readPes(writePes(pattern)).stitches, { hoop: maximus.hoop, colors, maxRecord: 204.7 }),
    ];
    for (const r of reports) expect(r.problems).toEqual([]);
  });

  it('fits the 100 x 100 mm hoop, about 3.5 in across', () => {
    const r = validate(readDst(dst).stitches, { hoop: maximus.hoop, colors: maximus.blocks.length, maxRecord: 12.1 });
    expect(r.width).toBeLessThan(100);
    expect(r.height).toBeLessThan(100);
    expect(r.width).toBeGreaterThan(80);
  });

  it('has one color change fewer than colors, and a sane stitch count', () => {
    const r = readDst(dst);
    expect(r.colorChanges).toBe(maximus.blocks.length - 1);
    const n = validate(r.stitches, { hoop: maximus.hoop, colors: maximus.blocks.length, maxRecord: 12.1 }).stitches;
    expect(n).toBeGreaterThan(8000);
    expect(n).toBeLessThan(20000);
  });

  it('uses four to six thread colors', () => {
    expect(maximus.blocks.length).toBeGreaterThanOrEqual(4);
    expect(maximus.blocks.length).toBeLessThanOrEqual(6);
  });
});
