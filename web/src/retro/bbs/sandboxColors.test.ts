// Read the foreground attributes displayed when a guest reaches the Sandbox BBS menu.
import { expect, it, vi } from 'vitest';
import type { RetroHost } from '../host';
import { key, TextKeys } from '../text/textInput';
import { COLS, ROWS, TextScreen } from '../text/textScreen';
import { SANDBOX_COLORS } from './bbsName';
import { runSandbox } from './sandbox';
import { Term } from './term';

it('renders all seven name colors in the menu banner and command prompt', async () => {
  // Use the text-mode cell buffer without starting a canvas or cursor animation.
  const screen = Object.assign(Object.create(TextScreen.prototype) as TextScreen, {
    chars: new Uint8Array(COLS * ROWS),
    attrs: new Uint8Array(COLS * ROWS),
    cursorX: 0,
    cursorY: 0,
  });
  const keys = new TextKeys();
  keys.push(key('Enter')); // Guest login
  const host = { screen, keys, catalog: () => [], downloads: { list: () => [] } } as unknown as RetroHost;
  const term = new Term(host);
  const atPrompt = new Error('waiting for a menu command');
  vi.spyOn(term, 'key').mockResolvedValueOnce('Enter').mockRejectedValue(atPrompt);
  await expect(runSandbox(term, host)).rejects.toBe(atPrompt);

  function nameColors(y: number, name: string) {
    const row = y * COLS;
    const text = String.fromCharCode(...screen.chars.subarray(row, row + COLS));
    expect(text).toContain(name);
    const start = row + text.indexOf(name);
    return Array.from(name).flatMap((ch, i) => (ch === ' ' ? [] : [screen.attrs[start + i] & 15]));
  }
  expect.soft(nameColors(0, 'S A N D B O X')).toEqual(SANDBOX_COLORS);
  expect(nameColors(screen.cursorY, 'Sandbox')).toEqual(SANDBOX_COLORS);
});
