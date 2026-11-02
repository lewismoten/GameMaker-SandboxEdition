// The shops' picture signs on the test drive and the parade route: a board a block square with
// what the shop sells (a pizza slice, a floppy disk, a friendly police star, a pet's paw, a
// music shop's notes). Drawn only in the fixed colors, so a sign is the same block in every
// street scene and every palette, and the street set keeps one copy of each.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Kit } from '../blocks/common';

export const SHOP_SIGNS = ['pizza', 'floppy', 'police', 'pets', 'music'] as const;
export type ShopSign = (typeof SHOP_SIGNS)[number];

const ICONS: Record<ShopSign, string[]> = {
  pizza: [
    '..cccccccccccc..',
    '.cCCCCCCCCCCCCc.',
    '..yyyyyyyyyyyy..',
    '..yyrryyyyyyyy..',
    '...yrryyyyrry...',
    '...yyyyyyyrry...',
    '....yyyyyyyy....',
    '....yyrryyyy....',
    '.....yrryyy.....',
    '.....yyyyyy.....',
    '......yyyy......',
    '......yyyy......',
    '.......yy.......',
  ],
  floppy: [
    'kkkkkkkkkkkkkk..',
    'kkkmmmmmmmmkkkk.',
    'kkkmmmkkmmmkkkkk',
    'kkkmmmkkmmmkkkkk',
    'kkkmmmmmmmmkkkkk',
    'kkkkkkkkkkkkkkkk',
    'kkwwwwwwwwwwwwkk',
    'kkwbbbbbbbbbbwkk',
    'kkwwwwwwwwwwwwkk',
    'kkwbbbbbbbwwwwkk',
    'kkwwwwwwwwwwwwkk',
    'kkwwwwwwwwwwwwkk',
    'kkkkkkkkkkkkkkkk',
  ],
  police: [
    '.......gg.......',
    '......gGGg......',
    '......gGGg......',
    'gggggggGGggggggg',
    '.gGGGGGGGGGGGGg.',
    '..gGGkGGGGkGGg..',
    '...gGGGGGGGGg...',
    '...gGkGGGGkGg...',
    '..gGGGkkkkGGGg..',
    '..gGGGGggGGGGg..',
    '.gGGGgg..ggGGGg.',
    '.gGgg......ggGg.',
    '.gg..........gg.',
  ],
  pets: [
    '....bb....bb....',
    '...bbbb..bbbb...',
    '...bbbb..bbbb...',
    '.bb.bb....bb.bb.',
    'bbbb........bbbb',
    'bbbb..bbbb..bbbb',
    '.bb.bbbbbbbb.bb.',
    '...bbbbbbbbbb...',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '...bbbb..bbbb...',
    '................',
  ],
  music: [
    '.....kkkkkkkkkk.',
    '.....kkkkkkkkkk.',
    '.....k........k.',
    '.....k........k.',
    '.....k........k.',
    '.....k........k.',
    '.....k........k.',
    '.....k........k.',
    '..kkkk.....kkkk.',
    '.kkkkk....kkkkk.',
    '.kkkkk....kkkkk.',
    '..kkk......kkk..',
    '................',
  ],
};

/** A shop's sign: a framed board, its picture centered on it. */
export function shopSign(k: Kit, sign: ShopSign): Pixels {
  const { c } = k;
  const board: Record<ShopSign, number> = {
    pizza: c('green', 0),
    floppy: c('yellow', 3),
    police: c('blue', 1),
    pets: c('green', 2),
    music: c('pink', 3),
  };
  const p = k.P(c('ink', 1));
  p.rect(1, 1, 18, 18, c('gold', 1)).rect(2, 2, 16, 16, board[sign]);
  p.draw(2, 4, ICONS[sign], {
    c: c('wood', 2),
    C: c('wood', 4),
    y: c('yellow', 3),
    r: c('red', 1),
    k: c('ink', 1),
    m: c('metal', 4),
    w: c('paint', 3),
    b: sign === 'pets' ? c('wood', 0) : c('blue', 2),
    g: c('gold', 0),
    G: c('gold', 2),
  });
  return p;
}
