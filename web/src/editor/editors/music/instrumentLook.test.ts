// An instrument shows its preset's picture on its group's color; no match shows a plain note.
import { describe, expect, it } from 'vitest';
import { OPL_PRESETS } from '../../../audio/oplPresets';
import { groupColor, instrumentLook } from './instrumentLook';

describe('instrumentLook', () => {
  it('a preset patch matches exactly and takes its group color', () => {
    const p = OPL_PRESETS.find((x) => x.id === 'trumpet')!;
    const look = instrumentLook(p.patch);
    expect(look.preset?.id).toBe('trumpet');
    expect(look.exact).toBe(true);
    expect(look.color).toBe(groupColor('brass'));
  });
  it('a patch nudged in one byte still matches, but not exactly', () => {
    const p = OPL_PRESETS.find((x) => x.id === 'flute')!;
    const inst = p.patch.slice();
    inst[2] ^= 1;
    const look = instrumentLook(inst);
    expect(look.preset?.id).toBe('flute');
    expect(look.exact).toBe(false);
  });
  it('a patch far from every preset is a plain note with no group color', () => {
    const look = instrumentLook(new Uint8Array(11).fill(0xa5));
    expect(look.preset).toBeUndefined();
    expect(look.color).toBeUndefined();
    expect(look.icon).toContain('<svg');
  });
  it('different groups get different colors', () => {
    expect(groupColor('keys')).not.toBe(groupColor('strings'));
  });
  it('a Classic preset takes its home family color, not a shared Classic one', () => {
    const colors = ['piano', 'bass', 'pluck'].map((id) => {
      const p = OPL_PRESETS.find((x) => x.group === 'classic' && x.id === id)!;
      return instrumentLook(p.patch).color;
    });
    expect(new Set(colors).size).toBe(3);
    expect(colors[0]).toBe(groupColor('keys'));
    expect(colors[1]).toBe(groupColor('bass'));
    expect(colors[2]).toBe(groupColor('strings'));
    expect(groupColor('synth', 1)).not.toBe(groupColor('synth'));
  });
});
