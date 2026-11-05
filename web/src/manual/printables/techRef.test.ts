// The 1994 Technical Reference booklet: its chapters read from the Markdown, with nothing of the modern book in it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { techRefChapters } from './techRef';

const text = readFileSync(join(import.meta.dirname, '../../programmersGuide/booklet1994.md'), 'utf8');

describe('Technical Reference and Limits', () => {
  it('has thirteen numbered chapters after the opening one, none empty', () => {
    const heads = techRefChapters(text).map((c) => c.head);
    expect(heads[0]).toBe('Before you begin');
    expect(heads).toContain('Limits at a glance');
    expect(heads).toHaveLength(14);
  });

  it('is signed by technical staff and keeps the draft note, source lines and bugs out', () => {
    expect(text).toContain('Notes by technical staff');
    expect(text).not.toMatch(/Draft text|taste call|PG:\d|\.C:\d|\[verify\]|RSD|Lewis|source listing line/);
  });
});
