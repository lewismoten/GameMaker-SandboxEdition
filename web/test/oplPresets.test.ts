import { describe, expect, it } from 'vitest';
import { OPL_PRESETS, PRESET_GROUPS, findPreset } from '../src/audio/oplPresets';
import { patch, validPatch } from '../src/audio/oplPatch';
import { presetPreview } from '../src/audio/oplPresetPreview';
import { Opl2 } from '../src/audio/opl';
import { CmfPlayer, TICK_RATE } from '../src/audio/cmfPlayer';
import { CMF_GAMEMAKER_CLOCK, parseCmf } from '../src/formats/cmf';

const SR = 11025;

/** The preview song through the OPL2 emulator and CMF player, as the music worklet plays it. */
function render(bytes: Uint8Array, seconds: number): Float32Array {
  const cmf = parseCmf(bytes);
  const opl = new Opl2(SR);
  const player = new CmfPlayer(opl);
  player.load(cmf.music, cmf.instruments);
  const out = new Float32Array(Math.round(seconds * SR));
  const perTick = SR / TICK_RATE;
  let until = 0;
  for (let i = 0; i < out.length;) {
    if (until <= 0) {
      player.tick();
      until += perTick;
    }
    const n = Math.min(out.length - i, Math.ceil(until));
    opl.render(out.subarray(i, i + n));
    until -= n;
    i += n;
  }
  return out;
}

describe('OPL2 instrument presets', () => {
  it('are valid 11-byte patches in 16-byte SBI records, each one different', () => {
    const ids = new Set<string>();
    for (const p of OPL_PRESETS) {
      expect(p.patch.length, p.id).toBe(16);
      expect(validPatch(p.patch), p.id).toBe(true);
      expect([...p.patch.subarray(11)], p.id).toEqual([0, 0, 0, 0, 0]);
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(
        PRESET_GROUPS.some((g) => g.id === p.group),
        p.id,
      ).toBe(true);
      // findPreset names it by its bytes: no two presets share a patch
      expect(findPreset(p.patch)?.id, p.id).toBe(p.id);
    }
    expect(OPL_PRESETS.length).toBeGreaterThan(60);
  });

  it('reads the patch words as the chip registers', () => {
    expect([...patch('x1 tl15 ksl3 ar15 dr1 sl5 rr3', 'x1 ar13 dr2 sl7 rr4', 'fb3').subarray(0, 11)]).toEqual([
      0x01, 0x01, 0x4f, 0x00, 0xf1, 0xd2, 0x53, 0x74, 0, 0, 0x06,
    ]);
    expect([...patch('x2 tl4 ksl6 hold vib trem ksr w2', 'x0.5 ar0', 'fb7 add').subarray(0, 11)]).toEqual([
      0xf2, 0x00, 0xc4, 0x00, 0xf0, 0x00, 0x00, 0x00, 2, 0, 0x0f,
    ]);
    expect(() => patch('x11', '')).toThrow();
    expect(() => patch('ar16', '')).toThrow();
    expect(() => patch('w4', '')).toThrow();
  });

  it('play a Game-Maker CMF preview that sounds, stays in range, and (percussion) dies away', () => {
    for (const p of OPL_PRESETS) {
      const { bytes, seconds } = presetPreview(p);
      expect(parseCmf(bytes).clockTicks).toBe(CMF_GAMEMAKER_CLOCK);
      const s = render(bytes, seconds);
      let peak = 0;
      let energy = 0;
      for (const v of s) {
        peak = Math.max(peak, Math.abs(v));
        energy += v * v;
      }
      const rms = Math.sqrt(energy / s.length);
      expect(rms, `${p.id} is silent`).toBeGreaterThan(0.002);
      expect(peak, `${p.id} clips`).toBeLessThan(1);
      if (p.play === 'hits') {
        // the last 0.2 s of the tail is near silence
        let tail = 0;
        for (let i = s.length - Math.round(0.2 * SR); i < s.length; i++) tail = Math.max(tail, Math.abs(s[i]));
        expect(tail, `${p.id} rings on`).toBeLessThan(peak * 0.25);
      }
    }
  }, 60_000);
});
