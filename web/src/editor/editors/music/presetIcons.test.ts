// The preset picker's pictures are 20x20 grids of palette letters, and every preset has one.
import { describe, expect, it } from 'vitest';
import { OPL_PRESETS } from '../../../audio/oplPresets';
import { presetIcon, presetRows } from './presetIcons';

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
  it('no two presets have the same or a near-identical picture', () => {
    const MIN_DIFFERENT = 12; // pixels (of 400) that must differ
    const alike: string[] = [];
    const rows = OPL_PRESETS.map((p) => ({ id: p.id, px: presetRows(p.id, p.group).join('') }));
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        let diff = 0;
        for (let k = 0; k < 400; k++) if (rows[i].px[k] !== rows[j].px[k]) diff++;
        if (diff < MIN_DIFFERENT) alike.push(`${rows[i].id} and ${rows[j].id} (${diff})`);
      }
    }
    expect(alike).toEqual([]);
  });
});
