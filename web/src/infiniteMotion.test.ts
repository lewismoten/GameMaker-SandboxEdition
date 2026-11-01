// Every stylesheet with a looping animation also has a reduced-motion rule, so a visitor who
// asked for less motion never gets a blink, spin or pulse that goes on forever.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sheets(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? sheets(p) : p.endsWith('.css') ? [p] : [];
  });
}

describe('looping animations', () => {
  it('each stylesheet that loops one has a prefers-reduced-motion rule', () => {
    const bad = sheets(join(__dirname)).filter((p) => {
      const css = readFileSync(p, 'utf8');
      return /animation[^;]*\binfinite\b/.test(css) && !css.includes('prefers-reduced-motion');
    });
    expect(bad).toEqual([]);
  });
});
