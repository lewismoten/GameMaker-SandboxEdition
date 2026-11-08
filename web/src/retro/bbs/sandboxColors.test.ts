// The Sandbox BBS's menu banner draws each letter of SANDBOX in its own color.
import { describe, expect, it } from 'vitest';
import { sandBanner, SANDBOX_ANSI, SANDBOX_WORD_ANSI } from './ansiArt';
import { SANDBOX_COLORS } from './bbsName';
import type { TextScreen } from '../text/textScreen';

describe('Sandbox BBS name colors', () => {
  it('the menu banner letters carry the seven letter colors', () => {
    const cells = new Map<number, number>();
    const s = { put: (x: number, y: number, ch: number, a: number) => y === 0 && cells.set(x, (ch << 8) | a) } as unknown as TextScreen;
    sandBanner(s, `THE ${SANDBOX_ANSI} |14BBS`);
    const row = [...cells.entries()].sort((x, y) => x[0] - y[0]).map(([, v]) => v);
    const letters = row.filter((v) => /[SANDOX]/.test(String.fromCharCode(v >> 8)));
    // S A N D (B) O X: colors in order; B is the one before O in the name
    const colorOf = (ch: string) => letters.filter((v) => String.fromCharCode(v >> 8) === ch).map((v) => v & 15);
    expect(colorOf('S')).toContain(SANDBOX_COLORS[0]);
    expect(colorOf('A')).toContain(SANDBOX_COLORS[1]);
    expect(colorOf('N')).toContain(SANDBOX_COLORS[2]);
    expect(colorOf('D')).toContain(SANDBOX_COLORS[3]);
    expect(colorOf('O')).toContain(SANDBOX_COLORS[5]);
    expect(colorOf('X')).toContain(SANDBOX_COLORS[6]);
  });
  it('the prompt word is colored per letter', () => {
    expect(SANDBOX_WORD_ANSI.replace(/\|\d\d/g, '')).toBe('Sandbox');
  });
});
