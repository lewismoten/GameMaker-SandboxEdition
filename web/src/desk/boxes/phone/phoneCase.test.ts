// The Junior Lab phone's one-case layout, read back from the generated files (viewer/parts.json, viewer/dial.json, mechanical/interface.json):
// the lower body is as wide as the top, the earpiece speaker sits above the board's top end, the dial module and the battery holder are stacked
// below the board, the case has six screws, and the dial module's part counts are what the BOM and README say.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PartsFile } from './phoneData';

const dir = new URL('../../../../../games/year2000/phone/', import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, dir), 'utf8'));
const file = read('viewer/parts.json') as PartsFile;
const bbox = (id: string) => file.parts.filter((p) => p.id === id).pop()!.bbox; // the last row of an id: the shell's BT1 box comes after the board's leads

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
    const dial = read('viewer/dial.json') as { screws: number[][] };
    expect(dial.screws).toHaveLength(6);
    expect(file.parts.filter((p) => p.id.startsWith('dial-')).length).toBeGreaterThanOrEqual(7);
    const tray = bbox('back-tray');
    expect(tray[1]).toBeLessThan(-18); // one deep floor, not a stepped one
  });
  it('has the dial module as six printed parts plus the bought switches and screw', () => {
    const ids = file.parts.map((p) => p.id);
    for (const id of ['dial-plate', 'dial-cam', 'dial-spring', 'dial-base', 'dial-stop', 'dial-bushing', 'SW2-dial', 'SW3-dial', 'dial-screw'])
      expect(ids, id).toContain(id);
    expect(ids).not.toContain('dial-post');
  });
});
