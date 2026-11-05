// The keyboard HOME KEYS draws, as plain data in pixels (an area 268 x 90): the letter rows, Space, Enter and the
// arrow cluster. The picture on the HOW TO PLAY page (keyboardArt.ts) and the manual's picture (tools/manual.ts)
// are both drawn from this list, so they always agree. Each key has a role:
//   main   the keys the whole game can be played with: the arrows, Space and Enter
//   twin   W A S D, the same as the arrows
//   extra  Q and E, used only for the extras in level 3
//   plain  every other key, which the game never asks for
export type KeyRole = 'main' | 'twin' | 'extra' | 'plain';
export interface KeyBox {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  role: KeyRole;
}

const PITCH = 17;
const SIZE = 15;

/** The roles of the letters the game uses. */
const ROLE: Record<string, KeyRole> = { W: 'twin', A: 'twin', S: 'twin', D: 'twin', Q: 'extra', E: 'extra' };

function letters(row: string, x0: number, y: number): KeyBox[] {
  return [...row].map((label, i) => ({ label, x: x0 + i * PITCH, y, w: SIZE, h: SIZE, role: ROLE[label] ?? 'plain' }));
}

/** The arrows are the PC font's characters 24 to 27 (up, down, right, left). */
export const ARROW_GLYPH: Record<string, string> = { '\x18': '\u2191', '\x19': '\u2193', '\x1a': '\u2192', '\x1b': '\u2190' };

export const KEYBOARD_SIZE = { w: 268, h: 92 };

export const KEYBOARD: KeyBox[] = [
  ...letters('QWERTYUIOP', 4, 4),
  ...letters('ASDFGHJKL', 12, 4 + PITCH),
  { label: 'ENTER', x: 12 + 9 * PITCH, y: 4 + PITCH, w: 36, h: SIZE, role: 'main' },
  ...letters('ZXCVBNM', 20, 4 + 2 * PITCH),
  { label: 'SPACE', x: 40, y: 4 + 3 * PITCH, w: 120, h: SIZE, role: 'main' },
  { label: '\x18', x: 224, y: 4 + 2 * PITCH, w: SIZE, h: SIZE, role: 'main' },
  { label: '\x1b', x: 207, y: 4 + 3 * PITCH, w: SIZE, h: SIZE, role: 'main' },
  { label: '\x19', x: 224, y: 4 + 3 * PITCH, w: SIZE, h: SIZE, role: 'main' },
  { label: '\x1a', x: 241, y: 4 + 3 * PITCH, w: SIZE, h: SIZE, role: 'main' },
];

/** Where the hands rest, as outlines: the left hand on W A S D with its thumb on Space, the right hand on the arrows with a finger by Enter. */
export const HANDS = [
  { name: 'LEFT HAND', x: 8, y: 0, w: 160, h: 70 },
  { name: 'RIGHT HAND', x: 203, y: 36, w: 62, h: 52 },
];
