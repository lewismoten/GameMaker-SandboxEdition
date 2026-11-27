// The phone kit's printed parts keep clear of the solder side: the generated parts file is read back and every printed part (front
// frame, back tray and its floor, dial plate, cam teeth, spring, post, stop, caps, battery box and door) must stay MIN_GAP from
// each lead stub (LEAD mm of trimmed lead and fillet at every pad, on the face opposite its part) and from every part body.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEAD, MIN_GAP, leadsFrom, measure, regionOf, type Body } from '../../../../../games/year2000/phone/tools/clearance';

interface Row {
  id: string;
  kind: string;
  made?: string;
  bbox: number[];
  pos: { offset: number; count: number };
  idx: { offset: number; count: number };
}

const clearance = (sub: string) => {
  const dir = new URL(`../../../../../games/year2000/phone/${sub}`, import.meta.url);
  const file = JSON.parse(readFileSync(new URL('viewer/parts.json', dir), 'utf8')) as { floats: number; parts: Row[] };
  const bin = readFileSync(new URL('viewer/parts.bin', dir));
  const ab = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
  const floats = new Float32Array(ab, 0, file.floats);
  const index = new Uint32Array(ab, file.floats * 4);
  const printed = (r: Row) => r.made === 'shell.ts' && !/^BT1-(cell|label|lead)|^MK1-/.test(r.id);
  const meshes = file.parts.filter(printed).map((r) => ({
    id: r.id,
    pos: floats.subarray(r.pos.offset, r.pos.offset + r.pos.count),
    idx: index.subarray(r.idx.offset, r.idx.offset + r.idx.count),
  }));
  const bodies: Body[] = file.parts.filter((r) => r.kind === 'component' && !r.made).map((r) => ({ id: r.id, bbox: r.bbox }));
  const placement = JSON.parse(readFileSync(new URL('kicad/placement.json', dir), 'utf8'));
  return measure(meshes, leadsFrom(placement), bodies, regionOf);
};

describe(`printed parts keep ${MIN_GAP} mm from a ${LEAD} mm lead stub and from every part body`, () => {
  for (const [name, sub] of [
    ['Junior Lab', ''],
    ['Deluxe', 'deluxe/'],
  ] as const) {
    it(name, () => {
      const gaps = clearance(sub);
      expect(gaps.map((g) => g.id)).toEqual(expect.arrayContaining(['front-cover', 'back-tray', 'dial-plate', 'dial-cam', 'dial-spring', 'BT1']));
      for (const g of gaps) {
        expect(g.lead.gap, `${g.id} to a lead of ${g.lead.other}`).toBeGreaterThanOrEqual(MIN_GAP);
        expect(g.body.gap, `${g.id} to ${g.body.other}`).toBeGreaterThanOrEqual(MIN_GAP);
      }
    });
  }
});

it.each([
  [-1, 1, 0],
  [2, 3, 2],
])('measures the triangle interior against a body spanning y=%s to %s', (lo, hi, expected) => {
  const mesh = { id: 'tray', pos: [0, 0, 0, 30, 0, 0, 0, 0, 30], idx: [0, 1, 2] };
  const [{ body }] = measure([mesh], [], [{ id: 'part', bbox: [4, lo, 4, 6, hi, 6] }], () => null);
  expect(body.gap).toBe(expected);
  expect(body.at[1]).toBe(0);
  for (const axis of [0, 2]) expect(body.at[axis]).toBeGreaterThanOrEqual(4);
  for (const axis of [0, 2]) expect(body.at[axis]).toBeLessThanOrEqual(6);
});
