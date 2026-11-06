// The Junior Lab phone's dial module: the one-way clutch angle walk (a wind gives no pulses, a return gives n), the printed spring, and the
// printable parts (one piece each, no thin specks) drawn by games/year2000/phone/tools/dialModule.ts.
// Stays slow: each part is meshed from its real 3D field; the check is that the print is one piece.
import { describe, expect, it } from 'vitest';
import { meshFieldTrinket } from '@lewismoten/gamemaker-sandbox-tools/mesh/fieldTrinket';
import { dialParams, holeDeg, travelDeg, walk } from '../../games/year2000/phone/tools/dialMechanism';
import { DM, buildDialModule, springAt } from '../../games/year2000/phone/tools/dialModule';

describe('the dial clutch', () => {
  it('puts hole 1 one pitch from the finger stop, so digit n travels n pitches (0 = 10)', () => {
    for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) expect(travelDeg(d)).toBe((d === 0 ? 10 : d) * dialParams.pitchDeg);
    expect(holeDeg(1)).toBe(90);
    expect(holeDeg(0)).toBe(180);
  });
  it('gives no pulse on the wind and exactly n on the return, with 0 to 10 degrees of finger play', () => {
    for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
      const n = d === 0 ? 10 : d;
      for (const play of [0, 2, 5, 8, 12]) {
        const w = walk(travelDeg(d) + play);
        expect(w.windPulses, `digit ${d} wind`).toBe(0);
        expect(w.returnPulses, `digit ${d} return`).toBe(n);
        expect(w.lastPulseFromRestDeg).toBeGreaterThan(dialParams.offNormalOpenWithinDeg);
      }
    }
  });
  it('loses a pulse when the finger stops a ridge short', () => {
    expect(walk(travelDeg(5) - 12).returnPulses).toBe(4);
  });
});

describe('the printed spring', () => {
  it('stays inside the PETG strain limit at full wind and returns the dial', () => {
    const full = springAt(DM.spring.preloadDeg + 300);
    expect(full.strainPct).toBeLessThan(2.5);
    expect(springAt(DM.spring.preloadDeg).torque).toBeGreaterThan(3);
  });
});

describe('the dial parts', () => {
  const m = buildDialModule({ cx: 49.5, cz: 146, y0: -0.6 });
  it('has the six printed parts and the bought ones for the viewer', () => {
    expect(m.parts.filter((p) => p.printed).map((p) => p.id)).toEqual(['dial-plate', 'dial-cam', 'dial-spring', 'dial-base', 'dial-stop', 'dial-bushing']);
    expect(m.parts.filter((p) => !p.printed).map((p) => p.id)).toEqual(['SW2-dial', 'SW3-dial', 'dial-screw']);
  });
  it('sizes the plate and the holes for fat fingers', () => {
    expect(dialParams.holeD).toBeGreaterThanOrEqual(12.5);
    expect(2 * dialParams.plateR).toBeGreaterThanOrEqual(72);
    expect(2 * dialParams.plateR).toBeLessThanOrEqual(76);
    const web = 2 * dialParams.ringR * Math.sin((Math.PI * dialParams.pitchDeg) / 360) - dialParams.holeD;
    expect(web).toBeGreaterThanOrEqual(2);
  });
  for (const id of ['dial-plate', 'dial-cam', 'dial-spring', 'dial-base', 'dial-stop', 'dial-bushing']) {
    it(`prints ${id} as one piece with no specks`, () => {
      const p = m.parts.find((q) => q.id === id)!;
      const t = meshFieldTrinket({ mm: p.field, colorAt: () => [200, 200, 200], box: p.box }, p.cell);
      expect(t.report.pieces).toBe(1);
      expect(t.erodedSpecks).toBe(0);
    }, 120000);
  }
});
