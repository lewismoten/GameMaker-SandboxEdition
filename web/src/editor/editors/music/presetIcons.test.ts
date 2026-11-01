// The preset picker's pictures are 20x20 grids of palette letters, and every preset has one.
import { describe, expect, it } from 'vitest';
import { OPL_PRESETS } from '../../../audio/oplPresets';
import { presetIcon } from './presetIcons';

describe('preset icons', () => {
  it('every preset gets a 20x20 crisp SVG of palette colors', () => {
    for (const p of OPL_PRESETS) {
      const svg = presetIcon(p.id, p.group);
      expect(svg, p.id).toContain('viewBox="0 0 20 20"');
      expect(svg, p.id).toContain('shape-rendering="crispEdges"');
      expect(svg, p.id).toContain('<rect');
    }
  });
  it('different families get different pictures', () => {
    const a = presetIcon('violin', 'strings');
    expect(presetIcon('trumpet', 'brass')).not.toBe(a);
    expect(presetIcon('vibes-wobbly', 'mallets')).not.toBe(presetIcon('marimba', 'mallets'));
  });
});
