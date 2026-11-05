// The HOW TO PLAY picture: a drawn keyboard (the game's own pixels, no photo) on the paper page, with the keys the
// game uses colored and the two resting hands outlined. Layout: keyboardLayout.ts.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { centered, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { paper } from '../../kit/starter/screens';
import { HANDS, KEYBOARD, type KeyRole } from './keyboardLayout';

/** Where the 268 x 92 keyboard sits on the paper. */
const AT = { x: 26, y: 34 };

export function keyboardPicture(pal: Pal, book: Book): Pixels {
  const { c } = pal;
  const p = paper(pal, book, 'THE KEYS');
  const fill: Record<KeyRole, number> = { main: c('gold', 3), twin: c('teal', 3), extra: c('purple', 3), plain: c('stone', 4) };
  const edge: Record<KeyRole, number> = { main: c('gold', 0), twin: c('teal', 0), extra: c('purple', 0), plain: c('stone', 2) };
  for (const hand of HANDS) {
    // an outline of dots
    for (let x = 0; x < hand.w; x += 3) p.set(AT.x + hand.x + x, AT.y + hand.y, c('ink', 1)).set(AT.x + hand.x + x, AT.y + hand.y + hand.h, c('ink', 1));
    for (let y = 0; y <= hand.h; y += 3) p.set(AT.x + hand.x, AT.y + hand.y + y, c('ink', 1)).set(AT.x + hand.x + hand.w, AT.y + hand.y + y, c('ink', 1));
  }
  for (const k of KEYBOARD) {
    p.rect(AT.x + k.x, AT.y + k.y, k.w, k.h, edge[k.role]).rect(AT.x + k.x + 1, AT.y + k.y + 1, k.w - 2, k.h - 3, fill[k.role]);
    const label = k.label.length === 1 ? k.label : k.label === 'ENTER' ? 'ENTER' : 'SPACE';
    const w = textWidth(label);
    text(p, AT.x + k.x + Math.floor((k.w - w) / 2), AT.y + k.y + 4, label, c('ink', 0));
  }
  const key = (y: number, role: KeyRole, words: string) => {
    p.rect(40, y, 10, 8, edge[role]).rect(41, y + 1, 8, 6, fill[role]);
    text(p, 56, y, words, c('ink', 0));
  };
  key(136, 'main', 'ARROWS, SPACE, ENTER');
  key(148, 'twin', 'W A S D: LIKE THE ARROWS');
  key(160, 'extra', 'Q AND E: EXTRA LEAPS');
  centered(p, 178, 'EITHER HAND WILL DO', c('wood', 1));
  return p;
}
