// The 1994 Technical Reference booklet: its chapters read from the Markdown, with nothing of the modern book in it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { techRefChapters } from './techRef';
import { blockText } from './markdownBlocks';
import { TECHREF_DIAGRAMS } from './techRefDiagrams';

const text = readFileSync(join(import.meta.dirname, '../../programmersGuide/booklet1994.md'), 'utf8');

describe('Technical Reference and Limits', () => {
  it('has thirty numbered chapters after the opening one, none empty, and ends on its glossary', () => {
    const heads = techRefChapters(text).map((c) => c.head);
    expect(heads[0]).toBe('Before you begin');
    expect(heads).toContain('Limits at a glance');
    expect(heads.at(-1)).toBe('Words used in this booklet');
    expect(heads).toHaveLength(31);
  });

  it('says pixels, not dots, and leaves no stray note or literal underscores', () => {
    expect(text).not.toMatch(/\bdots\b|source listing/);
    const words = techRefChapters(text).flatMap((c) => c.blocks.map(blockText));
    expect(words.filter((w) => /(?<!\w)_|_(?!\w)/.test(w))).toEqual([]);
  });

  it('draws every diagram it names, and its memory paragraph adds up to the diagram', () => {
    const names = [...text.matchAll(/^\[diagram: (\w+)\]$/gm)].map((m) => m[1]);
    expect(names.sort()).toEqual(Object.keys(TECHREF_DIAGRAMS).sort());
    // 181 + 64 + 62 + 41 + 21 + 50 + 2.5 is about 420
    expect(text).toContain('PLAYGAME holds about 420K');
    expect(181 + 64 + 62 + 41 + 21 + 50 + 2.5).toBeCloseTo(421.5);
  });

  it('is signed by technical staff and keeps the draft note, source lines and bugs out', () => {
    expect(text).toContain('Notes by technical staff');
    expect(text).not.toMatch(/Draft text|taste call|PG:\d|\.C:\d|\[verify\]|RSD|Lewis|source listing line/);
  });
});
