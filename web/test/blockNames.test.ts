// Block labels are companion metadata, scoped to the native set and keeping its numbers intact.
import { describe, expect, it } from 'vitest';
import { BLOCK_NAMES, readBlockNames, blockName, blockLabel, setBlockName } from '../src/editor/editors/blocks/blockNames';

function store() {
  const data = new Map<string, unknown>();
  return {
    data,
    extras: <T>(file: string, section: string, fallback: T) => (data.get(`${file}:${section}`) as T | undefined) ?? fallback,
    setExtras: (file: string, section: string, value: unknown) => {
      if (value === undefined) data.delete(`${file}:${section}`);
      else data.set(`${file}:${section}`, value);
    },
  };
}

describe('native block names', () => {
  it('keeps only usable labels in the block set’s bounds', () => {
    expect(
      readBlockNames({ 0: ' Door  frame ', 149: 'Last block', 150: 'Outside', '-1': 'Negative', '01': 'Alias', no: 'No index', 2: 9, 3: '  ' }, 150),
    ).toEqual({ 0: 'Door frame', 149: 'Last block' });
    expect(readBlockNames(['Wrong shape'])).toEqual({});
    expect(readBlockNames({ 1: 'a'.repeat(90) })[1]).toHaveLength(80);
  });
  it('uses separate metadata for each picture set and preserves the native index in labels', () => {
    const project = store();
    setBlockName(project, 'wall.bbl', 2, 'Brick wall', 150);
    setBlockName(project, 'hero.cbl', 2, 'Left shoe', 50);
    setBlockName(project, 'critters.mbl', 2, 'Sparkle', 100);
    expect(blockLabel(project, 'wall.bbl', 2)).toBe('Block 2: Brick wall');
    expect(blockName(project, 'hero.cbl', 2)).toBe('Left shoe');
    expect(blockName(project, 'critters.mbl', 2)).toBe('Sparkle');
    expect(blockLabel(project, 'wall.bbl', 3)).toBe('Block 3');
    expect([...project.data.keys()]).toEqual([`wall.bbl:${BLOCK_NAMES}`, `hero.cbl:${BLOCK_NAMES}`, `critters.mbl:${BLOCK_NAMES}`]);
  });
  it('clears a label without mutating imported metadata or another name', () => {
    const project = store(),
      original = { 1: 'Door', 2: 'Window' };
    project.data.set(`wall.bbl:${BLOCK_NAMES}`, original);
    setBlockName(project, 'wall.bbl', 1, '', 150);
    expect(original).toEqual({ 1: 'Door', 2: 'Window' });
    expect(blockName(project, 'wall.bbl', 2)).toBe('Window');
    setBlockName(project, 'wall.bbl', 2, '', 150);
    expect(project.data.size).toBe(0);
    for (const index of [-1, 150, 0.5, NaN]) expect(() => setBlockName(project, 'wall.bbl', index, 'No', 150)).toThrow(RangeError);
  });
});
