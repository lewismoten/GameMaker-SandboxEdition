import { describe, expect, it } from 'vitest';
import { drawConfigScreen, drawHelpFrame, moveMark } from './draw';
import { fromHardware } from './model';

function recorder() {
  const writes: [number, number, number, string][] = [];
  const calls: string[] = [];
  return {
    writes,
    calls,
    boxFill: (...a: number[]) => void calls.push(`fill ${a.join(',')}`),
    box: (...a: number[]) => void calls.push(`box ${a.join(',')}`),
    line: (...a: number[]) => void calls.push(`line ${a.join(',')}`),
    point: (...a: number[]) => void calls.push(`point ${a.join(',')}`),
    write: (x: number, y: number, c: number, t: string) => void writes.push([x, y, c, t]),
  };
}

describe('the DOS Configure screen drawing', () => {
  const r = recorder();
  drawConfigScreen(r, fromHardware());
  it('writes the original labels where PLAYGAME put them, each in its own palette entry', () => {
    expect(r.writes.slice(0, 4)).toEqual([
      [190, 8, 7, 'VGA Chip Type'],
      [20, 8, 7, 'Sound And Music'],
      [20, 60, 7, 'Port  Interrupt'],
      [20, 155, 7, 'Sound Driver'],
    ]);
    const labels = r.writes.slice(4);
    expect(labels.map((w) => w[2])).toEqual(Array.from({ length: 26 }, (_, i) => 50 + i));
    expect(labels[0]).toEqual([35, 20, 50, 'None']);
    expect(labels[1]).toEqual([35, 36, 51, 'Sound Blaster']);
    expect(labels.slice(2, 7).map((w) => w[3])).toEqual(['220', '230', '240', '250', '260']);
    expect(labels[7]).toEqual([10, 170, 57, 'sndblast.drv']);
    expect(labels[8]).toEqual([10, 182, 58, '.\\']);
    expect(labels.slice(9, 14).map((w) => w[3])).toEqual(['2', '3', '5', '7', '10']);
    expect(labels.slice(14, 24).map((w) => w[3])).toEqual([
      'Auto-Detect',
      'Standard VGA',
      'Paradise',
      'Trident 8800',
      'Trident 8900',
      'Tseng ET3000',
      'Tseng ET4000',
      'ATI',
      'ATI Wonder',
      'Simulate',
    ]);
    expect(labels.slice(24)).toEqual([
      [171, 181, 74, 'Help'],
      [221, 181, 75, 'Done'],
    ]);
  });
  it('draws the four panels with their bevels, and ends with the yellow rectangles', () => {
    expect(r.calls.slice(0, 4)).toEqual(['fill 5,5,155,195,4', 'box 2,2,158,198,1', 'box 3,3,157,197,2', 'box 4,4,156,196,3']);
    expect(r.calls.filter((c) => c.startsWith('fill'))).toHaveLength(6);
    expect(r.calls.at(-1)).toMatch(/^point /);
  });
  it('paints a changed choice over in the panel color, then draws the new one yellow', () => {
    const a = recorder();
    const s = fromHardware();
    moveMark(a, s, { ...s, sound: 0 }, 0);
    // Sound Blaster's old rectangle (top at y 33) in color 4, None's new one (top at y 17) in color 8
    expect(a.calls[0]).toBe('line 33,33,141,33,4');
    expect(a.calls).toContain('line 33,17,141,17,8');
  });
  it('frames the Help text with five boxes', () => {
    const a = recorder();
    drawHelpFrame(a);
    expect(a.calls).toEqual([
      'fill 0,0,320,200,0',
      'box 15,36,305,192,0',
      'box 14,35,306,193,1',
      'box 13,34,307,194,2',
      'box 12,33,308,195,3',
      'box 11,32,309,196,4',
    ]);
  });
});
