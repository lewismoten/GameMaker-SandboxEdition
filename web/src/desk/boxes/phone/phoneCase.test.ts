// The Junior Lab phone's one-case layout, read back from the generated files (viewer/parts.json, viewer/dial.json, mechanical/interface.json):
// the lower body is as wide as the top, the earpiece speaker sits above the board's top end, the dial module and the battery holder are stacked
// below the board, the case has six screws, and the dial module's part counts are what the BOM and README say.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseParts, type Part, type PartsFile } from './phoneData';

const dir = new URL('../../../../../games/year2000/phone/', import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, dir), 'utf8'));
const file = read('viewer/parts.json') as PartsFile;
const bbox = (id: string) => file.parts.filter((p) => p.id === id).pop()!.bbox; // the last row of an id: the shell's BT1 box comes after the board's leads

// Cast a vertical ray from below. The first hit is the outside of the case.
function backHeight({ positions, indices }: Part, x: number, z: number): number {
  let lowest = Infinity;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    const ax = positions[a],
      az = positions[a + 2];
    const bx = positions[b] - ax,
      bz = positions[b + 2] - az;
    const cx = positions[c] - ax,
      cz = positions[c + 2] - az;
    const area = bx * cz - bz * cx;
    if (area === 0) continue;
    const u = ((x - ax) * cz - (z - az) * cx) / area;
    const v = (bx * (z - az) - bz * (x - ax)) / area;
    if (u >= 0 && v >= 0 && u + v <= 1)
      lowest = Math.min(lowest, positions[a + 1] + u * (positions[b + 1] - positions[a + 1]) + v * (positions[c + 1] - positions[a + 1]));
  }
  return lowest;
}

describe('the Junior Lab case', () => {
  it('is one full-width body from the pod to the chin', () => {
    const tray = bbox('back-tray');
    const cover = bbox('front-cover');
    const mech = read('mechanical/interface.json') as { board: { width: number; height: number } };
    expect(tray[0]).toBeCloseTo(cover[0], 1);
    expect(tray[3]).toBeCloseTo(cover[3], 1);
    expect(tray[3] - tray[0]).toBeCloseTo(mech.board.width + 2 * 2.4, 1);
    // the cover and the tray both reach from above the board's top end to far below its bottom end
    expect(cover[2]).toBeLessThan(-20);
    expect(cover[5]).toBeGreaterThan(mech.board.height + 80);
  });
  it('puts the earpiece above the board, the dial and the holder below it, the holder behind the dial', () => {
    const spk = bbox('LS1-earpiece');
    expect(spk[5]).toBeLessThan(5);
    const plate = bbox('dial-plate');
    const holder = bbox('BT1');
    expect(plate[2]).toBeGreaterThan(99);
    expect(plate[3] - plate[0]).toBeGreaterThanOrEqual(72);
    expect(plate[3] - plate[0]).toBeLessThanOrEqual(76);
    expect(holder[4]).toBeLessThan(plate[1]); // the holder is behind (lower in height than) the dial module
    expect(holder[2]).toBeGreaterThan(99);
  });
  it('has a flat closed back and six screws, and no other screw bosses', () => {
    const dial = read('viewer/dial.json') as { screws: number[][]; levels: { fb2: number } };
    expect(dial.screws).toHaveLength(6);
    expect(file.parts.filter((p) => p.id.startsWith('dial-')).length).toBeGreaterThanOrEqual(7);
    const bin = readFileSync(new URL('viewer/parts.bin', dir));
    const tray = parseParts(file, bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength)).find((part) => part.id === 'back-tray')!;
    expect(tray.bbox[1]).toBeLessThan(-18);
    // Allow half a 0.6 mm mesh cell at each sample. Sample the pod, board, strips beside the battery door, and chin, clear of the screw holes.
    for (const z of [-24, -10, 12, 36, 60, 84, 110, 132, 154, 172, 194]) {
      const xs = z < 0 ? [40, 50, 60] : z >= 110 && z <= 154 ? [10, 90] : [10, 30, 50, 70, 90];
      for (const x of xs) {
        expect(Math.abs(backHeight(tray, x, z) - dial.levels.fb2), `floor at (${x}, ${z}) mm`).toBeLessThan(0.3);
      }
    }
  });
  it('has the dial module as six printed parts plus the bought switches and screw', () => {
    const ids = file.parts.map((p) => p.id);
    for (const id of ['dial-plate', 'dial-cam', 'dial-spring', 'dial-base', 'dial-stop', 'dial-bushing', 'SW2-dial', 'SW3-dial', 'dial-screw'])
      expect(ids, id).toContain(id);
    expect(ids).not.toContain('dial-post');
  });
});
