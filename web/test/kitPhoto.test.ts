// games/kit/photo: loading scans, resampling to VGA pixels and fitting a photo into the free
// palette entries.
import { describe, expect, it } from 'vitest';
import { Pixels } from '../../games/kit/pixels';
import { freeColors, loadScan, medianCut, pastePhoto, resample, sepia } from '../../games/kit/photo';

describe('games/kit/photo', () => {
  it('loads every scan the games use', () => {
    for (const name of ['gazebo', 'gwinn', 'teddy', 'leo', 'colonial', 'chez', 'library']) {
      const s = loadScan(name);
      expect(s.rgb.length).toBe(s.w * s.h * 3);
      expect(Math.max(s.w, s.h)).toBeGreaterThanOrEqual(256);
    }
  });

  it('resamples to tall VGA pixels when no height is given', () => {
    const s = resample(loadScan('gazebo'), 120); // 4:3 photo
    expect(s.w).toBe(120);
    expect(s.h).toBe(75); // 120 * (5/6) * (3/4)
  });

  it('gives the photo only palette entries the picture leaves unused', () => {
    const p = new Pixels(40, 40, 3);
    p.rect(0, 0, 40, 4, 7);
    const pal = new Uint8Array(768);
    const scan = resample(loadScan('chez'), 20, 20);
    const { pal: out, slots } = pastePhoto(p, pal, scan, 10, 10, { colors: 32, share: false });
    expect(slots).not.toContain(3);
    expect(slots).not.toContain(7);
    expect(slots.length).toBe(32);
    for (let y = 10; y < 30; y++) for (let x = 10; x < 30; x++) expect(slots).toContain(p.get(x, y));
    expect([...out.slice(9, 12), ...out.slice(21, 24)]).toEqual([0, 0, 0, 0, 0, 0]); // the picture's own entries untouched
    expect(freeColors(p).length).toBeLessThan(256 - 2);
  });

  it('tones a print in sepia and keeps median cut colors 6-bit', () => {
    const s = sepia(resample(loadScan('colonial'), 32, 24));
    for (const c of medianCut(s, 16)) for (const v of c) expect(v).toBeLessThanOrEqual(63);
    expect(s.rgb[0]).toBeGreaterThanOrEqual(s.rgb[2]); // warm: red over blue
  });
});
