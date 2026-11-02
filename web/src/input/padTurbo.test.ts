import { describe, expect, it } from 'vitest';
import { TURBO_PERIOD_MS, TurboFire } from './padTurbo';

const B3 = 4;
const B4 = 8;

describe('TurboFire', () => {
  it('does nothing with buttons 3 and 4 on 4 BUTTON', () => {
    const f = new TurboFire();
    for (let t = 0; t < 500; t += 10) expect(f.step(B3 | B4, t, false)).toBe(0);
  });
  it('passes buttons 1 and 2 straight through', () => {
    const f = new TurboFire();
    expect(f.step(0b11, 7, true)).toBe(0b11);
    expect(f.step(0b01, 9, false)).toBe(1);
  });
  it('presses 1 for 3 and 2 for 4, ten times a second, evenly', () => {
    const f = new TurboFire();
    let presses = 0;
    let last = 0;
    const edges: number[] = [];
    for (let t = 1000; t < 2000; t += 5) {
      const v = f.step(B3, t, true);
      expect(v & 2).toBe(0);
      if (v & 1 && !last) (presses++, edges.push(t));
      last = v & 1;
    }
    expect(presses).toBe(10);
    for (let i = 1; i < edges.length; i++) expect(edges[i] - edges[i - 1]).toBe(TURBO_PERIOD_MS);
    expect(f.step(B4, 3000, true)).toBe(2);
    expect(f.step(B4, 3050, true)).toBe(0);
  });
  it('starts again from down when it is let go and pressed again', () => {
    const f = new TurboFire();
    f.step(B3, 0, true);
    expect(f.step(B3, 60, true)).toBe(0);
    f.step(0, 70, true);
    expect(f.step(B3, 80, true)).toBe(1);
  });
  it('lets go when the switch goes back to 4 BUTTON', () => {
    const f = new TurboFire();
    expect(f.step(B3, 0, true)).toBe(1);
    expect(f.step(B3, 10, false)).toBe(0);
  });
});
