// Every credit in the Credits page's table of RSD Game-Maker's parts is quoted from a file
// that exists in the original release, and a part listed as Recreational Software Designs'
// really names no one.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RSD, RSD_PARTS, RSD_SAMPLE_CREDITS } from './rsdParts';

const repo = join(import.meta.dirname, '../../..');
const flat = (s: string) => s.replace(/\s+/g, ' ');

describe('credits: RSD Game-Maker by part', () => {
  for (const p of RSD_PARTS)
    it(p.part, () => {
      for (const s of p.sources) {
        expect(s.file.startsWith('code/'), s.file).toBe(true);
        const path = join(repo, s.file);
        expect(existsSync(path), s.file).toBe(true);
        const text = flat(readFileSync(path, 'latin1'));
        if (s.quote) expect(text, s.file).toContain(flat(s.quote));
        else {
          expect(p.who).toBe(RSD);
          expect(text, s.file).not.toMatch(/Stone|Savage|Author|Programmer|Written by/i);
        }
      }
    });

  it('the sample games’ credits', () => {
    for (const s of RSD_SAMPLE_CREDITS) {
      const path = join(repo, s.file);
      expect(existsSync(path), s.file).toBe(true);
      expect(flat(readFileSync(path, 'latin1')), s.file).toContain(flat(s.quote));
    }
  });
});
