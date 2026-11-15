// The wheel sheets' class comes out of kit.ts sheet() as `pp-cw-sheet`; a CSS rule for plain `.cw-sheet` never matches.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('codeWheel.css', () => {
  it('styles the sheet by the class the sheet really has', () => {
    const css = readFileSync(new URL('./codeWheel.css', import.meta.url), 'utf8');
    expect(css).toContain('.pp-cw-sheet');
    expect(css).not.toMatch(/(^|[^-\w])\.cw-sheet/m);
  });
});
