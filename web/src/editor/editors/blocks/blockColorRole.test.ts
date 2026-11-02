// The block editors' note about colors reserved for another kind of art (blockColorRole.ts).
import { describe, expect, it } from 'vitest';
import { colorRoleNote, foreignRole } from './blockColorRole';

const ranges = [
  { role: 'character' as const, first: 10, last: 19 },
  { role: 'monster' as const, first: 40, last: 49 },
];

describe('foreignRole', () => {
  it('names another role’s reservation only', () => {
    expect(foreignRole('cbl', ranges, 12)).toBeUndefined();
    expect(foreignRole('cbl', ranges, 41)).toBe('monster');
    expect(foreignRole('bbl', ranges, 12)).toBe('character');
    expect(foreignRole('mbl', ranges, 41)).toBeUndefined();
  });
  it('treats global colors, 0 and 255 as fine, and no reservations as nothing to say', () => {
    for (const c of [0, 100, 255]) expect(foreignRole('cbl', ranges, c)).toBeUndefined();
    expect(colorRoleNote('cbl', [], 41)).toBe('');
  });
  it('words the note as a suggestion', () => {
    expect(colorRoleNote('cbl', ranges, 41)).toContain('reserved for monsters');
  });
});
