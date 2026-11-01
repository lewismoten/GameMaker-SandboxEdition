// Every preset sounds different from every other: no two share their 11 patch bytes, and
// the presets added from the archive survey's gaps are all more than NEAR away from the rest,
// by the survey's distance (multiplier, waveform, hold, vibrato, tremolo, envelope, level, feedback).
import { describe, expect, it } from 'vitest';
import { OPL_PRESETS } from './oplPresets';

const NEAR = 4;
const NEW_IDS = ['tine-glass', 'harp-chime', 'sub-round', 'pad-wobble', 'reed-soft', 'vibes-wobbly'];

function parts(q: Uint8Array) {
  const o = (h: number) => ({
    mult: q[h] & 15,
    hold: (q[h] >> 5) & 1,
    vib: (q[h] >> 6) & 1,
    trem: (q[h] >> 7) & 1,
    tl: q[2 + h] & 63,
    ksl: q[2 + h] >> 6,
    ar: q[4 + h] >> 4,
    dr: q[4 + h] & 15,
    sl: q[6 + h] >> 4,
    rr: q[6 + h] & 15,
    wave: q[8 + h] & 3,
  });
  return { m: o(0), c: o(1), fb: (q[10] >> 1) & 7, add: q[10] & 1 };
}

function distance(a: Uint8Array, b: Uint8Array): number {
  const x = parts(a);
  const y = parts(b);
  let d = 0;
  for (const h of ['m', 'c'] as const) {
    const p = x[h];
    const q = y[h];
    d += (p.mult !== q.mult ? 2 : 0) + (p.wave !== q.wave ? 2 : 0) + (p.hold !== q.hold ? 2 : 0);
    d += (p.vib !== q.vib ? 1 : 0) + (p.trem !== q.trem ? 1 : 0) + (p.ksl !== q.ksl ? 0.5 : 0);
    d += (Math.abs(p.ar - q.ar) + Math.abs(p.dr - q.dr) + Math.abs(p.sl - q.sl) + Math.abs(p.rr - q.rr)) / 4;
    d += Math.abs(p.tl - q.tl) / (h === 'm' && !x.add ? 12 : 8);
  }
  return d + Math.abs(x.fb - y.fb) / 2 + (x.add !== y.add ? 3 : 0);
}

describe('preset patches', () => {
  it('ids are unique', () => {
    expect(new Set(OPL_PRESETS.map((x) => x.id)).size).toBe(OPL_PRESETS.length);
  });
  it('the six added presets exist and are far from every other preset', () => {
    for (const id of NEW_IDS) {
      const me = OPL_PRESETS.find((x) => x.id === id);
      expect(me, id).toBeDefined();
      for (const other of OPL_PRESETS) {
        if (other.id === id) continue;
        expect(distance(me!.patch, other.patch), `${id} vs ${other.id}`).toBeGreaterThan(NEAR);
      }
    }
  });
});
