// The phone's strip of large keys (keyboard.ts) can press every key on Game-Maker's key template,
// since there the template's own words are too small to press and are print only.
import { describe, expect, it } from 'vitest';
import { GLOBAL_KEYS } from '../../editor/keymap/keyMap';
import { stripCodes } from './keyboard';

describe("the phone's key strip", () => {
  it('presses every key the template names', () => {
    const codes = stripCodes();
    for (const g of GLOBAL_KEYS) expect(codes).toContain(g.name === 'Esc' ? 'Escape' : g.name);
  });
  it('has no key twice', () => {
    const codes = stripCodes();
    expect(new Set(codes).size).toBe(codes.length);
  });
});
