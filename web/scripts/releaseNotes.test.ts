// Release notes from disk diffs: grouping, order, truncation and determinism.
import { describe, expect, it } from 'vitest';
import { diffDisks } from '@lewismoten/gamemaker-sandbox-tools/disk-diff';
import { releaseNotes } from '@lewismoten/gamemaker-sandbox-tools/release-notes';

const enc = (s: string) => new TextEncoder().encode(s);
const disk = (o: Record<string, string>) => new Map(Object.entries(o).map(([k, v]) => [k, enc(v)] as const));

describe('releaseNotes', () => {
  it('is empty when nothing differs', () => expect(releaseNotes(diffDisks(disk({ 'a.txt': 'x' }), disk({ 'a.txt': 'x' })))).toBe(''));
  it('groups by kind in a fixed order and names files in capitals', () => {
    const a = disk({ 'old.cfg': 'z', 'b.txt': '1', 'a.txt': '1', 'k.dat': '1' });
    const b = disk({ 'b.txt': '2', 'a.txt': '2', 'k.dat': '2', 'new.lst': 'q', 'n2.dat': 'q' });
    const text = releaseNotes(diffDisks(a, b));
    expect(text).toBe(
      'Changed 2 text files (A.TXT, B.TXT), 1 other file (K.DAT). Added 1 text file (NEW.LST), 1 other file (N2.DAT). Removed 1 text file (OLD.CFG).',
    );
  });
  it('cuts long name lists', () => {
    const a = disk({}),
      b = disk(Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f'].map((n) => [`${n}.txt`, n])));
    expect(releaseNotes(diffDisks(a, b))).toBe('Added 6 text files (A.TXT, B.TXT, C.TXT, D.TXT and 2 more).');
  });
  it('is the same every time and avoids first-person plurals', () => {
    const d = diffDisks(disk({ 'a.txt': '1' }), disk({ 'a.txt': '2', 'b.txt': 'x' }));
    expect(releaseNotes(d)).toBe(releaseNotes(d));
    expect(releaseNotes(d)).not.toMatch(/\b(we|our|us)\b/i);
  });
});
